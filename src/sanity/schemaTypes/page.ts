import { defineField, defineType } from 'sanity';

export const pageType = defineType({
  name: 'page',
  title: 'Trang tĩnh (Page)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Tiêu đề trang',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (Đường dẫn)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Ảnh nổi bật',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'pageLayout',
      title: 'Layout trang',
      type: 'string',
      options: {
        list: [
          { title: 'Animation Page Layout', value: 'AnimationPageLayout' },
          { title: 'Animation Layout', value: 'AnimationLayout' },
          { title: 'Page Layout', value: 'PageLayout' },
          { title: 'Base Layout', value: 'Layout' },
        ],
      },
      initialValue: 'AnimationPageLayout',
    }),
    defineField({
      name: 'metadata',
      title: 'SEO Metadata',
      type: 'seoMetadata',
    }),
    defineField({
      name: 'body',
      title: 'Nội dung trang',
      type: 'blockContent',
    }),
    defineField({
      name: 'rawContent',
      title: 'Nội dung MDX gốc',
      type: 'text',
      rows: 8,
    }),
    defineField({
      name: 'headerData',
      title: 'Cấu hình Header (JSON)',
      type: 'text',
    }),
    defineField({
      name: 'footerData',
      title: 'Cấu hình Footer (JSON)',
      type: 'text',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
      media: 'image',
    },
  },
});
