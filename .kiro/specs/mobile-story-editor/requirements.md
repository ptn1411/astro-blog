# Requirements Document

## Introduction

Tính năng này cho phép người dùng chỉnh sửa Story trên thiết bị di động (điện thoại, tablet). Hiện tại, giao diện Story Builder chỉ được tối ưu cho desktop với layout nhiều panel cố định. Tính năng mới sẽ cung cấp giao diện responsive, thân thiện với màn hình nhỏ, cho phép người dùng tạo và chỉnh sửa story mọi lúc mọi nơi.

## Glossary

- **Story_Builder**: Công cụ chính để tạo và chỉnh sửa story, bao gồm canvas, timeline, và các panel điều khiển
- **Stories_Manager**: Màn hình danh sách hiển thị tất cả story đã tạo
- **Canvas**: Vùng hiển thị và chỉnh sửa nội dung slide
- **Properties_Panel**: Panel hiển thị và chỉnh sửa thuộc tính của element được chọn
- **Resources_Panel**: Panel chứa các tài nguyên như hình ảnh, video, sticker để thêm vào story
- **Layers_Panel**: Panel quản lý thứ tự các layer/element trong slide
- **Timeline**: Thanh điều khiển thời gian và animation của slide
- **Bottom_Sheet**: Component UI dạng sheet trượt từ dưới lên, phổ biến trên mobile
- **Floating_Action_Button**: Nút hành động nổi, thường ở góc màn hình trên mobile

## Requirements

### Requirement 1: Responsive Stories Manager

**User Story:** As a mobile user, I want to view and manage my stories on a small screen, so that I can access my content from my phone.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768px, THE Stories_Manager SHALL display stories in a 2-column grid layout
2. WHEN the viewport width is less than 480px, THE Stories_Manager SHALL display stories in a single-column list layout
3. THE Stories_Manager SHALL display a floating action button for creating new stories on mobile
4. WHEN a user taps on a story card on mobile, THE Stories_Manager SHALL show a bottom sheet with action options (Edit, Duplicate, Delete, Export)
5. THE Stories_Manager header SHALL collapse to show only essential controls on mobile (search icon, create button)

### Requirement 2: Mobile-Optimized Story Builder Layout

**User Story:** As a mobile user, I want to edit stories with a touch-friendly interface, so that I can create content without a desktop.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768px, THE Story_Builder SHALL switch to a mobile-first layout with canvas taking full width
2. THE Story_Builder SHALL hide side panels by default on mobile and show them via bottom sheets or slide-over panels
3. WHEN a user taps the canvas on mobile, THE Story_Builder SHALL show a floating toolbar with common actions (add element, undo, redo)
4. THE Story_Builder SHALL provide swipe gestures to navigate between slides on mobile
5. WHEN editing on mobile, THE Story_Builder SHALL display a simplified toolbar at the bottom of the screen

### Requirement 3: Touch-Friendly Canvas Interactions

**User Story:** As a mobile user, I want to manipulate elements using touch gestures, so that I can edit content naturally on my device.

#### Acceptance Criteria

1. WHEN a user touches an element on mobile, THE Canvas SHALL select the element and show touch-friendly resize handles
2. WHEN a user performs a pinch gesture on an element, THE Canvas SHALL scale the element proportionally
3. WHEN a user performs a two-finger rotation gesture, THE Canvas SHALL rotate the selected element
4. WHEN a user double-taps a text element, THE Canvas SHALL enter text editing mode with the mobile keyboard
5. WHEN a user long-presses an element, THE Canvas SHALL show a context menu with element actions (duplicate, delete, lock, bring to front)
6. THE Canvas resize handles SHALL be at least 44x44 pixels for touch accessibility

### Requirement 4: Mobile Properties Panel

**User Story:** As a mobile user, I want to edit element properties in a mobile-friendly way, so that I can customize my story elements.

#### Acceptance Criteria

1. WHEN an element is selected on mobile, THE Properties_Panel SHALL appear as a bottom sheet
2. THE Properties_Panel bottom sheet SHALL be draggable to expand to full screen or collapse
3. THE Properties_Panel SHALL organize properties into collapsible sections (Position, Style, Animation)
4. WHEN editing numeric values on mobile, THE Properties_Panel SHALL provide slider controls instead of number inputs
5. THE Properties_Panel SHALL include a "Done" button to dismiss and deselect the element

### Requirement 5: Mobile Resources Panel

**User Story:** As a mobile user, I want to add images, stickers, and other resources to my story, so that I can create rich content.

#### Acceptance Criteria

1. WHEN a user taps the "Add Element" button on mobile, THE Resources_Panel SHALL appear as a full-screen modal or bottom sheet
2. THE Resources_Panel SHALL display resource categories as horizontal scrollable tabs
3. WHEN a user selects a resource, THE Resources_Panel SHALL add it to the canvas and close automatically
4. THE Resources_Panel SHALL support pull-to-refresh for reloading resources
5. THE Resources_Panel search input SHALL be sticky at the top when scrolling

### Requirement 6: Mobile Timeline

**User Story:** As a mobile user, I want to control slide timing and animations, so that I can create dynamic stories.

#### Acceptance Criteria

1. WHEN on mobile, THE Timeline SHALL appear as a compact bar at the bottom of the screen
2. WHEN a user taps the Timeline bar, THE Timeline SHALL expand to show full timeline controls
3. THE Timeline SHALL support horizontal swipe to scrub through the slide duration
4. WHEN editing animation timing on mobile, THE Timeline SHALL provide a simplified interface with preset durations
5. THE Timeline slide thumbnails SHALL be scrollable horizontally on mobile

### Requirement 7: Mobile Navigation and Header

**User Story:** As a mobile user, I want easy navigation controls, so that I can move between screens efficiently.

#### Acceptance Criteria

1. THE Story_Builder header SHALL collapse to a minimal height on mobile showing only back button and save button
2. WHEN a user taps the header menu icon on mobile, THE Story_Builder SHALL show a slide-over menu with all options
3. THE Story_Builder SHALL provide a bottom navigation bar on mobile with tabs for Canvas, Layers, and Settings
4. WHEN switching between tabs on mobile, THE Story_Builder SHALL animate the transition smoothly
5. IF the user has unsaved changes and taps back, THEN THE Story_Builder SHALL show a confirmation dialog

### Requirement 8: Responsive Breakpoints

**User Story:** As a developer, I want consistent breakpoint definitions, so that the responsive behavior is predictable.

#### Acceptance Criteria

1. THE System SHALL define mobile breakpoint as viewport width less than 768px
2. THE System SHALL define tablet breakpoint as viewport width between 768px and 1024px
3. THE System SHALL define desktop breakpoint as viewport width greater than 1024px
4. WHEN the viewport is resized, THE System SHALL update the layout within 100ms
5. THE System SHALL persist the user's panel preferences per device type
