# Design Document: Admin Module Refactor

## Overview

Tài liệu này mô tả thiết kế chi tiết cho việc refactor cấu trúc thư mục của hai module độc lập: **Builder** (Page Builder) và **Story** (Story Editor). Mỗi module sẽ được tổ chức theo Clean Architecture với các layers rõ ràng.

## Architecture

### Nguyên tắc thiết kế

1. **Separation of Concerns**: Mỗi layer có trách nhiệm riêng biệt
2. **Single Responsibility**: Mỗi file/folder chỉ làm một việc
3. **Dependency Inversion**: Core layer không phụ thuộc vào UI layer
4. **Module Independence**: Builder và Story hoàn toàn độc lập

### Cấu trúc tổng quan

```
src/components/admin/
├── builder/                    # Page Builder Module
│   ├── core/                   # Business logic, types
│   ├── ui/                     # Desktop UI components
│   ├── mobile/                 # Mobile UI components
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # API, storage services
│   ├── config/                 # Constants, registry
│   ├── utils/                  # Utility functions
│   └── index.ts                # Module entry point
│
├── story/                      # Story Editor Module
│   ├── core/                   # Business logic, types
│   ├── ui/                     # Desktop UI components
│   ├── mobile/                 # Mobile UI components
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # API, storage services
│   ├── config/                 # Constants, presets
│   ├── animations/             # Animation engines (GSAP, Anime.js)
│   ├── utils/                  # Utility functions
│   └── index.ts                # Module entry point
│
├── shared/                     # (Optional) Shared utilities
│   ├── utils/
│   └── index.ts
│
└── config.ts                   # Admin-level config
```

## Components and Interfaces

### Builder Module Structure

```
src/components/admin/builder/
├── core/
│   ├── types/
│   │   ├── block.types.ts          # BuilderBlock, PageMetadata
│   │   ├── widget.types.ts         # WidgetType, WidgetSchema, WidgetCategory
│   │   ├── props.types.ts          # Component props interfaces
│   │   └── index.ts
│   └── index.ts
│
├── ui/
│   ├── canvas/
│   │   ├── CanvasItem.tsx
│   │   ├── WidgetWrapper.tsx
│   │   └── index.ts
│   ├── panels/
│   │   ├── PropsEditor.tsx
│   │   ├── StyleEditor.tsx
│   │   ├── JsonEditor.tsx
│   │   └── index.ts
│   ├── sidebar/
│   │   ├── SidebarItem.tsx
│   │   ├── ClassPicker.tsx
│   │   └── index.ts
│   ├── modals/
│   │   ├── SaveModal.tsx
│   │   ├── TemplateModal.tsx
│   │   └── index.ts
│   ├── pickers/
│   │   ├── IconPicker.tsx
│   │   ├── ImagePicker.tsx
│   │   └── index.ts
│   ├── editors/
│   │   ├── ArrayEditor.tsx
│   │   └── index.ts
│   ├── preview/
│   │   ├── ClientPreview.tsx
│   │   ├── PreviewRenderer.tsx
│   │   ├── DynamicWidgetRenderer.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── Builder.tsx             # Main builder component
│   │   ├── PagesManager.tsx
│   │   ├── WidgetManager.tsx
│   │   └── index.ts
│   └── index.ts
│
├── mobile/
│   ├── layout/
│   │   ├── MobileBuilderLayout.tsx
│   │   ├── BuilderMobileHeader.tsx
│   │   ├── BuilderBottomNavBar.tsx
│   │   └── index.ts
│   ├── panels/
│   │   ├── MobilePropertiesPanel.tsx
│   │   ├── MobileBlockList.tsx
│   │   ├── MobileWidgetPicker.tsx
│   │   └── index.ts
│   ├── modals/
│   │   ├── MobileSaveModal.tsx
│   │   ├── MobilePreviewModal.tsx
│   │   ├── MobileAIPromptModal.tsx
│   │   ├── MobilePasteJSONModal.tsx
│   │   └── index.ts
│   ├── editors/
│   │   ├── MobileArrayEditor.tsx
│   │   ├── MobilePagesManager.tsx
│   │   └── index.ts
│   └── index.ts
│
├── hooks/
│   ├── useAutoSave.ts
│   ├── useBuilderHistory.ts
│   ├── useBuilderResponsive.ts
│   ├── usePreviewSync.ts
│   ├── useWidgetRegistry.ts
│   └── index.ts
│
├── services/
│   ├── storage/
│   │   ├── widgetStorage.ts
│   │   └── index.ts
│   ├── export/
│   │   ├── exportActions.ts
│   │   └── index.ts
│   ├── save/
│   │   ├── saveActions.ts
│   │   └── index.ts
│   └── index.ts
│
├── config/
│   ├── registry.ts                 # WIDGET_REGISTRY
│   ├── templates.ts                # PAGE_TEMPLATES
│   ├── breakpoints.constants.ts
│   └── index.ts
│
├── utils/
│   ├── helpers.ts                  # generateId, deepClone, etc.
│   └── index.ts
│
└── index.ts                        # Module entry point
```

