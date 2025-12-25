import React, { useState, useCallback, useMemo } from 'react';
import { ChevronDown, Settings, FileText, Check } from 'lucide-react';
import { BottomSheet } from '../../../shared/mobile';
import { BUILDER_TOUCH_CONFIG } from '../../config/breakpoints.constants';
import type { BuilderBlock, PageMetadata } from '../../core/types/block.types';
import type { WidgetSchema } from '../../config/registry';
import { MobileArrayEditor } from '../editors/MobileArrayEditor';
import { ImagePicker } from '../../ui/pickers/ImagePicker';
import { IconPicker } from '../../ui/pickers/IconPicker';

/**
 * MobilePropertiesPanel Component - Mobile-optimized properties editor using BottomSheet
 * Requirements: 8.1, 8.2, 3.1
 * 
 * Implements:
 * - BottomSheet with snap points (30%, 60%, 100%)
 * - Full-width inputs adapted for touch
 * - 44px minimum touch targets for all interactive elements
 * - Collapsible sections for organization
 */

export interface MobilePropertiesPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel should close */
  onClose: () => void;
  /** Currently selected block (null for page metadata) */
  selectedBlock: BuilderBlock | null;
  /** Widget definition for the selected block */
  selectedDef: WidgetSchema | null;
  /** Callback to update block properties */
  onUpdateProps: (id: string, props: Record<string, unknown>) => void;
  /** Page metadata */
  metadata: PageMetadata;
  /** Callback to update page metadata */
  onMetadataChange: (metadata: PageMetadata) => void;
  /** Whether dark mode is enabled */
  isDarkMode?: boolean;
}

/** Deep clone helper */
const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

/** Snap points for the bottom sheet: 30%, 60%, 100% */
const SNAP_POINTS = [0.3, 0.6, 1.0];

// ============================================
// Collapsible Section Component
// ============================================
interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  isDarkMode: boolean;
}

const Section: React.FC<SectionProps> = ({ 
  title, 
  icon, 
  defaultOpen = true, 
  children,
  isDarkMode,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} last:border-b-0`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 transition-colors touch-manipulation ${
          isDarkMode 
            ? 'hover:bg-gray-700/50 active:bg-gray-700' 
            : 'hover:bg-gray-100 active:bg-gray-200'
        }`}
        style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
      >
        <div className={`flex items-center gap-3 text-base font-medium ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          {icon}
          {title}
        </div>
        <ChevronDown 
          size={20} 
          className={`transition-transform duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          } ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================
// Field Label Component
// ============================================
interface FieldProps {
  label: string;
  children: React.ReactNode;
  isDarkMode: boolean;
}

