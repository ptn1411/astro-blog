import { Octokit } from '@octokit/rest';
import { AlertCircle, CheckCircle2, FolderOpen, Image, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { IMAGE_PATH, REPO_NAME, REPO_OWNER } from '../../../config';

// Type for existing images
interface ExistingImage {
  name: string;
  path: string;
  url: string;
}

// Types for pending uploads
export interface PendingImage {
  id: string;
  file: File;
  fileName: string;
  previewUrl: string; // blob URL for preview
  finalPath: string; // /src/assets/images/filename
}

// Global store for pending images (will be uploaded when page saves)
const pendingImagesStore: Map<string, PendingImage> = new Map();

// Export functions for Builder to use
export function getPendingImages(): PendingImage[] {
  return Array.from(pendingImagesStore.values());
}

export function clearPendingImages(): void {
  // Revoke blob URLs to free memory
  pendingImagesStore.forEach((img) => URL.revokeObjectURL(img.previewUrl));
  pendingImagesStore.clear();
}

export function removePendingImage(id: string): void {
  const img = pendingImagesStore.get(id);
  if (img) {
    URL.revokeObjectURL(img.previewUrl);
    pendingImagesStore.delete(id);
  }
}

interface ImagePickerProps {
  value: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
  label?: string;
}

function getGitHubToken(): string | null {
  try {
    const storedUser = localStorage.getItem('sveltia-cms.user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return user.token || null;
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

function isLocalEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  );
}

function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'png';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${ext}`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Upload image to local server (dev mode)
async function uploadImageLocally(file: File): Promise<string> {
  const fileName = generateFileName(file.name);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName);

  const res = await fetch('/admin/upload-image', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(data.message || 'Failed to upload image locally');
  }

  return `/src/assets/images/${fileName}`;
}

// Upload image to GitHub (production mode) - used by Builder when saving
export async function uploadImageToGitHub(file: File, fileName: string): Promise<void> {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('Chưa đăng nhập GitHub. Vui lòng đăng nhập qua CMS trước.');
  }

  const octokit = new Octokit({ auth: token });
  const path = `${IMAGE_PATH}/${fileName}`;

  // Convert file to base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

  // Check if file exists
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path,
    });
    if (!Array.isArray(data)) {
      sha = data.sha;
    }
  } catch {
    // File doesn't exist, which is expected
  }

  // Upload to GitHub
  await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path,
    message: `Upload image: ${fileName}`,
    content: base64,
    sha,
  });
}

// Upload all pending images to GitHub
export async function uploadAllPendingImages(
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<void> {
  const pending = getPendingImages();
  if (pending.length === 0) return;

  for (let i = 0; i < pending.length; i++) {
    const img = pending[i];
    onProgress?.(i + 1, pending.length, img.fileName);
    await uploadImageToGitHub(img.file, img.fileName);
  }

  clearPendingImages();
}

export function ImagePicker({ value, onChange, isDarkMode, label }: ImagePickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState(value || '');
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [pendingImageId, setPendingImageId] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLocal = isLocalEnvironment();

  // Load existing images when modal opens
  useEffect(() => {
    if (isModalOpen) {
      loadExistingImages();
    }
  }, [isModalOpen]);

  // Load images from local (dev) or GitHub (production)
  const loadExistingImages = async () => {
    setIsLoadingImages(true);
    try {
      if (isLocal) {
        // Dev mode: load from local API
        const res = await fetch('/admin/list-images');
        if (res.ok) {
          const data = await res.json();
          setExistingImages(data.images || []);
        }
      } else {
        // Production mode: load from GitHub
        const token = getGitHubToken();
        if (!token) {
          setExistingImages([]);
          return;
        }

        const octokit = new Octokit({ auth: token });
        try {
          const { data } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: IMAGE_PATH,
          });

          if (Array.isArray(data)) {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
            const images = data
              .filter((file) => {
                const ext = file.name.split('.').pop()?.toLowerCase();
                return ext && imageExtensions.includes(`.${ext}`);
              })
              .map((file) => ({
                name: file.name,
                path: `/src/assets/images/${file.name}`,
                url: file.download_url || '',
              }));
            setExistingImages(images);
          }
        } catch {
          setExistingImages([]);
        }
      }
    } catch (error) {
      console.error('Failed to load images:', error);
      setExistingImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  };

  // Get preview URL for display
  const getPreviewUrl = useCallback(
    (url: string) => {
      if (!url) return '';

      // Check if this is a pending image - look up by finalPath
      const pending = Array.from(pendingImagesStore.values()).find((p) => p.finalPath === url);
      if (pending) {
        return pending.previewUrl;
      }

      // Check if this is a local path
      if (url.startsWith('~/')) {
        return url.replace('~/', '/src/');
      }

      return url;
    },
    [isLocal]
  );

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh!');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File quá lớn! Vui lòng chọn file nhỏ hơn 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      if (isLocal) {
        // Local mode: upload immediately to local filesystem
        setUploadProgress('Đang lưu vào local...');
        const imagePath = await uploadImageLocally(file);
        setTempUrl(imagePath);
        setUploadProgress('Lưu thành công!');
      } else {
        // Production mode: create preview, queue for later upload
        setUploadProgress('Đang tạo preview...');
        const fileName = generateFileName(file.name);
        const previewUrl = URL.createObjectURL(file);
        const finalPath = `/src/assets/images/${fileName}`;
        const id = generateId();

        // Store pending image
        pendingImagesStore.set(id, {
          id,
          file,
          fileName,
          previewUrl,
          finalPath,
        });

        setPendingImageId(id);
        setTempUrl(finalPath);
        setUploadProgress('Sẵn sàng! Hình sẽ được upload khi Save page.');
      }

      setTimeout(() => setUploadProgress(''), 3000);
    } catch (error) {
      const err = error as Error;
      alert(`Upload thất bại: ${err.message}`);
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [isLocal]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    onChange(tempUrl);
    setIsModalOpen(false);
  };

  const handleClear = () => {
    // Remove pending image if exists
    if (pendingImageId) {
      removePendingImage(pendingImageId);
      setPendingImageId(null);
    }
    onChange('');
    setTempUrl('');
  };

  // Check if current value has a pending upload
  const hasPendingUpload =
    !isLocal && value && Array.from(pendingImagesStore.values()).some((p) => p.finalPath === value);

  const inputClass = `w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  return (
    <div className="space-y-2">
      {/* Preview + Input */}
      <div className="flex gap-2">
        <div
          className={`relative w-16 h-16 rounded border flex items-center justify-center overflow-hidden flex-shrink-0 ${
            isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'
          }`}
        >
          {value && !imageError ? (
            <>
              <img
                src={getPreviewUrl(value)}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
              {hasPendingUpload && (
                <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
                  <AlertCircle size={16} className="text-yellow-500" />
                </div>
              )}
            </>
          ) : (
            <Image size={24} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <input
            type="text"
            className={inputClass}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setImageError(false);
            }}
            placeholder="Image URL..."
          />
          <div className="flex gap-1 items-center">
            <button
              onClick={() => {
                setTempUrl(value);
                setIsModalOpen(true);
              }}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                isDarkMode
                  ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Browse
            </button>
            {value && (
              <button
                onClick={handleClear}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  isDarkMode
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                    : 'bg-red-100 hover:bg-red-200 text-red-600'
                }`}
              >
                Clear
              </button>
            )}
            {hasPendingUpload && (
              <span className="text-xs text-yellow-500 flex items-center gap-1">
                <AlertCircle size={12} /> Chờ upload
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`w-full max-w-4xl rounded-lg shadow-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {label || 'Chọn hình ảnh'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-1 rounded transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Environment indicator */}
            <div
              className={`mb-4 p-2 rounded text-xs flex items-center gap-2 ${
                isLocal
                  ? isDarkMode
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-green-100 text-green-700'
                  : isDarkMode
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {isLocal ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>
                    <strong>Local Mode:</strong> Hình sẽ được lưu ngay vào thư mục local
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} />
                  <span>
                    <strong>Production Mode:</strong> Hình sẽ được upload lên GitHub khi bạn nhấn Save page
                  </span>
                </>
              )}
            </div>

            {/* Two column layout */}
            <div className="flex gap-6">
              {/* Left column - Upload */}
              <div className="flex-1 space-y-4">
                {/* Upload Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-500/10'
                      : isDarkMode
                        ? 'border-gray-600 hover:border-gray-500'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={32} className="animate-spin text-blue-500" />
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{uploadProgress}</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className={`mx-auto mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Kéo thả hình vào đây hoặc
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        Chọn file
                      </button>
                      <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Hỗ trợ: JPG, PNG, GIF, WebP (tối đa 5MB)
                      </p>
                      {uploadProgress && (
                        <p className={`text-xs mt-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {uploadProgress}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* OR Divider */}
                <div className="flex items-center gap-3">
                  <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>HOẶC</span>
                  <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                </div>

                {/* URL Input */}
                <input
                  type="text"
                  className={inputClass}
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="Dán URL hình ảnh..."
                />

                {/* Large Preview */}
                <div
                  className={`w-full h-40 rounded border flex items-center justify-center overflow-hidden ${
                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  {tempUrl ? (
                    <img
                      src={getPreviewUrl(tempUrl)}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                      onError={() => setImageError(true)}
                      onLoad={() => setImageError(false)}
                    />
                  ) : (
                    <div className={`text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Image size={48} className="mx-auto mb-2" />
                      <p className="text-sm">Chưa chọn hình</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right column - Existing Images */}
              <div className={`w-72 flex-shrink-0 rounded-lg p-4 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p
                  className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  <FolderOpen size={16} />
                  Hình có sẵn trong thư mục
                </p>
                {isLoadingImages ? (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Đang tải...</span>
                  </div>
                ) : existingImages.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto pr-1">
                    <div className="grid grid-cols-3 gap-2">
                      {existingImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setTempUrl(img.path)}
                          title={img.name}
                          className={`aspect-square rounded border overflow-hidden transition-all ${
                            tempUrl === img.path
                              ? 'ring-2 ring-blue-500 scale-105'
                              : isDarkMode
                                ? 'border-gray-600 hover:border-gray-500 hover:scale-105'
                                : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                          }`}
                        >
                          <img
                            src={isLocal ? img.path : img.url}
                            alt={img.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm py-8 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Chưa có hình nào
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 text-sm rounded transition-colors ${
                  isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isUploading}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Chọn hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
