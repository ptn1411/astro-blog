import React, { type FC } from "react";

interface ThreadItem {
  id: string;
  title: string;
  createdAt: Date;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  threads: ThreadItem[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string) => void;
}

export const Sidebar: FC<SidebarProps> = ({
  isOpen,
  onToggle,
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
}) => {
  return (
    <aside
      className={`
        ${isOpen ? "w-64" : "w-0"}
        h-full bg-gray-50 dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800
        flex flex-col transition-all duration-200 flex-shrink-0 overflow-hidden
        max-md:absolute max-md:top-0 max-md:left-0 max-md:z-50 max-md:h-full
        ${!isOpen ? "max-md:-translate-x-full max-md:w-64" : "max-md:shadow-2xl"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 flex-shrink-0">
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white transition-all cursor-pointer"
          onClick={onToggle}
          title="Đóng sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white transition-all cursor-pointer"
          onClick={onNewThread}
          title="Cuộc trò chuyện mới"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider px-2 pt-3 pb-1.5">
          Gần đây
        </div>
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={`
              group flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm relative
              ${thread.id === activeThreadId
                ? "bg-gray-200 dark:bg-slate-800 text-slate-900 dark:text-white"
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50"
              }
            `}
            onClick={() => onSelectThread(thread.id)}
          >
            <svg className="w-4 h-4 flex-shrink-0 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="flex-1 truncate">{thread.title}</span>
            <button
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteThread(thread.id);
              }}
              title="Xóa"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
};
