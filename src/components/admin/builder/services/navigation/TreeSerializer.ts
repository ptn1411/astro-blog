/**
 * TreeSerializer - Service for serializing and deserializing navigation tree structures
 * 
 * Handles:
 * - JSON serialization/deserialization of NavigationNode trees
 * - Preservation of all node properties and hierarchy
 * - Validation on deserialize
 * - TypeScript export for navigation.ts structure
 */

import type {
  NavigationNode,
  HeaderData,
  FooterData,
  HeaderLink,
  ValidationResult,
} from '../../core/types/navigation.types';
import { validateTree } from './TreeValidator';

/**
 * Serializes a navigation tree to JSON string.
 * 
 * @param tree - Array of NavigationNode to serialize
 * @returns JSON string representation of the tree
 * 
 * @example
 * serialize([{ id: '1', text: 'Home', href: '/' }])
 * // '[ { "id": "1", "text": "Home", "href": "/" }]'
 */
export function serialize(tree: NavigationNode[]): string {
  return JSON.stringify(tree, null, 2);
}

/**
 * Deserializes a JSON string to a navigation tree.
 * Validates the deserialized data against the NavigationNode schema.
 * 
 * @param json - JSON string to deserialize
 * @returns Object containing the deserialized tree and validation result
 * @throws Error if JSON parsing fails
 * 
 * @example
 * deserialize('[{"id":"1","text":"Home","href":"/"}]')
 * // { tree: [{ id: '1', text: 'Home', href: '/' }], validation: { valid: true, errors: [] } }
 */
export function deserialize(json: string): {
  tree: NavigationNode[];
  validation: ValidationResult;
} {
  let parsed: unknown;
  
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      tree: [],
      validation: {
        valid: false,
        errors: [{ field: 'json', message: 'Invalid JSON format' }],
      },
    };
  }

  // Validate that parsed data is an array
  if (!Array.isArray(parsed)) {
    return {
      tree: [],
      validation: {
        valid: false,
        errors: [{ field: 'root', message: 'Navigation tree must be an array' }],
      },
    };
  }

  // Cast to NavigationNode array and validate
  const tree = parsed as NavigationNode[];
  const validation = validateTree(tree);

  return { tree, validation };
}

/**
 * Serializes HeaderData to JSON string.
 * 
 * @param headerData - HeaderData to serialize
 * @returns JSON string representation
 */
export function serializeHeaderData(headerData: HeaderData): string {
  return JSON.stringify(headerData, null, 2);
}

/**
 * Deserializes JSON string to HeaderData.
 * 
 * @param json - JSON string to deserialize
 * @returns Object containing deserialized HeaderData and validation result
 */
export function deserializeHeaderData(json: string): {
  data: HeaderData | null;
  validation: ValidationResult;
} {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      data: null,
      validation: {
        valid: false,
        errors: [{ field: 'json', message: 'Invalid JSON format' }],
      },
    };
  }

  // Basic structure validation
  if (!parsed || typeof parsed !== 'object') {
    return {
      data: null,
      validation: {
        valid: false,
        errors: [{ field: 'root', message: 'HeaderData must be an object' }],
      },
    };
  }

  const obj = parsed as Record<string, unknown>;
  const errors: { field: string; message: string }[] = [];

  // Validate links array
  if (!Array.isArray(obj.links)) {
    errors.push({ field: 'links', message: 'HeaderData.links must be an array' });
  }

  // Validate actions array
  if (!Array.isArray(obj.actions)) {
    errors.push({ field: 'actions', message: 'HeaderData.actions must be an array' });
  }

  if (errors.length > 0) {
    return {
      data: null,
      validation: { valid: false, errors },
    };
  }

  return {
    data: parsed as HeaderData,
    validation: { valid: true, errors: [] },
  };
}

/**
 * Serializes FooterData to JSON string.
 * 
 * @param footerData - FooterData to serialize
 * @returns JSON string representation
 */
export function serializeFooterData(footerData: FooterData): string {
  return JSON.stringify(footerData, null, 2);
}

