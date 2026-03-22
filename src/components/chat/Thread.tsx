import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  AttachmentPrimitive,
  AuiIf,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import React, { useState, useEffect, useRef, createContext, useContext, type FC } from "react";

// Context to pass file data from children render to components render
const AttachmentFileCtx = createContext<Map<string, File>>(new Map());

// ─── Thread ──────────────────────────────────────────
export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root className="flex flex-col flex-1 min-h-0">
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto scroll-smooth">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <ThreadWelcome />
        </AuiIf>

        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessage,
            AssistantMessage: AssistantMessage,
          }}
        />

        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 px-3 pb-4 pt-2 bg-gradient-to-t from-white via-white dark:from-slate-900 dark:via-slate-900 to-transparent">
          <ThreadScrollToBottom />
          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

// ─── Welcome ─────────────────────────────────────────
const ThreadWelcome: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fadeInUp">
      <div className="w-12 h-12 text-primary mb-6 animate-float">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2 tracking-tight">
        Xin chào! Tôi có thể giúp gì?
      </h1>
      <p className="text-base text-muted mb-8 max-w-md">
        Hỏi bất cứ điều gì — lập trình, viết lách, phân tích, hay sáng tạo.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
        <ThreadPrimitive.Suggestion prompt="Astro là gì và tại sao nên dùng cho blog cá nhân?" method="replace" autoSend>
          <SuggestionCard icon="🚀" text="Tại sao chọn Astro cho blog?" />
        </ThreadPrimitive.Suggestion>
        <ThreadPrimitive.Suggestion prompt="Viết cho tôi một bài blog về lập trình Rust cho người mới bắt đầu" method="replace" autoSend>
          <SuggestionCard icon="🦀" text="Viết bài blog về Rust" />
        </ThreadPrimitive.Suggestion>
        <ThreadPrimitive.Suggestion prompt="Giải thích cách hoạt động của WebAssembly (WASM) và ứng dụng thực tế" method="replace" autoSend>
          <SuggestionCard icon="⚙️" text="WebAssembly là gì?" />
        </ThreadPrimitive.Suggestion>
        <ThreadPrimitive.Suggestion prompt="Gợi ý ý tưởng bài viết cho blog lập trình và công nghệ" method="replace" autoSend>
          <SuggestionCard icon="✍️" text="Ý tưởng bài viết mới" />
        </ThreadPrimitive.Suggestion>
      </div>
    </div>
  );
};

const SuggestionCard: FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-all text-sm text-slate-700 dark:text-slate-300 hover:-translate-y-0.5">
    <span className="text-lg flex-shrink-0">{icon}</span>
    <span>{text}</span>
  </div>
);

// ─── ScrollToBottom ──────────────────────────────────
const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-slate-600 dark:text-white flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 shadow-md z-10 transition-all">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </ThreadPrimitive.ScrollToBottom>
  );
};

// ─── Composer ────────────────────────────────────────
const Composer: FC = () => {
  const fileMapRef = useRef<Map<string, File>>(new Map());
  const [, forceUpdate] = useState(0);

  return (
    <ComposerPrimitive.Root className="max-w-3xl mx-auto w-full">
      {/* Hidden: collect file refs from children render */}
      <div style={{ display: "none" }}>
        <ComposerPrimitive.Attachments>
          {({ attachment }) => {
            if (attachment.file && !fileMapRef.current.has(attachment.id)) {
              fileMapRef.current.set(attachment.id, attachment.file);
              forceUpdate((n) => n + 1);
            }
            return null;
          }}
        </ComposerPrimitive.Attachments>
      </div>
      {/* Visible: render with AttachmentPrimitive context for Remove */}
      <AttachmentFileCtx.Provider value={fileMapRef.current}>
        <div className="flex flex-wrap px-1">
          <ComposerPrimitive.Attachments
            components={{ Attachment: AttachmentCard }}
          />
        </div>
      </AttachmentFileCtx.Provider>
      <div className="flex items-end gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-3 py-2 transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
        {/* Upload button */}
        <ComposerPrimitive.AddAttachment className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-all flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </ComposerPrimitive.AddAttachment>

        <ComposerPrimitive.Input
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 text-[0.9375rem] leading-relaxed resize-none max-h-[200px] py-1.5 px-1 placeholder:text-gray-400 dark:placeholder:text-slate-500"
          autoFocus
          addAttachmentOnPaste
        />
        <ComposerPrimitive.Send className="w-8 h-8 rounded-lg bg-primary hover:bg-secondary text-white flex items-center justify-center cursor-pointer transition-all flex-shrink-0 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

// ─── Attachment Card ─────────────────────────────────
const AttachmentCard: FC = () => {
  const fileMap = useContext(AttachmentFileCtx);
  // Get attachment name to find the file - AttachmentPrimitive.Name renders the name for us
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Find the file from our map - iterate to find a match
  const file = [...fileMap.values()].find((f) => f.type?.startsWith("image/"));

  useEffect(() => {
    if (!file || !file.type?.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <AttachmentPrimitive.Root className="group relative inline-flex items-center gap-2 px-3 py-2 mb-2 mr-2 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300">
      {previewUrl ? (
        <img src={previewUrl} alt="preview" className="w-10 h-10 rounded object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-gray-500 dark:text-slate-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
      )}
      <span className="truncate max-w-[150px]"><AttachmentPrimitive.Name /></span>
      <AttachmentPrimitive.Remove className="w-5 h-5 rounded-full bg-gray-300 dark:bg-slate-600 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 hover:text-red-500 flex items-center justify-center cursor-pointer transition-all text-xs flex-shrink-0">
        ✕
      </AttachmentPrimitive.Remove>
    </AttachmentPrimitive.Root>
  );
};

// ─── User Message ────────────────────────────────────
const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="flex gap-4 py-5 px-4 max-w-3xl mx-auto w-full">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div className="flex-1 min-w-0 leading-7 text-[0.9375rem] text-slate-900 dark:text-slate-100">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
};

// ─── Typing Indicator ────────────────────────────────
const TypingIndicator: FC = () => (
  <div className="flex items-center gap-1 py-1">
    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
  </div>
);

// ─── Assistant Message ───────────────────────────────
const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="group flex gap-4 py-5 px-4 max-w-3xl mx-auto w-full">
      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className="flex-1 min-w-0 leading-7 text-[0.9375rem] text-slate-800 dark:text-slate-200 prose prose-slate dark:prose-invert prose-sm max-w-none prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800 prose-pre:rounded-xl prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-slate-700 prose-code:text-orange-600 dark:prose-code:text-orange-400 prose-a:text-primary">
        <MessagePrimitive.Content
          components={{
            Text: ({ text: _text }) => <MarkdownTextPrimitive />,
          }}
        />
        <AuiIf condition={(s) => s.message.isLast && s.thread.isRunning}>
          <TypingIndicator />
        </AuiIf>
        <AuiIf condition={(s) => !(s.message.isLast && s.thread.isRunning)}>
          <AssistantActionBar />
        </AuiIf>
      </div>
    </MessagePrimitive.Root>
  );
};

// ─── Assistant Action Bar ────────────────────────────
const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" hideWhenRunning autohide="not-last">
      <ActionBarPrimitive.Copy className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-gray-700 dark:hover:text-white cursor-pointer transition-all">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-gray-700 dark:hover:text-white cursor-pointer transition-all">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};
