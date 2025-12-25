interface Widget {
  type: string;
  label: string;
  category: string;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    arraySchema?: unknown;
  }>;
  defaultProps: Record<string, unknown>;
}

export function generateAIPrompt(widgets: Widget[], websiteDescription: string): string {
  const widgetDocs = widgets
    .map((w) => {
      const fieldsDoc = w.fields
        .map((f) => {
          let fieldInfo = `    - ${f.name} (${f.type}): ${f.label}`;
          if (f.type === 'array' && f.arraySchema) {
            fieldInfo += `\n      ArraySchema: ${JSON.stringify(f.arraySchema)}`;
          }
          return fieldInfo;
        })
        .join('\n');
      return `## ${w.type} (${w.label}) - Category: ${w.category}\n  Default Props: ${JSON.stringify(w.defaultProps, null, 2)}\n  Fields:\n${fieldsDoc}`;
    })
    .join('\n\n');

  return `Bạn là một AI chuyên gia tạo JSON cho Astro Page Builder. Tạo JSON theo đúng format dưới đây.

=== MÔ TẢ TRANG WEB CẦN TẠO ===
${websiteDescription || '[Thêm mô tả trang web của bạn ở đây]'}

=== OUTPUT FORMAT (BẮT BUỘC) ===
\`\`\`json
{
  "blocks": [
    {
      "id": "unique-id-1",
      "type": "WidgetType",
      "props": { ...widget props... }
    }
  ],
  "metadata": {
    "title": "Page Title",
    "description": "Page description for SEO"
  }
}
\`\`\`

=== DANH SÁCH WIDGETS CÓ SẴN ===

${widgetDocs}

=== ANIMATION EFFECTS (HIỆU ỨNG) ===

Hệ thống hỗ trợ 2 engine animation: GSAP và Anime.js

**Animation Engine Options:**
- "gsap" - GSAP animation library (mạnh mẽ, hiệu suất cao)
- "anime" - Anime.js library (nhẹ, dễ sử dụng)

**Entrance Animations (Hiệu ứng xuất hiện):**
- fadeIn - Mờ dần vào
- fadeInUp - Mờ dần từ dưới lên
- fadeInDown - Mờ dần từ trên xuống
- fadeInLeft - Mờ dần từ trái sang
- fadeInRight - Mờ dần từ phải sang
- zoomIn - Phóng to vào
- rotateIn - Xoay vào
- scaleIn - Scale vào (anime.js)
- bounceIn - Nảy vào (anime.js)
- elasticIn - Đàn hồi vào (anime.js)
- slideInX - Trượt ngang (anime.js)
- slideInY - Trượt dọc (anime.js)

**Loop Animations (Hiệu ứng lặp):**
- pulse - Nhịp đập
- float - Lơ lửng
- spin - Xoay tròn
- wiggle - Lắc lư
- swing - Đung đưa
- tada - Nhấn mạnh
- bounce - Nảy

**Cách sử dụng Animation trong props:**

1. Animation cho toàn widget (áp dụng cho Hero, Features, Stats, etc.):
\`\`\`json
{
  "animationEngine": "gsap",
  "animationType": "fadeInUp",
  "animationDuration": 1000,
  "animationDelay": 0,
  "loopAnimation": "pulse"
}
\`\`\`

2. Animation cho từng phần tử (Hero - title và image):
\`\`\`json
{
  "titleAnimationType": "fadeInUp",
  "titleAnimationDuration": 800,
  "titleAnimationDelay": 0,
  "imageAnimationType": "zoomIn",
  "imageAnimationDuration": 1000,
  "imageAnimationDelay": 200
}
\`\`\`

3. Animation cho items (Features, Content1):
\`\`\`json
{
  "itemAnimationType": "fadeInUp",
  "itemAnimationDuration": 600,
  "itemAnimationDelay": 100
}
\`\`\`

=== QUY TẮC ===
1. Mỗi block phải có: id (unique string), type (từ danh sách trên), props (theo defaultProps)
2. Sử dụng icon format: "tabler:icon-name" (ví dụ: tabler:check, tabler:star, tabler:rocket)
3. Image URLs có thể dùng Unsplash: https://images.unsplash.com/photo-xxx
4. Đảm bảo JSON valid, không có trailing comma
5. Tạo nội dung phù hợp với mô tả trang web
6. Thêm animation effects để trang web sinh động hơn

=== VÍ DỤ MẪU ===
\`\`\`json
{
  "blocks": [
    {
      "id": "hero-1",
      "type": "Hero",
      "props": {
        "title": "Welcome to Our Site",
        "subtitle": "Build amazing things",
        "tagline": "Hello",
        "actions": [{ "variant": "primary", "text": "Get Started", "href": "#" }],
        "titleAnimationType": "fadeInUp",
        "titleAnimationDuration": 800,
        "imageAnimationType": "zoomIn",
        "imageAnimationDuration": 1000,
        "imageAnimationDelay": 200
      }
    },
    {
      "id": "features-1",
      "type": "Features",
      "props": {
        "title": "Our Features",
        "items": [
          { "title": "Fast", "description": "Lightning speed", "icon": "tabler:rocket" },
          { "title": "Secure", "description": "Bank-level security", "icon": "tabler:shield-check" }
        ],
        "itemAnimationType": "fadeInUp",
        "itemAnimationDuration": 600,
        "itemAnimationDelay": 100
      }
    },
    {
      "id": "stats-1",
      "type": "Stats",
      "props": {
        "title": "Our Impact",
        "stats": [
          { "title": "Users", "amount": "50K+", "icon": "tabler:users" },
          { "title": "Downloads", "amount": "100K+", "icon": "tabler:download" },
          { "title": "Countries", "amount": "30+", "icon": "tabler:world" }
        ],
        "animationEngine": "gsap",
        "animationType": "fadeIn",
        "animationDuration": 800
      }
    },
    {
      "id": "testimonials-1",
      "type": "Testimonials",
      "props": {
        "title": "What Clients Say",
        "testimonials": [
          { "name": "John Doe", "job": "CEO", "testimonial": "Amazing product!", "image": { "src": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300", "alt": "John" } }
        ],
        "animationEngine": "anime",
        "animationType": "bounceIn",
        "animationDuration": 1000
      }
    },
    {
      "id": "pricing-1",
      "type": "Pricing",
      "props": {
        "title": "Simple Pricing",
        "prices": [
          { "title": "Basic", "price": 29, "period": "/month", "items": [{ "description": "Feature 1" }, { "description": "Feature 2" }], "callToAction": { "text": "Start Free", "href": "#" } },
          { "title": "Pro", "price": 99, "period": "/month", "hasRibbon": true, "ribbonTitle": "Popular", "items": [{ "description": "All Basic features" }, { "description": "Priority support" }], "callToAction": { "text": "Get Started", "href": "#" } }
        ],
        "animationType": "fadeInUp",
        "animationDuration": 800
      }
    },
    {
      "id": "team-1",
      "type": "Team",
      "props": {
        "title": "Our Team",
        "members": [
          { "name": "Jane Smith", "role": "Founder", "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300", "bio": "Visionary leader" }
        ],
        "animationType": "zoomIn",
        "animationDuration": 700
      }
    },
    {
      "id": "timeline-1",
      "type": "Timeline",
      "props": {
        "title": "Our Journey",
        "items": [
          { "year": "2020", "title": "Founded", "description": "Started the company", "icon": "tabler:rocket" },
          { "year": "2023", "title": "Growth", "description": "Reached 50K users", "icon": "tabler:trending-up" }
        ],
        "animationType": "fadeInLeft",
        "animationDuration": 600
      }
    },
    {
      "id": "faq-1",
      "type": "FAQs",
      "props": {
        "title": "FAQ",
        "items": [
          { "title": "How does it work?", "description": "Simply sign up and start using our platform." },
          { "title": "Is there a free trial?", "description": "Yes, 14 days free trial for all plans." }
        ],
        "animationType": "fadeIn",
        "animationDuration": 500
      }
    },
    {
      "id": "cta-1",
      "type": "CallToAction",
      "props": {
        "title": "Ready to Start?",
        "subtitle": "Join thousands of happy customers",
        "actions": [{ "variant": "primary", "text": "Get Started Free", "href": "#" }],
        "animationType": "fadeInUp",
        "animationDuration": 800,
        "loopAnimation": "pulse"
      }
    }
  ],
  "metadata": {
    "title": "My Website",
    "description": "A great website"
  }
}
\`\`\`

=== THÊM VÍ DỤ WIDGETS PHỔ BIẾN ===

Banner với animation:
\`\`\`json
{ "id": "banner-1", "type": "Banner", "props": { "title": "Sale 50% Off", "subtitle": "Limited time offer", "image": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200", "callToAction": { "text": "Shop Now", "href": "#" }, "variant": "gradient", "animationType": "fadeIn", "animationDuration": 1000 } }
\`\`\`

Cards với animation:
\`\`\`json
{ "id": "cards-1", "type": "Cards", "props": { "title": "Services", "columns": 3, "cards": [{ "title": "Web Dev", "description": "Modern websites", "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400", "link": "#" }], "animationType": "fadeInUp", "animationDuration": 600, "animationDelay": 100 } }
\`\`\`

Gallery với animation:
\`\`\`json
{ "id": "gallery-1", "type": "Gallery", "props": { "title": "Portfolio", "columns": 3, "images": [{ "src": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600", "alt": "Project 1" }], "animationType": "zoomIn", "animationDuration": 500 } }
\`\`\`

Newsletter với animation:
\`\`\`json
{ "id": "newsletter-1", "type": "Newsletter", "props": { "title": "Subscribe", "subtitle": "Get updates", "placeholder": "Your email", "buttonText": "Subscribe", "animationType": "fadeInUp", "animationDuration": 700 } }
\`\`\`

SocialLinks với animation:
\`\`\`json
{ "id": "social-1", "type": "SocialLinks", "props": { "title": "Follow Us", "style": "icons", "links": [{ "platform": "facebook", "url": "#", "icon": "tabler:brand-facebook" }, { "platform": "twitter", "url": "#", "icon": "tabler:brand-twitter" }], "animationType": "bounceIn", "animationEngine": "anime", "animationDuration": 800 } }
\`\`\`

Contact với animation:
\`\`\`json
{ "id": "contact-1", "type": "Contact", "props": { "title": "Contact Us", "inputs": [{ "type": "text", "name": "name", "label": "Name" }, { "type": "email", "name": "email", "label": "Email" }], "textarea": { "label": "Message" }, "button": "Send", "animationType": "fadeIn", "animationDuration": 600 } }
\`\`\`

EffectsWidget (Widget chuyên về hiệu ứng):
\`\`\`json
{ "id": "effects-1", "type": "EffectsWidget", "props": { "title": "Animation Showcase", "subtitle": "See our effects in action", "items": [{ "title": "Fade Effect", "animation": "fadeIn", "engine": "gsap" }, { "title": "Bounce Effect", "animation": "bounceIn", "engine": "anime" }, { "title": "Rotate Effect", "animation": "rotateIn", "engine": "gsap" }] } }
\`\`\`

Hãy tạo JSON hoàn chỉnh cho trang web theo mô tả trên, nhớ thêm các hiệu ứng animation phù hợp để trang web sinh động và chuyên nghiệp hơn.`;
}
