import { Copy, Lock, Trash2, Unlock } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ElementStyle, StoryElement } from './types';

interface CanvasElementProps {
  element: StoryElement;
  isSelected: boolean;
  onSelect: (multiSelect?: boolean) => void;
  onUpdate: (updates: Partial<ElementStyle>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleLock?: () => void;
  snapToGrid?: boolean;
  gridSize?: number;
  playAnimation?: boolean;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
type DragAction = 'move' | 'resize' | 'rotate';

export const CanvasElement: React.FC<CanvasElementProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleLock,
  snapToGrid = false,
  gridSize = 10,
  playAnimation = false,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [activeAction, setActiveAction] = useState<DragAction | null>(null);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  // Play animation when triggered
  useEffect(() => {
    if (playAnimation && element.animation?.enter) {
      setIsAnimating(true);
      const duration = element.animation.enter.duration || 500;
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, duration + 100);
      return () => clearTimeout(timer);
    }
  }, [playAnimation, element.animation?.enter]);

  // Get animation class based on type
  const getAnimationClass = () => {
    if (!isAnimating || !element.animation?.enter) return '';
    const type = element.animation.enter.type;
    const duration = element.animation.enter.duration || 500;

    // CSS animation classes
    const animationMap: Record<string, string> = {
      fadeIn: 'animate-fadeIn',
      fadeOut: 'animate-fadeOut',
      fadeInUp: 'animate-fadeInUp',
      fadeInDown: 'animate-fadeInDown',
      slideInLeft: 'animate-slideInLeft',
      slideInRight: 'animate-slideInRight',
      slideInUp: 'animate-slideInUp',
      slideInDown: 'animate-slideInDown',
      scaleIn: 'animate-scaleIn',
      scaleOut: 'animate-scaleOut',
      bounceIn: 'animate-bounceIn',
      rotateIn: 'animate-rotateIn',
      zoomIn: 'animate-zoomIn',
      pulse: 'animate-pulse',
      bounce: 'animate-bounce',
      shake: 'animate-shake',
      float: 'animate-float',
    };

    return animationMap[type] || '';
  };

  // Get animation style
  const getAnimationStyle = (): React.CSSProperties => {
    if (!isAnimating || !element.animation?.enter) return {};
    const duration = element.animation.enter.duration || 500;
    return {
      animationDuration: `${duration}ms`,
      animationFillMode: 'both',
    };
  };

  const startPos = useRef({ x: 0, y: 0 });
  const initialStyle = useRef(element.style);

