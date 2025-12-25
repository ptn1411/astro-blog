# Implementation Plan: Admin Module Refactor

## Overview

Kế hoạch thực hiện refactor cấu trúc thư mục cho Builder Module và Story Module. Mỗi module sẽ được refactor độc lập theo Clean Architecture.

## Tasks

- [-] 1. Refactor Builder Module Structure
  - Tạo cấu trúc thư mục mới và di chuyển files
  - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.1, 8.1_

- [x] 1.1 Tạo folder structure cho Builder Module
  - Tạo các folders: `core/types/`, `ui/canvas/`, `ui/panels/`, `ui/sidebar/`, `ui/modals/`, `ui/pickers/`, `ui/editors/`, `ui/preview/`, `ui/layout/`, `services/storage/`, `services/export/`, `services/save/`, `config/`
  - _Requirements: 2.1, 5.1, 6.1_

- [x] 1.2 Di chuyển và tách types cho Builder
  - Tách `types.ts` thành `core/types/block.types.ts`, `core/types/widget.types.ts`, `core/types/props.types.ts`
  - Tạo `core/types/index.ts` và `core/index.ts`
  - _Requirements: 1.1, 1.4_

- [x] 1.3 Di chuyển config files cho Builder
  - Di chuyển `registry.ts` → `config/registry.ts`
  - Di chuyển `templates.ts` → `config/templates.ts`
  - Di chuyển `constants/breakpoints.ts` → `config/breakpoints.constants.ts`
  - Tạo `config/index.ts`
  - _Requirements: 5.1, 5.2_

- [x] 1.4 Di chuyển utils cho Builder
  - Di chuyển `utils.ts` → `utils/helpers.ts`
  - Tạo `utils/index.ts`
  - _Requirements: 1.1_

- [x] 1.5 Di chuyển UI components cho Builder
  - Di chuyển components từ `components/` vào các subfolders trong `ui/`
  - Di chuyển root components (`Builder.tsx`, `PagesManager.tsx`, etc.) vào `ui/layout/`
  - Di chuyển pickers (`IconPicker.tsx`, `ImagePicker.tsx`) vào `ui/pickers/`
  - Di chuyển editors (`ArrayEditor.tsx`) vào `ui/editors/`
  - Di chuyển preview components vào `ui/preview/`
  - Tạo index.ts cho mỗi subfolder
  - _Requirements: 2.1, 2.4_

- [x] 1.6 Di chuyển services cho Builder
  - Di chuyển `actions/widgetStorage.ts` → `services/storage/widgetStorage.ts`
  - Di chuyển `actions/exportActions.ts` → `services/export/exportActions.ts`
  - Di chuyển `actions/saveActions.ts` → `services/save/saveActions.ts`
  - Tạo index.ts cho mỗi service folder
  - _Requirements: 3.1, 3.2_

- [x] 1.7 Tổ chức lại hooks cho Builder
  - Giữ nguyên vị trí hooks trong `hooks/`
  - Cập nhật `hooks/index.ts` nếu cần
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 1.8 Tổ chức lại mobile components cho Builder
  - Tạo subfolders: `mobile/layout/`, `mobile/panels/`, `mobile/modals/`, `mobile/editors/`
  - Di chuyển mobile components vào các subfolders tương ứng
  - Tạo index.ts cho mỗi subfolder
  - _Requirements: 7.1, 7.4_

- [x] 1.9 Tạo Builder module entry point
  - Cập nhật `builder/index.ts` để re-export từ tất cả submodules
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 1.10 Cập nhật imports trong Builder Module
  - Cập nhật tất cả import paths trong các files đã di chuyển
  - Đảm bảo không có broken imports
  - _Requirements: 8.3_

- [x] 2. Checkpoint - Verify Builder Module
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Refactor Story Module Structure
  - Tạo cấu trúc thư mục mới và di chuyển files
  - _Requirements: 1.1, 2.1, 3.1, 4.2, 5.1, 6.1, 8.1_

- [x] 3.1 Tạo folder structure cho Story Module
  - Tạo các folders: `core/types/`, `core/presets/`, `ui/canvas/`, `ui/panels/`, `ui/timeline/`, `ui/preview/`, `ui/modals/`, `ui/pickers/`, `ui/layout/`, `animations/engines/`, `animations/templates/`, `animations/utils/`, `services/`, `config/`
  - _Requirements: 2.1, 4.2, 5.1_

