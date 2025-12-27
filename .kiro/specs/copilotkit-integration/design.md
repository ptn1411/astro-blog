# Design Document: CopilotKit Integration

## Overview

Tích hợp CopilotKit vào Story Builder với kiến trúc 2 phần:
1. **Frontend (project hiện tại)**: CopilotKit React components + hooks tích hợp vào Story Builder
2. **Backend (Cloudflare Worker riêng)**: CopilotKit Runtime + Auth middleware + Rate limiting

Kiến trúc này cho phép AI assistant hiểu context của story đang edit và thực hiện các actions trực tiếp như thêm elements, sửa styles, tạo slides mới.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Astro + React)                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  Story Builder  │◄──►│  CopilotKit     │◄──►│  AI Service │ │
│  │  (useStoryBuilder)   │  Provider       │    │  Hook       │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│           │                      │                     │        │
│           ▼                      ▼                     ▼        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              useCopilotReadable / useCopilotAction       │   │
│  │              (Story context + Builder actions)           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS + GitHub Token
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Worker (Separate Project)          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐   │
│  │   CORS      │──►│   Auth      │──►│   Rate Limiter      │   │
│  │   Middleware│   │   Middleware│   │   (KV Storage)      │   │
│  └─────────────┘   └─────────────┘   └─────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CopilotKit Runtime                          │   │
│  │              (Message formatting, streaming)             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   OpenAI API    │
                    └─────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. CopilotProvider Wrapper

```typescript
// src/components/admin/story/ai/CopilotProvider.tsx
interface CopilotProviderProps {
  children: React.ReactNode;
  workerUrl: string;
}

// Wraps Story Builder with CopilotKit context
// Handles authentication token injection
```

#### 2. StoryAIChat Component

```typescript
// src/components/admin/story/ai/StoryAIChat.tsx
interface StoryAIChatProps {
  position?: 'bottom-right' | 'bottom-left';
  defaultOpen?: boolean;
}

// Renders CopilotPopup with custom styling
// Shows auth error if not logged in
```

#### 3. useStoryAI Hook

```typescript
// src/components/admin/story/hooks/useStoryAI.ts
interface UseStoryAIOptions {
  story: Story;
  currentSlide: StorySlide;
  selectedElement: StoryElement | null;
  actions: {
    addElement: (type: ElementType, content: string, extra?: Record<string, unknown>) => void;
    updateElement: (elementId: string, updates: Partial<StoryElement>) => void;
    deleteElement: (elementId: string) => void;
    addSlide: () => void;
    updateSlide: (slideId: string, updates: Partial<StorySlide>) => void;
  };
}

// Registers readable context and callable actions with CopilotKit
```

### Backend Interfaces (Worker)

#### 1. Auth Middleware

```typescript
interface AuthResult {
  authenticated: boolean;
  user?: {
    id: number;
    login: string;
    avatar_url: string;
  };
  error?: string;
}

// Validates GitHub token via GitHub API
// Caches user info in KV for 5 minutes
```

#### 2. Rate Limiter

```typescript
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// Tracks requests per user ID
// Uses Cloudflare KV for distributed state
```

#### 3. Worker Entry Point

```typescript
interface Env {
  OPENAI_API_KEY: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_KV: KVNamespace;
  AUTH_CACHE_KV: KVNamespace;
}

// Handles /api/copilotkit endpoint
// Chains: CORS → Auth → RateLimit → CopilotKit Runtime
```

## Data Models

### AI Context Data

```typescript
// Context sent to AI for understanding current state
interface StoryContext {
  story: {
    id: string;
    title: string;
    slideCount: number;
    currentSlideIndex: number;
  };
  currentSlide: {
    id: string;
    duration: number;
    background: SlideBackground;
    elementCount: number;
    elements: Array<{
      id: string;
      type: ElementType;
      content: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
    }>;
  };
  selectedElement: {
    id: string;
    type: ElementType;
    content: string;
    style: ElementStyle;
  } | null;
}
```

### AI Action Parameters

```typescript
// Parameters for AI-callable actions
interface AddElementParams {
  type: ElementType;
  content: string;
  style?: Partial<ElementStyle>;
  // Type-specific options
  shapeType?: ShapeType;
  buttonHref?: string;
  linkUrl?: string;
}

interface UpdateElementParams {
  elementId: string;
  content?: string;
  style?: Partial<ElementStyle>;
}

interface UpdateSlideParams {
  slideId: string;
  duration?: number;
  background?: Partial<SlideBackground>;
}
```

### Rate Limit Data

```typescript
// Stored in Cloudflare KV
interface RateLimitEntry {
  userId: number;
  count: number;
  windowStart: number; // Unix timestamp
}

// Key format: `ratelimit:${userId}`
// TTL: 1 hour
```

