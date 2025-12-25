import { Octokit } from '@octokit/rest';
import { CheckCircle2, FolderOpen, Image, Loader2, Music, Upload, Video, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { GITHUB_CONFIG, REPO_NAME, REPO_OWNER } from '../../../config';
import { resolveMediaUrl } from '~/utils/mediaUrl';

type MediaType = 'image' | 'audio' | 'video';

interface ExistingMedia {
  name: string;
  path: string;
  url: string;
}

interface StoryMediaPickerProps {
  value: string;
  onChange: (value: string) => void;
  mediaType: MediaType;
  label?: string;
}

// Media type configurations
const MEDIA_CONFIG = {
  image: {
    path: 'src/assets/images',
    localPath: '/src/assets/images',
    assetPath: '/src/assets/images',
    accept: 'image/*',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'],
    icon: Image,
    uploadEndpoint: '/admin/upload-media',
    listEndpoint: '/admin/list-images',
    listKey: 'images',
    prefix: 'story-img',
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  audio: {
    path: 'src/assets/audio',
    localPath: '/src/assets/audio',
    assetPath: '/src/assets/audio',
    accept: 'audio/*',
    extensions: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'],
    icon: Music,
    uploadEndpoint: '/admin/upload-media',
    listEndpoint: '/admin/list-audio',
    listKey: 'audio',
    prefix: 'story-audio',
    maxSize: 20 * 1024 * 1024, // 20MB
  },
  video: {
    path: 'src/assets/videos',
    localPath: '/src/assets/videos',
    assetPath: '/src/assets/videos',
    accept: 'video/*',
    extensions: ['.mp4', '.webm', '.mov', '.avi'],
    icon: Video,
    uploadEndpoint: '/admin/upload-media',
    listEndpoint: '/admin/list-videos',
    listKey: 'videos',
    prefix: 'story-video',
    maxSize: 50 * 1024 * 1024, // 50MB
  },
};

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

function generateFileName(originalName: string, prefix: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}.${ext}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Upload media to local server (dev mode)
async function uploadMediaLocally(file: File, config: (typeof MEDIA_CONFIG)[MediaType]): Promise<string> {
  const fileName = generateFileName(file.name, config.prefix);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName);

  const res = await fetch(config.uploadEndpoint, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(data.message || 'Failed to upload media locally');
  }

  return `${config.assetPath}/${fileName}`;
}

// Upload media to GitHub (production mode)
async function uploadMediaToGitHub(file: File, config: (typeof MEDIA_CONFIG)[MediaType]): Promise<string> {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('Chưa đăng nhập GitHub. Vui lòng đăng nhập qua CMS trước.');
  }

  const octokit = new Octokit({ auth: token });
  const fileName = generateFileName(file.name, config.prefix);
  const path = `${config.path}/${fileName}`;

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
    if (!Array.isArray(data) && 'sha' in data) {
      sha = data.sha;
    }
  } catch {
    // File doesn't exist
  }

  // Upload the file
  await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path,
    message: `Upload story ${config.prefix}: ${fileName}`,
    content: base64,
    branch: GITHUB_CONFIG.branch,
    ...(sha ? { sha } : {}),
  });

  return `${config.assetPath}/${fileName}`;
}

