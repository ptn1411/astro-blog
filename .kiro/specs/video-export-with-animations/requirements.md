# Requirements Document

## Introduction

Tính năng export video MP4 với đầy đủ hiệu ứng CSS/JS animations từ Story Builder. Hiện tại, hàm `handleRenderHighQuality` sử dụng `html2canvas` để capture từng frame nhưng không capture được animations đang chạy vì `html2canvas` chỉ capture trạng thái tĩnh của DOM.

## Glossary

- **Video_Exporter**: Module xử lý việc xuất video từ story slides
- **Animation_Controller**: Module điều khiển animation state theo timeline thay vì để animation tự chạy
- **Frame_Renderer**: Module capture từng frame của canvas tại thời điểm cụ thể
- **Timeline_Seeker**: Cơ chế di chuyển animation đến thời điểm cụ thể trong timeline

## Requirements

### Requirement 1: Timeline-based Animation Control

**User Story:** As a user, I want animations to be rendered correctly in exported video, so that the video looks exactly like the preview.

#### Acceptance Criteria

1. WHEN exporting video, THE Animation_Controller SHALL calculate animation state based on current frame time instead of running animations in real-time
2. WHEN an element has enter animation, THE Animation_Controller SHALL compute the correct CSS transform/opacity values for the given timestamp
3. WHEN an element's animation has not started yet (currentTime < animation.delay), THE Frame_Renderer SHALL render the element in its initial hidden state
4. WHEN an element's animation is in progress, THE Frame_Renderer SHALL render the element with interpolated animation values
5. WHEN an element's animation has completed, THE Frame_Renderer SHALL render the element in its final visible state

### Requirement 2: Animation State Computation

**User Story:** As a developer, I want a utility to compute animation state at any given time, so that I can render accurate frames.

#### Acceptance Criteria

1. THE Animation_Controller SHALL support computing state for fadeIn, fadeOut, fadeInUp, fadeInDown animations
2. THE Animation_Controller SHALL support computing state for slideInLeft, slideInRight, slideInUp, slideInDown animations
3. THE Animation_Controller SHALL support computing state for scaleIn, zoomIn, bounceIn animations
4. THE Animation_Controller SHALL apply easing functions (linear, ease, ease-in, ease-out, ease-in-out) to animation progress
5. WHEN computing animation state, THE Animation_Controller SHALL return CSS properties (opacity, transform) as inline styles

### Requirement 3: Render Mode Enhancement

**User Story:** As a user, I want the render container to display animations correctly at each frame time, so that html2canvas can capture them.

#### Acceptance Criteria

1. WHEN renderMode is true, THE CanvasElement SHALL compute and apply animation styles based on currentTime prop
2. WHEN renderMode is true, THE CanvasElement SHALL NOT use CSS animation classes (which run in real-time)
3. WHEN renderMode is true, THE CanvasElement SHALL apply computed inline styles for transform and opacity
4. THE Frame_Renderer SHALL wait for DOM to update before capturing each frame

### Requirement 4: Multi-slide Export

**User Story:** As a user, I want to export all slides in my story as a single video, so that I can share the complete story.

#### Acceptance Criteria

1. WHEN exporting, THE Video_Exporter SHALL render all slides sequentially
2. WHEN transitioning between slides, THE Video_Exporter SHALL apply slide transition effects
3. THE Video_Exporter SHALL display progress for total frames across all slides
4. IF a slide has audio, THE Video_Exporter SHALL include audio track in the exported video (optional enhancement)

### Requirement 5: Export Quality Options

**User Story:** As a user, I want to choose export quality settings, so that I can balance file size and quality.

#### Acceptance Criteria

1. THE Video_Exporter SHALL support 720p (720x1280), 1080p (1080x1920), and 4K (2160x3840) resolutions
2. THE Video_Exporter SHALL support 24fps, 30fps, and 60fps frame rates
3. THE Video_Exporter SHALL allow bitrate selection (2Mbps, 4Mbps, 8Mbps)
4. WHEN user selects quality options, THE Video_Exporter SHALL use those settings for encoding