- [x] 3.2 Di chuyển và tách types cho Story
  - Tách `types.ts` thành `core/types/story.types.ts`, `core/types/animation.types.ts`, `core/types/element.types.ts`, `core/types/canvas.types.ts`
  - Tách presets từ `types.ts` vào `core/presets/animation.presets.ts`, `core/presets/color.presets.ts`, `core/presets/font.presets.ts`, `core/presets/defaults.ts`
  - Tạo index.ts files
  - _Requirements: 1.1, 1.4_

- [x] 3.3 Di chuyển animation logic cho Story
  - Di chuyển GSAP logic từ `animations.ts` → `animations/engines/gsap.engine.ts`
  - Di chuyển Anime.js logic từ `animations.ts` → `animations/engines/anime.engine.ts`
  - Di chuyển `animationTemplates.ts` → `animations/templates/animationTemplates.ts`
  - Di chuyển `animationUtils.ts` → `animations/utils/animationUtils.ts`
  - Tạo `animations/index.ts`
  - _Requirements: 4.2, 4.3_

- [x] 3.4 Di chuyển config files cho Story
  - Di chuyển `constants/breakpoints.ts` → `config/breakpoints.constants.ts`
  - Tạo `config/index.ts`
  - _Requirements: 5.1_

- [x] 3.5 Di chuyển UI components cho Story
  - Di chuyển `CanvasElementV2.tsx` → `ui/canvas/`
  - Di chuyển panels (`PropertiesPanelV2.tsx`, `ResourcePanelV2.tsx`, `LayersPanel.tsx`, `AudioPanel.tsx`, `GiphyPanel.tsx`) → `ui/panels/`
  - Di chuyển `TimelineV2.tsx` → `ui/timeline/`
  - Di chuyển preview components → `ui/preview/`
  - Di chuyển `ExportSettingsModal.tsx` → `ui/modals/`
  - Di chuyển pickers → `ui/pickers/`
  - Di chuyển layout components (`StoryBuilderV2.tsx`, `StoriesApp.tsx`, `StoriesManager.tsx`) → `ui/layout/`
  - Tạo index.ts cho mỗi subfolder
  - _Requirements: 2.1, 2.4_

- [x] 3.6 Tổ chức lại mobile components cho Story
  - Tạo subfolders: `mobile/layout/`, `mobile/canvas/`, `mobile/panels/`, `mobile/timeline/`, `mobile/navigation/`, `mobile/common/`
  - Di chuyển mobile components vào các subfolders tương ứng
  - Cập nhật `mobile/index.ts`
  - _Requirements: 7.1, 7.4_

- [x] 3.7 Tạo Story module entry point
  - Cập nhật `story/index.ts` để re-export từ tất cả submodules
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 3.8 Cập nhật imports trong Story Module
  - Cập nhật tất cả import paths trong các files đã di chuyển
  - Đảm bảo không có broken imports
  - _Requirements: 8.3_

- [x] 4. Checkpoint - Verify Story Module
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create Shared Utilities (Optional)
  - Tạo shared utilities nếu có code trùng lặp
  - _Requirements: 9.1, 9.2_

- [x] 5.1 Tạo shared folder structure
  - Tạo `src/components/admin/shared/utils/`
  - Tạo `shared/index.ts`
  - _Requirements: 9.1_

- [x] 5.2 Di chuyển common utilities
  - Identify và di chuyển utilities thực sự chung (generateId, deepClone, etc.)
  - Cập nhật imports trong cả 2 modules
  - _Requirements: 9.2, 9.3_

- [x] 6. Final Verification
  - Verify toàn bộ cấu trúc và imports
  - _Requirements: All_

- [x] 6.1 Verify naming conventions
  - Kiểm tra tất cả folders dùng kebab-case
  - Kiểm tra tất cả component files dùng PascalCase
  - Kiểm tra tất cả utility files dùng camelCase
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 6.2 Verify module independence
  - Kiểm tra Builder không import từ Story
  - Kiểm tra Story không import từ Builder
  - _Requirements: 9.3, 9.5_

- [x] 6.3 Verify entry points
  - Kiểm tra mỗi folder có index.ts
  - Kiểm tra root index.ts export đầy đủ
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 6.4 Run build và fix errors
  - Chạy build để phát hiện lỗi
  - Fix tất cả import errors
  - _Requirements: All_

- [x] 7. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Thực hiện refactor từng module một để dễ debug
- Sau mỗi bước di chuyển, chạy build để kiểm tra
- Giữ nguyên logic code, chỉ thay đổi vị trí files
- Cập nhật imports ngay sau khi di chuyển file
