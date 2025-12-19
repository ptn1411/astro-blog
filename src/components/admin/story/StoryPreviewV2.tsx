import { Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  animateTextByLetters,
  gsap,
  playAnimeAnimation,
  playAnimeLoopAnimation,
  playGSAPAnimation,
  playLoopAnimation,
  playSpringLoopAnimation,
  stopAnimations,
} from './animations';
import type { Story, StoryElement, TransitionType } from './types';

interface StoryPreviewProps {
  story: Story;
  onClose: () => void;
  startSlideIndex?: number;
  pollSubmitUrl?: string;
}

const PREVIEW_BASE_WIDTH = 360;
const PREVIEW_BASE_HEIGHT = 640;

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

// Shape Renderer for preview
const ShapeRenderer = ({ element }: { element: StoryElement }) => {
  const shapeType = element.shapeType || 'rectangle';
  const fillColor = element.style.backgroundColor || '#3b82f6';
  const borderColor = element.style.borderColor || fillColor;
  const borderWidth = element.style.borderWidth || 0;

  switch (shapeType) {
    case 'rectangle':
      return (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: fillColor,
            border: borderWidth ? `${borderWidth}px solid ${borderColor}` : undefined,
            borderRadius: element.style.borderRadius,
          }}
        />
      );
    case 'circle':
      return (
        <div
          className="w-full h-full rounded-full"
          style={{
            backgroundColor: fillColor,
            border: borderWidth ? `${borderWidth}px solid ${borderColor}` : undefined,
          }}
        />
      );
    case 'triangle':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,10 90,90 10,90" fill={fillColor} stroke={borderColor} strokeWidth={borderWidth} />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d="M50,88 C20,65 5,50 5,30 C5,15 15,5 30,5 C40,5 45,10 50,20 C55,10 60,5 70,5 C85,5 95,15 95,30 C95,50 80,65 50,88 Z"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      );
    case 'hexagon':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,5 93,25 93,75 50,95 7,75 7,25"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      );
    case 'pentagon':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,5 97,38 80,95 20,95 3,38"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,5 95,50 50,95 5,50" fill={fillColor} stroke={borderColor} strokeWidth={borderWidth} />
        </svg>
      );
    case 'arrow':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="0,40 60,40 60,20 100,50 60,80 60,60 0,60"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      );
    case 'line':
      return (
        <svg viewBox="0 0 100 10" className="w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="5" x2="100" y2="5" stroke={fillColor} strokeWidth={borderWidth || 2} />
        </svg>
      );
    case 'cross':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="35,0 65,0 65,35 100,35 100,65 65,65 65,100 35,100 35,65 0,65 0,35 35,35"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      );
    case 'octagon':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      );
    case 'squircle':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect
            x="5"
            y="5"
            width="90"
            height="90"
            rx="25"
            ry="25"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      );
    case 'pill':
      return (
        <div
          className="w-full h-full rounded-full"
          style={{
            backgroundColor: fillColor,
            border: borderWidth ? `${borderWidth}px solid ${borderColor}` : undefined,
          }}
        />
      );
    case 'ring':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="none" stroke={fillColor} strokeWidth="8" />
        </svg>
      );
    case 'donut':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="none" stroke={fillColor} strokeWidth="20" />
        </svg>
      );
    case 'blob':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d="M50,10 C70,10 85,25 90,45 C95,65 85,85 65,90 C45,95 25,85 15,65 C5,45 15,25 35,15 C45,10 50,10 50,10 Z"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      );
    case 'cloud':
      return (
        <svg viewBox="0 0 100 60" className="w-full h-full">
          <path
            d="M25,50 C10,50 5,40 10,30 C5,20 15,10 30,15 C35,5 55,5 60,15 C75,10 90,20 85,35 C95,40 90,55 75,50 Z"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      );
    case 'lightning':
      return (
        <svg viewBox="0 0 60 100" className="w-full h-full">
          <polygon
            points="35,0 15,45 30,45 20,100 50,40 35,40 50,0"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      );
    case 'moon':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d="M50,5 A45,45 0 1,0 50,95 A35,35 0 1,1 50,5"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={borderWidth}
          />
        </svg>
      );
    case 'sun':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="20" fill={fillColor} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="50"
              y1="50"
              x2={50 + 35 * Math.cos((angle * Math.PI) / 180)}
              y2={50 + 35 * Math.sin((angle * Math.PI) / 180)}
              stroke={fillColor}
              strokeWidth="4"
              strokeLinecap="round"
            />
          ))}
        </svg>
      );
    case 'check':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polyline
            points="20,55 40,75 80,25"
            fill="none"
            stroke={fillColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'x-mark':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <line x1="25" y1="25" x2="75" y2="75" stroke={fillColor} strokeWidth="10" strokeLinecap="round" />
          <line x1="75" y1="25" x2="25" y2="75" stroke={fillColor} strokeWidth="10" strokeLinecap="round" />
        </svg>
      );
    case 'bracket':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d="M30,10 L20,10 L20,90 L30,90 M70,10 L80,10 L80,90 L70,90"
            fill="none"
            stroke={fillColor}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'cursor':
      return (
        <svg viewBox="0 0 60 100" className="w-full h-full">
          <polygon
            points="10,5 10,85 25,70 40,95 50,90 35,65 55,65"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={borderWidth || 2}
          />
        </svg>
      );
    case 'zigzag':
      return (
        <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
          <polyline
            points="0,35 15,5 30,35 45,5 60,35 75,5 90,35 100,15"
            fill="none"
            stroke={fillColor}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'frame':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="5" y="5" width="90" height="90" fill="none" stroke={fillColor} strokeWidth="6" />
          <rect x="15" y="15" width="70" height="70" fill="none" stroke={fillColor} strokeWidth="2" />
        </svg>
      );
    case 'corner':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d="M10,10 L40,10 M10,10 L10,40 M90,10 L60,10 M90,10 L90,40 M10,90 L40,90 M10,90 L10,60 M90,90 L60,90 M90,90 L90,60"
            fill="none"
            stroke={fillColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'spiral':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d="M50,50 C50,40 60,35 65,45 C70,55 60,65 50,60 C35,55 35,40 50,35 C70,30 75,55 65,70 C50,85 25,75 25,50 C25,20 55,10 80,25"
            fill="none"
            stroke={fillColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <div
          className="w-full h-full"
          style={{ backgroundColor: fillColor, borderRadius: element.style.borderRadius }}
        />
      );
  }
};

