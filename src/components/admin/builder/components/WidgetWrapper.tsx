import React, { useEffect, useRef } from 'react';
import {
  playAnimeAnimation,
  playAnimeLoopAnimation,
  playGSAPAnimation,
  playLoopAnimation,
  stopAnimations,
  stopAnimeAnimation,
} from '../../story/animations';

export interface WidgetAnimationProps {
  animationEngine?: 'gsap' | 'anime' | 'css';
  animationType?: string;
  loopAnimation?: string;
  animationDuration?: number;
  animationDelay?: number;
}

interface WidgetWrapperProps extends WidgetAnimationProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  children,
  className,
  id,
  animationEngine = 'gsap',
  animationType,
  loopAnimation,
  animationDuration = 1000,
  animationDelay = 0,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Reset animations
    if (animationEngine === 'gsap') {
      stopAnimations(element);
    } else if (animationEngine === 'anime') {
      stopAnimeAnimation(element);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Entrance Animation
            if (animationType) {
              if (animationEngine === 'gsap') {
                playGSAPAnimation(element, animationType, {
                  duration: animationDuration / 1000, // GSAP uses seconds
                  delay: animationDelay / 1000,
                });
              } else if (animationEngine === 'anime') {
                playAnimeAnimation(element, animationType, {
                  duration: animationDuration,
                  delay: animationDelay,
                });
              }
            }

            // Loop Animation
            if (loopAnimation) {
              if (animationEngine === 'gsap') {
                // If there's an entrance animation, wait for it effectively (though loop usually overrides or runs parallel depending on implementation)
                // For simplicity, we just run it. Ideally, we might want to chain them.
                playLoopAnimation(element, loopAnimation, 'gsap');
              } else if (animationEngine === 'anime') {
                playAnimeLoopAnimation(element, loopAnimation, {
                  duration: animationDuration,
                });
              }
            }

            // Disconnect after triggering entrance (if we only want it once per view)
            // But for builder preview, maybe we want it every time it comes into view?
            // Let's keep observing for now so scrolling up and down re-triggers it, which is nice for preview.
            // Actually, playGSAPAnimation usually uses .from(), so running it again might be weird if not reset.
            // Let's unobserve to prevent glitches for now.
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (element) {
        if (animationEngine === 'gsap') stopAnimations(element);
        else stopAnimeAnimation(element);
      }
    };
  }, [animationEngine, animationType, loopAnimation, animationDuration, animationDelay]);

  return (
    <div ref={elementRef} className={className} id={id}>
      {children}
    </div>
  );
};