### Story Module Structure

```
src/components/admin/story/
├── core/
│   ├── types/
│   │   ├── story.types.ts          # Story, StorySlide, StoryElement
│   │   ├── animation.types.ts      # AnimationType, Animation, etc.
│   │   ├── element.types.ts        # ElementType, ElementStyle, etc.
│   │   ├── canvas.types.ts         # CanvasState, EditorState
│   │   └── index.ts
│   ├── presets/
│   │   ├── animation.presets.ts    # ANIMATION_PRESETS, TRANSITION_PRESETS
│   │   ├── color.presets.ts        # COLOR_PRESETS
│   │   ├── font.presets.ts         # FONT_OPTIONS
│   │   ├── defaults.ts             # DEFAULT_ELEMENT_STYLE, DEFAULT_STORY
│   │   └── index.ts
│   └── index.ts
│
├── ui/
│   ├── canvas/
│   │   ├── CanvasElementV2.tsx
│   │   └── index.ts
│   ├── panels/
│   │   ├── PropertiesPanelV2.tsx
│   │   ├── ResourcePanelV2.tsx
│   │   ├── LayersPanel.tsx
│   │   ├── AudioPanel.tsx
│   │   ├── GiphyPanel.tsx
│   │   └── index.ts
│   ├── timeline/
│   │   ├── TimelineV2.tsx
│   │   └── index.ts
│   ├── preview/
│   │   ├── StoryPreviewV2.tsx
│   │   ├── ClientPreviewStories.tsx
│   │   └── index.ts
│   ├── modals/
│   │   ├── ExportSettingsModal.tsx
│   │   └── index.ts
│   ├── pickers/
│   │   ├── StoryMediaPicker.tsx
│   │   ├── AudioRangeSlider.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── StoryBuilderV2.tsx      # Main story builder
│   │   ├── StoriesApp.tsx
│   │   ├── StoriesManager.tsx
│   │   └── index.ts
│   └── index.ts
│
├── mobile/
│   ├── layout/
│   │   ├── MobileHeader.tsx
│   │   ├── BottomNavBar.tsx
│   │   └── index.ts
│   ├── canvas/
│   │   ├── TouchCanvas.tsx
│   │   └── index.ts
│   ├── panels/
│   │   ├── MobilePropertiesPanel.tsx
│   │   ├── MobileResourcesPanel.tsx
│   │   └── index.ts
│   ├── timeline/
│   │   ├── CompactTimeline.tsx
│   │   └── index.ts
│   ├── navigation/
│   │   ├── SwipeNavigator.tsx
│   │   └── index.ts
│   ├── common/
│   │   ├── BottomSheet.tsx
│   │   ├── FloatingActionButton.tsx
│   │   ├── ConfirmationDialog.tsx
│   │   └── index.ts
│   └── index.ts
│
├── hooks/
│   ├── useStoryEditor.ts           # (if exists)
│   └── index.ts
│
├── services/
│   ├── media/
│   │   ├── mediaService.ts         # Upload, fetch media
│   │   └── index.ts
│   ├── giphy/
│   │   ├── giphyService.ts
│   │   └── index.ts
│   ├── export/
│   │   ├── exportService.ts
│   │   └── index.ts
│   └── index.ts
│
├── animations/
│   ├── engines/
│   │   ├── gsap.engine.ts          # GSAP animations
│   │   ├── anime.engine.ts         # Anime.js animations
│   │   └── index.ts
│   ├── templates/
│   │   ├── animationTemplates.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── animationUtils.ts       # computeAnimationState, etc.
│   │   └── index.ts
│   ├── animations.ts               # Main animation exports
│   └── index.ts
│
├── config/
│   ├── breakpoints.constants.ts
│   └── index.ts
│
├── utils/
│   ├── helpers.ts
│   └── index.ts
│
└── index.ts                        # Module entry point
```

