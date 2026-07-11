import React, { useState, useEffect } from 'react';
import { 
  Crown, Play, Film, Sparkles, ShieldCheck, 
  CreditCard, CheckCircle, ArrowRight, Lock, AlertCircle, 
  Tv, Eye, Heart, Search, BookOpen, HeartHandshake, HelpCircle, 
  UserCheck, PlusCircle, Check, MapPin, Briefcase, Calendar, Phone,
  ZoomIn, ZoomOut, CheckCircle2
} from 'lucide-react';
import { User, VipMedia, Category, Story, StoryPart, PartnerProfile, PaymentSubmission } from '../types';
import { listenToVipMedia, updateUserVipStatus, listenToPartnerProfiles, addPartnerProfile, addStory, updateStoryParts, getNowPaymentsSettings, saveNowPaymentsSettings, submitPaymentSubmission, clearUserPaymentNotification } from '../firebase';
import StoryCard from './StoryCard';
import CategoryList from './CategoryList';
import paymentQr from '../assets/images/payment_qr_1783772409377.jpg';
import { 
  AdBanner300x250, 
  AdBanner320x50, 
  AdNativeBanner, 
  SmartlinkButton 
} from './AdWidgets';

interface LuxuryDashboardProps {
  user: User;
  stories: Story[];
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onReadPart: (story: Story, part: StoryPart) => void;
  onSelectStory: (story: Story) => void;
  onLikeToggle: (storyId: string) => void;
  onUpdateUserSession: (updatedUser: User) => void;
}

type TabType = 'stories' | 'movies' | 'partners' | 'subscription';

