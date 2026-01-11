import { HelpCircle, LayoutGrid, Sparkles } from 'lucide-react';
import React from 'react';
import { cn } from '~/utils/cn';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: 'stories' | 'builder' | 'settings';
}

export function DashboardLayout({ children, activeTab = 'stories' }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Floating Navigation Bar */}
      <nav
        className="fixed top-4 left-4 right-4 z-50 bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-2xl shadow-2xl"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold font-heading text-white">Story Builder</h1>
              <p className="text-xs text-slate-400">Quản lý bản tin</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <NavButton
              icon={<LayoutGrid className="w-5 h-5" />}
              label="Stories"
              isActive={activeTab === 'stories'}
              href="/admin/stories"
            />
          </div>

          {/* Help Button */}
          <button
            type="button"
            className="p-2 sm:p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Help and documentation"
          >
            <HelpCircle className="w-5 h-5 text-slate-400 hover:text-slate-300 transition-colors" aria-hidden="true" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-slate-800/50 px-4 py-2 flex items-center gap-2">
          <NavButton
            icon={<LayoutGrid className="w-5 h-5" />}
            label="Stories"
            isActive={activeTab === 'stories'}
            href="/admin/stories"
            compact
          />
        </div>
      </nav>

      {/* Main Content Area with proper spacing for fixed nav */}
      <main className="pt-24 sm:pt-28 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  href?: string;
  onClick?: () => void;
  compact?: boolean;
}

function NavButton({ icon, label, isActive, href, onClick, compact }: NavButtonProps) {
  const baseClasses = cn(
    'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer',
    'font-medium text-sm',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900',
    isActive
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
    compact && 'flex-1 justify-center'
  );

  const content = (
    <>
      <span aria-hidden="true">{icon}</span>
      <span className={cn(compact && 'text-xs')}>{label}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClasses}>
      {content}
    </button>
  );
}
