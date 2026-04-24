import type { Story, StorySlide } from '../types';

// Parse imported story from text
export function parseImportedStoryFromText(
  text: string
): { success: true; story: Story } | { success: false; error: string } {
  try {
    const raw = JSON.parse(text) as unknown;
    if (!raw || typeof raw !== 'object') return { success: false, error: 'JSON must be an object' };

    const obj = raw as Partial<Story>;
    if (!obj.title || typeof obj.title !== 'string') return { success: false, error: 'Missing/invalid story.title' };
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
export function extractJsonFromMarkdown(response: string): string {
  return response
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export function parseAIStoryResponse(response: string) {
  const jsonText = extractJsonFromMarkdown(response);
  return JSON.parse(jsonText);
}
// Generate AI prompt for story creation
export function generateAIPrompt(topic: string): string {
  return `Bạn là AI chuyên gia tạo JSON cho Story Builder chuyên nghiệp.

Nhiệm vụ: tạo 1 object JSON theo đúng schema để hiển thị bản tin dạng story 9:16 sinh động, giàu nội dung.

Chủ đề: ${topic || '[NHẬP CHỦ ĐỀ Ở ĐÂY]'}

=== YÊU CẦU OUTPUT BẮT BUỘC ===
Bạn PHẢI trả về JSON hợp lệ bên trong markdown code block để người dùng dễ copy.

Định dạng trả về BẮT BUỘC:

\`\`\`json
{
  "id": "story-example",
  "title": "Tiêu đề story",
  "description": "Mô tả ngắn",
  "settings": {
    "autoAdvance": true,
    "loop": false,
    "showProgressBar": true
  },
  "slides": []
}
\`\`\`

KHÔNG được trả về:
- Không giải thích bên ngoài code block
- Không ghi chú
- Không thêm câu mở đầu như "Dưới đây là JSON..."
- Không thêm nội dung nào trước hoặc sau markdown code block
- Không trailing comma
- Không comment trong JSON
- Không dùng undefined, NaN, Infinity
- Không dùng single quote
- Tất cả key và string phải dùng double quote

JSON bên trong code block phải parse được sau khi loại bỏ markdown wrapper.

=== YÊU CẦU NỘI DUNG ===
1) Nội dung tiếng Việt chuyên nghiệp, hấp dẫn.
2) Quy mô: từ 3 đến 6 slides.
3) Mỗi slide PHẢI có từ 4 đến 8 elements.
4) Ít nhất 50% số slide phải có phần tử tương tác như:
   - poll
   - button
   - slider
   - carousel
   - rating
5) Story phải có tiêu đề, mô tả, settings và slides.
6) Mỗi element phải có id, type, style.
7) Mỗi slide phải có id, duration, background, elements.
8) Canvas chuẩn là 360x640.

=== CÁCH GẮN LINK ===
Đối với BUTTON:
Dùng object "button" bên trong element.

Ví dụ:
{
  "id": "el-button",
  "type": "button",
  "content": "Xem thêm",
  "button": {
    "href": "https://example.com",
    "target": "_blank",
    "variant": "solid"
  },
  "style": {
    "x": 40,
    "y": 520,
    "width": 280,
    "height": 48,
    "zIndex": 10
  }
}

Đối với IMAGE, STICKER, GIF, VIDEO:
Nếu muốn gắn link, dùng object "link".

Ví dụ:
{
  "id": "el-image",
  "type": "image",
  "content": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1080",
  "link": {
    "url": "https://example.com",
    "target": "_blank"
  },
  "style": {
    "x": 20,
    "y": 120,
    "width": 320,
    "height": 180,
    "zIndex": 4
  }
}

=== CÁC LOẠI ELEMENT HỖ TRỢ ===
- "text": nội dung văn bản.
- "image": "content" là URL hình ảnh.
- "video": "content" là URL video.
- "poll": dùng object "poll".
- "button": dùng object "button".
- "slider": dùng object "slider" với danh sách images.
- "carousel": dùng object "carousel" với danh sách images.
- "list": dùng object "list".
- "sticker": "content" là URL sticker.
- "gif": "content" là URL gif.
- "rating": dùng object "rating".
- "shape": dùng "shapeType".

=== QUY TẮC STYLE ===
Mỗi element phải có style theo mẫu:

{
  "x": 20,
  "y": 80,
  "width": 320,
  "height": 80,
  "zIndex": 5
}

Có thể thêm:
- color
- backgroundColor
- fontSize
- fontWeight
- textAlign
- borderRadius
- opacity
- padding
- border
- boxShadow

=== QUY TẮC TỌA ĐỘ ===
- Canvas chuẩn: 360x640.
- Căn lề tối thiểu 20px.
- Không đặt text sát mép.
- Text, poll, button phải có zIndex cao hơn overlay/background.
- Không để các element chính chồng chéo khó đọc.
- Mỗi slide nên có overlay tối hoặc gradient nếu background là ảnh.

=== QUY TẮC HÌNH ẢNH ===
- Dùng URL ảnh hợp lệ từ Unsplash.
- URL nên có tham số ?w=1080 hoặc &w=1080.
- Không dùng placeholder text như "image_url_here".
- Không dùng URL rỗng.

=== QUY TẮC ANIMATION ===
Mỗi slide nên có ít nhất 2 element có animation.

Ví dụ:
{
  "animation": {
    "enter": {
      "type": "fadeInUp",
      "duration": 700,
      "delay": 200,
      "engine": "gsap",
      "gsapType": "fadeInUp"
    }
  }
}

Các animation hợp lệ:
- fadeIn
- fadeInUp
- fadeInDown
- fadeInLeft
- fadeInRight
- zoomIn
- bounceIn
- slideInUp
- slideInDown

=== SCHEMA JSON BẮT BUỘC ===
JSON bên trong markdown code block phải có cấu trúc:

{
  "id": "story-[slug]",
  "title": "Tiêu đề story",
  "description": "Mô tả ngắn",
  "settings": {
    "autoAdvance": true,
    "loop": false,
    "showProgressBar": true
  },
  "slides": [
    {
      "id": "slide-1",
      "duration": 7,
      "background": {
        "type": "image",
        "value": "https://images.unsplash.com/..."
      },
      "elements": []
    }
  ]
}

=== VÍ DỤ JSON MẪU ===
\`\`\`json
{
  "id": "story-standard-sample",
  "title": "Bản tin Vitamin B",
  "description": "Sức khỏe và năng lượng mỗi ngày",
  "settings": {
    "autoAdvance": true,
    "loop": false,
    "showProgressBar": true
  },
  "slides": [
    {
      "id": "slide-1",
      "duration": 7,
      "background": {
        "type": "image",
        "value": "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=1080"
      },
      "elements": [
        {
          "id": "el-overlay",
          "type": "shape",
          "shapeType": "rectangle",
          "style": {
            "x": 0,
            "y": 0,
            "width": 360,
            "height": 640,
            "zIndex": 1,
            "opacity": 0.45,
            "backgroundColor": "#000000"
          }
        },
        {
          "id": "el-title",
          "type": "text",
          "content": "VITAMIN B LÀ GÌ?",
          "style": {
            "x": 20,
            "y": 60,
            "width": 320,
            "height": 70,
            "zIndex": 5,
            "color": "#ffffff",
            "fontSize": 30,
            "fontWeight": "bold",
            "textAlign": "center"
          },
          "animation": {
            "enter": {
              "type": "fadeInDown",
              "duration": 700,
              "engine": "gsap",
              "gsapType": "fadeInDown"
            }
          }
        },
        {
          "id": "el-poll",
          "type": "poll",
          "poll": {
            "question": "Bạn đã biết về Vitamin B?",
            "options": ["Rồi", "Chưa", "Một chút"]
          },
          "style": {
            "x": 30,
            "y": 300,
            "width": 300,
            "height": 160,
            "zIndex": 8,
            "backgroundColor": "rgba(255,255,255,0.18)",
            "borderRadius": 16
          },
          "animation": {
            "enter": {
              "type": "zoomIn",
              "duration": 600,
              "delay": 600,
              "engine": "gsap",
              "gsapType": "zoomIn"
            }
          }
        },
        {
          "id": "el-button",
          "type": "button",
          "content": "Tìm hiểu thêm",
          "button": {
            "href": "https://example.com",
            "target": "_blank",
            "variant": "solid"
          },
          "style": {
            "x": 40,
            "y": 520,
            "width": 280,
            "height": 48,
            "zIndex": 10,
            "backgroundColor": "#ffffff",
            "color": "#111111",
            "borderRadius": 24,
            "fontSize": 16,
            "fontWeight": "bold",
            "textAlign": "center"
          },
          "animation": {
            "enter": {
              "type": "fadeInUp",
              "duration": 700,
              "delay": 900,
              "engine": "gsap",
              "gsapType": "fadeInUp"
            }
          }
        }
      ]
    }
  ]
}
\`\`\`

=== YÊU CẦU CUỐI CÙNG ===
Chỉ trả về đúng 1 markdown code block có ngôn ngữ là json.

Response phải bắt đầu bằng:
\`\`\`json

Response phải kết thúc bằng:
\`\`\`

Không được thêm bất kỳ nội dung nào bên ngoài code block.`;
}
