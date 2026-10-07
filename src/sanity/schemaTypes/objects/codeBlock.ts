import { defineField, defineType } from 'sanity';

export const codeBlockType = defineType({
  name: 'codeBlock',
  title: 'Code Block',
  type: 'object',
  fields: [
    defineField({
      name: 'filename',
      title: 'Tên file (tùy chọn)',
      type: 'string',
    }),
    defineField({
      name: 'language',
      title: 'Ngôn ngữ',
      type: 'string',
      options: {
        list: [
          { title: 'JavaScript', value: 'javascript' },
          { title: 'TypeScript', value: 'typescript' },
          { title: 'Rust', value: 'rust' },
          { title: 'HTML', value: 'html' },
          { title: 'CSS', value: 'css' },
          { title: 'Bash / Shell', value: 'bash' },
          { title: 'Python', value: 'python' },
          { title: 'JSON', value: 'json' },
          { title: 'YAML', value: 'yaml' },
          { title: 'Astro', value: 'astro' },
        ],
      },
      initialValue: 'javascript',
    }),
    defineField({
      name: 'code',
      title: 'Mã nguồn',
      type: 'text',
      rows: 10,
      validation: (rule) => rule.required(),
    }),
  ],
});
