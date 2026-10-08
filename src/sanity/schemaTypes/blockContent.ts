import { defineArrayMember, defineField, defineType } from 'sanity';

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
    // Horizontal Rule (--- từ Markdown)
    defineArrayMember({
      type: 'object',
      name: 'horizontal-rule',
      title: 'Đường kẻ ngang (Horizontal Rule)',
      fields: [
        defineField({
          name: 'divider',
          type: 'boolean',
          hidden: true,
          initialValue: true,
        }),
      ],
      preview: {
        prepare() {
          return {
            title: '─── Đường kẻ ngang (HR) ───',
          };
        },
      },
    }),
    // Code block chuẩn từ Markdown (@portabletext/markdown tạo _type: 'code')
    defineArrayMember({
      type: 'object',
      name: 'code',
      title: 'Khối mã (Code)',
      fields: [
        defineField({
          name: 'language',
          title: 'Ngôn ngữ',
          type: 'string',
          initialValue: 'js',
        }),
        defineField({
          name: 'filename',
          title: 'Tên file (tùy chọn)',
          type: 'string',
        }),
        defineField({
          name: 'code',
          title: 'Mã nguồn',
          type: 'text',
          rows: 8,
        }),
      ],
      preview: {
        select: {
          language: 'language',
          code: 'code',
        },
        prepare({ language, code }) {
          return {
            title: `Code (${language || 'plaintext'})`,
            subtitle: (code || '').slice(0, 50),
          };
        },
      },
    }),
    // Code block tùy biến (codeBlock)
    defineArrayMember({
      type: 'codeBlock',
    }),
    // Standard Image từ Markdown (@portabletext/markdown tạo _type: 'image')
    defineArrayMember({
      type: 'image',
      name: 'image',
      title: 'Hình ảnh',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'src',
          type: 'string',
          title: 'Đường dẫn ảnh cục bộ',
        }),
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Văn bản thay thế (Alt text)',
        }),
        defineField({
          name: 'title',
          type: 'string',
          title: 'Tiêu đề ảnh (Title)',
        }),
        defineField({
          name: 'caption',
          type: 'string',
          title: 'Chú thích ảnh',
        }),
      ],
    }),
    // Inline image with alt text and caption
    defineArrayMember({
      type: 'image',
      name: 'inlineImage',
      title: 'Hình ảnh Inline',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Văn bản thay thế (Alt text)',
        }),
        defineField({
          name: 'caption',
          type: 'string',
          title: 'Chú thích ảnh',
        }),
      ],
    }),
    // Table từ Markdown (@portabletext/markdown tạo _type: 'table')
    defineArrayMember({
      type: 'object',
      name: 'table',
      title: 'Bảng dữ liệu (Table)',
      fields: [
        defineField({
          name: 'headerRows',
          title: 'Số hàng tiêu đề',
          type: 'number',
          initialValue: 1,
        }),
        defineField({
          name: 'rows',
          title: 'Các hàng (Rows)',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'row',
              fields: [
                defineField({
                  name: 'cells',
                  title: 'Các ô (Cells)',
                  type: 'array',
                  of: [
                    defineArrayMember({
                      type: 'object',
                      name: 'cell',
                      fields: [
                        defineField({
                          name: 'value',
                          type: 'array',
                          of: [{ type: 'block' }],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
      preview: {
        select: {
          rows: 'rows',
        },
        prepare({ rows }) {
          return {
            title: `Bảng dữ liệu (${(rows || []).length} hàng)`,
          };
        },
      },
    }),
    // Callout từ Markdown (@portabletext/markdown tạo _type: 'callout')
    defineArrayMember({
      type: 'object',
      name: 'callout',
      title: 'Hộp ghi chú (Callout)',
      fields: [
        defineField({
          name: 'tone',
          title: 'Loại ghi chú',
          type: 'string',
          options: {
            list: [
              { title: 'Thông tin (Info)', value: 'info' },
              { title: 'Cảnh báo (Warning)', value: 'warning' },
              { title: 'Thành công (Success)', value: 'success' },
              { title: 'Nguy hiểm (Danger)', value: 'danger' },
            ],
          },
          initialValue: 'info',
        }),
        defineField({
          name: 'content',
          title: 'Nội dung',
          type: 'text',
          rows: 3,
        }),
      ],
      preview: {
        select: {
          tone: 'tone',
          content: 'content',
        },
        prepare({ tone, content }) {
          return {
            title: `Callout [${tone || 'info'}]`,
            subtitle: (content || '').slice(0, 50),
          };
        },
      },
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
