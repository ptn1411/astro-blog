import { defineField, defineType } from 'sanity';

export const tweetType = defineType({
  name: 'tweet',
  title: 'X / Twitter Post',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'Tweet URL',
      type: 'url',
      validation: (rule) => rule.required(),
    }),
  ],
});
