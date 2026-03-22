import { useState } from 'react';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useSecureRuntime } from '~/hooks/useSecureRuntime';
import { Sidebar } from './Sidebar';
import { Thread } from './Thread';

// Thread data type
interface ThreadItem {
  id: string;
  title: string;
  createdAt: Date;
}

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 text-sm">
      <div className="w-8 h-8 border-2 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      <span>Đang khởi tạo phiên bảo mật…</span>
    </div>
  );
}

// ── Error screen ──────────────────────────────────────────────────────────────
function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-red-500 text-sm px-6 text-center">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>Không thể kết nối proxy: {error}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MyAssistant() {
  const { runtime, isReady, error } = useSecureRuntime();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [threads, setThreads] = useState<ThreadItem[]>([
    { id: '1', title: 'Cuộc trò chuyện mới', createdAt: new Date() },
  ]);
  const [activeThreadId, setActiveThreadId] = useState('1');

  const handleNewThread = () => {
    const newThread: ThreadItem = {
      id: Date.now().toString(),
      title: 'Cuộc trò chuyện mới',
      createdAt: new Date(),
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  };

  const handleDeleteThread = (id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeThreadId === id && threads.length > 1) {
      const remaining = threads.filter((t) => t.id !== id);
      setActiveThreadId(remaining[0]?.id || '');
    }
  };

  if (!isReady && !error) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-[calc(100vh-64px)] w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 relative overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={setActiveThreadId}
          onNewThread={handleNewThread}
          onDeleteThread={handleDeleteThread}
        />
        <main className="flex-1 flex flex-col min-w-0 h-full">
          {/* Topbar */}
          <div className="flex items-center gap-2 px-3 h-12 flex-shrink-0 border-b border-gray-100 dark:border-slate-800">
            {!sidebarOpen && (
              <button
                className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white transition-all cursor-pointer"
                onClick={() => setSidebarOpen(true)}
                title="Mở sidebar"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
              </button>
            )}
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">AI Assistant</span>
          </div>
          <Thread />
        </main>
      </div>
    </AssistantRuntimeProvider>
  );
}
