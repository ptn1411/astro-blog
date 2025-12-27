/**
 * StoryAIChat - AI Chat Interface for Story Builder
 * 
 * Renders CopilotPopup with custom styling for Story Builder.
 * Handles:
 * - Loading indicator during AI generation
 * - Error message display
 * - Auth error prompts
 * - Graceful degradation when AI is unavailable
 * - Rate limit countdown display
 * 
 * Requirements: 1.3, 1.4, 5.5, 7.1, 7.2, 7.4
 */

import { CopilotPopup } from '@copilotkit/react-ui';
import React, { useEffect, useState } from 'react';
import { useCopilotAuth } from './CopilotProvider';
import { useAIAvailability, shouldShowAIFeatures, getStatusMessage } from './useAIAvailability';

// Import CopilotKit styles
import '@copilotkit/react-ui/styles.css';

export interface StoryAIChatProps {
  /** Position of the chat popup */
  position?: 'bottom-right' | 'bottom-left';
  /** Whether the popup is open by default */
  defaultOpen?: boolean;
  /** Custom class name for styling */
  className?: string;
}

/**
 * StoryAIChat renders the AI chat interface
 * Shows auth error if user is not logged in
 * Handles graceful degradation when AI is unavailable
 */
export function StoryAIChat({ 
  position = 'bottom-right',
  defaultOpen = false,
  className = '',
}: StoryAIChatProps) {
  const authState = useCopilotAuth();
  const aiAvailability = useAIAvailability();
  const statusMessage = getStatusMessage(aiAvailability);

  // If not authenticated, show auth error message
  if (!authState.isAuthenticated && !authState.isLoading) {
    return (
      <div 
        className={`fixed ${position === 'bottom-right' ? 'right-4' : 'left-4'} bottom-4 z-50 ${className}`}
      >
        <AuthErrorButton error={authState.error} />
      </div>
    );
  }

  // If loading, show nothing
  if (authState.isLoading) {
    return null;
  }

  // If AI is unavailable, show disabled state
  if (!shouldShowAIFeatures(aiAvailability.status)) {
    return (
      <div 
        className={`fixed ${position === 'bottom-right' ? 'right-4' : 'left-4'} bottom-4 z-50 ${className}`}
      >
        <AIUnavailableButton 
          status={aiAvailability.status}
          message={statusMessage}
          retryAfter={aiAvailability.error?.retryAfter}
          onRetry={aiAvailability.resetError}
        />
      </div>
    );
  }

  return (
    <div className={`story-ai-chat ${className}`}>
      {/* Status banner for degraded state */}
      {aiAvailability.status === 'degraded' && statusMessage && (
        <AIStatusBanner message={statusMessage} />
      )}
      
      <CopilotPopup
        defaultOpen={defaultOpen}
        labels={{
          title: "Story AI Assistant",
          initial: "Xin chào! Tôi có thể giúp bạn tạo và chỉnh sửa story. Hãy hỏi tôi bất cứ điều gì!",
          placeholder: "Nhập tin nhắn...",
        }}
        instructions={`Bạn là AI assistant giúp người dùng tạo và chỉnh sửa stories.
Bạn có thể:
- Thêm các elements mới (text, image, shape, button, etc.)
- Chỉnh sửa style của elements (màu sắc, font, vị trí, kích thước)
- Thêm slides mới
- Gợi ý nội dung và thiết kế

Hãy trả lời bằng tiếng Việt và thân thiện với người dùng.
Khi thực hiện actions, hãy giải thích ngắn gọn những gì bạn đang làm.`}
      />
    </div>
  );
}

/**
 * AuthErrorButton - Shows when user is not authenticated
 */
function AuthErrorButton({ error }: { error: string | null }) {
  const handleClick = () => {
    // Redirect to CMS login
    window.location.href = '/admin/';
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-lg transition-colors"
      title={error || 'Đăng nhập để sử dụng AI'}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M3.6 9h16.8a1 1 0 0 1 .9 1.45l-8.4 14.48a1 1 0 0 1-1.8 0L2.7 10.45A1 1 0 0 1 3.6 9z" />
      </svg>
      <span className="text-sm font-medium">Đăng nhập để dùng AI</span>
    </button>
  );
}

/**
 * AIUnavailableButton - Shows when AI features are unavailable
 * Includes rate limit countdown when applicable
 */
interface AIUnavailableButtonProps {
  status: string;
  message: string | null;
  retryAfter?: number;
  onRetry: () => void;
}

function AIUnavailableButton({ status, message, retryAfter, onRetry }: AIUnavailableButtonProps) {
  const [countdown, setCountdown] = useState(retryAfter || 0);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (status !== 'rate_limited' || !retryAfter) {
      setCountdown(0);
      return;
    }

    setCountdown(retryAfter);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onRetry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, retryAfter, onRetry]);

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const isRateLimited = status === 'rate_limited';
  const isAuthError = status === 'auth_error';

  const handleClick = () => {
    if (isAuthError) {
      window.location.href = '/admin/';
    } else if (!isRateLimited) {
      onRetry();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isRateLimited && countdown > 0}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-colors ${
        isRateLimited 
          ? 'bg-orange-500 text-white cursor-not-allowed' 
          : isAuthError
            ? 'bg-amber-500 hover:bg-amber-600 text-white'
            : 'bg-gray-500 hover:bg-gray-600 text-white'
      }`}
      title={message || 'AI không khả dụng'}
    >
      {isRateLimited ? (
        <ClockIcon />
      ) : isAuthError ? (
        <WarningIcon />
      ) : (
        <DisabledIcon />
      )}
      <span className="text-sm font-medium">
        {isRateLimited && countdown > 0 
          ? `Thử lại sau ${formatCountdown(countdown)}`
          : isAuthError
            ? 'Đăng nhập lại'
            : 'AI không khả dụng'
        }
      </span>
    </button>
  );
}

/**
 * AIStatusBanner - Shows status message for degraded state
 */
function AIStatusBanner({ message }: { message: string }) {
  return (
    <div className="fixed bottom-20 right-4 z-40 max-w-xs">
      <div className="bg-yellow-500/90 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <WarningIcon size={14} />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}

// Icon components
function WarningIcon({ size = 20 }: { size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M3.6 9h16.8a1 1 0 0 1 .9 1.45l-8.4 14.48a1 1 0 0 1-1.8 0L2.7 10.45A1 1 0 0 1 3.6 9z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function DisabledIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

export default StoryAIChat;
