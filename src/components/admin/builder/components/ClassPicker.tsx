import { Check, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ClassPickerProps {
  value: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
}

// A subset of common Tailwind classes for suggestions
const TAILWIND_CLASSES = [
  // Layout
  'flex',
  'grid',
  'hidden',
  'block',
  'inline-block',
  'container',
  'mx-auto',
  'flex-col',
  'flex-row',
  'flex-wrap',
  'items-center',
  'justify-center',
  'justify-between',
  'gap-2',
  'gap-4',
  'gap-8',
  'p-4',
  'p-8',
  'm-4',
  'm-8',
  // Sizing
  'w-full',
  'h-full',
  'w-screen',
  'h-screen',
  'min-h-screen',
  'max-w-7xl',
  'max-w-5xl',
  // Typography
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-4xl',
  'font-bold',
  'font-semibold',
  'text-center',
  'text-left',
  'text-right',
  'uppercase',
  'capitalize',
  'text-white',
  'text-black',
  'text-gray-500',
  'text-blue-500',
  'text-primary',
  'text-secondary',
  // Backgrounds
  'bg-white',
  'bg-black',
  'bg-gray-100',
  'bg-gray-900',
  'bg-blue-500',
  'bg-primary',
  'bg-secondary',
  'bg-slate-50',
  'bg-slate-900',
  // Effects
  'shadow',
  'shadow-lg',
  'shadow-xl',
  'rounded',
  'rounded-lg',
  'rounded-xl',
  'rounded-full',
  'opacity-50',
  'opacity-75',
  'hover:opacity-80',
  'transition-all',
  'duration-300',
  // Borders
  'border',
  'border-gray-200',
  'border-gray-700',
  'border-t',
  'border-b',
];

export function ClassPicker({ value, onChange, isDarkMode }: ClassPickerProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Parse current classes into an array
  const currentClasses = useMemo(() => {
    return value ? value.split(' ').filter(Boolean) : [];
  }, [value]);

  // Filter suggestions
  const suggestions = useMemo(() => {
    if (!inputValue) return [];
    return TAILWIND_CLASSES.filter((c) => c.includes(inputValue.toLowerCase()) && !currentClasses.includes(c)).slice(
      0,
      10
    );
  }, [inputValue, currentClasses]);

  const addClass = (cls: string) => {
    const newClasses = [...currentClasses, cls];
    onChange(newClasses.join(' '));
    setInputValue('');
    setIsOpen(false);
  };

  const removeClass = (cls: string) => {
    const newClasses = currentClasses.filter((c) => c !== cls);
    onChange(newClasses.join(' '));
  };

  return (
    <div className="relative">
      <div
        className={`p-2 border rounded-md min-h-[42px] flex flex-wrap gap-2 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
      >
        {currentClasses.map((cls) => (
          <span
            key={cls}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
              isDarkMode
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-blue-50 text-blue-700 border border-blue-100'
            }`}
          >
            {cls}
            <button onClick={() => removeClass(cls)} className="hover:text-red-500 focus:outline-none">
              <X size={12} />
            </button>
          </span>
        ))}
        <div className="relative flex-1 min-w-[120px]">
          <input
            type="text"
            className={`w-full text-sm bg-transparent outline-none ${isDarkMode ? 'text-gray-200 placeholder:text-gray-500' : 'text-gray-800 placeholder:text-gray-400'}`}
            placeholder={currentClasses.length === 0 ? 'Add class...' : ''}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue) {
                addClass(inputValue); // Allow custom classes too
              }
              if (e.key === 'Backspace' && !inputValue && currentClasses.length > 0) {
                removeClass(currentClasses[currentClasses.length - 1]);
              }
            }}
          />
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg max-h-48 overflow-y-auto ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-800'
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                addClass(suggestion);
              }}
            >
              <span>{suggestion}</span>
              {currentClasses.includes(suggestion) && <Check size={14} className="text-green-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
