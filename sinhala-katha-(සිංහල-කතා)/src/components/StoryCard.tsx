import { Story, StoryPart } from '../types';
import { Eye, Heart, User, BookOpen, Lock, CheckCircle } from 'lucide-react';

interface StoryCardProps {
  key?: string;
  story: Story;
  onReadPart: (story: Story, part: StoryPart) => void;
  onSelectStory: (story: Story) => void;
  isLiked: boolean;
  onLikeToggle: (storyId: string) => void;
}

export default function StoryCard({
  story,
  onReadPart,
  onSelectStory,
  isLiked,
  onLikeToggle
}: StoryCardProps) {
  const partsCount = story.parts ? story.parts.length : 0;
  
  // Sort parts by partNumber to ensure correct order
  const sortedParts = [...story.parts].sort((a, b) => a.partNumber - b.partNumber);

  return (
    <div 
      id={`story-card-${story.id}`}
      className="bg-[#111] border border-[#222] hover:border-[#c9a86a]/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col group h-full"
    >
      {/* Visual Header / Cover Accent */}
      <div className="h-24 bg-gradient-to-br from-[#1a1a1a] via-[#111] to-[#0a0a0a] relative flex items-center justify-between px-5 border-b border-[#222]">
        <div className="flex gap-2">
          {story.ageRestricted && (
            <span className="bg-[#c9a86a22] border border-[#c9a86a44] text-[10px] text-[#c9a86a] px-2 py-0.5 rounded font-bold tracking-wider flex items-center gap-1">
              <Lock size={10} /> 18+
            </span>
          )}
          {story.isCompleted ? (
            <span className="bg-emerald-950/80 border border-emerald-800/40 text-[10px] text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
              <CheckCircle size={10} /> නිමයි (End)
            </span>
          ) : (
            <span className="bg-[#c9a86a11] border border-[#c9a86a33] text-[10px] text-[#c9a86a] px-2 py-0.5 rounded flex items-center gap-1 font-medium">
              කොටස් වශයෙන් (Ongoing)
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLikeToggle(story.id);
          }}
          className={`p-2 rounded-full transition-all duration-300 cursor-pointer ${
            isLiked 
              ? 'bg-[#c9a86a22] text-[#c9a86a] border border-[#c9a86a44] scale-105' 
              : 'text-gray-500 hover:text-[#c9a86a] hover:bg-[#1a1a1a]'
          }`}
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Story Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Author */}
        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-2">
          <User size={12} />
          <span>{story.author}</span>
        </div>

        {/* Title */}
        <h4 
          onClick={() => onSelectStory(story)}
          className="text-lg font-serif font-bold text-white hover:text-[#c9a86a] cursor-pointer transition-colors line-clamp-1 flex items-center gap-2"
        >
          {story.title}
        </h4>

        {/* Description */}
        <p className="text-gray-400 text-xs line-clamp-2 mt-2 leading-relaxed flex-1">
          {story.description}
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 my-4 pt-4 border-t border-[#222]">
          <div className="flex items-center gap-1">
            <Eye size={12} />
            <span>{story.views} කියවීම්</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart size={12} />
            <span>{story.likes} කැමැත්තන්</span>
          </div>
          <div className="text-[#c9a86a] font-semibold flex items-center gap-1">
            <BookOpen size={12} />
            <span>{partsCount} කොටස් ඇත</span>
          </div>
        </div>

        {/* Story Parts (Multi-part direct access) */}
        {partsCount > 0 ? (
          <div className="bg-[#0a0a0a] p-3 rounded-xl border border-[#222]">
            <div className="text-[10px] text-gray-400 font-semibold mb-2 flex justify-between items-center">
              <span>කොටස් තෝරන්න (Select Parts):</span>
              <span className="bg-[#1a1a1a] text-[#c9a86a] px-1.5 py-0.5 rounded text-[9px] font-mono border border-[#2d2d2d]">
                {partsCount} Chapter{partsCount > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
              {sortedParts.map((part) => (
                <button
                  key={part.id}
                  id={`story-${story.id}-part-${part.partNumber}`}
                  onClick={() => onReadPart(story, part)}
                  className="bg-[#161616] hover:bg-[#222] border border-[#222] text-gray-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex-1 min-w-[70px] text-center transition-all truncate active:scale-95 cursor-pointer"
                  title={part.title}
                >
                  කොටස {part.partNumber}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-gray-600 font-medium">
            තවම කොටස් ඇතුලත් කර නැත.
          </div>
        )}
      </div>

      {/* Bottom Button */}
      <button 
        id={`view-story-btn-${story.id}`}
        onClick={() => onSelectStory(story)}
        className="w-full bg-[#111] hover:bg-[#161616] text-[#c9a86a] hover:text-[#e4cf9c] text-xs font-semibold py-3 border-t border-[#222] transition-colors text-center cursor-pointer"
      >
        සම්පූර්ණ විස්තරය බලන්න →
      </button>
    </div>
  );
}
