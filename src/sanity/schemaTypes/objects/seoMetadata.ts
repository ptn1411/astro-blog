import { defineField, defineType } from 'sanity';

export const seoMetadataType = defineType({
  name: 'seoMetadata',
  title: 'SEO & Metadata',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Meta Title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'canonical',
      title: 'Canonical URL',
      type: 'url',
    }),
    defineField({
      name: 'robots',
      title: 'Robots Settings',
      type: 'object',
      fields: [
        defineField({
          name: 'index',
          title: 'Index',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'follow',
          title: 'Follow',
          type: 'boolean',
          initialValue: true,
        }),
      ],
    }),
  ],
});