const PreviewElement = ({
  element,
  isAnimating,
  storyId,
  slideId,
  pollSubmitUrl,
}: {
  element: StoryElement;
  isAnimating: boolean;
  storyId: string;
  slideId: string;
  pollSubmitUrl?: string;
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);
  const [pollSelectedIndex, setPollSelectedIndex] = useState<number | null>(null);
  const [pollIsSubmitting, setPollIsSubmitting] = useState(false);
  const [pollSubmitState, setPollSubmitState] = useState<'idle' | 'success' | 'error'>('idle');
  const [sliderCurrentIndex, setSliderCurrentIndex] = useState(0);
  const [sliderDisplayedIndex, setSliderDisplayedIndex] = useState(0);
  const [sliderTransition, setSliderTransition] = useState<{ from: number; to: number; active: boolean }>(() => ({
    from: 0,
    to: 0,
    active: false,
  }));
  const [sliderTransitionStarted, setSliderTransitionStarted] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number>(element.timer?.duration || 60);
  const [countdownRemainingMs, setCountdownRemainingMs] = useState<number>(() => {
    const targetDate = element.countdown?.targetDate;
    const targetMs = targetDate ? new Date(targetDate).getTime() : NaN;
    if (!Number.isFinite(targetMs)) return 0;
    return Math.max(0, targetMs - Date.now());
  });

  const pollResolvedSubmitUrl = element.poll?.submitUrl || pollSubmitUrl;
  const pollHasSubmit = Boolean(pollResolvedSubmitUrl);

  useEffect(() => {
    setPollSelectedIndex(null);
    setPollIsSubmitting(false);
    setPollSubmitState('idle');
    setSliderCurrentIndex(0);
    setSliderDisplayedIndex(0);
    setSliderTransition({ from: 0, to: 0, active: false });
    setSliderTransitionStarted(false);
    setTimerRemaining(element.timer?.duration || 60);
    const targetDate = element.countdown?.targetDate;
    const targetMs = targetDate ? new Date(targetDate).getTime() : NaN;
    setCountdownRemainingMs(Number.isFinite(targetMs) ? Math.max(0, targetMs - Date.now()) : 0);
  }, [element.id]);

  useEffect(() => {
    if (element.type !== 'slider' && element.type !== 'carousel') return;
    if (sliderCurrentIndex === sliderDisplayedIndex) return;

    setSliderTransition({ from: sliderDisplayedIndex, to: sliderCurrentIndex, active: true });
    setSliderTransitionStarted(false);

    const raf = requestAnimationFrame(() => setSliderTransitionStarted(true));
    const timer = setTimeout(() => {
      setSliderDisplayedIndex(sliderCurrentIndex);
      setSliderTransition((prev) => ({ ...prev, active: false }));
      setSliderTransitionStarted(false);
    }, 300);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [element.type, sliderCurrentIndex, sliderDisplayedIndex]);

  useEffect(() => {
    if (element.type !== 'slider' && element.type !== 'carousel') return;

    const count =
      element.type === 'slider' ? element.slider?.images?.length || 0 : element.carousel?.images?.length || 0;
    if (count <= 1) return;

    const intervalMs = element.type === 'carousel' ? element.carousel?.interval || 3000 : 3000;
    const id = setInterval(() => {
      setSliderCurrentIndex((prev) => (prev + 1) % count);
    }, intervalMs);

    return () => clearInterval(id);
  }, [
    element.id,
    element.type,
    element.slider?.images?.length,
    element.carousel?.images?.length,
    element.carousel?.interval,
  ]);

  useEffect(() => {
    if (element.type !== 'timer') return;

    const id = setInterval(() => {
      setTimerRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [element.type]);

  useEffect(() => {
    if (element.type !== 'countdown') return;
    const targetDate = element.countdown?.targetDate;
    const targetMs = targetDate ? new Date(targetDate).getTime() : NaN;
    if (!Number.isFinite(targetMs)) {
      setCountdownRemainingMs(0);
      return;
    }

    const update = () => {
      setCountdownRemainingMs(Math.max(0, targetMs - Date.now()));
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [element.type, element.countdown?.targetDate]);

  // Use GSAP/Anime.js for advanced animations
  useEffect(() => {
    if (!elementRef.current || !isAnimating || hasAnimatedRef.current) return;

    const anim = element.animation?.enter;
    if (!anim || anim.type === 'none') return;

    // Check if using advanced animation engine
    if (anim.engine === 'gsap' && anim.gsapType) {
      hasAnimatedRef.current = true;
      playGSAPAnimation(elementRef.current, anim.gsapType, {
        duration: anim.duration / 1000,
        delay: anim.delay / 1000,
        ease: anim.gsapEase || 'power2.out',
      });
    } else if (anim.engine === 'gsap') {
      // Use GSAP for standard animations too (better performance)
      hasAnimatedRef.current = true;
      const animationMap: Record<string, object> = {
        fadeIn: { opacity: 0, duration: anim.duration / 1000 },
        fadeInUp: { opacity: 0, y: 50, duration: anim.duration / 1000 },
        fadeInDown: { opacity: 0, y: -50, duration: anim.duration / 1000 },
        slideInLeft: { x: -100, opacity: 0, duration: anim.duration / 1000 },
        slideInRight: { x: 100, opacity: 0, duration: anim.duration / 1000 },
        slideInUp: { y: 100, opacity: 0, duration: anim.duration / 1000 },
        slideInDown: { y: -100, opacity: 0, duration: anim.duration / 1000 },
        scaleIn: { scale: 0, opacity: 0, duration: anim.duration / 1000 },
        bounceIn: { scale: 0, duration: anim.duration / 1000, ease: 'bounce.out' },
        rotateIn: { rotation: -180, scale: 0, opacity: 0, duration: anim.duration / 1000 },
        zoomIn: { scale: 0.5, opacity: 0, duration: anim.duration / 1000 },
      };

      const fromVars = animationMap[anim.type];
      if (fromVars) {
        gsap.from(elementRef.current, {
          ...fromVars,
          delay: anim.delay / 1000,
          ease: anim.gsapEase || 'power2.out',
        });
      }
    } else if (anim.engine === 'anime' && anim.animeType) {
      // Use Anime.js for advanced animations
      hasAnimatedRef.current = true;
      playAnimeAnimation(elementRef.current, anim.animeType, {
        duration: anim.duration,
        delay: anim.delay,
        easing: anim.animeEase || 'outQuad',
      });
    }

    // Handle text animations with letter-by-letter effect
    if (element.type === 'text' && anim.engine === 'anime' && anim.animeType) {
      const textEl = elementRef.current.querySelector('.text-content');
      if (textEl instanceof HTMLElement) {
        animateTextByLetters(textEl, anim.animeType as 'reveal' | 'wave' | 'glitch' | 'cascade', {
          duration: anim.duration,
          stagger: anim.stagger || 30,
        });
      }
    }
  }, [isAnimating, element.animation?.enter, element.type]);

  // Handle loop animations
  useEffect(() => {
    if (!elementRef.current) return;

    const loopAnim = element.animation?.loop;
    if (!loopAnim || loopAnim.type === 'none') return;

    // Use advanced loop animation
    if (loopAnim.engine === 'gsap') {
      const animation = playLoopAnimation(elementRef.current, loopAnim.type, loopAnim.engine);
      return () => {
        if (animation) {
          stopAnimations(elementRef.current!);
        }
      };
    } else if (loopAnim.engine === 'anime') {
      // Check if it's a spring animation type
      if (loopAnim.type.startsWith('spring')) {
        const animation = playSpringLoopAnimation(elementRef.current, loopAnim.type, {
          bounce: loopAnim.bounce || 0.7,
          loopDelay: loopAnim.loopDelay || 250,
          duration: loopAnim.duration,
        });
        return () => {
          if (animation) {
            animation.cancel();
          }
        };
      } else {
        const animation = playAnimeLoopAnimation(elementRef.current, loopAnim.type, {
          duration: loopAnim.duration,
        });
        return () => {
          if (animation) {
            animation.cancel();
          }
        };
      }
    }
  }, [element.animation?.loop]);

  // Reset animation state when slide changes
  useEffect(() => {
    if (!isAnimating) {
      hasAnimatedRef.current = false;
    }
  }, [isAnimating]);

  const getCSSAnimationStyle = (): React.CSSProperties => {
    if (!isAnimating || !element.animation?.enter) return {};

    // Skip CSS animation if using GSAP/Anime
    const engine = element.animation.enter.engine;
    if (engine === 'gsap' || engine === 'anime') return {};

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

  const getCSSLoopAnimationStyle = (): React.CSSProperties => {
    if (!element.animation?.loop || element.animation.loop.type === 'none') return {};

    // Skip CSS animation if using GSAP/Anime
    const engine = element.animation.loop.engine;
    if (engine === 'gsap' || engine === 'anime') return {};

    const { type, duration } = element.animation.loop;
    return {
      animation: `${type} ${duration}ms ease-in-out infinite`,
    };
  };

  const getBackgroundStyle = () => {
    // Don't apply background for shapes - let ShapeRenderer handle it
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

  const Wrapper = ({ children, link }: { children: React.ReactNode; link?: { url: string; target?: string } }) => {
    if (link?.url) {
      return (
        <a
          href={link.url}
          target={link.target || '_blank'}
          className="w-full h-full block"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {children}
        </a>
      );
    }
    return <>{children}</>;
  };

  // Interactive elements need higher z-index to be clickable above navigation zones
  const isInteractive =
    element.type === 'button' ||
    element.type === 'poll' ||
    element.type === 'slider' ||
    element.type === 'carousel' ||
    element.type === 'mention' ||
    element.type === 'hashtag' ||
    element.type === 'location' ||
    element.type === 'avatar' ||
    element.type === 'qrcode' ||
    element.type === 'embed' ||
    !!element.link?.url;

  return (
    <div
      ref={elementRef}
      className="absolute overflow-hidden"
      style={{
        left: element.style.x,
        top: element.style.y,
        width: element.style.width,
        height: element.style.height,
        transform: `rotate(${element.style.rotation || 0}deg)`,
        zIndex: isInteractive ? Math.max(40, element.style.zIndex) : element.style.zIndex,
        opacity: element.style.opacity ?? 1,
        borderRadius: element.style.borderRadius,
        boxShadow: element.style.boxShadow,
        filter: element.style.blur ? `blur(${element.style.blur}px)` : undefined,
        ...getBackgroundStyle(),
        ...getCSSAnimationStyle(),
        ...getCSSLoopAnimationStyle(),
      }}
    >
      {element.type === 'text' && (
        <div
          className="w-full h-full flex items-center justify-center p-2 text-content"
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
        <Wrapper link={element.link}>
          <img
            src={element.content}
            className="w-full h-full object-cover"
            alt={element.content}
            style={{ borderRadius: element.style.borderRadius || 0 }}
          />
        </Wrapper>
      )}
      {element.type === 'video' && (
        <Wrapper link={element.link}>
          <video
            src={element.content}
            className="w-full h-full object-cover"
            muted
            playsInline
            autoPlay
            loop
            style={{ borderRadius: element.style.borderRadius || 0 }}
          />
        </Wrapper>
      )}
      {(element.type === 'sticker' || element.type === 'gif') && (
        <Wrapper link={element.link}>
          <img
            src={element.content}
            className="w-full h-full object-contain"
            alt={element.type}
            style={{ borderRadius: element.style.borderRadius || 0 }}
          />
        </Wrapper>
      )}
      {element.type === 'button' && (
        <a
          href={element.button?.href || '#'}
          target={element.button?.target || '_self'}
          rel={element.button?.target === '_blank' ? 'noopener noreferrer' : undefined}
          onPointerDownCapture={(e) => {
            e.stopPropagation();
          }}
          onClickCapture={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            const href = element.button?.href;
            if (!href || href === '#') {
              e.preventDefault();
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="w-full h-full flex items-center justify-center cursor-pointer transition-all hover:opacity-90 hover:scale-[1.02] relative z-50"
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
      {element.type === 'shape' && <ShapeRenderer element={element} />}
      {element.type === 'divider' && (
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
      )}
      {element.type === 'quote' && (
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
      )}
      {element.type === 'list' && (
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
      )}
      {element.type === 'avatar' && (
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
      )}
      {element.type === 'rating' && (
        <div
          className="w-full h-full flex items-center justify-center gap-1"
          style={{ fontSize: element.style.fontSize || 24 }}
        >
          {Array.from({ length: element.rating?.max || 5 }).map((_, i) => (
            <span key={i} className={i < (element.rating?.value || 0) ? 'opacity-100' : 'opacity-30'}>
              {element.rating?.icon === 'heart' ? '❤️' : element.rating?.icon === 'circle' ? '●' : '⭐'}
            </span>
          ))}
          {element.rating?.showValue && (
            <span className="ml-2 text-white opacity-70" style={{ fontSize: (element.style.fontSize || 24) * 0.6 }}>
              {element.rating?.value || 0}/{element.rating?.max || 5}
            </span>
          )}
        </div>
      )}
      {element.type === 'progress' && (
        <div className="w-full h-full flex flex-col justify-center p-2">
          {element.progress?.label && (
            <div className="flex justify-between mb-1" style={{ color: element.style.color || '#ffffff' }}>
              <span className="text-sm">{element.progress.label}</span>
              {element.progress?.showPercent && (
                <span className="text-sm">
                  {Math.round(((element.progress?.value || 0) / (element.progress?.max || 100)) * 100)}%
                </span>
              )}
            </div>
          )}
          {element.progress?.variant === 'circle' ? (
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
                  strokeDasharray={`${Math.round(((element.progress?.value || 0) / (element.progress?.max || 100)) * 100)}, 100`}
                />
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
                  width: `${Math.round(((element.progress?.value || 0) / (element.progress?.max || 100)) * 100)}%`,
                  backgroundColor: '#3b82f6',
                }}
              />
            </div>
          )}
        </div>
      )}
      {element.type === 'timer' && (
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
            <span>{String(Math.floor(timerRemaining / 60)).padStart(2, '0')}</span>
            <span className="animate-pulse">:</span>
            <span>{String(timerRemaining % 60).padStart(2, '0')}</span>
          </div>
          {element.timer?.showLabels && (
            <div className="flex gap-4 mt-1 text-xs opacity-70">
              <span>min</span>
              <span>sec</span>
            </div>
          )}
        </div>
      )}
      {element.type === 'countdown' &&
        (() => {
          const totalSeconds = Math.floor(countdownRemainingMs / 1000);
          const days = Math.floor(totalSeconds / (60 * 60 * 24));
          const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
          const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
          const seconds = totalSeconds % 60;
          const values = [days, hours, minutes, seconds].map((v) => String(v).padStart(2, '0'));

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
                    <span
                      className="bg-white/10 rounded-lg px-3 py-2"
                      style={{ fontSize: element.style.fontSize || 28 }}
                    >
                      {values[i]}
                    </span>
                    <span className="text-xs opacity-70 mt-1">{unit}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      {element.type === 'location' && (
        <div
          className="w-full h-full flex items-center gap-2 p-2"
          style={{ color: element.style.color || '#ffffff', fontSize: element.style.fontSize || 14 }}
        >
          <span className="text-xl">📍</span>
          <div className="flex flex-col">
            <span className="font-medium">{element.location?.name || 'Location'}</span>
            {element.location?.address && <span className="text-xs opacity-70">{element.location.address}</span>}
          </div>
        </div>
      )}
      {element.type === 'mention' && (
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
      )}
      {element.type === 'hashtag' && (
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
      )}
      {element.type === 'codeblock' && (
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
      )}
      {element.type === 'poll' && (
        <div
          className="w-full h-full p-3 rounded-xl"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
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
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  if (pollIsSubmitting) return;

                  setPollSelectedIndex(i);

                  // If user provided an endpoint, submit vote
                  if (pollResolvedSubmitUrl) {
                    setPollIsSubmitting(true);
                    setPollSubmitState('idle');

                    fetch('/api/poll-vote', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        forwardUrl: pollResolvedSubmitUrl,
                        storyId,
                        slideId,
                        elementId: element.id,
                        optionIndex: i,
                        optionLabel: option,
                        question: element.poll?.question,
                      }),
                    })
                      .then(async (res) => {
                        if (!res.ok) {
                          throw new Error(await res.text());
                        }
                        setPollSubmitState('success');
                      })
                      .catch(() => {
                        setPollSubmitState('error');
                      })
                      .finally(() => {
                        setPollIsSubmitting(false);
                      });
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className={`rounded-lg px-3 py-2 text-white text-sm cursor-pointer transition-colors ${
                  pollSelectedIndex === i
                    ? pollSubmitState === 'error'
                      ? 'bg-red-500/40'
                      : pollSubmitState === 'success'
                        ? 'bg-emerald-500/35'
                        : 'bg-white/40'
                    : pollIsSubmitting
                      ? 'bg-white/10 opacity-60 cursor-not-allowed'
                      : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {option}
              </div>
            ))}
          </div>
          {pollHasSubmit && (
            <div className="mt-2 text-xs opacity-70" style={{ color: '#ffffff' }}>
              {pollIsSubmitting
                ? 'Sending...'
                : pollSubmitState === 'success'
                  ? 'Sent'
                  : pollSubmitState === 'error'
                    ? 'Failed'
                    : ''}
            </div>
          )}
        </div>
      )}
      {element.type === 'qrcode' && (
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
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square"
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
      )}
      {element.type === 'embed' && (
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
          </div>
        </div>
      )}
      {(element.type === 'slider' || element.type === 'carousel') &&
        (() => {
          const rawImages = (element.slider?.images || element.carousel?.images || []) as Array<
            string | { src: string; caption?: string }
          >;
          const images = rawImages.map((img) => (typeof img === 'string' ? { src: img } : img));
          const count = images.length;
          const index = count ? Math.max(0, Math.min(sliderCurrentIndex, count - 1)) : 0;
          const displayIndex = count ? Math.max(0, Math.min(sliderDisplayedIndex, count - 1)) : 0;
          const src = images[displayIndex]?.src;
          const caption = images[displayIndex]?.caption;

          const transitionFrom = count ? Math.max(0, Math.min(sliderTransition.from, count - 1)) : 0;
          const transitionTo = count ? Math.max(0, Math.min(sliderTransition.to, count - 1)) : 0;
          const fromSrc = images[transitionFrom]?.src;
          const toSrc = images[transitionTo]?.src;
          const toCaption = images[transitionTo]?.caption;

          const goPrev = (e: React.MouseEvent | React.TouchEvent) => {
            e.stopPropagation();
            const nativeEvent = (e as unknown as { nativeEvent?: { stopImmediatePropagation?: () => void } })
              .nativeEvent;
            nativeEvent?.stopImmediatePropagation?.();
            if (!count) return;
            setSliderCurrentIndex((prev) => (prev - 1 + count) % count);
          };

          const goNext = (e: React.MouseEvent | React.TouchEvent) => {
            e.stopPropagation();
            const nativeEvent = (e as unknown as { nativeEvent?: { stopImmediatePropagation?: () => void } })
              .nativeEvent;
            nativeEvent?.stopImmediatePropagation?.();
            if (!count) return;
            setSliderCurrentIndex((prev) => (prev + 1) % count);
          };

          return (
            <div
              className="w-full h-full bg-black/30 rounded-xl relative overflow-hidden"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{ borderRadius: element.style.borderRadius || 12 }}
            >
              {count > 0 ? (
                <div className="absolute inset-0 pointer-events-none">
                  {sliderTransition.active && fromSrc && toSrc && fromSrc !== toSrc ? (
                    <>
                      <img
                        src={fromSrc}
                        alt={caption || 'slide'}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                        style={{
                          borderRadius: element.style.borderRadius || 12,
                          opacity: sliderTransitionStarted ? 0 : 1,
                        }}
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                      />
                      <img
                        src={toSrc}
                        alt={toCaption || 'slide'}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                        style={{
                          borderRadius: element.style.borderRadius || 12,
                          opacity: sliderTransitionStarted ? 1 : 0,
                        }}
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    </>
                  ) : src ? (
                    <img
                      src={src}
                      alt={caption || 'slide'}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ borderRadius: element.style.borderRadius || 12 }}
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 w-full h-full flex items-center justify-center text-white/80"
                      style={{ borderRadius: element.style.borderRadius || 12 }}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-2">🖼️</div>
                        <p className="text-sm opacity-70">Slide {displayIndex + 1}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/80">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p className="text-sm opacity-70">Image Slider</p>
                  </div>
                </div>
              )}

              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white text-lg flex items-center justify-center z-20"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white text-lg flex items-center justify-center z-20"
                  >
                    ›
                  </button>
                </>
              )}

              {count > 0 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 z-20">
                  {Array.from({ length: count }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        setSliderCurrentIndex(i);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className={`w-2 h-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/40'}`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
};

// Slide transition wrapper with GSAP support
const SlideTransition = ({
  children,
  type,
  duration,
  isEntering,
  isExiting,
  useGSAP = false,
}: {
  children: React.ReactNode;
  type: TransitionType;
  duration: number;
  isEntering: boolean;
  isExiting: boolean;
  useGSAP?: boolean;
}) => {
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slideRef.current || !useGSAP || type === 'none') return;

    if (isExiting || isEntering) {
      // Use GSAP for smooth transitions
      const el = slideRef.current;

      if (isExiting) {
        switch (type) {
          case 'fade':
            gsap.to(el, { opacity: 0, duration: duration / 1000 });
            break;
          case 'slide':
            gsap.to(el, { x: '-100%', duration: duration / 1000, ease: 'power2.inOut' });
            break;
          case 'zoom':
            gsap.to(el, { scale: 1.5, opacity: 0, duration: duration / 1000 });
            break;
          case 'flip':
            gsap.to(el, { rotationY: -90, duration: duration / 1000, transformPerspective: 1000 });
            break;
          case 'cube':
            gsap.to(el, { rotationY: -90, z: -180, duration: duration / 1000, transformPerspective: 1000 });
            break;
          case 'dissolve':
            gsap.to(el, { filter: 'blur(20px)', opacity: 0, duration: duration / 1000 });
            break;
          case 'wipe':
            gsap.to(el, { clipPath: 'inset(0 0 0 100%)', duration: duration / 1000 });
            break;
        }
      } else if (isEntering) {
        switch (type) {
          case 'fade':
            gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: duration / 1000 });
            break;
          case 'slide':
            gsap.fromTo(el, { x: '100%' }, { x: '0%', duration: duration / 1000, ease: 'power2.inOut' });
            break;
          case 'zoom':
            gsap.fromTo(el, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: duration / 1000 });
            break;
          case 'flip':
            gsap.fromTo(el, { rotationY: 90 }, { rotationY: 0, duration: duration / 1000, transformPerspective: 1000 });
            break;
          case 'cube':
            gsap.fromTo(
              el,
              { rotationY: 90, z: -180 },
              { rotationY: 0, z: 0, duration: duration / 1000, transformPerspective: 1000 }
            );
            break;
          case 'dissolve':
            gsap.fromTo(
              el,
              { filter: 'blur(20px)', opacity: 0 },
              { filter: 'blur(0)', opacity: 1, duration: duration / 1000 }
            );
            break;
          case 'wipe':
            gsap.fromTo(
              el,
              { clipPath: 'inset(0 100% 0 0)' },
              { clipPath: 'inset(0 0 0 0)', duration: duration / 1000 }
            );
            break;
        }
      }
    }
  }, [type, duration, isEntering, isExiting, useGSAP]);

  // CSS fallback for non-GSAP mode
  const getTransitionStyle = (): React.CSSProperties => {
    if (type === 'none' || useGSAP) return {};

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
    <div ref={slideRef} className="absolute inset-0 z-20" style={getTransitionStyle()}>
      {children}
    </div>
  );
};

export const StoryPreviewV2: React.FC<StoryPreviewProps> = ({ story, onClose, startSlideIndex = 0, pollSubmitUrl }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(startSlideIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'in' | 'out'>('in');
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const slideAudioRef = useRef<HTMLAudioElement | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [stageScale, setStageScale] = useState(1);

  const currentSlide = story.slides[currentSlideIndex] || story.slides[0];

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth || PREVIEW_BASE_WIDTH;
      setStageScale(width / PREVIEW_BASE_WIDTH);
    };

    updateScale();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScale) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateScale);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

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

  // Helper to resolve asset paths
  const resolveAssetPath = (path: string): string => {
    if (!path) return path;
    if (path.startsWith('~/assets/audio')) {
      return path.replace('~/assets/audio', '/src/assets/audio');
    }
    if (path.startsWith('~/assets/images')) {
      return path.replace('~/assets/images', '/src/assets/images');
    }
    if (path.startsWith('~/assets/videos')) {
      return path.replace('~/assets/videos', '/src/assets/videos');
    }
    return path;
  };

  // Handle background audio (plays throughout entire story)
  useEffect(() => {
    if (story.audio?.src && !bgAudioRef.current) {
      const audioSrc = resolveAssetPath(story.audio.src);
      bgAudioRef.current = new Audio(audioSrc);
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
      const audioSrc = resolveAssetPath(currentSlide.audio.src);
      slideAudioRef.current = new Audio(audioSrc);
      slideAudioRef.current.volume = currentSlide.audio.volume ?? 0.8;

      // Set start time
      if (currentSlide.audio.startTime) {
        slideAudioRef.current.currentTime = currentSlide.audio.startTime;
      }

      // Handle end time - stop playback when reached
      const endTime = currentSlide.audio.endTime;
      if (endTime) {
        const checkEndTime = () => {
          if (slideAudioRef.current && slideAudioRef.current.currentTime >= endTime) {
            slideAudioRef.current.pause();
            // Optionally loop back to start
            // slideAudioRef.current.currentTime = currentSlide.audio.startTime || 0;
          }
        };
        slideAudioRef.current.addEventListener('timeupdate', checkEndTime);
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
      <div
        ref={previewContainerRef}
        className="relative h-full max-h-screen aspect-[9/16] bg-black overflow-hidden shadow-2xl rounded-2xl z-20"
      >
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
            {/* Sound toggle - always visible when there's audio */}
            {(story.audio?.src || currentSlide.audio?.src) && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 hover:text-white bg-black/30 backdrop-blur-sm rounded-full transition-colors ${
                  isMuted ? 'text-red-400' : 'text-white/80'
                }`}
                title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            )}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full transition-colors"
            >
              {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white bg-black/30 backdrop-blur-sm rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Slide Content with Transition */}
        <SlideTransition
          type={currentSlide.transition?.type || 'fade'}
          duration={currentSlide.transition?.duration || 500}
          isEntering={isTransitioning && transitionDirection === 'in'}
          isExiting={isTransitioning && transitionDirection === 'out'}
        >
          <div className="absolute inset-0 w-full h-full" style={getBackgroundStyle()}>
            <div
              className="absolute left-0 top-0"
              style={{
                width: PREVIEW_BASE_WIDTH,
                height: PREVIEW_BASE_HEIGHT,
                transform: `scale(${stageScale})`,
                transformOrigin: 'top left',
              }}
            >
              {/* Tap Navigation Zones - Scaled with content but below interactive elements */}
              <div className="absolute inset-0 flex pointer-events-none" style={{ zIndex: 30 }}>
                <div
                  className="w-1/3 h-full cursor-pointer pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevSlide();
                  }}
                />
                <div className="w-1/3 h-full pointer-events-auto" onClick={() => setIsPaused(!isPaused)} />
                <div
                  className="w-1/3 h-full cursor-pointer pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextSlide();
                  }}
                />
              </div>
              {/* Background media */}
              {currentSlide.background.type === 'image' && currentSlide.background.value && (
                <>
                  <img
                    src={
                      currentSlide.background.value.startsWith('~/')
                        ? currentSlide.background.value.replace('~/', '/src/')
                        : currentSlide.background.value
                    }
                    className="absolute inset-0 w-full h-full"
                    alt="slide-bg"
                    style={{
                      objectFit:
                        currentSlide.background.size === 'cover' ||
                        currentSlide.background.size === 'contain' ||
                        !currentSlide.background.size
                          ? ((currentSlide.background.size || 'cover') as 'cover' | 'contain')
                          : undefined,
                      width: currentSlide.background.size === '100% 100%' ? '100%' : undefined,
                      height: currentSlide.background.size === '100% 100%' ? '100%' : undefined,
                      objectPosition: currentSlide.background.position || 'center',
                      filter: currentSlide.background.filter
                        ? `blur(${currentSlide.background.filter.blur || 0}px) brightness(${currentSlide.background.filter.brightness || 100}%) contrast(${currentSlide.background.filter.contrast || 100}%)`
                        : undefined,
                    }}
                  />
                  {/* Overlay */}
                  {currentSlide.background.overlay && (
                    <div className="absolute inset-0" style={{ backgroundColor: currentSlide.background.overlay }} />
                  )}
                </>
              )}
              {currentSlide.background.type === 'video' && currentSlide.background.value && (
                <>
                  <video
                    src={
                      currentSlide.background.value.startsWith('~/')
                        ? currentSlide.background.value.replace('~/assets/videos', '/src/assets/videos')
                        : currentSlide.background.value
                    }
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                  />
                  {/* Overlay */}
                  {currentSlide.background.overlay && (
                    <div className="absolute inset-0" style={{ backgroundColor: currentSlide.background.overlay }} />
                  )}
                </>
              )}

              {/* Elements - render with higher z-index for interactive elements */}
              {currentSlide.elements.map((el) => {
                // Timeline visibility check
                if (el.timings) {
                  const currentTimeMs = (progress / 100) * (currentSlide.duration * 1000);
                  const { start, duration } = el.timings;
                  const isVisible = currentTimeMs >= start && currentTimeMs <= start + duration;
                  if (!isVisible) return null;
                }

                return (
                  <PreviewElement
                    key={el.id}
                    element={el}
                    isAnimating={!isTransitioning}
                    storyId={story.id}
                    slideId={currentSlide.id}
                    pollSubmitUrl={pollSubmitUrl}
                  />
                );
              })}
            </div>
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
