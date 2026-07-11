import React, { useState, useEffect } from 'react';
import { Category, Story, StoryPart, VipMedia, PartnerProfile, PaymentSubmission } from '../types';
import { 
  PlusCircle, FolderPlus, BookOpen, Trash2, Layers, Check, 
  ShieldAlert, LogOut, ChevronRight, LayoutDashboard, Film, Video, Users, Search,
  Heart, Settings, Code, ShieldCheck
} from 'lucide-react';
import { 
  addVipMedia, 
  deleteVipMedia, 
  listenToVipMedia, 
  listenToUsers, 
  updateUserVipStatus,
  listenToPartnerProfiles,
  deletePartnerProfile,
  updatePartnerProfileApproval,
  approveStory,
  listenToPaymentSubmissions,
  updatePaymentSubmissionStatus,
  updateUserPaymentNotification
} from '../firebase';
import { getAdConfig, saveAdConfig, AdConfig } from './AdWidgets';

interface AdminPanelProps {
  categories: Category[];
  stories: Story[];
  onAddCategory: (category: Category) => void;
  onAddStory: (story: Story) => void;
  onUpdateStoryParts: (storyId: string, parts: StoryPart[]) => void;
  onDeleteStory: (storyId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onLogoutAdmin: () => void;
}

export default function AdminPanel({
  categories,
  stories,
  onAddCategory,
  onAddStory,
  onUpdateStoryParts,
  onDeleteStory,
  onDeleteCategory,
  onLogoutAdmin
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'add-story' | 'add-part' | 'manage-stories' | 'manage-media' | 'manage-users' | 'manage-ads' | 'manage-partners' | 'user-stories' | 'manage-payments'>('manage-payments');
  
  // Real-time VIP Media and User list state
  const [vipMediaList, setVipMediaList] = useState<VipMedia[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [partnerProfiles, setPartnerProfiles] = useState<PartnerProfile[]>([]);
  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmission[]>([]);

  // Ad Codes Form State
  const [banner300Key, setBanner300Key] = useState('');
  const [banner320Key, setBanner320Key] = useState('');
  const [nativeId, setNativeId] = useState('');
  const [smartlinkUrl, setSmartlinkUrl] = useState('');
  const [socialBarUrl, setSocialBarUrl] = useState('');

  // VIP Media Form State
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDesc, setMediaDesc] = useState('');
  const [mediaEmbedCode, setMediaEmbedCode] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'movie'>('video');

  // Load VIP Media and Users List in real-time
  useEffect(() => {
    const unsubMedia = listenToVipMedia((data) => {
      setVipMediaList(data);
    });
    const unsubUsers = listenToUsers((data) => {
      setUsersList(data);
    });
    const unsubPartners = listenToPartnerProfiles((data) => {
      setPartnerProfiles(data);
    });
    const unsubPayments = listenToPaymentSubmissions((data) => {
      setPaymentSubmissions(data);
    });

    // Load Ad Configs
    const config = getAdConfig();
    setBanner300Key(config.banner300x250_key);
    setBanner320Key(config.banner320x50_key);
    setNativeId(config.native_id);
    setSmartlinkUrl(config.smartlink_url);
    setSocialBarUrl(config.social_bar_url);

    return () => {
      unsubMedia();
      unsubUsers();
      unsubPartners();
      unsubPayments();
    };
  }, []);
  
  // Category Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  
  // Story Form State
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDesc, setStoryDesc] = useState('');
  const [storyCatId, setStoryCatId] = useState(categories[0]?.id || '');
  const [storyAuthor, setStoryAuthor] = useState('');
  const [storyAgeLimit, setStoryAgeLimit] = useState(true);
  const [storyCompleted, setStoryCompleted] = useState(false);
  
  // Chapter Form State
  const [selectedStoryId, setSelectedStoryId] = useState(stories[0]?.id || '');
  const [partTitle, setPartTitle] = useState('');
  const [partContent, setPartContent] = useState('');
  const [partNum, setPartNum] = useState<number>(1);

  // Status Messaging State
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
  };

