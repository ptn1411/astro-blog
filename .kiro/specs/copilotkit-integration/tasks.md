# Implementation Plan: CopilotKit Integration

## Overview

Tích hợp CopilotKit vào Story Builder với 2 phần: Frontend (project hiện tại) và Backend (Cloudflare Worker riêng). Tasks được chia theo thứ tự: setup → backend → frontend → integration → testing.

## Tasks

- [x] 1. Setup và cấu hình cơ bản
  - [x] 1.1 Cài đặt CopilotKit packages cho frontend
    - Cài `@copilotkit/react-core`, `@copilotkit/react-ui`
    - Cài `fast-check` cho property testing
    - _Requirements: 1.1_
  - [x] 1.2 Tạo cấu hình AI service trong config
    - Thêm `AI_CONFIG` vào `src/components/admin/config.ts`
    - Định nghĩa Worker URL, rate limit settings
    - _Requirements: 6.1_

- [x] 2. Backend - Node.js/Express Server (VPS deployment)
  - [x] 2.1 Khởi tạo Express server project
    - Tạo project với Express, TypeScript
    - Cấu hình environment variables
    - _Requirements: 5.3, 6.2_
  - [x] 2.2 Implement Auth Middleware
    - Validate Authorization header
    - Verify GitHub token via GitHub API
    - Cache user info trong memory (5 phút TTL)
    - _Requirements: 4.1, 4.2, 4.4_
  - [ ]* 2.3 Write property test cho Auth Middleware
    - **Property 2: Invalid Request Rejection**
    - **Validates: Requirements 4.3, 4.5**
  - [x] 2.4 Implement Rate Limiter
    - Sử dụng express-rate-limit
    - Return 429 với Retry-After header khi vượt limit
    - _Requirements: 5.1, 5.2, 5.4_
  - [ ]* 2.5 Write property test cho Rate Limiter
    - **Property 5: Rate Limit Tracking and Headers**
    - **Validates: Requirements 5.1, 5.4**
  - [x] 2.6 Implement CopilotKit Runtime endpoint
    - Setup CORS middleware với cors package
    - Integrate CopilotKit Runtime với OpenAI
    - Handle streaming responses
    - _Requirements: 4.5, 6.3, 6.5_
  - [ ]* 2.7 Write property test cho Error Propagation
    - **Property 6: AI Provider Error Propagation**
    - **Validates: Requirements 6.4**

- [ ] 3. Checkpoint - Backend hoàn thành
  - Ensure all tests pass, ask the user if questions arise.
  - Deploy server lên VPS

- [x] 4. Frontend - CopilotKit Components
  - [x] 4.1 Tạo CopilotProvider wrapper
    - Wrap với CopilotKit provider
    - Inject GitHub token vào headers
    - Handle auth errors
    - _Requirements: 1.1, 1.5_
  - [ ]* 4.2 Write property test cho Auth Header
    - **Property 1: Authentication Header Inclusion**
    - **Validates: Requirements 1.2, 4.1**
  - [x] 4.3 Tạo StoryAIChat component
    - Render CopilotPopup với custom styling
    - Show loading indicator during generation
    - Display error messages
    - _Requirements: 1.3, 1.4, 7.1, 7.2_
  - [x] 4.4 Implement useStoryAI hook
    - Register story context với useCopilotReadable
    - Update context khi story state thay đổi
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ]* 4.5 Write property test cho Context Sync
    - **Property 3: Story Context Synchronization**
    - **Validates: Requirements 2.1, 2.3, 2.4**

- [x] 5. Frontend - AI Actions
  - [x] 5.1 Register addElement action
    - Expose addElement với useCopilotAction
    - Define parameters schema cho AI
    - _Requirements: 3.1, 3.4_
  - [x] 5.2 Register updateElement action
    - Expose updateElement với useCopilotAction
    - Support style và content updates
    - _Requirements: 3.2, 3.4_
  - [x] 5.3 Register slide actions
    - Expose addSlide, updateSlide với useCopilotAction
    - _Requirements: 3.3, 3.4_
  - [ ]* 5.4 Write property test cho Action Execution
    - **Property 4: Action Registration and Execution**
    - **Validates: Requirements 3.4, 3.5**

- [ ] 6. Checkpoint - Frontend hoàn thành
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Error Handling và Resilience
  - [x] 7.1 Implement retry với exponential backoff
    - Retry network errors với increasing delays
    - Max 3 retries
    - _Requirements: 7.3_
  - [ ]* 7.2 Write property test cho Retry Backoff
    - **Property 8: Retry with Backoff**
    - **Validates: Requirements 7.3**
  - [x] 7.3 Implement graceful degradation
    - Story Builder vẫn hoạt động khi AI fail
    - Disable AI features gracefully
    - _Requirements: 7.4_
  - [ ]* 7.4 Write property test cho Graceful Degradation
    - **Property 7: Graceful Degradation**
    - **Validates: Requirements 7.4**
  - [x] 7.5 Handle rate limit UI
    - Display countdown khi bị rate limited
    - Show user-friendly message
    - _Requirements: 5.5_

- [x] 8. Integration và Wiring
  - [x] 8.1 Integrate CopilotProvider vào StoryBuilder
    - Wrap StoryBuilder component với CopilotProvider
    - Pass story state và actions
    - _Requirements: 1.1, 2.1_
  - [x] 8.2 Add StoryAIChat vào Story Builder UI
    - Position chat popup ở bottom-right
    - Style phù hợp với Story Builder theme
    - _Requirements: 1.1_
  - [ ]* 8.3 Write integration tests
    - Test full flow: auth → chat → action execution
    - _Requirements: 1.1, 3.5_

- [ ] 9. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Review và cleanup code

## Notes

- Tasks marked with `*` are optional và có thể skip cho faster MVP
- Backend là Express server trong thư mục `worker/`, deploy lên VPS
- Property tests sử dụng fast-check với minimum 100 iterations
- Server cần deploy trước khi test integration với frontend

