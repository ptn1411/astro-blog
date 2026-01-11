import React, { useState } from 'react';
import type { Story } from '../../types';
import { DashboardLayout } from './DashboardLayout';
import { StoriesManager } from './StoriesManager';
import { StoryBuilderV2 } from './StoryBuilderV2';

export const StoriesApp: React.FC = () => {
  const [mode, setMode] = useState<'list' | 'builder'>('list');
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  if (mode === 'builder') {
    return (
      <div className="h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
        <StoryBuilderV2
          initialStory={currentStory}
          onBack={() => {
            setCurrentStory(null);
            setMode('list');
          }}
        />
      </div>
    );
  }

  return (
    <DashboardLayout activeTab="stories">
      <StoriesManager
        onCreateNew={() => {
          setCurrentStory(null);
          setMode('builder');
        }}
        onEdit={(story) => {
          setCurrentStory(story);
          setMode('builder');
        }}
      />
    </DashboardLayout>
  );
};