  // 1. Submit Category
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showStatus('error', 'කාණ්ඩයේ නම ඇතුලත් කිරීම අනිවාර්ය වේ.');
      return;
    }

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: catName,
      description: catDesc
    };

    onAddCategory(newCat);
    setCatName('');
    setCatDesc('');
    showStatus('success', 'නව කාණ්ඩය සාර්ථකව එක් කරන ලදී!');
  };

  // 2. Submit Story
  const handleAddStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyTitle.trim() || !storyDesc.trim() || !storyAuthor.trim()) {
      showStatus('error', 'කරුණාකර සියලුම අත්‍යවශ්‍ය ක්ෂේත්‍ර පුරවන්න.');
      return;
    }

    const newStory: Story = {
      id: `story-${Date.now()}`,
      title: storyTitle,
      description: storyDesc,
      categoryId: storyCatId || categories[0]?.id || '',
      parts: [],
      author: storyAuthor,
      views: 0,
      likes: 0,
      ageRestricted: storyAgeLimit,
      isCompleted: storyCompleted,
      addedDate: new Date().toISOString().split('T')[0]
    };

    onAddStory(newStory);
    
    // Auto-select this story in Chapter Tab for ease
    setSelectedStoryId(newStory.id);
    
    // Reset Form
    setStoryTitle('');
    setStoryDesc('');
    setStoryAuthor('');
    setStoryCompleted(false);
    
    showStatus('success', 'නව කතාව සාර්ථකව ලියාපදිංචි කරන ලදී! දැන් එයට කොටස් එකතු කරන්න.');
    setActiveTab('add-part');
  };

  // 3. Submit Story Part (Chapter)
  const handleAddPartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoryId) {
      showStatus('error', 'කරුණාකර කොටස එක් කිරීමට කතාවක් තෝරන්න.');
      return;
    }
    if (!partTitle.trim() || !partContent.trim()) {
      showStatus('error', 'කොටසේ මාතෘකාව සහ අන්තර්ගතය අනිවාර්ය වේ.');
      return;
    }

    const targetStory = stories.find(s => s.id === selectedStoryId);
    if (!targetStory) return;

    // Auto-detect part number
    const nextPartNum = targetStory.parts.length + 1;

    const newPart: StoryPart = {
      id: `part-${Date.now()}`,
      title: `කොටස ${nextPartNum}: ${partTitle}`,
      content: partContent,
      partNumber: nextPartNum,
      addedDate: new Date().toISOString().split('T')[0]
    };

    const updatedParts = [...targetStory.parts, newPart];
    onUpdateStoryParts(selectedStoryId, updatedParts);

    // Reset Form
    setPartTitle('');
    setPartContent('');
    showStatus('success', `කතාවට ${nextPartNum} වන කොටස සාර්ථකව එක් කරන ලදී!`);
  };

  const handleApprovePayment = async (submission: PaymentSubmission) => {
    try {
      await updatePaymentSubmissionStatus(submission.id, 'approved');
      await updateUserVipStatus(
        submission.username,
        true,
        submission.selectedPlan
      );
      await updateUserPaymentNotification(
        submission.username,
        'approved',
        submission.transactionId
      );
      showStatus('success', `@${submission.username} ගේ ගෙවීම් සාර්ථකව අනුමත කරන ලදී! VIP සක්‍රීය කෙරිණි.`);
    } catch (err) {
      console.error(err);
      showStatus('error', 'අනුමත කිරීමට නොහැකි විය.');
    }
  };

  const handleRejectPayment = async (submission: PaymentSubmission) => {
    try {
      await updatePaymentSubmissionStatus(submission.id, 'rejected');
      await updateUserPaymentNotification(
        submission.username,
        'rejected',
        submission.transactionId
      );
      showStatus('success', `@${submission.username} ගේ ගෙවීම ප්‍රතික්ෂේප කරන ලදී.`);
    } catch (err) {
      console.error(err);
      showStatus('error', 'ප්‍රතික්ෂේප කිරීමට නොහැකි විය.');
    }
  };

  // Auto detect current part number when selecting story
  const currentStory = stories.find(s => s.id === selectedStoryId);
  const nextAutoPartNumber = currentStory ? currentStory.parts.length + 1 : 1;

  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl shadow-2xl overflow-hidden" id="admin-panel-container">
      {/* Admin header banner */}
      <div className="bg-gradient-to-r from-[#0a0a0a] via-[#111] to-[#0d0d0d] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#222]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <LayoutDashboard className="text-[#c9a86a]" size={20} />
            <span className="text-[10px] uppercase tracking-wider text-[#c9a86a] font-bold font-mono">Sinhala Katha Creator Studio</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
            ඇඩ්මින් පාලක පැනලය (Admin Panel)
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            කතා වර්ගීකරණ, නව කතා ලියාපදිංචිය සහ කතාංග කොටස් පළ කිරීම මෙහිදී සිදු කල හැක.
          </p>
        </div>
        <button
          id="admin-logout-btn"
          onClick={onLogoutAdmin}
          className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-[#c9a86a] text-xs font-bold py-2.5 px-4 rounded-xl border border-[#333] transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          පැනලයෙන් ඉවත් වන්න
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-[#0a0a0a] border-b border-[#222] px-4 md:px-6 flex overflow-x-auto gap-2 py-3 custom-scrollbar">
        <button
          id="tab-manage-payments"
          onClick={() => setActiveTab('manage-payments')}
          className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'manage-payments'
              ? 'bg-amber-600/20 text-[#c9a86a] border border-[#c9a86a]/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          💳 ගෙවීම් තහවුරු කිරීම ({paymentSubmissions.filter(p => p.status === 'pending').length} අලුත්)
        </button>
        <button
          id="tab-manage-stories"
          onClick={() => setActiveTab('manage-stories')}
          className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'manage-stories'
              ? 'bg-[#161616] text-[#c9a86a] border border-[#2d2d2d]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📂 කතා මාලා කළමනාකරණය ({stories.length})
        </button>
        <button
          id="tab-user-stories"
          onClick={() => setActiveTab('user-stories')}
          className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'user-stories'
              ? 'bg-[#161616] text-[#c9a86a] border border-[#2d2d2d]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          👥 පරිශීලක කතා (User Stories) ({stories.filter(s => s.submittedBy).length})
        </button>
        <button
          id="tab-add-story"
          onClick={() => setActiveTab('add-story')}
          className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'add-story'
              ? 'bg-[#161616] text-[#c9a86a] border border-[#2d2d2d]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          ✍️ නව කතාවක් ඇතුලත් කරන්න
        </button>
        <button
          id="tab-add-part"
          onClick={() => setActiveTab('add-part')}
          className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'add-part'
              ? 'bg-[#161616] text-[#c9a86a] border border-[#2d2d2d]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🔗 කතාවට කොටස් (Chapters) එක්කරන්න
        </button>
        <button
          id="tab-categories"
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-[#161616] text-[#c9a86a] border border-[#2d2d2d]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🗂️ මෙනු/කාණ්ඩ පාලනය ({categories.length})
        </button>
        <button
          id="tab-manage-media"
          onClick={() => setActiveTab('manage-media')}
          className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'manage-media'
              ? 'bg-[#161616] text-[#c9a86a] border border-[#2d2d2d]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🎥 VIP වීඩියෝ සහ චිත්‍රපටි ({vipMediaList.length})
        </button>
        <button
          id="tab-manage-users"
          onClick={() => setActiveTab('manage-users')}
          className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'manage-users'
              ? 'bg-[#161616] text-[#c9a86a] border border-[#2d2d2d]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          👥 ලියාපදිංචි පරිශීලකයින් ({usersList.length})
        </button>
        <button
          id="tab-manage-partners"
          onClick={() => setActiveTab('manage-partners')}
          className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'manage-partners'
              ? 'bg-[#161616] text-[#c9a86a] border border-[#2d2d2d]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          💞 සහකරුවන් පාලනය ({partnerProfiles.length})
        </button>
        <button
          id="tab-manage-ads"
          onClick={() => setActiveTab('manage-ads')}
          className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'manage-ads'
              ? 'bg-[#161616] text-[#c9a86a] border border-[#2d2d2d]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📢 දැන්වීම් කේත (Ad Codes)
        </button>
      </div>

      <div className="p-6 md:p-8">
        {/* Status Toast Notification banner */}
        {statusMsg.text && (
          <div
            id="admin-status-banner"
            className={`mb-6 p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-200'
                : 'bg-red-950/40 border-red-900/50 text-red-200'
            }`}
          >
            <span className="font-bold uppercase tracking-wider">{statusMsg.type === 'success' ? 'සාර්ථකයි!:' : 'දෝෂයක්!:'}</span>
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* 1. MANAGE STORIES TAB */}
        {activeTab === 'manage-stories' && (
          <div className="space-y-6" id="panel-manage-stories-view">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-serif font-bold text-[#c9a86a] uppercase tracking-wider">දැනට පවතින සියලුම කතා</h3>
              <span className="text-xs text-gray-500 font-mono">Stories Listed: {stories.length}</span>
            </div>

            {stories.length === 0 ? (
              <div className="text-center py-12 bg-[#0a0a0a] border border-[#222] rounded-2xl">
                <p className="text-xs text-gray-500 font-medium">පළ කර ඇති කතා කිසිවක් හමු නොවීය. කරුණාකර නව කතාවක් ලියන්න.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {stories.map((story) => {
                  const cat = categories.find((c) => c.id === story.categoryId);
                  return (
                    <div
                      key={story.id}
                      className="bg-[#0a0a0a] p-5 rounded-2xl border border-[#222] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="bg-[#161616] border border-[#2d2d2d] text-[10px] text-[#c9a86a] px-2.5 py-0.5 rounded font-bold uppercase">
                            {cat ? cat.name.split(' (')[0] : 'කාණ්ඩයක් නැත'}
                          </span>
                          <button
                            id={`delete-story-btn-${story.id}`}
                            onClick={() => {
                              if (confirm(`'${story.title}' කතාව සහ එහි සියලුම කොටස් මකා දැමීමට අවශ්‍ය බව සහතිකද?`)) {
                                onDeleteStory(story.id);
                                showStatus('success', 'කතාව සාර්ථකව මකා දමන ලදී.');
                              }
                            }}
                            className="text-gray-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-[#161616] transition-colors cursor-pointer"
                            title="මකා දමන්න"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <h4 className="font-serif font-bold text-white text-base">{story.title}</h4>
                        <p className="text-[11px] text-gray-500 mt-1">කර්තෘ: {story.author} | {story.views} Views</p>
                        <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-relaxed">{story.description}</p>
                      </div>

                      {/* Info on story parts */}
                      <div className="mt-4 pt-4 border-t border-[#222] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Layers size={13} className="text-[#c9a86a]" />
                          <span className="text-xs font-bold text-gray-300">
                            කොටස් {story.parts.length} ක් ඇත
                          </span>
                        </div>
                        
                        {/* Quick action to add a part to this story */}
                        <button
                          id={`quick-add-part-${story.id}`}
                          onClick={() => {
                            setSelectedStoryId(story.id);
                            setActiveTab('add-part');
                          }}
                          className="text-[10px] bg-[#161616] text-[#c9a86a] hover:bg-[#c9a86a] hover:text-black px-3 py-1.5 rounded-lg border border-[#2d2d2d] transition-colors font-bold cursor-pointer"
                        >
                          කොටසක් එකතු කරන්න +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 1.5. USER SUBMITTED STORIES TAB */}
        {activeTab === 'user-stories' && (
          <div className="space-y-6" id="panel-user-stories-view">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-[#222] pb-4">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#c9a86a] uppercase tracking-wider flex items-center gap-2">
                  <BookOpen size={16} /> 👥 පරිශීලක කතාන්දර සමාලෝචනය (User Stories Moderation)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  පරිශීලකයින් විසින් ඉදිරිපත් කරන ලද කතා සහ පරිච්ඡේද සමාලෝචනය කර ප්‍රසිද්ධ කිරීම මෙහිදී සිදුකල හැක.
                </p>
              </div>
              <div className="text-xs bg-[#111] border border-[#222] px-3.5 py-1.5 rounded-xl text-gray-400">
                මුළු පරිශීලක කතා ගණන: <span className="text-white font-bold">{stories.filter(s => s.submittedBy).length}</span>
              </div>
            </div>

            {stories.filter(s => s.submittedBy).length === 0 ? (
              <div className="text-center py-12 bg-[#0a0a0a] border border-[#222] rounded-2xl">
                <p className="text-xs text-gray-500 font-medium">පරිශීලකයින් විසින් ඉදිරිපත් කරන ලද කතා කිසිවක් දැනට නැත.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {stories
                  .filter(s => s.submittedBy)
                  .map((story) => {
                    const cat = categories.find((c) => c.id === story.categoryId);
                    const isApproved = story.approved !== false;
                    return (
                      <div
                        key={story.id}
                        className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 space-y-4 hover:border-[#333] transition-all"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="bg-[#161616] border border-[#2d2d2d] text-[10px] text-[#c9a86a] px-2.5 py-0.5 rounded font-bold uppercase">
                                {cat ? cat.name.split(' (')[0] : 'කාණ්ඩයක් නැත'}
                              </span>
                              {isApproved ? (
                                <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded-full font-bold">
                                  අනුමතයි (APPROVED)
                                </span>
                              ) : (
                                <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900/60 px-2 py-0.5 rounded-full font-bold animate-pulse">
                                  අනුමැතිය සඳහා රැඳී පවතී (PENDING)
                                </span>
                              )}
                              {story.ageRestricted && (
                                <span className="text-[9px] bg-red-950 text-red-400 border border-red-900/60 px-2 py-0.5 rounded-full font-bold">
                                  🔞 18+ Rated
                                </span>
                              )}
                            </div>
                            <h4 className="font-serif font-bold text-white text-lg mt-1">{story.title}</h4>
                            <p className="text-xs text-gray-500 font-mono">
                              රචකයා: <span className="text-[#c9a86a] font-sans font-medium">{story.author}</span> | 
                              යූසර්නේම්: <span className="text-[#c9a86a] font-sans font-medium">{story.submittedBy}</span> | 
                              දිනය: {story.addedDate}
                            </p>
                          </div>

                          <div className="flex gap-2 w-full md:w-auto">
                            {!isApproved ? (
                              <button
                                onClick={async () => {
                                  try {
                                    await approveStory(story.id, true);
                                    showStatus('success', `'${story.title}' කතාව සාර්ථකව අනුමත කර ප්‍රසිද්ධ කරන ලදී.`);
                                  } catch (err) {
                                    console.error(err);
                                    showStatus('error', 'කතාව අනුමත කිරීමට නොහැකි විය.');
                                  }
                                }}
                                className="flex-1 md:flex-initial bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/50 hover:border-emerald-700 text-xs font-extrabold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Check size={14} /> අනුමත කර පළ කරන්න
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  try {
                                    await approveStory(story.id, false);
                                    showStatus('success', `'${story.title}' කතාවේ අනුමැතිය සාර්ථකව අවලංගු කරන ලදී.`);
                                  } catch (err) {
                                    console.error(err);
                                    showStatus('error', 'අනුමැතිය අවලංගු කිරීමට නොහැකි විය.');
                                  }
                                }}
                                className="flex-1 md:flex-initial bg-amber-950 hover:bg-amber-900 text-amber-400 border border-amber-900/40 hover:border-amber-800 text-xs font-extrabold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                අනුමැතිය අවලංගු කරන්න
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (confirm(`'${story.title}' කතාව සහ එහි සියලුම කොටස් මකා දැමීමට අවශ්‍ය බව සහතිකද?`)) {
                                  onDeleteStory(story.id);
                                  showStatus('success', 'කතාව සාර්ථකව මකා දමන ලදී.');
                                }
                              }}
                              className="bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-950/60 hover:border-red-800 p-2.5 rounded-xl transition-all cursor-pointer"
                              title="කතාව මකා දමන්න"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="bg-[#111]/40 border border-[#222]/60 p-4 rounded-xl space-y-2">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">කතාවේ හැඳින්වීම (Synopsis)</span>
                          <p className="text-gray-300 text-xs leading-relaxed">{story.description}</p>
                        </div>

                        {/* Story parts block */}
                        <div className="space-y-3">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">කතාවේ කොටස් ({story.parts.length})</span>
                          
                          <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {story.parts.map((part) => (
                              <div key={part.id} className="bg-[#111] border border-[#222] p-4 rounded-xl space-y-2">
                                <div className="flex justify-between items-center border-b border-[#222] pb-1.5">
                                  <span className="font-serif font-bold text-white text-xs">{part.title}</span>
                                  <span className="text-[9px] text-gray-500 font-mono">{part.addedDate}</span>
                                </div>
                                <p className="text-gray-400 text-xs leading-relaxed whitespace-pre-wrap select-all font-sans font-light bg-[#0a0a0a]/30 p-2.5 rounded-lg border border-[#222]/30">
                                  {part.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* 2. ADD NEW STORY TAB */}
        {activeTab === 'add-story' && (
          <form onSubmit={handleAddStorySubmit} className="space-y-5" id="add-story-form">
            <h3 className="text-sm font-serif font-bold text-[#c9a86a] uppercase tracking-wider">නව කතා මාලාවක් පැනලයට ඇතුලත් කිරීම</h3>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">කතාවේ මාතෘකාව (Story Title) *</label>
                <input
                  id="admin-story-title"
                  type="text"
                  placeholder="e.g. හිරු බැසයන සැඳෑවක"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-gray-600 rounded-xl p-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">කර්තෘ (Author Name) *</label>
                <input
                  id="admin-story-author"
                  type="text"
                  placeholder="e.g. නිලූකා ප්‍රනාන්දු"
                  value={storyAuthor}
                  onChange={(e) => setStoryAuthor(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-gray-600 rounded-xl p-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">කාණ්ඩය / මෙනුව තෝරන්න (Category) *</label>
              <select
                id="admin-story-cat"
                value={storyCatId}
                onChange={(e) => setStoryCatId(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl p-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">කතාවේ හැඳින්වීම / සාරාංශය (Synopsis) *</label>
              <textarea
                id="admin-story-desc"
                placeholder="කතාව පිළිබඳව කෙටි හැඳින්වීමක් මෙහි ලියන්න. මෙය ප්‍රධාන පිටුවේ කාඩ් එක මත දිස්වේ."
                value={storyDesc}
                onChange={(e) => setStoryDesc(e.target.value)}
                rows={4}
                className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-gray-600 rounded-xl p-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                required
              />
            </div>

            <div className="flex flex-wrap gap-6 bg-[#0a0a0a] p-4 rounded-xl border border-[#222]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  id="admin-story-18"
                  type="checkbox"
                  checked={storyAgeLimit}
                  onChange={(e) => setStoryAgeLimit(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#c9a86a] cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-300">🔞 වැඩිහිටියන්ට පමණි (Adult 18+ Rated)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  id="admin-story-complete"
                  type="checkbox"
                  checked={storyCompleted}
                  onChange={(e) => setStoryCompleted(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#c9a86a] cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-300">🎉 කතාව ලියා අවසන් කර ඇත (Completed Story)</span>
              </label>
            </div>

            <button
              id="admin-add-story-submit"
              type="submit"
              className="flex items-center justify-center gap-2 bg-[#c9a86a] hover:bg-[#bba061] text-black text-xs font-bold py-3.5 px-6 rounded-full w-full md:w-auto transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <PlusCircle size={15} />
              කතා මාලාව ලියාපදිංචි කරන්න
            </button>
          </form>
        )}

        {/* 3. ADD STORY PART (CHAPTER) TAB */}
        {activeTab === 'add-part' && (
          <form onSubmit={handleAddPartSubmit} className="space-y-5" id="add-part-form">
            <h3 className="text-sm font-serif font-bold text-[#c9a86a] uppercase tracking-wider">කතාංග වලට නව කොටස් එකතු කිරීම</h3>

            {stories.length === 0 ? (
              <div className="p-6 bg-red-950/10 border border-red-900/30 text-red-400 text-xs rounded-xl">
                කරුණාකර කොටසක් එක් කිරීමට පෙර අවම වශයෙන් එක් කතාවක්වත් සාදන්න.
              </div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">කතාව තෝරන්න (Select Story) *</label>
                    <select
                      id="admin-part-story-select"
                      value={selectedStoryId}
                      onChange={(e) => setSelectedStoryId(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl p-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors cursor-pointer"
                    >
                      {stories.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.parts.length} Parts)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">ඊළඟට එක්වන කොටස (Part Number)</label>
                    <div className="bg-[#0a0a0a] border border-[#222] text-gray-300 font-bold p-3 rounded-xl text-xs flex justify-between items-center">
                      <span>ස්වයංක්‍රීයව සකසන ලද කොටස් අංකය:</span>
                      <span className="bg-[#1a1a1a] text-[#c9a86a] px-3 py-1 rounded-lg text-xs border border-[#2d2d2d]">
                        {nextAutoPartNumber} වන කොටස
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">කොටසේ කෙටි මාතෘකාව (Part Title/Subtitle) *</label>
                  <input
                    id="admin-part-title"
                    type="text"
                    placeholder="e.g. වැසි බිංදු සහ කෝපි සුවඳ"
                    value={partTitle}
                    onChange={(e) => setPartTitle(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-gray-600 rounded-xl p-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">කතාවේ සම්පූර්ණ අන්තර්ගතය (Chapter Text Content) *</label>
                  <textarea
                    id="admin-part-content"
                    placeholder="කතාවේ සම්පූර්ණ විස්තරය හෝ පරිච්ඡේදය මෙහි ලියන්න..."
                    value={partContent}
                    onChange={(e) => setPartContent(e.target.value)}
                    rows={12}
                    className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-gray-600 rounded-xl p-4 text-xs font-sans tracking-wide leading-relaxed focus:outline-none focus:border-[#c9a86a] transition-colors"
                    required
                  />
                </div>

                <button
                  id="admin-add-part-submit"
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-[#c9a86a] hover:bg-[#bba061] text-black text-xs font-bold py-3.5 px-6 rounded-full w-full md:w-auto transition-all shadow-lg active:scale-95 cursor-pointer border border-transparent"
                >
                  <PlusCircle size={15} />
                  කතාංග කොටස ප්‍රකාශයට පත් කරන්න
                </button>
              </>
            )}
          </form>
        )}

        {/* 4. CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="space-y-6" id="panel-categories-view">
            <div className="grid gap-8 md:grid-cols-3">
              {/* Category creation form */}
              <form onSubmit={handleAddCategorySubmit} className="space-y-4 md:col-span-1 bg-[#0a0a0a] p-5 rounded-2xl border border-[#222]">
                <h4 className="font-serif font-bold text-[#c9a86a] text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FolderPlus size={14} className="text-[#c9a86a]" />
                  නව මෙනු කාණ්ඩයක් සාදන්න
                </h4>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1">කාණ්ඩයේ නම (Category Name) *</label>
                  <input
                    id="admin-cat-name"
                    type="text"
                    placeholder="e.g. ත්‍රාසජනක කතා"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full bg-[#111] border border-[#222] text-white placeholder-gray-600 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1">විස්තරය (Description)</label>
                  <textarea
                    id="admin-cat-desc"
                    placeholder="මෙම කාණ්ඩයෙහි ඇතුලත් කතා වල ස්වභාවය විස්තර කරන්න..."
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-[#111] border border-[#222] text-white placeholder-gray-600 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                  />
                </div>

                <button
                  id="admin-add-cat-submit"
                  type="submit"
                  className="w-full bg-[#c9a86a] hover:bg-[#bba061] text-black text-[11px] font-bold py-2.5 px-4 rounded-full transition-colors cursor-pointer"
                >
                  කාණ්ඩය සුරකින්න
                </button>
              </form>

              {/* Categories list */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-serif font-bold text-[#c9a86a] text-xs uppercase tracking-wider">දැනට සක්‍රීය කාණ්ඩ</h4>

                <div className="space-y-3">
                  {categories.map((cat) => {
                    const count = stories.filter((s) => s.categoryId === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        className="bg-[#0a0a0a] p-4 rounded-xl border border-[#222] flex items-start justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#c9a86a]"></span>
                            <span className="font-serif font-bold text-white text-sm">{cat.name}</span>
                            <span className="text-[10px] bg-[#111] border border-[#222] text-[#c9a86a] px-2 py-0.5 rounded-full font-mono font-bold">
                              {count} Stories
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs mt-1 leading-relaxed">{cat.description || 'විස්තරයක් සපයා නැත.'}</p>
                        </div>

                        {/* Prevent deleting built-in seed categories to avoid broken initial layouts */}
                        {!['cat-love', 'cat-thrill', 'cat-life'].includes(cat.id) && (
                          <button
                            id={`delete-cat-btn-${cat.id}`}
                            onClick={() => {
                              if (confirm(`'${cat.name}' කාණ්ඩය මකා දැමීමට අවශ්‍ය බව තහවුරුද?`)) {
                                onDeleteCategory(cat.id);
                                showStatus('success', 'කාණ්ඩය සාර්ථකව මකා දමන ලදී.');
                              }
                            }}
                            className="text-gray-500 hover:text-red-500 p-1 rounded hover:bg-[#111] transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MANAGE VIP MEDIA */}
        {activeTab === 'manage-media' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#222] pb-4">
              <h3 className="text-sm font-serif font-bold text-[#c9a86a] uppercase tracking-wider">🎥 VIP වීඩියෝ සහ චිත්‍රපටි කළමනාකරණය</h3>
              <p className="text-xs text-gray-400">VIP පරිශීලකයින් සඳහා පමණක් විවෘත වන රූප රාමු සහ චිත්‍රපටි මෙහිදී එක් කිරීමට හෝ මකා දැමීමට හැකිය.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Add Media Form */}
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!mediaTitle.trim() || !mediaDesc.trim() || !mediaEmbedCode.trim()) {
                    showStatus('error', 'සියලුම ක්ෂේත්‍ර පිරවීම අනිවාර්ය වේ.');
                    return;
                  }
                  
                  const newMedia: VipMedia = {
                    id: `media-${Date.now()}`,
                    title: mediaTitle,
                    description: mediaDesc,
                    embedCode: mediaEmbedCode,
                    type: mediaType,
                    addedDate: new Date().toISOString().split('T')[0]
                  };

                  try {
                    await addVipMedia(newMedia);
                    setMediaTitle('');
                    setMediaDesc('');
                    setMediaEmbedCode('');
                    showStatus('success', 'නව VIP මාධ්‍යය සාර්ථකව ඇතුළත් කරන ලදී!');
                  } catch (err) {
                    console.error(err);
                    showStatus('error', 'මාධ්‍යය ඇතුළත් කිරීමේදී දෝෂයක් සිදු විය.');
                  }
                }} 
                className="space-y-4 md:col-span-1 bg-[#0a0a0a] p-5 rounded-2xl border border-[#222]"
              >
                <h4 className="font-serif font-bold text-[#c9a86a] text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <PlusCircle size={14} className="text-[#c9a86a]" />
                  නව VIP වීඩියෝ/චිත්‍රපටි එක් කරන්න
                </h4>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1">මාතෘකාව (Title) *</label>
                  <input
                    id="admin-media-title"
                    type="text"
                    placeholder="e.g. රස කතා VIP කථාංගය - 01"
                    value={mediaTitle}
                    onChange={(e) => setMediaTitle(e.target.value)}
                    className="w-full bg-[#111] border border-[#222] text-white placeholder-gray-600 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1">මාධ්‍ය වර්ගය (Type) *</label>
                  <select
                    id="admin-media-type"
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as 'video' | 'movie')}
                    className="w-full bg-[#111] border border-[#222] text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                  >
                    <option value="video">වීඩියෝ (VIP Video)</option>
                    <option value="movie">චිත්‍රපටය (18+ Movie)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1">කෙටි විස්තරය (Description) *</label>
                  <textarea
                    id="admin-media-desc"
                    placeholder="වීඩියෝව හෝ චිත්‍රපටය පිළිබඳ කෙටි විස්තරයක්..."
                    value={mediaDesc}
                    onChange={(e) => setMediaDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-[#111] border border-[#222] text-white placeholder-gray-600 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 mb-1">Embed Code (Iframe) *</label>
                  <textarea
                    id="admin-media-embed"
                    placeholder='<iframe src="..." ...></iframe>'
                    value={mediaEmbedCode}
                    onChange={(e) => setMediaEmbedCode(e.target.value)}
                    rows={4}
                    className="w-full bg-[#111] border border-[#222] text-white font-mono placeholder-gray-700 rounded-xl p-2.5 text-[11px] focus:outline-none focus:border-[#c9a86a] transition-colors"
                    required
                  />
                </div>

                <button
                  id="admin-add-media-submit"
                  type="submit"
                  className="w-full bg-[#c9a86a] hover:bg-[#bba061] text-black text-[11px] font-bold py-2.5 px-4 rounded-full transition-colors cursor-pointer"
                >
                  මාධ්‍යය ඇතුළත් කරන්න
                </button>
              </form>

              {/* Media List */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-serif font-bold text-[#c9a86a] text-xs uppercase tracking-wider">දැනට පවතින VIP දර්ශන එකතුව</h4>

                {vipMediaList.length === 0 ? (
                  <div className="text-center py-12 bg-[#0a0a0a] border border-[#222] rounded-2xl">
                    <p className="text-xs text-gray-500">කිසිදු VIP දර්ශනයක් තවම ඇතුළත් කර නොමැත.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vipMediaList.map((media) => (
                      <div 
                        key={media.id}
                        className="bg-[#0a0a0a] p-4 rounded-xl border border-[#222] flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif font-bold text-white text-sm">{media.title}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${
                              media.type === 'movie' 
                                ? 'bg-red-950 text-red-400 border border-red-900/40' 
                                : 'bg-blue-950 text-blue-400 border border-blue-900/40'
                            }`}>
                              {media.type === 'movie' ? '18+ MOVIE' : 'VIP VIDEO'}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs line-clamp-1 leading-relaxed">{media.description}</p>
                          <span className="text-[10px] text-gray-600 block font-mono">දිනය: {media.addedDate}</span>
                        </div>

                        <button
                          id={`delete-media-${media.id}`}
                          onClick={async () => {
                            if (confirm(`'${media.title}' VIP මාධ්‍යය මකා දැමීමට අවශ්‍ය බව තහවුරුද?`)) {
                              try {
                                await deleteVipMedia(media.id);
                                showStatus('success', 'මාධ්‍යය සාර්ථකව මකා දමන ලදී.');
                              } catch (err) {
                                console.error(err);
                                showStatus('error', 'මාධ්‍යය මකා දැමීමට නොහැකි විය.');
                              }
                            }
                          }}
                          className="text-gray-500 hover:text-red-500 p-1.5 rounded hover:bg-[#111] transition-all cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: REGISTERED USERS DATABASE */}
        {activeTab === 'manage-users' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#222] pb-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#c9a86a] uppercase tracking-wider">👥 ලියාපදිංචි සාමාජික දත්ත ගබඩාව</h3>
                <p className="text-xs text-gray-400">වෙබ් අඩවියේ ලියාපදිංචි වී ඇති පරිශීලකයින්ගේ තොරතුරු සෙවීම සහ ගෙවීම් පාලනය (VIP Status).</p>
              </div>

              {/* User Search Input */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3 text-[#c9a86a]" size={15} />
                <input
                  id="admin-user-search"
                  type="text"
                  placeholder="යූසර් නේම් (Username) මගින් සොයන්න..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-gray-600 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                />
              </div>
            </div>

            {/* Users list table */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#222] bg-[#111] text-gray-400 text-[10px] uppercase font-bold">
                      <th className="py-4 px-5">පරිශීලක නාමය (Username)</th>
                      <th className="py-4 px-5">විද්‍යුත් ලිපිනය (Email)</th>
                      <th className="py-4 px-5">ගිණුම් වර්ගය (Role)</th>
                      <th className="py-4 px-5">VIP තත්ත්වය (VIP Status)</th>
                      <th className="py-4 px-5 text-right">ක්‍රියාකාරකම් (Action)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList
                      .filter((u) => 
                        u.username && u.username.toLowerCase().includes(searchUserQuery.toLowerCase())
                      )
                      .map((member) => {
                        const isMemberVip = !!member.isVip;
                        const isMemberAdmin = !!member.isAdmin;
                        
                        return (
                          <tr 
                            key={member.username} 
                            className="border-b border-[#161616] hover:bg-[#111]/30 text-xs text-gray-300 transition-colors"
                          >
                            <td className="py-4 px-5 font-bold text-white flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a86a]"></span>
                              {member.username}
                            </td>
                            <td className="py-4 px-5 text-gray-400">{member.email || 'N/A'}</td>
                            <td className="py-4 px-5">
                              {isMemberAdmin ? (
                                <span className="bg-[#c9a86a]/15 text-[#c9a86a] border border-[#c9a86a]/30 px-2.5 py-0.5 rounded-full text-[9px] font-bold">ADMINISTRATOR</span>
                              ) : (
                                <span className="bg-gray-900 text-gray-500 border border-gray-800 px-2.5 py-0.5 rounded-full text-[9px]">MEMBER</span>
                              )}
                            </td>
                            <td className="py-4 px-5">
                              {isMemberVip ? (
                                <div className="inline-flex flex-col">
                                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/50 px-2.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 w-max">
                                    <Check size={10} /> PAID (මුදල් ගෙවූ)
                                  </span>
                                  {member.subscriptionType && member.subscriptionType !== 'none' && (
                                    <span className="text-[9px] text-[#c9a86a] mt-1 font-mono uppercase font-semibold">
                                      {member.subscriptionType} Plan
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="bg-red-950/50 text-red-400 border border-red-900/30 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                                  UNPAID (නොගෙවූ)
                                </span>
                              )}
                            </td>
                             <td className="py-4 px-5 text-right">
                               {isMemberAdmin ? (
                                 <span className="text-[10px] text-gray-600 font-serif italic">මුදල් පාලනය කළ නොහැක</span>
                               ) : (
                                 <div className="flex flex-col items-end gap-2 text-right">
                                   {/* Subscription dropdown */}
                                   <div className="flex items-center gap-1.5 justify-end">
                                     <span className="text-[9px] text-gray-500">ප්ලෑන්:</span>
                                     <select
                                       value={member.subscriptionType || 'none'}
                                       onChange={async (e) => {
                                         const nextPlan = e.target.value as any;
                                         const isNowVip = nextPlan !== 'none';
                                         try {
                                           await updateUserVipStatus(
                                             member.username,
                                             isNowVip,
                                             nextPlan,
                                             nextPlan === 'partner' || nextPlan === 'bundle_monthly' || nextPlan === 'bundle_yearly' || isNowVip,
                                             nextPlan === 'bundle_monthly' || nextPlan === 'bundle_yearly' || isNowVip,
                                             nextPlan === 'bundle_monthly' || nextPlan === 'bundle_yearly' || isNowVip
                                           );
                                           showStatus('success', `${member.username} සාර්ථකව ${nextPlan} ප්ලෑන් එකට මාරු කරන ලදී.`);
                                         } catch (err) {
                                           console.error(err);
                                           showStatus('error', 'ප්ලෑන් එක වෙනස් කිරීමට නොහැකි විය.');
                                         }
                                       }}
                                       className="bg-[#111] border border-[#333] rounded-lg text-[11px] text-gray-200 py-1 px-2 focus:border-[#c9a86a] outline-none cursor-pointer"
                                     >
                                       <option value="none">Free (නොමිලේ)</option>
                                       <option value="monthly">Monthly $10 (මාසික)</option>
                                       <option value="yearly">Yearly $18 (වාර්ෂික)</option>
                                       <option value="partner">Matchmaking $10 (සහකරු සෙවීම)</option>
                                       <option value="bundle_monthly">Bundle Monthly $18 (මාසික මිටිය)</option>
                                       <option value="bundle_yearly">Bundle Yearly $30 (වාර්ෂික මිටිය)</option>
                                     </select>
                                   </div>

                                   {/* Access flags toggles */}
                                   <div className="flex items-center gap-2 mt-1 bg-[#121212] p-1.5 rounded-lg border border-[#222]">
                                     <label className="flex items-center gap-1 cursor-pointer text-[9px] text-gray-400 hover:text-[#c9a86a] select-none">
                                       <input
                                         type="checkbox"
                                         checked={!!member.hasPartnerAccess}
                                         onChange={async (e) => {
                                           try {
                                             await updateUserVipStatus(
                                               member.username,
                                               !!member.isVip,
                                               member.subscriptionType || 'none',
                                               e.target.checked,
                                               member.hasMoviesAccess,
                                               member.hasVideosAccess
                                             );
                                             showStatus('success', 'සහකරු පද්ධති අවසරය වෙනස් කරන ලදී.');
                                           } catch (err) {
                                             console.error(err);
                                           }
                                         }}
                                         className="rounded border-[#333] text-[#c9a86a] focus:ring-0 scale-75"
                                       />
                                       💞 සහකරු
                                     </label>

                                     <label className="flex items-center gap-1 cursor-pointer text-[9px] text-gray-400 hover:text-red-400 select-none">
                                       <input
                                         type="checkbox"
                                         checked={!!member.hasMoviesAccess}
                                         onChange={async (e) => {
                                           try {
                                             await updateUserVipStatus(
                                               member.username,
                                               !!member.isVip,
                                               member.subscriptionType || 'none',
                                               member.hasPartnerAccess,
                                               e.target.checked,
                                               member.hasVideosAccess
                                             );
                                             showStatus('success', 'චිත්‍රපටි අවසරය වෙනස් කරන ලදී.');
                                           } catch (err) {
                                             console.error(err);
                                           }
                                         }}
                                         className="rounded border-[#333] text-[#c9a86a] focus:ring-0 scale-75"
                                       />
                                       🎬 චිත්‍රපටි
                                     </label>

                                     <label className="flex items-center gap-1 cursor-pointer text-[9px] text-gray-400 hover:text-blue-400 select-none">
                                       <input
                                         type="checkbox"
                                         checked={!!member.hasVideosAccess}
                                         onChange={async (e) => {
                                           try {
                                             await updateUserVipStatus(
                                               member.username,
                                               !!member.isVip,
                                               member.subscriptionType || 'none',
                                               member.hasPartnerAccess,
                                               member.hasMoviesAccess,
                                               e.target.checked
                                             );
                                             showStatus('success', 'වීඩියෝ අවසරය වෙනස් කරන ලදී.');
                                           } catch (err) {
                                             console.error(err);
                                           }
                                         }}
                                         className="rounded border-[#333] text-[#c9a86a] focus:ring-0 scale-75"
                                       />
                                       🎥 වීඩියෝ
                                     </label>
                                   </div>
                                 </div>
                               )}
                             </td>
                          </tr>
                        );
                      })}
                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-gray-500 font-serif">ලියාපදිංචි පරිශීලකයින් කිසිවෙක් හමු නොවීය.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: ADSTERRA CODES DYNAMIC MANAGEMENT */}
        {activeTab === 'manage-ads' && (
          <div className="space-y-6 animate-fadeIn" id="admin-ads-panel">
            <div>
              <h3 className="text-sm font-serif font-bold text-[#c9a86a] uppercase tracking-wider flex items-center gap-2">
                <Code size={16} /> 📢 දැන්වීම් කේත කළමනාකරණය (Adsterra Code Panel)
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                වෙබ් අඩවියේ ප්‍රදර්ශනය වන Adsterra දැන්වීම් ඒකකවල හැඳුනුම්පත් (Key / ID) සහ සබැඳි (URLs) මෙහිදී වෙන වෙනම සකස් කළ හැක.
              </p>
            </div>

            <div className="bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Banner 300x250 */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 block">Banner 300x250 Ad Key</label>
                  <input
                    type="text"
                    value={banner300Key}
                    onChange={(e) => setBanner300Key(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] text-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors font-mono"
                    placeholder="Enter Key..."
                  />
                  <span className="text-[9px] text-gray-500 block">StoryReader සහ Dashboard තුළ පෙන්වන මැද ප්‍රමාණයේ බැනර් දැන්වීම් කේතය.</span>
                </div>

                {/* Banner 320x50 */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 block">Banner 320x50 Ad Key</label>
                  <input
                    type="text"
                    value={banner320Key}
                    onChange={(e) => setBanner320Key(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] text-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors font-mono"
                    placeholder="Enter Key..."
                  />
                  <span className="text-[9px] text-gray-500 block">ජංගම දුරකථන සඳහා විශේෂිත කුඩා බැනර් දැන්වීම් කේතය.</span>
                </div>

                {/* Native Banner ID */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 block">Native Recommendation ID</label>
                  <input
                    type="text"
                    value={nativeId}
                    onChange={(e) => setNativeId(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] text-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors font-mono"
                    placeholder="Enter Native ID..."
                  />
                  <span className="text-[9px] text-gray-500 block">වෙබ් අඩවියේ අන්තර්ගත නිර්දේශිත දැන්වීම් ඒකකයේ ID එක.</span>
                </div>

                {/* Smartlink URL */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 block">Smartlink Redirection URL</label>
                  <input
                    type="text"
                    value={smartlinkUrl}
                    onChange={(e) => setSmartlinkUrl(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] text-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors font-mono"
                    placeholder="Enter Smartlink URL..."
                  />
                  <span className="text-[9px] text-gray-500 block">රතු පැහැති උණුසුම් කතා බොත්තම් සහ ඩවුන්ලෝඩ් සබැඳි හරහා යොමු කෙරෙන Smartlink URL එක.</span>
                </div>

                {/* Social Bar Script URL */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 block">Social Bar Script URL</label>
                  <input
                    type="text"
                    value={socialBarUrl}
                    onChange={(e) => setSocialBarUrl(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] text-white rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors font-mono"
                    placeholder="Enter Social Bar JS Script URL..."
                  />
                  <span className="text-[9px] text-gray-500 block">වෙබ් අඩවියේ පහළින් පාවෙන නොටිෆිකේෂන් ආකාරයේ දැන්වීම් ස්ක්‍රිප්ට් සබැඳිය.</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1a1a1a] flex justify-end">
                <button
                  id="btn-save-ads"
                  onClick={() => {
                    const nextConfig: AdConfig = {
                      banner300x250_key: banner300Key,
                      banner320x50_key: banner320Key,
                      native_id: nativeId,
                      smartlink_url: smartlinkUrl,
                      social_bar_url: socialBarUrl,
                    };
                    saveAdConfig(nextConfig);
                    showStatus('success', 'දැන්වීම් කේත හා සබැඳි සාර්ථකව වෙන වෙනම සුරකින ලදී! (Ad configs saved)');
                  }}
                  className="bg-[#c9a86a] hover:bg-[#b5955a] text-black font-extrabold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Settings size={14} /> දැන්වීම් කේත යාවත්කාලීන කරන්න
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage-payments' && (
          <div className="space-y-6 animate-fadeIn" id="admin-payments-panel">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-[#222] pb-4">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#c9a86a] uppercase tracking-wider flex items-center gap-2">
                  <span>💳 ගෙවීම් අනුමැතිය සහ සත්‍යාපනය (Manual Payments Approval)</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  පරිශීලකයින් විසින් QR හරහා ගෙවා ඉදිරිපත් කරන ලද Transaction ID සහ විස්තර පරීක්ෂා කර අනුමත හෝ ප්‍රතික්ෂේප කරන්න.
                </p>
              </div>
              <div className="text-xs bg-[#111] border border-[#222] px-3.5 py-1.5 rounded-xl text-gray-400">
                අනුමැතිය අපේක්ෂාවෙන්: <span className="text-amber-500 font-bold font-mono">{paymentSubmissions.filter(p => p.status === 'pending').length}</span>
              </div>
            </div>

            {paymentSubmissions.length === 0 ? (
              <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl py-12 text-center text-gray-500 font-serif">
                තවමත් කිසිදු ගෙවීම් ඉදිරිපත් කිරීමක් සිදු කර නොමැත.
              </div>
            ) : (
              <div className="grid gap-4">
                {paymentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                      sub.status === 'pending'
                        ? 'bg-[#15120a] border-amber-500/20 hover:border-amber-500/40'
                        : sub.status === 'approved'
                        ? 'bg-[#0a150e] border-emerald-500/10 hover:border-emerald-500/20'
                        : 'bg-[#150a0a] border-red-500/10 hover:border-red-500/20'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-white text-sm">@{sub.username}</span>
                        <span className="text-[11px] bg-neutral-800 text-gray-300 font-bold px-2 py-0.5 rounded">
                          {sub.planName} ({sub.price})
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          මාසය/කාලය: {sub.month}
                        </span>
                        
                        {sub.status === 'approved' && (
                          <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded font-bold">
                            අනුමතයි (Approved)
                          </span>
                        )}
                        {sub.status === 'rejected' && (
                          <span className="text-[9px] bg-red-950 text-red-400 border border-red-900/60 px-2 py-0.5 rounded font-bold">
                            ප්‍රතික්ෂේපිතයි (Rejected)
                          </span>
                        )}
                        {sub.status === 'pending' && (
                          <span className="text-[9px] bg-amber-950 text-amber-500 border border-amber-900/60 px-2 py-0.5 rounded font-bold animate-pulse">
                            පරික්ෂා වෙමින් (Pending)
                          </span>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 bg-black/40 p-3 rounded-xl border border-[#222]">
                        <div>
                          <span className="text-[10px] text-gray-500 block">Transaction ID / Invoice ID</span>
                          <span className="text-xs font-mono font-bold text-[#c9a86a] select-all tracking-wider">{sub.transactionId}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 block">ඉදිරිපත් කළ දිනය/වේලාව</span>
                          <span className="text-xs text-gray-400 font-mono">{sub.submittedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {sub.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              if (confirm(`@${sub.username} පරිශීලකයාගේ ${sub.planName} ගෙවීම් තහවුරු කර VIP සක්‍රීය කිරීමට අවශ්‍ය බව ස්ථිරද?`)) {
                                handleApprovePayment(sub);
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow"
                          >
                            <Check size={14} /> අනුමත කරන්න
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`@${sub.username} පරිශීලකයාගේ ගෙවීම ප්‍රතික්ෂේප කිරීමට අවශ්‍ය බව ස්ථිරද?`)) {
                                handleRejectPayment(sub);
                              }
                            }}
                            className="bg-red-950/50 hover:bg-red-950 text-red-400 border border-red-900/30 hover:border-red-800 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            ප්‍රතික්ෂේප කරන්න
                          </button>
                        </>
                      )}
                      {sub.status !== 'pending' && (
                        <button
                          onClick={() => {
                            if (confirm(`මෙම ගනුදෙනුව නැවතත් 'පරික්ෂා වෙමින් (Pending)' තත්ත්වයට පත් කිරීමට අවශ්‍යද?`)) {
                              updatePaymentSubmissionStatus(sub.id, 'pending');
                              showStatus('success', 'ගනුදෙනුවේ තත්ත්වය නැවත පරික්ෂා කිරීම දක්වා වෙනස් කෙරිණි.');
                            }
                          }}
                          className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-gray-400 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Reset Status
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: PARTNER PROFILES MATCHMAKING MANAGEMENT */}
        {activeTab === 'manage-partners' && (
          <div className="space-y-6 animate-fadeIn" id="admin-partners-panel">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-[#222] pb-4">
              <div>
                <h3 className="text-sm font-serif font-bold text-[#c9a86a] uppercase tracking-wider flex items-center gap-2">
                  <Heart size={16} className="text-red-500" /> 💞 සහකරුවන් සෙවීමේ පැතිකඩ කළමනාකරණය
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  පරිශීලකයින් විසින් ඉදිරිපත් කරන ලද මනමාල/මනමාලි දැන්වීම් සමාලෝචනය, අනුමත කිරීම සහ මකා දැමීම මෙහිදී සිදුකල හැක.
                </p>
              </div>
              <div className="text-xs bg-[#111] border border-[#222] px-3.5 py-1.5 rounded-xl text-gray-400">
                මුළු පැතිකඩ ගණන: <span className="text-white font-bold">{partnerProfiles.length}</span>
              </div>
            </div>

            <div className="space-y-4">
              {partnerProfiles.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#0c0c0c] border border-[#222] rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-5 hover:border-[#333] transition-all"
                >
                  <div className="flex items-start gap-4">
                    {p.photoUrl ? (
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover border border-[#222]"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#c9a86a] font-bold text-lg">
                        {p.gender === 'male' ? '🤵' : '👰'}
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-white text-base">{p.name}</span>
                        <span className="text-xs text-[#c9a86a] font-bold bg-[#c9a86a]/10 px-2 py-0.5 rounded-lg">
                          වයස {p.age} | {p.gender === 'male' ? 'පුරුෂ' : 'ස්ත්‍රී'}
                        </span>
                        {p.approved ? (
                          <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded-full font-bold">
                            අනුමතයි (APPROVED)
                          </span>
                        ) : (
                          <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900/60 px-2 py-0.5 rounded-full font-bold animate-pulse">
                            සමාලෝචනය වෙමින් (PENDING)
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed"><span className="text-gray-500">රැකියාව:</span> {p.occupation}</p>
                      <p className="text-gray-300 text-xs leading-relaxed"><span className="text-gray-500">පදිංචිය:</span> {p.location}</p>
                      <p className="text-gray-300 text-xs leading-relaxed italic bg-[#111]/40 p-2 rounded-lg my-1">"{p.bio}"</p>
                      <p className="text-[#c9a86a] text-xs leading-relaxed"><span className="text-gray-500 font-normal">බලාපොරොත්තුව:</span> {p.lookingFor}</p>
                      <p className="text-emerald-400 text-xs leading-relaxed font-mono mt-1 select-all bg-emerald-950/20 p-2 rounded-lg border border-emerald-950/40"><span className="text-gray-500 font-sans">සබඳතා තොරතුරු:</span> {p.contactDetails}</p>
                      {p.submittedBy && (
                        <span className="text-[9px] text-gray-500 block font-mono">ඉදිරිපත් කළේ: {p.submittedBy} | දිනය: {p.addedDate}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-end items-end gap-2.5 min-w-[120px]">
                    {!p.approved ? (
                      <button
                        id={`approve-partner-${p.id}`}
                        onClick={async () => {
                          try {
                            await updatePartnerProfileApproval(p.id, true);
                            showStatus('success', `${p.name} පැතිකඩ සාර්ථකව අනුමත කරන ලදී.`);
                          } catch (err) {
                            console.error(err);
                            showStatus('error', 'පැතිකඩ අනුමත කිරීමට නොහැකි විය.');
                          }
                        }}
                        className="w-full bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/50 hover:border-emerald-700 text-[10px] font-extrabold py-2 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck size={12} /> අනුමත කරන්න
                      </button>
                    ) : (
                      <button
                        id={`reject-partner-${p.id}`}
                        onClick={async () => {
                          try {
                            await updatePartnerProfileApproval(p.id, false);
                            showStatus('success', `${p.name} පැතිකඩ තාවකාලිකව අත්හිටුවන ලදී.`);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="w-full bg-amber-950 hover:bg-amber-900 text-amber-400 border border-amber-900/40 hover:border-amber-800 text-[10px] font-extrabold py-2 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        අත්හිටුවන්න
                      </button>
                    )}

                    <button
                      id={`delete-partner-${p.id}`}
                      onClick={async () => {
                        if (confirm(`'${p.name}' පැතිකඩ ස්ථිරවම මකා දැමීමට අවශ්‍ය බව තහවුරුද?`)) {
                          try {
                            await deletePartnerProfile(p.id);
                            showStatus('success', 'පැතිකඩ සාර්ථකව මකා දමන ලදී.');
                          } catch (err) {
                            console.error(err);
                            showStatus('error', 'මකා දැමීමට නොහැකි විය.');
                          }
                        }
                      }}
                      className="w-full bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-950/60 hover:border-red-800 text-[10px] font-extrabold py-2 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Trash2 size={12} /> මකා දමන්න
                    </button>
                  </div>
                </div>
              ))}

              {partnerProfiles.length === 0 && (
                <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl py-12 text-center text-gray-500 font-serif">
                  එක් කරන ලද සහකරු සෙවීමේ පැතිකඩ කිසිවක් හමු නොවීය.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
