import {
  AlertTriangle,
  AlignCenter,
  BarChart,
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  Columns,
  DollarSign,
  Download,
  FileText,
  GalleryHorizontal,
  Grid,
  HelpCircle,
  Image,
  Layers,
  Layout,
  LayoutGrid,
  List,
  ListOrdered,
  Mail,
  MapPin,
  MessageSquare,
  MessageSquareQuote,
  Minus,
  MoveVertical,
  PanelTop,
  Play,
  Quote,
  Share2,
  ShoppingBag,
  Table,
  Trophy,
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
  | 'Countdown'
  | 'Banner'
  | 'Accordion'
  | 'Timeline'
  | 'Cards'
  | 'LogoCloud'
  | 'Comparison'
  | 'SocialLinks'
  | 'Map'
  | 'Alert'
  | 'FeatureList'
  | 'ProductShowcase'
  | 'Awards'
  | 'Partners'
  | 'Downloads'
  | 'Events';

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
    placeholder?: string;
    arraySchema?: {
      key: string;
      label: string;
      type: 'text' | 'textarea' | 'image' | 'icon' | 'boolean' | 'number';
      placeholder?: string;
    }[];
  }[];
}

const COMMON_FIELDS = [
  { name: 'id', label: 'ID (HTML)', type: 'text' as const, placeholder: 'vd: features, pricing, contact...' },
  { name: 'isDark', label: 'Dark Mode', type: 'boolean' as const },
  {
    name: 'bg',
    label: 'Background (HTML)',
    type: 'textarea' as const,
    placeholder: 'vd: <div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600"></div>',
  },
  { name: 'classes', label: 'Custom Classes', type: 'text' as const, placeholder: 'vd: py-16 bg-blue-50 rounded-xl' },
  {
    name: 'containerClass',
    label: 'Container Classes',
    type: 'text' as const,
    placeholder: 'vd: max-w-5xl mx-auto px-4',
  },
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
      { name: 'image.src', label: 'Image', type: 'image' },
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
      { name: 'image.src', label: 'Image', type: 'image' },
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
      {
        name: 'testimonials',
        label: 'Testimonials',
        type: 'array',
        arraySchema: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'job', label: 'Job Title', type: 'text' },
          { key: 'testimonial', label: 'Testimonial', type: 'textarea' },
          { key: 'image.src', label: 'Photo', type: 'image' },
          { key: 'image.alt', label: 'Photo Alt', type: 'text' },
        ],
      },
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
      {
        name: 'images',
        label: 'Brand Images',
        type: 'array',
        arraySchema: [
          { key: 'src', label: 'Image', type: 'image' },
          { key: 'alt', label: 'Alt Text', type: 'text' },
        ],
      },
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
      {
        name: 'images',
        label: 'Images',
        type: 'array',
        arraySchema: [
          { key: 'src', label: 'Image', type: 'image' },
          { key: 'alt', label: 'Alt Text', type: 'text' },
        ],
      },
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
      {
        name: 'members',
        label: 'Team Members',
        type: 'array',
        arraySchema: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'role', label: 'Role', type: 'text' },
          { key: 'image', label: 'Photo', type: 'image' },
          { key: 'bio', label: 'Bio', type: 'textarea' },
        ],
      },
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
  // --- More Widgets ---
  {
    type: 'Banner',
    category: 'hero',
    icon: PanelTop,
    label: 'Banner',
    defaultProps: {
      title: 'Special Offer!',
      subtitle: 'Get 50% off on all products',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200',
      callToAction: { text: 'Shop Now', href: '#' },
      variant: 'gradient',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', placeholder: 'vd: Special Offer!' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'image', label: 'Background Image', type: 'image' },
      { name: 'callToAction.text', label: 'CTA Text', type: 'text' },
      { name: 'callToAction.href', label: 'CTA Link', type: 'text' },
      { name: 'variant', label: 'Variant (gradient/solid/image)', type: 'text', placeholder: 'gradient, solid, image' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Accordion',
    category: 'content',
    icon: ListOrdered,
    label: 'Accordion',
    defaultProps: {
      title: 'More Information',
      items: [
        { title: 'Section 1', content: 'Content for section 1' },
        { title: 'Section 2', content: 'Content for section 2' },
        { title: 'Section 3', content: 'Content for section 3' },
      ],
      allowMultiple: false,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      {
        name: 'items',
        label: 'Accordion Items',
        type: 'array',
        arraySchema: [
          { key: 'title', label: 'Section Title', type: 'text' },
          { key: 'content', label: 'Content (HTML)', type: 'textarea' },
          { key: 'icon', label: 'Icon', type: 'icon' },
        ],
      },
      { name: 'allowMultiple', label: 'Allow Multiple Open', type: 'boolean' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Timeline',
    category: 'content',
    icon: Clock,
    label: 'Timeline',
    defaultProps: {
      title: 'Our Journey',
      subtitle: 'Key milestones in our history',
      items: [
        { year: '2020', title: 'Founded', description: 'Company was established', icon: 'tabler:rocket' },
        { year: '2021', title: 'First Product', description: 'Launched our first product', icon: 'tabler:package' },
        { year: '2022', title: 'Growth', description: 'Reached 10,000 customers', icon: 'tabler:trending-up' },
        { year: '2023', title: 'Expansion', description: 'Expanded to 10 countries', icon: 'tabler:world' },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      {
        name: 'items',
        label: 'Timeline Items',
        type: 'array',
        arraySchema: [
          { key: 'year', label: 'Year/Date', type: 'text' },
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'icon', label: 'Icon', type: 'icon' },
        ],
      },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Cards',
    category: 'content',
    icon: LayoutGrid,
    label: 'Cards Grid',
    defaultProps: {
      title: 'Our Services',
      subtitle: 'What we offer',
      columns: 3,
      cards: [
        {
          title: 'Web Development',
          description: 'Build modern, responsive websites',
          image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
          link: '#',
        },
        {
          title: 'Mobile Apps',
          description: 'Native and cross-platform mobile applications',
          image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400',
          link: '#',
        },
        {
          title: 'UI/UX Design',
          description: 'Beautiful and intuitive user interfaces',
          image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
          link: '#',
        },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'columns', label: 'Columns', type: 'number', placeholder: '2, 3, or 4' },
      {
        name: 'cards',
        label: 'Cards',
        type: 'array',
        arraySchema: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'image', label: 'Image', type: 'image' },
          { key: 'link', label: 'Link URL', type: 'text' },
          { key: 'icon', label: 'Icon (optional)', type: 'icon' },
        ],
      },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'LogoCloud',
    category: 'social',
    icon: Grid,
    label: 'Logo Cloud',
    defaultProps: {
      title: 'Trusted by Industry Leaders',
      subtitle: 'Join thousands of satisfied customers',
      columns: 6,
      grayscale: true,
      logos: [
        { src: 'https://cdn.pixabay.com/photo/2015/05/26/09/37/paypal-784404_1280.png', alt: 'PayPal', link: '#' },
        { src: 'https://cdn.pixabay.com/photo/2021/12/06/13/48/visa-6850402_1280.png', alt: 'Visa', link: '#' },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'columns', label: 'Columns', type: 'number' },
      { name: 'grayscale', label: 'Grayscale Logos', type: 'boolean' },
      {
        name: 'logos',
        label: 'Logos',
        type: 'array',
        arraySchema: [
          { key: 'src', label: 'Logo Image', type: 'image' },
          { key: 'alt', label: 'Company Name', type: 'text' },
          { key: 'link', label: 'Website URL', type: 'text' },
        ],
      },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Comparison',
    category: 'misc',
    icon: Table,
    label: 'Feature Comparison',
    defaultProps: {
      title: 'Compare Plans',
      subtitle: 'Find the right plan for you',
      features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'],
      plans: [
        { name: 'Basic', price: '$9/mo', values: [true, true, false, false] },
        { name: 'Pro', price: '$29/mo', values: [true, true, true, false], highlighted: true },
        { name: 'Enterprise', price: '$99/mo', values: [true, true, true, true] },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'features', label: 'Features (JSON array)', type: 'json' },
      { name: 'plans', label: 'Plans (JSON)', type: 'json' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'SocialLinks',
    category: 'social',
    icon: Share2,
    label: 'Social Links',
    defaultProps: {
      title: 'Follow Us',
      subtitle: 'Stay connected on social media',
      style: 'icons',
      links: [
        { platform: 'facebook', url: 'https://facebook.com', icon: 'tabler:brand-facebook' },
        { platform: 'twitter', url: 'https://twitter.com', icon: 'tabler:brand-twitter' },
        { platform: 'instagram', url: 'https://instagram.com', icon: 'tabler:brand-instagram' },
        { platform: 'linkedin', url: 'https://linkedin.com', icon: 'tabler:brand-linkedin' },
        { platform: 'youtube', url: 'https://youtube.com', icon: 'tabler:brand-youtube' },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'style', label: 'Style (icons/buttons/cards)', type: 'text', placeholder: 'icons, buttons, cards' },
      {
        name: 'links',
        label: 'Social Links',
        type: 'array',
        arraySchema: [
          { key: 'platform', label: 'Platform Name', type: 'text' },
          { key: 'url', label: 'URL', type: 'text' },
          { key: 'icon', label: 'Icon', type: 'icon' },
        ],
      },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Map',
    category: 'misc',
    icon: MapPin,
    label: 'Map Embed',
    defaultProps: {
      title: 'Find Us',
      subtitle: 'Visit our office',
      embedUrl:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5177580567645!2d106.69916937583897!3d10.771594459266964!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4b3330bcc7%3A0x4db964d76bf6e18e!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBLaG9hIGjhu41jIFThu7Egbmhpw6puIFRQLkhDTQ!5e0!3m2!1svi!2s!4v1702450000000!5m2!1svi!2s',
      height: '400px',
      address: '123 Main Street, City, Country',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      {
        name: 'embedUrl',
        label: 'Google Maps Embed URL',
        type: 'textarea',
        placeholder: 'Paste Google Maps embed URL here',
      },
      { name: 'height', label: 'Height', type: 'text', placeholder: 'vd: 400px, 50vh' },
      { name: 'address', label: 'Address Text', type: 'text' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Alert',
    category: 'misc',
    icon: AlertTriangle,
    label: 'Alert Box',
    defaultProps: {
      type: 'info',
      title: 'Important Notice',
      message: 'This is an important message for all visitors.',
      icon: 'tabler:info-circle',
      dismissible: true,
    },
    fields: [
      {
        name: 'type',
        label: 'Type (info/success/warning/error)',
        type: 'text',
        placeholder: 'info, success, warning, error',
      },
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'message', label: 'Message', type: 'textarea' },
      { name: 'icon', label: 'Icon', type: 'icon' },
      { name: 'dismissible', label: 'Dismissible', type: 'boolean' },
      { name: 'link.text', label: 'Link Text', type: 'text' },
      { name: 'link.href', label: 'Link URL', type: 'text' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'FeatureList',
    category: 'features',
    icon: List,
    label: 'Feature List',
    defaultProps: {
      title: 'Why Choose Us',
      subtitle: 'Here are the reasons',
      items: [
        { title: 'Fast Performance', description: 'Lightning fast load times', icon: 'tabler:bolt' },
        { title: 'Secure', description: 'Enterprise-grade security', icon: 'tabler:shield-check' },
        { title: '24/7 Support', description: 'Round the clock assistance', icon: 'tabler:headset' },
        { title: 'Easy to Use', description: 'Intuitive user interface', icon: 'tabler:click' },
      ],
      layout: 'list',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      {
        name: 'items',
        label: 'Features',
        type: 'array',
        arraySchema: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'icon', label: 'Icon', type: 'icon' },
        ],
      },
      { name: 'layout', label: 'Layout (list/inline)', type: 'text', placeholder: 'list, inline' },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'ProductShowcase',
    category: 'content',
    icon: ShoppingBag,
    label: 'Product Showcase',
    defaultProps: {
      title: 'Featured Products',
      subtitle: 'Check out our best sellers',
      products: [
        {
          name: 'Product 1',
          description: 'Amazing product description',
          price: '$99',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
          link: '#',
          badge: 'New',
        },
        {
          name: 'Product 2',
          description: 'Another great product',
          price: '$149',
          originalPrice: '$199',
          image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400',
          link: '#',
          badge: 'Sale',
        },
      ],
      columns: 4,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'columns', label: 'Columns', type: 'number' },
      {
        name: 'products',
        label: 'Products',
        type: 'array',
        arraySchema: [
          { key: 'name', label: 'Product Name', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'price', label: 'Price', type: 'text' },
          { key: 'originalPrice', label: 'Original Price', type: 'text' },
          { key: 'image', label: 'Image', type: 'image' },
          { key: 'link', label: 'Link', type: 'text' },
          { key: 'badge', label: 'Badge (New/Sale)', type: 'text' },
        ],
      },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Awards',
    category: 'social',
    icon: Trophy,
    label: 'Awards & Recognition',
    defaultProps: {
      title: 'Awards & Recognition',
      subtitle: 'Our achievements over the years',
      awards: [
        { title: 'Best Startup 2023', organization: 'Tech Awards', year: '2023', icon: 'tabler:trophy' },
        { title: 'Innovation Award', organization: 'Industry Leaders', year: '2022', icon: 'tabler:bulb' },
        { title: 'Customer Choice', organization: 'User Reviews', year: '2023', icon: 'tabler:heart' },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      {
        name: 'awards',
        label: 'Awards',
        type: 'array',
        arraySchema: [
          { key: 'title', label: 'Award Title', type: 'text' },
          { key: 'organization', label: 'Organization', type: 'text' },
          { key: 'year', label: 'Year', type: 'text' },
          { key: 'icon', label: 'Icon', type: 'icon' },
          { key: 'image', label: 'Badge Image', type: 'image' },
        ],
      },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Partners',
    category: 'social',
    icon: Users,
    label: 'Partners',
    defaultProps: {
      title: 'Our Partners',
      subtitle: 'Working together for success',
      partners: [
        {
          name: 'Partner Company',
          logo: 'https://cdn.pixabay.com/photo/2015/05/26/09/37/paypal-784404_1280.png',
          description: 'Strategic technology partner',
          link: '#',
        },
      ],
      layout: 'grid',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'layout', label: 'Layout (grid/carousel)', type: 'text', placeholder: 'grid, carousel' },
      {
        name: 'partners',
        label: 'Partners',
        type: 'array',
        arraySchema: [
          { key: 'name', label: 'Partner Name', type: 'text' },
          { key: 'logo', label: 'Logo', type: 'image' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'link', label: 'Website', type: 'text' },
        ],
      },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Downloads',
    category: 'misc',
    icon: Download,
    label: 'Downloads',
    defaultProps: {
      title: 'Resources & Downloads',
      subtitle: 'Get our materials',
      files: [
        { name: 'Product Brochure', description: 'PDF, 2.5 MB', url: '#', icon: 'tabler:file-pdf' },
        { name: 'Press Kit', description: 'ZIP, 15 MB', url: '#', icon: 'tabler:file-zip' },
        { name: 'Brand Guidelines', description: 'PDF, 5 MB', url: '#', icon: 'tabler:palette' },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      {
        name: 'files',
        label: 'Files',
        type: 'array',
        arraySchema: [
          { key: 'name', label: 'File Name', type: 'text' },
          { key: 'description', label: 'Description/Size', type: 'text' },
          { key: 'url', label: 'Download URL', type: 'text' },
          { key: 'icon', label: 'Icon', type: 'icon' },
        ],
      },
      ...COMMON_FIELDS,
    ],
  },
  {
    type: 'Events',
    category: 'content',
    icon: Calendar,
    label: 'Events',
    defaultProps: {
      title: 'Upcoming Events',
      subtitle: 'Join us at these events',
      events: [
        {
          title: 'Tech Conference 2024',
          date: '2024-03-15',
          time: '09:00 AM',
          location: 'San Francisco, CA',
          description: 'Annual technology conference',
          link: '#',
        },
        {
          title: 'Product Launch Webinar',
          date: '2024-02-20',
          time: '02:00 PM',
          location: 'Online',
          description: 'Introducing our latest product',
          link: '#',
        },
      ],
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      {
        name: 'events',
        label: 'Events',
        type: 'array',
        arraySchema: [
          { key: 'title', label: 'Event Title', type: 'text' },
          { key: 'date', label: 'Date', type: 'text', placeholder: '2024-03-15' },
          { key: 'time', label: 'Time', type: 'text', placeholder: '09:00 AM' },
          { key: 'location', label: 'Location', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'link', label: 'Register Link', type: 'text' },
          { key: 'image', label: 'Event Image', type: 'image' },
        ],
      },
      ...COMMON_FIELDS,
    ],
  },
];
