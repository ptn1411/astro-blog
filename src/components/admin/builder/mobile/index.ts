/**
 * Mobile Builder Components
 * 
 * This module exports all mobile-specific UI components for the Page Builder.
 * Requirements: 2.1, 2.2, 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 3.1, 3.2
 */

export {
  BuilderBottomNavBar,
  type BuilderBottomNavBarProps,
  type BuilderNavTab,
  type BuilderMobileView,
} from './BuilderBottomNavBar';

export {
  BuilderMobileHeader,
  type BuilderMobileHeaderProps,
  type BuilderMenuItem,
} from './BuilderMobileHeader';

export {
  MobileWidgetPicker,
  type MobileWidgetPickerProps,
} from './MobileWidgetPicker';

export {
  MobilePropertiesPanel,
  type MobilePropertiesPanelProps,
} from './MobilePropertiesPanel';

export {
  MobileArrayEditor,
  type MobileArrayEditorProps,
  type ArrayItemField,
} from './MobileArrayEditor';

export {
  MobileBlockList,
  type MobileBlockListProps,
} from './MobileBlockList';

export {
  MobilePreviewModal,
  type MobilePreviewModalProps,
  type PreviewDeviceMode,
  loadPreviewPreference,
  savePreviewPreference,
} from './MobilePreviewModal';

export {
  MobilePagesManager,
  type MobilePagesManagerProps,
  type PageInfo,
} from './MobilePagesManager';

export {
  MobileSaveModal,
  type MobileSaveModalProps,
} from './MobileSaveModal';

export {
  MobileAIPromptModal,
  type MobileAIPromptModalProps,
} from './MobileAIPromptModal';

export {
  MobilePasteJSONModal,
  type MobilePasteJSONModalProps,
} from './MobilePasteJSONModal';

export {
  MobileBuilderLayout,
  type MobileBuilderLayoutProps,
} from './MobileBuilderLayout';
