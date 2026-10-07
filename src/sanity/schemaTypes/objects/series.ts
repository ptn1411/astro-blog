import { defineField, defineType } from 'sanity';

export const seriesType = defineType({
  name: 'series',
  title: 'Series',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      title: 'Mã Series (ID)',
      type: 'string',
      description: 'Ví dụ: 30-days-of-rust hoặc ai-co-ban',
    }),
    defineField({
      name: 'title',
      title: 'Tiêu đề Series',
      type: 'string',
    }),
    defineField({
      name: 'part',
      title: 'Phần số',
      type: 'number',
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'totalParts',
      title: 'Tổng số phần',
      type: 'number',
      validation: (rule) => rule.min(1),
    }),
  ],
});
