# Implementation Plan: Layout Selector & Navigation Editor

## Overview

Triển khai tính năng Layout Selector và Navigation Editor cho Page Builder, bao gồm:
- Core types và interfaces
- Tree manipulation services
- UI components với drag-and-drop
- Persistence và export functionality

## Tasks

- [x] 1. Set up core types and interfaces
  - [x] 1.1 Create navigation types file with NavigationNode, HeaderData, FooterData, LayoutConfig
    - Define all interfaces as specified in design document
    - Export from core/types/index.ts
    - _Requirements: 2.1, 3.1, 7.1_
  - [ ]* 1.2 Write property test for NavigationNode schema validation
    - **Property 10: Node Validation**
    - **Validates: Requirements 2.7, 5.7**

- [x] 2. Implement TreeValidator service
  - [x] 2.1 Create TreeValidator with validateNode and validateTree methods
    - Validate required fields (text, href)
    - Check tree depth constraints
    - Return ValidationResult with errors
    - _Requirements: 2.7, 5.7_
  - [ ]* 2.2 Write property test for tree depth constraint
    - **Property 6: Tree Depth Constraint**
    - **Validates: Requirements 2.5**

- [x] 3. Implement TreeSerializer service
  - [x] 3.1 Create TreeSerializer with serialize and deserialize methods
    - Handle JSON serialization
    - Preserve all node properties and hierarchy
    - Validate on deserialize
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ]* 3.2 Write property test for serialization round-trip
    - **Property 11: Serialization Round-Trip**
    - **Validates: Requirements 7.1, 7.2, 7.3**
  - [x] 3.3 Implement toTypeScript export method
    - Generate valid TypeScript matching navigation.ts structure
    - Include proper imports and formatting
    - _Requirements: 6.3, 6.4_
  - [ ]* 3.4 Write property test for TypeScript export format
    - **Property 12: TypeScript Export Format**
    - **Validates: Requirements 6.3, 6.4**

- [x] 4. Checkpoint - Core services complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement DragDropManager service
  - [x] 5.1 Create DragDropManager with drag state management
    - Implement startDrag, updateDropTarget, completeDrop, cancelDrag
    - Track drag state (isDragging, draggedNodeId, dropTarget)
    - _Requirements: 4.1, 4.2, 4.6_
  - [x] 5.2 Implement isValidDrop method
    - Prevent dropping node into its own descendants
    - Prevent self-drop
    - Check depth constraints
    - _Requirements: 4.5_
  - [ ]* 5.3 Write property test for invalid drop prevention
    - **Property 8: Invalid Drop Prevention**
    - **Validates: Requirements 4.5**
  - [x] 5.4 Implement tree reordering logic
    - Move node to new position
    - Support before/after/child drop positions
    - Maintain tree integrity
    - _Requirements: 2.6, 4.3_
  - [ ]* 5.5 Write property test for drag-drop tree integrity
    - **Property 7: Drag-Drop Tree Integrity**
    - **Validates: Requirements 2.6, 4.3**
  - [ ]* 5.6 Write property test for drag cancel restoration
    - **Property 9: Drag Cancel Restoration**
    - **Validates: Requirements 4.7**

- [x] 6. Implement NavigationStore state management
  - [x] 6.1 Create NavigationStore with reducer and actions
    - Implement all action types from design
    - Handle header and footer data separately
    - Track dirty state
    - _Requirements: 2.1, 3.1_
  - [x] 6.2 Implement CRUD operations in store
    - ADD_NODE, UPDATE_NODE, DELETE_NODE actions
    - Proper tree traversal for nested operations
    - _Requirements: 2.2, 2.3, 2.4, 5.2, 5.4, 5.6_
  - [ ]* 6.3 Write property test for node addition invariant
    - **Property 3: Node Addition Invariant**
    - **Validates: Requirements 2.2, 3.2, 3.3, 5.2**
  - [ ]* 6.4 Write property test for node update preservation
    - **Property 4: Node Update Preservation**
    - **Validates: Requirements 2.3, 5.4**
  - [ ]* 6.5 Write property test for node deletion completeness
    - **Property 5: Node Deletion Completeness**
    - **Validates: Requirements 2.4, 5.6**

- [x] 7. Checkpoint - State management complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement persistence layer
  - [x] 8.1 Create auto-save to localStorage
    - Save on every modification
    - Debounce saves for performance
    - _Requirements: 6.1, 3.7_
  - [ ]* 8.2 Write property test for auto-save consistency
    - **Property 13: Auto-Save Consistency**
    - **Validates: Requirements 6.1, 3.7**
  - [x] 8.3 Implement server save functionality
    - POST to save endpoint
    - Handle errors and show feedback
    - _Requirements: 6.2, 6.5_

- [x] 9. Implement LayoutSelector UI component
  - [x] 9.1 Create LayoutSelector component
    - Display layout templates as visual previews
    - Handle layout selection
    - Show active layout indication
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - [ ]* 9.2 Write property test for layout selection persistence
    - **Property 1: Layout Selection Persistence**
    - **Validates: Requirements 1.2, 1.4**

- [x] 10. Implement TreeNode UI component
  - [x] 10.1 Create TreeNode component with drag handle
    - Render node with text, href, icon
    - Support expand/collapse for children
    - Include edit/delete/add-child buttons
    - _Requirements: 2.1, 3.1_
  - [x] 10.2 Integrate drag-and-drop functionality
    - Use DragDropManager for drag state
    - Show drop indicators
    - Handle drop events
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 11. Implement NodeForm UI component
  - [x] 11.1 Create NodeForm for add/edit operations
    - Form fields: text, href, target, icon
    - Validation feedback
    - Submit and cancel handlers
    - _Requirements: 5.1, 5.3_
  - [x] 11.2 Integrate with TreeValidator
    - Show validation errors inline
    - Prevent submit with invalid data
    - _Requirements: 5.7_

- [x] 12. Implement NavigationEditor UI component
  - [x] 12.1 Create NavigationEditor container component
    - Support header and footer modes
    - Render tree structure with TreeNode components
    - Include add root node button
    - _Requirements: 2.1, 3.1_
  - [x] 12.2 Implement header-specific features
    - Edit header links tree
    - Edit actions array
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 12.3 Implement footer-specific features
    - Edit footer link groups
    - Edit secondary links
    - Edit social links with icon picker
    - Edit footer note with HTML support
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ]* 12.4 Write property test for navigation tree building
    - **Property 2: Navigation Tree Building**
    - **Validates: Requirements 2.1, 3.1**

- [x] 13. Checkpoint - UI components complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Integration and wiring
  - [x] 14.1 Create useNavigationEditor hook
    - Combine store, services, and persistence
    - Expose clean API for components
    - _Requirements: All_
  - [x] 14.2 Add NavigationEditor to builder sidebar
    - Create panel in builder UI
    - Wire up to page configuration
    - _Requirements: All_
  - [x] 14.3 Add LayoutSelector to builder sidebar
    - Create layout panel
    - Wire up to page configuration
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 14.4 Export module from builder index
    - Update src/components/admin/builder/index.ts
    - Export all new components and services
    - _Requirements: All_

- [x] 15. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Use fast-check library for property-based testing