## Data Models

### Builder Module Types

```typescript
// core/types/block.types.ts
export interface BuilderBlock {
  id: string;
  type: WidgetType | string;
  props: Record<string, unknown>;
}

export interface PageMetadata {
  title: string;
  description: string;
}

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  blocks: Omit<BuilderBlock, 'id'>[];
}
```

### Story Module Types

```typescript
// core/types/story.types.ts
export interface Story {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  slides: StorySlide[];
  audio?: StoryAudio;
  createdAt?: string;
  updatedAt?: string;
  settings?: StorySettings;
}

export interface StorySlide {
  id: string;
  duration: number;
  background: SlideBackground;
  elements: StoryElement[];
  transition?: SlideTransition;
  audio?: SlideAudio;
}

export interface StoryElement {
  id: string;
  type: ElementType;
  content: string;
  style: ElementStyle;
  animation?: ElementAnimation;
  timings?: ElementTimings;
  locked?: boolean;
  visible?: boolean;
}
```


## File Mapping: Old → New

### Builder Module Mapping

| File cũ | Vị trí mới |
|---------|-----------|
| `types.ts` | `core/types/block.types.ts`, `core/types/props.types.ts` |
| `registry.ts` | `config/registry.ts` |
| `templates.ts` | `config/templates.ts` |
| `utils.ts` | `utils/helpers.ts` |
| `Builder.tsx` | `ui/layout/Builder.tsx` |
| `PagesManager.tsx` | `ui/layout/PagesManager.tsx` |
| `ClientPreview.tsx` | `ui/preview/ClientPreview.tsx` |
| `PreviewRenderer.tsx` | `ui/preview/PreviewRenderer.tsx` |
| `DynamicWidgetRenderer.tsx` | `ui/preview/DynamicWidgetRenderer.tsx` |
| `ArrayEditor.tsx` | `ui/editors/ArrayEditor.tsx` |
| `IconPicker.tsx` | `ui/pickers/IconPicker.tsx` |
| `ImagePicker.tsx` | `ui/pickers/ImagePicker.tsx` |
| `components/CanvasItem.tsx` | `ui/canvas/CanvasItem.tsx` |
| `components/WidgetWrapper.tsx` | `ui/canvas/WidgetWrapper.tsx` |
| `components/PropsEditor.tsx` | `ui/panels/PropsEditor.tsx` |
| `components/StyleEditor.tsx` | `ui/panels/StyleEditor.tsx` |
| `components/JsonEditor.tsx` | `ui/panels/JsonEditor.tsx` |
| `components/SidebarItem.tsx` | `ui/sidebar/SidebarItem.tsx` |
| `components/ClassPicker.tsx` | `ui/sidebar/ClassPicker.tsx` |
| `components/SaveModal.tsx` | `ui/modals/SaveModal.tsx` |
| `components/TemplateModal.tsx` | `ui/modals/TemplateModal.tsx` |
| `components/WidgetManager.tsx` | `ui/layout/WidgetManager.tsx` |
| `actions/exportActions.ts` | `services/export/exportActions.ts` |
| `actions/saveActions.ts` | `services/save/saveActions.ts` |
| `actions/widgetStorage.ts` | `services/storage/widgetStorage.ts` |
| `hooks/useAutoSave.ts` | `hooks/useAutoSave.ts` |
| `hooks/useBuilderHistory.ts` | `hooks/useBuilderHistory.ts` |
| `hooks/useBuilderResponsive.ts` | `hooks/useBuilderResponsive.ts` |
| `hooks/usePreviewSync.ts` | `hooks/usePreviewSync.ts` |
| `hooks/useWidgetRegistry.ts` | `hooks/useWidgetRegistry.ts` |
| `constants/breakpoints.ts` | `config/breakpoints.constants.ts` |
| `mobile/MobileBuilderLayout.tsx` | `mobile/layout/MobileBuilderLayout.tsx` |
| `mobile/BuilderMobileHeader.tsx` | `mobile/layout/BuilderMobileHeader.tsx` |
| `mobile/BuilderBottomNavBar.tsx` | `mobile/layout/BuilderBottomNavBar.tsx` |
| `mobile/MobilePropertiesPanel.tsx` | `mobile/panels/MobilePropertiesPanel.tsx` |
| `mobile/MobileBlockList.tsx` | `mobile/panels/MobileBlockList.tsx` |
| `mobile/MobileWidgetPicker.tsx` | `mobile/panels/MobileWidgetPicker.tsx` |
| `mobile/MobileSaveModal.tsx` | `mobile/modals/MobileSaveModal.tsx` |
| `mobile/MobilePreviewModal.tsx` | `mobile/modals/MobilePreviewModal.tsx` |
| `mobile/MobileAIPromptModal.tsx` | `mobile/modals/MobileAIPromptModal.tsx` |
| `mobile/MobilePasteJSONModal.tsx` | `mobile/modals/MobilePasteJSONModal.tsx` |
| `mobile/MobileArrayEditor.tsx` | `mobile/editors/MobileArrayEditor.tsx` |
| `mobile/MobilePagesManager.tsx` | `mobile/editors/MobilePagesManager.tsx` |