/**
 * Deserializes JSON string to FooterData.
 * 
 * @param json - JSON string to deserialize
 * @returns Object containing deserialized FooterData and validation result
 */
export function deserializeFooterData(json: string): {
  data: FooterData | null;
  validation: ValidationResult;
} {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      data: null,
      validation: {
        valid: false,
        errors: [{ field: 'json', message: 'Invalid JSON format' }],
      },
    };
  }

  // Basic structure validation
  if (!parsed || typeof parsed !== 'object') {
    return {
      data: null,
      validation: {
        valid: false,
        errors: [{ field: 'root', message: 'FooterData must be an object' }],
      },
    };
  }

  const obj = parsed as Record<string, unknown>;
  const errors: { field: string; message: string }[] = [];

  // Validate required arrays
  if (!Array.isArray(obj.links)) {
    errors.push({ field: 'links', message: 'FooterData.links must be an array' });
  }
  if (!Array.isArray(obj.secondaryLinks)) {
    errors.push({ field: 'secondaryLinks', message: 'FooterData.secondaryLinks must be an array' });
  }
  if (!Array.isArray(obj.socialLinks)) {
    errors.push({ field: 'socialLinks', message: 'FooterData.socialLinks must be an array' });
  }
  if (typeof obj.footNote !== 'string') {
    errors.push({ field: 'footNote', message: 'FooterData.footNote must be a string' });
  }

  if (errors.length > 0) {
    return {
      data: null,
      validation: { valid: false, errors },
    };
  }

  return {
    data: parsed as FooterData,
    validation: { valid: true, errors: [] },
  };
}


/**
 * Formats a HeaderLink for TypeScript export.
 * Handles nested links recursively.
 * 
 * @param link - HeaderLink to format
 * @param indent - Current indentation level
 * @returns Formatted TypeScript string
 */
function formatHeaderLink(link: HeaderLink, indent: number = 4): string {
  const spaces = ' '.repeat(indent);
  const innerSpaces = ' '.repeat(indent + 2);
  
  let result = `${spaces}{\n`;
  result += `${innerSpaces}text: '${escapeString(link.text)}',\n`;
  
  if (link.href) {
    // Check if href uses getPermalink or getBlogPermalink
    if (link.href === '/blog' || link.href.startsWith('/blog/')) {
      result += `${innerSpaces}href: getBlogPermalink(),\n`;
    } else if (link.href.startsWith('/') || link.href.startsWith('#')) {
      result += `${innerSpaces}href: getPermalink('${escapeString(link.href)}'),\n`;
    } else {
      result += `${innerSpaces}href: '${escapeString(link.href)}',\n`;
    }
  }
  
  if (link.target) {
    result += `${innerSpaces}target: '${link.target}',\n`;
  }
  
  if (link.icon) {
    result += `${innerSpaces}icon: '${escapeString(link.icon)}',\n`;
  }
  
  if (link.links && link.links.length > 0) {
    result += `${innerSpaces}links: [\n`;
    link.links.forEach((childLink, index) => {
      result += formatHeaderLink(childLink, indent + 4);
      if (index < link.links!.length - 1) {
        result = result.trimEnd() + ',\n';
      } else {
        result = result.trimEnd() + '\n';
      }
    });
    result += `${innerSpaces}],\n`;
  }
  
  result += `${spaces}}`;
  return result;
}

/**
 * Escapes special characters in strings for TypeScript output.
 * 
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Generates TypeScript code for navigation.ts file.
 * Matches the existing navigation.ts structure with proper imports and formatting.
 * 
 * @param headerData - HeaderData to export
 * @param footerData - FooterData to export
 * @returns Valid TypeScript code string
 * 
 * @example
 * toTypeScript(headerData, footerData)
 * // Returns formatted TypeScript code matching navigation.ts structure
 */
