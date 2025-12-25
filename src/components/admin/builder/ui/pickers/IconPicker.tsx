import * as TablerIcons from '@tabler/icons-react';
import { ChevronDown, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

// Common Tabler icons used in the widgets
const TABLER_ICONS = [
  // Common
  'check',
  'x',
  'plus',
  'minus',
  'arrow-right',
  'arrow-left',
  'arrow-up',
  'arrow-down',
  'chevron-right',
  'chevron-left',
  'chevron-up',
  'chevron-down',
  // UI
  'home',
  'user',
  'users',
  'settings',
  'menu',
  'search',
  'bell',
  'mail',
  'phone',
  'calendar',
  'clock',
  'map-pin',
  'globe',
  'link',
  'external-link',
  // Media
  'photo',
  'camera',
  'video',
  'music',
  'file',
  'folder',
  'download',
  'upload',
  'cloud',
  // Commerce
  'shopping-cart',
  'credit-card',
  'wallet',
  'gift',
  'discount',
  'receipt',
  'coin',
  // Social
  'heart',
  'star',
  'thumb-up',
  'message',
  'share',
  'bookmark',
  'flag',
  // Development
  'code',
  'terminal',
  'git-branch',
  'git-commit',
  'bug',
  'cpu',
  'database',
  'server',
  // Features
  'rocket',
  'lightning-bolt',
  'bolt',
  'award',
  'trophy',
  'target',
  'bulb',
  'sparkles',
  'shield',
  'shield-check',
  'lock',
  'key',
  'fingerprint',
  // Status
  'check-circle',
  'alert-circle',
  'info-circle',
  'help-circle',
  'x-circle',
  // Actions
  'edit',
  'trash',
  'copy',
  'clipboard',
  'refresh',
  'rotate',
  'zoom-in',
  'zoom-out',
  // Misc
  'package',
  'box',
  'puzzle',
  'palette',
  'brush',
  'paint',
  'wand',
  'headphones',
  'microphone',
  'volume',
  'wifi',
  'bluetooth',
  'battery',
];

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
}

export function IconPicker({ value, onChange, isDarkMode }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Extract icon name from value (e.g., "tabler:check" -> "check")
  const currentIcon = value?.startsWith('tabler:') ? value.replace('tabler:', '') : value || '';

  function tablerNameToComponent(name: string) {
    const pascal = name
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');

    return `Icon${pascal}`;
  }

  const IconComponent = currentIcon ? (TablerIcons as any)[tablerNameToComponent(currentIcon)] : null;

  const filteredIcons = useMemo(() => {
    if (!search) return TABLER_ICONS;
    return TABLER_ICONS.filter((icon) => icon.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const handleSelect = (icon: string) => {
    onChange(`tabler:${icon}`);
    setIsOpen(false);
    setSearch('');
  };

  const inputClass = `w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2 border rounded text-sm flex items-center justify-between transition-colors ${
          isDarkMode
            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
        }`}
      >
        <span className="flex items-center gap-2">
          {currentIcon ? (
            <>
              <span className="flex items-center gap-2">
                {IconComponent && (
                  <IconComponent size={16} stroke={1.8} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                )}

                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  tabler:{currentIcon}
                </span>
              </span>
            </>
          ) : (
            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Select icon...</span>
          )}
        </span>
        <ChevronDown size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div
            className={`absolute z-50 mt-1 w-full rounded-lg shadow-lg border max-h-80 overflow-hidden ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            {/* Search */}
            <div className="p-2 border-b border-inherit">
              <div className="relative">
                <Search
                  size={14}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                />
                <input
                  type="text"
                  placeholder="Search icons..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${inputClass} pl-7 py-1.5`}
                  autoFocus
                />
              </div>
            </div>

            {/* Icons Grid */}
            <div className="p-2 max-h-56 overflow-y-auto">
              {filteredIcons.length > 0 ? (
                <div className="grid grid-cols-6 gap-1">
                  {filteredIcons.map((icon) => {
                    const Icon = (TablerIcons as any)[tablerNameToComponent(icon)];

                    return (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => handleSelect(icon)}
                        title={icon}
                        className="p-2 rounded flex flex-col items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {Icon && <Icon size={18} />}
                        <span className="text-[10px] truncate">{icon}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className={`text-center py-4 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No icons found
                </div>
              )}
            </div>

            {/* Clear Button */}
            {value && (
              <div className={`p-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className={`w-full p-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1 ${
                    isDarkMode
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  <X size={12} /> Clear
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
