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
      links: [
        { text: 'Tất cả dịch vụ', href: getPermalink('/services') },
        { text: 'Bảng giá', href: getPermalink('/pricing') },
        { text: 'Dự án', href: getPermalink('/personal#projects') },
      ],
    },
    {
      text: 'Nội dung',
      links: [
        { text: 'Blog', href: getBlogPermalink() },
        { text: 'Stories', href: getPermalink('/stories') },
        { text: 'Bookmarks', href: getPermalink('/bookmarks') },
      ],
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
        { text: 'Liên hệ', href: '/contact' },
      ],
    },
    {
      title: 'Nội dung',
      links: [
        { text: 'Blog', href: '/blog' },
        { text: 'Stories', href: '/stories' },
        { text: 'Tác giả', href: '/authors' },
        { text: 'Pages', href: '/pages' },
      ],
    },
    {
      title: 'Công nghệ',
      links: [
        { text: 'Node.js', href: '/category/node-js' },
        { text: 'React / Next.js', href: '/category/react/next-js' },
        { text: 'Go', href: '/category/go' },
        { text: 'Prisma / PostgreSQL', href: '/category/prisma/postgresql' },
        { text: 'Docker', href: '/category/docker' },
      ],
    },
    {
      title: 'Tài nguyên',
      links: [
        { text: 'Mã nguồn', href: 'https://github.com/ptndz' },
        { text: 'RSS Feed', href: '/rss.xml' },
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
    Copyright ${new Date().getFullYear()} - Xây dựng bởi <a class="text-blue-600 underline dark:text-muted" href="https://bug.edu.vn">Phạm Thành Nam</a> - Crafted with Astro + TailwindCSS.
  `,
};
