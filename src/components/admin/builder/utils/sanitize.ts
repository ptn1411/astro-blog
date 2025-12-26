/**
 * Security Utilities for API Data Widget
 * Provides XSS sanitization and safe formatting functions
 * 
 * Requirements: 7.2 - Sanitize all rendered text to prevent XSS attacks
 */

/**
 * HTML entities map for escaping dangerous characters
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Regex pattern to match characters that need escaping
 */
const ESCAPE_REGEX = /[&<>"'`=/]/g;

/**
 * Sanitizes text by escaping HTML special characters to prevent XSS attacks.
 * 
 * @param text - The input text to sanitize
 * @returns Sanitized text with HTML entities escaped, or empty string if input is null/undefined
 * 
 * @example
 * sanitizeText('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
 * 
 * sanitizeText('Hello <b>World</b>')
 * // Returns: 'Hello &lt;b&gt;World&lt;&#x2F;b&gt;'
 */
export function sanitizeText(text: string | null | undefined): string {
  if (text === null || text === undefined) {
    return '';
  }

  // Convert to string in case a non-string value is passed
  const str = String(text);

  return str.replace(ESCAPE_REGEX, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Currency symbol map for common currencies
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  VND: '₫',
  THB: '฿',
  INR: '₹',
  RUB: '₽',
  BRL: 'R$',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  HKD: 'HK$',
  SGD: 'S$',
  MXN: 'MX$',
  NZD: 'NZ$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  TRY: '₺',
  ZAR: 'R',
  AED: 'د.إ',
  SAR: '﷼',
  MYR: 'RM',
  IDR: 'Rp',
  PHP: '₱',
  TWD: 'NT$',
};

/**
 * Formats a price value with the specified currency symbol.
 * 
 * @param price - The numeric price value (can be number, string, null, or undefined)
 * @param currency - The currency code (e.g., 'USD', 'EUR', 'VND')
 * @returns Formatted price string with currency symbol, or empty string if price is invalid
 * 
 * @example
 * formatPrice(99.99, 'USD')
 * // Returns: '$99.99'
 * 
 * formatPrice(1000000, 'VND')
 * // Returns: '₫1,000,000'
 * 
 * formatPrice(null, 'USD')
 * // Returns: ''
 */
export function formatPrice(
  price: number | string | null | undefined,
  currency: string = 'USD'
): string {
  // Handle null, undefined, or empty values
  if (price === null || price === undefined || price === '') {
    return '';
  }

  // Convert to number
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Check for invalid numbers
  if (isNaN(numericPrice) || !isFinite(numericPrice)) {
    return '';
  }

  // Get currency symbol (fallback to currency code if not found)
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;

  // Format the number with appropriate decimal places
  // Currencies like JPY, VND, KRW typically don't use decimal places
  const noDecimalCurrencies = ['JPY', 'VND', 'KRW', 'IDR', 'TWD'];
  const useDecimals = !noDecimalCurrencies.includes(currency.toUpperCase());

  const formattedNumber = numericPrice.toLocaleString('en-US', {
    minimumFractionDigits: useDecimals ? 2 : 0,
    maximumFractionDigits: useDecimals ? 2 : 0,
  });

  return `${symbol}${formattedNumber}`;
}

/**
 * Checks if a string contains potentially dangerous HTML/script content.
 * Useful for validation before rendering.
 * 
 * @param text - The text to check
 * @returns true if the text contains potentially dangerous content
 */
export function containsUnsafeContent(text: string | null | undefined): boolean {
  if (!text) {
    return false;
  }

  const str = String(text).toLowerCase();

  // Check for script tags
  if (/<script[\s>]/i.test(str)) {
    return true;
  }

  // Check for event handlers
  if (/on\w+\s*=/i.test(str)) {
    return true;
  }

  // Check for javascript: protocol
  if (/javascript:/i.test(str)) {
    return true;
  }

  // Check for data: protocol (can be used for XSS)
  if (/data:/i.test(str)) {
    return true;
  }

  return false;
}
