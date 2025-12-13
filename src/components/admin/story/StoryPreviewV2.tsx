import { Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Story, StoryElement, TransitionType } from './types';

interface StoryPreviewProps {
  story: Story;
  onClose: () => void;
  startSlideIndex?: number;
}

// CSS keyframes for animations
const animationKeyframes = `
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes slideInDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
@keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
@keyframes bounceIn { 
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  70% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
@keyframes rotateIn { from { transform: rotate(-180deg) scale(0); } to { transform: rotate(0) scale(1); } }
@keyframes pulse { 
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
@keyframes shake { 
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
@keyframes float { 
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes typewriter {
  from { width: 0; overflow: hidden; white-space: nowrap; }
  to { width: 100%; }
}

/* Slide transitions */
@keyframes slideTransitionOut { to { transform: translateX(-100%); } }
@keyframes slideTransitionIn { from { transform: translateX(100%); } }
@keyframes zoomTransitionOut { to { transform: scale(1.5); opacity: 0; } }
@keyframes zoomTransitionIn { from { transform: scale(0.5); opacity: 0; } }
@keyframes flipTransition { 
  0% { transform: perspective(1000px) rotateY(0deg); }
  100% { transform: perspective(1000px) rotateY(-90deg); }
}
@keyframes cubeTransitionOut { 
  to { transform: perspective(1000px) rotateY(-90deg) translateZ(180px); }
}
@keyframes cubeTransitionIn { 
  from { transform: perspective(1000px) rotateY(90deg) translateZ(180px); }
}
@keyframes dissolveTransition {
  0% { filter: blur(0) opacity(1); }
  100% { filter: blur(20px) opacity(0); }
}
@keyframes wipeTransition {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0 0 0); }
}
`;

const PreviewElement = ({ element, isAnimating }: { element: StoryElement; isAnimating: boolean }) => {
  const getAnimationStyle = (): React.CSSProperties => {
    if (!isAnimating || !element.animation?.enter) return {};

    const { type, duration, delay, easing } = element.animation.enter;
    if (type === 'none') return {};

    const animationName = {
      fadeIn: 'fadeIn',
      fadeOut: 'fadeOut',
      slideInLeft: 'slideInLeft',
      slideInRight: 'slideInRight',
      slideInUp: 'slideInUp',
      slideInDown: 'slideInDown',
      scaleIn: 'scaleIn',
      scaleOut: 'scaleIn',
      bounceIn: 'bounceIn',
      rotateIn: 'rotateIn',
      typewriter: 'typewriter',
      pulse: 'pulse',
      shake: 'shake',
      float: 'float',
    }[type];

    return {
      animation: `${animationName} ${duration}ms ${easing} ${delay}ms both`,
    };
  };

  const getLoopAnimationStyle = (): React.CSSProperties => {
    if (!element.animation?.loop || element.animation.loop.type === 'none') return {};

    const { type, duration } = element.animation.loop;
    return {
      animation: `${type} ${duration}ms ease-in-out infinite`,
    };
  };

  const getBackgroundStyle = () => {
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

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: element.style.x,
        top: element.style.y,
        width: element.style.width,
        height: element.style.height,
        transform: `rotate(${element.style.rotation || 0}deg)`,
        zIndex: element.style.zIndex,
        opacity: element.style.opacity ?? 1,
        borderRadius: element.style.borderRadius,
        boxShadow: element.style.boxShadow,
        filter: element.style.blur ? `blur(${element.style.blur}px)` : undefined,
        ...getBackgroundStyle(),
        ...getAnimationStyle(),
        ...getLoopAnimationStyle(),
      }}
    >
      {element.type === 'text' && (
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
      )}
      {element.type === 'image' && (
        <img
          src={element.content}
          alt="element"
          className="w-full h-full object-cover"
          style={{ borderRadius: element.style.borderRadius }}
        />
      )}
      {element.type === 'video' && (
        <video
          src={element.content}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          style={{ borderRadius: element.style.borderRadius }}
        />
      )}
      {(element.type === 'sticker' || element.type === 'gif') && (
        <img src={element.content} alt={element.type} className="w-full h-full object-contain" />
      )}
      {element.type === 'button' && (
        <a
          href={element.button?.href || '#'}
          target={element.button?.target || '_self'}
          rel={element.button?.target === '_blank' ? 'noopener noreferrer' : undefined}
          onClick={(e) => {
            e.stopPropagation();
            if (!element.button?.href || element.button.href === '#') {
              e.preventDefault();
            }
          }}
          className="w-full h-full flex items-center justify-center cursor-pointer transition-all hover:opacity-90 hover:scale-[1.02]"
          style={{
            color: element.style.color || '#ffffff',
            fontSize: element.style.fontSize || 16,
            fontFamily: element.style.fontFamily,
            fontWeight: element.style.fontWeight || 'semibold',
            textAlign: (element.style.textAlign as React.CSSProperties['textAlign']) || 'center',
            borderRadius: element.style.borderRadius || 8,
            backgroundColor: element.style.backgroundColor || '#3b82f6',
            border: element.button?.variant === 'outline' ? '2px solid currentColor' : undefined,
          }}
        >
          {element.content}
        </a>
      )}
    </div>
  );
};