export default function StoryMediaPicker({ value, onChange, mediaType, label }: StoryMediaPickerProps) {
  const config = MEDIA_CONFIG[mediaType];
  const MediaIcon = config.icon;
  const defaultLabel = mediaType === 'image' ? 'Hình ảnh' : mediaType === 'audio' ? 'Âm thanh' : 'Video';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [tempUrl, setTempUrl] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const isLocal = isLocalEnvironment();

  useEffect(() => {
    setTempUrl(value);
  }, [value]);

  // Cleanup audio preview on unmount
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, []);

  // Load existing media
  const loadExistingMedia = async () => {
    setIsLoadingMedia(true);
    try {
      if (isLocal) {
        const res = await fetch(config.listEndpoint);
        if (res.ok) {
          const data = await res.json();
          // Use the listKey to get the correct array from response
          setExistingMedia(data[config.listKey] || data.files || []);
        }
      } else {
        const token = getGitHubToken();
        if (!token) {
          setExistingMedia([]);
          return;
        }

        const octokit = new Octokit({ auth: token });
        try {
          const { data } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: config.path,
          });

          if (Array.isArray(data)) {
            const files = data
              .filter((file) => {
                const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
                return config.extensions.includes(ext);
              })
              .map((file) => ({
                name: file.name,
                path: `${config.assetPath}/${file.name}`,
                url: file.download_url || '',
              }));
            setExistingMedia(files);
          }
        } catch {
          setExistingMedia([]);
        }
      }
    } catch (error) {
      console.error('Failed to load media:', error);
      setExistingMedia([]);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (isModalOpen && activeTab === 'library') {
      loadExistingMedia();
    }
  }, [isModalOpen, activeTab]);

  // Get preview URL
  const getPreviewUrl = useCallback((url: string) => {
    return resolveMediaUrl(url);
  }, []);

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!config.extensions.some((e) => ext.endsWith(e.slice(1)))) {
      alert(`Vui lòng chọn file ${mediaType}!`);
      return;
    }

    if (file.size > config.maxSize) {
      alert(`File quá lớn! Vui lòng chọn file nhỏ hơn ${formatFileSize(config.maxSize)}.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress('Đang upload...');

    try {
      let mediaPath: string;
      if (isLocal) {
        mediaPath = await uploadMediaLocally(file, config);
      } else {
        mediaPath = await uploadMediaToGitHub(file, config);
      }

      setTempUrl(mediaPath);
      setUploadProgress('Upload thành công!');
      setTimeout(() => setUploadProgress(''), 2000);
    } catch (error) {
      const err = error as Error;
      alert(`Upload thất bại: ${err.message}`);
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

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
    setTempUrl('');
    onChange('');
  };

  // Render preview based on media type
  const renderPreview = (url: string, small = false) => {
    const previewUrl = getPreviewUrl(url);
    if (!previewUrl) return null;

    if (mediaType === 'image') {
      return (
        <img
          src={previewUrl}
          alt="Preview"
          className={`${small ? 'w-full h-full' : 'max-h-48'} object-contain`}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" fill="%23666">Error</text></svg>';
          }}
        />
      );
    }

    if (mediaType === 'audio') {
      return (
        <div className={`flex items-center justify-center ${small ? 'w-full h-full' : 'w-full'}`}>
          {small ? <Music className="w-8 h-8 text-blue-400" /> : <audio controls src={previewUrl} className="w-full" />}
        </div>
      );
    }

    if (mediaType === 'video') {
      return (
        <video
          src={previewUrl}
          className={`${small ? 'w-full h-full object-cover' : 'max-h-48 w-full'}`}
          controls={!small}
          muted
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-2">
      {/* Current Media Preview / Select Button */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="relative w-full h-24 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors overflow-hidden"
      >
        {value ? (
          <>
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              {renderPreview(value, true)}
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm">Nhấn để thay đổi</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <MediaIcon className="w-8 h-8 mb-1" />
            <span className="text-xs">Chọn {defaultLabel.toLowerCase()}</span>
          </div>
        )}
      </div>

      {value && (
        <button onClick={handleClear} className="w-full py-1 text-xs text-red-400 hover:text-red-300">
          Xóa {defaultLabel.toLowerCase()}
        </button>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">{label || defaultLabel}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-700 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === 'upload'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === 'library'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FolderOpen className="w-4 h-4 inline mr-2" />
                Thư viện
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  {/* Drop Zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                        <span className="text-slate-300">{uploadProgress}</span>
                      </div>
                    ) : (
                      <>
                        <MediaIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-300 mb-2">Kéo thả {defaultLabel.toLowerCase()} vào đây</p>
                        <p className="text-slate-500 text-sm mb-4">hoặc</p>
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          Chọn file
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={config.accept}
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                        </label>
                        <p className="text-slate-500 text-xs mt-3">
                          {config.extensions.join(', ').toUpperCase()} (tối đa {formatFileSize(config.maxSize)})
                        </p>
                      </>
                    )}
                  </div>

                  {/* URL Input */}
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Hoặc nhập URL</label>
                    <input
                      type="text"
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder={`https://example.com/${mediaType}.${config.extensions[0].slice(1)}`}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Preview */}
                  {tempUrl && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Preview</label>
                      <div className="relative rounded-lg overflow-hidden bg-slate-900 p-4 flex items-center justify-center">
                        {renderPreview(tempUrl)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'library' && (
                <div>
                  {isLoadingMedia ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                  ) : existingMedia.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Chưa có {defaultLabel.toLowerCase()} nào</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {existingMedia.map((media) => (
                        <button
                          key={media.path}
                          onClick={() => setTempUrl(media.path)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                            tempUrl === media.path ? 'border-blue-500' : 'border-transparent hover:border-slate-500'
                          }`}
                        >
                          <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                            {mediaType === 'image' ? (
                              <img
                                src={media.url || getPreviewUrl(media.path)}
                                alt={media.name}
                                className="w-full h-full object-cover"
                              />
                            ) : mediaType === 'audio' ? (
                              <Music className="w-12 h-12 text-slate-400" />
                            ) : (
                              <Video className="w-12 h-12 text-slate-400" />
                            )}
                          </div>
                          {tempUrl === media.path && (
                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                              <CheckCircle2 className="w-8 h-8 text-blue-400" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <p className="text-xs text-white truncate">{media.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={!tempUrl}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Chọn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export specific pickers for convenience
export function StoryImagePicker(props: Omit<StoryMediaPickerProps, 'mediaType'>) {
  return <StoryMediaPicker {...props} mediaType="image" />;
}

export function StoryAudioPicker(props: Omit<StoryMediaPickerProps, 'mediaType'>) {
  return <StoryMediaPicker {...props} mediaType="audio" />;
}

export function StoryVideoPicker(props: Omit<StoryMediaPickerProps, 'mediaType'>) {
  return <StoryMediaPicker {...props} mediaType="video" />;
}
