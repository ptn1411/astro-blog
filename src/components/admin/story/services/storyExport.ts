import type { Story, StorySlide } from '../types';


// Parse imported story from text
export function parseImportedStoryFromText(
  text: string
): { success: true; story: Story } | { success: false; error: string } {
  try {
    const raw = JSON.parse(text) as unknown;
    if (!raw || typeof raw !== 'object') return { success: false, error: 'JSON must be an object' };

    const obj = raw as Partial<Story>;
    if (!obj.title || typeof obj.title !== 'string')
      return { success: false, error: 'Missing/invalid story.title' };
    if (!Array.isArray(obj.slides) || obj.slides.length === 0)
      return { success: false, error: 'Missing/invalid story.slides' };

    const invalidSlide = obj.slides.find((s) => {
      if (!s || typeof s !== 'object') return true;
      if (!('id' in s) || typeof (s as StorySlide).id !== 'string') return true;
      if (!('duration' in s) || typeof (s as StorySlide).duration !== 'number') return true;
      if (!('background' in s) || !(s as StorySlide).background) return true;
      if (!('elements' in s) || !Array.isArray((s as StorySlide).elements)) return true;
      return false;
    });
    if (invalidSlide)
      return { success: false, error: 'Invalid slide schema (id/duration/background/elements required)' };

    const normalized: Story = {
      ...obj,
      id: `story-${Date.now()}`,
      updatedAt: new Date().toISOString(),
      createdAt: obj.createdAt || new Date().toISOString(),
      settings: obj.settings || {
        autoAdvance: true,
        loop: false,
        showProgressBar: true,
      },
    } as Story;

    return { success: true, story: normalized };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}

// Generate MDX content for story
export function generateStoryMdx(storyData: Story): string {
  const frontmatter: Record<string, unknown> = {
    id: storyData.id,
    title: storyData.title,
    slides: storyData.slides,
  };

  if (storyData.description) {
    frontmatter.description = storyData.description;
  }

  if (storyData.thumbnail) {
    frontmatter.thumbnail = storyData.thumbnail;
  }

  if (storyData.audio) {
    frontmatter.audio = storyData.audio;
  }

  if (storyData.settings) {
    frontmatter.settings = storyData.settings;
  }

  const yamlString = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (value === undefined) return '';
      return `${key}: ${JSON.stringify(value)}`;
    })
    .filter(Boolean)
    .join('\n');

  return `---
${yamlString}
---
`;
}

// Generate AI prompt for story creation
export function generateAIPrompt(topic: string): string {
  return `Bạn là AI chuyên gia tạo JSON cho Story Builder chuyên nghiệp.

Nhiệm vụ: tạo 1 object JSON theo đúng schema để hiển thị bản tin dạng story (9:16) cực kỳ sinh động và giàu nội dung.

Chủ đề: ${topic || '[NHẬP CHỦ ĐỀ Ở ĐÂY]'}

=== YÊU CẦU OUTPUT (BẮT BUỘC) ===
1) Chỉ trả về DUY NHẤT JSON (không giải thích, không markdown, không \`\`\`)
2) JSON phải parse được, không trailing comma
3) Nội dung tiếng Việt chuyên nghiệp, hấp dẫn
4) Quy mô: 3-6 slides.
5) MẬT ĐỘ NỘI DUNG: Mỗi slide PHẢI có từ 4 đến 8 elements (Text, Image, Video, Poll, Button, Sticker, etc.).
6) TƯƠNG TÁC: Ít nhất 50% số slide phải có các phần tử tương tác như Poll (bình chọn), Button (nút bấm), hoặc Slider.

=== CÁCH GẮN LINK (QUAN TRỌNG) ===
- Đối với BUTTON: Dùng object "button" bên trong element.
  Ví dụ: "button": { "href": "https://...", "target": "_blank", "variant": "solid" }
- Đối với IMAGE/STICKER/GIF/VIDEO: Nếu muốn gắn link, dùng object "link".
  Ví dụ: "link": { "url": "https://...", "target": "_blank" }

=== CÁC LOẠI ELEMENT HỖ TRỢ ===
- "text": nội dung văn bản.
- "image"/"video": "content" là URL.
- "poll": { "question": "...", "options": ["A", "B", "C"] }
- "button": { "href": "...", "target": "_blank", "variant": "solid" | "outline" | "ghost" }
- "slider"/"carousel": { "images": ["URL1", "URL2", "URL3"] }
- "list": { "type": "bullet" | "numbered" | "checklist", "items": ["...", "..."] }
- "sticker"/"gif": "content" là URL.
- "rating": { "value": 4, "max": 5, "icon": "star" | "heart" }

=== VÍ DỤ JSON MẪU CHUẨN (BẮT CHƯỚC CẤU TRÚC NÀY) ===
{
  "id": "story-standard-sample",
  "title": "Bản tin Vitamin B",
  "description": "Sức khỏe và Năng lượng",
  "settings": { "autoAdvance": true, "loop": false, "showProgressBar": true },
  "slides": [
    {
      "id": "slide-1",
      "duration": 7,
      "background": { "type": "image", "value": "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=1080" },
      "elements": [
        {
          "id": "el-overlay",
          "type": "shape",
          "shapeType": "rectangle",
          "style": { "x": 0, "y": 0, "width": 360, "height": 640, "zIndex": 1, "opacity": 0.45, "backgroundColor": "#000000" }
        },
        {
          "id": "el-title",
          "type": "text",
          "content": "VITAMIN B LÀ GÌ?",
          "style": { "x": 20, "y": 60, "width": 320, "height": 70, "zIndex": 5, "color": "#ffffff", "fontSize": 30, "fontWeight": "bold", "textAlign": "center" },
          "animation": { "enter": { "type": "fadeInDown", "duration": 700, "engine": "gsap", "gsapType": "fadeInDown" } }
        },
        {
          "id": "el-poll",
          "type": "poll",
          "poll": { "question": "Bạn đã biết về Vitamin B?", "options": ["Rồi", "Chưa", "Một chút"] },
          "style": { "x": 30, "y": 300, "width": 300, "height": 160, "zIndex": 8, "backgroundColor": "rgba(255,255,255,0.18)", "borderRadius": 16 },
          "animation": { "enter": { "type": "zoomIn", "duration": 600, "delay": 600, "engine": "gsap", "gsapType": "zoomIn" } }
        }
      ]
    }
  ]
}

=== QUY TẮC TỌA ĐỘ ===
- Canvas chuẩn: 360x640 (9:16).
- Căn lề tối thiểu 20px.
- Sắp xếp zIndex hợp lý (Text/Poll/Button nên ở lớp trên cùng).
`;
}
