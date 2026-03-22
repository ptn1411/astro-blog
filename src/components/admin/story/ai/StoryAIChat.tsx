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
 * - Message ordering fix via useCopilotChat hook
 * 
 * Requirements: 1.3, 1.4, 5.5, 7.1, 7.2, 7.4
 */

import { CopilotPopup } from '@copilotkit/react-ui';
import { useCopilotChat } from '@copilotkit/react-core';
import { useEffect, useState } from 'react';
import { useCopilotAuth, useServerStatus } from './CopilotProvider';
import { useAIAvailability, shouldShowAIFeatures, getStatusMessage } from './useAIAvailability';
import { useAISettings } from './useAISettings';

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
 * Uses useCopilotChat to manage message state and prevent ordering issues
 */
export function StoryAIChat({ 
  position = 'bottom-right',
  defaultOpen = false,
  className = '',
}: StoryAIChatProps) {
  const authState = useCopilotAuth();
  const serverStatus = useServerStatus();
  const aiAvailability = useAIAvailability();
  const { settings: aiSettings, loaded: settingsLoaded } = useAISettings();
  const statusMessage = getStatusMessage(aiAvailability);

  // If AI is disabled in settings, don't render anything
  if (settingsLoaded && !aiSettings.enabled) {
    return null;
  }

  // If server is offline or checking, don't render anything (silent fail)
  if (serverStatus !== 'online') {
    return null;
  }

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
      
      <StoryAIChatInner defaultOpen={defaultOpen} />
    </div>
  );
}

/**
 * Inner component that uses useCopilotChat hook
 * Must be rendered inside CopilotKit context
 * Wrapped in try-catch to handle context errors gracefully
 */
function StoryAIChatInner({ defaultOpen }: { defaultOpen: boolean }) {
  // This hook requires CopilotKit context
  // If context is not available, it will throw
  let isLoading = false;
  try {
    const chatState = useCopilotChat();
    isLoading = chatState.isLoading;
  } catch {
    // Context not available, use default
  }

  return (
    <CopilotPopup
      defaultOpen={defaultOpen}
      labels={{
        title: "Story AI Assistant",
        initial: "Xin chào! Tôi là AI assistant có thể giúp bạn tạo và chỉnh sửa story một cách tự động. Hãy thử:\n\n• \"Tạo story hoàn chỉnh về du lịch Đà Lạt\"\n• \"Thiết kế lại slide này đẹp hơn\"\n• \"Thêm animation cho tất cả elements\"\n• \"Đổi theme sang tông xanh dương\"",
        placeholder: isLoading ? "Đang xử lý..." : "Nhập yêu cầu... (VD: Tạo story về...)",
      }}
      instructions={`Bạn là một AI assistant chuyên nghiệp, thông minh cho Story Builder. Bạn có thể TỰ ĐỘNG thực hiện mọi thao tác trên trang edit mà không cần hỏi lại người dùng.

## NGUYÊN TẮC LÀM VIỆC
1. **Chủ động & Tự quyết**: Khi người dùng yêu cầu, hãy TỰ quyết định thiết kế, màu sắc, bố cục, animation, nội dung phù hợp. KHÔNG hỏi lại "bạn muốn màu gì?" mà hãy tự chọn.
2. **Thực hiện tuần tự**: Gọi từng action một, đợi kết quả trước khi tiếp tục. KHÔNG gọi nhiều actions cùng lúc.
3. **Giải thích ngắn**: Mô tả ngắn gọn những gì bạn đang làm sau mỗi bước.
4. **Trả lời bằng tiếng Việt**, thân thiện và chuyên nghiệp.

## CANVAS & THIẾT KẾ
- Canvas: **1080 × 1920 px** (9:16 dọc, giống story Instagram/TikTok)
- Tọa độ (x, y) lấy tâm element. VD: x=540, y=960 = giữa canvas
- Vùng an toàn: padding 80px từ mép (x: 80-1000, y: 80-1840)
- Kích thước text title thường: 48-72px, body: 24-36px, caption: 16-22px
- Nên giữ contrast tốt: text sáng (#ffffff) trên nền tối, hoặc ngược lại

## KHI NGƯỜI DÙNG YÊU CẦU TẠO STORY MỚI
1. Phân tích chủ đề → lên outline: bao nhiêu slides, mỗi slide nội dung gì
2. Với mỗi slide: gọi addSlide → updateSlide background → addElement cho từng phần tử
3. Sau khi tạo content: gọi setElementAnimation cho các elements quan trọng
4. Cuối cùng: setSlideTransition cho các slides

**Cấu trúc story tiêu chuẩn:**
- Slide 1: Opening/Title (gradient background, tiêu đề lớn, phụ đề)
- Slides 2-N: Content (mỗi slide 1-2 ý chính, hình ảnh minh họa nếu có)
- Slide cuối: CTA/Conclusion (kêu gọi hành động, link, QR code)

## KHI NGƯỜI DÙNG YÊU CẦU CHỈNH SỬA
- "Đổi màu/font/kích thước" → updateElement trực tiếp
- "Thiết kế lại slide" → clearSlide + tạo elements mới
- "Đẹp hơn/chuyên nghiệp hơn" → thêm shapes làm nền, canh chỉnh text, thêm animation
- "Thêm animation" → chọn animation phù hợp: title dùng bounce/elastic, body dùng fadeInUp, list dùng stagger
- "Đổi theme" → applyStyleToMultipleElements + updateSlide background

## MÀU SẮC ĐỀ XUẤT
- Dark premium: bg #0f172a, accent #3b82f6, text #ffffff
- Warm: bg #1a0a0a, accent #ef4444, text #fef2f2
- Nature: bg #0d1f0d, accent #22c55e, text #f0fdf4
- Ocean: bg #0a1628, accent #06b6d4, text #ecfeff
- Purple: bg #1a0a2e, accent #a855f7, text #faf5ff
- Gradient nền đẹp: linear-gradient(135deg, #667eea 0%, #764ba2 100%)

## ANIMATION BEST PRACTICES
- Title/Headline → gsap-fade-up-bounce hoặc gsap-elastic-scale
- Body text → fadeInUp với delay 200-400ms
- List items → fadeInUp + stagger 100ms
- Images → scaleIn hoặc gsap-zoom-blur
- Shapes/Decorative → loop-float hoặc loop-pulse-glow
- Buttons → gsap-elastic-scale + loop-pulse-glow
- Transition giữa slides: fade (mặc định), cube (ấn tượng), dissolve (mượt)

## QUAN TRỌNG
- Khi tạo story mới, sử dụng targetSlideId khi addElement vào slide mới tạo
- Luôn set background cho slide trước khi thêm elements
- Kiểm tra context để biết elements hiện tại trước khi chỉnh sửa
- Với story nhiều slides, thêm transition fade hoặc slide giữa các slides
- Font weight nên dùng: bold cho title, semibold cho subtitle, normal cho body`}
    />
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