### Story Module Mapping

| File cũ | Vị trí mới |
|---------|-----------|
| `types.ts` | `core/types/story.types.ts`, `core/types/animation.types.ts`, `core/types/element.types.ts` |
| `types.ts` (presets) | `core/presets/animation.presets.ts`, `core/presets/color.presets.ts`, `core/presets/font.presets.ts`, `core/presets/defaults.ts` |
| `animations.ts` | `animations/engines/gsap.engine.ts`, `animations/engines/anime.engine.ts` |
| `animationTemplates.ts` | `animations/templates/animationTemplates.ts` |
| `animationUtils.ts` | `animations/utils/animationUtils.ts` |
| `StoriesApp.tsx` | `ui/layout/StoriesApp.tsx` |
| `StoriesManager.tsx` | `ui/layout/StoriesManager.tsx` |
| `StoryBuilderV2.tsx` | `ui/layout/StoryBuilderV2.tsx` |
| `CanvasElementV2.tsx` | `ui/canvas/CanvasElementV2.tsx` |
| `PropertiesPanelV2.tsx` | `ui/panels/PropertiesPanelV2.tsx` |
| `ResourcePanelV2.tsx` | `ui/panels/ResourcePanelV2.tsx` |
| `LayersPanel.tsx` | `ui/panels/LayersPanel.tsx` |
| `AudioPanel.tsx` | `ui/panels/AudioPanel.tsx` |
| `GiphyPanel.tsx` | `ui/panels/GiphyPanel.tsx` |
| `TimelineV2.tsx` | `ui/timeline/TimelineV2.tsx` |
| `StoryPreviewV2.tsx` | `ui/preview/StoryPreviewV2.tsx` |
| `ClientPreviewStories.tsx` | `ui/preview/ClientPreviewStories.tsx` |
| `ExportSettingsModal.tsx` | `ui/modals/ExportSettingsModal.tsx` |
| `StoryMediaPicker.tsx` | `ui/pickers/StoryMediaPicker.tsx` |
| `AudioRangeSlider.tsx` | `ui/pickers/AudioRangeSlider.tsx` |
| `constants/breakpoints.ts` | `config/breakpoints.constants.ts` |
| `mobile/MobileHeader.tsx` | `mobile/layout/MobileHeader.tsx` |
| `mobile/BottomNavBar.tsx` | `mobile/layout/BottomNavBar.tsx` |
| `mobile/TouchCanvas.tsx` | `mobile/canvas/TouchCanvas.tsx` |
| `mobile/MobilePropertiesPanel.tsx` | `mobile/panels/MobilePropertiesPanel.tsx` |
| `mobile/MobileResourcesPanel.tsx` | `mobile/panels/MobileResourcesPanel.tsx` |
| `mobile/CompactTimeline.tsx` | `mobile/timeline/CompactTimeline.tsx` |
| `mobile/SwipeNavigator.tsx` | `mobile/navigation/SwipeNavigator.tsx` |
| `mobile/BottomSheet.tsx` | `mobile/common/BottomSheet.tsx` |
| `mobile/FloatingActionButton.tsx` | `mobile/common/FloatingActionButton.tsx` |
| `mobile/ConfirmationDialog.tsx` | `mobile/common/ConfirmationDialog.tsx` |

