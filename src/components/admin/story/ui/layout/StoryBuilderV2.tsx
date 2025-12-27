import { FFmpeg } from '@ffmpeg/ffmpeg';
import { Download, Film, Play, Plus, Redo2, Undo2 } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useResponsive } from '~/hooks/useResponsive';

// Hooks
import { useStoryBuilder } from '../../hooks/useStoryBuilder';
import { useStoryPlayback } from '../../hooks/useStoryPlayback';
import { useStoryKeyboard } from '../../hooks/useStoryKeyboard';

// AI Integration
import { CopilotProvider, StoryAIChat, useStoryAI, useCopilotAuth, AIKeyStatusModal } from '../../ai';
import type { StoryBuilderActions } from '../../ai';

// Services
import {  generateAIPrompt, parseImportedStoryFromText } from '../../services/storyExport';
import { saveStory } from '../../services/storySave';
import { renderWithWebCodecs, renderWithFFmpeg, type RenderCallbacks } from '../../services/videoRenderer';
import { exportStoryAsJSON } from '../../services/storiesService'
// Components
import { StoryBuilderHeader, StoryCanvas, RenderOverlay } from './components';
import { AudioPanel, LayersPanel, PropertiesPanelV2, ResourcePanelV2 } from '../panels';
import { StoryPreviewV2 } from '../preview';
import { TimelineV2 } from '../timeline';
import { DEFAULT_EXPORT_SETTINGS, ExportSettingsModal, type ExportSettings } from '../modals';
import { SettingsModal } from '../modals/SettingsModal';
import { AIPromptModal } from '../modals/AIPromptModal';

// Mobile components
import {
  BottomNavBar, BottomSheet, CompactTimeline, FloatingActionButton,
  MobileHeader, MobilePropertiesPanel, MobileResourcesPanel,
  SwipeNavigator, TouchCanvas, type MenuItem, type NavTab,
} from '../../mobile';
import { CanvasElement } from '../canvas';
import { resolveMediaUrl } from '~/utils/mediaUrl';
import { Layers, Music2, PanelLeft, Grid3X3, Settings, Copy, Trash2 } from 'lucide-react';

import type { Story } from '../../types';

interface StoryBuilderProps {
  initialStory?: Story | null;
  onBack?: () => void;
}

/**
 * StoryAIIntegration - Component that registers story context and actions with CopilotKit
 * This component must be rendered inside CopilotProvider when authenticated
 * It uses CopilotKit hooks which require a valid CopilotKit context
 */
function StoryAIIntegrationInner({ 
  story, 
  currentSlide, 
  currentSlideIndex, 
  selectedElement,
  actions 
}: {
  story: Story;
  currentSlide: Story['slides'][0];
  currentSlideIndex: number;
  selectedElement: Story['slides'][0]['elements'][0] | null;
  actions: StoryBuilderActions;
}) {
  // Register story context and actions with CopilotKit
  useStoryAI({
    story,
    currentSlide,
    currentSlideIndex,
    selectedElement,
    actions,
  });

  return null;
}

/**
 * Wrapper that only renders AI integration when authenticated
 * This prevents CopilotKit hook errors when not in a valid context
 */
function StoryAIIntegration(props: {
  story: Story;
  currentSlide: Story['slides'][0];
  currentSlideIndex: number;
  selectedElement: Story['slides'][0]['elements'][0] | null;
  actions: StoryBuilderActions;
}) {
  const authState = useCopilotAuth();
  
  // Only render the inner component when authenticated and not loading
  // This ensures CopilotKit hooks are only called when context is available
  if (authState.isLoading || !authState.isAuthenticated) {
    return null;
  }

  return <StoryAIIntegrationInner {...props} />;
}

/**
 * StoryBuilderV2 - Main Story Builder component wrapped with CopilotKit AI integration
 */
