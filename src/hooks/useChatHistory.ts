/**
 * useChatHistory — persist chat threads in localStorage (max 10)
 *
 * Shape:
 *   localStorage["chat_threads"] → PersistedThread[]
 *
 * Auto-features:
 *   - Thread title = first user message (truncated to 60 chars)
 *   - FIFO eviction: oldest thread removed when > MAX_THREADS
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'chat_threads';
const MAX_THREADS = 10;

export interface PersistedMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface PersistedThread {
  id: string;
  title: string;
  createdAt: number;
  messages: PersistedMessage[];
}

// ── Storage helpers ────────────────────────────────────────────────────────────

function loadFromStorage(): PersistedThread[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(threads: PersistedThread[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // Storage quota exceeded — remove oldest to free space
    const trimmed = threads.slice(0, Math.max(1, threads.length - 1));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
}

function extractTitle(messages: PersistedMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser?.content) return 'Cuộc trò chuyện mới';
  const text = firstUser.content.trim();
  return text.length > 60 ? text.slice(0, 57) + '…' : text;
}

function makeThread(overrides?: Partial<PersistedThread>): PersistedThread {
  return {
    id: Date.now().toString(),
    title: 'Cuộc trò chuyện mới',
    createdAt: Date.now(),
    messages: [],
    ...overrides,
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useChatHistory() {
  const [threads, setThreads] = useState<PersistedThread[]>(() => {
    const stored = loadFromStorage();
    if (stored.length > 0) return stored;
    // First visit: create a blank thread
    const initial = makeThread();
    saveToStorage([initial]);
    return [initial];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(
    () => loadFromStorage()[0]?.id ?? makeThread().id
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  const addThread = useCallback(() => {
    const fresh = makeThread();
    setThreads((prev) => {
      // Keep only MAX_THREADS-1 existing + new one (remove oldest from end)
      const trimmed = [fresh, ...prev].slice(0, MAX_THREADS);
      saveToStorage(trimmed);
      return trimmed;
    });
    setActiveThreadId(fresh.id);
    return fresh.id;
  }, []);

  const deleteThread = useCallback(
    (id: string) => {
      setThreads((prev) => {
        const next = prev.filter((t) => t.id !== id);
        // If deleted was active → switch to first remaining
        setActiveThreadId((cur) => {
          if (cur === id) {
            const fallback = next[0] ?? makeThread();
            if (next.length === 0) {
              const brand = makeThread();
              saveToStorage([brand]);
              setThreads([brand]);
              return brand.id;
            }
            return fallback.id;
          }
          return cur;
        });
        saveToStorage(next);
        return next;
      });
    },
    []
  );

  const saveMessages = useCallback(
    (threadId: string, messages: PersistedMessage[]) => {
      setThreads((prev) => {
        const next = prev.map((t) => {
          if (t.id !== threadId) return t;
          return {
            ...t,
            title: t.title === 'Cuộc trò chuyện mới' ? extractTitle(messages) : t.title,
            messages,
          };
        });
        saveToStorage(next);
        return next;
      });
    },
    []
  );

  const getMessages = useCallback(
    (threadId: string): PersistedMessage[] => {
      // Read directly from storage so we always get latest across re-renders
      return loadFromStorage().find((t) => t.id === threadId)?.messages ?? [];
    },
    []
  );

  return {
    threads,
    activeThreadId,
    setActiveThreadId,
    addThread,
    deleteThread,
    saveMessages,
    getMessages,
  };
}