## Entry Points

### Builder Module Entry Point

```typescript
// src/components/admin/builder/index.ts

// Types
export * from './core';

// Config
export * from './config';

// Hooks
export * from './hooks';

// Services
export * from './services';

// Utils
export * from './utils';

// UI Components
export * from './ui';

// Mobile Components
export * from './mobile';
```

### Story Module Entry Point

```typescript
// src/components/admin/story/index.ts

// Types
export * from './core';

// Config
export * from './config';

// Animations
export * from './animations';

// Hooks
export * from './hooks';

// Services
export * from './services';

// Utils
export * from './utils';

// UI Components
export * from './ui';

// Mobile Components
export * from './mobile';
```

## Error Handling

- Mỗi service layer sẽ handle errors và throw custom errors
- UI layer sẽ catch errors và hiển thị thông báo phù hợp
- Animation errors sẽ fallback về CSS animations

## Testing Strategy

### Unit Tests
- Test utility functions trong `utils/`
- Test animation calculations trong `animations/utils/`
- Test type guards và validators

### Property-Based Tests
- Test animation state computations với random inputs
- Test data transformations

### Integration Tests
- Test service layer với mock APIs
- Test component interactions


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Naming Convention Compliance

*For any* file or folder in the refactored modules, the naming SHALL follow the established convention:
- Folders use kebab-case (e.g., `mobile-components`)
- Component files (.tsx) use PascalCase (e.g., `CanvasElement.tsx`)
- Utility files use camelCase (e.g., `animationUtils.ts`)
- Type files use camelCase with `.types.ts` suffix
- Constant files use camelCase with `.constants.ts` suffix

**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

### Property 2: Entry Point Completeness

*For any* module or submodule folder, there SHALL exist an `index.ts` file that exports all public APIs from that folder. Consumers should be able to import everything they need from the folder's index.

**Validates: Requirements 2.4, 6.3, 7.4, 8.1, 8.2, 8.3**

### Property 3: Layer Separation

