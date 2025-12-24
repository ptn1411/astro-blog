import {
  CloudUpload,
  Copy,
  Download,
  Edit,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import type { WidgetSchema, WidgetCategory } from '../registry';
import { WIDGET_CATEGORIES } from '../registry';
import { exportWidgetsToFile, parseWidgetsFromFile } from '../actions/widgetStorage';
import type { UseWidgetRegistryReturn } from '../hooks/useWidgetRegistry';
import { DynamicWidgetRenderer, getDefaultTemplate } from '../DynamicWidgetRenderer';

interface WidgetManagerProps {
  registry: UseWidgetRegistryReturn;
  isDarkMode: boolean;
  onClose: () => void;
}

type EditorMode = 'list' | 'create' | 'edit' | 'ai-prompt';

const DEFAULT_WIDGET: Partial<WidgetSchema> = {
  type: '' as any,
  label: '',
  category: 'misc',
  defaultProps: {},
  template: {
    layout: 'card',
    containerClass: '',
    showHeader: false,
    elements: [],
  },
  fields: [],
};

export const WidgetManager: React.FC<WidgetManagerProps> = ({
  registry,
  isDarkMode,
  onClose,
}) => {
  const {
    customWidgets,
    isLoading,
    error,
    addWidget,
    updateWidget,
    removeWidget,
    syncToRemote,
    syncFromRemote,
  } = registry;

  const [mode, setMode] = useState<EditorMode>('list');
  const [editingWidget, setEditingWidget] = useState<Partial<WidgetSchema>>(DEFAULT_WIDGET);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [widgetDescription, setWidgetDescription] = useState('');
  const [aiJsonResult, setAiJsonResult] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    setEditingWidget({ ...DEFAULT_WIDGET });
    setMode('create');
  };

  const handleEdit = (widget: WidgetSchema) => {
    setEditingWidget({ ...widget });
    setMode('edit');
  };

  const handleDelete = async (type: string) => {
    if (confirm(`Xóa widget "${type}"? Hành động này không thể hoàn tác.`)) {
      await removeWidget(type as any);
    }
  };

  const handleSave = async () => {
    if (!editingWidget.type || !editingWidget.label) {
      alert('Vui lòng nhập Type và Label');
      return;
    }

    const widget: WidgetSchema = {
      type: editingWidget.type as any,
      label: editingWidget.label,
      category: editingWidget.category || 'misc',
      icon: null as any, // Will use default icon (Box) in SidebarItem
      template: editingWidget.template,
      defaultProps: editingWidget.defaultProps || {},
      fields: editingWidget.fields || [],
    };

    let success: boolean;
    if (mode === 'create') {
      success = await addWidget(widget);
    } else {
      success = await updateWidget(widget.type, widget);
    }

    if (success) {
      setMode('list');
      setEditingWidget(DEFAULT_WIDGET);
    }
  };

  const handleSyncToRemote = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    
    const result = await syncToRemote();
    
    if (result.remote) {
      setSyncMessage('✓ Đã đồng bộ lên server thành công!');
    } else if (result.local) {
      setSyncMessage('⚠ Đã lưu local, nhưng không thể đồng bộ lên server');
    } else {
      setSyncMessage('✗ Lỗi khi lưu');
    }
    
    setIsSyncing(false);
    setTimeout(() => setSyncMessage(null), 3000);
  };

  const handleSyncFromRemote = async () => {
    setIsSyncing(true);
    await syncFromRemote();
    setIsSyncing(false);
  };

  const handleExport = () => {
    exportWidgetsToFile(customWidgets);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const result = parseWidgetsFromFile(text);
      
      if (result.success && result.widgets) {
        for (const widget of result.widgets) {
          await addWidget(widget);
        }
        alert(`Đã import ${result.widgets.length} widgets!`);
      } else {
        alert(result.error || 'Import thất bại');
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const addField = () => {
    setEditingWidget(prev => ({
      ...prev,
      fields: [
        ...(prev.fields || []),
        { name: '', label: '', type: 'text' as const },
      ],
    }));
  };

  const updateField = (index: number, updates: Partial<WidgetSchema['fields'][0]>) => {
    setEditingWidget(prev => {
      const fields = [...(prev.fields || [])];
      fields[index] = { ...fields[index], ...updates };
      return { ...prev, fields };
    });
  };

  const removeField = (index: number) => {
    setEditingWidget(prev => ({
      ...prev,
      fields: (prev.fields || []).filter((_, i) => i !== index),
    }));
  };

  // Generate AI Prompt for creating custom widgets
  const generateAIPrompt = () => {
    return `Bạn là một AI chuyên gia tạo Custom Widget JSON cho Astro Page Builder. Tạo JSON theo đúng format dưới đây.

=== MÔ TẢ WIDGET CẦN TẠO ===
${widgetDescription || '[Thêm mô tả widget của bạn ở đây]'}

=== OUTPUT FORMAT (BẮT BUỘC) ===
\`\`\`json
{
  "type": "WidgetTypeName",
  "label": "Widget Display Name",
  "category": "misc",
  "icon": null,
  "template": {
    "layout": "card",
    "containerClass": "",
    "showHeader": false,
    "elements": [
      { "type": "image", "field": "image", "imageSize": "lg", "imageShape": "circle", "className": "mx-auto mb-6" },
      { "type": "title", "field": "title", "className": "text-center mb-2" },
      { "type": "subtitle", "field": "subtitle", "className": "text-center text-blue-600 mb-4" },
      { "type": "text", "field": "description", "className": "text-center mb-6" }
    ]
  },
  "defaultProps": {
    "title": "Default Title",
    "subtitle": "Default Subtitle",
    "description": "Default description text"
  },
  "fields": [
    { "name": "title", "label": "Title", "type": "text" },
    { "name": "subtitle", "label": "Subtitle", "type": "text" },
    { "name": "description", "label": "Description", "type": "textarea" }
  ]
}
\`\`\`

=== TEMPLATE SYSTEM ===

**Layout Types:**
- "card" - Card với shadow và padding
- "section" - Full-width section
- "list" - Danh sách vertical
- "grid" - Grid layout
- "hero" - Hero section style

**Element Types:**
- "title" - Heading text (h2)
- "subtitle" - Subtitle text
- "text" - Paragraph text
- "image" - Image với imageSize (sm/md/lg/xl/full) và imageShape (square/rounded/circle)
- "icon" - Icon display
- "button" - Button/CTA với buttonVariant (primary/secondary/outline)
- "list" - List items với listStyle (bullet/check/number/none)
- "tags" - Tag badges
- "social" - Social links
- "progress" - Progress bars (cho skills)
- "grid" - Nested grid với gridCols
- "divider" - Horizontal divider
- "custom" - Custom HTML content

**Element Properties:**
- "type": Element type (required)
- "field": Field name from props to display (required)
- "className": Tailwind CSS classes
- "condition": Field name to check for conditional rendering
- "imageSize": sm/md/lg/xl/full (for image)
- "imageShape": square/rounded/circle (for image)
- "buttonVariant": primary/secondary/outline (for button)
- "listStyle": bullet/check/number/none (for list)
- "gridCols": Number of columns (for grid)

=== FIELD TYPES ===
- "text" - Single line text input
- "textarea" - Multi-line text input
- "number" - Number input
- "boolean" - Checkbox/toggle
- "image" - Image picker
- "icon" - Icon picker (format: tabler:icon-name)
- "json" - JSON editor
- "array" - Array of items với arraySchema
- "select" - Dropdown với options

=== CATEGORIES ===
- "hero" - Hero sections
- "features" - Feature displays
- "content" - Content blocks
- "social" - Social proof (testimonials, stats)
- "blog" - Blog related
- "misc" - Miscellaneous

=== VÍ DỤ WIDGETS ===

**Profile Card:**
\`\`\`json
{
  "type": "ProfileCard",
  "label": "Profile Card",
  "category": "social",
  "icon": null,
  "template": {
    "layout": "card",
    "containerClass": "text-center",
    "elements": [
      { "type": "image", "field": "avatar", "imageSize": "lg", "imageShape": "circle", "className": "mx-auto mb-6 border-4 border-blue-100" },
      { "type": "title", "field": "name", "className": "text-2xl mb-1" },
      { "type": "subtitle", "field": "title", "className": "text-blue-600 font-medium mb-4" },
      { "type": "text", "field": "bio", "className": "max-w-md mx-auto mb-6" },
      { "type": "tags", "field": "skills", "className": "justify-center mb-6" },
      { "type": "social", "field": "socialLinks", "className": "justify-center" }
    ]
  },
  "defaultProps": {
    "name": "John Doe",
    "title": "Full-stack Developer",
    "bio": "Passionate about building great products.",
    "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300",
    "skills": ["React", "TypeScript", "Node.js"],
    "socialLinks": [
      { "platform": "github", "url": "https://github.com", "icon": "tabler:brand-github" }
    ]
  },
  "fields": [
    { "name": "name", "label": "Full Name", "type": "text" },
    { "name": "title", "label": "Job Title", "type": "text" },
    { "name": "bio", "label": "Bio", "type": "textarea" },
    { "name": "avatar", "label": "Avatar", "type": "image" },
    { "name": "skills", "label": "Skills (JSON array)", "type": "json" },
    {
      "name": "socialLinks",
      "label": "Social Links",
      "type": "array",
      "arraySchema": [
        { "key": "platform", "label": "Platform", "type": "text" },
        { "key": "url", "label": "URL", "type": "text" },
        { "key": "icon", "label": "Icon", "type": "icon" }
      ]
    }
  ]
}
\`\`\`

**Skills Chart:**
\`\`\`json
{
  "type": "SkillsChart",
  "label": "Skills Chart",
  "category": "content",
  "icon": null,
  "template": {
    "layout": "section",
    "showHeader": true,
    "headerPosition": "center",
    "containerClass": "max-w-3xl",
    "elements": [
      { "type": "progress", "field": "skills" }
    ]
  },
  "defaultProps": {
    "title": "My Skills",
    "subtitle": "Technologies I work with",
    "skills": [
      { "name": "JavaScript", "level": 90, "color": "#f7df1e" },
      { "name": "React", "level": 85, "color": "#61dafb" }
    ]
  },
  "fields": [
    { "name": "title", "label": "Title", "type": "text" },
    { "name": "subtitle", "label": "Subtitle", "type": "text" },
    {
      "name": "skills",
      "label": "Skills",
      "type": "array",
      "arraySchema": [
        { "key": "name", "label": "Skill Name", "type": "text" },
        { "key": "level", "label": "Level (0-100)", "type": "number" },
        { "key": "color", "label": "Color (hex)", "type": "text" }
      ]
    }
  ]
}
\`\`\`

=== QUY TẮC ===
1. Type phải là PascalCase và unique (vd: ProfileCard, SkillsChart)
2. Template elements phải map với fields trong defaultProps
3. Sử dụng Tailwind CSS classes cho styling
4. Icon format: "tabler:icon-name" (vd: tabler:user, tabler:star)
5. Đảm bảo JSON valid, không có trailing comma
6. defaultProps phải có giá trị mẫu cho tất cả fields

Hãy tạo widget JSON hoàn chỉnh theo mô tả trên.`;
  };

  const copyPromptToClipboard = async () => {
    const prompt = generateAIPrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      alert('Đã copy prompt! Paste vào ChatGPT/Claude để tạo widget JSON.');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = prompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Đã copy prompt!');
    }
  };

  const handleImportAiJson = async () => {
    if (!aiJsonResult.trim()) {
      alert('Vui lòng paste JSON từ AI vào ô bên dưới');
      return;
    }

    try {
      // Extract JSON from markdown code block if present
      let jsonStr = aiJsonResult.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      const widget = JSON.parse(jsonStr);
      
      // Validate required fields
      if (!widget.type || !widget.label) {
        alert('JSON không hợp lệ: thiếu type hoặc label');
        return;
      }

      // Ensure required fields exist
      const widgetToAdd: WidgetSchema = {
        type: widget.type,
        label: widget.label,
        category: widget.category || 'misc',
        icon: widget.icon || null,
        template: widget.template,
        defaultProps: widget.defaultProps || {},
        fields: widget.fields || [],
      };

      const success = await addWidget(widgetToAdd);
      if (success) {
        alert(`Đã import widget "${widget.label}" thành công!`);
        setAiJsonResult('');
        setWidgetDescription('');
        setMode('list');
      }
    } catch (e) {
      alert('JSON không hợp lệ. Vui lòng kiểm tra lại format.');
      console.error('Parse error:', e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-4xl mx-4 rounded-lg shadow-xl max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            {mode === 'list' ? 'Quản lý Custom Widgets' : mode === 'create' ? 'Tạo Widget Mới' : mode === 'edit' ? 'Chỉnh sửa Widget' : 'AI Prompt Generator'}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-gray-200 ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'list' ? (
            <>
              {/* Actions Bar */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  <Plus size={16} /> Tạo Widget
                </button>
                <button
                  onClick={() => setMode('ai-prompt')}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded"
                >
                  <Sparkles size={16} /> AI Prompt
                </button>
                <button
                  onClick={handleSyncToRemote}
                  disabled={isSyncing}
                  className={`flex items-center gap-1 px-3 py-2 text-sm rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
                  Lưu lên Server
                </button>
                <button
                  onClick={handleSyncFromRemote}
                  disabled={isSyncing}
                  className={`flex items-center gap-1 px-3 py-2 text-sm rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  <RefreshCw size={16} /> Tải từ Server
                </button>
                <button
                  onClick={handleExport}
                  className={`flex items-center gap-1 px-3 py-2 text-sm rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  <Download size={16} /> Export
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-1 px-3 py-2 text-sm rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  <Upload size={16} /> Import
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".json"
                  className="hidden"
                />
              </div>

              {/* Sync Message */}
              {syncMessage && (
                <div className={`mb-4 p-2 rounded text-sm ${syncMessage.startsWith('✓') ? 'bg-green-100 text-green-700' : syncMessage.startsWith('⚠') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {syncMessage}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin mr-2" />
                  Đang tải...
                </div>
              )}

              {/* Widget List */}
              {!isLoading && customWidgets.length === 0 ? (
                <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p className="mb-2">Chưa có custom widget nào</p>
                  <p className="text-sm">Nhấn "Tạo Widget" để bắt đầu</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customWidgets.map((widget) => (
                    <div
                      key={widget.type}
                      className={`flex items-center justify-between p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div>
                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {widget.label}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Type: {widget.type} | Category: {widget.category} | Fields: {widget.fields.length}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(widget)}
                          className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(widget.type)}
                          className="p-2 rounded hover:bg-red-100 text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : mode === 'ai-prompt' ? (
            /* AI Prompt Generator */
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/30 border border-purple-700' : 'bg-purple-50 border border-purple-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={20} className="text-purple-500" />
                  <span className={`font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    Tạo Widget với AI
                  </span>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Mô tả widget bạn muốn tạo, sau đó copy prompt và paste vào ChatGPT/Claude để nhận JSON widget.
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Mô tả Widget cần tạo
                </label>
                <textarea
                  value={widgetDescription}
                  onChange={(e) => setWidgetDescription(e.target.value)}
                  placeholder="Ví dụ: Tạo một widget hiển thị thông tin sản phẩm với hình ảnh, tên, giá, mô tả ngắn và nút mua hàng. Có thể thêm badge giảm giá."
                  rows={4}
                  className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500' : 'bg-white border-gray-300 placeholder:text-gray-400'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  AI Prompt (Copy và paste vào ChatGPT/Claude)
                </label>
                <div className="relative">
                  <textarea
                    value={generateAIPrompt()}
                    readOnly
                    rows={12}
                    className={`w-full px-3 py-2 rounded border font-mono text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-700'}`}
                  />
                  <button
                    onClick={copyPromptToClipboard}
                    className="absolute top-2 right-2 flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded"
                  >
                    <Copy size={14} /> Copy Prompt
                  </button>
                </div>
              </div>

              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Hướng dẫn:
                </p>
                <ol className={`text-sm space-y-1 list-decimal list-inside ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <li>Nhập mô tả widget bạn muốn tạo</li>
                  <li>Click "Copy Prompt" để copy prompt</li>
                  <li>Paste vào ChatGPT hoặc Claude</li>
                  <li>Copy JSON kết quả từ AI và paste vào ô bên dưới</li>
                  <li>Click "Import Widget" để thêm widget</li>
                </ol>
              </div>

              {/* Paste JSON Result */}
              <div className={`p-4 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-green-700 bg-green-900/20' : 'border-green-300 bg-green-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Download size={20} className="text-green-500" />
                  <span className={`font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                    Paste JSON từ AI
                  </span>
                </div>
                <textarea
                  value={aiJsonResult}
                  onChange={(e) => setAiJsonResult(e.target.value)}
                  placeholder='Paste JSON widget từ ChatGPT/Claude vào đây...&#10;&#10;Ví dụ:&#10;{&#10;  "type": "MyWidget",&#10;  "label": "My Widget",&#10;  ...&#10;}'
                  rows={8}
                  className={`w-full px-3 py-2 rounded border font-mono text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500' : 'bg-white border-gray-300 placeholder:text-gray-400'}`}
                />
                {aiJsonResult && (
                  <button
                    onClick={handleImportAiJson}
                    className="mt-2 flex items-center gap-1 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    <Plus size={16} /> Import Widget
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Create/Edit Form */
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Type (unique) *
                  </label>
                  <input
                    type="text"
                    value={editingWidget.type || ''}
                    onChange={(e) => setEditingWidget(prev => ({ ...prev, type: e.target.value as any }))}
                    disabled={mode === 'edit'}
                    placeholder="MyCustomWidget"
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'} ${mode === 'edit' ? 'opacity-50' : ''}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Label *
                  </label>
                  <input
                    type="text"
                    value={editingWidget.label || ''}
                    onChange={(e) => setEditingWidget(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="My Custom Widget"
                    className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category
                </label>
                <select
                  value={editingWidget.category || 'misc'}
                  onChange={(e) => setEditingWidget(prev => ({ ...prev, category: e.target.value as WidgetCategory }))}
                  className={`w-full px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
                >
                  {WIDGET_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Default Props (JSON)
                </label>
                <textarea
                  value={JSON.stringify(editingWidget.defaultProps || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const props = JSON.parse(e.target.value);
                      setEditingWidget(prev => ({ ...prev, defaultProps: props }));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={4}
                  className={`w-full px-3 py-2 rounded border font-mono text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'}`}
                />
              </div>

              {/* Template Editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Template (JSON) - Định nghĩa cách render widget
                  </label>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${showPreview ? 'bg-green-600 text-white' : isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'}`}
                  >
                    <Eye size={14} /> {showPreview ? 'Ẩn Preview' : 'Xem Preview'}
                  </button>
                </div>
                <div className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Layout: card | section | list | grid | hero. Elements: title, subtitle, text, image, button, tags, list, progress, social, divider
                </div>
                <textarea
                  value={JSON.stringify(editingWidget.template || { layout: 'card', elements: [] }, null, 2)}
                  onChange={(e) => {
                    try {
                      const template = JSON.parse(e.target.value);
                      setEditingWidget(prev => ({ ...prev, template }));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={8}
                  placeholder={`{
  "layout": "card",
  "containerClass": "text-center",
  "elements": [
    { "type": "image", "field": "avatar", "imageSize": "lg", "imageShape": "circle" },
    { "type": "title", "field": "name" },
    { "type": "text", "field": "bio" }
  ]
}`}
                  className={`w-full px-3 py-2 rounded border font-mono text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500' : 'bg-white border-gray-300 placeholder:text-gray-400'}`}
                />
              </div>

              {/* Widget Preview */}
              {showPreview && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Preview
                  </label>
                  <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-gray-50'}`}>
                    <div className="transform scale-75 origin-top">
                      <DynamicWidgetRenderer 
                        template={editingWidget.template || getDefaultTemplate(editingWidget.defaultProps || {})} 
                        props={editingWidget.defaultProps || {}} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fields */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Fields
                  </label>
                  <button
                    onClick={addField}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    <Plus size={14} /> Thêm Field
                  </button>
                </div>
                
                <div className="space-y-2">
                  {(editingWidget.fields || []).map((field, index) => (
                    <div
                      key={index}
                      className={`flex gap-2 p-2 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(index, { name: e.target.value })}
                        placeholder="name"
                        className={`flex-1 px-2 py-1 text-sm rounded border ${isDarkMode ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-300'}`}
                      />
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="Label"
                        className={`flex-1 px-2 py-1 text-sm rounded border ${isDarkMode ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-300'}`}
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value as any })}
                        className={`px-2 py-1 text-sm rounded border ${isDarkMode ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-300'}`}
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Textarea</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="image">Image</option>
                        <option value="icon">Icon</option>
                        <option value="json">JSON</option>
                        <option value="array">Array</option>
                        <option value="select">Select</option>
                      </select>
                      <button
                        onClick={() => removeField(index)}
                        className="p-1 rounded hover:bg-red-100 text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 px-4 py-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {(mode === 'create' || mode === 'edit') && (
            <>
              <button
                onClick={() => {
                  setMode('list');
                  setEditingWidget(DEFAULT_WIDGET);
                }}
                className={`px-4 py-2 text-sm rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                {mode === 'create' ? 'Tạo Widget' : 'Lưu thay đổi'}
              </button>
            </>
          )}
          {mode === 'ai-prompt' && (
            <>
              <button
                onClick={() => {
                  setMode('list');
                  setWidgetDescription('');
                  setAiJsonResult('');
                }}
                className={`px-4 py-2 text-sm rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                Quay lại
              </button>
              <button
                onClick={copyPromptToClipboard}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded"
              >
                <Copy size={16} /> Copy Prompt
              </button>
              {aiJsonResult && (
                <button
                  onClick={handleImportAiJson}
                  className="flex items-center gap-1 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  <Plus size={16} /> Import Widget
                </button>
              )}
            </>
          )}
          {mode === 'list' && (
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
