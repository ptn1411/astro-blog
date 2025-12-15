import {
  ArrowRight,
  AtSign,
  BarChart3,
  CheckCircle2,
  Circle,
  Cloud,
  Code2,
  Diamond,
  Divide,
  Hash,
  Heart,
  Hexagon,
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  List,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Moon,
  MousePointerClick,
  Music,
  Octagon,
  Pentagon,
  Play,
  Plus,
  QrCode,
  Quote,
  Search,
  SlidersHorizontal,
  Square,
  Star,
  Sticker,
  Sun,
  Timer,
  Triangle,
  Type,
  User,
  Video,
  Wand2,
  Zap,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { uploadMediaLocally } from '~/utils/media';
import { GiphyPanel } from './GiphyPanel';
import type { ElementType, ShapeType, StoryTemplate } from './types';

interface ResourcePanelProps {
  onAddElement: (type: ElementType, content: string, extra?: Record<string, unknown>) => void;
  onApplyTemplate?: (template: StoryTemplate) => void;
}

type TabType = 'elements' | 'shapes' | 'stickers' | 'gifs' | 'templates' | 'audio' | 'interactive' | 'social';

// Shape definitions
const SHAPES: { type: ShapeType; icon: React.ReactNode; label: string }[] = [
  // Basic shapes
  { type: 'rectangle', icon: <Square size={24} />, label: 'Rectangle' },
  { type: 'circle', icon: <Circle size={24} />, label: 'Circle' },
  { type: 'triangle', icon: <Triangle size={24} />, label: 'Triangle' },
  { type: 'diamond', icon: <Diamond size={24} />, label: 'Diamond' },
  // Polygons
  { type: 'pentagon', icon: <Pentagon size={24} />, label: 'Pentagon' },
  { type: 'hexagon', icon: <Hexagon size={24} />, label: 'Hexagon' },
  { type: 'octagon', icon: <Octagon size={24} />, label: 'Octagon' },
  // Special shapes
  { type: 'star', icon: <Star size={24} />, label: 'Star' },
  { type: 'heart', icon: <Heart size={24} />, label: 'Heart' },
  { type: 'arrow', icon: <ArrowRight size={24} />, label: 'Arrow' },
  { type: 'plus', icon: <Plus size={24} />, label: 'Plus' },
  { type: 'cross', icon: <Zap size={24} />, label: 'Cross' },
  // Lines
  { type: 'line', icon: <Minus size={24} />, label: 'Line' },
  { type: 'chevron', icon: <span className="text-lg">›</span>, label: 'Chevron' },
  // Bubbles
  { type: 'speech-bubble', icon: <MessageCircle size={24} />, label: 'Speech' },
  { type: 'badge', icon: <span className="text-lg">⬡</span>, label: 'Badge' },
  // Advanced
  { type: 'parallelogram', icon: <span className="text-lg skew-x-12">▬</span>, label: 'Slant' },
  { type: 'trapezoid', icon: <span className="text-lg">⏢</span>, label: 'Trapezoid' },
  { type: 'explosion', icon: <span className="text-lg">💥</span>, label: 'Burst' },
  { type: 'wave', icon: <span className="text-lg">〰</span>, label: 'Wave' },
  // New shapes
  { type: 'squircle', icon: <span className="text-lg">⬜</span>, label: 'Squircle' },
  { type: 'pill', icon: <span className="text-lg">💊</span>, label: 'Pill' },
  { type: 'ring', icon: <span className="text-lg">◯</span>, label: 'Ring' },
  { type: 'blob', icon: <span className="text-lg">🫧</span>, label: 'Blob' },
  { type: 'cloud', icon: <Cloud size={24} />, label: 'Cloud' },
  { type: 'lightning', icon: <Zap size={24} />, label: 'Lightning' },
  { type: 'moon', icon: <Moon size={24} />, label: 'Moon' },
  { type: 'sun', icon: <Sun size={24} />, label: 'Sun' },
  { type: 'check', icon: <span className="text-lg">✓</span>, label: 'Check' },
  { type: 'x-mark', icon: <span className="text-lg">✕</span>, label: 'X Mark' },
  { type: 'bracket', icon: <span className="text-lg">[</span>, label: 'Bracket' },
  { type: 'cursor', icon: <span className="text-lg">▶</span>, label: 'Cursor' },
];

// Built-in stickers (emoji-based for demo)
const STICKERS = [
  '🔥',
  '⭐',
  '❤️',
  '👍',
  '🎉',
  '✨',
  '💯',
  '🚀',
  '😊',
  '😂',
  '🥰',
  '😎',
  '🤔',
  '👀',
  '💪',
  '🙌',
  '🎵',
  '🎨',
  '📸',
  '💡',
  '🏆',
  '🎯',
  '💥',
  '🌟',
  '🍕',
  '🍔',
  '☕',
  '🍩',
  '🎂',
  '🍦',
  '🥤',
  '🧁',
  // New stickers
  '🎬',
  '📱',
  '💻',
  '🎮',
  '🎸',
  '🎤',
  '📷',
  '🖼️',
  '🎁',
  '💎',
  '👑',
  '🦋',
  '🌈',
  '☀️',
  '🌙',
  '⚡',
  '💫',
  '🔔',
  '❗',
  '❓',
  '✅',
  '❌',
  '➡️',
  '⬅️',
  '⬆️',
  '⬇️',
  '🔗',
  '📍',
  '🏠',
  '💼',
  '📚',
  '✏️',
  '🎓',
  '💰',
];

// More decorative stickers
const DECORATIVE_STICKERS = [
  { emoji: '✦', label: 'Sparkle' },
  { emoji: '◆', label: 'Diamond' },
  { emoji: '●', label: 'Circle' },
  { emoji: '■', label: 'Square' },
  { emoji: '▲', label: 'Triangle' },
  { emoji: '★', label: 'Star' },
  { emoji: '♥', label: 'Heart' },
  { emoji: '♦', label: 'Diamond 2' },
  { emoji: '♠', label: 'Spade' },
  { emoji: '♣', label: 'Club' },
  { emoji: '→', label: 'Arrow Right' },
  { emoji: '←', label: 'Arrow Left' },
  { emoji: '↑', label: 'Arrow Up' },
  { emoji: '↓', label: 'Arrow Down' },
  { emoji: '•', label: 'Bullet' },
  { emoji: '○', label: 'Ring' },
];

// Demo templates
const DEMO_TEMPLATES: StoryTemplate[] = [
  {
    id: 'template-1',
    name: 'Gradient Hero',
    category: 'Marketing',
    thumbnail: '',
    story: {
      slides: [
        {
          id: 'tpl-slide-1',
          duration: 5,
          background: {
            type: 'gradient',
            value: '',
            gradient: {
              type: 'linear',
              angle: 135,
              colors: [
                { color: '#667eea', position: 0 },
                { color: '#764ba2', position: 100 },
              ],
            },
          },
          elements: [
            {
              id: 'tpl-el-1',
              type: 'text',
              content: 'Your Title Here',
              style: {
                x: 30,
                y: 250,
                width: 300,
                height: 100,
                rotation: 0,
                zIndex: 1,
                opacity: 1,
                color: '#ffffff',
                fontSize: 36,
                fontWeight: 'bold',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'slideInUp', duration: 600, delay: 0, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-2',
              type: 'text',
              content: 'Subtitle goes here',
              style: {
                x: 60,
                y: 350,
                width: 240,
                height: 50,
                rotation: 0,
                zIndex: 1,
                opacity: 0.8,
                color: '#ffffff',
                fontSize: 18,
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'fadeIn', duration: 500, delay: 300, easing: 'ease-out' },
              },
            },
          ],
          transition: { type: 'fade', duration: 500 },
        },
      ],
      settings: { autoAdvance: true, loop: false, showProgressBar: true },
    },
  },
  {
    id: 'template-2',
    name: 'Minimal Quote',
    category: 'Social',
    thumbnail: '',
    story: {
      slides: [
        {
          id: 'tpl-slide-1',
          duration: 7,
          background: { type: 'color', value: '#0f172a' },
          elements: [
            {
              id: 'tpl-el-1',
              type: 'text',
              content: '"Your inspiring quote goes here"',
              style: {
                x: 30,
                y: 200,
                width: 300,
                height: 200,
                rotation: 0,
                zIndex: 1,
                opacity: 1,
                color: '#ffffff',
                fontSize: 28,
                fontWeight: 'medium',
                textAlign: 'center',
                lineHeight: 1.5,
              },
              animation: {
                enter: { type: 'fadeIn', duration: 1000, delay: 0, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-2',
              type: 'text',
              content: '— Author Name',
              style: {
                x: 100,
                y: 420,
                width: 160,
                height: 30,
                rotation: 0,
                zIndex: 1,
                opacity: 0.6,
                color: '#ffffff',
                fontSize: 14,
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'fadeIn', duration: 500, delay: 800, easing: 'ease-out' },
              },
            },
          ],
          transition: { type: 'fade', duration: 500 },
        },
      ],
      settings: { autoAdvance: true, loop: false, showProgressBar: true },
    },
  },
  {
    id: 'template-3',
    name: 'Product Showcase',
    category: 'E-commerce',
    thumbnail: '',
    story: {
      slides: [
        {
          id: 'tpl-slide-1',
          duration: 5,
          background: {
            type: 'gradient',
            value: '',
            gradient: {
              type: 'linear',
              angle: 180,
              colors: [
                { color: '#1e293b', position: 0 },
                { color: '#0f172a', position: 100 },
              ],
            },
          },
          elements: [
            {
              id: 'tpl-el-1',
              type: 'text',
              content: '🔥 NEW',
              style: {
                x: 130,
                y: 100,
                width: 100,
                height: 40,
                rotation: 0,
                zIndex: 2,
                opacity: 1,
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#ef4444',
                borderRadius: 20,
              },
              animation: {
                enter: { type: 'scaleIn', duration: 400, delay: 0, easing: 'spring' },
              },
            },
            {
              id: 'tpl-el-2',
              type: 'text',
              content: 'Product Name',
              style: {
                x: 30,
                y: 400,
                width: 300,
                height: 50,
                rotation: 0,
                zIndex: 1,
                opacity: 1,
                color: '#ffffff',
                fontSize: 28,
                fontWeight: 'bold',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'slideInUp', duration: 500, delay: 200, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-3',
              type: 'text',
              content: '$99.99',
              style: {
                x: 130,
                y: 460,
                width: 100,
                height: 40,
                rotation: 0,
                zIndex: 1,
                opacity: 1,
                color: '#10b981',
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'fadeIn', duration: 500, delay: 500, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-4',
              type: 'text',
              content: 'SWIPE UP TO BUY →',
              style: {
                x: 80,
                y: 560,
                width: 200,
                height: 30,
                rotation: 0,
                zIndex: 1,
                opacity: 0.8,
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 'medium',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'fadeIn', duration: 500, delay: 800, easing: 'ease-out' },
                loop: { type: 'pulse', duration: 1500, delay: 0, easing: 'ease-in-out' },
              },
            },
          ],
          transition: { type: 'slide', duration: 600 },
        },
      ],
      settings: { autoAdvance: true, loop: false, showProgressBar: true },
    },
  },
  {
    id: 'template-4',
    name: 'Big Announcement',
    category: 'Marketing',
    thumbnail: '',
    story: {
      slides: [
        {
          id: 'tpl-slide-1',
          duration: 6,
          background: {
            type: 'gradient',
            value: '',
            gradient: {
              type: 'radial',
              colors: [
                { color: '#f59e0b', position: 0 },
                { color: '#d97706', position: 100 },
              ],
            },
          },
          elements: [
            {
              id: 'tpl-el-1',
              type: 'text',
              content: '⚡',
              style: {
                x: 150,
                y: 150,
                width: 60,
                height: 60,
                rotation: 0,
                zIndex: 3,
                opacity: 1,
                fontSize: 48,
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'bounce', duration: 800, delay: 0, easing: 'spring' },
                loop: { type: 'pulse', duration: 2000, delay: 0, easing: 'ease-in-out' },
              },
            },
            {
              id: 'tpl-el-2',
              type: 'text',
              content: 'BIG NEWS!',
              style: {
                x: 40,
                y: 280,
                width: 280,
                height: 70,
                rotation: -3,
                zIndex: 2,
                opacity: 1,
                color: '#ffffff',
                fontSize: 48,
                fontWeight: 'black',
                textAlign: 'center',
                textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
              },
              animation: {
                enter: { type: 'shake', duration: 600, delay: 300, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-3',
              type: 'text',
              content: 'Something amazing is coming...',
              style: {
                x: 50,
                y: 380,
                width: 260,
                height: 40,
                rotation: 0,
                zIndex: 1,
                opacity: 0.95,
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 'medium',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'fadeInUp', duration: 700, delay: 600, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-4',
              type: 'text',
              content: 'STAY TUNED',
              style: {
                x: 90,
                y: 500,
                width: 180,
                height: 45,
                rotation: 0,
                zIndex: 2,
                opacity: 1,
                color: '#1f2937',
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: 25,
              },
              animation: {
                enter: { type: 'scaleIn', duration: 500, delay: 900, easing: 'spring' },
                loop: { type: 'bounce', duration: 2000, delay: 500, easing: 'ease-in-out' },
              },
            },
          ],
          transition: { type: 'zoom', duration: 700 },
        },
      ],
      settings: { autoAdvance: true, loop: false, showProgressBar: true },
    },
  },
  {
    id: 'template-5',
    name: 'Photo Reveal',
    category: 'Social',
    thumbnail: '',
    story: {
      slides: [
        {
          id: 'tpl-slide-1',
          duration: 5,
          background: { type: 'color', value: '#18181b' },
          elements: [
            {
              id: 'tpl-el-1',
              type: 'shape',
              content: '',
              style: {
                x: 30,
                y: 150,
                width: 300,
                height: 300,
                rotation: 0,
                zIndex: 1,
                opacity: 0.3,
                backgroundColor: '#3b82f6',
                borderRadius: 20,
              },
              shapeType: 'rectangle',
              animation: {
                enter: { type: 'rotate', duration: 1000, delay: 0, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-2',
              type: 'text',
              content: '📸 Photo',
              style: {
                x: 80,
                y: 260,
                width: 200,
                height: 80,
                rotation: 0,
                zIndex: 2,
                opacity: 1,
                color: '#ffffff',
                fontSize: 32,
                fontWeight: 'bold',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'zoomIn', duration: 800, delay: 500, easing: 'spring' },
              },
            },
            {
              id: 'tpl-el-3',
              type: 'text',
              content: 'Your caption here',
              style: {
                x: 60,
                y: 480,
                width: 240,
                height: 40,
                rotation: 0,
                zIndex: 2,
                opacity: 0.9,
                color: '#e5e7eb',
                fontSize: 16,
                fontWeight: 'normal',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'slideInLeft', duration: 600, delay: 1000, easing: 'ease-out' },
              },
            },
          ],
          transition: { type: 'fade', duration: 500 },
        },
      ],
      settings: { autoAdvance: true, loop: false, showProgressBar: true },
    },
  },
  {
    id: 'template-6',
    name: 'Call to Action',
    category: 'Marketing',
    thumbnail: '',
    story: {
      slides: [
        {
          id: 'tpl-slide-1',
          duration: 6,
          background: {
            type: 'gradient',
            value: '',
            gradient: {
              type: 'linear',
              angle: 45,
              colors: [
                { color: '#10b981', position: 0 },
                { color: '#059669', position: 100 },
              ],
            },
          },
          elements: [
            {
              id: 'tpl-el-1',
              type: 'text',
              content: 'LIMITED TIME',
              style: {
                x: 80,
                y: 120,
                width: 200,
                height: 35,
                rotation: 0,
                zIndex: 2,
                opacity: 1,
                color: '#fef3c7',
                fontSize: 14,
                fontWeight: 'bold',
                textAlign: 'center',
                letterSpacing: 2,
              },
              animation: {
                enter: { type: 'slideInDown', duration: 500, delay: 0, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-2',
              type: 'text',
              content: '50% OFF',
              style: {
                x: 40,
                y: 200,
                width: 280,
                height: 90,
                rotation: 0,
                zIndex: 3,
                opacity: 1,
                color: '#ffffff',
                fontSize: 56,
                fontWeight: 'black',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'scaleIn', duration: 700, delay: 200, easing: 'spring' },
                loop: { type: 'pulse', duration: 2000, delay: 0, easing: 'ease-in-out' },
              },
            },
            {
              id: 'tpl-el-3',
              type: 'text',
              content: 'All Products',
              style: {
                x: 90,
                y: 310,
                width: 180,
                height: 40,
                rotation: 0,
                zIndex: 1,
                opacity: 0.95,
                color: '#ffffff',
                fontSize: 20,
                fontWeight: 'medium',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'fadeIn', duration: 600, delay: 500, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-4',
              type: 'shape',
              content: '',
              style: {
                x: 280,
                y: 150,
                width: 60,
                height: 60,
                rotation: 15,
                zIndex: 1,
                opacity: 0.2,
                backgroundColor: '#fbbf24',
              },
              shapeType: 'star',
              animation: {
                enter: { type: 'rotate', duration: 1000, delay: 300, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-5',
              type: 'text',
              content: 'SHOP NOW →',
              style: {
                x: 90,
                y: 450,
                width: 180,
                height: 55,
                rotation: 0,
                zIndex: 4,
                opacity: 1,
                color: '#059669',
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: 30,
              },
              animation: {
                enter: { type: 'slideInUp', duration: 600, delay: 800, easing: 'spring' },
                loop: { type: 'bounce', duration: 1500, delay: 500, easing: 'ease-in-out' },
              },
            },
          ],
          transition: { type: 'slide', duration: 600 },
        },
      ],
      settings: { autoAdvance: true, loop: false, showProgressBar: true },
    },
  },
  {
    id: 'template-7',
    name: 'Event Invitation',
    category: 'Social',
    thumbnail: '',
    story: {
      slides: [
        {
          id: 'tpl-slide-1',
          duration: 7,
          background: {
            type: 'gradient',
            value: '',
            gradient: {
              type: 'linear',
              angle: 180,
              colors: [
                { color: '#1e1b4b', position: 0 },
                { color: '#312e81', position: 100 },
              ],
            },
          },
          elements: [
            {
              id: 'tpl-el-1',
              type: 'text',
              content: '🎉',
              style: {
                x: 20,
                y: 80,
                width: 50,
                height: 50,
                rotation: -15,
                zIndex: 2,
                opacity: 1,
                fontSize: 40,
              },
              animation: {
                enter: { type: 'slideInLeft', duration: 600, delay: 0, easing: 'spring' },
                loop: { type: 'bounce', duration: 2000, delay: 500, easing: 'ease-in-out' },
              },
            },
            {
              id: 'tpl-el-2',
              type: 'text',
              content: '✨',
              style: {
                x: 290,
                y: 80,
                width: 50,
                height: 50,
                rotation: 15,
                zIndex: 2,
                opacity: 1,
                fontSize: 40,
              },
              animation: {
                enter: { type: 'slideInRight', duration: 600, delay: 0, easing: 'spring' },
                loop: { type: 'bounce', duration: 2000, delay: 700, easing: 'ease-in-out' },
              },
            },
            {
              id: 'tpl-el-3',
              type: 'text',
              content: "You're Invited!",
              style: {
                x: 40,
                y: 200,
                width: 280,
                height: 60,
                rotation: 0,
                zIndex: 3,
                opacity: 1,
                color: '#fbbf24',
                fontSize: 36,
                fontWeight: 'bold',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'zoomIn', duration: 800, delay: 300, easing: 'spring' },
              },
            },
            {
              id: 'tpl-el-4',
              type: 'text',
              content: 'Special Event',
              style: {
                x: 70,
                y: 280,
                width: 220,
                height: 40,
                rotation: 0,
                zIndex: 2,
                opacity: 0.9,
                color: '#e0e7ff',
                fontSize: 24,
                fontWeight: 'medium',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'fadeInDown', duration: 700, delay: 700, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-5',
              type: 'text',
              content: '📅 Saturday, 8 PM',
              style: {
                x: 70,
                y: 360,
                width: 220,
                height: 35,
                rotation: 0,
                zIndex: 1,
                opacity: 0.85,
                color: '#c7d2fe',
                fontSize: 16,
                fontWeight: 'normal',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'slideInUp', duration: 600, delay: 1000, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-6',
              type: 'text',
              content: 'RSVP',
              style: {
                x: 120,
                y: 480,
                width: 120,
                height: 50,
                rotation: 0,
                zIndex: 4,
                opacity: 1,
                color: '#1e1b4b',
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fbbf24',
                borderRadius: 25,
              },
              animation: {
                enter: { type: 'scaleIn', duration: 500, delay: 1300, easing: 'spring' },
                loop: { type: 'pulse', duration: 1500, delay: 0, easing: 'ease-in-out' },
              },
            },
          ],
          transition: { type: 'zoom', duration: 600 },
        },
      ],
      settings: { autoAdvance: true, loop: false, showProgressBar: true },
    },
  },
  {
    id: 'template-8',
    name: 'Testimonial',
    category: 'Social',
    thumbnail: '',
    story: {
      slides: [
        {
          id: 'tpl-slide-1',
          duration: 8,
          background: { type: 'color', value: '#f8fafc' },
          elements: [
            {
              id: 'tpl-el-1',
              type: 'shape',
              content: '',
              style: {
                x: 140,
                y: 100,
                width: 80,
                height: 80,
                rotation: 0,
                zIndex: 2,
                opacity: 1,
                backgroundColor: '#3b82f6',
              },
              shapeType: 'circle',
              animation: {
                enter: { type: 'scaleIn', duration: 600, delay: 0, easing: 'spring' },
              },
            },
            {
              id: 'tpl-el-2',
              type: 'text',
              content: '⭐⭐⭐⭐⭐',
              style: {
                x: 100,
                y: 210,
                width: 160,
                height: 30,
                rotation: 0,
                zIndex: 3,
                opacity: 1,
                fontSize: 20,
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'fadeIn', duration: 800, delay: 300, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-3',
              type: 'text',
              content: '"This product changed my life! Highly recommend to everyone."',
              style: {
                x: 40,
                y: 270,
                width: 280,
                height: 120,
                rotation: 0,
                zIndex: 2,
                opacity: 1,
                color: '#1e293b',
                fontSize: 18,
                fontWeight: 'medium',
                textAlign: 'center',
                lineHeight: 1.6,
              },
              animation: {
                enter: { type: 'fadeInUp', duration: 700, delay: 600, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-4',
              type: 'text',
              content: '— Sarah Johnson',
              style: {
                x: 90,
                y: 420,
                width: 180,
                height: 30,
                rotation: 0,
                zIndex: 1,
                opacity: 0.7,
                color: '#64748b',
                fontSize: 14,
                fontWeight: 'medium',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'slideInRight', duration: 600, delay: 1000, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-5',
              type: 'text',
              content: 'Verified Customer',
              style: {
                x: 100,
                y: 450,
                width: 160,
                height: 25,
                rotation: 0,
                zIndex: 1,
                opacity: 0.6,
                color: '#10b981',
                fontSize: 12,
                fontWeight: 'bold',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'fadeIn', duration: 500, delay: 1200, easing: 'ease-out' },
              },
            },
          ],
          transition: { type: 'fade', duration: 500 },
        },
      ],
      settings: { autoAdvance: true, loop: false, showProgressBar: true },
    },
  },
  {
    id: 'template-9',
    name: 'Flash Sale',
    category: 'E-commerce',
    thumbnail: '',
    story: {
      slides: [
        {
          id: 'tpl-slide-1',
          duration: 5,
          background: {
            type: 'gradient',
            value: '',
            gradient: {
              type: 'radial',
              colors: [
                { color: '#dc2626', position: 0 },
                { color: '#991b1b', position: 100 },
              ],
            },
          },
          elements: [
            {
              id: 'tpl-el-1',
              type: 'text',
              content: '⚡',
              style: {
                x: 30,
                y: 100,
                width: 60,
                height: 60,
                rotation: -20,
                zIndex: 2,
                opacity: 1,
                fontSize: 50,
              },
              animation: {
                enter: { type: 'shake', duration: 600, delay: 0, easing: 'ease-out' },
                loop: { type: 'shake', duration: 1000, delay: 500, easing: 'ease-in-out' },
              },
            },
            {
              id: 'tpl-el-2',
              type: 'text',
              content: 'FLASH',
              style: {
                x: 50,
                y: 200,
                width: 260,
                height: 70,
                rotation: 0,
                zIndex: 3,
                opacity: 1,
                color: '#fef08a',
                fontSize: 64,
                fontWeight: 'black',
                textAlign: 'center',
                textShadow: '3px 3px 0px rgba(0,0,0,0.4)',
              },
              animation: {
                enter: { type: 'slideInLeft', duration: 400, delay: 100, easing: 'spring' },
              },
            },
            {
              id: 'tpl-el-3',
              type: 'text',
              content: 'SALE',
              style: {
                x: 50,
                y: 270,
                width: 260,
                height: 70,
                rotation: 0,
                zIndex: 3,
                opacity: 1,
                color: '#ffffff',
                fontSize: 64,
                fontWeight: 'black',
                textAlign: 'center',
                textShadow: '3px 3px 0px rgba(0,0,0,0.4)',
              },
              animation: {
                enter: { type: 'slideInRight', duration: 400, delay: 200, easing: 'spring' },
              },
            },
            {
              id: 'tpl-el-4',
              type: 'text',
              content: 'UP TO 70% OFF',
              style: {
                x: 70,
                y: 380,
                width: 220,
                height: 45,
                rotation: -2,
                zIndex: 4,
                opacity: 1,
                color: '#dc2626',
                fontSize: 22,
                fontWeight: 'black',
                textAlign: 'center',
                backgroundColor: '#fef08a',
                borderRadius: 8,
              },
              animation: {
                enter: { type: 'scaleIn', duration: 500, delay: 500, easing: 'spring' },
                loop: { type: 'pulse', duration: 1200, delay: 0, easing: 'ease-in-out' },
              },
            },
            {
              id: 'tpl-el-5',
              type: 'text',
              content: '⏰ Ends in 24 Hours!',
              style: {
                x: 80,
                y: 490,
                width: 200,
                height: 35,
                rotation: 0,
                zIndex: 1,
                opacity: 0.95,
                color: '#fef3c7',
                fontSize: 14,
                fontWeight: 'bold',
                textAlign: 'center',
              },
              animation: {
                enter: { type: 'fadeInUp', duration: 600, delay: 800, easing: 'ease-out' },
                loop: { type: 'bounce', duration: 2000, delay: 500, easing: 'ease-in-out' },
              },
            },
          ],
          transition: { type: 'zoom', duration: 700 },
        },
      ],
      settings: { autoAdvance: true, loop: false, showProgressBar: true },
    },
  },
  {
    id: 'template-10',
    name: 'Workout Motivation',
    category: 'Fitness',
    thumbnail: '',
    story: {
      slides: [
        {
          id: 'tpl-slide-1',
          duration: 6,
          background: {
            type: 'gradient',
            value: '',
            gradient: {
              type: 'linear',
              angle: 135,
              colors: [
                { color: '#0f172a', position: 0 },
                { color: '#1e293b', position: 100 },
              ],
            },
          },
          elements: [
            {
              id: 'tpl-el-1',
              type: 'text',
              content: '💪',
              style: {
                x: 150,
                y: 120,
                width: 60,
                height: 60,
                rotation: 0,
                zIndex: 3,
                opacity: 1,
                fontSize: 50,
              },
              animation: {
                enter: { type: 'bounce', duration: 800, delay: 0, easing: 'spring' },
                loop: { type: 'bounce', duration: 2000, delay: 1000, easing: 'ease-in-out' },
              },
            },
            {
              id: 'tpl-el-2',
              type: 'text',
              content: 'NO PAIN',
              style: {
                x: 60,
                y: 240,
                width: 240,
                height: 50,
                rotation: 0,
                zIndex: 2,
                opacity: 1,
                color: '#ef4444',
                fontSize: 32,
                fontWeight: 'black',
                textAlign: 'center',
                letterSpacing: 3,
              },
              animation: {
                enter: { type: 'slideInLeft', duration: 600, delay: 300, easing: 'spring' },
              },
            },
            {
              id: 'tpl-el-3',
              type: 'text',
              content: 'NO GAIN',
              style: {
                x: 60,
                y: 300,
                width: 240,
                height: 50,
                rotation: 0,
                zIndex: 2,
                opacity: 1,
                color: '#10b981',
                fontSize: 32,
                fontWeight: 'black',
                textAlign: 'center',
                letterSpacing: 3,
              },
              animation: {
                enter: { type: 'slideInRight', duration: 600, delay: 500, easing: 'spring' },
              },
            },
            {
              id: 'tpl-el-4',
              type: 'shape',
              content: '',
              style: {
                x: 30,
                y: 380,
                width: 300,
                height: 4,
                rotation: 0,
                zIndex: 1,
                opacity: 0.5,
                backgroundColor: '#3b82f6',
              },
              shapeType: 'line',
              animation: {
                enter: { type: 'slideInLeft', duration: 800, delay: 700, easing: 'ease-out' },
              },
            },
            {
              id: 'tpl-el-5',
              type: 'text',
              content: 'Train Hard, Win Easy',
              style: {
                x: 60,
                y: 440,
                width: 240,
                height: 40,
                rotation: 0,
                zIndex: 2,
                opacity: 0.9,
                color: '#cbd5e1',
                fontSize: 18,
                fontWeight: 'medium',
                textAlign: 'center',
                fontStyle: 'italic',
              },
              animation: {
                enter: { type: 'fadeInUp', duration: 700, delay: 1000, easing: 'ease-out' },
              },
            },
          ],
          transition: { type: 'slide', duration: 600 },
        },
      ],
      settings: { autoAdvance: true, loop: false, showProgressBar: true },
    },
  },
];

export const ResourcePanelV2: React.FC<ResourcePanelProps> = ({ onAddElement, onApplyTemplate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('elements');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadType) return;

    setIsUploading(true);
    try {
      const path = await uploadMediaLocally(file);
      onAddElement(uploadType, path);
    } catch (error) {
      console.error(error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (type: 'image' | 'video') => {
    setUploadType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
      fileInputRef.current.click();
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'elements', label: 'Elements', icon: <Type size={16} /> },
    { id: 'shapes', label: 'Shapes', icon: <Square size={16} /> },
    { id: 'interactive', label: 'Interactive', icon: <SlidersHorizontal size={16} /> },
    { id: 'social', label: 'Social', icon: <AtSign size={16} /> },
    { id: 'stickers', label: 'Stickers', icon: <Sticker size={16} /> },
    { id: 'gifs', label: 'GIFs', icon: <Wand2 size={16} /> },
    { id: 'templates', label: 'Templates', icon: <LayoutTemplate size={16} /> },
    { id: 'audio', label: 'Audio', icon: <Music size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-800">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

      {/* Search */}
      <div className="p-3 border-b border-slate-700">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 px-2.5 py-2 text-[11px] font-medium transition-colors ${
              activeTab === tab.id ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Elements Tab */}
        {activeTab === 'elements' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Basic Elements</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAddElement('text', 'New Text')}
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <Type size={24} className="mb-2 text-pink-400" />
                  <span className="text-xs font-medium text-slate-200">Text</span>
                </button>

                <button
                  onClick={() => triggerUpload('image')}
                  disabled={isUploading}
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500 disabled:opacity-50"
                >
                  {isUploading && uploadType === 'image' ? (
                    <Loader2 size={24} className="mb-2 text-blue-400 animate-spin" />
                  ) : (
                    <ImageIcon size={24} className="mb-2 text-blue-400" />
                  )}
                  <span className="text-xs font-medium text-slate-200">Image</span>
                </button>

                <button
                  onClick={() => triggerUpload('video')}
                  disabled={isUploading}
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500 disabled:opacity-50"
                >
                  {isUploading && uploadType === 'video' ? (
                    <Loader2 size={24} className="mb-2 text-green-400 animate-spin" />
                  ) : (
                    <Video size={24} className="mb-2 text-green-400" />
                  )}
                  <span className="text-xs font-medium text-slate-200">Video</span>
                </button>

                <button
                  onClick={() => onAddElement('shape', '', { shapeType: 'rectangle' })}
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <Square size={24} className="mb-2 text-yellow-400" />
                  <span className="text-xs font-medium text-slate-200">Shape</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('button', 'Click me', {
                      button: { href: '#', target: '_self', variant: 'primary' },
                      style: {
                        width: 160,
                        height: 48,
                        backgroundColor: '#3b82f6',
                        color: '#ffffff',
                        fontSize: 16,
                        fontWeight: 'semibold',
                        borderRadius: 8,
                        textAlign: 'center',
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <MousePointerClick size={24} className="mb-2 text-purple-400" />
                  <span className="text-xs font-medium text-slate-200">Button</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('divider', '', {
                      divider: { style: 'solid', thickness: 2 },
                      style: {
                        width: 280,
                        height: 4,
                        backgroundColor: '#ffffff',
                        opacity: 0.3,
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <Divide size={24} className="mb-2 text-slate-400" />
                  <span className="text-xs font-medium text-slate-200">Divider</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('quote', '"Your quote here"', {
                      quote: { author: 'Author Name', style: 'decorative' },
                      style: {
                        width: 280,
                        height: 150,
                        color: '#ffffff',
                        fontSize: 20,
                        fontStyle: 'italic',
                        textAlign: 'center',
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <Quote size={24} className="mb-2 text-amber-400" />
                  <span className="text-xs font-medium text-slate-200">Quote</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('list', '', {
                      list: { items: ['Item 1', 'Item 2', 'Item 3'], type: 'bullet' },
                      style: {
                        width: 250,
                        height: 120,
                        color: '#ffffff',
                        fontSize: 16,
                        textAlign: 'left',
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <List size={24} className="mb-2 text-cyan-400" />
                  <span className="text-xs font-medium text-slate-200">List</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('avatar', '', {
                      avatar: { name: 'User Name', subtitle: '@username', size: 'lg', shape: 'circle' },
                      style: {
                        width: 200,
                        height: 80,
                        backgroundColor: '#3b82f6',
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <User size={24} className="mb-2 text-indigo-400" />
                  <span className="text-xs font-medium text-slate-200">Avatar</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('codeblock', 'const hello = "world";', {
                      codeblock: { language: 'javascript', theme: 'dark', showLineNumbers: true },
                      style: {
                        width: 280,
                        height: 100,
                        backgroundColor: '#1e1e1e',
                        color: '#d4d4d4',
                        fontSize: 14,
                        fontFamily: 'monospace',
                        borderRadius: 8,
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <Code2 size={24} className="mb-2 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-200">Code</span>
                </button>
              </div>
            </div>

            {/* Quick Add */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Add</h4>
              <div className="space-y-2">
                <button
                  onClick={() =>
                    onAddElement('text', 'HEADING', {
                      style: { fontSize: 48, fontWeight: 'bold' },
                    })
                  }
                  className="w-full text-left px-3 py-2.5 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors text-white text-lg font-bold"
                >
                  Heading
                </button>
                <button
                  onClick={() =>
                    onAddElement('text', 'Subheading', {
                      style: { fontSize: 24, fontWeight: 'medium' },
                    })
                  }
                  className="w-full text-left px-3 py-2.5 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors text-white text-base font-medium"
                >
                  Subheading
                </button>
                <button
                  onClick={() =>
                    onAddElement('text', 'Body text goes here...', {
                      style: { fontSize: 16, fontWeight: 'normal' },
                    })
                  }
                  className="w-full text-left px-3 py-2.5 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors text-white text-sm"
                >
                  Body Text
                </button>
                <button
                  onClick={() =>
                    onAddElement('text', 'Caption text', {
                      style: { fontSize: 12, fontWeight: 'normal', opacity: 0.7 },
                    })
                  }
                  className="w-full text-left px-3 py-2.5 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors text-white text-xs opacity-70"
                >
                  Caption
                </button>
                <button
                  onClick={() =>
                    onAddElement('text', 'LABEL', {
                      style: { fontSize: 11, fontWeight: 'bold', letterSpacing: 2 },
                    })
                  }
                  className="w-full text-left px-3 py-2.5 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-colors text-white text-[11px] tracking-widest font-bold"
                >
                  LABEL
                </button>
              </div>
            </div>

            {/* Callouts & Badges */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Callouts & Badges</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onAddElement('text', '🔥 HOT', {
                      style: {
                        fontSize: 14,
                        fontWeight: 'bold',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        width: 80,
                        height: 32,
                        borderRadius: 16,
                        textAlign: 'center',
                      },
                    })
                  }
                  className="flex items-center justify-center p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-red-400 text-sm font-bold"
                >
                  🔥 HOT
                </button>
                <button
                  onClick={() =>
                    onAddElement('text', '✨ NEW', {
                      style: {
                        fontSize: 14,
                        fontWeight: 'bold',
                        backgroundColor: '#8b5cf6',
                        color: '#ffffff',
                        width: 80,
                        height: 32,
                        borderRadius: 16,
                        textAlign: 'center',
                      },
                    })
                  }
                  className="flex items-center justify-center p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors text-purple-400 text-sm font-bold"
                >
                  ✨ NEW
                </button>
                <button
                  onClick={() =>
                    onAddElement('text', '💰 SALE', {
                      style: {
                        fontSize: 14,
                        fontWeight: 'bold',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        width: 80,
                        height: 32,
                        borderRadius: 16,
                        textAlign: 'center',
                      },
                    })
                  }
                  className="flex items-center justify-center p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg transition-colors text-emerald-400 text-sm font-bold"
                >
                  💰 SALE
                </button>
                <button
                  onClick={() =>
                    onAddElement('text', '⭐ TOP', {
                      style: {
                        fontSize: 14,
                        fontWeight: 'bold',
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        width: 80,
                        height: 32,
                        borderRadius: 16,
                        textAlign: 'center',
                      },
                    })
                  }
                  className="flex items-center justify-center p-2 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg transition-colors text-amber-400 text-sm font-bold"
                >
                  ⭐ TOP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shapes Tab */}
        {activeTab === 'shapes' && (
          <div className="grid grid-cols-3 gap-2">
            {SHAPES.map((shape) => (
              <button
                key={shape.type}
                onClick={() =>
                  onAddElement('shape', '', {
                    shapeType: shape.type,
                    style: {
                      backgroundColor: '#3b82f6',
                      width: shape.type === 'line' ? 200 : 100,
                      height: shape.type === 'line' ? 4 : 100,
                    },
                  })
                }
                className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-blue-500/50 text-blue-400"
              >
                {shape.icon}
                <span className="text-[10px] font-medium text-slate-300 mt-2">{shape.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Interactive Tab */}
        {activeTab === 'interactive' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Interactive Elements
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onAddElement('progress', '', {
                      progress: { value: 75, max: 100, label: 'Progress', showPercent: true, variant: 'bar' },
                      style: {
                        width: 250,
                        height: 40,
                        backgroundColor: '#1e293b',
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <BarChart3 size={24} className="mb-2 text-cyan-400" />
                  <span className="text-xs font-medium text-slate-200">Progress</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('rating', '', {
                      rating: { value: 4, max: 5, icon: 'star', showValue: true },
                      style: {
                        width: 180,
                        height: 40,
                        fontSize: 24,
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <Star size={24} className="mb-2 text-yellow-400" />
                  <span className="text-xs font-medium text-slate-200">Rating</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('timer', '', {
                      timer: { duration: 60, autoStart: false, showLabels: true, format: 'ms' },
                      style: {
                        width: 200,
                        height: 80,
                        fontSize: 36,
                        fontWeight: 'bold',
                        color: '#ffffff',
                        textAlign: 'center',
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <Timer size={24} className="mb-2 text-rose-400" />
                  <span className="text-xs font-medium text-slate-200">Timer</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('countdown', '', {
                      countdown: {
                        targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        label: 'Ends in',
                      },
                      style: {
                        width: 280,
                        height: 100,
                        fontSize: 28,
                        fontWeight: 'bold',
                        color: '#ffffff',
                        textAlign: 'center',
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <Timer size={24} className="mb-2 text-orange-400" />
                  <span className="text-xs font-medium text-slate-200">Countdown</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('slider', '', {
                      slider: {
                        images: [
                          { src: '', caption: 'Slide 1' },
                          { src: '', caption: 'Slide 2' },
                        ],
                        currentIndex: 0,
                      },
                      style: {
                        width: 280,
                        height: 300,
                        borderRadius: 12,
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <Play size={24} className="mb-2 text-violet-400" />
                  <span className="text-xs font-medium text-slate-200">Slider</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('poll', '', {
                      poll: { question: 'Your question?', options: ['Option A', 'Option B'] },
                      style: {
                        width: 280,
                        height: 150,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: 12,
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <CheckCircle2 size={24} className="mb-2 text-green-400" />
                  <span className="text-xs font-medium text-slate-200">Poll</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Media & Embed</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onAddElement('embed', '', {
                      embed: { type: 'youtube', url: '' },
                      style: {
                        width: 280,
                        height: 160,
                        borderRadius: 12,
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <Play size={24} className="mb-2 text-red-400" />
                  <span className="text-xs font-medium text-slate-200">YouTube</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('qrcode', '', {
                      qrcode: { data: 'https://example.com', size: 150, color: '#000000', bgColor: '#ffffff' },
                      style: {
                        width: 150,
                        height: 150,
                        backgroundColor: '#ffffff',
                        borderRadius: 8,
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <QrCode size={24} className="mb-2 text-slate-400" />
                  <span className="text-xs font-medium text-slate-200">QR Code</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Social Tab */}
        {activeTab === 'social' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Social Elements</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onAddElement('mention', '@username', {
                      mention: { username: 'username', platform: 'instagram', verified: false },
                      style: {
                        width: 150,
                        height: 36,
                        color: '#3b82f6',
                        fontSize: 16,
                        fontWeight: 'medium',
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <AtSign size={24} className="mb-2 text-blue-400" />
                  <span className="text-xs font-medium text-slate-200">Mention</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('hashtag', '#hashtag', {
                      hashtag: { tags: ['trending', 'viral'], clickable: true },
                      style: {
                        width: 200,
                        height: 36,
                        color: '#3b82f6',
                        fontSize: 16,
                        fontWeight: 'medium',
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <Hash size={24} className="mb-2 text-purple-400" />
                  <span className="text-xs font-medium text-slate-200">Hashtag</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('location', '📍 Location', {
                      location: { name: 'Location Name', address: 'Address' },
                      style: {
                        width: 200,
                        height: 50,
                        color: '#ffffff',
                        fontSize: 14,
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <MapPin size={24} className="mb-2 text-rose-400" />
                  <span className="text-xs font-medium text-slate-200">Location</span>
                </button>

                <button
                  onClick={() =>
                    onAddElement('link', '🔗 Link', {
                      link: { url: '#', label: 'Link' },
                      style: {
                        width: 150,
                        height: 40,
                        color: '#3b82f6',
                        fontSize: 14,
                        textAlign: 'center',
                      },
                    })
                  }
                  className="flex flex-col items-center justify-center p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-slate-500"
                >
                  <Link2 size={24} className="mb-2 text-cyan-400" />
                  <span className="text-xs font-medium text-slate-200">Link</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">CTA Buttons</h4>
              <div className="space-y-2">
                <button
                  onClick={() =>
                    onAddElement('button', 'Follow Me', {
                      button: { href: '#', target: '_blank', variant: 'primary' },
                      style: {
                        width: 200,
                        height: 44,
                        backgroundColor: '#E1306C',
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 'semibold',
                        borderRadius: 22,
                        textAlign: 'center',
                      },
                    })
                  }
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-lg transition-colors text-white text-sm font-medium"
                >
                  <span>📸</span> Follow on Instagram
                </button>
                <button
                  onClick={() =>
                    onAddElement('button', 'Subscribe', {
                      button: { href: '#', target: '_blank', variant: 'primary' },
                      style: {
                        width: 200,
                        height: 44,
                        backgroundColor: '#FF0000',
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 'semibold',
                        borderRadius: 22,
                        textAlign: 'center',
                      },
                    })
                  }
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg transition-colors text-white text-sm font-medium"
                >
                  <span>▶️</span> Subscribe on YouTube
                </button>
                <button
                  onClick={() =>
                    onAddElement('button', 'Shop Now →', {
                      button: { href: '#', target: '_blank', variant: 'primary' },
                      style: {
                        width: 200,
                        height: 44,
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 'semibold',
                        borderRadius: 8,
                        textAlign: 'center',
                      },
                    })
                  }
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors text-white text-sm font-medium"
                >
                  <span>🛒</span> Shop Now
                </button>
                <button
                  onClick={() =>
                    onAddElement('button', 'Swipe Up ↑', {
                      button: { href: '#', target: '_blank', variant: 'primary' },
                      style: {
                        width: 200,
                        height: 44,
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 'semibold',
                        borderRadius: 22,
                        borderWidth: 2,
                        borderColor: '#ffffff',
                        textAlign: 'center',
                      },
                    })
                  }
                  className="w-full flex items-center gap-3 px-3 py-2.5 border-2 border-slate-500 hover:border-white rounded-lg transition-colors text-white text-sm font-medium"
                >
                  <span>👆</span> Swipe Up
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stickers Tab */}
        {activeTab === 'stickers' && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Emoji Stickers</h4>
            <div className="grid grid-cols-4 gap-2">
              {STICKERS.map((sticker, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    onAddElement('text', sticker, {
                      style: { fontSize: 48, width: 60, height: 60 },
                    })
                  }
                  className="flex items-center justify-center p-3 bg-slate-700/30 hover:bg-slate-700 rounded-lg transition-colors text-3xl hover:scale-110"
                >
                  {sticker}
                </button>
              ))}
            </div>

            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Decorative</h4>
            <div className="grid grid-cols-4 gap-2">
              {DECORATIVE_STICKERS.map((sticker, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    onAddElement('text', sticker.emoji, {
                      style: { fontSize: 36, width: 50, height: 50 },
                    })
                  }
                  className="flex flex-col items-center justify-center p-2 bg-slate-700/30 hover:bg-slate-700 rounded-lg transition-colors hover:scale-110"
                  title={sticker.label}
                >
                  <span className="text-2xl text-white">{sticker.emoji}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
              <button
                onClick={() => setActiveTab('gifs')}
                className="flex items-center gap-2 text-purple-300 text-xs hover:text-purple-200 transition-colors"
              >
                <Wand2 size={14} />
                <span>Looking for GIFs? Check the GIFs tab →</span>
              </button>
            </div>
          </div>
        )}

        {/* GIFs Tab - GIPHY Integration */}
        {activeTab === 'gifs' && (
          <div className="h-[calc(100vh-280px)] -mx-3 -mb-3">
            <GiphyPanel
              onSelectGif={(gifUrl) =>
                onAddElement('gif', gifUrl, {
                  style: { width: 200, height: 200 },
                })
              }
            />
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-3">
            {DEMO_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => onApplyTemplate?.(template)}
                className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50 hover:border-blue-500/50 group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-20 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0"
                    style={
                      template.story.slides[0]?.background.gradient
                        ? {
                            background: `linear-gradient(135deg, ${template.story.slides[0].background.gradient.colors.map((c) => c.color).join(', ')})`,
                          }
                        : { backgroundColor: template.story.slides[0]?.background.value }
                    }
                  />
                  <div>
                    <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                      {template.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{template.category}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {template.story.slides.length} slide
                      {template.story.slides.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <div className="space-y-3">
            <button
              onClick={() => alert('Music library coming soon!')}
              className="w-full flex items-center gap-3 p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left border border-dashed border-slate-600"
            >
              <Music size={24} className="text-purple-400" />
              <div>
                <div className="text-sm font-medium text-slate-200">Background Music</div>
                <div className="text-xs text-slate-400">Select from library or upload</div>
              </div>
            </button>

            <div className="p-3 bg-slate-700/30 rounded-lg">
              <p className="text-xs text-slate-400 text-center">
                🎵 Music library with royalty-free tracks coming soon!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
