import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import React from 'react';
import type { BuilderBlock, PageMetadata } from '../../../core/types';
import type { WidgetSchema } from '../../../config/registry';
import { CanvasItem } from '../../canvas/CanvasItem';
import { DropSlot } from '../../canvas/DropSlot';
import { PropsEditor } from '../../panels/PropsEditor';
import type { PreviewMode } from '../../../hooks/useBuilderState';

type WidgetDefinition = WidgetSchema;

interface BuilderCanvasProps {
  isDarkMode: boolean;
  blocks: BuilderBlock[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  showBlocksPanel: boolean;
  showPropsPanel: boolean;
  setShowPropsPanel: (value: boolean) => void;
  previewMode: PreviewMode;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onDragEnd: (event: DragEndEvent) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  updateBlockProps: (id: string, newProps: Record<string, unknown>) => void;
  metadata: PageMetadata;
  setMetadata: (metadata: PageMetadata) => void;
  getWidget: (type: string) => WidgetDefinition | undefined;
}

export function BuilderCanvas({
  isDarkMode,
  blocks,
  selectedId,
  setSelectedId,
  showBlocksPanel,
  showPropsPanel,
  setShowPropsPanel,
  previewMode,
  iframeRef,
  onDragEnd,
  onDelete,
  onDuplicate,
  onMove,
  updateBlockProps,
  metadata,
  setMetadata,
  getWidget,
}: BuilderCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedBlock = blocks.find((b) => b.id === selectedId);
  const selectedDef = selectedBlock ? getWidget(selectedBlock.type) : null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Canvas */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Blocks List */}
          {showBlocksPanel && (
            <div
              className={`w-72 flex-shrink-0 overflow-y-auto rounded-lg border p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Page Structure ({blocks.length})
              </h3>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {blocks.length > 0 && (
                    <DropSlot
                      onDropWidget={(type) =>
                        window.dispatchEvent(new CustomEvent('add-widget', { detail: { type, index: 0 } }))
                      }
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {blocks.map((block, idx) => (
                    <React.Fragment key={block.id}>
                      <CanvasItem
                        block={block}
                        index={idx}
                        total={blocks.length}
                        isSelected={selectedId === block.id}
                        onSelect={() => {
                          setSelectedId(block.id);
                          setShowPropsPanel(true);
                        }}
                        onDelete={(e) => {
                          e.stopPropagation();
                          onDelete(block.id);
                        }}
                        onDuplicate={(e) => {
                          e.stopPropagation();
                          onDuplicate(block.id);
                        }}
                        onMoveUp={(e) => {
                          e.stopPropagation();
                          onMove(block.id, 'up');
                        }}
                        onMoveDown={(e) => {
                          e.stopPropagation();
                          onMove(block.id, 'down');
                        }}
                        isDarkMode={isDarkMode}
                      />
                      <DropSlot
                        onDropWidget={(type) =>
                          window.dispatchEvent(
                            new CustomEvent('add-widget', { detail: { type, index: idx + 1 } })
                          )
                        }
                        isDarkMode={isDarkMode}
                      />
                    </React.Fragment>
                  ))}
                </SortableContext>
              </DndContext>
              {blocks.length === 0 && (
                <DropSlot
                  onDropWidget={(type) =>
                    window.dispatchEvent(new CustomEvent('add-widget', { detail: type }))
                  }
                  isDarkMode={isDarkMode}
                  variant="empty"
                />
              )}
            </div>
          )}

          {/* Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div
              className={`flex-1 rounded-lg border overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
            >
              <iframe
                ref={iframeRef}
                className={`w-full h-full ${previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : ''}`}
                title="Preview"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {showPropsPanel && (
        <div
          className={`w-80 flex-shrink-0 overflow-y-auto p-4 border-l ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {selectedBlock ? `Edit: ${selectedDef?.label || selectedBlock.type}` : 'Page Settings'}
          </h3>
          <PropsEditor
            selectedBlock={selectedBlock || null}
            selectedDef={selectedDef || null}
            updateBlockProps={updateBlockProps}
            metadata={metadata}
            setMetadata={setMetadata}
            isDarkMode={isDarkMode}
          />
        </div>
      )}
    </div>
  );
}
