/**
 * NodeForm Component
 *
 * Form component for adding and editing navigation nodes.
 * Provides form fields for text, href, target, and icon properties.
 * Integrates with TreeValidator for inline validation feedback.
 *
 * Requirements: 5.1, 5.3, 5.7
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import type { NavigationNode, ValidationResult } from '../../core/types/navigation.types';
import { validateNode } from '../../services/navigation/TreeValidator';
import { IconPicker } from '../pickers/IconPicker';

/**
 * Props for NodeForm component
 */
export interface NodeFormProps {
  /** Existing node data for edit mode, undefined for add mode */
  node?: NavigationNode;
  /** Form mode: 'add' for new node, 'edit' for existing node */
  mode: 'add' | 'edit';
  /** Callback when form is submitted with valid data */
  onSubmit: (node: NavigationNode) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Dark mode flag */
  isDarkMode?: boolean;
}

/**
 * Form field state
 */
interface FormState {
  text: string;
  href: string;
  target: '_blank' | '_self';
  icon: string;
}

/**
 * Field-specific error state
 */
interface FieldErrors {
  text?: string;
  href?: string;
  target?: string;
}

/**
 * Generate a unique ID for new nodes
 */
function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * NodeForm Component
 */
export function NodeForm({
  node,
  mode,
  onSubmit,
  onCancel,
  isDarkMode = false,
}: NodeFormProps) {
  // Initialize form state
  const [formState, setFormState] = useState<FormState>({
    text: node?.text || '',
    href: node?.href || '',
    target: node?.target || '_self',
    icon: node?.icon || '',
  });

  // Field-level errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  
  // Track if form has been touched (for showing errors)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Update form state when node prop changes (for edit mode)
  useEffect(() => {
    if (node) {
      setFormState({
        text: node.text || '',
        href: node.href || '',
        target: node.target || '_self',
        icon: node.icon || '',
      });
      setFieldErrors({});
      setTouched({});
    }
  }, [node]);

  /**
   * Validate form and update field errors
   */
  const validateForm = useCallback((): ValidationResult => {
    const result = validateNode({
      text: formState.text,
      href: formState.href,
      target: formState.target,
    });

    // Convert validation errors to field-specific errors
    const errors: FieldErrors = {};
    result.errors.forEach((error) => {
      if (error.field === 'text' || error.field === 'href' || error.field === 'target') {
        errors[error.field] = error.message;
      }
    });
    setFieldErrors(errors);

    return result;
  }, [formState.text, formState.href, formState.target]);

  /**
   * Handle field change
   */
  const handleFieldChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Handle field blur - mark as touched and validate
   */
  const handleFieldBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ text: true, href: true, target: true });

    // Validate form
    const result = validateForm();
    if (!result.valid) {
      return;
    }

    // Create node object
    const submittedNode: NavigationNode = {
      id: node?.id || generateNodeId(),
      text: formState.text.trim(),
      href: formState.href.trim(),
      target: formState.target,
      icon: formState.icon || undefined,
      children: node?.children || [],
    };

    onSubmit(submittedNode);
  };

  // Style classes
  const inputBaseClass = `w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors`;
  const inputClass = `${inputBaseClass} ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
  }`;
  const inputErrorClass = `${inputBaseClass} ${
    isDarkMode
      ? 'bg-gray-700 border-red-500 text-gray-200 placeholder:text-gray-500'
      : 'bg-white border-red-500 text-gray-900 placeholder:text-gray-400'
  }`;
  const labelClass = `block text-sm font-medium mb-1.5 ${
    isDarkMode ? 'text-gray-300' : 'text-gray-700'
  }`;
  const errorClass = `flex items-center gap-1 mt-1 text-xs ${
    isDarkMode ? 'text-red-400' : 'text-red-600'
  }`;

  return (
    <div
      className={`rounded-lg border p-4 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      {/* Form Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className={`text-sm font-semibold ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}
        >
          {mode === 'add' ? 'Add New Link' : 'Edit Link'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <X size={16} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Text Field */}
        <div>
          <label htmlFor="node-text" className={labelClass}>
            Link Text <span className="text-red-500">*</span>
          </label>
          <input
            id="node-text"
            type="text"
            value={formState.text}
            onChange={(e) => handleFieldChange('text', e.target.value)}
            onBlur={() => handleFieldBlur('text')}
            placeholder="e.g., Home, About Us, Services"
            className={touched.text && fieldErrors.text ? inputErrorClass : inputClass}
          />
          {touched.text && fieldErrors.text && (
            <div className={errorClass}>
              <AlertCircle size={12} />
              <span>{fieldErrors.text}</span>
            </div>
          )}
        </div>

        {/* Href Field */}
        <div>
          <label htmlFor="node-href" className={labelClass}>
            Link URL <span className="text-red-500">*</span>
          </label>
          <input
            id="node-href"
            type="text"
            value={formState.href}
            onChange={(e) => handleFieldChange('href', e.target.value)}
            onBlur={() => handleFieldBlur('href')}
            placeholder="e.g., /, /about, https://example.com"
            className={touched.href && fieldErrors.href ? inputErrorClass : inputClass}
          />
          {touched.href && fieldErrors.href && (
            <div className={errorClass}>
              <AlertCircle size={12} />
              <span>{fieldErrors.href}</span>
            </div>
          )}
        </div>

        {/* Target Field */}
        <div>
          <label htmlFor="node-target" className={labelClass}>
            Open In
          </label>
          <select
            id="node-target"
            value={formState.target}
            onChange={(e) => handleFieldChange('target', e.target.value as '_blank' | '_self')}
            className={inputClass}
          >
            <option value="_self">Same Window</option>
            <option value="_blank">New Tab</option>
          </select>
        </div>

        {/* Icon Field */}
        <div>
          <label className={labelClass}>Icon (Optional)</label>
          <IconPicker
            value={formState.icon}
            onChange={(value) => handleFieldChange('icon', value)}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Save size={16} />
            {mode === 'add' ? 'Add Link' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default NodeForm;
