# Implementation Plan: API Data Widget

## Overview

Triển khai API Data Widget cho phép fetch dữ liệu từ API và hiển thị danh sách sản phẩm. Implementation sử dụng TypeScript/React, tích hợp vào hệ thống builder hiện có.

## Tasks

- [ ] 1. Set up project structure and type definitions
  - [ ] 1.1 Create ApiDataWidget directory structure
    - Create `src/components/admin/builder/ApiDataWidget/` folder
    - Create `index.ts`, `types.ts` files
    - _Requirements: 1.1, 6.1_

  - [ ] 1.2 Define TypeScript interfaces
    - Define `ApiAction`, `AuthConfig`, `DataMapperConfig`, `ItemMapping`
    - Define `ApiDataWidgetConfig`, `DisplayConfig`, `CacheConfig`, `MessageConfig`
    - Define `MappedProduct`, `CacheEntry`, `ApiError` types
    - _Requirements: 1.1, 1.2, 1.5, 2.1_

- [ ] 2. Implement Data Mapper
  - [ ] 2.1 Create DataMapper utility
    - Implement `getValueByPath(obj, path)` function with dot notation support
    - Implement `mapArrayData(data, rootPath, itemMapping)` function
    - Handle missing fields with fallback values
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.2 Write property test for Data Extraction
    - **Property 2: Data Extraction Correctness**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 2.3 Write property test for Fallback Handling
    - **Property 4: Fallback Value Handling**
    - **Validates: Requirements 2.5**

- [ ] 3. Implement Cache Manager
  - [ ] 3.1 Create CacheManager utility
    - Implement `getCacheKey(widgetId)` function
    - Implement `getCache(widgetId)` function to read from localStorage
    - Implement `setCache(widgetId, data, duration)` function
    - Implement `isExpired(cacheEntry, duration)` function
    - Implement `clearCache(widgetId)` function
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 3.2 Write property test for Cache Behavior
    - **Property 7: Cache Behavior Correctness**
    - **Validates: Requirements 5.2, 5.4**

- [ ] 4. Implement API Fetcher
  - [ ] 4.1 Create ApiFetcher utility
    - Implement `buildHeaders(action)` function with auth support
    - Implement `fetchData(action)` function with GET/POST support
    - Implement error handling for network, HTTP, parse errors
    - _Requirements: 1.2, 1.3, 1.4, 1.6, 1.7, 4.2, 4.5_

  - [ ]* 4.2 Write property test for Request Configuration
    - **Property 1: Request Configuration Correctness**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.6, 1.7**

- [ ] 5. Implement Security Utilities
  - [ ] 5.1 Create security utilities
    - Implement `validateEndpoint(url, isProduction)` function
    - Implement `sanitizeHtml(str)` function to escape HTML/script tags
    - Implement `maskToken(token)` function for UI display
    - _Requirements: 7.1, 7.2, 7.4_

  - [ ]* 5.2 Write property test for URL Validation
    - **Property 9: URL Validation in Production**
    - **Validates: Requirements 7.1**

  - [ ]* 5.3 Write property test for XSS Sanitization
    - **Property 10: XSS Sanitization**
    - **Validates: Requirements 7.2**

- [ ] 6. Checkpoint - Core utilities complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Product Display Components
  - [ ] 7.1 Create ProductCard component
    - Render product image with placeholder fallback
    - Render product name, formatted price with currency
    - Render description (truncated)
    - Handle click to navigate to product URL
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [ ] 7.2 Create ProductGrid component
    - Render responsive grid layout (1/2/3 columns)
    - Map MappedProduct array to ProductCard components
    - _Requirements: 3.1_

  - [ ]* 7.3 Write property test for Product Rendering
    - **Property 5: Product Rendering Completeness**
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 7.4 Write property test for Placeholder Image
    - **Property 6: Placeholder Image Substitution**
    - **Validates: Requirements 3.4**

- [ ] 8. Implement Main Widget Component
  - [ ] 8.1 Create ApiDataWidget component
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

- [ ] 9. Implement Builder Config UI
  - [ ] 9.1 Create ApiDataWidgetConfig component
    - Create form for endpoint URL, method selection
    - Create headers key-value editor
    - Create auth type selector with conditional fields
    - Create data mapping field inputs
    - Create display options (columns, currency, etc.)
    - Create cache duration input
    - Create custom messages inputs
    - _Requirements: 6.2, 6.3_

  - [ ] 9.2 Implement validation and preview
    - Validate required fields (endpoint URL)
    - Validate URL format and HTTPS in production
    - Implement preview button to test API call
    - _Requirements: 6.4, 6.5_

- [ ] 10. Integrate with Builder System
  - [ ] 10.1 Register widget in registry
    - Add ApiDataWidget to widget registry
    - Add widget to palette with icon and description
    - _Requirements: 6.1_

  - [ ] 10.2 Update serializer for ApiDataWidget
    - Add serialization logic for ApiDataWidget config
    - Ensure token is not included in serialized output
    - _Requirements: 6.6, 7.3_

  - [ ]* 10.3 Write property test for Serialization Round-Trip
    - **Property 8: Configuration Serialization Round-Trip**
    - **Validates: Requirements 6.6**

- [ ] 11. Final checkpoint - All features complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use `fast-check` library
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
