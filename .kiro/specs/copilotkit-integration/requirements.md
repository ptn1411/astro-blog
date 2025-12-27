# Requirements Document

## Introduction

Tích hợp CopilotKit vào Story Builder để cung cấp AI assistant giúp người dùng tạo và chỉnh sửa stories. Hệ thống sử dụng Cloudflare Worker làm backend proxy để bảo mật API keys và xác thực người dùng thông qua GitHub token hiện có.

## Glossary

- **Story_Builder**: Ứng dụng React cho phép tạo và chỉnh sửa stories với các slides và elements
- **CopilotKit**: Framework React để tích hợp AI assistants vào ứng dụng
- **Worker_Proxy**: Cloudflare Worker đóng vai trò proxy giữa frontend và AI providers
- **GitHub_Token**: Access token từ Sveltia CMS OAuth flow, lưu trong localStorage
- **AI_Provider**: Dịch vụ AI như OpenAI hoặc Anthropic cung cấp LLM capabilities
- **Rate_Limiter**: Cơ chế giới hạn số lượng requests per user trong khoảng thời gian

## Requirements

### Requirement 1: AI Chat Interface

**User Story:** As a content creator, I want to chat with an AI assistant while building stories, so that I can get suggestions and generate content quickly.

#### Acceptance Criteria

1. WHEN the Story_Builder loads, THE CopilotKit SHALL initialize with a chat popup component
2. WHEN a user sends a message to the AI, THE CopilotKit SHALL forward the request to Worker_Proxy with GitHub_Token in Authorization header
3. WHEN the AI responds, THE CopilotKit SHALL display the response in the chat interface with streaming support
4. WHILE the AI is generating a response, THE CopilotKit SHALL show a loading indicator
5. IF the user is not authenticated (no GitHub_Token), THEN THE CopilotKit SHALL display an error message prompting login

### Requirement 2: Story Context Awareness

**User Story:** As a content creator, I want the AI to understand my current story context, so that it can provide relevant suggestions.

#### Acceptance Criteria

1. THE CopilotKit SHALL provide current story data (title, slides, elements) as readable context to the AI
2. WHEN the user asks about the current story, THE AI SHALL have access to story structure and content
3. WHEN the user selects an element, THE CopilotKit SHALL include selected element details in the context
4. THE CopilotKit SHALL update context automatically when story state changes

### Requirement 3: AI-Powered Content Generation

**User Story:** As a content creator, I want the AI to generate and modify story content directly, so that I can create stories faster.

#### Acceptance Criteria

1. WHEN the AI suggests adding a text element, THE CopilotKit SHALL call the addElement action with appropriate parameters
2. WHEN the AI suggests modifying an element's style, THE CopilotKit SHALL call the updateElement action
3. WHEN the AI suggests adding a new slide, THE CopilotKit SHALL call the addSlide action
4. THE CopilotKit SHALL expose story builder actions (addElement, updateElement, addSlide, deleteElement) as callable AI actions
5. WHEN an AI action is executed, THE Story_Builder SHALL update immediately and reflect changes on canvas

### Requirement 4: Worker Proxy Authentication

**User Story:** As a system administrator, I want to secure the AI proxy endpoint, so that only authenticated users can access AI features.

#### Acceptance Criteria

1. WHEN a request arrives at Worker_Proxy, THE Worker_Proxy SHALL validate the Authorization header contains a valid GitHub_Token
2. WHEN validating GitHub_Token, THE Worker_Proxy SHALL call GitHub API to verify token and get user info
3. IF GitHub_Token is invalid or missing, THEN THE Worker_Proxy SHALL return 401 Unauthorized response
4. THE Worker_Proxy SHALL cache validated user info for 5 minutes to reduce GitHub API calls
5. THE Worker_Proxy SHALL only accept requests from whitelisted origins (CORS)

### Requirement 5: Rate Limiting

**User Story:** As a system administrator, I want to limit AI usage per user, so that I can control costs and prevent abuse.

#### Acceptance Criteria

1. THE Worker_Proxy SHALL track request count per GitHub user ID
2. WHEN a user exceeds 100 requests per hour, THE Worker_Proxy SHALL return 429 Too Many Requests
3. THE Rate_Limiter SHALL use Cloudflare KV or Durable Objects for distributed state
4. WHEN rate limit is exceeded, THE Worker_Proxy SHALL include Retry-After header in response
5. THE CopilotKit SHALL display user-friendly message when rate limited

### Requirement 6: AI Provider Integration

**User Story:** As a system administrator, I want to configure which AI provider to use, so that I can choose the best model for my needs.

#### Acceptance Criteria

1. THE Worker_Proxy SHALL support OpenAI as the primary AI_Provider
2. THE Worker_Proxy SHALL store AI_Provider API keys securely in Cloudflare secrets
3. WHEN forwarding requests to AI_Provider, THE Worker_Proxy SHALL use CopilotKit Runtime for proper message formatting
4. IF AI_Provider returns an error, THEN THE Worker_Proxy SHALL return appropriate error response to client
5. THE Worker_Proxy SHALL support streaming responses from AI_Provider

### Requirement 7: Error Handling and Resilience

**User Story:** As a content creator, I want clear error messages when something goes wrong, so that I can understand and resolve issues.

#### Acceptance Criteria

1. IF Worker_Proxy is unreachable, THEN THE CopilotKit SHALL display "AI service unavailable" message
2. IF AI_Provider returns an error, THEN THE CopilotKit SHALL display the error message to user
3. WHEN network errors occur, THE CopilotKit SHALL allow retry with exponential backoff
4. THE CopilotKit SHALL not block Story_Builder functionality when AI features fail
5. IF authentication fails, THEN THE CopilotKit SHALL prompt user to re-login via Sveltia CMS