const Field: React.FC<FieldProps> = ({ label, children, isDarkMode }) => (
  <div>
    <label className={`text-sm block mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
      {label}
    </label>
    {children}
  </div>
);

// ============================================
// Main Component
// ============================================
export const MobilePropertiesPanel: React.FC<MobilePropertiesPanelProps> = ({
  isOpen,
  onClose,
  selectedBlock,
  selectedDef,
  onUpdateProps,
  metadata,
  onMetadataChange,
  isDarkMode = true,
}) => {
  // Get panel title
  const panelTitle = useMemo(() => {
    if (!selectedBlock || !selectedDef) return 'Page Settings';
    return `${selectedDef.label} Properties`;
  }, [selectedBlock, selectedDef]);

  // Handle done button
  const handleDone = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle property update for nested keys
  const handleUpdate = useCallback((fieldName: string, value: unknown) => {
    if (!selectedBlock) return;
    
    const newProps = deepClone(selectedBlock.props);
    const keys = fieldName.split('.');
    const lastKey = keys.pop()!;
    
    const target = keys.reduce((acc: Record<string, unknown>, key: string) => {
      acc[key] = acc[key] || {};
      return acc[key] as Record<string, unknown>;
    }, newProps);
    
    target[lastKey] = value;
    onUpdateProps(selectedBlock.id, newProps);
  }, [selectedBlock, onUpdateProps]);

  // Get nested value from props
  const getNestedValue = useCallback((fieldName: string): unknown => {
    if (!selectedBlock) return undefined;
    
    const keys = fieldName.split('.');
    let current: unknown = selectedBlock.props;
    
    for (const key of keys) {
      current = (current as Record<string, unknown>)?.[key];
    }
    
    return current;
  }, [selectedBlock]);

  // Input class for consistent styling
  const inputClass = `w-full px-4 py-3 rounded-lg border text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-500 focus:border-blue-500'
  }`;

  // Render field based on type
  const renderField = (field: WidgetSchema['fields'][number]) => {
    const value = getNestedValue(field.name);

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            className={inputClass}
            rows={4}
            value={(value as string) || ''}
            onChange={(e) => handleUpdate(field.name, e.target.value)}
            placeholder={field.placeholder}
            style={{ minHeight: '100px' }}
          />
        );

      case 'boolean':
        return (
          <button
            onClick={() => handleUpdate(field.name, !value)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors touch-manipulation ${
              value
                ? 'bg-blue-500 border-blue-500 text-white'
                : isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-300'
                  : 'bg-white border-gray-300 text-gray-700'
            }`}
            style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              value ? 'border-white bg-white' : isDarkMode ? 'border-gray-500' : 'border-gray-400'
            }`}>
              {!!value && <Check size={14} className="text-blue-500" />}
            </div>
            <span>{value ? 'Enabled' : 'Disabled'}</span>
          </button>
        );

      case 'number':
        return (
          <input
            type="number"
            className={inputClass}
            value={(value as number) || ''}
            onChange={(e) => handleUpdate(field.name, parseInt(e.target.value) || 0)}
            placeholder={field.placeholder}
            style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
          />
        );

      case 'select':
        return (
          <select
            className={inputClass}
            value={(value as string) || ''}
            onChange={(e) => handleUpdate(field.name, e.target.value)}
            style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'image':
        return (
          <ImagePicker
            value={(value as string) || ''}
            onChange={(v) => handleUpdate(field.name, v)}
            isDarkMode={isDarkMode}
          />
        );

      case 'icon':
        return (
          <IconPicker
            value={(value as string) || ''}
            onChange={(v) => handleUpdate(field.name, v)}
            isDarkMode={isDarkMode}
          />
        );

      case 'array':
        return (
          <MobileArrayEditor
            value={Array.isArray(value) ? value : []}
            onChange={(v) => handleUpdate(field.name, v)}
            isDarkMode={isDarkMode}
            itemSchema={field.arraySchema}
          />
        );

      case 'json':
        return (
          <textarea
            className={`${inputClass} font-mono text-sm`}
            rows={6}
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : (value as string) || ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleUpdate(field.name, parsed);
              } catch {
                // Keep raw value if not valid JSON
              }
            }}
            placeholder="Enter JSON..."
            style={{ minHeight: '120px' }}
          />
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            className={inputClass}
            value={(value as string) || ''}
            onChange={(e) => handleUpdate(field.name, e.target.value)}
            placeholder={field.placeholder}
            style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
          />
        );
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={panelTitle}
      snapPoints={SNAP_POINTS}
      initialSnap={1} // Start at 60% height
    >
      <div className="flex flex-col h-full">
        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {!selectedBlock || !selectedDef ? (
            // Page Metadata Editor
            <PageMetadataEditor
              metadata={metadata}
              onMetadataChange={onMetadataChange}
              isDarkMode={isDarkMode}
            />
          ) : (
            // Block Properties Editor
            <BlockPropertiesEditor
              selectedDef={selectedDef}
              renderField={renderField}
              isDarkMode={isDarkMode}
            />
          )}
        </div>

        {/* Done Button */}
        <div className={`flex-shrink-0 p-4 border-t ${
          isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          <button
            onClick={handleDone}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 touch-manipulation"
            style={{ minHeight: '56px' }}
          >
            <Check size={20} />
            Done
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

// ============================================
// Page Metadata Editor
// ============================================
interface PageMetadataEditorProps {
  metadata: PageMetadata;
  onMetadataChange: (metadata: PageMetadata) => void;
  isDarkMode: boolean;
}

const PageMetadataEditor: React.FC<PageMetadataEditorProps> = ({
  metadata,
  onMetadataChange,
  isDarkMode,
}) => {
  const inputClass = `w-full px-4 py-3 rounded-lg border text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-800 placeholder:text-gray-500 focus:border-blue-500'
  }`;

  return (
    <>
      {/* Info Banner */}
      <div className={`mx-4 mt-4 p-4 rounded-lg ${
        isDarkMode 
          ? 'bg-blue-500/20 border border-blue-500/30' 
          : 'bg-blue-50 border border-blue-100'
      }`}>
        <div className={`flex items-center gap-2 font-medium ${
          isDarkMode ? 'text-blue-300' : 'text-blue-800'
        }`}>
          <FileText size={18} />
          Page Settings
        </div>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-blue-300/80' : 'text-blue-700'}`}>
          Edit page metadata when no widget is selected.
        </p>
      </div>

      <Section title="Metadata" icon={<Settings size={18} />} isDarkMode={isDarkMode}>
        <Field label="Page Title" isDarkMode={isDarkMode}>
          <input
            type="text"
            className={inputClass}
            value={metadata.title}
            onChange={(e) => onMetadataChange({ ...metadata, title: e.target.value })}
            placeholder="Enter page title..."
            style={{ minHeight: `${BUILDER_TOUCH_CONFIG.minTouchTarget}px` }}
          />
        </Field>
        <Field label="Description" isDarkMode={isDarkMode}>
          <textarea
            className={inputClass}
            rows={4}
            value={metadata.description}
            onChange={(e) => onMetadataChange({ ...metadata, description: e.target.value })}
            placeholder="Enter page description for SEO..."
            style={{ minHeight: '100px' }}
          />
        </Field>
      </Section>
    </>
  );
};

// ============================================
// Block Properties Editor
// ============================================
interface BlockPropertiesEditorProps {
  selectedDef: WidgetSchema;
  renderField: (field: WidgetSchema['fields'][number]) => React.ReactNode;
  isDarkMode: boolean;
}

const BlockPropertiesEditor: React.FC<BlockPropertiesEditorProps> = ({
  selectedDef,
  renderField,
  isDarkMode,
}) => {
  // Group fields by category for better organization
  const groupedFields = useMemo(() => {
    const groups: Record<string, WidgetSchema['fields']> = {
      content: [],
      style: [],
      advanced: [],
    };

    for (const field of selectedDef.fields) {
      // Categorize fields based on their names
      if (field.name.includes('class') || field.name.includes('bg') || field.name.includes('isDark')) {
        groups.advanced.push(field);
      } else if (field.name.includes('Animation') || field.name.includes('animation')) {
        groups.style.push(field);
      } else {
        groups.content.push(field);
      }
    }

    return groups;
  }, [selectedDef.fields]);

  return (
    <>
      {/* Content Fields */}
      {groupedFields.content.length > 0 && (
        <Section title="Content" icon={<FileText size={18} />} isDarkMode={isDarkMode}>
          {groupedFields.content.map((field) => (
            <Field key={field.name} label={field.label} isDarkMode={isDarkMode}>
              {renderField(field)}
            </Field>
          ))}
        </Section>
      )}

      {/* Style/Animation Fields */}
      {groupedFields.style.length > 0 && (
        <Section title="Animation" icon={<Settings size={18} />} defaultOpen={false} isDarkMode={isDarkMode}>
          {groupedFields.style.map((field) => (
            <Field key={field.name} label={field.label} isDarkMode={isDarkMode}>
              {renderField(field)}
            </Field>
          ))}
        </Section>
      )}

      {/* Advanced Fields */}
      {groupedFields.advanced.length > 0 && (
        <Section title="Advanced" icon={<Settings size={18} />} defaultOpen={false} isDarkMode={isDarkMode}>
          {groupedFields.advanced.map((field) => (
            <Field key={field.name} label={field.label} isDarkMode={isDarkMode}>
              {renderField(field)}
            </Field>
          ))}
        </Section>
      )}
    </>
  );
};

export default MobilePropertiesPanel;