// Slide transition wrapper
const SlideTransition = ({
  children,
  type,
  duration,
  isEntering,
  isExiting,
}: {
  children: React.ReactNode;
  type: TransitionType;
  duration: number;
  isEntering: boolean;
  isExiting: boolean;
}) => {
  const getTransitionStyle = (): React.CSSProperties => {
    if (type === 'none') return {};

    const transitionMap: Record<TransitionType, { in: string; out: string }> = {
      none: { in: '', out: '' },
      fade: { in: 'fadeIn', out: 'fadeOut' },
      slide: { in: 'slideTransitionIn', out: 'slideTransitionOut' },
      zoom: { in: 'zoomTransitionIn', out: 'zoomTransitionOut' },
      flip: { in: 'flipTransition', out: 'flipTransition' },
      cube: { in: 'cubeTransitionIn', out: 'cubeTransitionOut' },
      dissolve: { in: 'fadeIn', out: 'dissolveTransition' },
      wipe: { in: 'wipeTransition', out: 'fadeOut' },
    };

    if (isExiting) {
      return { animation: `${transitionMap[type].out} ${duration}ms ease-in-out forwards` };
    }
    if (isEntering) {
      return { animation: `${transitionMap[type].in} ${duration}ms ease-in-out` };
    }
    return {};
  };

  return (
    <div className="absolute inset-0" style={getTransitionStyle()}>
      {children}
    </div>
  );
};

