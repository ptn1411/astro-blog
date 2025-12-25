/**
 * Story Module Entry Point
 * 
 * This module exports all public APIs from the Story Editor module.
 * Import from this file to access any Story module functionality.
 */

// ==========================================
// Core Types and Presets
// ==========================================
export * from './core';

// ==========================================
// Configuration
// ==========================================
export * from './config';

// ==========================================
// Animations
// ==========================================
export * from './animations';

// ==========================================
// Services
// ==========================================
export * from './services';

// ==========================================
// Utils
// ==========================================
export * from './utils';

// ==========================================
// UI Components
// ==========================================
export * from './ui';

// ==========================================
// Mobile Components
// ==========================================
export * from './mobile';

// ==========================================
// Backward Compatibility Exports
// ==========================================
// These exports maintain compatibility with existing imports

// Types (from original types.ts)
export * from './types';

// Animations (from original animation files)
export * from './animations';
export * from './animationTemplates';
export * from './animationUtils';

// Constants
export * from './constants/breakpoints';
