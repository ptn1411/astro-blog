import type { Story } from '../types';

// Parse MDX frontmatter to Story object
export function parseMdxToStory(mdxContent: string): Story | null {
  try {
    // Extract frontmatter between --- markers
    const frontmatterMatch = mdxContent.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    const frontmatter = frontmatterMatch[1];

    // Parse YAML-like frontmatter
    const parseValue = (value: string): unknown => {
      value = value.trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
      }
      // Try to parse as JSON (for arrays/objects)
      if (value.startsWith('[') || value.startsWith('{')) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      // Boolean
      if (value === 'true') return true;
      if (value === 'false') return false;
      // Number
      if (!isNaN(Number(value)) && value !== '') return Number(value);
      return value;
    };

    const result: Record<string, unknown> = {};
    const lines = frontmatter.split('\n');

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();

      if (key && value) {
        result[key] = parseValue(value);
      }
    }

    // Validate required fields
    if (!result.id || !result.slides) return null;

    return {
      id: result.id as string,
      title: (result.title as string) || 'Untitled Story',
      description: result.description as string | undefined,
      thumbnail: result.thumbnail as string | undefined,
      slides: result.slides as Story['slides'],
      audio: result.audio as Story['audio'],
      createdAt: result.createdAt as string | undefined,
      updatedAt: result.updatedAt as string | undefined,
      settings: result.settings as Story['settings'],
    };
  } catch (e) {
    console.error('Failed to parse MDX frontmatter:', e);
    return null;
  }
}

// Generate thumbnail from story
export function generateThumbnail(story: Story): string {
  const firstSlide = story.slides[0];
  if (firstSlide?.background.type === 'image' && firstSlide.background.value) {
    return firstSlide.background.value;
  } else if (firstSlide?.background.type === 'color') {
    return firstSlide.background.value;
  } else if (firstSlide?.background.type === 'gradient' && firstSlide.background.gradient) {
    const colors = firstSlide.background.gradient.colors.map((c) => c.color).join(', ');
    return `linear-gradient(135deg, ${colors})`;
  }
  return '#1e293b';
}
