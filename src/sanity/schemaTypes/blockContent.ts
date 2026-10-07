import { defineArrayMember, defineType } from 'sanity';

export const blockContentType = defineType({
  name: 'blockContent',
  title: 'Nội dung (Portable Text)',
  type: 'array',
  of: [
    defineArrayMember({
      title: 'Block',
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H1', value: 'h1' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'H5', value: 'h5' },
        { title: 'H6', value: 'h6' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Đậm', value: 'strong' },
          { title: 'Nghiêng', value: 'em' },
          { title: 'Code', value: 'code' },
          { title: 'Gạch chân', value: 'underline' },
          { title: 'Gạch ngang', value: 'strike-through' },
        ],
        annotations: [
          {
            title: 'URL Link',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
              {
                title: 'Mở tab mới',
                name: 'blank',
                type: 'boolean',
                initialValue: true,
              },
            ],
          },
        ],
      },
    }),
    // Inline image with alt text and caption
    defineArrayMember({
      type: 'image',
      name: 'inlineImage',
      title: 'Hình ảnh',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Văn bản thay thế (Alt text)',
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Chú thích ảnh',
        },
      ],
    }),
    // Code block
    defineArrayMember({
      type: 'codeBlock',
    }),
    // Embeds
    defineArrayMember({
      type: 'youtube',
    }),
    defineArrayMember({
      type: 'vimeo',
    }),
    defineArrayMember({
      type: 'tweet',
    }),
  ],
});
