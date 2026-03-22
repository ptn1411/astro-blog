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
