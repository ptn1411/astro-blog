import React, { useState } from 'react';
import {StoriesManager} from './StoriesManager';
import {StoryBuilderV2} from './StoryBuilderV2';
import type { Story } from '../../types';

export  const StoriesApp: React.FC = () => {
  const [mode, setMode] = useState<'list' | 'builder'>('list');
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  if (mode === 'builder') {
    return (
      <div className="h-screen w-full overflow-hidden bg-gray-900 text-white">
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
    <div className="h-screen w-full overflow-hidden bg-gray-900 text-white">
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
    </div>
  );
};


