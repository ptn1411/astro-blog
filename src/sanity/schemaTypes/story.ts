import { defineArrayMember, defineField, defineType } from 'sanity';

export const storyType = defineType({
  name: 'story',
  title: 'Web Story',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'Mã Story (ID)',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Tiêu đề Story',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Mô tả',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'thumbnail',
      title: 'Ảnh thu nhỏ (Thumbnail)',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'audio',
      title: 'File âm thanh nền',
      type: 'file',
      options: {
        accept: 'audio/*',
      },
    }),
    defineField({
      name: 'autoPlay',
      title: 'Tự động phát',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'loop',
      title: 'Lặp lại',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'createdAt',
      title: 'Ngày tạo',
      type: 'datetime',
    }),
    defineField({
      name: 'slides',
      title: 'Danh sách Slides',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'slide',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'id',
      media: 'thumbnail',
    },
  },
});
