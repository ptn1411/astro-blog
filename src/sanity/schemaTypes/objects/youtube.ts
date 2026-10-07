import { defineField, defineType } from 'sanity';

export const youtubeType = defineType({
  name: 'youtube',
  title: 'YouTube Video',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'YouTube URL',
      type: 'url',
      validation: (rule) => rule.required(),
    }),
  ],
});