export function StoryBuilderV2({ initialStory, onBack }: StoryBuilderProps) {
  // Core story state
  const storyBuilder = useStoryBuilder({ initialStory });
  const {
    story, setStory, currentSlide, currentSlideId, setCurrentSlideId,
    currentSlideIndex, selectedElementIds, setSelectedElementIds,
    selectedElement, canvasState, setCanvasState, hasUnsavedChanges,
    setHasUnsavedChanges, undo, redo, canUndo, canRedo,
    updateSlide, addSlide, deleteSlide, duplicateSlide,
    addElement, updateElement, deleteElement, duplicateElement,
    toggleElementLock, toggleElementVisibility, reorderElements, applyTemplate,
  } = storyBuilder;

  // Playback state
  const playback = useStoryPlayback({ currentSlide, story, currentSlideId });
  const { currentTime, setCurrentTime, isPlaying, togglePlay } = playback;

  // UI state
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewStartIndex, setPreviewStartIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showKeyStatus, setShowKeyStatus] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS);
  const [leftPanelTab, setLeftPanelTab] = useState<'resources' | 'layers' | 'audio'>('resources');
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // AI state
  const [aiTopic, setAiTopic] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiJsonText, setAiJsonText] = useState('');

  // Render state
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [renderTime, setRenderTime] = useState(0);
  const ffmpegRef = useRef(new FFmpeg());

  // Mobile state
  const { isMobile } = useResponsive();
  const [mobileActiveTab, setMobileActiveTab] = useState<string>('canvas');
  const [showMobileResources, setShowMobileResources] = useState(false);
  const [showMobileProperties, setShowMobileProperties] = useState(false);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useStoryKeyboard({
    undo, redo, selectedElementIds, deleteElement, duplicateElement,
    setSelectedElementIds, setIsPreviewMode, setPreviewStartIndex, currentSlideIndex,
  });

  // Mobile nav tabs
  const mobileNavTabs: NavTab[] = [
    { id: 'canvas', label: 'Canvas', icon: <Grid3X3 size={20} /> },
    { id: 'layers', label: 'Layers', icon: <Layers size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  // Mobile menu items
  const mobileMenuItems: MenuItem[] = [
    { id: 'preview', label: 'Preview', icon: <Play size={18} />, onClick: () => { setPreviewStartIndex(currentSlideIndex); setIsPreviewMode(true); } },
    { id: 'export-json', label: 'Export JSON', icon: <Download size={18} />, onClick: () => exportStoryAsJSON(story) },
    { id: 'export-video', label: 'Export Video', icon: <Film size={18} />, onClick: () => setShowExportModal(true) },
  ];

  // Handlers
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveStory(story);
      if (result.success) {
        setHasUnsavedChanges(false);
        alert(`Story saved to ${result.path}`);
      } else {
        alert(result.error || 'Failed to save');
      }
    } catch (error) {
      alert('Failed to save: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenderVideo = async (settings: ExportSettings) => {
    const callbacks: RenderCallbacks = {
      setIsRendering, setRenderProgress, setLoadingStatus, setRenderTime, setCurrentSlideId,
    };

    try {
      await renderWithWebCodecs(story, currentSlide, settings, ffmpegRef, callbacks);
    } catch (err) {
      console.error('WebCodecs failed, trying FFmpeg:', err);
      try {
        await renderWithFFmpeg(story, currentSlide, settings, ffmpegRef, callbacks);
      } catch (fallbackErr) {
        console.error('FFmpeg also failed:', fallbackErr);
        alert('Rendering failed. Please try again.');
      }
    } finally {
      setIsRendering(false);
      setLoadingStatus('');
    }
  };

  const handleImportStory = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as Story;
        setStory({ ...imported, id: `story-${Date.now()}`, updatedAt: new Date().toISOString() });
        if (imported.slides[0]) setCurrentSlideId(imported.slides[0].id);
        setSelectedElementIds([]);
      } catch { alert('Invalid story file'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [setStory, setCurrentSlideId, setSelectedElementIds]);

  const handleApplyAIJSON = useCallback((json: string) => {
    const result = parseImportedStoryFromText(json);
    if (!result.success) {
      alert(result.error);
      return;
    }
    setStory(result.story);
    if (result.story.slides[0]) setCurrentSlideId(result.story.slides[0].id);
    setSelectedElementIds([]);
    setAiJsonText('');
    setShowAiModal(false);
    alert('Imported successfully!');
  }, [setStory, setCurrentSlideId, setSelectedElementIds]);

  // Mobile handlers
  const handleSwipeLeft = useCallback(() => {
    if (currentSlideIndex < story.slides.length - 1) {
      setCurrentSlideId(story.slides[currentSlideIndex + 1].id);
      setSelectedElementIds([]);
    }
  }, [currentSlideIndex, story.slides, setCurrentSlideId, setSelectedElementIds]);

  const handleSwipeRight = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideId(story.slides[currentSlideIndex - 1].id);
      setSelectedElementIds([]);
    }
  }, [currentSlideIndex, story.slides, setCurrentSlideId, setSelectedElementIds]);

  const handleMobileElementSelect = useCallback((elementId: string) => {
    setSelectedElementIds([elementId]);
    if (isMobile) setShowMobileProperties(true);
  }, [isMobile, setSelectedElementIds]);

  // Memoize AI actions to pass to CopilotKit
  const aiActions: StoryBuilderActions = useMemo(() => ({
    addElement,
    updateElement,
    deleteElement,
    addSlide,
    updateSlide,
  }), [addElement, updateElement, deleteElement, addSlide, updateSlide]);

  // Early return if story not ready
  if (!story || !story.slides || story.slides.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p>Loading Story Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <CopilotProvider>
      {/* AI Integration - registers story context and actions with CopilotKit */}
      <StoryAIIntegration
        story={story}
        currentSlide={currentSlide}
        currentSlideIndex={currentSlideIndex}
        selectedElement={selectedElement || null}
        actions={aiActions}
      />
      
      <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportStory} className="hidden" />

      {/* Render Overlay */}
      <RenderOverlay
        isRendering={isRendering}
        renderProgress={renderProgress}
        loadingStatus={loadingStatus}
        currentSlide={currentSlide}
        exportSettings={exportSettings}
        renderTime={renderTime}
      />

      {/* Preview Mode */}
      {isPreviewMode && (
        <StoryPreviewV2 story={story} onClose={() => setIsPreviewMode(false)} startSlideIndex={previewStartIndex} />
      )}

      {/* Mobile Layout */}
      {isMobile ? (
        <>
          <MobileHeader
            title={story.title}
            onBack={onBack || (() => {})}
            onSave={handleSave}
            onMenuOpen={() => {}}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            menuItems={mobileMenuItems}
          />

          <div className="flex-1 flex flex-col overflow-hidden relative" style={{ paddingBottom: isTimelineExpanded ? '200px' : '112px' }}>
            <SwipeNavigator
              currentIndex={currentSlideIndex}
              totalSlides={story.slides.length}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              enabled={selectedElementIds.length === 0}
            >
              <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                <TouchCanvas
                  slide={currentSlide}
                  selectedElementIds={selectedElementIds}
                  onElementSelect={handleMobileElementSelect}
                  onElementUpdate={(elementId, updates) => updateElement(elementId, updates)}
                  onPinchZoom={(elementId, scale) => {
                    const el = currentSlide.elements.find(e => e.id === elementId);
                    if (el && !el.locked) {
                      updateElement(elementId, { width: Math.max(20, el.style.width * scale), height: Math.max(20, el.style.height * scale) });
                    }
                  }}
                  onRotate={(elementId, angle) => {
                    const el = currentSlide.elements.find(e => e.id === elementId);
                    if (el && !el.locked) {
                      updateElement(elementId, { rotation: (el.style.rotation || 0) + angle });
                    }
                  }}
                  onLongPress={(elementId, position) => { setContextMenuPosition(position); setSelectedElementIds([elementId]); }}
                  onDoubleTap={(elementId) => {
                    const el = currentSlide.elements.find(e => e.id === elementId);
                    if (el?.type === 'text') setShowMobileProperties(true);
                  }}
                  onCanvasTap={() => { setShowFloatingToolbar(true); setSelectedElementIds([]); setTimeout(() => setShowFloatingToolbar(false), 3000); }}
                  zoom={canvasState.zoom}
                  showGrid={canvasState.showGrid}
                  gridSize={canvasState.gridSize}
                  snapToGrid={canvasState.snapToGrid}
                >
                  {/* Background */}
                  {currentSlide.background.type === 'color' && <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: currentSlide.background.value }} />}
                  {currentSlide.background.type === 'gradient' && currentSlide.background.gradient && (
                    <div className="absolute inset-0 w-full h-full" style={{
                      background: currentSlide.background.gradient.type === 'radial'
                        ? `radial-gradient(circle, ${currentSlide.background.gradient.colors.map((c) => `${c.color} ${c.position}%`).join(', ')})`
                        : `linear-gradient(${currentSlide.background.gradient.angle || 0}deg, ${currentSlide.background.gradient.colors.map((c) => `${c.color} ${c.position}%`).join(', ')})`,
                    }} />
                  )}
                  {currentSlide.background.type === 'image' && <img src={resolveMediaUrl(currentSlide.background.value)} className="absolute inset-0 w-full h-full object-cover" alt="slide-bg" />}
                  {currentSlide.background.type === 'video' && <video src={resolveMediaUrl(currentSlide.background.value)} className="absolute inset-0 w-full h-full object-cover" muted loop autoPlay />}

                  {/* Elements */}
                  {currentSlide.elements.map((element) => (
                    <CanvasElement
                      key={element.id}
                      element={element}
                      isSelected={selectedElementIds.includes(element.id)}
                      currentTime={currentTime}
                      onSelect={(multiSelect) => {
                        if (multiSelect) setSelectedElementIds((prev) => prev.includes(element.id) ? prev.filter((id) => id !== element.id) : [...prev, element.id]);
                        else handleMobileElementSelect(element.id);
                      }}
                      onUpdate={(updates) => updateElement(element.id, updates)}
                      onDelete={() => deleteElement(element.id)}
                      onDuplicate={() => duplicateElement(element.id)}
                      onToggleLock={() => toggleElementLock(element.id)}
                      snapToGrid={canvasState.snapToGrid}
                      gridSize={canvasState.gridSize}
                      zoom={canvasState.zoom}
                      playAnimation={selectedElementIds.includes(element.id) && animationTrigger > 0}
                    />
                  ))}
                </TouchCanvas>
              </div>
            </SwipeNavigator>

            {/* Floating Toolbar */}
            {showFloatingToolbar && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-800 rounded-full px-4 py-2 shadow-lg border border-slate-700 z-20">
                <button onClick={() => setShowMobileResources(true)} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full transition-colors"><Plus size={20} /></button>
                <button onClick={undo} disabled={!canUndo} className={`p-2 rounded-full transition-colors ${!canUndo ? 'text-slate-600' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}><Undo2 size={20} /></button>
                <button onClick={redo} disabled={!canRedo} className={`p-2 rounded-full transition-colors ${!canRedo ? 'text-slate-600' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}><Redo2 size={20} /></button>
              </div>
            )}

            {/* Context Menu */}
            {contextMenuPosition && selectedElementIds.length === 1 && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setContextMenuPosition(null)} />
                <div className="absolute z-40 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-2 min-w-[160px]"
                  style={{ left: Math.min(contextMenuPosition.x, window.innerWidth - 180), top: Math.min(contextMenuPosition.y, window.innerHeight - 250) }}>
                  <button onClick={() => { duplicateElement(selectedElementIds[0]); setContextMenuPosition(null); }} className="w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-700 flex items-center gap-3"><Copy size={18} /> Duplicate</button>
                  <button onClick={() => { toggleElementLock(selectedElementIds[0]); setContextMenuPosition(null); }} className="w-full px-4 py-3 text-left text-slate-200 hover:bg-slate-700 flex items-center gap-3"><Layers size={18} /> {currentSlide.elements.find(el => el.id === selectedElementIds[0])?.locked ? 'Unlock' : 'Lock'}</button>
                  <div className="border-t border-slate-700 my-1" />
                  <button onClick={() => { deleteElement(selectedElementIds[0]); setContextMenuPosition(null); }} className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-3"><Trash2 size={18} /> Delete</button>
                </div>
              </>
            )}

            <FloatingActionButton icon={<Plus size={24} />} onClick={() => setShowMobileResources(true)} position="bottom-right" size="large" />
          </div>

          <CompactTimeline currentTime={currentTime} duration={currentSlide.duration || 5} isExpanded={isTimelineExpanded} onTimeChange={setCurrentTime} onToggleExpand={() => setIsTimelineExpanded(!isTimelineExpanded)} slides={story.slides} currentSlideIndex={currentSlideIndex} onSlideSelect={(index) => { setCurrentSlideId(story.slides[index].id); setSelectedElementIds([]); }} isPlaying={isPlaying} onTogglePlay={togglePlay} />
          <BottomNavBar tabs={mobileNavTabs} activeTab={mobileActiveTab} onTabChange={(tabId) => { setMobileActiveTab(tabId); if (tabId === 'settings') setShowSettings(true); }} />
          <MobileResourcesPanel isOpen={showMobileResources} onClose={() => setShowMobileResources(false)} onAddElement={addElement} onApplyTemplate={applyTemplate} />
          <MobilePropertiesPanel isOpen={showMobileProperties} onClose={() => setShowMobileProperties(false)} element={selectedElement || null} slide={currentSlide} onUpdateElement={(updates) => { if (selectedElementIds.length === 1) updateElement(selectedElementIds[0], updates); }} onUpdateSlide={(updates) => updateSlide(currentSlideId, updates)} onDeleteElement={() => { if (selectedElement) { deleteElement(selectedElement.id); setShowMobileProperties(false); } }} onDuplicateElement={() => { if (selectedElement) duplicateElement(selectedElement.id); }} onToggleLock={() => { if (selectedElement) toggleElementLock(selectedElement.id); }} />
          <BottomSheet isOpen={mobileActiveTab === 'layers'} onClose={() => setMobileActiveTab('canvas')} title="Layers" snapPoints={[0.5, 0.8]} initialSnap={0}>
            <LayersPanel elements={currentSlide.elements} selectedElementIds={selectedElementIds} onSelectElement={(id, multiSelect) => { if (multiSelect) setSelectedElementIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]); else setSelectedElementIds([id]); }} onReorderElements={reorderElements} onToggleVisibility={toggleElementVisibility} onToggleLock={toggleElementLock} onDeleteElement={deleteElement} onDuplicateElement={duplicateElement} />
          </BottomSheet>
        </>
      ) : (
        <>
          {/* Desktop Header */}
          <StoryBuilderHeader
            story={story}
            onTitleChange={(title) => setStory((prev) => prev ? { ...prev, title } : prev)}
            onBack={onBack}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            canvasState={canvasState}
            onCanvasStateChange={(updates) => setCanvasState((prev) => ({ ...prev, ...updates }))}
            onPreview={() => { setPreviewStartIndex(currentSlideIndex); setIsPreviewMode(true); }}
            onImport={() => fileInputRef.current?.click()}
            onExportJSON={() => exportStoryAsJSON(story)}
            onExportVideo={() => setShowExportModal(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenAIModal={() => setShowAiModal(true)}
            onOpenKeyStatus={() => setShowKeyStatus(true)}
            onSave={handleSave}
          />

          {/* Desktop Main Workspace */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel */}
            <div className="w-72 border-r border-slate-700 flex flex-col">
              <div className="flex border-b border-slate-700">
                <button onClick={() => setLeftPanelTab('resources')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${leftPanelTab === 'resources' ? 'bg-slate-800 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}><PanelLeft size={14} /> Resources</button>
                <button onClick={() => setLeftPanelTab('layers')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${leftPanelTab === 'layers' ? 'bg-slate-800 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}><Layers size={14} /> Layers</button>
                <button onClick={() => setLeftPanelTab('audio')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${leftPanelTab === 'audio' ? 'bg-slate-800 text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}><Music2 size={14} /> Audio</button>
              </div>
              <div className="flex-1 overflow-hidden">
                {leftPanelTab === 'resources' ? (
                  <ResourcePanelV2 onAddElement={addElement} onApplyTemplate={applyTemplate} />
                ) : leftPanelTab === 'layers' ? (
                  <LayersPanel elements={currentSlide.elements} selectedElementIds={selectedElementIds} onSelectElement={(id, multiSelect) => { if (multiSelect) setSelectedElementIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]); else setSelectedElementIds([id]); }} onReorderElements={reorderElements} onToggleVisibility={toggleElementVisibility} onToggleLock={toggleElementLock} onDeleteElement={deleteElement} onDuplicateElement={duplicateElement} />
                ) : (
                  <AudioPanel story={story} currentSlide={currentSlide} onUpdateStory={(updates) => setStory((prev) => prev ? { ...prev, ...updates } : prev)} onUpdateSlide={updateSlide} />
                )}
              </div>
            </div>

            {/* Center Canvas */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900/50">
              <StoryCanvas
                currentSlide={currentSlide}
                canvasState={canvasState}
                selectedElementIds={selectedElementIds}
                currentTime={currentTime}
                animationTrigger={animationTrigger}
                onSelectElement={(id, multiSelect) => {
                  if (multiSelect) setSelectedElementIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
                  else setSelectedElementIds([id]);
                }}
                onUpdateElement={updateElement}
                onDeleteElement={deleteElement}
                onDuplicateElement={duplicateElement}
                onToggleLock={toggleElementLock}
                onDeselectAll={() => setSelectedElementIds([])}
              />

              {/* Timeline */}
              <div className="h-36 border-t border-slate-700">
                <TimelineV2
                  slides={story.slides}
                  currentSlideId={currentSlideId}
                  onSelectSlide={(id) => { setCurrentSlideId(id); setSelectedElementIds([]); }}
                  onAddSlide={addSlide}
                  onReorderSlides={(newSlides) => setStory((prev) => prev ? { ...prev, slides: newSlides } : prev)}
                  onDeleteSlide={deleteSlide}
                  onDuplicateSlide={duplicateSlide}
                  isPlaying={isPlaying}
                  onTogglePlay={togglePlay}
                  currentTime={currentTime}
                  onSeek={setCurrentTime}
                  elements={currentSlide.elements}
                  onUpdateElement={updateElement}
                  selectedElementIds={selectedElementIds}
                  onSelectElement={(id) => setSelectedElementIds([id])}
                />
              </div>
            </div>

            {/* Right Properties Panel */}
            <div className="w-80 border-l border-slate-700">
              <PropertiesPanelV2
                element={selectedElement || null}
                slide={currentSlide}
                onUpdateElement={(updates) => { if (selectedElementIds.length === 1) updateElement(selectedElementIds[0], updates); }}
                onUpdateSlide={(updates) => updateSlide(currentSlideId, updates)}
                onDeleteElement={() => { if (selectedElement) deleteElement(selectedElement.id); }}
                onDuplicateElement={() => { if (selectedElement) duplicateElement(selectedElement.id); }}
                onToggleLock={() => { if (selectedElement) toggleElementLock(selectedElement.id); }}
                onPreviewAnimation={() => setAnimationTrigger((prev) => prev + 1)}
              />
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} story={story} onUpdateStory={(updates) => setStory((prev) => prev ? { ...prev, ...updates } : prev)} />
      <ExportSettingsModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={(settings) => { setExportSettings(settings); handleRenderVideo(settings); }} slideCount={story.slides.length} currentSlideIndex={currentSlideIndex} />
      <AIPromptModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} aiTopic={aiTopic} setAiTopic={setAiTopic} aiPrompt={aiPrompt} setAiPrompt={setAiPrompt} aiJsonText={aiJsonText} setAiJsonText={setAiJsonText} generateAIPrompt={generateAIPrompt} onApplyJSON={handleApplyAIJSON} />
      <AIKeyStatusModal isOpen={showKeyStatus} onClose={() => setShowKeyStatus(false)} />

      {/* AI Chat Interface - positioned at bottom-right */}
      <StoryAIChat position="bottom-right" />
    </div>
    </CopilotProvider>
  );
}
