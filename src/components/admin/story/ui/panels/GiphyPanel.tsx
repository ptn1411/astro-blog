import { Loader2, Search, TrendingUp, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface GiphyPanelProps {
  onSelectGif: (gifUrl: string) => void;
  onClose?: () => void;
}

interface GiphyGif {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    fixed_height_small: {
      url: string;
    };
    original: {
      url: string;
      width: string;
      height: string;
    };
    preview_gif: {
      url: string;
    };
  };
}

interface GiphyResponse {
  data: GiphyGif[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
}

// GIPHY API Key - You should replace this with your own API key from https://developers.giphy.com/
// For demo purposes, we'll use a limited public beta key
const GIPHY_API_KEY = 'NA33w107vIO9AXKq9tY6JmW4vx7UW0cI'; // Public beta key for testing

const CATEGORIES = [
  { id: 'trending', label: 'Trending', icon: <TrendingUp size={14} /> },
  { id: 'reactions', label: 'Reactions', query: 'reactions' },
  { id: 'love', label: 'Love', query: 'love heart' },
  { id: 'happy', label: 'Happy', query: 'happy excited' },
  { id: 'sad', label: 'Sad', query: 'sad crying' },
  { id: 'funny', label: 'Funny', query: 'funny lol' },
  { id: 'wow', label: 'Wow', query: 'wow amazing' },
  { id: 'celebrate', label: 'Celebrate', query: 'celebrate party' },
  { id: 'thumbsup', label: 'Thumbs Up', query: 'thumbs up approve' },
  { id: 'clap', label: 'Clap', query: 'clapping applause' },
];

export const GiphyPanel: React.FC<GiphyPanelProps> = ({ onSelectGif, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 20;

  // Fetch trending GIFs
  const fetchTrending = useCallback(async (newOffset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${LIMIT}&offset=${newOffset}&rating=g`
      );
      const data: GiphyResponse = await response.json();

      if (newOffset === 0) {
        setGifs(data.data);
      } else {
        setGifs((prev) => [...prev, ...data.data]);
      }
      setHasMore(data.pagination.count === LIMIT);
      setOffset(newOffset);
    } catch (err) {
      setError('Failed to load GIFs. Please try again.');
      console.error('GIPHY Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search GIFs
  const searchGifs = useCallback(
    async (query: string, newOffset = 0) => {
      if (!query.trim()) {
        fetchTrending(0);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${LIMIT}&offset=${newOffset}&rating=g&lang=en`
        );
        const data: GiphyResponse = await response.json();

        if (newOffset === 0) {
          setGifs(data.data);
        } else {
          setGifs((prev) => [...prev, ...data.data]);
        }
        setHasMore(data.pagination.count === LIMIT);
        setOffset(newOffset);
      } catch (err) {
        setError('Failed to search GIFs. Please try again.');
        console.error('GIPHY Error:', err);
      } finally {
        setLoading(false);
      }
    },
    [fetchTrending]
  );

  // Initial load
  useEffect(() => {
    fetchTrending(0);
  }, [fetchTrending]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchGifs(searchQuery, 0);
      } else if (selectedCategory === 'trending') {
        fetchTrending(0);
      } else {
        const category = CATEGORIES.find((c) => c.id === selectedCategory);
        if (category && 'query' in category && category.query) {
          searchGifs(category.query, 0);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, searchGifs, fetchTrending]);

  // Handle category click
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
    setOffset(0);

    if (categoryId === 'trending') {
      fetchTrending(0);
    } else {
      const category = CATEGORIES.find((c) => c.id === categoryId);
      if (category && 'query' in category && category.query) {
        searchGifs(category.query, 0);
      }
    }
  };

  // Load more
  const loadMore = () => {
    const newOffset = offset + LIMIT;
    if (searchQuery) {
      searchGifs(searchQuery, newOffset);
    } else if (selectedCategory === 'trending') {
      fetchTrending(newOffset);
    } else {
      const category = CATEGORIES.find((c) => c.id === selectedCategory);
      if (category && 'query' in category && category.query) {
        searchGifs(category.query, newOffset);
      }
    }
  };

  // Handle GIF selection
  const handleSelectGif = (gif: GiphyGif) => {
    // Use fixed_height for good quality while keeping size reasonable
    onSelectGif(gif.images.fixed_height.url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="https://media.giphy.com/channel_assets/originals/powered_by_giphy.gif"
            alt="Powered by GIPHY"
            className="h-5"
          />
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-700">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="px-3 py-2 border-b border-slate-700 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors flex items-center gap-1 whitespace-nowrap ${
                selectedCategory === category.id && !searchQuery
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {'icon' in category && category.icon}
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* GIF Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {error && (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => fetchTrending(0)} className="mt-2 text-blue-400 text-sm hover:underline">
              Try again
            </button>
          </div>
        )}

        {!error && gifs.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">No GIFs found</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {gifs.map((gif) => (
            <button
              key={gif.id}
              onClick={() => handleSelectGif(gif)}
              className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all group"
            >
              <img
                src={gif.images.fixed_height_small.url}
                alt={gif.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium">Add</span>
              </div>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 size={24} className="animate-spin text-blue-400" />
          </div>
        )}

        {/* Load More */}
        {!loading && hasMore && gifs.length > 0 && (
          <button
            onClick={loadMore}
            className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
          >
            Load More
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-700 text-center">
        <a
          href="https://giphy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-slate-500 hover:text-slate-400"
        >
          Powered by GIPHY
        </a>
      </div>
    </div>
  );
};
