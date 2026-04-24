import { Search, CornerDownLeft } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetSchema } from '../../config/registry';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetSchema[];
  onAddWidget: (type: string) => void;
  isDarkMode: boolean;
}

function fuzzyMatch(query: string, text: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t === q) return 1000;
  if (t.startsWith(q)) return 500;
  if (t.includes(q)) return 250;

  let qi = 0;
  let score = 0;
  let streak = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      streak++;
      score += 1 + streak;
    } else {
      streak = 0;
    }
  }
  return qi === q.length ? score : 0;
}

export function CommandPalette({ isOpen, onClose, widgets, onAddWidget, isDarkMode }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) {
      return widgets.slice(0, 30);
    }
    return widgets
      .map((w) => {
        const labelScore = fuzzyMatch(query, w.label) * 2;
        const typeScore = fuzzyMatch(query, w.type);
        const categoryScore = fuzzyMatch(query, w.category) * 0.5;
        return { widget: w, score: Math.max(labelScore, typeScore, categoryScore) };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((r) => r.widget);
  }, [query, widgets]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  const commit = (type: string) => {
    onAddWidget(type);
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const picked = results[activeIndex];
      if (picked) commit(picked.type);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKey}
        className={`w-full max-w-xl rounded-xl shadow-2xl border overflow-hidden ${
          isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div
          className={`flex items-center gap-3 px-4 py-3 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <Search size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm widget để thêm… (Esc để đóng)"
            className={`flex-1 bg-transparent outline-none text-base ${
              isDarkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            }`}
          />
          <kbd
            className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded font-mono ${
              isDarkMode ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1">
          {results.length === 0 && (
            <div className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Không tìm thấy widget nào khớp với "{query}"
            </div>
          )}
          {results.map((w, idx) => {
            const Icon = w.icon;
            const active = idx === activeIndex;
            return (
              <div
                key={w.type}
                data-idx={idx}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => commit(w.type)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${
                  active
                    ? isDarkMode
                      ? 'bg-blue-500/20 text-blue-100'
                      : 'bg-blue-50 text-blue-900'
                    : isDarkMode
                      ? 'text-gray-200 hover:bg-gray-800'
                      : 'text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                    active
                      ? isDarkMode
                        ? 'bg-blue-500/30 text-blue-200'
                        : 'bg-blue-100 text-blue-700'
                      : isDarkMode
                        ? 'bg-gray-800 text-gray-400'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {Icon ? <Icon size={16} /> : <span className="text-xs font-bold">{w.type[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{w.label}</div>
                  <div className={`text-xs truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {w.category} · {w.type}
                  </div>
                </div>
                {active && (
                  <CornerDownLeft size={14} className={isDarkMode ? 'text-blue-300' : 'text-blue-600'} />
                )}
              </div>
            );
          })}
        </div>

        <div
          className={`flex items-center justify-between px-4 py-2 text-[11px] border-t ${
            isDarkMode ? 'border-gray-700 text-gray-500 bg-gray-900/50' : 'border-gray-100 text-gray-500 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono">↑↓</kbd> chọn
            </span>
            <span>
              <kbd className="font-mono">Enter</kbd> thêm
            </span>
            <span>
              <kbd className="font-mono">Esc</kbd> đóng
            </span>
          </div>
          <span>{results.length} widget</span>
        </div>
      </div>
    </div>
  );
}
