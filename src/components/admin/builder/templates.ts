import type { WidgetType } from './registry';
import type { PageTemplate } from './types';

// Template block factory - creates block config without ID (ID generated on apply)
const block = (type: WidgetType, props: Record<string, unknown>) => ({ type, props });

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'landing',
    name: '🚀 Landing Page',
    description: 'Hero + Features + CTA',
    blocks: [
      block('Hero', { title: 'Welcome to Our Product', subtitle: 'The best solution for your needs', tagline: 'New' }),
      block('Features', { title: 'Why Choose Us', subtitle: 'Amazing features', items: [] }),
      block('CallToAction', { title: 'Ready to get started?', subtitle: 'Join thousands of happy customers' }),
    ],
  },
  {
    id: 'about',
    name: '👤 About Page',
    description: 'Hero + Content + Team',
    blocks: [
      block('Hero', { title: 'About Us', subtitle: 'Our story and mission', tagline: 'About' }),
      block('Content1', { title: 'Our Story', content: '<p>We started with a simple idea...</p>' }),
      block('Steps2', { title: 'Our Journey', items: [] }),
    ],
  },
  {
    id: 'pricing',
    name: '💰 Pricing Page',
    description: 'Hero + Pricing + FAQ',
    blocks: [
      block('Hero', { title: 'Simple Pricing', subtitle: 'Choose the plan that works for you', tagline: 'Pricing' }),
      block('Pricing', { title: 'Our Plans', prices: [] }),
      block('FAQs', { title: 'FAQ', items: [] }),
    ],
  },
  {
    id: 'blog',
    name: '📰 Blog Page',
    description: 'Hero + Latest Posts',
    blocks: [
      block('Hero', { title: 'Our Blog', subtitle: 'Insights and updates', tagline: 'Blog' }),
      block('BlogLatestPosts', { title: 'Latest Articles', count: 6 }),
    ],
  },
  {
    id: 'services',
    name: '🎯 Services Page',
    description: 'Hero + Features2 + Steps + CTA',
    blocks: [
      block('Hero', {
        title: 'Our Services',
        subtitle: 'Comprehensive solutions for your business',
        tagline: 'Services',
      }),
      block('Features2', {
        title: 'What We Offer',
        subtitle: 'Tailored services to meet your needs',
        columns: 3,
        items: [
          { title: 'Web Development', description: 'Custom websites and web apps', icon: 'tabler:code' },
          { title: 'UI/UX Design', description: 'Beautiful, user-centered interfaces', icon: 'tabler:palette' },
          { title: 'Consulting', description: 'Expert technical guidance', icon: 'tabler:bulb' },
        ],
      }),
      block('Steps', {
        title: 'Our Process',
        items: [
          { title: 'Discovery', description: 'We learn about your goals', icon: 'tabler:search' },
          { title: 'Design', description: 'We create the perfect solution', icon: 'tabler:brush' },
          { title: 'Develop', description: 'We build and iterate', icon: 'tabler:code' },
          { title: 'Deploy', description: 'We launch and support', icon: 'tabler:rocket' },
        ],
      }),
      block('CallToAction', { title: 'Ready to Start?', subtitle: 'Get a free consultation today' }),
    ],
  },
  {
    id: 'contact',
    name: '📧 Contact Page',
    description: 'HeroText + Contact + FAQ',
    blocks: [
      block('HeroText', { title: 'Get in Touch', subtitle: "We'd love to hear from you", tagline: 'Contact' }),
      block('Contact', {
        title: 'Send us a Message',
        inputs: [
          { type: 'text', name: 'name', label: 'Your Name' },
          { type: 'email', name: 'email', label: 'Email Address' },
        ],
        textarea: { label: 'Your Message' },
        button: 'Send Message',
      }),
      block('FAQs', {
        title: 'Common Questions',
        items: [
          { title: 'What is your response time?', description: 'We typically respond within 24 hours.' },
          { title: 'Do you offer support?', description: 'Yes, we provide ongoing support for all projects.' },
        ],
      }),
    ],
  },
  {
    id: 'portfolio',
    name: '🏆 Portfolio Page',
    description: 'Hero2 + Gallery + Testimonials',
    blocks: [
      block('Hero2', { title: 'Our Work', subtitle: 'Showcasing our best projects', tagline: 'Portfolio' }),
      block('Gallery', {
        title: 'Featured Projects',
        subtitle: 'A selection of our recent work',
        columns: 3,
        images: [
          { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600', alt: 'Project 1' },
          { src: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600', alt: 'Project 2' },
          { src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600', alt: 'Project 3' },
        ],
      }),
      block('Testimonials', {
        title: 'Client Feedback',
        testimonials: [{ name: 'Happy Client', job: 'CEO', testimonial: 'Outstanding work and great communication!' }],
      }),
    ],
  },
  {
    id: 'event',
    name: '🎉 Event/Launch Page',
    description: 'Announcement + Hero + Countdown + Features',
    blocks: [
      block('Announcement', { badge: 'COMING SOON', title: 'Big launch event on January 1st!', link: '#countdown' }),
      block('Hero', {
        title: 'Something Amazing is Coming',
        subtitle: 'Be the first to experience our new product',
        tagline: 'Launch Event',
      }),
      block('Countdown', { title: 'Launching In', targetDate: '2025-01-01T00:00:00' }),
      block('Features', {
        title: "What's Coming",
        items: [
          { title: 'New Features', description: 'Exciting new capabilities', icon: 'tabler:star' },
          { title: 'Better Performance', description: 'Faster than ever', icon: 'tabler:rocket' },
        ],
      }),
      block('Newsletter', { title: "Don't Miss Out", subtitle: 'Subscribe to get notified', buttonText: 'Notify Me' }),
    ],
  },
  {
    id: 'docs',
    name: '📚 Documentation Page',
    description: 'HeroText + Content + FAQ',
    blocks: [
      block('HeroText', { title: 'Documentation', subtitle: 'Everything you need to get started', tagline: 'Docs' }),
      block('Content1', {
        title: 'Getting Started',
        content:
          '<p>Welcome to our documentation. Here you will find everything you need to get up and running quickly.</p><h3>Installation</h3><p>Run npm install to get started.</p>',
      }),
      block('FAQs', {
        title: 'FAQ',
        items: [
          { title: 'How do I install?', description: 'Run npm install in your project directory.' },
          { title: 'Where can I get support?', description: 'Join our Discord or open a GitHub issue.' },
        ],
      }),
    ],
  },
  {
    id: 'team',
    name: '👥 Team Page',
    description: 'Hero + Team + Quote + CTA',
    blocks: [
      block('Hero', { title: 'Meet Our Team', subtitle: 'The people behind the magic', tagline: 'Team' }),
      block('Team', {
        title: 'Leadership',
        members: [
          { name: 'John Doe', role: 'CEO', bio: 'Visionary leader with 15 years of experience.' },
          { name: 'Jane Smith', role: 'CTO', bio: 'Tech expert and innovation driver.' },
          { name: 'Bob Johnson', role: 'COO', bio: 'Operations guru keeping things running smoothly.' },
        ],
      }),
      block('Quote', { quote: 'Alone we can do so little; together we can do so much.', author: 'Helen Keller' }),
      block('CallToAction', { title: 'Join Our Team', subtitle: 'We are always looking for talented people' }),
    ],
  },
  {
    id: 'product',
    name: '🛒 Product Page',
    description: 'Hero2 + Features3 + Pricing + Testimonials + FAQs',
    blocks: [
      block('Hero2', {
        title: 'The Ultimate Solution',
        subtitle: 'Everything you need in one powerful package',
        tagline: 'Product',
        actions: [{ variant: 'primary', text: 'Get Started', href: '#pricing' }],
      }),
      block('Features3', {
        title: 'Powerful Features',
        columns: 2,
        items: [
          { title: 'Fast Performance', description: 'Lightning-quick load times' },
          { title: 'Easy to Use', description: 'Intuitive interface for everyone' },
          { title: 'Secure', description: 'Enterprise-grade security' },
          { title: 'Scalable', description: 'Grows with your business' },
        ],
      }),
      block('Pricing', {
        title: 'Simple Pricing',
        prices: [
          { title: 'Starter', price: 9, period: '/month', items: [{ description: '5 Projects' }] },
          {
            title: 'Pro',
            price: 29,
            period: '/month',
            hasRibbon: true,
            items: [{ description: 'Unlimited Projects' }],
          },
        ],
      }),
      block('Testimonials', { title: 'Loved by Thousands', testimonials: [] }),
      block('FAQs', { title: 'Questions?', items: [] }),
    ],
  },
  {
    id: 'creative',
    name: '🎨 Creative/Agency',
    description: 'Hero + Brands + Features2 + Gallery + Testimonials + CTA',
    blocks: [
      block('Hero', {
        title: 'We Create Digital Experiences',
        subtitle: 'Award-winning creative agency',
        tagline: 'Welcome',
      }),
      block('Brands', { title: 'Trusted By', images: [] }),
      block('Features2', {
        title: 'Our Expertise',
        items: [
          { title: 'Branding', description: 'Create memorable identities' },
          { title: 'Web Design', description: 'Stunning digital experiences' },
          { title: 'Marketing', description: 'Data-driven campaigns' },
        ],
      }),
      block('Gallery', { title: 'Our Work', columns: 3, images: [] }),
      block('Testimonials', { title: 'Client Love', testimonials: [] }),
      block('CallToAction', { title: "Let's Create Together", subtitle: 'Start your project today' }),
    ],
  },
];
