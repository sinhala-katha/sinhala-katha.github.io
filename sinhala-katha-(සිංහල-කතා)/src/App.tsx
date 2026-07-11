import { useState, useEffect } from 'react';
import { Category, Story, StoryPart, User } from './types';
import Navbar from './components/Navbar';
import CategoryList from './components/CategoryList';
import StoryCard from './components/StoryCard';
import StoryReader from './components/StoryReader';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import LuxuryDashboard from './components/LuxuryDashboard';
import { 
  AdBanner300x250, 
  AdBanner320x50, 
  AdNativeBanner, 
  SmartlinkButton 
} from './components/AdWidgets';
import { ShieldCheck, Heart, Search, Sparkles, BookOpen, User as UserIcon } from 'lucide-react';
import { 
  seedDatabaseIfEmpty, 
  listenToCategories, 
  listenToStories,
  addCategory as dbAddCategory,
  deleteCategory as dbDeleteCategory,
  addStory as dbAddStory,
  deleteStory as dbDeleteStory,
  updateStoryParts as dbUpdateStoryParts,
  incrementViews as dbIncrementViews,
  toggleStoryLike as dbToggleStoryLike,
  getUserProfile,
  listenToUserProfile
} from './firebase';
import { INITIAL_CATEGORIES, INITIAL_STORIES } from './data/initialData';

