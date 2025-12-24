import { useCallback, useEffect, useMemo, useState } from 'react';
import { WIDGET_REGISTRY, type WidgetSchema, type WidgetType } from '../registry';
import {
  loadCustomWidgets,
  loadWidgetsFromLocalStorage,
  saveCustomWidgets,
  saveWidgetsToLocalStorage,
} from '../actions/widgetStorage';

export interface UseWidgetRegistryReturn {
  // Registry state
  widgets: WidgetSchema[];
  customWidgets: WidgetSchema[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addWidget: (widget: WidgetSchema) => Promise<boolean>;
  updateWidget: (type: WidgetType | string, updates: Partial<WidgetSchema>) => Promise<boolean>;
  removeWidget: (type: WidgetType | string) => Promise<boolean>;
  
  // Sync
  syncFromRemote: () => Promise<void>;
  syncToRemote: () => Promise<{ local: boolean; remote: boolean }>;
  
  // Helpers
  getWidget: (type: WidgetType | string) => WidgetSchema | undefined;
  isCustomWidget: (type: WidgetType | string) => boolean;
}

/**
 * Hook để quản lý widget registry động
 * Kết hợp built-in widgets với custom widgets từ storage
 */
export function useWidgetRegistry(): UseWidgetRegistryReturn {
  const [customWidgets, setCustomWidgets] = useState<WidgetSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Combined registry: built-in + custom (custom có thể override built-in)
  // Memoized to prevent unnecessary re-renders
  const widgets = useMemo(() => {
    const combined = [...WIDGET_REGISTRY];
    
    // Add custom widgets, override if type exists
    customWidgets.forEach(customWidget => {
      const existingIndex = combined.findIndex(w => w.type === customWidget.type);
      if (existingIndex >= 0) {
        combined[existingIndex] = customWidget;
      } else {
        combined.push(customWidget);
      }
    });
    
    return combined;
  }, [customWidgets]);

  // Load custom widgets on mount
  useEffect(() => {
    const loadWidgets = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load từ localStorage trước (instant)
        const localWidgets = loadWidgetsFromLocalStorage();
        if (localWidgets.length > 0) {
          setCustomWidgets(localWidgets);
        }
        
        // Sau đó load từ remote (async)
        const remoteWidgets = await loadCustomWidgets();
        if (remoteWidgets.length > 0) {
          setCustomWidgets(remoteWidgets);
        }
      } catch (err) {
        console.error('Failed to load custom widgets:', err);
        setError('Failed to load custom widgets');
      } finally {
        setIsLoading(false);
      }
    };

    loadWidgets();
  }, []);

  // Add new custom widget
  const addWidget = useCallback(async (widget: WidgetSchema): Promise<boolean> => {
    try {
      // Check if type already exists in custom widgets
      const exists = customWidgets.some(w => w.type === widget.type);
      if (exists) {
        setError(`Widget type "${widget.type}" already exists`);
        return false;
      }

      const newCustomWidgets = [...customWidgets, widget];
      setCustomWidgets(newCustomWidgets);
      
      // Save to storage
      saveWidgetsToLocalStorage(newCustomWidgets);
      
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to add widget:', err);
      setError('Failed to add widget');
      return false;
    }
  }, [customWidgets]);

  // Update existing custom widget
  const updateWidget = useCallback(async (type: WidgetType | string, updates: Partial<WidgetSchema>): Promise<boolean> => {
    try {
      const index = customWidgets.findIndex(w => w.type === type);
      if (index === -1) {
        setError(`Widget type "${type}" not found in custom widgets`);
        return false;
      }

      const newCustomWidgets = [...customWidgets];
      newCustomWidgets[index] = { ...newCustomWidgets[index], ...updates };
      setCustomWidgets(newCustomWidgets);
      
      // Save to storage
      saveWidgetsToLocalStorage(newCustomWidgets);
      
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to update widget:', err);
      setError('Failed to update widget');
      return false;
    }
  }, [customWidgets]);

  // Remove custom widget
  const removeWidget = useCallback(async (type: WidgetType | string): Promise<boolean> => {
    try {
      const newCustomWidgets = customWidgets.filter(w => w.type !== type);
      
      if (newCustomWidgets.length === customWidgets.length) {
        setError(`Widget type "${type}" not found in custom widgets`);
        return false;
      }

      setCustomWidgets(newCustomWidgets);
      
      // Save to storage
      saveWidgetsToLocalStorage(newCustomWidgets);
      
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to remove widget:', err);
      setError('Failed to remove widget');
      return false;
    }
  }, [customWidgets]);

  // Sync from remote storage
  const syncFromRemote = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const remoteWidgets = await loadCustomWidgets();
      setCustomWidgets(remoteWidgets);
    } catch (err) {
      console.error('Failed to sync from remote:', err);
      setError('Failed to sync from remote');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync to remote storage
  const syncToRemote = useCallback(async (): Promise<{ local: boolean; remote: boolean }> => {
    setError(null);
    
    try {
      const result = await saveCustomWidgets(customWidgets);
      if (!result.remote) {
        setError('Saved locally but failed to sync to remote');
      }
      return result;
    } catch (err) {
      console.error('Failed to sync to remote:', err);
      setError('Failed to sync to remote');
      return { local: false, remote: false };
    }
  }, [customWidgets]);

  // Get widget by type
  const getWidget = useCallback((type: WidgetType | string): WidgetSchema | undefined => {
    return widgets.find(w => w.type === type);
  }, [widgets]);

  // Check if widget is custom
  const isCustomWidget = useCallback((type: WidgetType | string): boolean => {
    return customWidgets.some(w => w.type === type);
  }, [customWidgets]);

  return {
    widgets,
    customWidgets,
    isLoading,
    error,
    addWidget,
    updateWidget,
    removeWidget,
    syncFromRemote,
    syncToRemote,
    getWidget,
    isCustomWidget,
  };
}
