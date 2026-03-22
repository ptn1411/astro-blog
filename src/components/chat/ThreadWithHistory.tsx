/**
 * ThreadWithHistory — wraps <Thread /> and syncs messages to localStorage
 *
 * Uses `useThread()` from @assistant-ui/react to observe all messages,
 * then calls onMessagesChange to trigger persistence after each update.
 */

import { useEffect, useCallback } from 'react';
import { useThread } from '@assistant-ui/react';
import { Thread } from './Thread';
import type { PersistedMessage } from '~/hooks/useChatHistory';

interface ThreadWithHistoryProps {
  threadId: string;
  onMessagesChange: (threadId: string, messages: PersistedMessage[]) => void;
}

// Sits inside AssistantRuntimeProvider — has access to thread context
function MessageSyncer({ threadId, onMessagesChange }: ThreadWithHistoryProps) {
  const thread = useThread();

  const sync = useCallback(() => {
    const { messages, isRunning } = thread;

    // Don't persist while AI is still streaming
    if (isRunning) return;
    if (!messages || messages.length === 0) return;

    const persisted: PersistedMessage[] = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => {
        const textContent = m.content
          .filter((c) => c.type === 'text')
          .map((c) => (c as { type: 'text'; text: string }).text)
          .join('');
        return {
          role: m.role as 'user' | 'assistant',
          content: textContent,
          createdAt: Date.now(),
        };
      })
      .filter((m) => m.content.length > 0);

    if (persisted.length > 0) {
      onMessagesChange(threadId, persisted);
    }
  }, [thread, threadId, onMessagesChange]);

  useEffect(() => {
    sync();
  }, [sync]);

  return null;
}

export function ThreadWithHistory({ threadId, onMessagesChange }: ThreadWithHistoryProps) {
  return (
    <>
      <MessageSyncer threadId={threadId} onMessagesChange={onMessagesChange} />
      <Thread />
    </>
  );
}
