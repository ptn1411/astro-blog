/**
 * DataMapper Unit Tests
 * 
 * Tests for the DataMapper utility functions.
 */

import { describe, it, expect } from 'vitest';
import { getValueByPath, mapArrayData, DataMapper } from './DataMapper';
import type { ItemMapping } from '../../core/types/apiDataWidget.types';

describe('DataMapper', () => {
  describe('getValueByPath', () => {
    it('extracts simple property', () => {
      const obj = { name: 'Test' };
      expect(getValueByPath(obj, 'name')).toBe('Test');
    });

    it('extracts nested property with dot notation', () => {
      const obj = { data: { user: { name: 'John' } } };
      expect(getValueByPath(obj, 'data.user.name')).toBe('John');
    });

    it('extracts array element by index', () => {
      const obj = { items: ['a', 'b', 'c'] };
      expect(getValueByPath(obj, 'items.0')).toBe('a');
      expect(getValueByPath(obj, 'items.2')).toBe('c');
    });

    it('extracts nested property from array element', () => {
      const obj = { products: [{ name: 'Product 1' }, { name: 'Product 2' }] };
      expect(getValueByPath(obj, 'products.0.name')).toBe('Product 1');
    });

    it('returns null for missing path', () => {
      const obj = { name: 'Test' };
      expect(getValueByPath(obj, 'missing')).toBe(null);
      expect(getValueByPath(obj, 'missing.nested')).toBe(null);
    });

    it('returns null for null/undefined input', () => {
      expect(getValueByPath(null, 'path')).toBe(null);
      expect(getValueByPath(undefined, 'path')).toBe(null);
    });

    it('returns object itself for empty path', () => {
      const obj = { name: 'Test' };
      expect(getValueByPath(obj, '')).toEqual(obj);
    });

    it('handles numeric values', () => {
      const obj = { price: 99.99 };
      expect(getValueByPath(obj, 'price')).toBe(99.99);
    });

    it('handles boolean values', () => {
      const obj = { active: true };
      expect(getValueByPath(obj, 'active')).toBe(true);
    });
  });

  describe('mapArrayData', () => {
    const defaultMapping: ItemMapping = {
      name: 'title',
      price: 'price',
      image: 'thumbnail',
      description: 'desc',
      url: 'link',
    };

    it('maps array data correctly', () => {
      const data = {
        products: [
          { title: 'Product 1', price: 99.99, thumbnail: 'img1.jpg', desc: 'Desc 1', link: '/p1' },
          { title: 'Product 2', price: 149.99, thumbnail: 'img2.jpg', desc: 'Desc 2', link: '/p2' },
        ],
      };

      const result = mapArrayData(data, 'products', defaultMapping);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Product 1',
        price: 99.99,
        image: 'img1.jpg',
        description: 'Desc 1',
        url: '/p1',
      });
    });

    it('handles nested root path', () => {
      const data = {
        response: {
          data: {
            items: [{ title: 'Item 1', price: 10, thumbnail: 'img.jpg', desc: 'Desc' }],
          },
        },
      };

      const result = mapArrayData(data, 'response.data.items', defaultMapping);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Item 1');
    });

    it('handles nested item mapping', () => {
      const data = {
        products: [
          { info: { name: 'Product' }, pricing: { amount: 50 }, media: { url: 'img.jpg' }, details: { text: 'Desc' } },
        ],
      };

      const nestedMapping: ItemMapping = {
        name: 'info.name',
        price: 'pricing.amount',
        image: 'media.url',
        description: 'details.text',
      };

      const result = mapArrayData(data, 'products', nestedMapping);

      expect(result[0]).toEqual({
        name: 'Product',
        price: 50,
        image: 'img.jpg',
        description: 'Desc',
        url: null,
      });
    });

    it('returns empty array for non-array root', () => {
      const data = { products: 'not an array' };
      const result = mapArrayData(data, 'products', defaultMapping);
      expect(result).toEqual([]);
    });

    it('returns empty array for missing root path', () => {
      const data = { other: [] };
      const result = mapArrayData(data, 'products', defaultMapping);
      expect(result).toEqual([]);
    });

    it('handles missing fields with fallback values', () => {
      const data = {
        products: [{ title: 'Product Only' }],
      };

      const result = mapArrayData(data, 'products', defaultMapping);

      expect(result[0]).toEqual({
        name: 'Product Only',
        price: null,
        image: null,
        description: null,
        url: null,
      });
    });

    it('converts string price to number', () => {
      const data = {
        products: [{ title: 'Product', price: '99.99', thumbnail: null, desc: null }],
      };

      const result = mapArrayData(data, 'products', defaultMapping);

      expect(result[0].price).toBe(99.99);
    });

    it('handles non-string name by converting to string', () => {
      const data = {
        products: [{ title: 123, price: 10, thumbnail: 'img.jpg', desc: 'Desc' }],
      };

      const result = mapArrayData(data, 'products', defaultMapping);

      expect(result[0].name).toBe('123');
    });
  });

  describe('DataMapper class', () => {
    it('creates instance and maps data', () => {
      const mapper = new DataMapper('items', {
        name: 'name',
        price: 'cost',
        image: 'img',
        description: 'desc',
      });

      const data = {
        items: [{ name: 'Item 1', cost: 25, img: 'img.jpg', desc: 'Description' }],
      };

      const result = mapper.map(data);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Item 1');
      expect(result[0].price).toBe(25);
    });

    it('allows updating configuration', () => {
      const mapper = new DataMapper('items', {
        name: 'name',
        price: 'price',
        image: 'image',
        description: 'description',
      });

      mapper.setRootPath('products');
      expect(mapper.getRootPath()).toBe('products');

      const newMapping = {
        name: 'title',
        price: 'cost',
        image: 'thumbnail',
        description: 'desc',
      };
      mapper.setItemMapping(newMapping);
      expect(mapper.getItemMapping()).toEqual(newMapping);
    });
  });
});
