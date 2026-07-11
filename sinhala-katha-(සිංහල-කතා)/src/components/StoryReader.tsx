import React, { useState, useEffect } from 'react';
import { Story, StoryPart, User, Comment } from '../types';
import { ArrowLeft, BookOpen, Clock, MessageSquare, ChevronLeft, ChevronRight, User as UserIcon, Send, ZoomIn, ZoomOut } from 'lucide-react';
import { 
  AdBanner300x250, 
  AdBanner320x50, 
  AdNativeBanner, 
  SmartlinkButton 
} from './AdWidgets';

interface StoryReaderProps {
  story: Story;
  currentPart: StoryPart;
  user: User | null;
  onBack: () => void;
  onSelectPart: (part: StoryPart) => void;
}

export default function StoryReader({
  story,
  currentPart,
  user,
  onBack,
  onSelectPart
}: StoryReaderProps) {
  const [fontSize, setFontSize] = useState<number>(18); // Default 18px for readability
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const sortedParts = [...story.parts].sort((a, b) => a.partNumber - b.partNumber);
  const currentIndex = sortedParts.findIndex((p) => p.id === currentPart.id);
  const prevPart = currentIndex > 0 ? sortedParts[currentIndex - 1] : null;
  const nextPart = currentIndex < sortedParts.length - 1 ? sortedParts[currentIndex + 1] : null;

  // Load comments
  useEffect(() => {
    const storedComments = localStorage.getItem('rasa_katha_comments');
    if (storedComments) {
      try {
        const allComments: Comment[] = JSON.parse(storedComments);
        const storyComments = allComments.filter((c) => c.storyId === story.id);
        setComments(storyComments);
      } catch (e) {
        console.error("Error parsing stored comments:", e);
        setComments([]);
      }
    } else {
      // Mock initial comments for realism
      const initialComments: Comment[] = [
        {
          id: 'cmt-1',
          storyId: 'story-sanda-pini',
          username: 'නදීෂා දර්ශනී',
          text: 'ඇත්තටම ගොඩක් ලස්සන ආදරණීය කතාවක්. ඊළඟ කොටස ඉක්මනින්ම දාන්න කෝ.',
          addedDate: '2026-07-04'
        },
        {
          id: 'cmt-2',
          storyId: 'story-sanda-pini',
          username: 'රුවන් කුමාර',
          text: 'කෝපි සුවඳ කතාව කියවද්දී මටත් අපේ පරණ මතකයක් මතක් වුනා. ලස්සනට ලියලා තියෙනවා.',
          addedDate: '2026-07-05'
        }
      ];
      localStorage.setItem('rasa_katha_comments', JSON.stringify(initialComments));
      setComments(initialComments.filter((c) => c.storyId === story.id));
    }
  }, [story.id]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const storedComments = localStorage.getItem('rasa_katha_comments');
    let allComments: Comment[] = [];
    try {
      allComments = storedComments ? JSON.parse(storedComments) : [];
    } catch (e) {
      console.error("Error parsing comments in handleAddComment:", e);
    }

    const newComment: Comment = {
      id: `cmt-${Date.now()}`,
      storyId: story.id,
      username: user ? user.username : 'නොදන්නා පරිශීලකයා (Guest)',
      text: commentText,
      addedDate: new Date().toISOString().split('T')[0]
    };

    allComments.push(newComment);
    localStorage.setItem('rasa_katha_comments', JSON.stringify(allComments));
    setComments([...comments, newComment]);
    setCommentText('');
    setSuccessMsg('ප්‍රතිචාරය සාර්ථකව එක් කරන ලදී!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div id="story-reader-container" className="max-w-4xl mx-auto px-4 py-6">
      
      {/* Back & Reader Settings Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#222]">
        <button
          id="reader-back-btn"
          onClick={onBack}
          className="flex items-center gap-2 text-[#c9a86a] hover:text-[#e4cf9c] font-semibold text-xs py-2 px-4 rounded-xl bg-[#111] hover:bg-[#1a1a1a] border border-[#222] transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          නැවත පිටුවට (Go Back)
        </button>

        {/* Font size controllers */}
        <div className="flex items-center gap-2 bg-[#111] border border-[#222] px-3 py-1.5 rounded-xl">
          <span className="text-[10px] text-gray-400 font-medium mr-1 uppercase">අකුරු ප්‍රමාණය (Font Size):</span>
          <button
            id="font-decrease-btn"
            onClick={() => setFontSize(Math.max(14, fontSize - 2))}
            className="p-1 text-gray-400 hover:text-[#c9a86a] rounded hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            title="අකුරු කුඩා කරන්න"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-bold text-white w-6 text-center">{fontSize}px</span>
          <button
            id="font-increase-btn"
            onClick={() => setFontSize(Math.min(26, fontSize + 2))}
            className="p-1 text-gray-400 hover:text-[#c9a86a] rounded hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            title="අකුරු විශාල කරන්න"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* Main Story Paper Container */}
      <div className="bg-[#111] border border-[#222] rounded-2xl shadow-2xl p-6 md:p-10 mb-8 relative overflow-hidden">
        {/* Subtle decorative background watermarks */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#c9a86a]/3 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-[#c9a86a]/2 rounded-full blur-3xl pointer-events-none"></div>

        {/* Story Metadata */}
        <div className="relative z-10">
          {/* Top Non-Disruptive Ad Segment for high CPM */}
          <div className="mb-6 flex justify-center bg-[#0a0a0a] p-2 rounded-xl border border-[#222]">
            <AdBanner320x50 isVip={user?.isVip || false} />
          </div>

          <div className="flex items-center gap-2 text-gray-400 text-xs mb-3 font-semibold">
            <span className="bg-[#1a1a1a] border border-[#2d2d2d] text-[#c9a86a] px-2.5 py-1 rounded-lg uppercase">
              {story.title}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {currentPart.addedDate}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight mb-2">
            {currentPart.title}
          </h1>
          <p className="text-xs text-gray-400 mb-6 flex items-center gap-1 font-medium">
            <UserIcon size={12} /> කර්තෘ (Author): <span className="text-[#c9a86a] font-serif italic ml-1">{story.author}</span>
          </p>

          {/* Chapter Selector Dropdown / Pills */}
          {story.parts.length > 1 && (
            <div className="bg-[#0a0a0a] p-3 rounded-xl border border-[#222] mb-8">
              <div className="text-[10px] text-gray-400 font-semibold mb-2">සියලුම කොටස් අතරින් තෝරන්න (Choose Parts):</div>
              <div className="flex flex-wrap gap-2">
                {sortedParts.map((p) => (
                  <button
                    key={p.id}
                    id={`reader-part-selector-${p.partNumber}`}
                    onClick={() => onSelectPart(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      p.id === currentPart.id
                        ? 'bg-[#c9a86a] text-black border border-[#c9a86a] shadow-md shadow-[#c9a86a33]'
                        : 'bg-[#161616] hover:bg-[#222] text-gray-300 border border-[#222]'
                    }`}
                  >
                    කොටස {p.partNumber}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Core Content Body with Adjustable Font Size */}
          <div 
            id="story-text-body"
            className="text-gray-200 leading-relaxed font-sans space-y-6 whitespace-pre-line tracking-wide"
            style={{ fontSize: `${fontSize}px` }}
          >
            {currentPart.content}
          </div>

          {/* Reader In-article Ad Placement */}
          <div className="mt-8 pt-6 border-t border-[#222]/50 space-y-6">
            <div className="grid md:grid-cols-2 gap-4 items-center">
              <AdBanner300x250 isVip={user?.isVip || false} />
              <SmartlinkButton type="hot-stories" />
            </div>
            <AdNativeBanner isVip={user?.isVip || false} />
          </div>

          {/* Content Footer End Indicator */}
          <div className="mt-12 mb-8 flex items-center justify-center gap-4">
            <div className="h-[1px] bg-[#222] flex-1"></div>
            <div className="text-[#c9a86a] font-serif italic text-xs tracking-widest flex items-center gap-2">
              <BookOpen size={14} /> - සමාප්තයි -
            </div>
            <div className="h-[1px] bg-[#222] flex-1"></div>
          </div>

          {/* Pagination Controllers */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#222]">
            {prevPart ? (
              <button
                id="prev-part-btn"
                onClick={() => onSelectPart(prevPart)}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-[#161616] hover:bg-[#222] text-gray-200 hover:text-white text-xs font-bold border border-[#222] transition-all active:scale-95 cursor-pointer"
              >
                <ChevronLeft size={16} />
                පෙර කොටස
              </button>
            ) : (
              <div className="flex-1"></div>
            )}

            {nextPart ? (
              <button
                id="next-part-btn"
                onClick={() => onSelectPart(nextPart)}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-[#c9a86a] hover:bg-[#bba061] text-black text-xs font-bold border border-[#c9a86a] shadow-lg shadow-[#c9a86a33] transition-all active:scale-95 cursor-pointer"
              >
                ඊළඟ කොටස
                <ChevronRight size={16} />
              </button>
            ) : (
              <div className="flex-1 text-right">
                <span className="text-[10px] bg-[#c9a86a11] border border-[#c9a86a33] text-[#c9a86a] px-3 py-1.5 rounded-lg font-bold">
                  අවසන් කොටසයි 🎉
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Social / Comment Section */}
      <div className="bg-[#111] border border-[#222] rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex items-center gap-2 text-white font-serif font-bold mb-6">
          <MessageSquare size={18} className="text-[#c9a86a]" />
          <h3>කතාව පිළිබඳ ප්‍රතිචාර (Comments & Reviews)</h3>
          <span className="text-xs bg-[#0a0a0a] border border-[#222] text-[#c9a86a] px-2 py-0.5 rounded-md font-bold font-mono">
            {comments.length}
          </span>
        </div>

        {/* Comment input form */}
        <form onSubmit={handleAddComment} className="mb-6 space-y-3">
          {successMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs rounded-xl">
              {successMsg}
            </div>
          )}
          <div className="relative">
            <textarea
              id="comment-text-area"
              placeholder={user ? "මෙම කතාව ගැන ඔබේ අදහස මෙහි සටහන් කරන්න..." : "ප්‍රතිචාර දැක්වීම සඳහා කරුණාකර පළමුව ලොග් වන්න..."}
              disabled={!user}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl text-white placeholder-gray-600 p-4 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500">
              {user ? `ලොග් වී ඇත්තේ: ${user.username}` : 'අදහස් දැක්වීමට ලොග් විය යුතුය.'}
            </span>
            <button
              id="submit-comment-btn"
              type="submit"
              disabled={!user || !commentText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#c9a86a] hover:bg-[#bba061] disabled:bg-[#1a1a1a] disabled:text-gray-600 disabled:border-[#222] text-black text-xs font-bold rounded-lg transition-colors cursor-pointer border border-transparent"
            >
              <Send size={12} />
              ප්‍රතිචාරය පළ කරන්න
            </button>
          </div>
        </form>

        {/* Comments list */}
        <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-1">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="bg-[#0a0a0a] p-4 rounded-xl border border-[#222]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[10px] font-bold text-[#c9a86a] border border-[#222] uppercase">
                      {comment.username.slice(0, 2)}
                    </div>
                    <span className="text-xs font-bold text-gray-200">{comment.username}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{comment.addedDate}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line pl-8">
                  {comment.text}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-gray-600">
              තවමත් කිසිදු අදහසක් පළ කර නැත. මුලින්ම ප්‍රතිචාරයක් දක්වන්න!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
