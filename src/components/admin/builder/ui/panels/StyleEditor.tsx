import { AlignCenter, AlignLeft, AlignRight, Bold, BoxSelect, Grid, Italic, Layout, Type } from 'lucide-react';

interface StyleEditorProps {
  value: string; // The className string
  onChange: (value: string) => void;
  isDarkMode: boolean;
}

// Helper to toggle a class in a string
const toggleClass = (currentData: string, cls: string, group?: string[]) => {
  let classes = currentData.split(' ').filter(Boolean);

  // If part of a group (radio behavior), remove other group members
  if (group) {
    classes = classes.filter((c) => !group.includes(c) || c === cls);
  }

  if (classes.includes(cls)) {
    // If it's a toggle (not group), remove it. If group, it stays (radio behavior usually keeps one active, but here toggle off is okay too?)
    // Let's assume group means "pick one of these", but clicking active one removes it (optional)
    classes = classes.filter((c) => c !== cls);
  } else {
    // Add it
    classes.push(cls);
  }

  return classes.join(' ');
};

const hasClass = (currentData: string, cls: string) => {
  return currentData.split(' ').includes(cls);
};

export function StyleEditor({ value = '', onChange, isDarkMode }: StyleEditorProps) {
  const handleToggle = (cls: string, group?: string[]) => {
    onChange(toggleClass(value, cls, group));
  };

  const btnClass = (active: boolean) => `
    p-2 rounded text-xs border transition-colors flex items-center justify-center
    ${
      active
        ? isDarkMode
          ? 'bg-blue-600 border-blue-500 text-white'
          : 'bg-blue-100 border-blue-200 text-blue-700 bg-opacity-50'
        : isDarkMode
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400'
          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
    }
  `;

  return (
    <div
      className={`border rounded-lg p-3 space-y-4 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}
    >
      {/* Layout */}
      <div>
        <label
          className={`text-xs font-semibold uppercase mb-2 block ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
        >
          Layout
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            className={btnClass(hasClass(value, 'flex'))}
            onClick={() => handleToggle('flex', ['block', 'grid', 'hidden'])}
            title="Flexbox"
          >
            <Layout size={16} />
          </button>
          <button
            className={btnClass(hasClass(value, 'grid'))}
            onClick={() => handleToggle('grid', ['block', 'flex', 'hidden'])}
            title="Grid"
          >
            <Grid size={16} />
          </button>
          <button
            className={btnClass(hasClass(value, 'block'))}
            onClick={() => handleToggle('block', ['flex', 'grid', 'hidden'])}
            title="Block"
          >
            <BoxSelect size={16} />
          </button>
        </div>
      </div>

      {/* Alignment */}
      <div>
        <label
          className={`text-xs font-semibold uppercase mb-2 block ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
        >
          Alignment
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            className={btnClass(hasClass(value, 'text-left'))}
            onClick={() => handleToggle('text-left', ['text-center', 'text-right'])}
            title="Left Align"
          >
            <AlignLeft size={16} />
          </button>
          <button
            className={btnClass(hasClass(value, 'text-center'))}
            onClick={() => handleToggle('text-center', ['text-left', 'text-right'])}
            title="Center Align"
          >
            <AlignCenter size={16} />
          </button>
          <button
            className={btnClass(hasClass(value, 'text-right'))}
            onClick={() => handleToggle('text-right', ['text-left', 'text-center'])}
            title="Right Align"
          >
            <AlignRight size={16} />
          </button>
        </div>
      </div>

      {/* Typography */}
      <div>
        <label
          className={`text-xs font-semibold uppercase mb-2 block ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
        >
          Typography
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            className={btnClass(hasClass(value, 'font-bold'))}
            onClick={() => handleToggle('font-bold', ['font-semibold', 'font-normal'])}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button className={btnClass(hasClass(value, 'italic'))} onClick={() => handleToggle('italic')} title="Italic">
            <Italic size={16} />
          </button>
          <button
            className={btnClass(hasClass(value, 'uppercase'))}
            onClick={() => handleToggle('uppercase', ['capitalize', 'lowercase'])}
            title="Uppercase"
          >
            <Type size={16} />
          </button>
        </div>
      </div>

      {/* Spacing Quick Toggles */}
      <div>
        <label
          className={`text-xs font-semibold uppercase mb-2 block ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
        >
          Spacing (Padding)
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            className={btnClass(hasClass(value, 'p-0'))}
            onClick={() => handleToggle('p-0', ['p-2', 'p-4', 'p-8'])}
          >
            0
          </button>
          <button
            className={btnClass(hasClass(value, 'p-2'))}
            onClick={() => handleToggle('p-2', ['p-0', 'p-4', 'p-8'])}
          >
            XS
          </button>
          <button
            className={btnClass(hasClass(value, 'p-4'))}
            onClick={() => handleToggle('p-4', ['p-0', 'p-2', 'p-8'])}
          >
            MD
          </button>
          <button
            className={btnClass(hasClass(value, 'p-8'))}
            onClick={() => handleToggle('p-8', ['p-0', 'p-2', 'p-4'])}
          >
            XL
          </button>
        </div>
      </div>
    </div>
  );
}
