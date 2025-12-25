// ==========================================
// Canvas and Editor State Types
// ==========================================

import type { StoryElement } from './story.types';

// Canvas State
export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showSafeZone: boolean;
  showRulers: boolean;
}

// Editor State
export interface EditorState {
  selectedElementIds: string[];
  copiedElements: StoryElement[];
  isMultiSelect: boolean;
  tool: 'select' | 'text' | 'shape' | 'draw';
}