### Auth Cache Data

```typescript
// Stored in Cloudflare KV
interface AuthCacheEntry {
  user: {
    id: number;
    login: string;
    avatar_url: string;
  };
  cachedAt: number;
}

// Key format: `auth:${tokenHash}`
// TTL: 5 minutes
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication Header Inclusion

*For any* request sent from CopilotKit to Worker_Proxy, the request SHALL include an Authorization header with format "Bearer {token}" where token is the GitHub token from localStorage.

**Validates: Requirements 1.2, 4.1**

### Property 2: Invalid Request Rejection

*For any* request to Worker_Proxy with missing, invalid, or expired GitHub token, OR from non-whitelisted origin, the Worker_Proxy SHALL return an appropriate error response (401 for auth, 403 for CORS).

**Validates: Requirements 4.3, 4.5**

### Property 3: Story Context Synchronization

*For any* story state (including title, slides, elements) and any selected element, the CopilotKit readable context SHALL accurately reflect the current state, and SHALL update automatically when state changes.

**Validates: Requirements 2.1, 2.3, 2.4**

### Property 4: Action Registration and Execution

*For any* of the required actions (addElement, updateElement, deleteElement, addSlide), the action SHALL be registered with CopilotKit, and when executed, SHALL immediately update the Story_Builder state.

**Validates: Requirements 3.4, 3.5**

### Property 5: Rate Limit Tracking and Headers

*For any* authenticated user, the Worker_Proxy SHALL track request count per user ID, and when returning 429 response, SHALL include Retry-After header with seconds until reset.

**Validates: Requirements 5.1, 5.4**

### Property 6: AI Provider Error Propagation

*For any* error returned by AI_Provider, the Worker_Proxy SHALL return an appropriate error response to the client with status code and error message.

**Validates: Requirements 6.4**

### Property 7: Graceful Degradation

*For any* AI feature failure (network error, auth error, rate limit, AI error), the Story_Builder core functionality (editing, saving, previewing) SHALL remain fully operational.

**Validates: Requirements 7.4**

### Property 8: Retry with Backoff

*For any* network error during AI request, the CopilotKit SHALL retry with exponential backoff, where each retry delay is greater than the previous.

**Validates: Requirements 7.3**

## Error Handling

### Frontend Error Handling

| Error Type | Detection | User Message | Recovery |
|------------|-----------|--------------|----------|
| No GitHub Token | `getGitHubToken()` returns null | "Vui lòng đăng nhập qua CMS để sử dụng AI" | Show login button |
| Network Error | fetch throws | "Không thể kết nối AI service" | Retry button with backoff |
| Auth Error (401) | Response status 401 | "Phiên đăng nhập hết hạn" | Redirect to CMS login |
| Rate Limited (429) | Response status 429 | "Đã vượt giới hạn. Thử lại sau X phút" | Show countdown |
| AI Error (500) | Response status 5xx | "AI service gặp lỗi. Vui lòng thử lại" | Retry button |

### Backend Error Handling

| Error Type | HTTP Status | Response Body | Headers |
|------------|-------------|---------------|---------|
| Missing Auth | 401 | `{ error: "Missing authorization header" }` | - |
| Invalid Token | 401 | `{ error: "Invalid GitHub token" }` | - |
| CORS Violation | 403 | `{ error: "Origin not allowed" }` | - |
| Rate Limited | 429 | `{ error: "Rate limit exceeded", resetAt: timestamp }` | `Retry-After: seconds` |
| AI Provider Error | 502 | `{ error: "AI service error", details: string }` | - |

## Testing Strategy

### Unit Tests

Unit tests sẽ cover các specific examples và edge cases:

1. **CopilotProvider**: Test initialization với/không có token
2. **useStoryAI hook**: Test context generation từ story state
3. **Auth Middleware**: Test token validation với mock GitHub API
4. **Rate Limiter**: Test counter increment và reset logic

### Property-Based Tests

Property tests sẽ validate các universal properties:

1. **Auth Header Property**: Generate random messages, verify header format
2. **Context Sync Property**: Generate random story states, verify context accuracy
3. **Action Execution Property**: Generate random action params, verify state updates
4. **Error Propagation Property**: Generate random errors, verify proper handling

### Testing Framework

- **Frontend**: Vitest + React Testing Library + fast-check (property testing)
- **Worker**: Vitest + Miniflare (Cloudflare Worker testing) + fast-check

### Test Configuration

```typescript
// Property tests should run minimum 100 iterations
// vitest.config.ts
export default {
  test: {
    // fast-check default numRuns
    testTimeout: 30000, // Allow time for property tests
  }
}
```