*For any* file in the Core_Layer, Config_Layer, or Hooks_Layer:
- Core_Layer files SHALL NOT import React components or JSX
- Config_Layer files SHALL NOT contain runtime logic (only pure data exports)
- Hooks_Layer files SHALL NOT contain JSX rendering logic

**Validates: Requirements 1.2, 5.3, 6.4**

### Property 4: Module Independence

*For any* import statement in Builder_Module or Story_Module:
- Builder_Module SHALL NOT import directly from Story_Module
- Story_Module SHALL NOT import directly from Builder_Module
- Both modules MAY import from Shared_Utils if needed

**Validates: Requirements 9.3, 9.5**

### Property 5: Hook Naming Convention

*For any* file in the Hooks_Layer, the filename SHALL start with `use` prefix and use camelCase (e.g., `useAutoSave.ts`, `useBuilderHistory.ts`).

**Validates: Requirements 6.2**

## Coding Rules để tránh loạn cấu trúc

### 1. Import Rules

```typescript
// ✅ GOOD - Import từ module root
import { BuilderBlock, useAutoSave } from '@/components/admin/builder';
import { Story, playGSAPAnimation } from '@/components/admin/story';

// ❌ BAD - Import trực tiếp từ internal files
import { BuilderBlock } from '@/components/admin/builder/core/types/block.types';
```

### 2. File Placement Rules

| Loại file | Đặt ở đâu |
|-----------|-----------|
| Types, Interfaces | `core/types/` |
| React Components (Desktop) | `ui/{feature}/` |
| React Components (Mobile) | `mobile/{feature}/` |
| Custom Hooks | `hooks/` |
| API/Storage Services | `services/{service-name}/` |
| Constants, Presets | `config/` |
| Utility Functions | `utils/` |
| Animation Logic | `animations/` (Story only) |

### 3. Naming Rules

| Loại | Convention | Ví dụ |
|------|------------|-------|
| Folders | kebab-case | `mobile-components`, `ui-panels` |
| Components (.tsx) | PascalCase | `CanvasElement.tsx`, `SaveModal.tsx` |
| Hooks | camelCase + use prefix | `useAutoSave.ts`, `useHistory.ts` |
| Types | camelCase + .types.ts | `story.types.ts`, `block.types.ts` |
| Constants | camelCase + .constants.ts | `breakpoints.constants.ts` |
| Utils | camelCase | `helpers.ts`, `animationUtils.ts` |
| Services | camelCase + Service suffix | `mediaService.ts`, `exportService.ts` |

### 4. Export Rules

```typescript
// Mỗi folder PHẢI có index.ts
// ui/panels/index.ts
export { PropertiesPanel } from './PropertiesPanel';
export { ResourcePanel } from './ResourcePanel';
export { LayersPanel } from './LayersPanel';

// Module root index.ts re-export tất cả
// builder/index.ts
export * from './core';
export * from './ui';
export * from './hooks';
// ...
```

### 5. Dependency Rules

```
┌─────────────────────────────────────────────────────────┐
│                      UI Layer                            │
│  (ui/, mobile/) - React Components                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Hooks Layer                           │
│  (hooks/) - Custom React Hooks                           │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Services Layer                          │
│  (services/) - API, Storage, External                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Core + Config + Utils                       │
│  (core/, config/, utils/) - Types, Constants, Helpers    │
└─────────────────────────────────────────────────────────┘

Dependency Direction: TOP → BOTTOM only
- UI có thể import từ Hooks, Services, Core, Config, Utils
- Hooks có thể import từ Services, Core, Config, Utils
- Services có thể import từ Core, Config, Utils
- Core, Config, Utils KHÔNG import từ layers phía trên
```

### 6. New File Checklist

Khi tạo file mới, kiểm tra:

- [ ] File đặt đúng folder theo loại
- [ ] Tên file đúng convention
- [ ] Đã export trong index.ts của folder
- [ ] Không import từ layer cao hơn
- [ ] Không tạo circular dependency
