import { defineArrayMember, defineField, defineType } from 'sanity';

export const postType = defineType({
  name: 'post',
  title: 'Bài viết (Post)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Tiêu đề bài viết',
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
      name: 'excerpt',
      title: 'Tóm tắt bài viết',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'image',
      title: 'Ảnh bìa (Featured Image)',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'publishDate',
      title: 'Ngày xuất bản',
      type: 'datetime',
      validation: (rule) => rule.required(),
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'updateDate',
      title: 'Ngày cập nhật',
      type: 'datetime',
    }),
    defineField({
      name: 'draft',
      title: 'Bản nháp (Draft)',
      type: 'boolean',
      description: 'Nếu bật, bài viết sẽ bị ẩn khỏi danh sách trang chủ/blog',
      initialValue: false,
    }),
    defineField({
      name: 'category',
      title: 'Danh mục',
      type: 'reference',
      to: [{ type: 'category' }],
    }),
    defineField({
      name: 'tags',
      title: 'Các thẻ (Tags)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'tag' }],
        }),
      ],
    }),
    defineField({
      name: 'author',
      title: 'Tác giả',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({
      name: 'series',
      title: 'Chuỗi bài viết (Series)',
      type: 'series',
    }),
    defineField({
      name: 'body',
      title: 'Nội dung bài viết',
      type: 'blockContent',
    }),
    defineField({
      name: 'metadata',
      title: 'Cấu hình SEO & Social',
      type: 'seoMetadata',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'image',
      publishDate: 'publishDate',
    },
    prepare({ title, author, media, publishDate }) {
      const date = publishDate ? new Date(publishDate).toLocaleDateString('vi-VN') : '';
      return {
        title,
        subtitle: [author, date].filter(Boolean).join(' • '),
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Ngày xuất bản mới nhất',
      name: 'publishDateDesc',
      by: [{ field: 'publishDate', direction: 'desc' }],
    },
  ],
});
