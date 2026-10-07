import { defineField, defineType } from 'sanity';

export const vimeoType = defineType({
  name: 'vimeo',
  title: 'Vimeo Video',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'Vimeo URL',
      type: 'url',
      validation: (rule) => rule.required(),
    }),
  ],
});
