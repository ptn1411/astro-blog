import { defineArrayMember, defineField, defineType } from 'sanity';

export const authorType = defineType({
  name: 'author',
  title: 'Tác giả',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Họ và tên',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'username',
      title: 'Tên người dùng (Slug)',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'avatar',
      title: 'Ảnh đại diện',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'bio',
      title: 'Tiểu sử ngắn',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(250),
    }),
    defineField({
      name: 'website',
      title: 'Trang web cá nhân',
      type: 'url',
    }),
    defineField({
      name: 'stories',
      title: 'Danh sách Stories',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'story' }],
        }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Bài giới thiệu chi tiết',
      type: 'blockContent',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'username.current',
      media: 'avatar',
    },
  },
});
