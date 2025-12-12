import { useEffect, useState } from 'react';

interface JsonEditorProps {
  value: any;
  onChange: (value: any) => void;
  isDarkMode: boolean;
}

export function JsonEditor({ value, onChange, isDarkMode }: JsonEditorProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync text with value when value changes externally (and it's not what we currently have)
  useEffect(() => {
    try {
      // Only update if the parsed current text doesn't match the new value
      // This prevents cursor jumping or reformatting while typing valid JSON that is semantically same
      const currentParsed = JSON.parse(text || 'null');
      if (JSON.stringify(currentParsed) !== JSON.stringify(value)) {
        setText(JSON.stringify(value, null, 2));
      }
    } catch {
      // If current text is invalid, but we got a new value from outside, we should probably update
      // But usually this happens only on initial load or undo/redo
      setText(JSON.stringify(value, null, 2));
    }
  }, [value]);

  const handleChange = (newText: string) => {
    setText(newText);
    try {
      const parsed = JSON.parse(newText);
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError((e as Error).message);
      // We don't call onChange if invalid, so the parent prop doesn't update,
      // thus preserving the "last valid state" in the preview/data,
      // while the textarea shows the user's work-in-progress.
    }
  };

  return (
    <div>
      <textarea
        className={`w-full p-2 border rounded text-sm font-mono ${
          isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-900'
        } ${error ? 'border-red-500 focus:border-red-500 ring-red-500/20' : 'focus:ring-2 focus:ring-blue-500 outline-none'}`}
        rows={6}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        spellCheck={false}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
