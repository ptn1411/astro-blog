import {
  AlignCenter,
  BarChart,
  Bell,
  BookOpen,
  CheckSquare,
  Clock,
  Columns,
  DollarSign,
  FileText,
  GalleryHorizontal,
  Grid,
  HelpCircle,
  Image,
  Layers,
  Layout,
  List,
  Mail,
  MessageSquare,
  MessageSquareQuote,
  Minus,
  MoveVertical,
  Play,
  Quote,
  Users,
  UsersRound,
} from 'lucide-react';

export type WidgetType =
  | 'Hero'
  | 'Hero2'
  | 'HeroText'
  | 'Features'
  | 'Features2'
  | 'Features3'
  | 'Content'
  | 'CallToAction'
  | 'Pricing'
  | 'Stats'
  | 'Note'
  | 'FAQs'
  | 'Testimonials'
  | 'Brands'
  | 'Contact'
  | 'Steps'
  | 'Steps2'
  | 'BlogLatestPosts'
  | 'BlogHighlightedPosts'
  | 'Announcement'
  | 'TableOfContents'
  | 'Divider'
  | 'Spacer'
  | 'Quote'
  | 'Video'
  | 'Gallery'
  | 'Team'
  | 'Newsletter'
  | 'Countdown';

export type WidgetCategory = 'hero' | 'features' | 'content' | 'social' | 'blog' | 'misc';

export const WIDGET_CATEGORIES: { id: WidgetCategory; label: string }[] = [
  { id: 'hero', label: '🎯 Hero Sections' },
  { id: 'features', label: '✨ Features' },
  { id: 'content', label: '📝 Content' },
  { id: 'social', label: '💬 Social Proof' },
  { id: 'blog', label: '📰 Blog' },
  { id: 'misc', label: '🔧 Miscellaneous' },
];

export interface WidgetSchema {
  type: WidgetType;
  category: WidgetCategory;
  icon: any;
  label: string;
  defaultProps: Record<string, any>;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'boolean' | 'json' | 'image' | 'icon' | 'array';
    arraySchema?: {
      key: string;
      label: string;
      type: 'text' | 'textarea' | 'image' | 'icon' | 'boolean' | 'number';
    }[];
  }[];
}

const COMMON_FIELDS = [
  { name: 'id', label: 'ID (HTML)', type: 'text' as const },
  { name: 'isDark', label: 'Dark Mode', type: 'boolean' as const },
  { name: 'bg', label: 'Background (HTML)', type: 'textarea' as const },
  { name: 'classes', label: 'Custom Classes', type: 'text' as const },
];

