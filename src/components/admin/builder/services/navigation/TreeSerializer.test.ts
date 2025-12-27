/**
 * TreeSerializer tests
 * Tests for serialization, deserialization, and TypeScript export functionality
 */

import { describe, it, expect } from 'vitest';
import {
  serialize,
  deserialize,
  serializeHeaderData,
  deserializeHeaderData,
  serializeFooterData,
  deserializeFooterData,
  toTypeScript,
  TreeSerializer,
} from './TreeSerializer';
import type {
  NavigationNode,
  HeaderData,
  FooterData,
} from '../../core/types/navigation.types';

describe('TreeSerializer', () => {
  describe('serialize', () => {
    it('should serialize an empty tree', () => {
      const result = serialize([]);
      expect(result).toBe('[]');
    });

    it('should serialize a simple tree', () => {
      const tree: NavigationNode[] = [
        { id: '1', text: 'Home', href: '/' },
      ];
      const result = serialize(tree);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(tree);
    });

    it('should serialize a tree with nested children', () => {
      const tree: NavigationNode[] = [
        {
          id: '1',
          text: 'Services',
          href: '/services',
          children: [
            { id: '2', text: 'Pricing', href: '/pricing' },
            { id: '3', text: 'Projects', href: '/projects' },
          ],
        },
      ];
      const result = serialize(tree);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(tree);
    });

    it('should preserve all node properties', () => {
      const tree: NavigationNode[] = [
        {
          id: '1',
          text: 'External',
          href: 'https://example.com',
          target: '_blank',
          icon: 'tabler:external-link',
        },
      ];
      const result = serialize(tree);
      const parsed = JSON.parse(result);
      expect(parsed[0].target).toBe('_blank');
      expect(parsed[0].icon).toBe('tabler:external-link');
    });
  });

  describe('deserialize', () => {
    it('should deserialize valid JSON', () => {
      const json = '[{"id":"1","text":"Home","href":"/"}]';
      const result = deserialize(json);
      expect(result.validation.valid).toBe(true);
      expect(result.tree).toHaveLength(1);
      expect(result.tree[0].text).toBe('Home');
    });

    it('should return error for invalid JSON', () => {
      const json = 'not valid json';
      const result = deserialize(json);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors[0].field).toBe('json');
    });

    it('should return error for non-array JSON', () => {
      const json = '{"text":"Home"}';
      const result = deserialize(json);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors[0].field).toBe('root');
    });

    it('should validate deserialized nodes', () => {
      const json = '[{"id":"1","text":"","href":""}]';
      const result = deserialize(json);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('serializeHeaderData / deserializeHeaderData', () => {
    const sampleHeaderData: HeaderData = {
      links: [
        { text: 'Home', href: '/' },
        { text: 'Services', links: [{ text: 'Pricing', href: '/pricing' }] },
      ],
      actions: [{ text: 'GitHub', href: 'https://github.com', target: '_blank' }],
    };

    it('should serialize and deserialize HeaderData', () => {
      const json = serializeHeaderData(sampleHeaderData);
      const result = deserializeHeaderData(json);
      expect(result.validation.valid).toBe(true);
      expect(result.data).toEqual(sampleHeaderData);
    });

    it('should return error for invalid HeaderData JSON', () => {
      const result = deserializeHeaderData('invalid');
      expect(result.validation.valid).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should return error for missing links array', () => {
      const result = deserializeHeaderData('{"actions":[]}');
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.some(e => e.field === 'links')).toBe(true);
    });
  });

  describe('serializeFooterData / deserializeFooterData', () => {
    const sampleFooterData: FooterData = {
      links: [
        { title: 'Navigation', links: [{ text: 'Home', href: '/' }] },
      ],
      secondaryLinks: [{ text: 'Terms', href: '/terms' }],
      socialLinks: [{ ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: 'https://github.com' }],
      footNote: 'Copyright 2025',
    };

    it('should serialize and deserialize FooterData', () => {
      const json = serializeFooterData(sampleFooterData);
      const result = deserializeFooterData(json);
      expect(result.validation.valid).toBe(true);
      expect(result.data).toEqual(sampleFooterData);
    });

    it('should return error for invalid FooterData JSON', () => {
      const result = deserializeFooterData('invalid');
      expect(result.validation.valid).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should return error for missing required fields', () => {
      const result = deserializeFooterData('{"links":[]}');
      expect(result.validation.valid).toBe(false);
    });
  });

  describe('toTypeScript', () => {
    const headerData: HeaderData = {
      links: [
        { text: 'Home', href: '/' },
        { text: 'About', href: '/about' },
      ],
      actions: [{ text: 'GitHub', href: 'https://github.com', target: '_blank' }],
    };

    const footerData: FooterData = {
      links: [
        { title: 'Navigation', links: [{ text: 'Home', href: '/' }] },
      ],
      secondaryLinks: [{ text: 'Terms', href: '/terms' }],
      socialLinks: [{ ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: 'https://github.com' }],
      footNote: 'Copyright 2025',
    };

    it('should generate valid TypeScript with imports', () => {
      const result = toTypeScript(headerData, footerData);
      expect(result).toContain("import { getBlogPermalink, getPermalink } from './utils/permalinks';");
    });

    it('should export headerData', () => {
      const result = toTypeScript(headerData, footerData);
      expect(result).toContain('export const headerData = {');
    });

    it('should export footerData', () => {
      const result = toTypeScript(headerData, footerData);
      expect(result).toContain('export const footerData = {');
    });

    it('should include header links', () => {
      const result = toTypeScript(headerData, footerData);
      expect(result).toContain("text: 'Home'");
      expect(result).toContain("text: 'About'");
    });

    it('should include header actions', () => {
      const result = toTypeScript(headerData, footerData);
      expect(result).toContain("text: 'GitHub'");
      expect(result).toContain("target: '_blank'");
    });

    it('should include footer link groups', () => {
      const result = toTypeScript(headerData, footerData);
      expect(result).toContain("title: 'Navigation'");
    });

    it('should include social links', () => {
      const result = toTypeScript(headerData, footerData);
      expect(result).toContain("ariaLabel: 'GitHub'");
      expect(result).toContain("icon: 'tabler:brand-github'");
    });

    it('should include footNote', () => {
      const result = toTypeScript(headerData, footerData);
      expect(result).toContain('Copyright 2025');
    });

    it('should escape special characters in strings', () => {
      const headerWithSpecialChars: HeaderData = {
        links: [{ text: "It's a test", href: '/test' }],
        actions: [],
      };
      const result = toTypeScript(headerWithSpecialChars, footerData);
      expect(result).toContain("It\\'s a test");
    });
  });

  describe('TreeSerializer class', () => {
    it('should provide all methods via class interface', () => {
      const serializer = new TreeSerializer();
      
      const tree: NavigationNode[] = [{ id: '1', text: 'Home', href: '/' }];
      const json = serializer.serialize(tree);
      const result = serializer.deserialize(json);
      
      expect(result.validation.valid).toBe(true);
      expect(result.tree).toEqual(tree);
    });
  });
});


describe('toTypeScript - navigation.ts format matching', () => {
  it('should use getPermalink for internal links', () => {
    const headerData: HeaderData = {
      links: [{ text: 'Home', href: '/' }],
      actions: [],
    };
    const footerData: FooterData = {
      links: [],
      secondaryLinks: [],
      socialLinks: [],
      footNote: '',
    };
    const result = toTypeScript(headerData, footerData);
    expect(result).toContain("getPermalink('/')");
  });

  it('should use getBlogPermalink for /blog path', () => {
    const headerData: HeaderData = {
      links: [{ text: 'Blog', href: '/blog' }],
      actions: [],
    };
    const footerData: FooterData = {
      links: [],
      secondaryLinks: [],
      socialLinks: [],
      footNote: '',
    };
    const result = toTypeScript(headerData, footerData);
    expect(result).toContain('getBlogPermalink()');
  });

  it('should handle nested links in header', () => {
    const headerData: HeaderData = {
      links: [
        {
          text: 'Services',
          links: [
            { text: 'Pricing', href: '/pricing' },
            { text: 'Projects', href: '/projects' },
          ],
        },
      ],
      actions: [],
    };
    const footerData: FooterData = {
      links: [],
      secondaryLinks: [],
      socialLinks: [],
      footNote: '',
    };
    const result = toTypeScript(headerData, footerData);
    expect(result).toContain("text: 'Services'");
    expect(result).toContain("text: 'Pricing'");
    expect(result).toContain("text: 'Projects'");
  });

  it('should not use getPermalink for external URLs', () => {
    const headerData: HeaderData = {
      links: [],
      actions: [{ text: 'GitHub', href: 'https://github.com', target: '_blank' }],
    };
    const footerData: FooterData = {
      links: [],
      secondaryLinks: [],
      socialLinks: [],
      footNote: '',
    };
    const result = toTypeScript(headerData, footerData);
    expect(result).toContain("href: 'https://github.com'");
    expect(result).not.toContain("getPermalink('https://github.com')");
  });
});
