# Requirements Document

## Introduction

Tính năng API Data Widget cho phép người dùng tạo widget có khả năng gọi API (GET/POST) để lấy dữ liệu và hiển thị theo dạng danh sách sản phẩm hoặc các định dạng khác. Widget này tích hợp vào hệ thống builder hiện có, cho phép cấu hình endpoint, method, headers, và mapping dữ liệu response vào template hiển thị.

## Glossary

- **API_Data_Widget**: Widget có khả năng gọi API để lấy dữ liệu và render theo template
- **Action**: Cấu hình một API call bao gồm endpoint, method, headers, body
- **Data_Mapper**: Cơ chế mapping dữ liệu từ API response vào các field của template
- **Product_List_Template**: Template mặc định hiển thị danh sách sản phẩm với hình ảnh, tên, giá, mô tả
- **Builder**: Hệ thống page builder hiện có trong admin
- **DynamicWidgetRenderer**: Component React render widget dựa trên template

## Requirements

### Requirement 1: Cấu hình API Action

**User Story:** As a content editor, I want to configure API endpoints for widgets, so that I can fetch dynamic data from external sources.

#### Acceptance Criteria

1. THE API_Data_Widget SHALL support configuring an API endpoint URL
2. THE API_Data_Widget SHALL support HTTP methods GET and POST
3. THE API_Data_Widget SHALL support configuring custom headers as key-value pairs
4. WHEN method is POST, THE API_Data_Widget SHALL support configuring request body as JSON
5. THE API_Data_Widget SHALL support configuring authentication type (none, bearer token, API key)
6. WHEN authentication is bearer token, THE API_Data_Widget SHALL include Authorization header with Bearer prefix
7. WHEN authentication is API key, THE API_Data_Widget SHALL include the key in specified header name

### Requirement 2: Data Mapping

**User Story:** As a content editor, I want to map API response data to widget fields, so that I can display the data in the desired format.

#### Acceptance Criteria

1. THE Data_Mapper SHALL support JSONPath-like syntax to extract data from API response
2. THE Data_Mapper SHALL support mapping to array field for list rendering
3. THE Data_Mapper SHALL support mapping nested object properties using dot notation
4. WHEN mapping array data, THE Data_Mapper SHALL support specifying item field mappings for name, price, image, description
5. IF API response structure changes, THEN THE Data_Mapper SHALL gracefully handle missing fields with fallback values

### Requirement 3: Product List Display

**User Story:** As a website visitor, I want to see products displayed in a grid layout, so that I can browse available items easily.

#### Acceptance Criteria

1. THE Product_List_Template SHALL display items in a responsive grid (1 column mobile, 2-3 columns desktop)
2. THE Product_List_Template SHALL display product image, name, price, and description for each item
3. WHEN price is available, THE Product_List_Template SHALL format price with currency symbol
4. WHEN image is missing, THE Product_List_Template SHALL display a placeholder image
5. THE Product_List_Template SHALL support click action to navigate to product detail URL

### Requirement 4: Loading and Error States

**User Story:** As a website visitor, I want to see appropriate feedback while data is loading or if errors occur, so that I understand the current state.

#### Acceptance Criteria

1. WHILE API request is in progress, THE API_Data_Widget SHALL display a loading indicator
2. IF API request fails, THEN THE API_Data_Widget SHALL display an error message
3. IF API returns empty data, THEN THE API_Data_Widget SHALL display an empty state message
4. THE API_Data_Widget SHALL support configuring custom loading, error, and empty state messages
5. WHEN error occurs, THE API_Data_Widget SHALL log error details to console for debugging

### Requirement 5: Caching and Refresh

**User Story:** As a content editor, I want to control data caching behavior, so that I can balance between performance and data freshness.

#### Acceptance Criteria

1. THE API_Data_Widget SHALL support configuring cache duration in seconds
2. WHEN cache is valid, THE API_Data_Widget SHALL use cached data instead of making new request
3. THE API_Data_Widget SHALL support manual refresh action to bypass cache
4. WHEN cache duration is 0, THE API_Data_Widget SHALL always fetch fresh data
5. THE API_Data_Widget SHALL store cached data in browser localStorage with widget ID as key

### Requirement 6: Builder Integration

**User Story:** As a content editor, I want to configure API widgets through the visual builder, so that I can easily set up data-driven content.

#### Acceptance Criteria

1. THE Builder SHALL include API_Data_Widget in the widget palette
2. THE Builder SHALL provide a form UI to configure API endpoint, method, headers
3. THE Builder SHALL provide a data mapping UI with field selectors
4. THE Builder SHALL provide preview functionality to test API calls
5. WHEN saving widget configuration, THE Builder SHALL validate required fields (endpoint URL)
6. THE Builder SHALL serialize API_Data_Widget configuration to JSON for storage

### Requirement 7: Security

**User Story:** As a system administrator, I want API calls to be secure, so that sensitive data is protected.

#### Acceptance Criteria

1. THE API_Data_Widget SHALL only allow HTTPS endpoints in production mode
2. THE API_Data_Widget SHALL sanitize API response data before rendering to prevent XSS
3. THE API_Data_Widget SHALL not expose authentication tokens in client-side rendered HTML
4. WHEN storing API keys, THE Builder SHALL mask the value in the UI after saving
5. THE API_Data_Widget SHALL support CORS proxy configuration for cross-origin requests