export default function App() {
  // State variables
  const [categories, setCategories] = useState<Category[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [user, setUser] = useState<User | null>(null);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedPart, setSelectedPart] = useState<StoryPart | null>(null);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // 1. Load Initial Data and listen to updates in Real-time from Firestore on Mount
  useEffect(() => {
    let unsubscribeCats: (() => void) | undefined;
    let unsubscribeStories: (() => void) | undefined;

    const setupDatabase = async () => {
      try {
        // First, ensure initial seed data exists if Firestore collections are completely empty
        await seedDatabaseIfEmpty();
      } catch (e) {
        // Silent catch
      }

      try {
        // Listen to Category snapshots in real-time
        unsubscribeCats = listenToCategories((fetchedCats) => {
          if (fetchedCats && fetchedCats.length > 0) {
            setCategories(fetchedCats);
          } else {
            setCategories(INITIAL_CATEGORIES);
          }
        });
      } catch (e) {
        setCategories(INITIAL_CATEGORIES);
      }

      try {
        // Listen to Story snapshots in real-time
        unsubscribeStories = listenToStories((fetchedStories) => {
          if (fetchedStories && fetchedStories.length > 0) {
            setStories(fetchedStories);
          } else {
            setStories(INITIAL_STORIES);
          }
        });
      } catch (e) {
        setStories(INITIAL_STORIES);
      }
    };

    setupDatabase();

    // Active logged-in user
    const storedUser = localStorage.getItem('rasa_katha_current_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.username) {
          setUser(parsedUser);
          // Fetch latest liked stories in background to sync state
          getUserProfile(parsedUser.username).then((profile) => {
            if (profile) {
              const syncedUser: User = {
                username: profile.username,
                email: profile.email,
                isAdmin: !!profile.isAdmin,
                likedStories: profile.likedStories || [],
                isVip: !!profile.isVip,
                subscriptionType: profile.subscriptionType || 'none',
                subscriptionDate: profile.subscriptionDate || '',
                hasPartnerAccess: !!profile.hasPartnerAccess,
                hasMoviesAccess: !!profile.hasMoviesAccess,
                hasVideosAccess: !!profile.hasVideosAccess
              };
              setUser(syncedUser);
              localStorage.setItem('rasa_katha_current_user', JSON.stringify(syncedUser));
            }
          }).catch((err) => {
            // Silent catch
          });
        }
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem('rasa_katha_current_user');
      }
    }

    return () => {
      if (unsubscribeCats) unsubscribeCats();
      if (unsubscribeStories) unsubscribeStories();
    };
  }, []);

  // Listen to the active logged-in user's document in real-time
  useEffect(() => {
    if (!user?.username) return;

    const unsubscribe = listenToUserProfile(user.username, (profile) => {
      if (profile) {
        const syncedUser: User = {
          username: profile.username,
          email: profile.email,
          isAdmin: !!profile.isAdmin,
          likedStories: profile.likedStories || [],
          isVip: !!profile.isVip,
          subscriptionType: profile.subscriptionType || 'none',
          subscriptionDate: profile.subscriptionDate || '',
          hasPartnerAccess: !!profile.hasPartnerAccess,
          hasMoviesAccess: !!profile.hasMoviesAccess,
          hasVideosAccess: !!profile.hasVideosAccess,
          paymentNotification: profile.paymentNotification || null
        };

        // Update local state and localStorage if changed
        const currentStored = localStorage.getItem('rasa_katha_current_user');
        let parsedStored = null;
        try {
          parsedStored = currentStored ? JSON.parse(currentStored) : null;
        } catch (e) {
          console.error("Error parsing currentStored:", e);
        }

        if (
          !parsedStored ||
          parsedStored.isVip !== syncedUser.isVip ||
          parsedStored.subscriptionType !== syncedUser.subscriptionType ||
          parsedStored.hasPartnerAccess !== syncedUser.hasPartnerAccess ||
          parsedStored.hasMoviesAccess !== syncedUser.hasMoviesAccess ||
          parsedStored.hasVideosAccess !== syncedUser.hasVideosAccess ||
          JSON.stringify(parsedStored.paymentNotification) !== JSON.stringify(syncedUser.paymentNotification) ||
          JSON.stringify(parsedStored.likedStories) !== JSON.stringify(syncedUser.likedStories)
        ) {
          setUser(syncedUser);
          localStorage.setItem('rasa_katha_current_user', JSON.stringify(syncedUser));
        }
      }
    });

    return () => unsubscribe();
  }, [user?.username]);

  // Sync selected story with real-time updates (e.g. newly added chapters, changed likes/views, or deletion)
  useEffect(() => {
    if (selectedStory) {
      const updated = stories.find((s) => s.id === selectedStory.id);
      if (updated) {
        setSelectedStory(updated);
        // If the active part was updated or no longer exists, handle it gracefully
        if (selectedPart) {
          const matchingPart = updated.parts.find((p) => p.id === selectedPart.id);
          if (matchingPart) {
            setSelectedPart(matchingPart);
          }
        }
      } else {
        // Story deleted by admin
        setSelectedStory(null);
        setSelectedPart(null);
      }
    }
  }, [stories, selectedStory?.id]);

  // 2. Authentication handlers
  const handleAuthSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('rasa_katha_current_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    setShowAdminPanel(false);
    localStorage.removeItem('rasa_katha_current_user');
  };

  // 3. Admin Panel mutations
  const handleAddCategory = async (newCat: Category) => {
    try {
      await dbAddCategory(newCat);
    } catch (err) {
      console.error("Error adding category:", err);
    }
  };

  const handleAddStory = async (newStory: Story) => {
    try {
      await dbAddStory(newStory);
    } catch (err) {
      console.error("Error adding story:", err);
    }
  };

  const handleUpdateStoryParts = async (storyId: string, parts: StoryPart[]) => {
    try {
      await dbUpdateStoryParts(storyId, parts);
    } catch (err) {
      console.error("Error updating story parts:", err);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await dbDeleteStory(storyId);
    } catch (err) {
      console.error("Error deleting story:", err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await dbDeleteCategory(categoryId);
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null);
      }
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  // 4. Interactive user operations
  const handleLikeToggle = async (storyId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const hasLiked = user.likedStories.includes(storyId);
    const updatedLikedStories = hasLiked
      ? user.likedStories.filter((id) => id !== storyId)
      : [...user.likedStories, storyId];

    // Optimistically update active client user profile state
    const updatedUser = { ...user, likedStories: updatedLikedStories };
    setUser(updatedUser);
    localStorage.setItem('rasa_katha_current_user', JSON.stringify(updatedUser));

    try {
      await dbToggleStoryLike(storyId, user.username, !hasLiked);
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleReadPart = async (story: Story, part: StoryPart) => {
    setSelectedStory({ ...story, views: story.views + 1 });
    setSelectedPart(part);
    setShowAdminPanel(false);

    try {
      await dbIncrementViews(story.id);
    } catch (err) {
      console.error("Error incrementing views:", err);
    }
  };

  const handleSelectStory = (story: Story) => {
    setSelectedStory(story);
    // Automatically select the first part if available
    if (story.parts && story.parts.length > 0) {
      const sorted = [...story.parts].sort((a, b) => a.partNumber - b.partNumber);
      setSelectedPart(sorted[0]);
    } else {
      setSelectedPart(null);
    }
    setShowAdminPanel(false);
  };

  // Filter logic
  const filteredStories = stories.filter((story) => {
    const isApproved = story.approved !== false;
    const isMyStory = user && story.submittedBy === user.username;
    const canSee = isApproved || (user && user.isAdmin) || isMyStory;
    if (!canSee) return false;

    const matchesCategory = selectedCategoryId ? story.categoryId === selectedCategoryId : true;
    const matchesSearch = searchQuery.trim()
      ? story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.author.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-[#c9a86a]/30 selection:text-white flex flex-col">
      {/* Navbar Component */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        showAdminPanel={showAdminPanel}
        onToggleAdminPanel={(show) => {
          setShowAdminPanel(show);
          if (show) {
            setSelectedStory(null);
            setSelectedPart(null);
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW 1: ADMIN CREATOR PANEL */}
        {showAdminPanel && user?.isAdmin ? (
          <div className="space-y-4">
            {/* Quick Back to home trigger */}
            <div className="flex justify-start">
              <button
                id="admin-home-back-btn"
                onClick={() => setShowAdminPanel(false)}
                className="text-xs bg-[#111] hover:bg-[#161616] border border-[#222] px-4 py-2.5 rounded-xl text-gray-300 hover:text-white transition-colors cursor-pointer font-bold"
              >
                ← මුල් පිටුවට යන්න (Back to Home)
              </button>
            </div>
            
            <AdminPanel
              categories={categories}
              stories={stories}
              onAddCategory={handleAddCategory}
              onAddStory={handleAddStory}
              onUpdateStoryParts={handleUpdateStoryParts}
              onDeleteStory={handleDeleteStory}
              onDeleteCategory={handleDeleteCategory}
              onLogoutAdmin={() => setShowAdminPanel(false)}
            />
          </div>
        ) : selectedStory && selectedPart ? (
          
          /* VIEW 2: ACTIVE STORY READING PAGE */
          <StoryReader
            story={selectedStory}
            currentPart={selectedPart}
            user={user}
            onBack={() => {
              setSelectedStory(null);
              setSelectedPart(null);
            }}
            onSelectPart={(part) => setSelectedPart(part)}
          />
        ) : user && !user.isAdmin ? (
          
          /* VIEW 3: LUXURY DASHBOARD FOR LOGGED IN REGISTERED USERS */
          <LuxuryDashboard
            user={user}
            stories={stories}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onReadPart={handleReadPart}
            onSelectStory={handleSelectStory}
            onLikeToggle={handleLikeToggle}
            onUpdateUserSession={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('rasa_katha_current_user', JSON.stringify(updatedUser));
            }}
          />
        ) : (
          
          /* VIEW 4: STORIES HUB (HOME / DISCOVER VIEW) FOR GUESTS */
          <div className="space-y-8" id="stories-hub-view">
            
            {/* Hero / Warning Welcome Banner */}
            <div className="relative bg-gradient-to-r from-[#111] via-[#0d0d0d] to-[#141414] rounded-3xl p-6 md:p-10 border border-[#222] overflow-hidden shadow-2xl">
              <div className="absolute right-0 top-0 w-80 h-80 bg-[#c9a86a]/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-1.5 bg-[#161616] border border-[#2d2d2d] text-[#c9a86a] font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider mb-4 font-mono">
                  <Sparkles size={12} className="text-[#c9a86a] animate-pulse" />
                  නවතම සිංහල කතන්දර එකතුව
                </div>
                <h2 className="text-2xl md:text-4xl font-serif font-bold text-white leading-tight tracking-tight">
                  හදවත සසල කරන, ਰහසිගත ආදරණීය කතන්දර ලෝකය
                </h2>
                <p className="text-gray-400 text-xs md:text-sm mt-3 leading-relaxed">
                  වැඩිහිටි සමාජයට ගැලපෙන රසවත් ආදර කතා, කුතුහලයෙන් පිරුණු අභිරහස් සහ යථාර්ථවාදී ජීවිත අත්දැකීම් ඇතුලත් කතා මාලා රැසක් මෙහිදී ඔබට නොමිලේම කියවිය හැක.
                </p>

                {/* Direct quick-access key metric statistics counters */}
                <div className="mt-6 flex flex-wrap gap-4 text-xs">
                  <div className="bg-[#0a0a0a] border border-[#222] px-3.5 py-2 rounded-xl text-[#c9a86a] font-semibold flex items-center gap-2">
                    <BookOpen size={14} className="text-[#c9a86a]" />
                    <span>කතා මාලා: <strong className="text-white font-extrabold">{stories.length}</strong></span>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#222] px-3.5 py-2 rounded-xl text-[#c9a86a] font-semibold flex items-center gap-2">
                    <Heart size={14} className="text-[#c9a86a]" />
                    <span>සක්‍රීය සාමාජිකයින්: <strong className="text-white font-extrabold">2,400+</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* High CTR Adsterra Smartlink & 320x50 Banner Ads */}
            <div className="grid md:grid-cols-3 gap-4 items-stretch">
              <div className="md:col-span-2">
                <SmartlinkButton type="hot-stories" />
              </div>
              <div className="bg-[#111] border border-[#222] rounded-2xl p-2 flex items-center justify-center">
                <AdBanner320x50 isVip={false} />
              </div>
            </div>

            {/* Category / Menu selectors */}
            <CategoryList
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />

            {/* Filter Search Bar & Info Grid */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#111] p-4 rounded-2xl border border-[#222]">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 text-[#c9a86a]" size={16} />
                <input
                  id="story-search-input"
                  type="text"
                  placeholder="කතාවේ නම, කර්තෘ හෝ විස්තර අනුව සොයන්න..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                />
              </div>

              {/* Reset active filters display */}
              {(selectedCategoryId || searchQuery) && (
                <button
                  id="reset-search-filters"
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-[#c9a86a] hover:text-[#bba061] underline decoration-dotted underline-offset-4 cursor-pointer"
                >
                  සෙවුම් පෙරහන් ඉවත් කරන්න
                </button>
              )}
            </div>

            {/* Stories Grid Listing */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-serif font-bold tracking-wider text-[#c9a86a] uppercase">
                  {selectedCategoryId 
                    ? `${categories.find(c => c.id === selectedCategoryId)?.name || ''} කාණ්ඩයේ කතා`
                    : 'සියලුම කතාංග එකතුව (Story Releases)'}
                </h3>
                <span className="text-xs text-gray-500">
                  කතා {filteredStories.length} ක් හමු විය
                </span>
              </div>

              {filteredStories.length === 0 ? (
                <div className="text-center py-16 bg-[#111] border border-[#222] rounded-2xl">
                  <p className="text-xs text-gray-500 font-medium">පෙරහනට ගැලපෙන කතා කිසිවක් හමු නොවීය. කරුණාකර වෙනත් කාණ්ඩයක් තෝරන්න.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredStories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onReadPart={handleReadPart}
                      onSelectStory={handleSelectStory}
                      isLiked={user ? user.likedStories.includes(story.id) : false}
                      onLikeToggle={handleLikeToggle}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Middle/Bottom Ad Layout for High CTR */}
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <AdBanner300x250 isVip={false} />
              <SmartlinkButton type="lottery" />
            </div>

            <AdNativeBanner isVip={false} />

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#0d0d0d] border-t border-[#222] py-8 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex flex-wrap justify-center gap-6 text-[11px] text-gray-400">
            <button onClick={() => { setSelectedCategoryId(null); setShowAdminPanel(false); setSelectedStory(null); }} className="hover:text-[#c9a86a] cursor-pointer">මුල් පිටුව</button>
            <span>•</span>
            <span className="text-[#c9a86a] font-serif font-bold">18+ වැඩිහිටියන්ට පමණක් සීමා වේ</span>
          </div>
          <p>© 2026 සිංහල කතා (Sinhala Katha). සියලුම හිමිකම් ඇවිරිණි.</p>
        </div>
      </footer>

      {/* Authentication Popup Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
