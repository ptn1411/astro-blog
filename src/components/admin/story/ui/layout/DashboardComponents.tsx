import { Plus, RefreshCw, Search, X } from 'lucide-react';
import React from 'react';
import { cn } from '~/utils/cn';

interface StatsCardProps {
  label: string;
  value: number | string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

export function StatsCard({ label, value, trend, icon }: StatsCardProps) {
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4 sm:p-6 hover:border-slate-700/50 transition-colors duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 font-medium mb-1">{label}</p>
          <p className="text-2xl sm:text-3xl font-semibold font-heading text-white">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-2 font-medium', trend.isPositive ? 'text-green-400' : 'text-red-400')}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-slate-800/50 rounded-lg" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export function SearchBar({ value, onChange, placeholder = 'Tìm kiếm...', onClear }: SearchBarProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-slate-400" aria-hidden="true" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-11 pr-11 py-3 sm:py-3.5',
          'bg-slate-900/50 backdrop-blur-sm',
          'border border-slate-800/50 rounded-xl',
          'text-slate-100 placeholder-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'transition-all duration-200',
          'hover:border-slate-700/50'
        )}
        aria-label={placeholder}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-r-xl"
          aria-label="Clear search"
        >
          <X className="w-5 h-5 text-slate-400" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function ActionButton({
  icon,
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
}: ActionButtonProps) {
  const variants = {
    primary:
      'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25',
    secondary: 'bg-slate-800/50 hover:bg-slate-800 text-slate-200 border border-slate-700/50 hover:border-slate-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'rounded-xl font-medium',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950',
        'cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size]
      )}
      aria-label={label}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function LoadingSpinner({ size = 'md', label = 'Loading...' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <RefreshCw className={cn(sizes[size], 'text-blue-500 animate-spin')} aria-hidden="true" />
      <span className="text-sm text-slate-400">{label}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
      {icon && (
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 font-heading">{title}</h3>
      <p className="text-sm sm:text-base text-slate-400 mb-6 max-w-md">{description}</p>
      {action && (
        <ActionButton
          icon={<Plus className="w-5 h-5" />}
          label={action.label}
          onClick={action.onClick}
          variant="primary"
          size="md"
        />
      )}
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-slate-800/50 text-slate-300 border-slate-700/50',
    success: 'bg-green-900/30 text-green-400 border-green-800/50',
    warning: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50',
    danger: 'bg-red-900/30 text-red-400 border-red-800/50',
    info: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg',
        'text-xs font-medium border',
        'transition-colors duration-200',
        variants[variant]
      )}
    >
      {children}
    </span>
  );
}