export const StoryPreviewV2: React.FC<StoryPreviewProps> = ({ story, onClose, startSlideIndex = 0 }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(startSlideIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'in' | 'out'>('in');
  const [showControls, setShowControls] = useState(true);

  const currentSlide = story.slides[currentSlideIndex];
  const nextSlide = story.slides[currentSlideIndex + 1];
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const slideAudioRef = useRef<HTMLAudioElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isPaused) setShowControls(false);
    }, 3000);
  }, [isPaused]);

  // Handle transition to next slide
  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex >= story.slides.length - 1) {
      onClose();
      return;
    }

    const transitionDuration = currentSlide.transition?.duration || 500;
    setIsTransitioning(true);
    setTransitionDirection('out');

    setTimeout(() => {
      setCurrentSlideIndex((prev) => prev + 1);
      setProgress(0);
      setTransitionDirection('in');

      setTimeout(() => {
        setIsTransitioning(false);
      }, transitionDuration);
    }, transitionDuration);
  }, [currentSlideIndex, currentSlide.transition?.duration, story.slides.length, onClose]);

  // Handle transition to previous slide
  const goToPrevSlide = useCallback(() => {
    if (currentSlideIndex <= 0) {
      setProgress(0);
      return;
    }

    const transitionDuration = currentSlide.transition?.duration || 500;
    setIsTransitioning(true);
    setTransitionDirection('out');

    setTimeout(() => {
      setCurrentSlideIndex((prev) => prev - 1);
      setProgress(0);
      setTransitionDirection('in');

      setTimeout(() => {
        setIsTransitioning(false);
      }, transitionDuration);
    }, transitionDuration);
  }, [currentSlideIndex, currentSlide.transition?.duration]);

  // Auto-advance logic
  useEffect(() => {
    if (isPaused || isTransitioning) return;

    const startTime = Date.now();
    let animationFrameId: number;
    const durationMs = currentSlide.duration * 1000;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / durationMs) * 100, 100);
      setProgress(newProgress);

      if (elapsed < durationMs) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        goToNextSlide();
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrameId);
  }, [currentSlideIndex, currentSlide.duration, isPaused, isTransitioning, goToNextSlide]);

  // Handle background audio (plays throughout entire story)
  useEffect(() => {
    if (story.audio?.src && !bgAudioRef.current) {
      bgAudioRef.current = new Audio(story.audio.src);
      bgAudioRef.current.loop = true;
      bgAudioRef.current.volume = story.audio.volume ?? 0.5;
    }

    if (bgAudioRef.current) {
      // Mute background audio if slide has its own audio
      const hasSlideAudio = currentSlide.audio?.src;
      if (isMuted || isPaused || hasSlideAudio) {
        bgAudioRef.current.pause();
      } else {
        bgAudioRef.current.play().catch(console.log);
      }
    }

    return () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current = null;
      }
    };
  }, [story.audio, isMuted, isPaused, currentSlide.audio?.src]);

  // Handle slide-specific audio
  useEffect(() => {
    // Clean up previous slide audio
    if (slideAudioRef.current) {
      slideAudioRef.current.pause();
      slideAudioRef.current = null;
    }

    // Play slide audio if exists
    if (currentSlide.audio?.src) {
      slideAudioRef.current = new Audio(currentSlide.audio.src);
      slideAudioRef.current.volume = currentSlide.audio.volume ?? 0.8;
      if (currentSlide.audio.startTime) {
        slideAudioRef.current.currentTime = currentSlide.audio.startTime;
      }

      if (!isMuted && !isPaused) {
        slideAudioRef.current.play().catch(console.log);
      }
    }

    return () => {
      if (slideAudioRef.current) {
        slideAudioRef.current.pause();
        slideAudioRef.current = null;
      }
    };
  }, [currentSlideIndex, currentSlide.audio, isMuted, isPaused]);

  // Handle mute/pause for slide audio
  useEffect(() => {
    if (slideAudioRef.current) {
      if (isMuted || isPaused) {
        slideAudioRef.current.pause();
      } else if (currentSlide.audio?.src) {
        slideAudioRef.current.play().catch(console.log);
      }
    }
  }, [isMuted, isPaused, currentSlide.audio?.src]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          goToNextSlide();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevSlide();
          break;
        case 'Escape':
          onClose();
          break;
        case 'p':
          setIsPaused((p) => !p);
          break;
        case 'm':
          setIsMuted((m) => !m);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextSlide, goToPrevSlide, onClose]);

  // Get background style
  const getBackgroundStyle = () => {
    if (currentSlide.background.type === 'gradient' && currentSlide.background.gradient) {
      const { gradient } = currentSlide.background;
      const colorStops = gradient.colors.map((c) => `${c.color} ${c.position}%`).join(', ');
      if (gradient.type === 'radial') {
        return { background: `radial-gradient(circle, ${colorStops})` };
      }
      return { background: `linear-gradient(${gradient.angle || 0}deg, ${colorStops})` };
    }
    if (currentSlide.background.type === 'color') {
      return { backgroundColor: currentSlide.background.value };
    }
    return {};
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onMouseMove={resetControlsTimeout}>
      {/* Inject animations */}
      <style>{animationKeyframes}</style>

      {/* Left click zone - outside container */}
      <div className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer z-10" onClick={goToPrevSlide} />

      {/* Right click zone - outside container */}
      <div className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer z-10" onClick={goToNextSlide} />

      {/* Container - full height with 9:16 aspect ratio */}
      <div className="relative h-full max-h-screen aspect-[9/16] bg-black overflow-hidden shadow-2xl rounded-2xl z-20">
        {/* Progress Bars */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-30">
          {story.slides.map((slide, idx) => (
            <div key={slide.id} className="h-0.5 bg-white/30 flex-1 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: idx < currentSlideIndex ? '100%' : idx === currentSlideIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header Controls */}
        <div
          className={`absolute top-6 left-2 right-2 z-30 flex items-center justify-between transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
              {currentSlideIndex + 1} / {story.slides.length}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full transition-colors"
            >
              {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} />}
            </button>
            {story.audio && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full transition-colors"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tap Navigation Zones */}
        <div className="absolute inset-0 z-20 flex">
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevSlide();
            }}
          />
          <div className="w-1/3 h-full" onClick={() => setIsPaused(!isPaused)} />
          <div
            className="w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              goToNextSlide();
            }}
          />
        </div>

        {/* Slide Content with Transition */}
        <SlideTransition
          type={currentSlide.transition?.type || 'fade'}
          duration={currentSlide.transition?.duration || 500}
          isEntering={isTransitioning && transitionDirection === 'in'}
          isExiting={isTransitioning && transitionDirection === 'out'}
        >
          <div className="absolute inset-0 w-full h-full" style={getBackgroundStyle()}>
            {/* Background media */}
            {currentSlide.background.type === 'image' && (
              <img
                src={currentSlide.background.value}
                className="absolute inset-0 w-full h-full object-cover"
                alt="slide-bg"
                style={{
                  filter: currentSlide.background.filter
                    ? `blur(${currentSlide.background.filter.blur || 0}px) brightness(${currentSlide.background.filter.brightness || 100}%) contrast(${currentSlide.background.filter.contrast || 100}%)`
                    : undefined,
                }}
              />
            )}
            {currentSlide.background.type === 'video' && (
              <video
                src={currentSlide.background.value}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
              />
            )}

            {/* Elements */}
            {currentSlide.elements.map((el) => (
              <PreviewElement key={el.id} element={el} isAnimating={!isTransitioning} />
            ))}
          </div>
        </SlideTransition>

        {/* Paused overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center">
            <div className="text-white text-lg font-medium">Paused</div>
          </div>
        )}
      </div>

      {/* Keyboard hints */}
      <div
        className={`absolute bottom-4 right-4 flex items-center gap-4 text-xs text-white/50 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span>← → Navigate</span>
        <span>Space: Next</span>
        <span>P: Pause</span>
        <span>M: Mute</span>
        <span>Esc: Close</span>
      </div>
    </div>
  );
};
