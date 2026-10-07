import { defineField, defineType } from 'sanity';

export const slideType = defineType({
  name: 'slide',
  title: 'Slide Story',
  type: 'object',
  fields: [
    defineField({
      name: 'id',
      title: 'Mã Slide (ID)',
      type: 'string',
    }),
    defineField({
      name: 'duration',
      title: 'Thời lượng (ms)',
      type: 'number',
      initialValue: 5000,
    }),
    defineField({
      name: 'bgColor',
      title: 'Màu nền (Hex)',
      type: 'string',
      initialValue: '#000000',
    }),
    defineField({
      name: 'bgImage',
      title: 'Hình nền',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'text',
      title: 'Văn bản slide',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'textColor',
      title: 'Màu chữ',
      type: 'string',
      initialValue: '#ffffff',
    }),
    defineField({
      name: 'textSize',
      title: 'Kích cỡ chữ',
      type: 'string',
      options: {
        list: [
          { title: 'Nhỏ', value: 'small' },
          { title: 'Vừa', value: 'medium' },
          { title: 'Lớn', value: 'large' },
        ],
      },
      initialValue: 'medium',
    }),
    defineField({
      name: 'image',
      title: 'Hình ảnh chính',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'rawElements',
      title: 'Dữ liệu phần tử Animation (JSON)',
      type: 'text',
      description: 'Dữ liệu elements builder và keyframe animation',
    }),
  ],
});
