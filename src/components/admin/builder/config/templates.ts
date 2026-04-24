import type { WidgetType } from './registry';
import type { PageTemplate } from '../core/types/block.types';

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

  // --- Vietnam industry templates ---
  {
    id: 'vn-cafe',
    name: '☕ Quán Cà Phê',
    description: 'Tông nâu ấm + kem · Menu, không gian, khuyến mãi',
    blocks: [
      block('Hero', {
        title: 'Hương Vị Cà Phê Nguyên Bản',
        subtitle: 'Rang xay tại chỗ · Nguyên liệu Buôn Ma Thuột · Không gian ấm cúng',
        tagline: 'Coffee House',
        actions: [
          { variant: 'primary', text: 'Xem Menu', href: '#menu' },
          { variant: 'secondary', text: 'Đặt bàn', href: '#contact' },
        ],
      }),
      block('Features2', {
        title: 'Tại Sao Chọn Chúng Tôi',
        subtitle: 'Mỗi tách cà phê là một câu chuyện',
        columns: 3,
        items: [
          { title: 'Hạt rang mộc', description: 'Nhập trực tiếp từ Tây Nguyên, rang đến đâu dùng đến đó', icon: 'tabler:coffee' },
          { title: 'Barista chuyên nghiệp', description: 'Đội ngũ thợ pha chế được đào tạo bài bản, đạt chuẩn SCA', icon: 'tabler:user-star' },
          { title: 'Không gian chill', description: 'Thiết kế mộc mạc, có WiFi mạnh, ổ cắm tại mọi bàn', icon: 'tabler:armchair' },
        ],
      }),
      block('Gallery', {
        title: 'Không Gian Quán',
        subtitle: 'Nơi lý tưởng để hẹn hò, làm việc và gặp gỡ bạn bè',
        columns: 3,
        images: [],
      }),
      block('Pricing', {
        title: 'Menu Đặc Trưng',
        prices: [
          { title: 'Cà Phê Sữa Đá', price: 35, period: 'k', items: [{ description: 'Robusta rang mộc pha phin' }, { description: 'Sữa đặc Ông Thọ' }] },
          { title: 'Bạc Xỉu', price: 40, period: 'k', hasRibbon: true, ribbonTitle: 'Bán chạy', items: [{ description: 'Tỷ lệ sữa nhiều hơn cà phê' }, { description: 'Đá viên size vừa' }] },
          { title: 'Cold Brew', price: 55, period: 'k', items: [{ description: 'Ủ lạnh 18 tiếng' }, { description: 'Arabica Cầu Đất' }] },
        ],
      }),
      block('Testimonials', {
        title: 'Khách Hàng Nói Gì',
        testimonials: [
          { name: 'Minh Anh', job: 'Freelancer', testimonial: 'Mình làm việc ở đây cả buổi chiều, không gian yên tĩnh, cà phê thơm.' },
          { name: 'Quốc Bảo', job: 'Sinh viên', testimonial: 'Giá học sinh sinh viên dễ chịu, nhân viên rất thân thiện.' },
        ],
      }),
      block('CallToAction', { title: 'Ghé Quán Hôm Nay', subtitle: 'Mở cửa 7:00 – 22:30 hàng ngày' }),
    ],
  },
  {
    id: 'vn-restaurant',
    name: '🍜 Nhà Hàng Việt',
    description: 'Đỏ son + vàng kim · Thực đơn, không gian, đặt bàn',
    blocks: [
      block('Hero', {
        title: 'Đậm Đà Hương Vị Quê Hương',
        subtitle: 'Món Việt truyền thống · Nguyên liệu tươi mỗi ngày · Công thức gia truyền ba đời',
        tagline: 'Nhà Hàng',
        actions: [
          { variant: 'primary', text: 'Đặt Bàn Ngay', href: '#booking' },
          { variant: 'secondary', text: 'Xem Thực Đơn', href: '#menu' },
        ],
      }),
      block('Features', {
        title: 'Tinh Hoa Ẩm Thực',
        subtitle: 'Những gì tạo nên khác biệt',
        items: [
          { title: 'Gia truyền 3 đời', description: 'Công thức nấu phở giữ nguyên từ năm 1975', icon: 'tabler:award' },
          { title: 'Rau tự trồng', description: 'Vườn rau hữu cơ tại Đà Lạt giao hàng ngày', icon: 'tabler:plant' },
          { title: 'Đầu bếp 5 sao', description: 'Bếp trưởng từng làm tại Sofitel Metropole Hà Nội', icon: 'tabler:chef-hat' },
        ],
      }),
      block('Pricing', {
        title: 'Thực Đơn Đặc Sắc',
        subtitle: 'Giá đã bao gồm VAT',
        prices: [
          { title: 'Phở Bò Tái Nạm', price: 85, period: 'k', items: [{ description: 'Nước dùng ninh 12 tiếng' }, { description: 'Bánh phở tươi Thanh Trì' }] },
          { title: 'Bún Bò Huế', price: 95, period: 'k', hasRibbon: true, ribbonTitle: 'Đặc biệt', items: [{ description: 'Mắm ruốc Huế' }, { description: 'Giò heo, chả cua' }] },
          { title: 'Cơm Tấm Sườn', price: 75, period: 'k', items: [{ description: 'Sườn nướng than hoa' }, { description: 'Nước mắm pha gia truyền' }] },
        ],
      }),
      block('Gallery', { title: 'Không Gian Nhà Hàng', columns: 3, images: [] }),
      block('Contact', {
        title: 'Đặt Bàn',
        inputs: [
          { type: 'text', name: 'name', label: 'Họ và tên' },
          { type: 'tel', name: 'phone', label: 'Số điện thoại' },
          { type: 'text', name: 'guests', label: 'Số khách' },
          { type: 'text', name: 'time', label: 'Thời gian dự kiến' },
        ],
        textarea: { label: 'Ghi chú thêm (món chay, bàn VIP...)' },
        button: 'Xác Nhận Đặt Bàn',
      }),
    ],
  },
  {
    id: 'vn-spa',
    name: '💆 Spa & Làm Đẹp',
    description: 'Hồng pastel + vàng kim · Dịch vụ, liệu trình, booking',
    blocks: [
      block('Hero', {
        title: 'Chăm Sóc Sắc Đẹp Chuẩn 5 Sao',
        subtitle: 'Công nghệ Hàn Quốc · Mỹ phẩm chính hãng · KTV được đào tạo tại Seoul',
        tagline: 'Beauty Spa',
        actions: [
          { variant: 'primary', text: 'Đặt Lịch Miễn Phí', href: '#booking' },
        ],
      }),
      block('Features2', {
        title: 'Dịch Vụ Nổi Bật',
        columns: 3,
        items: [
          { title: 'Chăm sóc da mặt', description: 'Soi da AI, điều trị nám, tàn nhang, trẻ hoá', icon: 'tabler:sparkles' },
          { title: 'Massage body', description: 'Liệu trình detox, giảm béo, thư giãn toàn thân', icon: 'tabler:heart' },
          { title: 'Phun xăm thẩm mỹ', description: 'Lông mày, môi, mí mắt theo xu hướng 2025', icon: 'tabler:brush' },
        ],
      }),
      block('Steps', {
        title: 'Quy Trình Chuẩn Y Khoa',
        items: [
          { title: 'Tư vấn miễn phí', description: 'Soi da, chẩn đoán tình trạng', icon: 'tabler:clipboard-heart' },
          { title: 'Phác đồ cá nhân', description: 'Thiết kế liệu trình riêng', icon: 'tabler:file-certificate' },
          { title: 'Thực hiện', description: 'KTV đã qua đào tạo thực hiện', icon: 'tabler:hand-stop' },
          { title: 'Theo dõi', description: 'Chăm sóc sau liệu trình 30 ngày', icon: 'tabler:calendar-heart' },
        ],
      }),
      block('Pricing', {
        title: 'Bảng Giá Dịch Vụ',
        prices: [
          { title: 'Basic', price: 499, period: 'k/buổi', items: [{ description: 'Làm sạch sâu' }, { description: 'Massage mặt' }, { description: 'Đắp mặt nạ' }] },
          { title: 'Premium', price: 1290, period: 'k/buổi', hasRibbon: true, ribbonTitle: 'Phổ biến', items: [{ description: 'Tất cả gói Basic' }, { description: 'Điện di vitamin C' }, { description: 'Ánh sáng sinh học' }] },
          { title: 'VIP', price: 2490, period: 'k/buổi', items: [{ description: 'Tất cả gói Premium' }, { description: 'HIFU nâng cơ' }, { description: 'Hydrafacial' }] },
        ],
      }),
      block('Testimonials', {
        title: 'Cảm Nhận Khách Hàng',
        testimonials: [
          { name: 'Chị Hương', job: 'Doanh nhân', testimonial: 'Da sáng mịn rõ rệt sau 3 buổi. Nhân viên rất tâm lý và chuyên nghiệp.' },
          { name: 'Chị Mai', job: 'Giáo viên', testimonial: 'Giá hợp lý, không gian sang trọng. Mình đã giới thiệu cho cả hội chị em.' },
        ],
      }),
      block('Contact', {
        title: 'Đặt Lịch Trải Nghiệm',
        inputs: [
          { type: 'text', name: 'name', label: 'Họ và tên' },
          { type: 'tel', name: 'phone', label: 'Số điện thoại' },
          { type: 'text', name: 'service', label: 'Dịch vụ quan tâm' },
        ],
        textarea: { label: 'Tình trạng da/cơ thể hiện tại' },
        button: 'Nhận Tư Vấn Miễn Phí',
      }),
    ],
  },
  {
    id: 'vn-real-estate',
    name: '🏠 Bất Động Sản',
    description: 'Xanh navy + vàng · Dự án, tiện ích, liên hệ chủ đầu tư',
    blocks: [
      block('Announcement', { badge: 'MỞ BÁN', title: 'Ưu đãi chiết khấu lên đến 8% cho 50 khách hàng đầu tiên', link: '#contact' }),
      block('Hero2', {
        title: 'The Landmark Residence',
        subtitle: 'Căn hộ cao cấp trung tâm Quận 2 · View sông Sài Gòn · Bàn giao Q4/2026',
        tagline: 'Dự Án Căn Hộ',
        actions: [
          { variant: 'primary', text: 'Xem Bảng Giá', href: '#pricing' },
          { variant: 'secondary', text: 'Đặt Lịch Thăm Quan', href: '#contact' },
        ],
      }),
      block('Stats', {
        title: 'Thông Tin Dự Án',
        stats: [
          { amount: '3.2', title: 'ha Tổng diện tích' },
          { amount: '1,240', title: 'Căn hộ' },
          { amount: '72%', title: 'Cây xanh & tiện ích' },
          { amount: '5★', title: 'Chuẩn quốc tế' },
        ],
      }),
      block('Features3', {
        title: 'Tiện Ích Nội Khu',
        subtitle: 'Đẳng cấp resort trong lòng đô thị',
        columns: 3,
        items: [
          { title: 'Hồ bơi vô cực 1200m²' },
          { title: 'Gym & Yoga Center' },
          { title: 'Trường mầm non song ngữ' },
          { title: 'Công viên ven sông 1.2km' },
          { title: 'Khu BBQ & Sky Bar' },
          { title: 'An ninh 24/7 + Smart Lock' },
        ],
      }),
      block('Gallery', { title: 'Phối Cảnh Dự Án', columns: 3, images: [] }),
      block('Pricing', {
        title: 'Chính Sách Giá',
        subtitle: 'Thanh toán linh hoạt 10 đợt, ân hạn gốc lãi 24 tháng',
        prices: [
          { title: '1PN + 1', price: 3.2, period: ' tỷ', items: [{ description: '55 – 62 m²' }, { description: 'View nội khu' }] },
          { title: '2PN', price: 4.8, period: ' tỷ', hasRibbon: true, ribbonTitle: 'Bán chạy', items: [{ description: '72 – 85 m²' }, { description: 'View sông / công viên' }] },
          { title: '3PN Duplex', price: 9.5, period: ' tỷ', items: [{ description: '130 – 160 m²' }, { description: 'View sông panorama' }] },
        ],
      }),
      block('Contact', {
        title: 'Nhận Báo Giá & Chính Sách',
        inputs: [
          { type: 'text', name: 'name', label: 'Họ và tên' },
          { type: 'tel', name: 'phone', label: 'Số điện thoại' },
          { type: 'email', name: 'email', label: 'Email' },
        ],
        textarea: { label: 'Nhu cầu (đầu tư / ở thực / cho thuê)' },
        button: 'Nhận Tư Vấn 1:1 Từ Chủ Đầu Tư',
      }),
    ],
  },
  {
    id: 'vn-education',
    name: '🎓 Trung Tâm Giáo Dục',
    description: 'Xanh + cam · Khoá học, giảng viên, đăng ký học thử',
    blocks: [
      block('Hero', {
        title: 'Học Tiếng Anh Cùng Giáo Viên Bản Ngữ',
        subtitle: 'Cam kết đầu ra IELTS 6.5+ · Lớp nhỏ tối đa 8 học viên · Học phí hoàn lại nếu không đạt',
        tagline: 'English Academy',
        actions: [
          { variant: 'primary', text: 'Đăng Ký Học Thử Miễn Phí', href: '#trial' },
        ],
      }),
      block('Stats', {
        title: 'Con Số Biết Nói',
        stats: [
          { amount: '12,500+', title: 'Học viên thành công' },
          { amount: '98%', title: 'Đạt đầu ra' },
          { amount: '45+', title: 'Giáo viên bản ngữ' },
          { amount: '8', title: 'Năm kinh nghiệm' },
        ],
      }),
      block('Features2', {
        title: 'Các Khoá Học',
        columns: 3,
        items: [
          { title: 'IELTS 0 → 6.5', description: 'Lộ trình 6 tháng, cam kết đầu ra bằng văn bản', icon: 'tabler:certificate' },
          { title: 'Giao Tiếp Thực Tế', description: 'Phản xạ nhanh, phát âm chuẩn qua tình huống', icon: 'tabler:messages' },
          { title: 'Tiếng Anh Trẻ Em', description: 'Phương pháp Phonics cho bé 4-12 tuổi', icon: 'tabler:school' },
        ],
      }),
      block('Team', {
        title: 'Đội Ngũ Giảng Viên',
        subtitle: 'Chứng chỉ CELTA, TESOL, trên 5 năm kinh nghiệm',
        members: [
          { name: 'Ms. Sarah', role: 'Head of IELTS', bio: 'CELTA · 8.5 Overall · 7 năm giảng dạy tại British Council' },
          { name: 'Mr. James', role: 'Giao Tiếp', bio: 'TESOL · Đến từ Canada · Chuyên luyện phát âm' },
          { name: 'Ms. Linh', role: 'Tiếng Anh Trẻ Em', bio: 'Thạc sĩ Ngôn ngữ · 9.0 Listening' },
        ],
      }),
      block('Testimonials', {
        title: 'Học Viên Nói Gì',
        testimonials: [
          { name: 'Phạm Ngọc Hà', job: 'Đạt 7.5 IELTS', testimonial: 'Em tăng 2.0 band chỉ sau 4 tháng. Giáo viên tận tâm, bài tập sát đề thật.' },
          { name: 'Trần Minh', job: 'Đi du học Úc', testimonial: 'Nhờ trung tâm mà em có học bổng. Các thầy cô luôn theo sát từng học viên.' },
        ],
      }),
      block('Contact', {
        title: 'Đăng Ký Học Thử Miễn Phí',
        inputs: [
          { type: 'text', name: 'name', label: 'Họ và tên học viên' },
          { type: 'tel', name: 'phone', label: 'Số điện thoại phụ huynh' },
          { type: 'text', name: 'level', label: 'Trình độ hiện tại' },
        ],
        textarea: { label: 'Mục tiêu (điểm số, thời gian...)' },
        button: 'Nhận Lịch Test Đầu Vào',
      }),
    ],
  },
  {
    id: 'vn-clinic',
    name: '🏥 Phòng Khám / Y Tế',
    description: 'Xanh y tế + trắng · Bác sĩ, dịch vụ, đặt lịch khám',
    blocks: [
      block('Hero', {
        title: 'Sức Khoẻ Của Bạn Là Ưu Tiên Số 1',
        subtitle: 'Đội ngũ bác sĩ đầu ngành · Thiết bị hiện đại nhập khẩu · Bảo hiểm liên kết',
        tagline: 'Phòng Khám Đa Khoa',
        actions: [
          { variant: 'primary', text: 'Đặt Lịch Khám', href: '#booking' },
          { variant: 'secondary', text: 'Hotline 1900.xxxx', href: 'tel:1900xxxx' },
        ],
      }),
      block('Features2', {
        title: 'Chuyên Khoa',
        columns: 3,
        items: [
          { title: 'Nội Tổng Quát', description: 'Khám sức khoẻ định kỳ, tầm soát bệnh lý', icon: 'tabler:stethoscope' },
          { title: 'Nhi Khoa', description: 'Từ sơ sinh đến 16 tuổi, tiêm chủng đầy đủ', icon: 'tabler:baby-carriage' },
          { title: 'Sản Phụ Khoa', description: 'Khám thai, siêu âm 4D, sàng lọc trước sinh', icon: 'tabler:heart-handshake' },
          { title: 'Răng Hàm Mặt', description: 'Niềng răng, implant, thẩm mỹ nha khoa', icon: 'tabler:dental' },
          { title: 'Da Liễu', description: 'Điều trị mụn, laser, tiêm filler an toàn', icon: 'tabler:face-id' },
          { title: 'Xét Nghiệm', description: 'Máu, nước tiểu, gen · Kết quả trong 2h', icon: 'tabler:test-pipe' },
        ],
      }),
      block('Team', {
        title: 'Đội Ngũ Bác Sĩ',
        members: [
          { name: 'BS. Nguyễn Văn An', role: 'Giám đốc chuyên môn', bio: 'Tiến sĩ Y khoa · 25 năm kinh nghiệm · Nguyên Trưởng khoa BV Bạch Mai' },
          { name: 'BS. Trần Thị Hoa', role: 'Trưởng khoa Nhi', bio: 'Thạc sĩ · 18 năm chuyên sâu Nhi khoa' },
        ],
      }),
      block('FAQs', {
        title: 'Câu Hỏi Thường Gặp',
        items: [
          { title: 'Phòng khám có nhận BHYT không?', description: 'Có, chúng tôi liên kết với hầu hết các công ty bảo hiểm trong và ngoài nước.' },
          { title: 'Có cần đặt lịch trước không?', description: 'Không bắt buộc, nhưng đặt lịch trước giúp bạn không phải chờ đợi.' },
          { title: 'Giờ làm việc?', description: '7:00 – 20:00 từ thứ 2 đến chủ nhật, kể cả ngày lễ.' },
        ],
      }),
      block('Contact', {
        title: 'Đặt Lịch Khám',
        inputs: [
          { type: 'text', name: 'name', label: 'Họ và tên bệnh nhân' },
          { type: 'tel', name: 'phone', label: 'Số điện thoại' },
          { type: 'text', name: 'specialty', label: 'Chuyên khoa cần khám' },
        ],
        textarea: { label: 'Triệu chứng / lý do khám' },
        button: 'Gửi Yêu Cầu',
      }),
    ],
  },
  {
    id: 'vn-travel',
    name: '✈️ Du Lịch / Resort',
    description: 'Xanh biển + coral · Tour, phòng, review',
    blocks: [
      block('Hero2', {
        title: 'Phú Quốc - Thiên Đường Nghỉ Dưỡng',
        subtitle: 'Bãi biển riêng · All-inclusive · Đưa đón sân bay miễn phí',
        tagline: 'Luxury Resort',
        actions: [
          { variant: 'primary', text: 'Đặt Phòng Ngay', href: '#rooms' },
        ],
      }),
      block('Features2', {
        title: 'Trải Nghiệm Độc Quyền',
        columns: 3,
        items: [
          { title: 'Villa Hướng Biển', description: 'Hồ bơi riêng, bếp đầy đủ, view hoàng hôn', icon: 'tabler:sun' },
          { title: 'Spa & Yoga', description: 'Liệu trình detox bằng thảo mộc biển', icon: 'tabler:yoga' },
          { title: 'Ẩm Thực 3 Miền', description: '4 nhà hàng · Chef từ 5 sao quốc tế', icon: 'tabler:tools-kitchen-2' },
        ],
      }),
      block('Pricing', {
        title: 'Các Gói Phòng',
        subtitle: 'Giá/đêm, đã bao gồm ăn sáng buffet',
        prices: [
          { title: 'Deluxe Room', price: 2.5, period: ' tr', items: [{ description: '35m², view vườn' }, { description: 'Giường King' }] },
          { title: 'Ocean Villa', price: 6.8, period: ' tr', hasRibbon: true, ribbonTitle: 'Yêu thích', items: [{ description: '90m², hồ bơi riêng' }, { description: 'Xe điện đưa đón nội khu' }] },
          { title: 'Presidential', price: 18, period: ' tr', items: [{ description: '250m², bếp riêng' }, { description: 'Butler 24/7' }] },
        ],
      }),
      block('Gallery', { title: 'Hình Ảnh Resort', columns: 3, images: [] }),
      block('Testimonials', {
        title: 'Đánh Giá Từ Du Khách',
        testimonials: [
          { name: 'Gia đình Tuấn Anh', job: 'Khách Vinpearl Club', testimonial: 'Kỳ nghỉ tuyệt vời! Nhân viên phục vụ chu đáo, các con mê hồ bơi không muốn về.' },
          { name: 'Ms. Emily', job: 'Tourist from UK', testimonial: 'The best beach resort I have ever stayed in Vietnam. Food is amazing.' },
        ],
      }),
      block('CallToAction', { title: 'Đặt Trọn Gói Honeymoon', subtitle: 'Tặng rượu vang + spa đôi · Áp dụng đến hết 31/12' }),
    ],
  },
  {
    id: 'vn-salon',
    name: '💇 Salon Tóc / Barber',
    description: 'Đen + rose gold · Dịch vụ, thợ chính, booking',
    blocks: [
      block('Hero', {
        title: 'Tạo Phong Cách Riêng Của Bạn',
        subtitle: 'Cắt · Nhuộm · Uốn · Phục hồi · Sản phẩm cao cấp từ Nhật Bản',
        tagline: 'Hair Studio',
        actions: [
          { variant: 'primary', text: 'Đặt Lịch Ngay', href: '#booking' },
        ],
      }),
      block('Pricing', {
        title: 'Bảng Giá Dịch Vụ',
        prices: [
          { title: 'Nam', price: 150, period: 'k', items: [{ description: 'Cắt + Gội' }, { description: 'Tạo kiểu sáp' }] },
          { title: 'Nữ', price: 450, period: 'k', hasRibbon: true, ribbonTitle: 'Combo', items: [{ description: 'Cắt + Gội đầu dưỡng sinh' }, { description: 'Sấy tạo kiểu' }] },
          { title: 'Nhuộm + Phục Hồi', price: 1290, period: 'k', items: [{ description: 'Màu nhập khẩu Hàn/Nhật' }, { description: 'Hấp dầu keratin' }] },
        ],
      }),
      block('Team', {
        title: 'Stylist Chính',
        members: [
          { name: 'Huy Nguyễn', role: 'Director Stylist', bio: 'Học thầy Kim Sun Young (Seoul) · 12 năm nghề · Chuyên Korean style' },
          { name: 'Linh Phạm', role: 'Color Specialist', bio: 'Chứng chỉ Wella Master Color · Chuyên nhuộm balayage' },
        ],
      }),
      block('Gallery', { title: 'Thành Quả', columns: 3, images: [] }),
      block('Contact', {
        title: 'Đặt Lịch',
        inputs: [
          { type: 'text', name: 'name', label: 'Họ tên' },
          { type: 'tel', name: 'phone', label: 'SĐT' },
          { type: 'text', name: 'stylist', label: 'Stylist mong muốn' },
          { type: 'text', name: 'time', label: 'Khung giờ' },
        ],
        textarea: { label: 'Kiểu tóc mong muốn' },
        button: 'Gửi Yêu Cầu',
      }),
    ],
  },
  {
    id: 'vn-auto',
    name: '🚗 Đại Lý Ô Tô / Xe Máy',
    description: 'Đỏ + đen + bạc · Xe, ưu đãi, báo giá, lái thử',
    blocks: [
      block('Announcement', { badge: 'ƯU ĐÃI THÁNG', title: 'Tặng gói bảo hiểm vật chất + phí trước bạ cho 20 khách đầu tiên', link: '#promo' }),
      block('Hero2', {
        title: 'Sở Hữu Xe Hôm Nay - Trả Góp 0% 12 Tháng',
        subtitle: 'Đại lý uỷ quyền chính hãng · Giao xe trong ngày · Bảo hành 3 năm',
        tagline: 'Đại Lý Chính Hãng',
        actions: [
          { variant: 'primary', text: 'Nhận Báo Giá', href: '#quote' },
          { variant: 'secondary', text: 'Đăng Ký Lái Thử', href: '#test-drive' },
        ],
      }),
      block('Cards', {
        title: 'Dòng Xe Nổi Bật',
        cards: [],
      }),
      block('Features3', {
        title: 'Tại Sao Mua Xe Tại Đây',
        columns: 2,
        items: [
          { title: 'Giá tốt nhất thị trường', description: 'Cam kết trả lại chênh lệch nếu tìm được giá rẻ hơn' },
          { title: 'Hỗ trợ trả góp 90%', description: 'Liên kết Techcombank, VPBank, Shinhan · Duyệt trong 24h' },
          { title: 'Dịch vụ sau bán hàng', description: 'Bảo dưỡng miễn phí 3 lần đầu · Cứu hộ 24/7' },
          { title: 'Đổi cũ lấy mới', description: 'Định giá xe cũ tận nơi · Thu mua xe mọi hãng' },
        ],
      }),
      block('Contact', {
        title: 'Nhận Báo Giá Lăn Bánh',
        inputs: [
          { type: 'text', name: 'name', label: 'Họ và tên' },
          { type: 'tel', name: 'phone', label: 'Số điện thoại' },
          { type: 'text', name: 'model', label: 'Mẫu xe quan tâm' },
          { type: 'text', name: 'budget', label: 'Ngân sách (triệu)' },
        ],
        textarea: { label: 'Nhu cầu sử dụng (gia đình / công việc / kinh doanh)' },
        button: 'Gửi Yêu Cầu Báo Giá',
      }),
    ],
  },
  {
    id: 'vn-farm',
    name: '🌱 Nông Sản Sạch',
    description: 'Xanh lá + nâu đất · Sản phẩm, quy trình, đặt hàng',
    blocks: [
      block('Hero', {
        title: 'Rau Sạch Từ Nông Trại Đến Bàn Ăn',
        subtitle: 'Chứng nhận VietGAP · Giao hàng trong 2h · Không thuốc trừ sâu hoá học',
        tagline: 'Organic Farm',
        actions: [
          { variant: 'primary', text: 'Đặt Hàng Ngay', href: '#order' },
        ],
      }),
      block('Steps2', {
        title: 'Quy Trình Minh Bạch',
        items: [
          { title: 'Gieo trồng', description: 'Giống chuẩn từ Đà Lạt, đất được kiểm định' },
          { title: 'Chăm sóc hữu cơ', description: 'Phân bón vi sinh, không thuốc hoá học' },
          { title: 'Thu hoạch', description: 'Hái buổi sáng sớm, giữ độ tươi' },
          { title: 'Giao tận nơi', description: 'Xe lạnh, giao trong 2h nội thành' },
        ],
      }),
      block('Features2', {
        title: 'Danh Mục Sản Phẩm',
        columns: 3,
        items: [
          { title: 'Rau lá', description: 'Xà lách, cải ngọt, rau muống, rau dền', icon: 'tabler:salad' },
          { title: 'Rau củ', description: 'Cà chua, dưa leo, bí đỏ, khoai lang Nhật', icon: 'tabler:carrot' },
          { title: 'Trái cây', description: 'Bơ, ổi, chuối, dâu Đà Lạt theo mùa', icon: 'tabler:apple' },
        ],
      }),
      block('Pricing', {
        title: 'Gói Đăng Ký Hàng Tuần',
        prices: [
          { title: 'Gói Nhỏ', price: 199, period: 'k/tuần', items: [{ description: '3kg rau củ hỗn hợp' }, { description: 'Giao 1 lần/tuần' }] },
          { title: 'Gói Gia Đình', price: 399, period: 'k/tuần', hasRibbon: true, ribbonTitle: 'Phổ biến', items: [{ description: '6kg rau củ + trái cây' }, { description: 'Giao 2 lần/tuần' }] },
          { title: 'Gói Premium', price: 799, period: 'k/tuần', items: [{ description: '12kg rau củ + trái cây + thảo mộc' }, { description: 'Giao 3 lần/tuần, tuỳ chọn menu' }] },
        ],
      }),
      block('Testimonials', {
        title: 'Khách Hàng Thân Thiết',
        testimonials: [
          { name: 'Chị Thu Hà', job: 'Mẹ 2 bé', testimonial: 'Rau rất tươi, giữ được 4-5 ngày trong tủ lạnh. Các con thích ăn rau hơn hẳn.' },
          { name: 'Anh Đức', job: 'Nhà hàng chay', testimonial: 'Nguồn cung ổn định, giá cả hợp lý. Khách hàng rất hài lòng về chất lượng.' },
        ],
      }),
      block('CallToAction', { title: 'Đăng Ký Nhận Hàng Tuần', subtitle: 'Tặng 1 combo rau gia vị cho đơn đầu tiên' }),
    ],
  },
  {
    id: 'vn-gym',
    name: '🏋️ Phòng Gym / Fitness',
    description: 'Cam + đen · Lớp tập, HLV, gói hội viên',
    blocks: [
      block('Hero', {
        title: 'Thay Đổi Cơ Thể - Thay Đổi Cuộc Sống',
        subtitle: '100+ lớp nhóm/tuần · HLV quốc tế · Thiết bị Technogym chính hãng',
        tagline: 'Fitness Center',
        actions: [
          { variant: 'primary', text: 'Trải Nghiệm Miễn Phí 7 Ngày', href: '#trial' },
        ],
      }),
      block('Features2', {
        title: 'Các Lớp Tập',
        columns: 3,
        items: [
          { title: 'Yoga & Pilates', description: 'Dẻo dai, giảm stress, lớp sáng sớm', icon: 'tabler:yoga' },
          { title: 'CrossFit & HIIT', description: 'Đốt mỡ tối đa, tăng sức bền', icon: 'tabler:barbell' },
          { title: 'Boxing & Muay', description: 'Giải toả stress, tự vệ', icon: 'tabler:hand-grab' },
          { title: 'Bơi & Aqua', description: 'Hồ bơi 25m chuẩn quốc tế', icon: 'tabler:swimming' },
          { title: 'Dance Fitness', description: 'Zumba, K-Pop · Có lớp trẻ em', icon: 'tabler:music' },
          { title: 'PT 1-1', description: 'HLV riêng, lộ trình cá nhân hoá', icon: 'tabler:user-check' },
        ],
      }),
      block('Pricing', {
        title: 'Gói Hội Viên',
        subtitle: 'Không phí kích hoạt · Đông cứng miễn phí',
        prices: [
          { title: '1 Tháng', price: 799, period: 'k', items: [{ description: 'Tất cả lớp nhóm' }, { description: 'Hồ bơi + xông hơi' }] },
          { title: '6 Tháng', price: 3490, period: 'k', hasRibbon: true, ribbonTitle: 'Tiết kiệm 27%', items: [{ description: 'Tất cả quyền lợi' }, { description: 'Tặng 2 buổi PT' }] },
          { title: '12 Tháng', price: 5990, period: 'k', items: [{ description: 'Tất cả quyền lợi' }, { description: 'Tặng 6 buổi PT + in-body' }] },
        ],
      }),
      block('Team', {
        title: 'Đội Ngũ HLV',
        members: [
          { name: 'Coach Tuấn', role: 'Head of Strength', bio: 'NSCA-CPT · Vô địch Bodybuilding Hà Nội Open 2023' },
          { name: 'Coach Sarah', role: 'Yoga Master', bio: 'RYT-500 · 10 năm kinh nghiệm quốc tế' },
        ],
      }),
      block('CallToAction', { title: 'Đăng Ký Tập Thử 7 Ngày', subtitle: 'Miễn phí hoàn toàn · Không cần đặt cọc' }),
    ],
  },
  {
    id: 'vn-wedding',
    name: '💍 Studio Ảnh Cưới',
    description: 'Hồng pastel + vàng champagne · Gói chụp, album, ưu đãi',
    blocks: [
      block('Hero2', {
        title: 'Lưu Giữ Khoảnh Khắc Đẹp Nhất Của Bạn',
        subtitle: 'Concept độc quyền · Photographer đạt giải quốc tế · In album cao cấp',
        tagline: 'Wedding Studio',
        actions: [
          { variant: 'primary', text: 'Xem Bảng Giá', href: '#pricing' },
          { variant: 'secondary', text: 'Xem Portfolio', href: '#gallery' },
        ],
      }),
      block('Gallery', {
        title: 'Portfolio Cưới',
        subtitle: 'Hơn 3000 cặp đôi đã tin tưởng',
        columns: 3,
        images: [],
      }),
      block('Pricing', {
        title: 'Gói Chụp Cưới',
        prices: [
          { title: 'Gói Basic', price: 12, period: ' tr', items: [{ description: '1 địa điểm studio' }, { description: '2 bộ váy + 2 vest' }, { description: 'Album 20x30 · 20 trang' }] },
          { title: 'Gói Premium', price: 28, period: ' tr', hasRibbon: true, ribbonTitle: 'Bán chạy', items: [{ description: 'Ngoại cảnh Đà Lạt 2N1Đ' }, { description: '4 bộ váy + 3 vest' }, { description: 'Album pha lê + Video cưới' }] },
          { title: 'Gói Luxury', price: 65, period: ' tr', items: [{ description: 'Ngoại cảnh Bali / Đà Nẵng' }, { description: 'Concept riêng thiết kế' }, { description: 'Full dịch vụ cưới trọn gói' }] },
        ],
      }),
      block('Steps', {
        title: 'Quy Trình Chụp',
        items: [
          { title: 'Tư vấn concept', description: 'Lên ý tưởng phù hợp cặp đôi', icon: 'tabler:bulb' },
          { title: 'Thử váy', description: 'Chọn trang phục phù hợp dáng người', icon: 'tabler:hanger' },
          { title: 'Chụp hình', description: 'Make-up · Đạo cụ · Photographer', icon: 'tabler:camera' },
          { title: 'Giao album', description: 'Retouch · In ấn cao cấp · 3 tuần', icon: 'tabler:photo' },
        ],
      }),
      block('Testimonials', {
        title: 'Cặp Đôi Hạnh Phúc',
        testimonials: [
          { name: 'Anh Tuấn & Chị Mai', job: 'Khách hàng 03/2025', testimonial: 'Hình ảnh đẹp vượt mong đợi, team làm việc chuyên nghiệp, nhiệt tình suốt buổi chụp.' },
          { name: 'Anh Đức & Chị Linh', job: 'Khách hàng 06/2025', testimonial: 'Album in rất đẹp, video cưới xem đi xem lại vẫn xúc động. Cảm ơn studio rất nhiều!' },
        ],
      }),
      block('Contact', {
        title: 'Đặt Lịch Tư Vấn',
        inputs: [
          { type: 'text', name: 'names', label: 'Tên cặp đôi' },
          { type: 'tel', name: 'phone', label: 'Số điện thoại' },
          { type: 'text', name: 'date', label: 'Ngày cưới dự kiến' },
        ],
        textarea: { label: 'Concept mong muốn (vintage / Hàn Quốc / cổ trang...)' },
        button: 'Nhận Tư Vấn Miễn Phí',
      }),
    ],
  },
];