export default function LuxuryDashboard({
  user,
  stories,
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchQueryChange,
  onReadPart,
  onSelectStory,
  onLikeToggle,
  onUpdateUserSession
}: LuxuryDashboardProps) {
  
  const [activeTab, setActiveTab] = useState<TabType>('stories');
  const [vipMediaList, setVipMediaList] = useState<VipMedia[]>([]);
  const [activeMedia, setActiveMedia] = useState<VipMedia | null>(null);
  const [partnerProfiles, setPartnerProfiles] = useState<PartnerProfile[]>([]);
  
  // Partner Form State
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerGender, setPartnerGender] = useState<'male' | 'female'>('male');
  const [partnerAge, setPartnerAge] = useState(25);
  const [partnerLocation, setPartnerLocation] = useState('');
  const [partnerOccupation, setPartnerOccupation] = useState('');
  const [partnerPhotoUrl, setPartnerPhotoUrl] = useState('');
  const [partnerBio, setPartnerBio] = useState('');
  const [partnerLookingFor, setPartnerLookingFor] = useState('');
  const [partnerContact, setPartnerContact] = useState('');
  const [partnerFilterGender, setPartnerFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [partnerSubmitStatus, setPartnerSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // User Story Submission state
  const [showSubmitStoryForm, setShowSubmitStoryForm] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryCatId, setNewStoryCatId] = useState('');
  const [newStoryDesc, setNewStoryDesc] = useState('');
  const [newStoryAuthor, setNewStoryAuthor] = useState('');
  const [newStoryAgeLimit, setNewStoryAgeLimit] = useState(true);
  const [newPartTitle, setNewPartTitle] = useState('');
  const [newPartContent, setNewPartContent] = useState('');
  const [storySubmitStatus, setStorySubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Next part state
  const [selectedStoryForNextPart, setSelectedStoryForNextPart] = useState<Story | null>(null);
  const [nextPartTitle, setNextPartTitle] = useState('');
  const [nextPartContent, setNextPartContent] = useState('');
  const [nextPartSubmitStatus, setNextPartSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  
  // Checkout simulator state
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'partner' | 'bundle_monthly' | 'bundle_yearly' | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'card' | 'nowpayments'>('nowpayments');

  // New manual QR payment & disclaimer states
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [qrZoomed, setQrZoomed] = useState(false);
  const [manualTxId, setManualTxId] = useState('');
  const [manualMonth, setManualMonth] = useState(() => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[new Date().getMonth()];
  });
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [txSubmitSuccess, setTxSubmitSuccess] = useState(false);
  const [txSubmitError, setTxSubmitError] = useState<string | null>(null);

  // NOWPayments Real Setup State
  const [nowPaymentsTxId, setNowPaymentsTxId] = useState('');
  const [isVerifyingNowPayments, setIsVerifyingNowPayments] = useState(false);
  const [nowPaymentsError, setNowPaymentsError] = useState<string | null>(null);
  const [nowPaymentsSettings, setNowPaymentsSettings] = useState<{
    apiKey?: string;
    publicKey?: string;
    ipnSecret?: string;
    linkMonthly?: string;
    linkYearly?: string;
    linkBundleMonthly?: string;
    linkBundleYearly?: string;
  }>({});
  const [showAdminPaymentConfig, setShowAdminPaymentConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  // Load NOWPayments settings from Firestore
  useEffect(() => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthName = months[new Date().getMonth()];
    setManualMonth(currentMonthName);

    const loadSettings = async () => {
      try {
        const settings = await getNowPaymentsSettings();
        if (settings && settings.apiKey) {
          setNowPaymentsSettings(settings);
        } else {
          // Auto-seed the user's keys so the gateway is active and fully functional out-of-the-box!
          const seededSettings = {
            apiKey: 'BY3Q8Z8-3PD40ZM-Q70BH8B-28WEKEQ',
            publicKey: 'f50243e3-f3a7-4831-bca9-ef5e1d97daff',
            ipnSecret: settings?.ipnSecret || '',
            linkMonthly: settings?.linkMonthly || '',
            linkYearly: settings?.linkYearly || '',
            linkBundleMonthly: settings?.linkBundleMonthly || '',
            linkBundleYearly: settings?.linkBundleYearly || ''
          };
          await saveNowPaymentsSettings(seededSettings);
          setNowPaymentsSettings(seededSettings);
        }
      } catch (err) {
        console.error("Error fetching nowpayments settings:", err);
      }
    };
    loadSettings();
  }, []);
  
  // Real-time listen to VIP media
  useEffect(() => {
    const unsubscribe = listenToVipMedia((fetchedMedia) => {
      setVipMediaList(fetchedMedia);
    });
    return () => unsubscribe();
  }, []);

  // Real-time listen to partner profiles
  useEffect(() => {
    const unsubscribe = listenToPartnerProfiles((fetchedProfiles) => {
      setPartnerProfiles(fetchedProfiles);
    });
    return () => unsubscribe();
  }, []);

  // Sync selected media if list changes
  useEffect(() => {
    if (activeMedia) {
      const updated = vipMediaList.find(m => m.id === activeMedia.id);
      setActiveMedia(updated || null);
    }
  }, [vipMediaList]);

  // Central Helper to activate subscription
  const activateSubscription = async (type: 'monthly' | 'yearly' | 'partner' | 'bundle_monthly' | 'bundle_yearly' | null) => {
    if (!type) return;
    const isNowVip = true;
    const hasPartnerAccess = type === 'partner' || type === 'bundle_monthly' || type === 'bundle_yearly';
    const hasMoviesAccess = type === 'monthly' || type === 'yearly' || type === 'bundle_monthly' || type === 'bundle_yearly';
    const hasVideosAccess = type === 'monthly' || type === 'yearly' || type === 'bundle_monthly' || type === 'bundle_yearly';

    // Update VIP membership status in database
    await updateUserVipStatus(user.username, isNowVip, type, hasPartnerAccess, hasMoviesAccess, hasVideosAccess);
    
    // Update local user session state
    const updatedUser: User = {
      ...user,
      isVip: isNowVip,
      subscriptionType: type,
      subscriptionDate: new Date().toISOString().split('T')[0],
      hasPartnerAccess,
      hasMoviesAccess,
      hasVideosAccess
    };
    onUpdateUserSession(updatedUser);
  };

  // Handle manual payment submission
  const handleSubmitManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTxId.trim()) {
      setTxSubmitError('කරුණාකර ඔබගේ ගෙවීම් Transaction ID හෝ Invoice ID එක ඇතුළත් කරන්න.');
      return;
    }
    if (!selectedPlan) {
      setTxSubmitError('කරුණාකර පළමුව පැකේජයක් තෝරන්න.');
      return;
    }
    setIsSubmittingTx(true);
    setTxSubmitError(null);

    const planNamesMap = {
      monthly: 'Popular VIP Package',
      yearly: 'SAVE BIG (Yearly VIP)',
      partner: 'Partner Finding Access',
      bundle_monthly: 'Top Package',
      bundle_yearly: 'BEST VALUE (Yearly Bundle)'
    };

    const planPricesMap = {
      monthly: 'රු. 500/-',
      yearly: 'රු. 1,500/-',
      partner: 'රු. 1,000/-',
      bundle_monthly: 'රු. 1,800/-',
      bundle_yearly: 'රු. 3,000/-'
    };

    const submission: PaymentSubmission = {
      id: `pay-${Date.now()}`,
      username: user.username,
      selectedPlan,
      planName: planNamesMap[selectedPlan] || selectedPlan,
      price: planPricesMap[selectedPlan] || 'රු. 500/-',
      month: manualMonth || 'Current Month',
      transactionId: manualTxId.trim(),
      status: 'pending',
      submittedAt: new Date().toLocaleString()
    };

    try {
      await submitPaymentSubmission(submission);
      setTxSubmitSuccess(true);
      setManualTxId('');
      setTxSubmitError(null);
    } catch (err) {
      console.error(err);
      setTxSubmitError('දත්ත ඇතුලත් කිරීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleSelectPlan = (planType: 'monthly' | 'yearly' | 'partner' | 'bundle_monthly' | 'bundle_yearly') => {
    if (!disclaimerAccepted) {
      setSelectedPlan(planType);
      setShowDisclaimerModal(true);
    } else {
      setSelectedPlan(planType);
      setTxSubmitSuccess(false);
      
      setTimeout(() => {
        const payElement = document.getElementById('manual-payment-form-card');
        if (payElement) {
          payElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleAcceptDisclaimer = () => {
    setDisclaimerAccepted(true);
    setShowDisclaimerModal(false);
    
    setTimeout(() => {
      const payElement = document.getElementById('manual-payment-form-card');
      if (payElement) {
        payElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };


  // Sync selected default category for story submission
  useEffect(() => {
    if (categories.length > 0 && !newStoryCatId) {
      setNewStoryCatId(categories[0].id);
    }
  }, [categories, newStoryCatId]);

  // Handle User Story Submission
  const handleSubmitStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryTitle.trim() || !newStoryDesc.trim() || !newPartContent.trim() || !newStoryAuthor.trim()) {
      alert('කරුණාකර සියලුම අත්‍යවශ්‍ය තොරතුරු ඇතුලත් කරන්න.');
      return;
    }

    setStorySubmitStatus('submitting');
    try {
      const storyId = `story-user-${Date.now()}`;
      const partId = `part-${Date.now()}`;
      
      const newStory: Story = {
        id: storyId,
        title: newStoryTitle,
        description: newStoryDesc,
        categoryId: newStoryCatId || categories[0]?.id || '',
        author: newStoryAuthor,
        views: 0,
        likes: 0,
        ageRestricted: newStoryAgeLimit,
        isCompleted: false,
        addedDate: new Date().toISOString().split('T')[0],
        approved: false, // Must be approved by admin
        submittedBy: user.username,
        parts: [
          {
            id: partId,
            title: newPartTitle.trim() ? `කොටස 1: ${newPartTitle}` : 'කොටස 1: පළමු කොටස',
            content: newPartContent,
            partNumber: 1,
            addedDate: new Date().toISOString().split('T')[0]
          }
        ]
      };

      await addStory(newStory);
      
      // Reset Form fields
      setNewStoryTitle('');
      setNewStoryDesc('');
      setNewStoryAuthor('');
      setNewPartTitle('');
      setNewPartContent('');
      setStorySubmitStatus('success');
      
      setTimeout(() => {
        setStorySubmitStatus('idle');
        setShowSubmitStoryForm(false);
      }, 3000);
    } catch (err) {
      console.error('Error submitting story:', err);
      setStorySubmitStatus('error');
    }
  };

  // Handle Adding Next Part to user's story
  const handleAddNextPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoryForNextPart) return;
    if (!nextPartContent.trim()) {
      alert('කරුණාකර කොටසේ අන්තර්ගතය ලියන්න.');
      return;
    }

    setNextPartSubmitStatus('submitting');
    try {
      const nextPartNum = selectedStoryForNextPart.parts.length + 1;
      const partId = `part-${Date.now()}`;
      
      const newPart: StoryPart = {
        id: partId,
        title: nextPartTitle.trim() ? `කොටස ${nextPartNum}: ${nextPartTitle}` : `කොටස ${nextPartNum}`,
        content: nextPartContent,
        partNumber: nextPartNum,
        addedDate: new Date().toISOString().split('T')[0]
      };

      const updatedParts = [...selectedStoryForNextPart.parts, newPart];
      await updateStoryParts(selectedStoryForNextPart.id, updatedParts);

      setNextPartTitle('');
      setNextPartContent('');
      setSelectedStoryForNextPart(null);
      setNextPartSubmitStatus('success');
      
      setTimeout(() => {
        setNextPartSubmitStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Error adding story part:', err);
      setNextPartSubmitStatus('error');
    }
  };

  // Filter regular stories
  const filteredStories = stories.filter((story) => {
    const isApproved = story.approved !== false;
    const isMyStory = story.submittedBy === user.username;
    if (!isApproved && !isMyStory) return false;

    const matchesCategory = selectedCategoryId ? story.categoryId === selectedCategoryId : true;
    const matchesSearch = searchQuery.trim()
      ? story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.author.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const vipVideos = vipMediaList.filter(m => m.type === 'video');
  const vipMovies = vipMediaList.filter(m => m.type === 'movie');

  return (
    <div className="space-y-6" id="luxury-dashboard-container">
      
      {/* Real-time Payment Status Live Notification Banner */}
      {user.paymentNotification && (
        <div 
          id="live-payment-notification-banner"
          className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn ${
            user.paymentNotification.status === 'approved'
              ? 'bg-[#0a1a0e] border-emerald-500/30 text-white'
              : 'bg-[#1a0a0a] border-red-500/30 text-white'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className={`p-2 rounded-xl mt-0.5 ${
              user.paymentNotification.status === 'approved' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950/80 text-red-400'
            }`}>
              {user.paymentNotification.status === 'approved' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold font-serif flex items-center gap-2">
                {user.paymentNotification.status === 'approved' ? (
                  <span className="text-emerald-400">🎉 ගෙවීම් ඉල්ලීම අනුමතයි! (VIP Activated)</span>
                ) : (
                  <span className="text-red-400">⚠️ ගෙවීම් ඉල්ලීම ප්‍රතික්ෂේප කර ඇත</span>
                )}
              </h4>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                {user.paymentNotification.status === 'approved' ? (
                  <span>ඔබගේ ගෙවීම් තොරතුරු සාර්ථකව සත්‍යාපනය කර VIP සක්‍රීය කරන ලදී. සියලුම චිත්‍රපටි, වීඩියෝ සහ සහකාර සෙවුම් විශේෂාංග දැන් විවෘතයි!</span>
                ) : (
                  <span>ඔබ ඉදිරිපත් කල ගෙවීම් තොරතුරු ප්‍රතික්ෂේප කර ඇත. කරුණාකර නිවැරදි Transaction ID සහ තොරතුරු සහිතව නැවත ඉදිරිපත් කරන්න.</span>
                )}
              </p>
              <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500 font-mono">
                <span>ට්‍රාන්සෙක්ෂන් අංකය: {user.paymentNotification.transactionId}</span>
                <span>•</span>
                <span>දිනය: {new Date(user.paymentNotification.timestamp || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <button
            id="dismiss-live-notif-btn"
            onClick={async () => {
              try {
                await clearUserPaymentNotification(user.username);
              } catch (err) {
                console.error("Error clearing notification:", err);
              }
            }}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer whitespace-nowrap self-end md:self-center"
          >
            තේරුණා (Dismiss)
          </button>
        </div>
      )}

      {/* Luxury Welcome Banner & Tab Navigation */}
      <div className="relative bg-gradient-to-r from-[#141414] via-[#0d0d0d] to-[#1a140a] rounded-3xl p-6 md:p-8 border border-[#c9a86a]/15 shadow-2xl">
        <div className="absolute right-0 top-0 w-72 h-72 bg-[#c9a86a]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#1a140a] border border-[#c9a86a]/35 text-[#c9a86a] px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest font-mono flex items-center gap-1">
                <Crown size={12} className="text-[#c9a86a] animate-pulse" />
                VIP සාමාජික පුවරුව (Luxury Dashboard)
              </span>
              {user.isVip ? (
                <span className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  ACTIVE VIP
                </span>
              ) : (
                <span className="bg-amber-950/60 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  BASIC MEMBER
                </span>
              )}
            </div>
            
            <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide">
              ආයුබෝවන්, <span className="text-[#c9a86a]">{user.username}</span>!
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              ඔබගේ වාරික ගිණුම මගින් සුවිශේෂී කතන්දර, සජීවී VIP වීඩියෝ සහ වැඩිහිටියන්ට පමණක් සීමාවූ සිනමා නිර්මාණ රසවිඳිය හැක.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              id="tab-stories-btn"
              onClick={() => { setActiveTab('stories'); setActiveMedia(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'stories' 
                  ? 'bg-[#c9a86a] text-black shadow-lg shadow-[#c9a86a]/10' 
                  : 'bg-[#111] hover:bg-[#161616] border border-[#222] text-gray-300'
              }`}
            >
              <BookOpen size={13} />
              කතාන්දර එකතුව (Stories)
            </button>
            
            <button
              id="tab-movies-btn"
              onClick={() => { setActiveTab('movies'); setActiveMedia(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'movies' 
                  ? 'bg-[#c9a86a] text-black shadow-lg shadow-[#c9a86a]/10' 
                  : 'bg-[#111] hover:bg-[#161616] border border-[#222] text-gray-300'
              }`}
            >
              <Film size={13} />
              18+ චිත්‍රපටි (Movies)
            </button>

            <button
              id="tab-partners-btn"
              onClick={() => { setActiveTab('partners'); setActiveMedia(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'partners' 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/10' 
                  : 'bg-[#111] hover:bg-[#161616] border border-[#222] text-gray-300'
              }`}
            >
              <Heart size={13} className={activeTab === 'partners' ? 'animate-pulse text-white' : 'text-red-500'} />
              සහකාර සෙවුම (Partner Finding)
            </button>

            {!user.isVip && (
              <button
                id="tab-sub-btn"
                onClick={() => { setActiveTab('subscription'); setActiveMedia(null); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer animate-bounce ${
                  activeTab === 'subscription' 
                    ? 'bg-amber-500 text-black shadow-lg' 
                    : 'bg-gradient-to-r from-amber-600 to-[#c9a86a] text-white border border-amber-500/20'
                }`}
              >
                <Crown size={13} />
                VIP සාමාජිකත්වය ලබාගන්න
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: FREE STORIES LIST */}
      {activeTab === 'stories' && (
        <div className="space-y-8 animate-fadeIn">
          {/* USER STORY SUBMISSION & WRITING CENTER */}
          <div className="bg-[#111] border border-[#222] rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#222] pb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-[#c9a86a] flex items-center gap-2">
                  <BookOpen size={18} />
                  කතෘ මධ්‍යස්ථානය (Writing Center)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  ඔබේම නිර්මාණශීලී කතාන්දර මෙහි පළ කරන්න. ඇඩ්මින් අනුමැතිය ලැබුණු පසු සියලු දෙනාටම කියවිය හැක.
                </p>
              </div>
              <div className="flex gap-2">
                {!showSubmitStoryForm && !selectedStoryForNextPart && (
                  <button
                    onClick={() => {
                      setNewStoryAuthor(user.username);
                      setShowSubmitStoryForm(true);
                    }}
                    className="bg-[#c9a86a] hover:bg-[#bba061] text-black text-xs font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <PlusCircle size={14} />
                    අලුත් කතාවක් ලියන්න
                  </button>
                )}
                {(showSubmitStoryForm || selectedStoryForNextPart) && (
                  <button
                    onClick={() => {
                      setShowSubmitStoryForm(false);
                      setSelectedStoryForNextPart(null);
                    }}
                    className="bg-[#1a1a1a] border border-[#333] hover:bg-[#222] text-[#c9a86a] text-xs font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer"
                  >
                    මගේ කතා ලැයිස්තුව බලන්න
                  </button>
                )}
              </div>
            </div>

            {/* FORM 1: SUBMIT NEW STORY */}
            {showSubmitStoryForm && (
              <form onSubmit={handleSubmitStory} className="space-y-4 animate-fadeIn">
                <h4 className="text-xs font-serif font-bold text-[#c9a86a] uppercase tracking-wider">නව කතාවක් ලියාපදිංචි කිරීම</h4>
                
                {storySubmitStatus === 'success' && (
                  <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs p-4 rounded-xl">
                    🎉 ඔබගේ කතාව සාර්ථකව ඉදිරිපත් කරන ලදී! ඇඩ්මින් විසින් පරීක්ෂා කිරීමෙන් පසු එය ප්‍රසිද්ධ කරනු ඇත.
                  </div>
                )}
                {storySubmitStatus === 'error' && (
                  <div className="bg-red-950/40 border border-red-900/50 text-red-300 text-xs p-4 rounded-xl">
                    ❌ කතාව ඉදිරිපත් කිරීමේදී දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">කතාවේ මාතෘකාව (Story Title) *</label>
                    <input
                      type="text"
                      placeholder="e.g. සඳකැන් වැස්ස"
                      value={newStoryTitle}
                      onChange={(e) => setNewStoryTitle(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl p-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                      required
                      disabled={storySubmitStatus === 'submitting'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">කර්තෘ නාමය (Author Name) *</label>
                    <input
                      type="text"
                      placeholder="e.g. රචකයාගේ නම"
                      value={newStoryAuthor}
                      onChange={(e) => setNewStoryAuthor(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl p-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                      required
                      disabled={storySubmitStatus === 'submitting'}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">කතාවේ ප්‍රභේදය (Category) *</label>
                    <select
                      value={newStoryCatId}
                      onChange={(e) => setNewStoryCatId(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl p-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors cursor-pointer"
                      disabled={storySubmitStatus === 'submitting'}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2.5 cursor-pointer mt-4">
                      <input
                        type="checkbox"
                        checked={newStoryAgeLimit}
                        onChange={(e) => setNewStoryAgeLimit(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#c9a86a] cursor-pointer"
                        disabled={storySubmitStatus === 'submitting'}
                      />
                      <span className="text-xs font-bold text-gray-300">🔞 වැඩිහිටියන්ට පමණි (Adult 18+ Rated)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">කතාවේ හැඳින්වීම / සාරාංශය (Synopsis) *</label>
                  <textarea
                    placeholder="කතාව පිළිබඳව කෙටි හැඳින්වීමක් මෙහි ලියන්න. මෙය ප්‍රධාන පිටුවේ දිස්වේ..."
                    value={newStoryDesc}
                    onChange={(e) => setNewStoryDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl p-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                    required
                    disabled={storySubmitStatus === 'submitting'}
                  />
                </div>

                <div className="border-t border-[#222] pt-4 mt-2 space-y-4">
                  <h5 className="text-xs font-bold text-gray-300">පළමු කොටස ලියන්න (Write Part 1)</h5>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">කොටසේ මාතෘකාව (Part Title) - විකල්ප</label>
                    <input
                      type="text"
                      placeholder="e.g. වැහි බිංදු සහ කෝපි සුවඳ (හිස්ව තැබුවහොත් 'පළමු කොටස' ලෙස සකසනු ඇත)"
                      value={newPartTitle}
                      onChange={(e) => setNewPartTitle(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl p-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                      disabled={storySubmitStatus === 'submitting'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">කොටසේ සම්පූර්ණ අන්තර්ගතය (Story Content) *</label>
                    <textarea
                      placeholder="කතාවේ සම්පූර්ණ අන්තර්ගතය කිසිදු සීමාවකින් තොරව මෙහි ලියන්න..."
                      value={newPartContent}
                      onChange={(e) => setNewPartContent(e.target.value)}
                      rows={8}
                      className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-[#c9a86a] transition-colors"
                      required
                      disabled={storySubmitStatus === 'submitting'}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={storySubmitStatus === 'submitting'}
                  className="bg-[#c9a86a] hover:bg-[#bba061] text-black text-xs font-bold py-3 px-6 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {storySubmitStatus === 'submitting' ? 'ඉදිරිපත් කරමින්...' : 'කතාව සහ පළමු කොටස ඉදිරිපත් කරන්න'}
                </button>
              </form>
            )}

            {/* FORM 2: ADD NEXT PART */}
            {selectedStoryForNextPart && (
              <form onSubmit={handleAddNextPart} className="space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-serif font-bold text-[#c9a86a] uppercase tracking-wider">
                    '{selectedStoryForNextPart.title}' කතාවට ඊළඟ කොටස එක් කිරීම
                  </h4>
                  <span className="text-[10px] bg-[#222] text-white px-2 py-1 rounded font-mono">
                    ඊළඟ කොටස් අංකය: {selectedStoryForNextPart.parts.length + 1}
                  </span>
                </div>

                {nextPartSubmitStatus === 'success' && (
                  <div className="bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-xs p-4 rounded-xl">
                    🎉 නව කොටස සාර්ථකව එක් කරන ලදී!
                  </div>
                )}
                {nextPartSubmitStatus === 'error' && (
                  <div className="bg-red-950/40 border border-red-900/50 text-red-300 text-xs p-4 rounded-xl">
                    ❌ කොටස එක් කිරීමේදී දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">ඊළඟ කොටසේ මාතෘකාව (Part Title)</label>
                  <input
                    type="text"
                    placeholder={`e.g. ${selectedStoryForNextPart.parts.length + 1} වන කොටස`}
                    value={nextPartTitle}
                    onChange={(e) => setNextPartTitle(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl p-3 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
                    disabled={nextPartSubmitStatus === 'submitting'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">කොටසේ සම්පූර්ණ අන්තර්ගතය (Story Content) *</label>
                  <textarea
                    placeholder="කතාවේ මෙම කොටස කිසිදු සීමාවකින් තොරව මෙහි ලියන්න..."
                    value={nextPartContent}
                    onChange={(e) => setNextPartContent(e.target.value)}
                    rows={8}
                    className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-[#c9a86a] transition-colors"
                    required
                    disabled={nextPartSubmitStatus === 'submitting'}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={nextPartSubmitStatus === 'submitting'}
                    className="bg-[#c9a86a] hover:bg-[#bba061] text-black text-xs font-bold py-3 px-6 rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {nextPartSubmitStatus === 'submitting' ? 'එක් කරමින්...' : 'කොටස එක් කරන්න'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStoryForNextPart(null)}
                    className="bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-gray-300 text-xs font-bold py-3 px-5 rounded-full cursor-pointer"
                  >
                    අවලංගු කරන්න
                  </button>
                </div>
              </form>
            )}

            {/* VIEW: MY STORIES LIST */}
            {!showSubmitStoryForm && !selectedStoryForNextPart && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-xs font-serif font-bold text-gray-400 uppercase tracking-wider">මගේ කතා එකතුව (My Submitted Stories)</h4>
                
                {stories.filter(s => s.submittedBy === user.username).length === 0 ? (
                  <div className="text-center py-8 bg-[#0a0a0a] border border-[#222] rounded-2xl">
                    <p className="text-xs text-gray-500 font-medium">ඔබ තවමත් කතාවක් ඉදිරිපත් කර නොමැත. ඔබේ පළමු කතාව අදම ලියන්න!</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {stories
                      .filter(s => s.submittedBy === user.username)
                      .map((myStory) => {
                        const isApproved = myStory.approved !== false;
                        return (
                          <div key={myStory.id} className="bg-[#0a0a0a] border border-[#222] p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="bg-[#111] text-[10px] border border-[#222] px-2.5 py-0.5 rounded text-gray-400 font-mono">
                                  {categories.find(c => c.id === myStory.categoryId)?.name || 'වෙනත්'}
                                </span>
                                {isApproved ? (
                                  <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 text-[9px] px-2 py-0.5 rounded-full font-bold">
                                    ප්‍රසිද්ධ කර ඇත (Published)
                                  </span>
                                ) : (
                                  <span className="bg-amber-950/40 text-amber-400 border border-amber-900/40 text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                    අනුමැතිය සඳහා රැඳී පවතී (Pending Approval)
                                  </span>
                                )}
                              </div>
                              <h5 className="font-serif font-bold text-white text-sm mt-1">{myStory.title}</h5>
                              <p className="text-[10px] text-gray-500 font-mono">කර්තෘ: {myStory.author} | කොටස්: {myStory.parts.length}</p>
                              <p className="text-gray-400 text-xs mt-1.5 line-clamp-2">{myStory.description}</p>
                            </div>

                            <button
                              onClick={() => {
                                setNextPartTitle('');
                                setNextPartContent('');
                                setSelectedStoryForNextPart(myStory);
                              }}
                              className="w-full bg-[#161616] hover:bg-[#222] border border-[#2d2d2d] text-[#c9a86a] hover:text-white transition-colors text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                            >
                              <PlusCircle size={12} />
                              ඊළඟ කොටසක් එක් කරන්න (Add Next Part)
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category List */}
          <CategoryList
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={onSelectCategory}
          />

          {/* Dynamic Ad Placement based on VIP status */}
          {user.isVip ? (
            <div className="bg-[#111] border border-[#222] rounded-2xl p-2 flex items-center justify-center">
              <AdBanner320x50 isVip={true} />
            </div>
          ) : (
            <SmartlinkButton type="fast-server" />
          )}

          {/* Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#111] p-4 rounded-2xl border border-[#222]">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 text-[#c9a86a]" size={16} />
              <input
                id="story-search-input"
                type="text"
                placeholder="කතාවේ නම, කර්තෘ හෝ විස්තර අනුව සොයන්න..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-[#c9a86a] transition-colors"
              />
            </div>

            {/* Reset active filters */}
            {(selectedCategoryId || searchQuery) && (
              <button
                id="reset-search-filters"
                onClick={() => {
                  onSelectCategory(null);
                  onSearchQueryChange('');
                }}
                className="text-xs font-bold text-[#c9a86a] hover:text-[#bba061] underline decoration-dotted underline-offset-4 cursor-pointer"
              >
                සෙවුම් පෙරහන් ඉවත් කරන්න
              </button>
            )}
          </div>

          {/* Story list */}
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
                    onReadPart={onReadPart}
                    onSelectStory={onSelectStory}
                    isLiked={user.likedStories.includes(story.id)}
                    onLikeToggle={onLikeToggle}
                  />
                ))}
              </div>
            )}

            {/* Bottom Ad Section inside Registered User Dashboard */}
            <div className="grid md:grid-cols-2 gap-6 items-center mt-8">
              <AdBanner300x250 isVip={user.isVip} />
              <SmartlinkButton type="lottery" />
            </div>
            
            <AdNativeBanner isVip={user.isVip} />
          </div>
        </div>
      )}

      {/* TAB 3: VIP MOVIES */}
      {activeTab === 'movies' && (
        <div className="animate-fadeIn space-y-6">
          {!user.isVip ? (
            /* Locked screen */
            <div className="text-center py-16 px-6 bg-gradient-to-b from-[#111] to-[#0a0a0a] border border-[#c9a86a]/15 rounded-3xl max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-[#c9a86a] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Lock size={32} className="animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-white">VIP 18+ චිත්‍රපටි නැරඹීම සඳහා ඔබට ප්‍රවේශය නොමැත</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  මෙම වැඩිහිටි චිත්‍රපටි සහ සිනමා නිර්මාණ නැරඹීමට නම් ඔබ සජීවී VIP සාමාජිකයෙකු විය යුතුය. ඉතා සුළු මුදලක් ගෙවා PayPal හෝ Card මගින් ක්ෂණිකව ඔබගේ VIP සාමාජිකත්වය සක්‍රීය කරගන්න.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('subscription')}
                className="px-6 py-3 bg-[#c9a86a] hover:bg-[#bba061] text-black font-extrabold text-xs rounded-full transition-all cursor-pointer flex items-center gap-2 mx-auto shadow-lg active:scale-95 animate-pulse"
              >
                VIP සාමාජිකත්වය මිලදී ගන්න <ArrowRight size={14} />
              </button>

              {/* Conversion & Monetization Ads on Lock Screen */}
              <div className="pt-6 border-t border-[#222] space-y-4">
                <SmartlinkButton type="hot-stories" />
                <AdBanner300x250 isVip={false} />
              </div>
            </div>
          ) : (
            /* VIP Movies screen */
            <div className="space-y-8">
              {/* Premium Subtle Ad Banner at Top of VIP Movies */}
              <div className="bg-[#111] border border-[#c9a86a]/10 rounded-2xl p-1.5 flex items-center justify-center">
                <AdBanner320x50 isVip={true} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#c9a86a] flex items-center gap-2">
                    <Film size={18} /> 18+ වැඩිහිටි VIP චිත්‍රපටි (Premium Movies)
                  </h3>
                  <p className="text-xs text-gray-500">වැඩිහිටි ප්‍රජාව උදෙසා වෙන්වූ විශේෂාංග සිනමාපට එකතුව.</p>
                </div>
                <span className="bg-[#111] text-xs px-3 py-1 rounded-full border border-[#222] font-mono text-gray-400">
                  චිත්‍රපටි {vipMovies.length} ක් ඇත
                </span>
              </div>

              {activeMedia && activeMedia.type === 'movie' && (
                <div className="bg-[#111] border border-[#c9a86a]/20 rounded-3xl overflow-hidden shadow-2xl p-4 md:p-6 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] text-[#c9a86a] uppercase font-bold tracking-widest font-mono">දැනට ධාවනය වේ (Now Playing Cinema)</span>
                      <h4 className="text-base md:text-lg font-bold text-white mt-1">{activeMedia.title}</h4>
                    </div>
                    <button 
                      onClick={() => setActiveMedia(null)}
                      className="text-xs text-gray-400 hover:text-white bg-[#222] hover:bg-[#2d2d2d] px-3 py-1.5 rounded-xl transition-all"
                    >
                      වසා දමන්න
                    </button>
                  </div>
                  
                  {/* Embedded Player */}
                  <div className="aspect-video w-full max-w-4xl mx-auto bg-black rounded-2xl border border-[#222] overflow-hidden flex items-center justify-center">
                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: activeMedia.embedCode }} />
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed max-w-3xl mt-2">{activeMedia.description}</p>
                </div>
              )}

              {vipMovies.length === 0 ? (
                <div className="text-center py-16 bg-[#111] border border-[#222] rounded-2xl">
                  <p className="text-xs text-gray-500">තවමත් කිසිදු VIP චිත්‍රපටියක් ඇතුළත් කර නොමැත.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {vipMovies.map((media) => (
                    <div 
                      key={media.id}
                      className="bg-gradient-to-b from-[#111] to-[#0d0d0d] border border-[#222] hover:border-[#c9a86a]/30 rounded-2xl p-5 space-y-4 transition-all group hover:-translate-y-1 shadow-lg"
                    >
                      <div className="aspect-video w-full bg-black/60 rounded-xl flex items-center justify-center relative overflow-hidden group border border-[#1a1a1a]">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-85 z-10"></div>
                        <Film size={36} className="text-[#c9a86a] group-hover:scale-125 transition-transform relative z-20" />
                        <span className="absolute bottom-3 left-3 bg-red-950/80 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-900/50 z-20">18+ CINEMA</span>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white group-hover:text-[#c9a86a] transition-colors">{media.title}</h4>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{media.description}</p>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-[#1a1a1a]">
                        <span className="text-[10px] text-gray-500 font-mono">{media.addedDate}</span>
                        <button
                          onClick={() => setActiveMedia(media)}
                          className="text-xs font-bold text-[#c9a86a] hover:text-[#e4cf9c] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          සිනමාව නැරඹීමට →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Native Recommendations below VIP movies */}
              <AdNativeBanner isVip={true} />
            </div>
          )}
        </div>
      )}

      {/* TAB 3.5: PARTNERS FINDING / MATCHMAKING */}
      {activeTab === 'partners' && (
        <div className="animate-fadeIn space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-red-950/20 via-[#0d0d0d] to-red-950/10 border border-red-900/10 p-6 rounded-3xl">
            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold text-red-400 flex items-center gap-2">
                <Heart className="text-red-500 animate-pulse" size={20} /> රස සහකාර සෙවුම (Rasa Matchmaking Service)
              </h3>
              <p className="text-xs text-gray-400">හදවත් එකතු කරන, රහස්‍යභාවය සුරැකි අතිවිශේෂ මනමාල/මනමාලියන් සෙවීමේ සේවාව.</p>
            </div>
            <button
              onClick={() => setShowPartnerForm(!showPartnerForm)}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95"
            >
              <PlusCircle size={14} />
              {showPartnerForm ? 'දැන්වීම් ලැයිස්තුව (Show Profiles)' : 'ඔබේ දැන්වීමක් ඇතුළත් කරන්න (Post Profile)'}
            </button>
          </div>

          {showPartnerForm ? (
            /* Submission Form */
            <div className="bg-[#111] border border-red-900/20 p-6 md:p-8 rounded-3xl max-w-2xl mx-auto space-y-6 animate-fadeIn">
              <div className="text-center pb-4 border-b border-[#222]">
                <h4 className="text-base font-bold text-white">නව සහකාර දැන්වීමක් ඇතුළත් කිරීමේ පත්‍රිකාව</h4>
                <p className="text-[11px] text-gray-400 mt-1">සියලු තොරතුරු ඇඩ්මින් මඩුල්ල විසින් සමාලෝචනය කිරීමෙන් පසු ප්‍රදර්ශනය කෙරේ.</p>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!partnerName || !partnerLocation || !partnerContact || !partnerBio) {
                  setPartnerSubmitStatus('error');
                  return;
                }
                setPartnerSubmitStatus('submitting');
                try {
                  const newProfile: PartnerProfile = {
                    id: 'partner_' + Date.now(),
                    name: partnerName,
                    gender: partnerGender,
                    age: Number(partnerAge),
                    location: partnerLocation,
                    occupation: partnerOccupation || 'නොදන්වා ඇත',
                    bio: partnerBio,
                    lookingFor: partnerLookingFor || 'සුදුසු සහකරුවෙකු',
                    contactDetails: partnerContact,
                    photoUrl: partnerPhotoUrl || '',
                    approved: false,
                    addedDate: new Date().toISOString().split('T')[0],
                    submittedBy: user.username
                  };
                  await addPartnerProfile(newProfile);
                  setPartnerSubmitStatus('success');
                  setPartnerName('');
                  setPartnerLocation('');
                  setPartnerOccupation('');
                  setPartnerPhotoUrl('');
                  setPartnerBio('');
                  setPartnerLookingFor('');
                  setPartnerContact('');
                  setTimeout(() => {
                    setShowPartnerForm(false);
                    setPartnerSubmitStatus('idle');
                  }, 2000);
                } catch (err) {
                  console.error(err);
                  setPartnerSubmitStatus('error');
                }
              }} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-300 block">නම / අන්වර්ථ නාමය (Name/Alias) *</label>
                    <input
                      type="text"
                      required
                      placeholder="උදා: නිමාලි, අසංක"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-300 block">ස්ත්‍රී / පුරුෂ භාවය (Gender) *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPartnerGender('female')}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                          partnerGender === 'female' 
                            ? 'bg-rose-500/10 border-rose-500 text-rose-400' 
                            : 'bg-[#0a0a0a] border-[#222] text-gray-400 hover:text-white'
                        }`}
                      >
                        මනමාලියක් (Female)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPartnerGender('male')}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                          partnerGender === 'male' 
                            ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                            : 'bg-[#0a0a0a] border-[#222] text-gray-400 hover:text-white'
                        }`}
                      >
                        මනමාලයෙක් (Male)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-300 block">වයස (Age) *</label>
                    <input
                      type="number"
                      required
                      min={18}
                      max={100}
                      value={partnerAge}
                      onChange={(e) => setPartnerAge(Number(e.target.value))}
                      className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-300 block">පදිංචි ප්‍රදේශය (Location) *</label>
                    <input
                      type="text"
                      required
                      placeholder="උදා: කොළඹ, නුවරඑළිය, ඩුබායි"
                      value={partnerLocation}
                      onChange={(e) => setPartnerLocation(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-300 block">රැකියාව (Occupation)</label>
                    <input
                      type="text"
                      placeholder="උදා: ගුරු, ව්‍යාපාරික, විධායක"
                      value={partnerOccupation}
                      onChange={(e) => setPartnerOccupation(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-300 block">ඡායාරූප සබැඳිය (Photo URL - Optional)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={partnerPhotoUrl}
                      onChange={(e) => setPartnerPhotoUrl(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 block">මා පිළිබඳ හැඳින්වීම (Bio / About Me) *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="ඔබේ ගතිගුණ සහ ජීවන රටාව පිළිබඳව කෙටියෙන් ලියන්න..."
                    value={partnerBio}
                    onChange={(e) => setPartnerBio(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-red-500 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 block">බලාපොරොත්තු වන සහකරුගේ සුදුසුකම් (Looking For)</label>
                  <input
                    type="text"
                    placeholder="උදා: දුම්පානය නොකරන, කරුණාවන්ත, අවංක කෙනෙක්"
                    value={partnerLookingFor}
                    onChange={(e) => setPartnerLookingFor(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 block">දුරකථන අංකය හෝ සබඳතා විස්තර (Contact Details) *</label>
                  <input
                    type="text"
                    required
                    placeholder="දුරකථන අංකය, විද්‍යුත් ලිපිනය හෝ Telegram ID"
                    value={partnerContact}
                    onChange={(e) => setPartnerContact(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#222] text-white rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <p className="text-[10px] text-gray-500">මෙම සබඳතා තොරතුරු දැකිය හැක්කේ VIP / Matchmaking සක්‍රීය සාමාජිකයින්ට පමණි.</p>
                </div>

                {partnerSubmitStatus === 'success' ? (
                  <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl text-center text-xs font-bold text-emerald-400">
                    🎉 දැන්වීම සාර්ථකව ඉදිරිපත් කරන ලදී! ඇඩ්මින් අනුමැතිය ලැබුණු පසු ප්‍රදර්ශනය වනු ඇත.
                  </div>
                ) : partnerSubmitStatus === 'error' ? (
                  <div className="bg-red-950/30 border border-red-500/30 p-4 rounded-xl text-center text-xs font-bold text-red-400">
                    ⚠️ කරුණාකර සියලුම අනිවාර්ය ක්ෂේත්‍ර නිවැරදිව පුරවන්න.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={partnerSubmitStatus === 'submitting'}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                  >
                    {partnerSubmitStatus === 'submitting' ? 'පද්ධතියට ඇතුළත් කරමින්...' : 'දැන්වීම ඉදිරිපත් කරන්න'}
                  </button>
                )}
              </form>
            </div>
          ) : (
            /* Profiles Grid View */
            <div className="space-y-6">
              {/* Filter controls */}
              <div className="flex items-center gap-2 bg-[#111] p-2 rounded-2xl border border-[#222] w-fit">
                <button
                  onClick={() => setPartnerFilterGender('all')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    partnerFilterGender === 'all' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  සියලු දෙනා (All)
                </button>
                <button
                  onClick={() => setPartnerFilterGender('female')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    partnerFilterGender === 'female' ? 'bg-rose-500 text-white' : 'text-gray-400 hover:text-rose-400'
                  }`}
                >
                  මනමාලියන් (Female)
                </button>
                <button
                  onClick={() => setPartnerFilterGender('male')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    partnerFilterGender === 'male' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-blue-400'
                  }`}
                >
                  මනමාලයන් (Male)
                </button>
              </div>

              {partnerProfiles.filter(p => {
                const isApproved = p.approved || p.submittedBy === user.username;
                const matchesGender = partnerFilterGender === 'all' || p.gender === partnerFilterGender;
                return isApproved && matchesGender;
              }).length === 0 ? (
                <div className="text-center py-16 bg-[#111] border border-[#222] rounded-2xl">
                  <p className="text-xs text-gray-500">ගැලපෙන සහකාර දැන්වීම් කිසිවක් හමු නොවීය.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {partnerProfiles.filter(p => {
                    const isApproved = p.approved || p.submittedBy === user.username;
                    const matchesGender = partnerFilterGender === 'all' || p.gender === partnerFilterGender;
                    return isApproved && matchesGender;
                  }).map((profile) => {
                    const displayName = profile.name;
                    const hasAccess = user.hasPartnerAccess || profile.submittedBy === user.username;
                    return (
                      <div 
                        key={profile.id}
                        className={`bg-[#111] border rounded-2xl p-5 space-y-4 shadow-lg transition-all flex flex-col justify-between ${
                          profile.gender === 'female' ? 'hover:border-rose-500/20' : 'hover:border-blue-500/20'
                        } ${!profile.approved ? 'opacity-70 border-yellow-600/30 ring-1 ring-yellow-600/20' : 'border-[#222]'}`}
                      >
                        <div className="space-y-3">
                          {/* Top row */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                              profile.gender === 'female' 
                                ? 'bg-rose-950/60 text-rose-400 border border-rose-900/40' 
                                : 'bg-blue-950/60 text-blue-400 border border-blue-900/40'
                            }`}>
                              {profile.gender === 'female' ? '👰 මනමාලි (Bride)' : '🤵 මනමාලයා (Groom)'}
                            </span>
                            {!profile.approved && (
                              <span className="text-[9px] font-bold bg-yellow-950/50 text-yellow-500 px-2 py-0.5 border border-yellow-900/40 rounded">
                                අනුමැතිය අපේක්ෂාවෙන්
                              </span>
                            )}
                          </div>

                          {/* Profile Banner Photo or Placeholders */}
                          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-neutral-900 border border-[#222]">
                            {profile.photoUrl ? (
                              <img
                                src={profile.photoUrl}
                                alt={displayName}
                                referrerPolicy="no-referrer"
                                className={`w-full h-full object-cover transition-all ${
                                  hasAccess ? '' : 'filter blur-md md:blur-lg scale-105'
                                }`}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-4xl bg-[#141414] text-neutral-700">
                                {profile.gender === 'male' ? '🤵' : '👰'}
                                <span className="text-[9px] uppercase tracking-widest text-neutral-600 font-extrabold mt-2">No Photo Provided</span>
                              </div>
                            )}

                            {!hasAccess && profile.photoUrl && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#c9a86a] bg-black/80 px-2.5 py-1 rounded-full border border-[#c9a86a]/30 flex items-center gap-1">
                                  <Lock size={10} /> VIP සාමාජිකයින්ට පමණි
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm font-bold text-white font-serif flex items-center gap-1.5">
                              {displayName}
                            </h4>

                            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-gray-400 bg-[#141414] p-2 rounded-xl border border-[#222]">
                              <div><span className="text-gray-600">වයස:</span> <span className="text-white font-mono">{profile.age}</span></div>
                              <div><span className="text-gray-600">පදිංචිය:</span> <span className="text-white">{profile.location}</span></div>
                              <div className="col-span-2 truncate"><span className="text-gray-600">රැකියාව:</span> <span className="text-white">{profile.occupation}</span></div>
                            </div>

                            <p className="text-[10px] text-gray-300 leading-relaxed italic line-clamp-2 bg-black/30 p-2 rounded-lg">
                              "{profile.bio}"
                            </p>

                            <p className="text-[10px] text-[#c9a86a] leading-relaxed">
                              <span className="text-gray-500">බලාපොරොත්තුව:</span> {profile.lookingFor}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#1a1a1a] mt-4">
                          {hasAccess ? (
                            <div className="bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl space-y-1.5">
                              <span className="text-[9px] text-emerald-400 uppercase font-bold block">සබඳතා තොරතුරු (Contact Info):</span>
                              <p className="text-[11px] font-mono font-bold text-white select-all break-all">{profile.contactDetails}</p>
                            </div>
                          ) : (
                            <div className="bg-[#1a130b] border border-amber-950/50 p-2.5 rounded-xl flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Lock size={11} className="text-[#c9a86a]" />
                                <span className="text-[9px] text-gray-400">දුරකථන අංකය බැලීමට VIP වන්න</span>
                              </div>
                              <button 
                                onClick={() => setActiveTab('subscription')} 
                                className="text-[9px] bg-gradient-to-r from-amber-600 to-[#c9a86a] text-black font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer border-0"
                              >
                                VIP
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3 py-6">
            <span className="text-[10px] font-black uppercase bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-1 rounded-full tracking-widest">
              👑 PREMIUM PLANS
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-black text-white tracking-tight">VIP සාමාජිකත්වය ලබාගන්න</h2>
            <p className="text-xs text-gray-400">සියලුම 18+ චිත්‍රපට, කථාන්දර සහ සහකාර සෙවුම් පහසුකම් ලබාගැනීමට පහතින් පැකේජයක් සක්‍රීය කරගන්න.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Plan 1: Popular VIP Package (monthly) */}
            <div className={`bg-gradient-to-b from-[#141414] to-[#0e0e0e] border rounded-3xl p-5 flex flex-col justify-between space-y-5 relative transition-all ${
              selectedPlan === 'monthly' ? 'border-[#c9a86a] ring-1 ring-[#c9a86a]' : 'border-[#222] hover:border-gray-800'
            }`}>
              <div className="absolute -top-3 left-4 bg-gradient-to-r from-amber-600 to-[#c9a86a] text-black text-[8px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full">
                🔥 POPULAR VIP
              </div>
              
              <div className="space-y-3">
                <div className="pt-2">
                  <h4 className="text-sm font-serif font-bold text-white">Popular VIP Package</h4>
                  <p className="text-[10px] text-gray-400 mt-1">අවම දැන්වීම් සමඟ සුමට අත්දැකීමක්.</p>
                </div>

                <div className="pt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-white font-mono">රු. 500/-</span>
                    <span className="text-[10px] text-gray-500">මාසිකව</span>
                  </div>
                  <p className="text-[9px] text-amber-500 font-semibold">සෑම මාසයකටම රු. 500/- ක් පමණි.</p>
                </div>

                <ul className="space-y-1.5 text-[10px] text-gray-300 pt-3 border-t border-[#1a1a1a]">
                  <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-[#c9a86a]" /> සියලුම 18+ චිත්‍රපටි නැරඹීම</li>
                  <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-[#c9a86a]" /> අවම දැන්වීම් වලින් තොරව ධාවනය</li>
                  <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-[#c9a86a]" /> ඕනෑම වේලාවක අවලංගු කිරීමේ හැකියාව</li>
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan('monthly')}
                className={`w-full py-2 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                  selectedPlan === 'monthly'
                    ? 'bg-[#c9a86a] text-black'
                    : 'bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-[#c9a86a]'
                }`}
              >
                {selectedPlan === 'monthly' ? 'Selected' : 'Select'}
              </button>
            </div>

            {/* Plan 2: SAVE BIG (yearly) */}
            <div className={`bg-gradient-to-b from-[#141414] to-[#0e0e0e] border rounded-3xl p-5 flex flex-col justify-between space-y-5 relative transition-all ${
              selectedPlan === 'yearly' ? 'border-[#c9a86a] ring-1 ring-[#c9a86a]' : 'border-[#222] hover:border-gray-800'
            }`}>
              <div className="absolute -top-3 left-4 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[8px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full">
                ⭐ SAVE BIG (වාර්ෂික)
              </div>

              <div className="space-y-3">
                <div className="pt-2">
                  <h4 className="text-sm font-serif font-bold text-white">SAVE BIG (වාර්ෂික සැලසුම)</h4>
                  <p className="text-[10px] text-gray-400 mt-1">දින 365 පුරාම අඛණ්ඩ ප්‍රවේශය.</p>
                </div>

                <div className="pt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-[#c9a86a] font-mono">රු. 1,500/-</span>
                    <span className="text-[10px] text-gray-500">වසරකට</span>
                  </div>
                  <p className="text-[9px] text-emerald-400 font-semibold">වසරකට වරක් පමණක් අයවන සුපිරි ක්‍රමය.</p>
                </div>

                <ul className="space-y-1.5 text-[10px] text-gray-300 pt-3 border-t border-[#1a1a1a]">
                  <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-[#c9a86a]" /> සියලුම 18+ චිත්‍රපටි නැරඹීම</li>
                  <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-[#c9a86a]" /> නවතම VIP කථා වලට මුලින්ම ප්‍රවේශය</li>
                  <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-[#c9a86a]" /> දින 365 පුරා අසීමිත ප්‍රවේශය</li>
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan('yearly')}
                className={`w-full py-2 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                  selectedPlan === 'yearly'
                    ? 'bg-[#c9a86a] text-black'
                    : 'bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-[#c9a86a]'
                }`}
              >
                {selectedPlan === 'yearly' ? 'Selected' : 'Select'}
              </button>
            </div>

            {/* Plan 3: Top (bundle_monthly) */}
            <div className={`bg-gradient-to-b from-[#141414] to-[#0e0e0e] border rounded-3xl p-5 flex flex-col justify-between space-y-5 relative transition-all ${
              selectedPlan === 'bundle_monthly' ? 'border-[#c9a86a] ring-1 ring-[#c9a86a]' : 'border-[#222] hover:border-gray-800'
            }`}>
              <div className="absolute -top-3 left-4 bg-blue-950/80 border border-blue-500/30 text-blue-400 text-[8px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full">
                👑 TOP BUNDLE
              </div>

              <div className="space-y-3">
                <div className="pt-2">
                  <h4 className="text-sm font-serif font-bold text-white">Top Package</h4>
                  <p className="text-[10px] text-gray-400 mt-1">චිත්‍රපට සහ සහකාර සෙවුම්.</p>
                </div>

                <div className="pt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-white font-mono">රු. 1,800/-</span>
                    <span className="text-[10px] text-gray-500">මාසිකව</span>
                  </div>
                  <p className="text-[9px] text-blue-400 font-semibold">සෑම මසකම අළුත් සහකාරියන් සොයාගන්න.</p>
                </div>

                <ul className="space-y-1.5 text-[10px] text-gray-300 pt-3 border-t border-[#1a1a1a]">
                  <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-blue-500" /> සියලුම 18+ චිත්‍රපටි නැරඹීම</li>
                  <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-blue-500" /> නවතම VIP කථා වලට මුලින්ම ප්‍රවේශය</li>
                  <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-blue-500" /> Partner finding සඳහා සම්පූර්ණ ඇක්සස්</li>
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan('bundle_monthly')}
                className={`w-full py-2 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                  selectedPlan === 'bundle_monthly'
                    ? 'bg-[#c9a86a] text-black'
                    : 'bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-[#c9a86a]'
                }`}
              >
                {selectedPlan === 'bundle_monthly' ? 'Selected' : 'Select'}
              </button>
            </div>

            {/* Plan 4: BEST VALUE (bundle_yearly) */}
            <div className={`bg-gradient-to-b from-[#141414] to-[#0e0e0e] border rounded-3xl p-5 flex flex-col justify-between space-y-5 relative transition-all ${
              selectedPlan === 'bundle_yearly' ? 'border-[#c9a86a] ring-1 ring-[#c9a86a]' : 'border-[#222] hover:border-gray-800'
            }`}>
              <div className="absolute -top-3 right-4 bg-[#c9a86a] text-black text-[8px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full">
                💎 BEST VALUE
              </div>

              <div className="space-y-3">
                <div className="pt-2">
                  <h4 className="text-sm font-serif font-bold text-white">BEST VALUE (වාර්ෂික)</h4>
                  <p className="text-[10px] text-gray-400 mt-1">වසරකම සියලුම සේවාවන් අඩංගು මිටිය.</p>
                </div>

                <div className="pt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-[#c9a86a] font-mono">රු. 3,000/-</span>
                    <span className="text-[10px] text-gray-500">වසරකට</span>
                  </div>
                  <p className="text-[9px] text-emerald-400 font-semibold">50% කට වඩා ඉතිරියක් සහිත වාර්ෂික සැලසුම.</p>
                </div>

                <ul className="space-y-1.5 text-[10px] text-[#e4cf9c] pt-3 border-t border-[#1a1a1a]">
                  <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-[#c9a86a]" /> දින 365 පුරාම අසීමිතව සියල්ල විවෘත වේ</li>
                  <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-[#c9a86a]" /> සියලුම 18+ චිත්‍රපටි සහ VIP කථා</li>
                  <li className="flex items-center gap-1.5"><CheckCircle size={11} className="text-[#c9a86a]" /> සහකාර සෙවුමේ සියලු සම්බන්ධතා ඇතුළු සම්පූර්ණ ඇක්සස්</li>
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan('bundle_yearly')}
                className={`w-full py-2 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                  selectedPlan === 'bundle_yearly'
                    ? 'bg-[#c9a86a] text-black'
                    : 'bg-gradient-to-r from-amber-600 to-[#c9a86a] text-black'
                }`}
              >
                {selectedPlan === 'bundle_yearly' ? 'Selected' : 'Select'}
              </button>
            </div>

          </div>

          {/* MANUAL QR CODE PAYMENT FORM CONTAINER */}
          {selectedPlan && (
            <div 
              id="manual-payment-form-card" 
              className="bg-[#111] border border-[#c9a86a]/25 p-6 md:p-8 rounded-3xl max-w-2xl mx-auto shadow-2xl animate-fadeIn space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#222]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-[#c9a86a]" size={18} />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">ආරක්ෂිත QR ගෙවීම් පියවර (Secure QR Payment Flow)</h4>
                </div>
                <button 
                  onClick={() => { setSelectedPlan(null); setTxSubmitError(null); }}
                  className="text-gray-500 hover:text-white text-xs cursor-pointer bg-transparent border-0"
                >
                  අවලංගු කරන්න
                </button>
              </div>

              <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">තෝරාගත් සැලසුම (Selected Plan)</span>
                  <h5 className="text-sm font-bold text-white">
                    {selectedPlan === 'monthly' ? 'Popular VIP Package (රු. 500/- / Month)' : 
                     selectedPlan === 'yearly' ? 'SAVE BIG Yearly VIP (රු. 1,500/- / Year)' :
                     selectedPlan === 'bundle_monthly' ? 'Top Package (රු. 1,800/- / Month)' :
                     'BEST VALUE Yearly Bundle (රු. 3,000/- / Year)'}
                  </h5>
                </div>
                <div className="bg-[#c9a86a]/10 border border-[#c9a86a]/20 px-4 py-2 rounded-xl text-center">
                  <span className="text-[9px] text-gray-400 block uppercase">ගෙවිය යුතු මුදල</span>
                  <span className="text-xl font-mono font-black text-[#c9a86a]">
                    {selectedPlan === 'monthly' ? 'රු. 500/-' : 
                     selectedPlan === 'yearly' ? 'රු. 1,500/-' :
                     selectedPlan === 'bundle_monthly' ? 'රු. 1,800/-' :
                     'රු. 3,000/-'}
                  </span>
                </div>
              </div>

              {txSubmitSuccess ? (
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-6 rounded-2xl text-center space-y-3 animate-fadeIn">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <h5 className="text-sm font-bold text-emerald-400">ගෙවීම් තොරතුරු සාර්ථකව ලැබුණි!</h5>
                  <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                    ඔබගේ ගනුදෙනු හැඳුනුම්පත (Transaction ID) සාර්ථකව ඇතුලත් කර ඇත. ඉදිරි පැය 24 ඇතුළත අපගේ පරිපාලක (Admin) විසින් මෙය තහවුරු කර ඔබගේ VIP ගිණුම සක්‍රීය කරනු ඇත. කරුණාකර රැඳී සිටින්න.
                  </p>
                  <button 
                    onClick={() => { setTxSubmitSuccess(false); setSelectedPlan(null); }}
                    className="mt-2 px-6 py-2 bg-emerald-500 text-black text-xs font-bold rounded-full hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    Dashboard වෙත යන්න
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Side: QR Code Display */}
                  <div className="space-y-3 flex flex-col justify-center items-center text-center bg-black/40 p-4 rounded-2xl border border-[#222]">
                    <span className="text-[10px] font-bold text-[#c9a86a] uppercase tracking-wider">LankaQR / Online Payment QR</span>
                    
                    <div className="relative group cursor-zoom-in" onClick={() => setQrZoomed(true)}>
                      <img 
                        src={paymentQr} 
                        alt="Payment QR Code" 
                        referrerPolicy="no-referrer"
                        className="w-40 h-40 object-cover rounded-xl border border-[#333] hover:border-[#c9a86a] transition-all"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <span className="bg-black/80 text-white text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 font-bold">
                          <ZoomIn size={12} /> සූම් කරන්න (Zoom)
                        </span>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setQrZoomed(true)}
                      className="text-[10px] text-amber-500 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                    >
                      <ZoomIn size={12} /> QR කේතය විශාල කර බලන්න
                    </button>

                    <div className="text-[10px] text-gray-500 leading-relaxed max-w-[190px] pt-1">
                      ඔබගේ LankaQR සහය දක්වන බැංකු ඇප් එකකින් හෝ ක්‍රිප්ටෝ ඇප් එකකින් ස්කෑන් කර ගෙවීම් කරන්න.
                    </div>
                  </div>

                  {/* Right Side: Manual Transaction Submit Form */}
                  <form onSubmit={handleSubmitManualPayment} className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10.5px] font-bold text-gray-300 block">මස / වාරිකය (Month / Period) *</label>
                        <select 
                          value={manualMonth}
                          onChange={(e) => setManualMonth(e.target.value)}
                          className="w-full bg-black border border-[#222] rounded-xl text-xs py-2.5 px-3 text-white focus:outline-none focus:border-[#c9a86a] cursor-pointer"
                        >
                          <option value="January">January (ජනවාරි)</option>
                          <option value="February">February (පෙබරවාරි)</option>
                          <option value="March">March (මාර්තු)</option>
                          <option value="April">April (අප්‍රේල්)</option>
                          <option value="May">May (මැයි)</option>
                          <option value="June">June (ජූනි)</option>
                          <option value="July">July (ජූලි)</option>
                          <option value="August">August (අගෝස්තු)</option>
                          <option value="September">September (සැප්තැම්බර්)</option>
                          <option value="October">October (ඔක්තෝබර්)</option>
                          <option value="November">November (නොවැම්බර්)</option>
                          <option value="December">December (දෙසැම්බර්)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10.5px] font-bold text-gray-300 block">
                          Transaction ID / Ref ID / Slip No *
                        </label>
                        <input 
                          type="text" 
                          value={manualTxId}
                          onChange={(e) => setManualTxId(e.target.value)}
                          placeholder="උදා: TXN9876543210 හෝ Ref අංකය"
                          required
                          className="w-full bg-black border border-[#222] rounded-xl text-xs py-2.5 px-3 text-white focus:outline-none focus:border-[#c9a86a] font-mono"
                        />
                        <p className="text-[9px] text-gray-500 leading-tight">
                          ගෙවීම සාර්ථක වූ පසු ලැබෙන රිසිට්පතෙහි ඇති Transaction ID හෝ යොමු අංකය මෙහි ඇතුලත් කරන්න.
                        </p>
                      </div>
                    </div>

                    {txSubmitError && (
                      <div className="text-[10px] text-red-400 bg-red-950/20 border border-red-500/15 p-2.5 rounded-xl">
                        ⚠️ {txSubmitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingTx}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-[#c9a86a] text-black hover:from-amber-500 text-xs font-bold rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSubmittingTx ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          තොරතුරු ඉදිරිපත් කරමින්...
                        </>
                      ) : (
                        <>ගෙවීම් තොරතුරු ඉදිරිපත් කරන්න (Submit Payment)</>
                      )}
                    </button>
                  </form>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-[9px] text-gray-500 text-center pt-2 border-t border-[#1a1a1a]">
                <ShieldCheck size={11} className="text-emerald-500" />
                <span>අපගේ ඇඩ්මින් කණ්ඩායම විසින් පැය 24ක් තුල ඔබගේ ගෙවීම තහවුරු කර VIP සක්‍රීය කරනු ඇත.</span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 18+ DISCLAIMER MODAL OVERLAY */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#111] border border-red-500/20 max-w-md w-full rounded-3xl p-6 md:p-8 space-y-6 text-center shadow-2xl relative">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-serif font-bold text-white">18+ වයස් සීමා එකඟතාවය (Adult Disclaimer)</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                මෙම වෙබ් අඩවියේ අඩංගු ඇතැම් කතාන්දර සහ චිත්‍රපටි වැඩිහිටියන් සඳහා පමණක් (18+) සීමා කර ඇත. 
                ඉදිරියට යාමට පෙර ඔබගේ වයස අවුරුදු 18 හෝ ඊට වැඩි බවටත්, මෙහි අන්තර්ගතයන් නැරඹීමට එකඟ වන බවටත් තහවුරු කළ යුතුය.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowDisclaimerModal(false); setSelectedPlan(null); }}
                className="flex-1 py-2.5 bg-[#222] hover:bg-[#333] text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                අවලංගු කරන්න (Cancel)
              </button>
              <button
                type="button"
                onClick={handleAcceptDisclaimer}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
              >
                I Agree (එකඟ වෙමි)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR ZOOM MODAL OVERLAY */}
      {qrZoomed && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md cursor-zoom-out animate-fadeIn"
          onClick={() => setQrZoomed(false)}
        >
          <div className="relative max-w-sm w-full bg-[#111] p-6 rounded-3xl border border-[#222] text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">ගෙවීම් QR කේතය (Payment QR Code)</h4>
            
            <img 
              src={paymentQr} 
              alt="Payment QR Code Zoomed" 
              referrerPolicy="no-referrer"
              className="w-full aspect-square object-cover rounded-2xl border border-[#333] shadow-2xl"
            />
            
            <button
              onClick={() => setQrZoomed(false)}
              className="px-6 py-2 bg-white text-black font-bold text-xs rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
            >
              වසා දමන්න (Close)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
