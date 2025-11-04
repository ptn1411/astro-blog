import { getBlogPermalink, getPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Trang chủ',
      href: getPermalink('/'),
    },
    {
      text: 'Giới thiệu',
      href: getPermalink('/about'),
    },
    {
      text: 'Dịch vụ',
      href: getPermalink('/services'),
    },
    {
      text: 'Dự án',
      href: getPermalink('/personal#projects'),
    },
    {
      text: 'Bảng giá',
      href: getPermalink('/pricing'),
    },
    {
      text: 'Blog',
      href: getBlogPermalink(),
    },
    {
      text: 'Liên hệ',
      href: getPermalink('/contact'),
    },
  ],
  actions: [{ text: 'GitHub', href: 'https://github.com/ptndz', target: '_blank' }],
};

export const footerData = {
  links: [
    {
      title: 'Điều hướng',
      links: [
        { text: 'Trang chủ', href: '/' },
        { text: 'Giới thiệu', href: '/about' },
        { text: 'Dịch vụ', href: '/services' },
        { text: 'Dự án', href: '/personal#projects' },
        { text: 'Blog', href: '/blog' },
        { text: 'Liên hệ', href: '/contact' },
      ],
    },
    {
      title: 'Công nghệ',
      links: [
        { text: 'Node.js', href: '#' },
        { text: 'React / Next.js', href: '#' },
        { text: 'Go', href: '#' },
        { text: 'Prisma / PostgreSQL', href: '#' },
        { text: 'Docker', href: '#' },
      ],
    },
    {
      title: 'Tài nguyên',
      links: [
        { text: 'Blog', href: '/blog' },
        { text: 'Mã nguồn', href: 'https://github.com/ptndz' },
        { text: 'Liên hệ', href: '/contact' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Điều khoản', href: getPermalink('/terms') },
    { text: 'Chính sách quyền riêng tư', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: 'https://github.com/ptndz' },
    { ariaLabel: 'Telegram', icon: 'tabler:send', href: 'https://t.me/Ptn1411' },
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: 'https://linkedin.com/in/ptn1411' },
    { ariaLabel: 'X (Twitter)', icon: 'tabler:brand-x', href: '#' },
  ],
  footNote: `
    Copyright ${new Date().getFullYear()} - Xây dựng bởi <a class="text-blue-600 underline dark:text-muted" href="https://ptndz.dev">Phạm Thành Nam</a> - Crafted with Astro + TailwindCSS.
  `,
};