export const WIDGET_REGISTRY: WidgetSchema[] = [
  {
    type: 'Hero',
    category: 'hero',
    icon: Layout,
    label: 'Hero Section',
    defaultProps: {
      title: 'Your Hero Title',
      subtitle: 'A short subtitle for the hero section.',
      tagline: 'Welcome',
    },
    fields: [
      { name: 'title', label: 'Title (HTML)', type: 'text' },
      { name: 'subtitle', label: 'Subtitle (HTML)', type: 'text' },
      { name: 'tagline', label: 'Tagline (HTML)', type: 'text' },
      { name: 'content', label: 'Content (HTML)', type: 'textarea' },
      { name: 'image.src', label: 'Image', type: 'image' },
      { name: 'image.alt', label: 'Image Alt', type: 'text' },
      {
        name: 'actions',
        label: 'Actions',
        type: 'array',
        arraySchema: [
          { key: 'text', label: 'Button Text', type: 'text' },
          { key: 'href', label: 'Link URL', type: 'text' },
          { key: 'variant', label: 'Variant (primary/secondary)', type: 'text' },
        ],
      },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Hero2',
    category: 'hero',
    icon: Layout,
    label: 'Hero 2',
    defaultProps: {
      title: 'Hero with different layout',
      subtitle: 'Subtitle for Hero 2',
      tagline: 'Hero 2 Tagline',
      actions: [{ variant: 'primary', text: 'Get Started', href: '#' }],
      image: {
        src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
        alt: 'AstroWind Hero Image',
      },
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'tagline', label: 'Tagline', type: 'text' },
      { name: 'content', label: 'Content (HTML)', type: 'textarea' },
      { name: 'image.src', label: 'Image', type: 'image' },
      { name: 'image.alt', label: 'Image Alt', type: 'text' },
      {
        name: 'actions',
        label: 'Actions',
        type: 'array',
        arraySchema: [
          { key: 'text', label: 'Button Text', type: 'text' },
          { key: 'href', label: 'Link URL', type: 'text' },
          { key: 'variant', label: 'Variant', type: 'text' },
        ],
      },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'HeroText',
    category: 'hero',
    icon: AlignCenter,
    label: 'Hero Text',
    defaultProps: {
      title: 'Text-only Hero',
      subtitle: 'Simple hero section with just text',
      tagline: 'Minimalist',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'tagline', label: 'Tagline', type: 'text' },
      { name: 'content', label: 'Content (HTML)', type: 'textarea' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Features',
    category: 'features',
    icon: Columns,
    label: 'Features Grid',
    defaultProps: {
      title: 'Our Features',
      subtitle: 'Highlight your key features',
      items: [
        { title: 'Feature 1', description: 'Description 1', icon: 'tabler:check' },
        { title: 'Feature 2', description: 'Description 2', icon: 'tabler:check' },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'tagline', label: 'Tagline', type: 'text' },
      { name: 'items', label: 'Items (JSON)', type: 'json' },
      { name: 'columns', label: 'Columns', type: 'number' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Features2',
    category: 'features',
    icon: Grid,
    label: 'Features 2',
    defaultProps: {
      title: 'Another Feature Grid',
      subtitle: 'Alternative layout',
      items: [
        { title: 'Feature A', description: 'Description A', icon: 'tabler:star' },
        { title: 'Feature B', description: 'Description B', icon: 'tabler:star' },
      ],
      columns: 3,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'tagline', label: 'Tagline', type: 'text' },
      { name: 'items', label: 'Items (JSON)', type: 'json' },
      { name: 'columns', label: 'Columns', type: 'number' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Features3',
    category: 'features',
    icon: Layers,
    label: 'Features 3',
    defaultProps: {
      title: 'Features 3',
      subtitle: 'Third separate layout',
      items: [{ title: 'Pro Feature', description: 'Advanced details', icon: 'tabler:shield-check' }],
      columns: 2,
      isBeforeContent: true,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'items', label: 'Items (JSON)', type: 'json' },
      { name: 'columns', label: 'Columns', type: 'number' },
      { name: 'isBeforeContent', label: 'Before Content', type: 'boolean' },
      { name: 'isAfterContent', label: 'After Content', type: 'boolean' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Content',
    category: 'content',
    icon: FileText,
    label: 'Content Block',
    defaultProps: {
      title: 'Content Section',
      content: '<p>Lorem ipsum dolor sit amet...</p>',
      isReversed: false,
      items: [],
      image: {
        src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
        alt: 'Content Image',
      },
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'content', label: 'Content (HTML)', type: 'textarea' },
      { name: 'isReversed', label: 'Reverse Layout', type: 'boolean' },
      { name: 'isAfterContent', label: 'Structure after content', type: 'boolean' },
      { name: 'image.src', label: 'Image URL', type: 'text' },
      { name: 'image.alt', label: 'Image Alt', type: 'text' },
      { name: 'callToAction.text', label: 'CTA Text', type: 'text' },
      { name: 'callToAction.href', label: 'CTA Link', type: 'text' },
      { name: 'items', label: 'Items (JSON)', type: 'json' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Steps',
    category: 'content',
    icon: List,
    label: 'Steps',
    defaultProps: {
      title: 'How it works',
      items: [
        { title: 'Step 1', description: 'Do this first', icon: 'tabler:package' },
        { title: 'Step 2', description: 'Then do this', icon: 'tabler:letter-case' },
      ],
      image: {
        src: 'https://images.unsplash.com/photo-1616198814651-e71f960c3180?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80',
        alt: 'Steps Image',
      },
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'items', label: 'Items (JSON)', type: 'json' },
      { name: 'isReversed', label: 'Reverse Layout', type: 'boolean' },
      { name: 'image.src', label: 'Image URL', type: 'text' },
      { name: 'image.alt', label: 'Image Alt', type: 'text' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Steps2',
    category: 'content',
    icon: List,
    label: 'Steps 2',
    defaultProps: {
      title: 'Timeline',
      subtitle: 'Visualize your roadmap',
      items: [
        { title: 'Milestone 1', description: 'Q1 Goals' },
        { title: 'Milestone 2', description: 'Q2 Goals' },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'items', label: 'Items (JSON)', type: 'json' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Note',
    category: 'misc',
    icon: MessageSquareQuote,
    label: 'Note',
    defaultProps: {
      title: '<b>Note:</b> This is an important message',
      icon: 'tabler:info-square',
    },
    fields: [
      { name: 'title', label: 'Message (HTML)', type: 'textarea' },
      { name: 'icon', label: 'Icon Name', type: 'text' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Pricing',
    category: 'misc',
    icon: DollarSign,
    label: 'Pricing',
    defaultProps: {
      title: 'Pricing Plans',
      prices: [
        {
          title: 'Basic',
          price: 29,
          period: '/ Month',
          items: [{ description: 'Feature 1' }, { description: 'Feature 2' }],
          callToAction: {
            target: '_blank',
            text: 'Get Started',
            href: '#',
          },
        },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'prices', label: 'Prices (JSON)', type: 'json' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Stats',
    category: 'social',
    icon: BarChart,
    label: 'Stats',
    defaultProps: {
      title: 'Our Numbers',
      stats: [
        { title: 'Downloads', amount: '10K', icon: 'tabler:download' },
        { title: 'Users', amount: '5K', icon: 'tabler:user' },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'stats', label: 'Stats (JSON)', type: 'json' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'FAQs',
    category: 'content',
    icon: HelpCircle,
    label: 'FAQs',
    defaultProps: {
      title: 'Frequently Asked Questions',
      items: [{ title: 'Question 1?', description: 'Answer 1' }],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'items', label: 'Items (JSON)', type: 'json' },
      { name: 'columns', label: 'Columns', type: 'number' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Testimonials',
    category: 'social',
    icon: MessageSquare,
    label: 'Testimonials',
    defaultProps: {
      title: 'What our clients say',
      testimonials: [
        {
          name: 'John Doe',
          job: 'Developer',
          testimonial: 'Great tool!',
          image: {
            src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
            alt: 'John Doe',
          },
        },
      ],
      callToAction: {
        text: 'Read more',
        href: '#',
      },
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'testimonials', label: 'Testimonials (JSON)', type: 'json' },
      { name: 'callToAction.text', label: 'CTA Text', type: 'text' },
      { name: 'callToAction.href', label: 'CTA Link', type: 'text' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Brands',
    category: 'social',
    icon: Image,
    label: 'Brands',
    defaultProps: {
      title: 'Trusted by',
      icons: [],
      images: [
        { src: 'https://cdn.pixabay.com/photo/2015/05/26/09/37/paypal-784404_1280.png', alt: 'PayPal' },
        { src: 'https://cdn.pixabay.com/photo/2021/12/06/13/48/visa-6850402_1280.png', alt: 'Visa' },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'icons', label: 'Icons (JSON)', type: 'json' },
      { name: 'images', label: 'Images (JSON)', type: 'json' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Contact',
    category: 'misc',
    icon: Users,
    label: 'Contact Form',
    defaultProps: {
      title: 'Contact Us',
      inputs: [
        { type: 'text', name: 'name', label: 'Name' },
        { type: 'email', name: 'email', label: 'Email' },
      ],
      textarea: { label: 'Message' },
      disclaimer: {
        label:
          'By submitting this contact form, you acknowledge and agree to the collection of your personal information.',
      },
      button: 'Send Message',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'inputs', label: 'Inputs (JSON)', type: 'json' },
      { name: 'textarea', label: 'Textarea (JSON)', type: 'json' },
      { name: 'button', label: 'Button Text', type: 'text' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'CallToAction',
    category: 'misc',
    icon: CheckSquare,
    label: 'Call To Action',
    defaultProps: {
      title: 'Ready to get started?',
      actions: [{ variant: 'primary', text: 'Get Started', href: '#' }],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'actions', label: 'Actions (JSON)', type: 'json' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'BlogLatestPosts',
    category: 'blog',
    icon: FileText,
    label: 'Latest Posts',
    defaultProps: {
      title: 'Latest Posts',
      count: 4,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'count', label: 'Count', type: 'number' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'BlogHighlightedPosts',
    category: 'blog',
    icon: FileText,
    label: 'Highlighted Posts',
    defaultProps: {
      title: 'Featured Posts',
      ids: [],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'ids', label: 'Post IDs (JSON)', type: 'json' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Announcement',
    category: 'misc',
    icon: Bell,
    label: 'Announcement Bar',
    defaultProps: {
      badge: 'NEW',
      title: 'Check out our latest update!',
      link: '#',
      githubUrl: '',
      githubTitle: 'Star us on GitHub',
    },
    fields: [
      { name: 'badge', label: 'Badge Text', type: 'text' },
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'link', label: 'Link URL', type: 'text' },
      { name: 'githubUrl', label: 'GitHub URL (optional)', type: 'text' },
      { name: 'githubTitle', label: 'GitHub Tooltip', type: 'text' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'TableOfContents',
    category: 'content',
    icon: BookOpen,
    label: 'Table of Contents',
    defaultProps: {
      headings: [
        { depth: 2, text: 'Section 1', slug: 'section-1', subheadings: [] },
        { depth: 2, text: 'Section 2', slug: 'section-2', subheadings: [] },
      ],
    },
    fields: [{ name: 'headings', label: 'Headings (JSON)', type: 'json' }, ...COMMON_FIELDS],
  },
  // --- New Widgets ---
  {
    type: 'Divider',
    category: 'misc',
    icon: Minus,
    label: 'Divider',
    defaultProps: {
      style: 'solid',
      color: 'gray',
      spacing: 'md',
    },
    fields: [
      { name: 'style', label: 'Style (solid/dashed/dotted)', type: 'text' },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'spacing', label: 'Spacing (sm/md/lg)', type: 'text' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Spacer',
    category: 'misc',
    icon: MoveVertical,
    label: 'Spacer',
    defaultProps: {
      height: '4rem',
    },
    fields: [{ name: 'height', label: 'Height (e.g., 4rem, 100px)', type: 'text' }, ...COMMON_FIELDS],
  },
  {
    type: 'Quote',
    category: 'content',
    icon: Quote,
    label: 'Blockquote',
    defaultProps: {
      quote: 'The only way to do great work is to love what you do.',
      author: 'Steve Jobs',
      role: 'Co-founder, Apple',
      image: '',
    },
    fields: [
      { name: 'quote', label: 'Quote Text', type: 'textarea' },
      { name: 'author', label: 'Author Name', type: 'text' },
      { name: 'role', label: 'Author Role', type: 'text' },
      { name: 'image', label: 'Author Image URL', type: 'image' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Video',
    category: 'content',
    icon: Play,
    label: 'Video Embed',
    defaultProps: {
      title: 'Watch Our Video',
      subtitle: 'See how it works',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      aspectRatio: '16:9',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'videoUrl', label: 'Video Embed URL', type: 'text' },
      { name: 'aspectRatio', label: 'Aspect Ratio (16:9/4:3)', type: 'text' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Gallery',
    category: 'content',
    icon: GalleryHorizontal,
    label: 'Image Gallery',
    defaultProps: {
      title: 'Our Gallery',
      subtitle: 'A collection of our work',
      columns: 3,
      images: [
        { src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600', alt: 'Image 1' },
        { src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600', alt: 'Image 2' },
        { src: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600', alt: 'Image 3' },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'columns', label: 'Columns', type: 'number' },
      { name: 'images', label: 'Images (JSON)', type: 'json' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Team',
    category: 'social',
    icon: UsersRound,
    label: 'Team Members',
    defaultProps: {
      title: 'Meet Our Team',
      subtitle: 'The people behind the product',
      members: [
        {
          name: 'John Doe',
          role: 'CEO & Founder',
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
          bio: 'Passionate about building great products.',
        },
        {
          name: 'Jane Smith',
          role: 'Lead Developer',
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
          bio: 'Loves coding and problem-solving.',
        },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'members', label: 'Team Members (JSON)', type: 'json' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Newsletter',
    category: 'misc',
    icon: Mail,
    label: 'Newsletter Signup',
    defaultProps: {
      title: 'Subscribe to Our Newsletter',
      subtitle: 'Get the latest updates delivered to your inbox.',
      placeholder: 'Enter your email',
      buttonText: 'Subscribe',
      disclaimer: 'We respect your privacy. Unsubscribe at any time.',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'placeholder', label: 'Input Placeholder', type: 'text' },
      { name: 'buttonText', label: 'Button Text', type: 'text' },
      { name: 'disclaimer', label: 'Disclaimer Text', type: 'textarea' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Countdown',
    category: 'misc',
    icon: Clock,
    label: 'Countdown Timer',
    defaultProps: {
      title: 'Coming Soon',
      subtitle: 'Something exciting is on the way',
      targetDate: '2025-01-01T00:00:00',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'targetDate', label: 'Target Date (ISO format)', type: 'text' },
      { name: 'showDays', label: 'Show Days', type: 'boolean' },
      { name: 'showHours', label: 'Show Hours', type: 'boolean' },
      { name: 'showMinutes', label: 'Show Minutes', type: 'boolean' },
      { name: 'showSeconds', label: 'Show Seconds', type: 'boolean' },
      ...COMMON_FIELDS,
    ],
  },
];
