import { Music, Music2, Pause, Play, Plus, Trash2, Upload, Volume2, VolumeX } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { Story, StorySlide } from './types';

interface AudioPanelProps {
  story: Story;
  currentSlide: StorySlide;
  onUpdateStory: (updates: Partial<Story>) => void;
  onUpdateSlide: (slideId: string, updates: Partial<StorySlide>) => void;
}

// Free audio tracks (demo purposes)
const AUDIO_LIBRARY = [
  {
    id: 'upbeat-1',
    name: 'Happy Vibes',
    category: 'Upbeat',
    duration: '2:30',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'chill-1',
    name: 'Chill Lofi',
    category: 'Chill',
    duration: '3:15',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'dramatic-1',
    name: 'Epic Moment',
    category: 'Dramatic',
    duration: '2:45',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'ambient-1',
    name: 'Ambient Dreams',
    category: 'Ambient',
    duration: '4:00',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: 'pop-1',
    name: 'Pop Beat',
    category: 'Pop',
    duration: '2:20',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    id: 'acoustic-1',
    name: 'Acoustic Morning',
    category: 'Acoustic',
    duration: '3:00',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
];

const CATEGORIES = ['All', 'Upbeat', 'Chill', 'Dramatic', 'Ambient', 'Pop', 'Acoustic'];

export const AudioPanel: React.FC<AudioPanelProps> = ({ story, currentSlide, onUpdateStory, onUpdateSlide }) => {
  const [activeTab, setActiveTab] = useState<'background' | 'slide' | 'library'>('background');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Filter tracks by category
  const filteredTracks =
    selectedCategory === 'All' ? AUDIO_LIBRARY : AUDIO_LIBRARY.filter((t) => t.category === selectedCategory);

  // Preview audio
  const handlePreview = (track: (typeof AUDIO_LIBRARY)[0]) => {
    if (playingId === track.id) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingId(null);
    } else {
      // Start playing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.src);
      audioRef.current.volume = 0.5;
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(track.id);
    }
  };

  // Set background music for entire story
  const setBackgroundMusic = (src: string) => {
    onUpdateStory({
      audio: {
        src,
        volume: 0.7,
        fadeIn: 1000,
        fadeOut: 1000,
      },
    });
    // Stop preview
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
    }
  };

  // Set audio for current slide only
  const setSlideAudio = (src: string) => {
    onUpdateSlide(currentSlide.id, {
      audio: {
        src,
        volume: 0.8,
        startTime: 0,
      },
    });
    // Stop preview
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
    }
  };

  // Remove background music
  const removeBackgroundMusic = () => {
    onUpdateStory({ audio: undefined });
  };

  // Remove slide audio
  const removeSlideAudio = () => {
    onUpdateSlide(currentSlide.id, { audio: undefined });
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create object URL for local preview
    const url = URL.createObjectURL(file);

    if (activeTab === 'background') {
      setBackgroundMusic(url);
    } else if (activeTab === 'slide') {
      setSlideAudio(url);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle custom URL
  const handleAddCustomUrl = () => {
    if (!customUrl.trim()) return;

    if (activeTab === 'background') {
      setBackgroundMusic(customUrl);
    } else if (activeTab === 'slide') {
      setSlideAudio(customUrl);
    }
    setCustomUrl('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('background')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors ${
            activeTab === 'background'
              ? 'bg-slate-800 text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Music size={14} /> Background
        </button>
        <button
          onClick={() => setActiveTab('slide')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors ${
            activeTab === 'slide'
              ? 'bg-slate-800 text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Music2 size={14} /> This Slide
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors ${
            activeTab === 'library'
              ? 'bg-slate-800 text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Volume2 size={14} /> Library
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Background Music Tab */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-400 mb-2">Background music plays throughout the entire story</div>

            {/* Current background music */}
            {story.audio?.src ? (
              <div className="bg-slate-800 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Music size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Background Music</div>
                      <div className="text-xs text-slate-400 truncate max-w-[150px]">
                        {story.audio.src.split('/').pop() || 'Custom audio'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={removeBackgroundMusic}
                    className="p-2 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Volume control */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Volume</span>
                    <span className="text-xs text-slate-400">{Math.round((story.audio.volume || 0.7) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={(story.audio.volume || 0.7) * 100}
                    onChange={(e) =>
                      onUpdateStory({
                        audio: { ...story.audio!, volume: Number(e.target.value) / 100 },
                      })
                    }
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Fade controls */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Fade In (ms)</label>
                    <input
                      type="number"
                      value={story.audio.fadeIn || 0}
                      onChange={(e) =>
                        onUpdateStory({
                          audio: { ...story.audio!, fadeIn: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Fade Out (ms)</label>
                    <input
                      type="number"
                      value={story.audio.fadeOut || 0}
                      onChange={(e) =>
                        onUpdateStory({
                          audio: { ...story.audio!, fadeOut: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-dashed border-slate-600 rounded-lg p-4 text-center">
                <Music size={24} className="mx-auto text-slate-500 mb-2" />
                <div className="text-sm text-slate-400 mb-3">No background music</div>
                <button onClick={() => setActiveTab('library')} className="text-xs text-blue-400 hover:text-blue-300">
                  Browse library →
                </button>
              </div>
            )}

            {/* Add options */}
            <div className="space-y-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
              >
                <Upload size={16} /> Upload Audio File
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="Or paste audio URL..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder:text-slate-500"
                />
                <button
                  onClick={handleAddCustomUrl}
                  disabled={!customUrl.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Slide Audio Tab */}
        {activeTab === 'slide' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-400 mb-2">Audio for this slide only (overrides background music)</div>

            {/* Current slide audio */}
            {currentSlide.audio?.src ? (
              <div className="bg-slate-800 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <Music2 size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Slide Audio</div>
                      <div className="text-xs text-slate-400 truncate max-w-[150px]">
                        {currentSlide.audio.src.split('/').pop() || 'Custom audio'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={removeSlideAudio}
                    className="p-2 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Volume control */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Volume</span>
                    <span className="text-xs text-slate-400">
                      {Math.round((currentSlide.audio.volume || 0.8) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={(currentSlide.audio.volume || 0.8) * 100}
                    onChange={(e) =>
                      onUpdateSlide(currentSlide.id, {
                        audio: { ...currentSlide.audio!, volume: Number(e.target.value) / 100 },
                      })
                    }
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Start time */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Start Time (seconds)</label>
                  <input
                    type="number"
                    min={0}
                    value={currentSlide.audio.startTime || 0}
                    onChange={(e) =>
                      onUpdateSlide(currentSlide.id, {
                        audio: { ...currentSlide.audio!, startTime: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 border border-dashed border-slate-600 rounded-lg p-4 text-center">
                <Music2 size={24} className="mx-auto text-slate-500 mb-2" />
                <div className="text-sm text-slate-400 mb-3">No audio for this slide</div>
                <button onClick={() => setActiveTab('library')} className="text-xs text-blue-400 hover:text-blue-300">
                  Browse library →
                </button>
              </div>
            )}

            {/* Add options */}
            <div className="space-y-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
              >
                <Upload size={16} /> Upload Audio File
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="Or paste audio URL..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder:text-slate-500"
                />
                <button
                  onClick={handleAddCustomUrl}
                  disabled={!customUrl.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-3">
            {/* Category filter */}
            <div className="flex gap-1 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Track list */}
            <div className="space-y-2">
              {filteredTracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-slate-800 rounded-lg p-2 flex items-center gap-2 group hover:bg-slate-700/80 transition-colors"
                >
                  {/* Play/Pause button */}
                  <button
                    onClick={() => handlePreview(track)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      playingId === track.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }`}
                  >
                    {playingId === track.id ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                  </button>

                  {/* Track info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{track.name}</div>
                    <div className="text-xs text-slate-400">
                      {track.category} • {track.duration}
                    </div>
                  </div>

                  {/* Add buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setBackgroundMusic(track.src)}
                      className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-[10px] transition-colors"
                      title="Set as background music"
                    >
                      BG
                    </button>
                    <button
                      onClick={() => setSlideAudio(track.src)}
                      className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-[10px] transition-colors"
                      title="Add to this slide"
                    >
                      Slide
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="text-[10px] text-slate-500 text-center pt-2">
              Click play to preview • BG = Background music • Slide = This slide only
            </div>
          </div>
        )}
      </div>

      {/* Footer - Audio status */}
      <div className="p-2 border-t border-slate-700 flex items-center gap-2 text-[10px]">
        {story.audio?.src && (
          <div className="flex items-center gap-1 text-purple-400">
            <Volume2 size={12} /> BG Music
          </div>
        )}
        {currentSlide.audio?.src && (
          <div className="flex items-center gap-1 text-green-400">
            <Music2 size={12} /> Slide Audio
          </div>
        )}
        {!story.audio?.src && !currentSlide.audio?.src && (
          <div className="flex items-center gap-1 text-slate-500">
            <VolumeX size={12} /> No audio
          </div>
        )}
      </div>
    </div>
  );
};
