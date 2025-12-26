# Implementation Plan: API Data Widget

## Overview

Triển khai API Data Widget cho phép fetch dữ liệu từ API và hiển thị danh sách sản phẩm. Implementation sử dụng TypeScript/React, tích hợp vào hệ thống builder hiện có.

## Tasks

- [x] 1. Set up project structure and type definitions
  - [x] 1.1 Create ApiDataWidget directory structure
    - Create `src/components/admin/builder/core/types/apiDataWidget.types.ts`
    - Create `src/components/admin/builder/services/apiData/` folder
    - Create `src/components/admin/builder/ui/widgets/apiData/` folder
    - _Requirements: 1.1, 6.1_

  - [x] 1.2 Define TypeScript interfaces
    - Define `ApiAction`, `AuthConfig`, `DataMapperConfig`, `ItemMapping`
    - Define `ApiDataWidgetConfig`, `DisplayConfig`, `CacheConfig`, `MessageConfig`
    - Define `MappedProduct`, `CacheEntry`, `ApiError` types
    - _Requirements: 1.1, 1.2, 1.5, 2.1_

- [-] 2. Implement Data Mapper
  - [x] 2.1 Create DataMapper utility
    - Implement `getValueByPath(obj, path)` function with dot notation support
    - Implement `mapArrayData(data, rootPath, itemMapping)` function
    - Handle missing fields with fallback values
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.2 Write property test for Data Extraction
    - **Property 2: Data Extraction Correctness**
    - **Validates: Requirements 2.1, 2.3**

  - [ ]* 2.3 Write property test for Mapping Completeness
    - **Property 3: Mapping Completeness**
    - **Validates: Requirements 2.2, 2.4**

  - [ ]* 2.4 Write property test for Fallback Handling
    - **Property 4: Fallback Handling**
    - **Validates: Requirements 2.5**

- [x] 3. Implement Cache Manager
  - [x] 3.1 Create CacheManager utility
    - Implement `generateCacheKey(widgetId, endpoint, method, body, mapperConfig)` function
    - Implement `getCachedData(key)` function with TTL check
    - Implement `setCachedData(key, data, duration)` function
    - Implement `clearCache(key)` function
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 3.2 Write property test for Cache Behavior
    - **Property 7: Cache Behavior Correctness**
    - **Validates: Requirements 5.2, 5.4**

- [-] 4. Implement API Fetcher
  - [x] 4.1 Create ApiFetcher utility
    - Implement `buildRequestInit(action)` function with headers and auth
    - Implement `fetchData(action, abortSignal)` function with AbortController
    - Implement URL validation (HTTPS in production)
    - Handle network, HTTP, and parse errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 7.1_

  - [ ]* 4.2 Write property test for API Request Construction
    - **Property 1: API Request Construction**
    - **Validates: Requirements 1.1-1.7**

  - [ ]* 4.3 Write property test for URL Validation
    - **Property 9: URL Validation in Production**
    - **Validates: Requirements 7.1**

- [x] 5. Implement Security Utilities
  - [x] 5.1 Create sanitization utilities
    - Implement `sanitizeText(text)` function to escape HTML
    - Implement `formatPrice(price, currency)` function
    - _Requirements: 7.2_

  - [ ]* 5.2 Write property test for XSS Sanitization
    - **Property 10: XSS Sanitization**
    - **Validates: Requirements 7.2**

- [x] 6. Checkpoint - Core utilities complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Product Display Components
  - [x] 7.1 Create ProductCard component
    - Display image with placeholder fallback
    - Display sanitized name, price, description
    - Support link to product URL
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 7.2 Create ProductGrid component
    - Support grid and list layouts
    - Support configurable columns (2, 3, 4)
    - Responsive design (1 column mobile)
    - _Requirements: 3.1_

  - [ ]* 7.3 Write property test for Product Rendering
    - **Property 5: Product Rendering Completeness**
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 7.4 Write property test for Placeholder Image
    - **Property 6: Placeholder Image Substitution**
    - **Validates: Requirements 3.4**

- [-] 8. Implement Main Widget Component
  - [x] 8.1 Create ApiDataWidget component
    - Implement state management for loading, error, data
    - Integrate ApiFetcher, DataMapper, CacheManager
    - Render loading indicator while fetching
    - Render error message on failure
    - Render empty state when no data
    - Render ProductGrid with mapped data
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 8.2 Write property test for Token Non-Exposure
    - **Property 11: Token Non-Exposure**
    - **Validates: Requirements 7.3**

- [x] 9. Implement Builder Config UI
  - [x] 9.1 Create ApiDataWidgetConfig component
    - Create form for endpoint URL, method selection
    - Create headers key-value editor
    - Create auth type selector with conditional fields
    - Create data mapping field inputs
    - Create display options (columns, currency, etc.)
    - Create cache duration input
    - Create custom messages inputs
    - _Requirements: 6.2, 6.3_

  - [x] 9.2 Implement validation and preview
    - Validate required fields (endpoint URL)
    - Validate URL format and HTTPS in production
    - Show live preview with test fetch
    - _Requirements: 6.4, 6.5_

  - [ ]* 9.3 Write property test for Serialization Round-Trip
    - **Property 8: Configuration Serialization Round-Trip**
    - **Validates: Requirements 6.6**

- [x] 10. Integrate with Builder Registry
  - [x] 10.1 Register ApiDataWidget in registry
    - Add widget schema to WIDGET_REGISTRY
    - Define default props and fields
    - _Requirements: 6.1_

  - [x] 10.2 Export from builder module
    - Update `src/components/admin/builder/index.ts`
    - _Requirements: 6.1_

- [ ] 11. Final checkpoint - All tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
