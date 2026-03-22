/**
 * useBuilderAI Hook
 * 
 * Integrates CopilotKit AI into the Page Builder.
 * Provides context about current page state and actions
 * the AI can use to build/edit pages autonomously.
 */

import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core';
import type { BuilderBlock, PageMetadata } from '../core/types';
import type { WidgetType } from '../config/registry';
import { WIDGET_REGISTRY } from '../config/registry';
import { PAGE_TEMPLATES } from '../config/templates';
import { deepClone, generateId } from '../utils/helpers';

interface UseBuilderAIProps {
  blocks: BuilderBlock[];
  selectedId: string | null;
  metadata: PageMetadata;
  setBlocks: React.Dispatch<React.SetStateAction<BuilderBlock[]>>;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  setMetadata: React.Dispatch<React.SetStateAction<PageMetadata>>;
  getWidget: (type: string) => { defaultProps: Record<string, unknown> } | undefined;
}

export function useBuilderAI({
  blocks,
  selectedId,
  metadata,
  setBlocks,
  setSelectedId,
  setMetadata,
  getWidget,
}: UseBuilderAIProps) {
  // ==========================================
  // Context: Tell AI about current page state
  // ==========================================

  useCopilotReadable({
    description: 'Current page state and available widgets for the Page Builder',
    value: formatContext(blocks, selectedId, metadata),
  });

  // ==========================================
  // Action: Add a widget block
  // ==========================================

  useCopilotAction({
    name: 'addBlock',
    description: 'Add a new widget block to the page. Choose from available widget types.',
    parameters: [
      { name: 'type', type: 'string', description: `Widget type. Available: ${WIDGET_REGISTRY.map(w => w.type).join(', ')}`, required: true },
      { name: 'props', type: 'object', description: 'Widget properties. Check context for available fields per widget type.', required: false },
    ],
    handler: async ({ type, props }: { type: string; props?: object }) => {
      const def = getWidget(type);
      if (!def) return `Error: Widget "${type}" not found. Available: ${WIDGET_REGISTRY.map(w => w.type).join(', ')}`;

      const newBlock: BuilderBlock = {
        id: generateId(),
        type: type as WidgetType,
        props: { ...deepClone(def.defaultProps), ...((props as Record<string, unknown>) || {}) },
      };
      setBlocks(prev => [...prev, newBlock]);
      setSelectedId(newBlock.id);
      return `Added "${type}" block (ID: ${newBlock.id})`;
    },
  });

  // ==========================================
  // Action: Update block props
  // ==========================================

  useCopilotAction({
    name: 'updateBlockProps',
    description: 'Update properties of an existing block (by ID or index).',
    parameters: [
      { name: 'blockId', type: 'string', description: 'Block ID to update. Use block IDs from context.', required: true },
      { name: 'props', type: 'object', description: 'Properties to update. Merges with existing props.', required: true },
    ],
    handler: async ({ blockId, props }: { blockId: string; props: Record<string, unknown> }) => {
      const block = blocks.find(b => b.id === blockId);
      if (!block) return `Error: Block "${blockId}" not found`;

      setBlocks(prev => prev.map(b =>
        b.id === blockId ? { ...b, props: { ...b.props, ...props } } : b
      ));
      return `Updated block "${blockId}" (${block.type})`;
    },
  });

  // ==========================================
  // Action: Delete block
  // ==========================================

  useCopilotAction({
    name: 'deleteBlock',
    description: 'Delete a block from the page.',
    parameters: [
      { name: 'blockId', type: 'string', description: 'Block ID to delete', required: true },
    ],
    handler: async ({ blockId }: { blockId: string }) => {
      const block = blocks.find(b => b.id === blockId);
      if (!block) return `Error: Block "${blockId}" not found`;

      setBlocks(prev => prev.filter(b => b.id !== blockId));
      if (selectedId === blockId) setSelectedId(null);
      return `Deleted block "${blockId}" (${block.type})`;
    },
  });

  // ==========================================
  // Action: Duplicate block
  // ==========================================

  useCopilotAction({
    name: 'duplicateBlock',
    description: 'Duplicate an existing block.',
    parameters: [
      { name: 'blockId', type: 'string', description: 'Block ID to duplicate', required: true },
    ],
    handler: async ({ blockId }: { blockId: string }) => {
      const block = blocks.find(b => b.id === blockId);
      if (!block) return `Error: Block "${blockId}" not found`;

      const newBlock: BuilderBlock = {
        id: generateId(),
        type: block.type,
        props: deepClone(block.props),
      };
      const index = blocks.findIndex(b => b.id === blockId);
      setBlocks(prev => {
        const next = [...prev];
        next.splice(index + 1, 0, newBlock);
        return next;
      });
      setSelectedId(newBlock.id);
      return `Duplicated "${block.type}" → new ID: ${newBlock.id}`;
    },
  });

  // ==========================================
  // Action: Clear page
  // ==========================================

  useCopilotAction({
    name: 'clearPage',
    description: 'Remove all blocks from the page.',
    parameters: [],
    handler: async () => {
      const count = blocks.length;
      setBlocks([]);
      setSelectedId(null);
      return `Cleared ${count} blocks from page`;
    },
  });

  // ==========================================
  // Action: Update metadata
  // ==========================================

  useCopilotAction({
    name: 'updateMetadata',
    description: 'Update page title and description (SEO).',
    parameters: [
      { name: 'title', type: 'string', description: 'Page title', required: false },
      { name: 'description', type: 'string', description: 'Page description for SEO', required: false },
    ],
    handler: async ({ title, description }: { title?: string; description?: string }) => {
      setMetadata(prev => ({
        ...prev,
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
      }));
      return `Updated metadata: ${title ? `title="${title}"` : ''} ${description ? `desc="${description}"` : ''}`;
    },
  });

  // ==========================================
  // Action: Apply template
  // ==========================================

  useCopilotAction({
    name: 'applyTemplate',
    description: `Apply a predefined page template. Available: ${PAGE_TEMPLATES.map(t => `${t.id} (${t.name})`).join(', ')}`,
    parameters: [
      { name: 'templateId', type: 'string', description: 'Template ID', required: true },
    ],
    handler: async ({ templateId }: { templateId: string }) => {
      const template = PAGE_TEMPLATES.find(t => t.id === templateId);
      if (!template) return `Error: Template "${templateId}" not found. Available: ${PAGE_TEMPLATES.map(t => t.id).join(', ')}`;

      const newBlocks = template.blocks.map(b => ({
        id: generateId(),
        type: b.type,
        props: deepClone(b.props),
      }));
      setBlocks(newBlocks);
      return `Applied template "${template.name}" with ${newBlocks.length} blocks`;
    },
  });

  // ==========================================
  // Action: Reorder blocks
  // ==========================================

  useCopilotAction({
    name: 'reorderBlocks',
    description: 'Move a block to a different position.',
    parameters: [
      { name: 'blockId', type: 'string', description: 'Block ID to move', required: true },
      { name: 'toIndex', type: 'number', description: 'New position (0-based)', required: true },
    ],
    handler: async ({ blockId, toIndex }: { blockId: string; toIndex: number }) => {
      const fromIndex = blocks.findIndex(b => b.id === blockId);
      if (fromIndex === -1) return `Error: Block "${blockId}" not found`;
      if (toIndex < 0 || toIndex >= blocks.length) return `Error: Invalid index ${toIndex}`;

      setBlocks(prev => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
      return `Moved block from position ${fromIndex} to ${toIndex}`;
    },
  });

  // ==========================================
  // Action: Generate complete page
  // ==========================================

  useCopilotAction({
    name: 'generateCompletePage',
    description: `Create a COMPLETE page from a description. Generates appropriate blocks with content.
Use this when user asks to "tạo trang về...", "create a page for...", or describes a website.`,
    parameters: [
      { name: 'description', type: 'string', description: 'Page description/topic', required: true },
      { name: 'style', type: 'string', description: 'Style: business, portfolio, landing, blog, minimal. Default: landing', required: false },
    ],
    handler: async ({ description, style }: { description: string; style?: string }) => {
      const pageStyle = style || 'landing';
      const newBlocks: BuilderBlock[] = [];

      // Hero section
      newBlocks.push({
        id: generateId(),
        type: 'Hero' as WidgetType,
        props: {
          title: description,
          subtitle: 'Khám phá ngay hôm nay',
          tagline: 'Chào mừng',
          actions: [
            { variant: 'primary', text: 'Bắt đầu ngay', href: '#features' },
            { variant: 'secondary', text: 'Tìm hiểu thêm', href: '#about' },
          ],
          titleAnimationType: 'fadeInUp',
          titleAnimationDuration: 800,
          imageAnimationType: 'zoomIn',
          imageAnimationDuration: 1000,
          imageAnimationDelay: 200,
          id: 'hero',
        },
      });

      // Features
      newBlocks.push({
        id: generateId(),
        type: 'Features' as WidgetType,
        props: {
          title: 'Tính năng nổi bật',
          subtitle: 'Những gì chúng tôi mang lại',
          tagline: 'Tại sao chọn chúng tôi?',
          items: [
            { title: 'Chất lượng cao', description: 'Cam kết chất lượng hàng đầu', icon: 'tabler:star' },
            { title: 'Nhanh chóng', description: 'Xử lý nhanh chóng và hiệu quả', icon: 'tabler:rocket' },
            { title: 'Bảo mật', description: 'An toàn và bảo mật tuyệt đối', icon: 'tabler:shield-check' },
            { title: 'Hỗ trợ 24/7', description: 'Luôn sẵn sàng hỗ trợ bạn', icon: 'tabler:headset' },
          ],
          columns: 2,
          itemAnimationType: 'fadeInUp',
          itemAnimationDuration: 600,
          itemAnimationDelay: 100,
          id: 'features',
        },
      });

      if (pageStyle === 'business' || pageStyle === 'landing') {
        // Stats
        newBlocks.push({
          id: generateId(),
          type: 'Stats' as WidgetType,
          props: {
            title: 'Con số ấn tượng',
            stats: [
              { title: 'Khách hàng', amount: '10,000+', icon: 'tabler:users' },
              { title: 'Dự án', amount: '500+', icon: 'tabler:briefcase' },
              { title: 'Đánh giá', amount: '4.9/5', icon: 'tabler:star' },
              { title: 'Quốc gia', amount: '20+', icon: 'tabler:world' },
            ],
            animationType: 'fadeIn',
            animationDuration: 800,
            id: 'stats',
          },
        });
      }

      // Content block
      newBlocks.push({
        id: generateId(),
        type: 'Content1' as WidgetType,
        props: {
          title: 'Về chúng tôi',
          subtitle: 'Câu chuyện của chúng tôi',
          content: `<p>Chúng tôi là đội ngũ đam mê ${description.toLowerCase()}. Với nhiều năm kinh nghiệm, chúng tôi cam kết mang đến giải pháp tốt nhất cho bạn.</p>`,
          image: {
            src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
            alt: 'Team'
          },
          id: 'about',
        },
      });

      if (pageStyle !== 'minimal') {
        // Testimonials
        newBlocks.push({
          id: generateId(),
          type: 'Testimonials' as WidgetType,
          props: {
            title: 'Khách hàng nói gì?',
            testimonials: [
              { name: 'Nguyễn Văn A', job: 'CEO', testimonial: 'Dịch vụ tuyệt vời! Rất hài lòng với kết quả.', image: { src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300', alt: 'Customer' } },
              { name: 'Trần Thị B', job: 'Manager', testimonial: 'Chuyên nghiệp và đáng tin cậy. Sẽ giới thiệu cho bạn bè.', image: { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300', alt: 'Customer' } },
            ],
            animationType: 'fadeInUp',
            animationDuration: 700,
            id: 'testimonials',
          },
        });

        // FAQs
        newBlocks.push({
          id: generateId(),
          type: 'FAQs' as WidgetType,
          props: {
            title: 'Câu hỏi thường gặp',
            items: [
              { title: 'Làm thế nào để bắt đầu?', description: 'Bạn chỉ cần đăng ký tài khoản và bắt đầu sử dụng ngay.' },
              { title: 'Chi phí như thế nào?', description: 'Chúng tôi có nhiều gói phù hợp với mọi nhu cầu. Liên hệ để được tư vấn.' },
              { title: 'Có hỗ trợ kỹ thuật không?', description: 'Đội ngũ hỗ trợ luôn sẵn sàng 24/7 qua email, chat và điện thoại.' },
            ],
            animationType: 'fadeIn',
            animationDuration: 500,
            id: 'faq',
          },
        });
      }

      // CTA
      newBlocks.push({
        id: generateId(),
        type: 'CallToAction' as WidgetType,
        props: {
          title: 'Sẵn sàng bắt đầu?',
          subtitle: 'Hãy liên hệ với chúng tôi ngay hôm nay',
          actions: [
            { variant: 'primary', text: 'Liên hệ ngay', href: '#contact' },
          ],
          animationType: 'fadeInUp',
          animationDuration: 800,
          loopAnimation: 'pulse',
          id: 'cta',
        },
      });

      // Contact
      newBlocks.push({
        id: generateId(),
        type: 'Contact' as WidgetType,
        props: {
          title: 'Liên hệ',
          subtitle: 'Chúng tôi luôn sẵn sàng lắng nghe bạn',
          inputs: [
            { type: 'text', name: 'name', label: 'Họ và tên' },
            { type: 'email', name: 'email', label: 'Email' },
          ],
          textarea: { label: 'Tin nhắn' },
          button: 'Gửi tin nhắn',
          animationType: 'fadeIn',
          animationDuration: 600,
          id: 'contact',
        },
      });

      setBlocks(newBlocks);
      setMetadata({
        title: description,
        description: `Trang web về ${description}`,
      });

      return `✅ Tạo trang "${description}" hoàn chỉnh với ${newBlocks.length} blocks (${pageStyle} style). Bạn có thể chỉnh sửa nội dung từng block.`;
    },
  });

  // ==========================================
  // Action: Add multiple blocks at once
  // ==========================================

  useCopilotAction({
    name: 'addMultipleBlocks',
    description: 'Add multiple widget blocks at once. Useful for building sections quickly.',
    parameters: [
      {
        name: 'blocks',
        type: 'object[]',
        description: 'Array of blocks. Each block has: type (WidgetType), props (object, optional)',
        required: true,
      },
    ],
    handler: async ({ blocks: newBlockDefs }: { blocks: Array<{ type: string; props?: Record<string, unknown> }> }) => {
      const added: string[] = [];
      const errors: string[] = [];

      for (const blockDef of newBlockDefs) {
        const def = getWidget(blockDef.type);
        if (!def) {
          errors.push(`Widget "${blockDef.type}" not found`);
          continue;
        }
        const newBlock: BuilderBlock = {
          id: generateId(),
          type: blockDef.type as WidgetType,
          props: { ...deepClone(def.defaultProps), ...(blockDef.props || {}) },
        };
        setBlocks(prev => [...prev, newBlock]);
        added.push(`${blockDef.type} (${newBlock.id})`);
      }

      return `Added ${added.length} blocks: ${added.join(', ')}${errors.length ? `. Errors: ${errors.join(', ')}` : ''}`;
    },
  });

  // ==========================================
  // Action: Generate page by Vietnamese industry
  // ==========================================

  useCopilotAction({
    name: 'generateIndustryPage',
    description: `Tạo trang web hoàn chỉnh theo ngành nghề phổ biến tại Việt Nam.
Các ngành hỗ trợ: nha-hang, spa-tham-my, phong-kham, bat-dong-san, thoi-trang, du-lich, gym-fitness, giao-duc, xay-dung, cong-nghe, luat-tu-van, cafe-bakery.
Ví dụ: "tạo trang nhà hàng Phở Bắc", "tạo web spa An Nhiên", "website bất động sản Đà Nẵng".`,
    parameters: [
      { name: 'industry', type: 'string', description: 'Ngành nghề: nha-hang | spa-tham-my | phong-kham | bat-dong-san | thoi-trang | du-lich | gym-fitness | giao-duc | xay-dung | cong-nghe | luat-tu-van | cafe-bakery', required: true },
      { name: 'brandName', type: 'string', description: 'Tên thương hiệu / doanh nghiệp', required: false },
      { name: 'location', type: 'string', description: 'Địa điểm (tỉnh/thành phố)', required: false },
    ],
    handler: async ({ industry, brandName, location }: { industry: string; brandName?: string; location?: string }) => {
      const brand = brandName || 'Thương Hiệu Của Bạn';
      const loc = location ? ` tại ${location}` : '';
      const newBlocks: BuilderBlock[] = [];

      const mkId = () => generateId();

      const heroBlock = (title: string, subtitle: string, tagline: string, cta: string) => ({
        id: mkId(), type: 'Hero' as WidgetType,
        props: { title, subtitle, tagline, id: 'hero', actions: [{ variant: 'primary', text: cta, href: '#lien-he' }, { variant: 'secondary', text: 'Xem thêm', href: '#gioi-thieu' }], titleAnimationType: 'fadeInUp', titleAnimationDuration: 800 },
      });

      const featBlock = (title: string, subtitle: string, items: {title:string,description:string,icon:string}[]) => ({
        id: mkId(), type: 'Features' as WidgetType,
        props: { title, subtitle, items, columns: 3, id: 'dich-vu', itemAnimationType: 'fadeInUp', itemAnimationDuration: 600, itemAnimationDelay: 100 },
      });

      const statsBlock = (stats: {title:string,amount:string,icon:string}[]) => ({
        id: mkId(), type: 'Stats' as WidgetType,
        props: { title: 'Con số ấn tượng', stats, id: 'stats' },
      });

      const testimonialsBlock = (title: string) => ({
        id: mkId(), type: 'Testimonials' as WidgetType,
        props: { title, testimonials: [
          { name: 'Nguyễn Văn A', job: 'Khách hàng', testimonial: 'Dịch vụ rất chuyên nghiệp, tôi rất hài lòng!', image: { src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', alt: 'KH' } },
          { name: 'Trần Thị B', job: 'Khách hàng thân thiết', testimonial: 'Chất lượng tuyệt vời, giá cả hợp lý. Sẽ quay lại!', image: { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', alt: 'KH' } },
        ], id: 'danh-gia' },
      });

      const ctaBlock = (title: string, subtitle: string, btn: string) => ({
        id: mkId(), type: 'CallToAction' as WidgetType,
        props: { title, subtitle, actions: [{ variant: 'primary', text: btn, href: '#lien-he' }], id: 'cta', animationType: 'fadeInUp' },
      });

      const contactBlock = () => ({
        id: mkId(), type: 'Contact' as WidgetType,
        props: { title: 'Liên hệ ngay', subtitle: `Chúng tôi luôn sẵn sàng hỗ trợ bạn${loc}`, inputs: [{ type: 'text', name: 'name', label: 'Họ và tên' }, { type: 'tel', name: 'phone', label: 'Số điện thoại' }, { type: 'email', name: 'email', label: 'Email' }], textarea: { label: 'Nội dung' }, button: 'Gửi yêu cầu', id: 'lien-he' },
      });

      const faqBlock = (items: {title:string,description:string}[]) => ({
        id: mkId(), type: 'FAQs' as WidgetType,
        props: { title: 'Câu hỏi thường gặp', items, id: 'faq' },
      });

      switch (industry) {
        case 'nha-hang':
          newBlocks.push(
            heroBlock(`${brand} — Hương vị đậm đà${loc}`, 'Ẩm thực Việt Nam chính thống — Nguyên liệu tươi sạch mỗi ngày', 'Nhà hàng', 'Đặt bàn ngay'),
            featBlock('Thực đơn nổi bật', 'Những món ăn được yêu thích nhất', [
              { title: 'Đặc sản truyền thống', description: 'Công thức gia truyền, hương vị chính gốc', icon: 'tabler:bowl' },
              { title: 'Hải sản tươi sống', description: 'Nhập hàng ngày từ các cảng biển uy tín', icon: 'tabler:fish' },
              { title: 'Buffet cuối tuần', description: 'Hơn 50 món, phục vụ không giới hạn', icon: 'tabler:tools-kitchen-2' },
            ]),
            statsBlock([{ title: 'Năm hoạt động', amount: '10+', icon: 'tabler:calendar' }, { title: 'Khách hàng mỗi tháng', amount: '5,000+', icon: 'tabler:users' }, { title: 'Món ăn đặc sắc', amount: '80+', icon: 'tabler:chef-hat' }, { title: 'Đánh giá 5★', amount: '98%', icon: 'tabler:star' }]),
            testimonialsBlock('Khách hàng nói gì về chúng tôi?'),
            faqBlock([{ title: 'Nhà hàng có nhận đặt bàn trước không?', description: 'Có, quý khách có thể đặt bàn qua điện thoại hoặc form liên hệ. Chúng tôi xác nhận trong 30 phút.' }, { title: 'Có phục vụ tiệc theo yêu cầu không?', description: 'Có, chúng tôi nhận tổ chức tiệc công ty, tiệc gia đình, liên hoan từ 10 đến 500 người.' }]),
            ctaBlock('Đặt bàn hôm nay — Trải nghiệm hương vị đích thực', 'Không gian ấm cúng, phục vụ chu đáo', 'Đặt bàn ngay'),
            contactBlock(),
          );
          break;

        case 'spa-tham-my':
          newBlocks.push(
            heroBlock(`${brand} — Sắc đẹp & Thư giãn${loc}`, 'Phục hồi nhan sắc — Tái tạo năng lượng — Chăm sóc toàn diện', 'Spa & Thẩm mỹ', 'Đặt lịch ngay'),
            featBlock('Dịch vụ nổi bật', 'Liệu trình chuyên sâu bởi chuyên gia hàng đầu', [
              { title: 'Chăm sóc da mặt', description: 'Công nghệ hiện đại, phù hợp mọi loại da', icon: 'tabler:sparkles' },
              { title: 'Massage thư giãn', description: 'Liệu pháp đá nóng, tinh dầu thiên nhiên cao cấp', icon: 'tabler:heart-handshake' },
              { title: 'Triệt lông & Điêu khắc', description: 'Laser công nghệ mới, an toàn và hiệu quả', icon: 'tabler:wand' },
            ]),
            statsBlock([{ title: 'Khách hàng tin tưởng', amount: '20K+', icon: 'tabler:users' }, { title: 'Chuyên gia tay nghề cao', amount: '30+', icon: 'tabler:certificate' }, { title: 'Liệu trình đặc biệt', amount: '50+', icon: 'tabler:sparkles' }, { title: 'Năm kinh nghiệm', amount: '8+', icon: 'tabler:calendar' }]),
            testimonialsBlock('Khách hàng chia sẻ cảm nhận'),
            faqBlock([{ title: 'Spa có tư vấn da miễn phí không?', description: 'Có, chúng tôi tư vấn da liễu miễn phí trước khi thực hiện liệu trình.' }, { title: 'Thẻ thành viên có ưu đãi gì?', description: 'Thành viên VIP được ưu đãi 20-30% toàn bộ dịch vụ, tặng quà sinh nhật và ưu tiên đặt lịch.' }]),
            ctaBlock('Đặt lịch hôm nay — Ưu đãi 20% cho khách mới', 'Số lượng slot có hạn, đặt sớm để được phục vụ tốt nhất', 'Đặt lịch ngay'),
            contactBlock(),
          );
          break;

        case 'phong-kham':
          newBlocks.push(
            heroBlock(`${brand} — Chăm sóc sức khỏe toàn diện${loc}`, 'Đội ngũ bác sĩ chuyên khoa — Trang thiết bị hiện đại — Dịch vụ tận tâm', 'Phòng khám', 'Đặt lịch khám'),
            featBlock('Chuyên khoa', 'Dịch vụ y tế đa dạng, chuyên sâu', [
              { title: 'Khám tổng quát', description: 'Kiểm tra sức khỏe định kỳ, xét nghiệm đầy đủ', icon: 'tabler:stethoscope' },
              { title: 'Nha khoa', description: 'Răng sứ, niềng răng, tẩy trắng thẩm mỹ', icon: 'tabler:dental' },
              { title: 'Da liễu', description: 'Điều trị mụn, nám, sẹo, chăm sóc da chuyên sâu', icon: 'tabler:heart-plus' },
            ]),
            statsBlock([{ title: 'Bác sĩ chuyên khoa', amount: '20+', icon: 'tabler:stethoscope' }, { title: 'Bệnh nhân mỗi tháng', amount: '3,000+', icon: 'tabler:users' }, { title: 'Năm hoạt động', amount: '12+', icon: 'tabler:calendar' }, { title: 'Tỉ lệ hài lòng', amount: '99%', icon: 'tabler:star' }]),
            testimonialsBlock('Bệnh nhân nói về chúng tôi'),
            faqBlock([{ title: 'Có cần đặt lịch trước không?', description: 'Khuyến khích đặt lịch trước để giảm thời gian chờ. Tuy nhiên cũng nhận khám trong ngày.' }, { title: 'Bảo hiểm y tế có được chấp nhận không?', description: 'Có, phòng khám chấp nhận hầu hết các loại bảo hiểm y tế và bảo hiểm sức khỏe tư nhân.' }]),
            ctaBlock('Đặt lịch khám ngay — Bảo vệ sức khỏe từ hôm nay', 'Khám sớm, phát hiện sớm, điều trị hiệu quả hơn', 'Đặt lịch khám'),
            contactBlock(),
          );
          break;

        case 'bat-dong-san':
          newBlocks.push(
            heroBlock(`${brand} — Địa ốc uy tín${loc}`, 'Tư vấn mua bán — Cho thuê — Đầu tư bất động sản sinh lời', 'Bất động sản', 'Tư vấn miễn phí'),
            featBlock('Dịch vụ của chúng tôi', 'Giải pháp bất động sản toàn diện', [
              { title: 'Mua bán căn hộ', description: 'Danh mục đa dạng, pháp lý minh bạch, giá tốt nhất thị trường', icon: 'tabler:building' },
              { title: 'Cho thuê văn phòng', description: 'Vị trí đắc địa, hợp đồng linh hoạt, hỗ trợ setup', icon: 'tabler:building-office' },
              { title: 'Tư vấn đầu tư', description: 'Phân tích dòng tiền, lợi suất và rủi ro chi tiết', icon: 'tabler:chart-arrows' },
            ]),
            statsBlock([{ title: 'Giao dịch thành công', amount: '2,000+', icon: 'tabler:check' }, { title: 'Giá trị giao dịch', amount: '500 tỷ+', icon: 'tabler:currency-dong' }, { title: 'Chuyên viên kinh nghiệm', amount: '50+', icon: 'tabler:users' }, { title: 'Năm trên thị trường', amount: '15+', icon: 'tabler:calendar' }]),
            testimonialsBlock('Khách hàng chia sẻ'),
            faqBlock([{ title: 'Phí môi giới là bao nhiêu?', description: 'Phí môi giới tiêu chuẩn 1-2% giá trị giao dịch. Tư vấn lần đầu hoàn toàn miễn phí.' }, { title: 'Có hỗ trợ vay ngân hàng không?', description: 'Có, chúng tôi hợp tác với 10+ ngân hàng, hỗ trợ vay đến 70% giá trị bất động sản.' }]),
            ctaBlock('Tìm bất động sản phù hợp với bạn', 'Hàng nghìn dự án đang chờ — Tư vấn miễn phí 24/7', 'Nhận tư vấn ngay'),
            contactBlock(),
          );
          break;

        case 'thoi-trang':
          newBlocks.push(
            heroBlock(`${brand} — Phong cách Việt${loc}`, 'Thời trang hiện đại — Chất liệu cao cấp — Thiết kế độc quyền', 'Thời trang', 'Mua sắm ngay'),
            featBlock('Bộ sưu tập', 'Phong cách đa dạng cho mọi dịp', [
              { title: 'Thời trang công sở', description: 'Thanh lịch, chuyên nghiệp, thoải mái suốt ngày dài', icon: 'tabler:shirt' },
              { title: 'Đầm dự tiệc', description: 'Thiết kế sang trọng, nổi bật trong mọi sự kiện', icon: 'tabler:stars' },
              { title: 'Thời trang đường phố', description: 'Trẻ trung, phóng khoáng, cá tính riêng', icon: 'tabler:hanger' },
            ]),
            statsBlock([{ title: 'Mẫu thiết kế/năm', amount: '500+', icon: 'tabler:palette' }, { title: 'Khách hàng thân thiết', amount: '50K+', icon: 'tabler:users' }, { title: 'Cửa hàng toàn quốc', amount: '25+', icon: 'tabler:map-pin' }, { title: 'Năm thương hiệu', amount: '7+', icon: 'tabler:calendar' }]),
            testimonialsBlock('Khách hàng yêu thích'),
            ctaBlock('Flash sale cuối tuần — Giảm đến 50%', 'Đăng ký nhận thông báo để không bỏ lỡ ưu đãi', 'Xem ưu đãi ngay'),
            contactBlock(),
          );
          break;

        case 'du-lich':
          newBlocks.push(
            heroBlock(`${brand} — Khám phá Việt Nam${loc}`, 'Tour trọn gói — Khách sạn cao cấp — Trải nghiệm đáng nhớ', 'Du lịch & Lữ hành', 'Đặt tour ngay'),
            featBlock('Dịch vụ du lịch', 'Hành trình được thiết kế riêng cho bạn', [
              { title: 'Tour trong nước', description: 'Hà Nội, Đà Nẵng, Phú Quốc, Hội An và hơn thế nữa', icon: 'tabler:map' },
              { title: 'Tour quốc tế', description: 'Thái Lan, Nhật Bản, Hàn Quốc, châu Âu...', icon: 'tabler:plane' },
              { title: 'Visa & Thủ tục', description: 'Hỗ trợ xin visa nhanh, tỉ lệ đậu cao', icon: 'tabler:passport' },
            ]),
            statsBlock([{ title: 'Khách hàng năm qua', amount: '30K+', icon: 'tabler:users' }, { title: 'Tour đặc sắc', amount: '200+', icon: 'tabler:map' }, { title: 'Điểm đến', amount: '50+', icon: 'tabler:map-pin' }, { title: 'Năm kinh nghiệm', amount: '10+', icon: 'tabler:calendar' }]),
            testimonialsBlock('Du khách chia sẻ hành trình'),
            faqBlock([{ title: 'Có thể tùy chỉnh lịch trình không?', description: 'Có, chúng tôi thiết kế tour theo nhu cầu riêng, linh hoạt về thời gian và ngân sách.' }, { title: 'Chính sách hoàn hủy như thế nào?', description: 'Hoàn 100% nếu hủy trước 15 ngày, 50% nếu hủy trước 7 ngày.' }]),
            ctaBlock('Lên kế hoạch cho chuyến đi mơ ước!', 'Tháng này đặt sớm — Tiết kiệm đến 30%', 'Đặt tour ngay'),
            contactBlock(),
          );
          break;

        case 'gym-fitness':
          newBlocks.push(
            heroBlock(`${brand} — Rèn luyện & Sống khỏe${loc}`, 'Gym hiện đại — Huấn luyện viên cá nhân — Dinh dưỡng khoa học', 'Gym & Fitness', 'Đăng ký tập thử'),
            featBlock('Dịch vụ tập luyện', 'Chương trình phù hợp mọi mục tiêu', [
              { title: 'Phòng gym hiện đại', description: 'Trang thiết bị nhập khẩu, không gian rộng rãi thoáng mát', icon: 'tabler:barbell' },
              { title: 'Yoga & Pilates', description: 'Lớp nhóm mỗi ngày, cân bằng thể chất & tâm trí', icon: 'tabler:heart' },
              { title: 'PT cá nhân', description: 'Huấn luyện viên được chứng nhận quốc tế, lộ trình cá nhân hóa', icon: 'tabler:user-check' },
            ]),
            statsBlock([{ title: 'Thành viên đang tập', amount: '3,000+', icon: 'tabler:users' }, { title: 'Lớp học mỗi tuần', amount: '100+', icon: 'tabler:calendar-event' }, { title: 'Huấn luyện viên PT', amount: '20+', icon: 'tabler:certificate' }, { title: 'Thiết bị hiện đại', amount: '200+', icon: 'tabler:barbell' }]),
            testimonialsBlock('Thành viên chia sẻ kết quả'),
            faqBlock([{ title: 'Có gói tập theo ngày không?', description: 'Có gói ngày, tuần, tháng và năm. Thẻ năm tiết kiệm đến 40%.' }, { title: 'Gym mở cửa mấy tiếng?', description: 'Mở cửa từ 5:30 sáng đến 22:00, kể cả cuối tuần và ngày lễ.' }]),
            ctaBlock('Tập thử 7 ngày MIỄN PHÍ', 'Đăng ký hôm nay — Bắt đầu hành trình sống khỏe', 'Đăng ký ngay'),
            contactBlock(),
          );
          break;

        case 'giao-duc':
          newBlocks.push(
            heroBlock(`${brand} — Học tập & Phát triển${loc}`, 'Chương trình chuẩn quốc tế — Giáo viên giàu kinh nghiệm — Cam kết đầu ra', 'Giáo dục & Đào tạo', 'Đăng ký học thử'),
            featBlock('Chương trình đào tạo', 'Lộ trình học tập bài bản, hiệu quả', [
              { title: 'Tiếng Anh giao tiếp', description: 'IELTS, TOEIC, tiếng Anh thương mại — Cam kết đầu ra', icon: 'tabler:language' },
              { title: 'Kỹ năng lập trình', description: 'Web, Mobile, AI/ML — Học từ cơ bản đến nâng cao', icon: 'tabler:code' },
              { title: 'Kỹ năng mềm', description: 'Thuyết trình, lãnh đạo, quản lý thời gian', icon: 'tabler:brain' },
            ]),
            statsBlock([{ title: 'Học viên đã tốt nghiệp', amount: '10K+', icon: 'tabler:graduation-cap' }, { title: 'Giáo viên chuyên môn', amount: '50+', icon: 'tabler:school' }, { title: 'Tỉ lệ việc làm', amount: '92%', icon: 'tabler:briefcase' }, { title: 'Năm đào tạo', amount: '8+', icon: 'tabler:calendar' }]),
            testimonialsBlock('Học viên chia sẻ'),
            faqBlock([{ title: 'Có học thử trước khi đăng ký không?', description: 'Có, học thử 1 buổi hoàn toàn miễn phí để cảm nhận chất lượng giảng dạy.' }, { title: 'Học online hay offline?', description: 'Cả hai hình thức. Học online qua Zoom, offline tại cơ sở. Có thể kết hợp linh hoạt.' }]),
            ctaBlock('Học thử MIỄN PHÍ — Đăng ký ngay hôm nay', 'Khóa học sắp khai giảng — Số lượng có hạn', 'Đăng ký học thử'),
            contactBlock(),
          );
          break;

        case 'xay-dung':
          newBlocks.push(
            heroBlock(`${brand} — Xây dựng & Nội thất${loc}`, 'Thiết kế đẳng cấp — Thi công chuyên nghiệp — Bảo hành dài hạn', 'Xây dựng & Nội thất', 'Nhận báo giá ngay'),
            featBlock('Dịch vụ xây dựng', 'Giải pháp toàn diện từ thiết kế đến hoàn thiện', [
              { title: 'Thiết kế kiến trúc', description: 'Nhà phố, biệt thự, văn phòng — Phong cách đa dạng', icon: 'tabler:ruler-2' },
              { title: 'Thi công trọn gói', description: 'Giám sát 24/7, vật liệu chính hãng, đúng tiến độ', icon: 'tabler:building-bridge' },
              { title: 'Nội thất cao cấp', description: 'Thiết kế 3D trực quan, thi công tỉ mỉ, bảo hành 5 năm', icon: 'tabler:sofa' },
            ]),
            statsBlock([{ title: 'Công trình hoàn thành', amount: '500+', icon: 'tabler:building' }, { title: 'Năm kinh nghiệm', amount: '15+', icon: 'tabler:calendar' }, { title: 'Kỹ sư & Kiến trúc sư', amount: '80+', icon: 'tabler:hard-hat' }, { title: 'Khách hàng hài lòng', amount: '98%', icon: 'tabler:star' }]),
            testimonialsBlock('Gia chủ chia sẻ'),
            ctaBlock('Nhận báo giá MIỄN PHÍ trong 24 giờ', 'Tư vấn thiết kế không mất phí — Gọi ngay để được hỗ trợ', 'Nhận báo giá'),
            contactBlock(),
          );
          break;

        case 'cong-nghe':
          newBlocks.push(
            heroBlock(`${brand} — Giải pháp Công nghệ${loc}`, 'Phần mềm tùy chỉnh — Chuyển đổi số — Tối ưu vận hành doanh nghiệp', 'Công nghệ & Phần mềm', 'Tư vấn miễn phí'),
            featBlock('Giải pháp công nghệ', 'Sản phẩm & dịch vụ phù hợp mọi quy mô doanh nghiệp', [
              { title: 'Phát triển phần mềm', description: 'Web app, mobile app, hệ thống ERP/CRM theo yêu cầu', icon: 'tabler:code-circle' },
              { title: 'Chuyển đổi số', description: 'Tư vấn và triển khai chiến lược số hóa toàn diện', icon: 'tabler:transform' },
              { title: 'Cloud & DevOps', description: 'AWS, GCP, Azure — Hạ tầng ổn định, bảo mật cao', icon: 'tabler:cloud' },
            ]),
            statsBlock([{ title: 'Dự án đã triển khai', amount: '300+', icon: 'tabler:check' }, { title: 'Kỹ sư chuyên môn', amount: '60+', icon: 'tabler:users' }, { title: 'Khách hàng tại', amount: '10 quốc gia', icon: 'tabler:world' }, { title: 'Năm thành lập', amount: '6+', icon: 'tabler:calendar' }]),
            testimonialsBlock('Đối tác & Khách hàng nhận xét'),
            faqBlock([{ title: 'Thời gian phát triển phần mềm mất bao lâu?', description: 'Tùy độ phức tạp: MVP 4-8 tuần, hệ thống lớn 3-6 tháng. Báo giá và timeline cụ thể sau tư vấn.' }, { title: 'Có hỗ trợ sau bàn giao không?', description: 'Có, bảo hành 12 tháng, hỗ trợ kỹ thuật 24/7, nâng cấp tính năng linh hoạt.' }]),
            ctaBlock('Bắt đầu dự án của bạn ngay hôm nay', 'Tư vấn miễn phí — Demo sản phẩm thực tế', 'Đặt lịch tư vấn'),
            contactBlock(),
          );
          break;

        case 'luat-tu-van':
          newBlocks.push(
            heroBlock(`${brand} — Tư vấn Pháp lý${loc}`, 'Luật sư kinh nghiệm — Tư vấn tận tâm — Giải quyết nhanh chóng', 'Văn phòng Luật sư', 'Tư vấn ngay'),
            featBlock('Lĩnh vực tư vấn', 'Hỗ trợ pháp lý toàn diện cho cá nhân và doanh nghiệp', [
              { title: 'Pháp lý doanh nghiệp', description: 'Thành lập, giải thể, M&A, hợp đồng thương mại', icon: 'tabler:building-bank' },
              { title: 'Tranh tụng dân sự', description: 'Đất đai, hôn nhân gia đình, thừa kế, hợp đồng', icon: 'tabler:gavel' },
              { title: 'Sở hữu trí tuệ', description: 'Đăng ký nhãn hiệu, bản quyền, bằng sáng chế', icon: 'tabler:copyright' },
            ]),
            statsBlock([{ title: 'Vụ việc giải quyết thành công', amount: '1,000+', icon: 'tabler:check' }, { title: 'Luật sư & Chuyên viên', amount: '15+', icon: 'tabler:users' }, { title: 'Năm hoạt động', amount: '12+', icon: 'tabler:calendar' }, { title: 'Khách hàng hài lòng', amount: '97%', icon: 'tabler:star' }]),
            testimonialsBlock('Khách hàng tin tưởng'),
            faqBlock([{ title: 'Phí tư vấn ban đầu là bao nhiêu?', description: 'Tư vấn lần đầu qua điện thoại hoặc online miễn phí. Phí thu sau khi đã đánh giá rõ vụ việc.' }, { title: 'Bao lâu thì giải quyết xong?', description: 'Tùy loại vụ việc: tư vấn đơn giản 1-3 ngày, tranh tụng có thể 3-12 tháng.' }]),
            ctaBlock('Bảo vệ quyền lợi của bạn ngay hôm nay', 'Tư vấn bảo mật — Không để bạn đơn độc trước pháp luật', 'Tư vấn miễn phí'),
            contactBlock(),
          );
          break;

        case 'cafe-bakery':
          newBlocks.push(
            heroBlock(`${brand} — Café & Bánh ngọt${loc}`, 'Không gian ấm cúng — Cà phê rang xay — Bánh tươi mỗi ngày', 'Café & Bakery', 'Ghé thăm chúng tôi'),
            featBlock('Menu đặc sắc', 'Hương vị đậm đà, nguyên liệu tự nhiên', [
              { title: 'Specialty Coffee', description: 'Espresso, Pour-over, Cold brew từ hạt cà phê tuyển chọn', icon: 'tabler:coffee' },
              { title: 'Bánh tươi mỗi ngày', description: 'Croissant, Tiramisu, bánh mì Pháp — Làm mới mỗi sáng', icon: 'tabler:cookie' },
              { title: 'Không gian làm việc', description: 'WiFi tốc độ cao, ổ cắm điện, yên tĩnh và thoải mái', icon: 'tabler:wifi' },
            ]),
            statsBlock([{ title: 'Khách ghé thăm mỗi ngày', amount: '300+', icon: 'tabler:users' }, { title: 'Loại bánh độc quyền', amount: '50+', icon: 'tabler:cookie' }, { title: 'Nguồn cà phê đặc sản', amount: '8 vùng', icon: 'tabler:coffee' }, { title: 'Năm hoạt động', amount: '5+', icon: 'tabler:calendar' }]),
            testimonialsBlock('Khách hàng thân thiết chia sẻ'),
            ctaBlock('Check-in ngay — Chia sẻ cảm xúc của bạn', 'Mỗi ly cà phê là một trải nghiệm mới', 'Xem menu'),
            contactBlock(),
          );
          break;

        default:
          return `❌ Ngành "${industry}" chưa được hỗ trợ. Các ngành hiện có: nha-hang, spa-tham-my, phong-kham, bat-dong-san, thoi-trang, du-lich, gym-fitness, giao-duc, xay-dung, cong-nghe, luat-tu-van, cafe-bakery.`;
      }

      setBlocks(newBlocks);
      setMetadata({ title: brand, description: `Website ${brand}${loc}` });
      return `✅ Tạo trang "${brand}" (${industry}) hoàn chỉnh với ${newBlocks.length} blocks. Bạn có thể chỉnh sửa nội dung từng section!`;
    },
  });
}

// ==========================================
// Helper: Format context for AI
// ==========================================

function formatContext(
  blocks: BuilderBlock[],
  selectedId: string | null,
  metadata: PageMetadata,
): string {
  const lines: string[] = [];

  lines.push('# Page Builder Context');
  lines.push('');
  lines.push(`## Page Metadata`);
  lines.push(`- Title: ${metadata.title}`);
  lines.push(`- Description: ${metadata.description}`);
  lines.push(`- Layout: ${metadata.layout || 'default'}`);
  lines.push('');

  lines.push(`## Current Blocks (${blocks.length} total)`);
  if (blocks.length === 0) {
    lines.push('  (empty page - no blocks)');
  } else {
    blocks.forEach((b, i) => {
      const selected = b.id === selectedId ? ' ← SELECTED' : '';
      const title = (b.props.title as string) || '';
      lines.push(`  ${i + 1}. [${b.type}] ID: ${b.id} — "${title.substring(0, 40)}"${selected}`);
    });
  }
  lines.push('');

  if (selectedId) {
    const selected = blocks.find(b => b.id === selectedId);
    if (selected) {
      lines.push(`## Selected Block`);
      lines.push(`- ID: ${selected.id}`);
      lines.push(`- Type: ${selected.type}`);
      lines.push(`- Props: ${JSON.stringify(selected.props, null, 2).substring(0, 500)}`);
      lines.push('');
    }
  }

  lines.push(`## Available Widget Types`);
  const categories = new Map<string, string[]>();
  WIDGET_REGISTRY.forEach(w => {
    const cat = categories.get(w.category) || [];
    cat.push(`${w.type} (${w.label})`);
    categories.set(w.category, cat);
  });
  categories.forEach((widgets, cat) => {
    lines.push(`  ### ${cat}: ${widgets.join(', ')}`);
  });
  lines.push('');

  lines.push(`## Available Templates`);
  PAGE_TEMPLATES.forEach(t => {
    lines.push(`  - ${t.id}: ${t.name} — ${t.description}`);
  });
  lines.push('');

  lines.push(`## Animation Options`);
  lines.push(`  Entrance: fadeIn, fadeInUp, fadeInDown, fadeInLeft, fadeInRight, zoomIn, rotateIn, scaleIn, bounceIn, elasticIn`);
  lines.push(`  Loop: pulse, float, spin, wiggle, swing, tada, bounce`);
  lines.push(`  Engine: gsap, anime`);
  lines.push(`  Props: animationType, animationDuration (ms), animationDelay (ms), loopAnimation, animationEngine`);

  return lines.join('\n');
}

export default useBuilderAI;
