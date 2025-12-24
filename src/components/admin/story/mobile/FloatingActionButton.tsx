import React, { useCallback, useRef, useState } from 'react';

/**
 * FloatingActionButton Component - Mobile FAB with ripple effect
 * Requirements: 1.3
 */

export interface FABProps {
  /** Icon to display inside the button */
  icon: React.ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Position of the FAB */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Background color (Tailwind class or hex) */
  color?: string;
  /** Optional label for accessibility */
  label?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/** Size configurations in pixels */
const SIZE_CONFIG = {
  small: { button: 40, icon: 20 },
  medium: { button: 56, icon: 24 },
  large: { button: 72, icon: 32 },
} as const;

/** Position configurations */
const POSITION_CONFIG = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
} as const;

interface RippleState {
  x: number;
  y: number;
  size: number;
  id: number;
}

export const FloatingActionButton: React.FC<FABProps> = ({
  icon,
  onClick,
  position = 'bottom-right',
  size = 'medium',
  color = 'bg-blue-600',
  label,
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const rippleIdRef = useRef(0);

  // Handle ripple effect on tap/click
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
      if (disabled) return;

      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      let clientX: number;
      let clientY: number;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Calculate ripple size to cover the entire button
      const rippleSize = Math.max(rect.width, rect.height) * 2;

      const newRipple: RippleState = {
        x,
        y,
        size: rippleSize,
        id: rippleIdRef.current++,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);

      onClick();
    },
    [onClick, disabled]
  );

  const sizeConfig = SIZE_CONFIG[size];
  const positionClass = POSITION_CONFIG[position];

  // Determine if color is a Tailwind class or custom color
  const isCustomColor = color.startsWith('#') || color.startsWith('rgb');
  const bgColorClass = isCustomColor ? '' : color;
  const bgColorStyle = isCustomColor ? { backgroundColor: color } : undefined;

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      className={`
        fixed ${positionClass}
        flex items-center justify-center
        rounded-full shadow-lg
        ${bgColorClass}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl active:scale-95'}
        transition-all duration-200
        overflow-hidden
        z-50
        touch-manipulation
      `}
      style={{
        width: sizeConfig.button,
        height: sizeConfig.button,
        ...bgColorStyle,
      }}
    >
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}

      {/* Icon container */}
      <span
        className="relative z-10 text-white flex items-center justify-center"
        style={{
          width: sizeConfig.icon,
          height: sizeConfig.icon,
        }}
      >
        {icon}
      </span>
    </button>
  );
};

export default FloatingActionButton;
