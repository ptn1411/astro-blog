# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu cho việc refactor cấu trúc thư mục `src/components/admin/builder` và `src/components/admin/story` theo các nguyên tắc Clean Architecture, Separation of Concerns và Single Responsibility Principle. 

**Quan trọng:** Builder và Story là hai module HOÀN TOÀN TÁCH BIỆT với mục đích khác nhau:
- **Builder**: Page Builder - tạo và chỉnh sửa trang web với widgets
- **Story**: Story Editor - tạo và chỉnh sửa stories với animations, media, timeline

Mỗi module sẽ có cấu trúc riêng biệt, độc lập và không phụ thuộc lẫn nhau.

## Glossary

- **Builder_Module**: Module quản lý Page Builder - cho phép tạo và chỉnh sửa trang web bằng drag-and-drop widgets. Hoàn toàn độc lập với Story_Module.
- **Story_Module**: Module quản lý Story Editor - cho phép tạo và chỉnh sửa stories với animations, media và timeline. Hoàn toàn độc lập với Builder_Module.
- **Core_Layer**: Tầng chứa business logic, types, interfaces và domain models của từng module
- **UI_Layer**: Tầng chứa React components cho presentation của từng module
- **Services_Layer**: Tầng chứa các services xử lý API calls, storage của từng module
- **Utils_Layer**: Tầng chứa các utility functions và helpers của từng module
- **Config_Layer**: Tầng chứa constants, configurations và presets của từng module
- **Hooks_Layer**: Tầng chứa custom React hooks của từng module
- **Mobile_Layer**: Tầng chứa các components tối ưu cho mobile của từng module
- **Shared_Utils**: Các utilities chung có thể dùng chung giữa các module (nằm ở cấp admin)

## Requirements

### Requirement 1: Tách biệt Core/Business Logic

**User Story:** As a developer, I want business logic separated from UI components, so that I can modify logic without affecting presentation and vice versa.

#### Acceptance Criteria

1. THE Core_Layer SHALL contain all TypeScript types, interfaces và domain models
2. THE Core_Layer SHALL NOT import any React components hoặc UI-specific code
3. WHEN business logic changes, THE UI_Layer SHALL remain unaffected
4. THE Core_Layer SHALL export all types through a single entry point (index.ts)

### Requirement 2: Tổ chức UI Components theo Feature

**User Story:** As a developer, I want UI components organized by feature, so that I can easily locate and modify related components.

#### Acceptance Criteria

1. THE UI_Layer SHALL group components by feature (canvas, panels, timeline, etc.)
2. WHEN a new feature is added, THE UI_Layer SHALL accommodate it in a dedicated subfolder
3. THE UI_Layer SHALL have separate folders for desktop và mobile components
4. EACH component folder SHALL have an index.ts file exporting all public components

### Requirement 3: Centralize Services và API Logic

**User Story:** As a developer, I want all API calls and external service integrations in one place, so that I can manage dependencies and mock services easily.

#### Acceptance Criteria

1. THE Services_Layer SHALL contain all API call functions
2. THE Services_Layer SHALL contain all storage operations (localStorage, file system)
3. THE Services_Layer SHALL contain all external integrations (Giphy, media upload)
4. WHEN an API endpoint changes, THE Services_Layer SHALL be the only layer requiring modification

### Requirement 4: Tách Animation Logic

**User Story:** As a developer, I want animation logic separated from components, so that I can reuse animations across different components.

#### Acceptance Criteria

1. THE Builder_Module SHALL have a dedicated animations folder
2. THE Story_Module SHALL have a dedicated animations folder containing GSAP và Anime.js logic
3. THE animations folder SHALL export animation functions through a single entry point
4. WHEN adding new animation types, THE animations folder SHALL be the only location requiring changes

### Requirement 5: Standardize Constants và Configuration

**User Story:** As a developer, I want all constants and configurations in dedicated files, so that I can easily adjust settings without searching through code.

#### Acceptance Criteria

1. THE Config_Layer SHALL contain all breakpoints, presets và default values
2. THE Config_Layer SHALL contain widget registry và schema definitions
3. THE Config_Layer SHALL NOT contain any runtime logic
4. WHEN configuration values change, THE Config_Layer SHALL be the only layer requiring modification

### Requirement 6: Organize Custom Hooks

**User Story:** As a developer, I want custom hooks organized in a dedicated folder, so that I can reuse stateful logic across components.

#### Acceptance Criteria

1. THE Hooks_Layer SHALL contain all custom React hooks
2. EACH hook SHALL be in its own file with clear naming (use*.ts)
3. THE Hooks_Layer SHALL export all hooks through a single entry point
4. THE Hooks_Layer SHALL NOT contain any UI rendering logic

### Requirement 7: Mobile-First Component Organization

**User Story:** As a developer, I want mobile components clearly separated, so that I can optimize mobile experience independently.

#### Acceptance Criteria

1. THE Mobile_Layer SHALL contain all mobile-specific components
2. THE Mobile_Layer SHALL mirror the structure of desktop components where applicable
3. WHEN mobile-specific behavior is needed, THE Mobile_Layer SHALL provide dedicated implementations
4. THE Mobile_Layer SHALL export all components through a single entry point

### Requirement 8: Entry Point và Module Exports

**User Story:** As a developer, I want clear entry points for each module, so that I can import what I need without knowing internal structure.

#### Acceptance Criteria

1. EACH module (builder, story) SHALL have a root index.ts file
2. THE root index.ts SHALL re-export all public APIs from submodules
3. WHEN importing from a module, THE consumer SHALL only need to import from the root
4. THE module exports SHALL be organized by category (types, components, hooks, utils)

### Requirement 9: Shared Utilities ở cấp Admin (Optional)

**User Story:** As a developer, I want truly common utilities available at admin level, so that both modules can use them without duplication.

#### Acceptance Criteria

1. THE Shared_Utils folder SHALL be located at `src/components/admin/shared`
2. THE Shared_Utils SHALL only contain utilities that are TRULY common (e.g., generateId, deepClone)
3. THE Builder_Module và Story_Module SHALL remain independent - không bắt buộc phải dùng shared
4. IF a utility is module-specific, THEN THE utility SHALL remain in that module's utils folder
5. THE Shared_Utils SHALL NOT create coupling between Builder_Module và Story_Module

### Requirement 10: Consistent Naming Convention

**User Story:** As a developer, I want consistent file and folder naming, so that I can predict file locations and purposes.

#### Acceptance Criteria

1. THE folder names SHALL use kebab-case (e.g., `mobile-components`)
2. THE component files SHALL use PascalCase (e.g., `CanvasElement.tsx`)
3. THE utility files SHALL use camelCase (e.g., `animationUtils.ts`)
4. THE type files SHALL use camelCase with `.types.ts` suffix (e.g., `story.types.ts`)
5. THE constant files SHALL use camelCase with `.constants.ts` suffix (e.g., `breakpoints.constants.ts`)