  const snapValue = useCallback(
    (value: number) => {
      if (!snapToGrid) return value;
      return Math.round(value / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  // Handle drag for moving
  const handlePointerDown = (e: React.PointerEvent) => {
    if (element.locked) return;
    e.stopPropagation();
    onSelect(e.shiftKey);

    setActiveAction('move');
    startPos.current = { x: e.clientX, y: e.clientY };
    initialStyle.current = { ...element.style };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startPos.current.x;
      const deltaY = moveEvent.clientY - startPos.current.y;

      onUpdate({
        x: snapValue(initialStyle.current.x + deltaX),
        y: snapValue(initialStyle.current.y + deltaY),
      });
    };

    const handlePointerUp = () => {
      setActiveAction(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Handle resize
  const handleResizeStart = (e: React.PointerEvent, handle: ResizeHandle) => {
    if (element.locked) return;
    e.stopPropagation();

    setActiveAction('resize');
    setActiveHandle(handle);
    startPos.current = { x: e.clientX, y: e.clientY };
    initialStyle.current = { ...element.style };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startPos.current.x;
      const deltaY = moveEvent.clientY - startPos.current.y;

      const updates: Partial<ElementStyle> = {};
      const { x, y, width, height } = initialStyle.current;

      // Calculate new dimensions based on handle
      switch (handle) {
        case 'nw':
          updates.x = snapValue(x + deltaX);
          updates.y = snapValue(y + deltaY);
          updates.width = Math.max(20, width - deltaX);
          updates.height = Math.max(20, height - deltaY);
          break;
        case 'n':
          updates.y = snapValue(y + deltaY);
          updates.height = Math.max(20, height - deltaY);
          break;
        case 'ne':
          updates.y = snapValue(y + deltaY);
          updates.width = Math.max(20, width + deltaX);
          updates.height = Math.max(20, height - deltaY);
          break;
        case 'e':
          updates.width = Math.max(20, width + deltaX);
          break;
        case 'se':
          updates.width = Math.max(20, width + deltaX);
          updates.height = Math.max(20, height + deltaY);
          break;
        case 's':
          updates.height = Math.max(20, height + deltaY);
          break;
        case 'sw':
          updates.x = snapValue(x + deltaX);
          updates.width = Math.max(20, width - deltaX);
          updates.height = Math.max(20, height + deltaY);
          break;
        case 'w':
          updates.x = snapValue(x + deltaX);
          updates.width = Math.max(20, width - deltaX);
          break;
      }

      // Maintain aspect ratio if shift is held
      if (moveEvent.shiftKey && (handle === 'nw' || handle === 'ne' || handle === 'se' || handle === 'sw')) {
        const aspectRatio = initialStyle.current.width / initialStyle.current.height;
        if (updates.width && updates.height) {
          updates.height = updates.width / aspectRatio;
        }
      }

      onUpdate(updates);
    };

    const handlePointerUp = () => {
      setActiveAction(null);
      setActiveHandle(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Handle rotation
  const handleRotateStart = (e: React.PointerEvent) => {
    if (element.locked) return;
    e.stopPropagation();

    setActiveAction('rotate');
    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    initialStyle.current = { ...element.style };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      let rotation = initialStyle.current.rotation + ((currentAngle - startAngle) * 180) / Math.PI;

      // Snap to 15 degree increments if shift is held
      if (moveEvent.shiftKey) {
        rotation = Math.round(rotation / 15) * 15;
      }

      onUpdate({ rotation });
    };

    const handlePointerUp = () => {
      setActiveAction(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Render element content
  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <div
            className="w-full h-full flex items-center justify-center p-2"
            style={{
              color: element.style.color,
              fontSize: element.style.fontSize,
              fontFamily: element.style.fontFamily,
              fontWeight: element.style.fontWeight || 'normal',
              textAlign: element.style.textAlign || 'center',
              lineHeight: element.style.lineHeight || 1.2,
              letterSpacing: element.style.letterSpacing,
              textShadow: element.style.textShadow,
            }}
          >
            {element.content}
          </div>
        );
      case 'image':
        return (
          <img
            src={element.content}
            alt="element"
            className="w-full h-full object-cover pointer-events-none"
            style={{ borderRadius: element.style.borderRadius }}
            draggable={false}
          />
        );
      case 'video':
        return (
          <video
            src={element.content}
            className="w-full h-full object-cover pointer-events-none"
            style={{ borderRadius: element.style.borderRadius }}
            muted
            loop
          />
        );
      case 'shape':
        return renderShape();
      case 'sticker':
      case 'gif':
        return (
          <img
            src={element.content}
            alt={element.type}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        );
      case 'button':
        return (
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer"
            style={{
              color: element.style.color || '#ffffff',
              fontSize: element.style.fontSize || 16,
              fontFamily: element.style.fontFamily,
              fontWeight: element.style.fontWeight || 'semibold',
              textAlign: (element.style.textAlign as React.CSSProperties['textAlign']) || 'center',
              borderRadius: element.style.borderRadius || 8,
              backgroundColor:
                element.button?.variant === 'outline' || element.button?.variant === 'ghost'
                  ? 'transparent'
                  : element.style.backgroundColor || '#3b82f6',
              border:
                element.button?.variant === 'outline'
                  ? `2px solid ${element.style.backgroundColor || '#3b82f6'}`
                  : undefined,
            }}
          >
            {element.content}
            {element.button?.href && element.button.href !== '#' && (
              <svg className="w-4 h-4 ml-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            )}
          </div>
        );
      case 'divider':
        return (
          <div className="w-full h-full flex items-center">
            <div
              className="w-full"
              style={{
                height: element.divider?.thickness || 2,
                backgroundColor: element.style.backgroundColor || '#ffffff',
                opacity: element.style.opacity || 0.3,
                borderStyle: element.divider?.style || 'solid',
                ...(element.divider?.style === 'gradient'
                  ? {
                      background: `linear-gradient(90deg, transparent, ${element.style.backgroundColor || '#ffffff'}, transparent)`,
                    }
                  : {}),
              }}
            />
          </div>
        );
      case 'quote':
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4"
            style={{
              color: element.style.color,
              fontSize: element.style.fontSize,
              fontFamily: element.style.fontFamily,
              fontStyle: 'italic',
              textAlign: (element.style.textAlign as React.CSSProperties['textAlign']) || 'center',
            }}
          >
            <span className="text-3xl opacity-50 mb-2">"</span>
            <p className="leading-relaxed">{element.content}</p>
            {element.quote?.author && <p className="mt-3 text-sm opacity-70">— {element.quote.author}</p>}
          </div>
        );
      case 'list':
        return (
          <div
            className="w-full h-full p-3"
            style={{
              color: element.style.color,
              fontSize: element.style.fontSize,
              fontFamily: element.style.fontFamily,
              textAlign: (element.style.textAlign as React.CSSProperties['textAlign']) || 'left',
            }}
          >
            {element.list?.type === 'numbered' ? (
              <ol className="list-decimal list-inside space-y-1">
                {element.list?.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            ) : element.list?.type === 'checklist' ? (
              <ul className="space-y-1">
                {element.list?.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {element.list?.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        );
      case 'avatar':
        return (
          <div className="w-full h-full flex items-center gap-3 p-2">
            <div
              className={`flex-shrink-0 flex items-center justify-center text-white font-bold ${
                element.avatar?.shape === 'square'
                  ? 'rounded-none'
                  : element.avatar?.shape === 'rounded'
                    ? 'rounded-lg'
                    : 'rounded-full'
              }`}
              style={{
                width:
                  element.avatar?.size === 'xl'
                    ? 64
                    : element.avatar?.size === 'lg'
                      ? 48
                      : element.avatar?.size === 'sm'
                        ? 32
                        : 40,
                height:
                  element.avatar?.size === 'xl'
                    ? 64
                    : element.avatar?.size === 'lg'
                      ? 48
                      : element.avatar?.size === 'sm'
                        ? 32
                        : 40,
                backgroundColor: element.style.backgroundColor || '#3b82f6',
                fontSize: element.avatar?.size === 'xl' ? 24 : element.avatar?.size === 'lg' ? 18 : 14,
              }}
            >
              {element.content ? (
                <img src={element.content} alt="avatar" className="w-full h-full object-cover rounded-inherit" />
              ) : (
                element.avatar?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="flex flex-col">
              <span
                className="font-semibold"
                style={{ color: element.style.color || '#ffffff', fontSize: element.style.fontSize || 14 }}
              >
                {element.avatar?.name || 'User Name'}
              </span>
              {element.avatar?.subtitle && (
                <span className="text-sm opacity-70" style={{ color: element.style.color || '#ffffff' }}>
                  {element.avatar.subtitle}
                </span>
              )}
            </div>
          </div>
        );
      case 'rating':
        const ratingValue = element.rating?.value || 0;
        const maxRating = element.rating?.max || 5;
        const ratingIcon = element.rating?.icon || 'star';
        return (
          <div
            className="w-full h-full flex items-center justify-center gap-1"
            style={{ fontSize: element.style.fontSize || 24 }}
          >
            {Array.from({ length: maxRating }).map((_, i) => (
              <span key={i} className={i < ratingValue ? 'opacity-100' : 'opacity-30'}>
                {ratingIcon === 'heart' ? '❤️' : ratingIcon === 'circle' ? '●' : '⭐'}
              </span>
            ))}
            {element.rating?.showValue && (
              <span className="ml-2 text-white opacity-70" style={{ fontSize: (element.style.fontSize || 24) * 0.6 }}>
                {ratingValue}/{maxRating}
              </span>
            )}
          </div>
        );
      case 'progress':
        const progressValue = element.progress?.value || 0;
        const progressMax = element.progress?.max || 100;
        const progressPercent = Math.round((progressValue / progressMax) * 100);
        return (
          <div className="w-full h-full flex flex-col justify-center p-2">
            {element.progress?.label && (
              <div className="flex justify-between mb-1" style={{ color: element.style.color || '#ffffff' }}>
                <span className="text-sm">{element.progress.label}</span>
                {element.progress?.showPercent && <span className="text-sm">{progressPercent}%</span>}
              </div>
            )}
            {element.progress?.variant === 'circle' || element.progress?.variant === 'ring' ? (
              <div className="flex justify-center">
                <svg viewBox="0 0 36 36" className="w-16 h-16">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray={`${progressPercent}, 100`}
                  />
                  <text x="18" y="20.35" className="text-xs" fill="white" textAnchor="middle">
                    {progressPercent}%
                  </text>
                </svg>
              </div>
            ) : (
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', height: 8 }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: '#3b82f6',
                  }}
                />
              </div>
            )}
          </div>
        );
      case 'timer':
        const timerDuration = element.timer?.duration || 60;
        const minutes = Math.floor(timerDuration / 60);
        const seconds = timerDuration % 60;
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center"
            style={{
              color: element.style.color || '#ffffff',
              fontSize: element.style.fontSize || 36,
              fontWeight: element.style.fontWeight || 'bold',
              fontFamily: element.style.fontFamily || 'monospace',
            }}
          >
            <div className="flex items-center gap-1">
              <span>{String(minutes).padStart(2, '0')}</span>
              <span className="animate-pulse">:</span>
              <span>{String(seconds).padStart(2, '0')}</span>
            </div>
            {element.timer?.showLabels && (
              <div className="flex gap-4 mt-1 text-xs opacity-70">
                <span>min</span>
                <span>sec</span>
              </div>
            )}
          </div>
        );
      case 'countdown':
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center"
            style={{
              color: element.style.color || '#ffffff',
              fontSize: element.style.fontSize || 28,
              fontWeight: element.style.fontWeight || 'bold',
            }}
          >
            {element.countdown?.label && <p className="text-sm opacity-70 mb-2">{element.countdown.label}</p>}
            <div className="flex gap-3">
              {['D', 'H', 'M', 'S'].map((unit, i) => (
                <div key={unit} className="flex flex-col items-center">
                  <span className="bg-white/10 rounded-lg px-3 py-2" style={{ fontSize: element.style.fontSize || 28 }}>
                    00
                  </span>
                  <span className="text-xs opacity-70 mt-1">{unit}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'location':
        return (
          <div
            className="w-full h-full flex items-center gap-2 p-2"
            style={{
              color: element.style.color || '#ffffff',
              fontSize: element.style.fontSize || 14,
            }}
          >
            <span className="text-xl">📍</span>
            <div className="flex flex-col">
              <span className="font-medium">{element.location?.name || 'Location'}</span>
              {element.location?.address && <span className="text-xs opacity-70">{element.location.address}</span>}
            </div>
          </div>
        );
      case 'mention':
        return (
          <div
            className="w-full h-full flex items-center gap-1 p-2"
            style={{
              color: element.style.color || '#3b82f6',
              fontSize: element.style.fontSize || 16,
              fontWeight: element.style.fontWeight || 'medium',
            }}
          >
            <span>@{element.mention?.username || element.content?.replace('@', '') || 'username'}</span>
            {element.mention?.verified && <span className="text-blue-400">✓</span>}
          </div>
        );
      case 'hashtag':
        return (
          <div
            className="w-full h-full flex items-center flex-wrap gap-2 p-2"
            style={{
              color: element.style.color || '#3b82f6',
              fontSize: element.style.fontSize || 16,
              fontWeight: element.style.fontWeight || 'medium',
            }}
          >
            {element.hashtag?.tags?.map((tag, i) => <span key={i}>#{tag}</span>) || <span>{element.content}</span>}
          </div>
        );
      case 'codeblock':
        return (
          <div
            className="w-full h-full p-3 font-mono text-sm overflow-auto"
            style={{
              backgroundColor: element.codeblock?.theme === 'light' ? '#f5f5f5' : '#1e1e1e',
              color: element.codeblock?.theme === 'light' ? '#333' : '#d4d4d4',
              borderRadius: element.style.borderRadius || 8,
              fontSize: element.style.fontSize || 14,
            }}
          >
            <pre className="whitespace-pre-wrap">{element.content}</pre>
          </div>
        );
      case 'qrcode':
        return (
          <div
            className="w-full h-full flex items-center justify-center p-2"
            style={{
              backgroundColor: element.qrcode?.bgColor || '#ffffff',
              borderRadius: element.style.borderRadius || 8,
            }}
          >
            <div className="text-center">
              <div
                className="grid grid-cols-5 gap-0.5 mx-auto"
                style={{ width: element.qrcode?.size || 100, height: element.qrcode?.size || 100 }}
              >
                {/* Simple QR pattern placeholder */}
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square ${[0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24].includes(i) ? '' : 'rounded-sm'}`}
                    style={{
                      backgroundColor: [0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24].includes(i)
                        ? element.qrcode?.color || '#000000'
                        : Math.random() > 0.5
                          ? element.qrcode?.color || '#000000'
                          : 'transparent',
                    }}
                  />
                ))}
              </div>
              <p className="text-xs mt-1 opacity-50" style={{ color: element.qrcode?.color || '#000' }}>
                Scan me
              </p>
            </div>
          </div>
        );
      case 'embed':
        return (
          <div
            className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg"
            style={{ borderRadius: element.style.borderRadius || 12 }}
          >
            <div className="text-center text-white">
              <div className="text-4xl mb-2">
                {element.embed?.type === 'youtube'
                  ? '▶️'
                  : element.embed?.type === 'spotify'
                    ? '🎵'
                    : element.embed?.type === 'twitter'
                      ? '🐦'
                      : element.embed?.type === 'instagram'
                        ? '📷'
                        : '🔗'}
              </div>
              <p className="text-sm opacity-70 capitalize">{element.embed?.type || 'Embed'}</p>
              {element.embed?.url && <p className="text-xs opacity-50 truncate max-w-[200px]">{element.embed.url}</p>}
            </div>
          </div>
        );
      case 'poll':
        return (
          <div
            className="w-full h-full p-3 rounded-xl"
            style={{
              backgroundColor: element.style.backgroundColor || 'rgba(255,255,255,0.1)',
              borderRadius: element.style.borderRadius || 12,
            }}
          >
            <p className="text-white font-medium mb-3" style={{ fontSize: element.style.fontSize || 16 }}>
              {element.poll?.question || 'Your question?'}
            </p>
            <div className="space-y-2">
              {element.poll?.options?.map((option, i) => (
                <div
                  key={i}
                  className="bg-white/20 rounded-lg px-3 py-2 text-white text-sm hover:bg-white/30 cursor-pointer transition-colors"
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        );
      case 'slider':
      case 'carousel':
        return (
          <div
            className="w-full h-full flex items-center justify-center bg-black/30 rounded-xl relative overflow-hidden"
            style={{ borderRadius: element.style.borderRadius || 12 }}
          >
            <div className="text-center text-white">
              <div className="text-4xl mb-2">🖼️</div>
              <p className="text-sm opacity-70">Image Slider</p>
              <p className="text-xs opacity-50">
                {element.slider?.images?.length || element.carousel?.images?.length || 0} slides
              </p>
            </div>
            {/* Navigation dots */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
              {Array.from({ length: element.slider?.images?.length || 3 }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Render shape
  const renderShape = () => {
    const { backgroundColor, borderRadius, borderWidth, borderColor } = element.style;

    switch (element.shapeType) {
      case 'circle':
        return (
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor,
              borderWidth,
              borderColor,
              borderStyle: borderWidth ? 'solid' : 'none',
            }}
          />
        );
      case 'triangle':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              backgroundColor,
            }}
          />
        );
      case 'star':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath:
                'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              backgroundColor,
            }}
          />
        );
      case 'heart':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill={backgroundColor || '#ef4444'} className="w-full h-full">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        );
      case 'arrow':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(0% 40%, 60% 40%, 60% 0%, 100% 50%, 60% 100%, 60% 60%, 0% 60%)',
              backgroundColor,
            }}
          />
        );
      case 'line':
        return (
          <div
            className="absolute top-1/2 left-0 right-0 h-1"
            style={{
              backgroundColor,
              transform: 'translateY(-50%)',
            }}
          />
        );
      // Polygons
      case 'pentagon':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
              backgroundColor,
            }}
          />
        );
      case 'hexagon':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              backgroundColor,
            }}
          />
        );
      case 'octagon':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              backgroundColor,
            }}
          />
        );
      case 'diamond':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              backgroundColor,
            }}
          />
        );
      // Advanced shapes
      case 'parallelogram':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)',
              backgroundColor,
            }}
          />
        );
      case 'trapezoid':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
              backgroundColor,
            }}
          />
        );
      case 'plus':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath:
                'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)',
              backgroundColor,
            }}
          />
        );
      case 'cross':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath:
                'polygon(20% 0%, 0% 20%, 30% 50%, 0% 80%, 20% 100%, 50% 70%, 80% 100%, 100% 80%, 70% 50%, 100% 20%, 80% 0%, 50% 30%)',
              backgroundColor,
            }}
          />
        );
      case 'chevron':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%)',
              backgroundColor,
            }}
          />
        );
      case 'badge':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)',
              backgroundColor,
            }}
          />
        );
      case 'speech-bubble':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 70%, 30% 70%, 15% 100%, 20% 70%, 0% 70%)',
              backgroundColor,
              borderRadius: borderRadius || 8,
            }}
          />
        );
      case 'thought-bubble':
        return (
          <div className="w-full h-full relative">
            <div className="w-full h-[85%] rounded-full" style={{ backgroundColor }} />
            <div className="absolute bottom-[5%] left-[15%] w-[15%] h-[15%] rounded-full" style={{ backgroundColor }} />
            <div className="absolute bottom-0 left-[5%] w-[8%] h-[8%] rounded-full" style={{ backgroundColor }} />
          </div>
        );
      case 'explosion':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath:
                'polygon(50% 0%, 63% 25%, 98% 20%, 75% 45%, 95% 70%, 63% 65%, 50% 100%, 37% 65%, 5% 70%, 25% 45%, 2% 20%, 37% 25%)',
              backgroundColor,
            }}
          />
        );
      case 'wave':
        return (
          <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
            <path
              d="M0 15 Q 12.5 0, 25 15 T 50 15 T 75 15 T 100 15 L 100 30 L 0 30 Z"
              fill={backgroundColor || '#3b82f6'}
            />
          </svg>
        );
      case 'arc':
        return (
          <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
            <path d="M 0 50 Q 50 0, 100 50 L 100 50 L 0 50 Z" fill={backgroundColor || '#3b82f6'} />
          </svg>
        );
      case 'ribbon':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath:
                'polygon(0% 30%, 15% 50%, 0% 70%, 30% 70%, 50% 100%, 70% 70%, 100% 70%, 85% 50%, 100% 30%, 70% 30%, 50% 0%, 30% 30%)',
              backgroundColor,
            }}
          />
        );
      // New shapes
      case 'squircle':
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor,
              borderRadius: '30%',
            }}
          />
        );
      case 'pill':
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor,
              borderRadius: '9999px',
            }}
          />
        );
      case 'ring':
        return (
          <div
            className="w-full h-full rounded-full"
            style={{
              border: `${borderWidth || 8}px solid ${backgroundColor}`,
              backgroundColor: 'transparent',
            }}
          />
        );
      case 'donut':
        return (
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{
              backgroundColor,
            }}
          >
            <div className="w-1/2 h-1/2 rounded-full" style={{ backgroundColor: '#0f172a' }} />
          </div>
        );
      case 'blob':
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor,
              borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
            }}
          />
        );
      case 'cloud':
        return (
          <svg viewBox="0 0 100 60" className="w-full h-full" preserveAspectRatio="none">
            <ellipse cx="25" cy="40" rx="20" ry="15" fill={backgroundColor || '#3b82f6'} />
            <ellipse cx="50" cy="35" rx="25" ry="20" fill={backgroundColor || '#3b82f6'} />
            <ellipse cx="75" cy="40" rx="20" ry="15" fill={backgroundColor || '#3b82f6'} />
            <ellipse cx="40" cy="25" rx="18" ry="15" fill={backgroundColor || '#3b82f6'} />
            <ellipse cx="60" cy="25" rx="18" ry="15" fill={backgroundColor || '#3b82f6'} />
          </svg>
        );
      case 'lightning':
        return (
          <div
            className="w-full h-full"
            style={{
              clipPath: 'polygon(50% 0%, 0% 50%, 40% 50%, 25% 100%, 100% 40%, 55% 40%, 80% 0%)',
              backgroundColor,
            }}
          />
        );
      case 'moon':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"
              fill={backgroundColor || '#fbbf24'}
            />
          </svg>
        );
      case 'sun':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <circle cx="12" cy="12" r="5" fill={backgroundColor || '#fbbf24'} />
            <line
              x1="12"
              y1="1"
              x2="12"
              y2="3"
              stroke={backgroundColor || '#fbbf24'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="12"
              y1="21"
              x2="12"
              y2="23"
              stroke={backgroundColor || '#fbbf24'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="4.22"
              y1="4.22"
              x2="5.64"
              y2="5.64"
              stroke={backgroundColor || '#fbbf24'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="18.36"
              y1="18.36"
              x2="19.78"
              y2="19.78"
              stroke={backgroundColor || '#fbbf24'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="1"
              y1="12"
              x2="3"
              y2="12"
              stroke={backgroundColor || '#fbbf24'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="21"
              y1="12"
              x2="23"
              y2="12"
              stroke={backgroundColor || '#fbbf24'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="4.22"
              y1="19.78"
              x2="5.64"
              y2="18.36"
              stroke={backgroundColor || '#fbbf24'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="18.36"
              y1="5.64"
              x2="19.78"
              y2="4.22"
              stroke={backgroundColor || '#fbbf24'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        );
      case 'check':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              d="M20 6L9 17l-5-5"
              stroke={backgroundColor || '#10b981'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        );
      case 'x-mark':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke={backgroundColor || '#ef4444'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        );
      case 'bracket':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              d="M8 3H6a2 2 0 00-2 2v14a2 2 0 002 2h2"
              stroke={backgroundColor || '#3b82f6'}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        );
      case 'cursor':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill={backgroundColor || '#3b82f6'} />
          </svg>
        );
      case 'zigzag':
        return (
          <svg viewBox="0 0 100 20" className="w-full h-full" preserveAspectRatio="none">
            <polyline
              points="0,10 12.5,0 25,10 37.5,0 50,10 62.5,0 75,10 87.5,0 100,10"
              stroke={backgroundColor || '#3b82f6'}
              strokeWidth="4"
              fill="none"
            />
          </svg>
        );
      case 'frame':
        return (
          <div
            className="w-full h-full"
            style={{
              border: `${borderWidth || 4}px solid ${backgroundColor}`,
              backgroundColor: 'transparent',
              borderRadius: borderRadius || 0,
            }}
          />
        );
      case 'corner':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              d="M3 3v6h6M21 21v-6h-6"
              stroke={backgroundColor || '#3b82f6'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        );
      default:
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor,
              borderRadius,
              borderWidth,
              borderColor,
              borderStyle: borderWidth ? 'solid' : 'none',
            }}
          />
        );
    }
  };

  // Background style with gradient support
  const getBackgroundStyle = (): React.CSSProperties => {
    // Don't apply background to shapes - they handle their own background
    if (element.type === 'shape') {
      return {};
    }
    if (element.style.gradient) {
      const { gradient } = element.style;
      const colorStops = gradient.colors.map((c) => `${c.color} ${c.position}%`).join(', ');
      if (gradient.type === 'radial') {
        return { background: `radial-gradient(circle, ${colorStops})` };
      }
      return { background: `linear-gradient(${gradient.angle || 0}deg, ${colorStops})` };
    }
    return { backgroundColor: element.style.backgroundColor };
  };

  // Don't render if element is hidden
  if (element.visible === false) {
    return null;
  }

  return (
    <>
      <div
        ref={elementRef}
        onPointerDown={handlePointerDown}
        onContextMenu={handleContextMenu}
        className={`absolute group transition-shadow ${
          element.locked ? 'cursor-not-allowed' : 'cursor-move'
        } ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-1 hover:ring-blue-400'} ${
          activeAction ? 'z-50' : ''
        } ${getAnimationClass()}`}
        style={{
          left: element.style.x,
          top: element.style.y,
          width: element.style.width,
          height: element.style.height,
          transform: `rotate(${element.style.rotation || 0}deg)`,
          zIndex: element.style.zIndex,
          opacity: element.style.opacity ?? 1,
          filter: element.style.blur ? `blur(${element.style.blur}px)` : undefined,
          boxShadow: element.style.boxShadow,
          ...getBackgroundStyle(),
          ...getAnimationStyle(),
        }}
      >
        {/* Content */}
        <div className="w-full h-full overflow-hidden select-none">{renderContent()}</div>

        {/* Lock indicator */}
        {element.locked && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-2 py-0.5 rounded text-xs flex items-center gap-1">
            <Lock size={10} /> Locked
          </div>
        )}

        {/* Selection handles */}
        {isSelected && !element.locked && (
          <>
            {/* Corner resize handles */}
            <div
              onPointerDown={(e) => handleResizeStart(e, 'nw')}
              className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize hover:bg-blue-100 transition-colors"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 'ne')}
              className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize hover:bg-blue-100 transition-colors"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 'se')}
              className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize hover:bg-blue-100 transition-colors"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 'sw')}
              className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize hover:bg-blue-100 transition-colors"
            />

            {/* Edge resize handles */}
            <div
              onPointerDown={(e) => handleResizeStart(e, 'n')}
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-white border border-blue-500 rounded cursor-n-resize hover:bg-blue-100 transition-colors"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 'e')}
              className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-white border border-blue-500 rounded cursor-e-resize hover:bg-blue-100 transition-colors"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 's')}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-white border border-blue-500 rounded cursor-s-resize hover:bg-blue-100 transition-colors"
            />
            <div
              onPointerDown={(e) => handleResizeStart(e, 'w')}
              className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-white border border-blue-500 rounded cursor-w-resize hover:bg-blue-100 transition-colors"
            />

            {/* Rotation handle */}
            <div
              onPointerDown={handleRotateStart}
              className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-green-500 border-2 border-white rounded-full cursor-grab hover:bg-green-400 transition-colors shadow-md"
              title="Rotate"
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-px h-4 bg-green-500" />
            </div>
          </>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setShowContextMenu(false)} />
          <div
            className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 min-w-[150px]"
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          >
            <button
              onClick={() => {
                onDuplicate?.();
                setShowContextMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
            >
              <Copy size={14} /> Duplicate
            </button>
            <button
              onClick={() => {
                onToggleLock?.();
                setShowContextMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
            >
              {element.locked ? <Unlock size={14} /> : <Lock size={14} />}
              {element.locked ? 'Unlock' : 'Lock'}
            </button>
            <hr className="my-1 border-slate-600" />
            <button
              onClick={() => {
                onDelete?.();
                setShowContextMenu(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </>
  );
};