export function toTypeScript(headerData: HeaderData, footerData: FooterData): string {
  let output = '';
  
  // Add imports
  output += "import { getBlogPermalink, getPermalink } from './utils/permalinks';\n\n";
  
  // Generate headerData
  output += 'export const headerData = {\n';
  output += '  links: [\n';
  
  headerData.links.forEach((link, index) => {
    output += formatHeaderLink(link, 4);
    if (index < headerData.links.length - 1) {
      output += ',\n';
    } else {
      output += '\n';
    }
  });
  
  output += '  ],\n';
  output += '  actions: [\n';
  
  headerData.actions.forEach((action, index) => {
    output += `    { text: '${escapeString(action.text)}', href: '${escapeString(action.href)}'`;
    if (action.target) {
      output += `, target: '${action.target}'`;
    }
    output += ' }';
    if (index < headerData.actions.length - 1) {
      output += ',\n';
    } else {
      output += '\n';
    }
  });
  
  output += '  ],\n';
  output += '};\n\n';
  
  // Generate footerData
  output += 'export const footerData = {\n';
  output += '  links: [\n';
  
  footerData.links.forEach((group, groupIndex) => {
    output += '    {\n';
    output += `      title: '${escapeString(group.title)}',\n`;
    output += '      links: [\n';
    
    group.links.forEach((link, linkIndex) => {
      output += `        { text: '${escapeString(link.text)}', href: '${escapeString(link.href)}' }`;
      if (linkIndex < group.links.length - 1) {
        output += ',\n';
      } else {
        output += '\n';
      }
    });
    
    output += '      ],\n';
    output += '    }';
    if (groupIndex < footerData.links.length - 1) {
      output += ',\n';
    } else {
      output += '\n';
    }
  });
  
  output += '  ],\n';
  
  // Secondary links
  output += '  secondaryLinks: [\n';
  footerData.secondaryLinks.forEach((link, index) => {
    output += `    { text: '${escapeString(link.text)}', href: getPermalink('${escapeString(link.href)}') }`;
    if (index < footerData.secondaryLinks.length - 1) {
      output += ',\n';
    } else {
      output += '\n';
    }
  });
  output += '  ],\n';
  
  // Social links
  output += '  socialLinks: [\n';
  footerData.socialLinks.forEach((link, index) => {
    output += `    { ariaLabel: '${escapeString(link.ariaLabel)}', icon: '${escapeString(link.icon)}', href: '${escapeString(link.href)}' }`;
    if (index < footerData.socialLinks.length - 1) {
      output += ',\n';
    } else {
      output += '\n';
    }
  });
  output += '  ],\n';
  
  // Footer note - preserve HTML content
  output += '  footNote: `\n';
  output += `    ${footerData.footNote.trim()}\n`;
  output += '  `,\n';
  
  output += '};\n';
  
  return output;
}

/**
 * TreeSerializer class providing a stateful interface for serialization operations.
 */
export class TreeSerializer {
  /**
   * Serializes a navigation tree to JSON string.
   */
  serialize(tree: NavigationNode[]): string {
    return serialize(tree);
  }

  /**
   * Deserializes a JSON string to a navigation tree with validation.
   */
  deserialize(json: string): {
    tree: NavigationNode[];
    validation: ValidationResult;
  } {
    return deserialize(json);
  }

  /**
   * Serializes HeaderData to JSON string.
   */
  serializeHeaderData(headerData: HeaderData): string {
    return serializeHeaderData(headerData);
  }

  /**
   * Deserializes JSON string to HeaderData with validation.
   */
  deserializeHeaderData(json: string): {
    data: HeaderData | null;
    validation: ValidationResult;
  } {
    return deserializeHeaderData(json);
  }

  /**
   * Serializes FooterData to JSON string.
   */
  serializeFooterData(footerData: FooterData): string {
    return serializeFooterData(footerData);
  }

  /**
   * Deserializes JSON string to FooterData with validation.
   */
  deserializeFooterData(json: string): {
    data: FooterData | null;
    validation: ValidationResult;
  } {
    return deserializeFooterData(json);
  }

  /**
   * Generates TypeScript code for navigation.ts file.
   */
  toTypeScript(headerData: HeaderData, footerData: FooterData): string {
    return toTypeScript(headerData, footerData);
  }
}
