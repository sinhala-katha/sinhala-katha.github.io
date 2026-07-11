import React, { useEffect, useRef } from 'react';
import { ExternalLink, Flame, ShieldAlert, Zap } from 'lucide-react';

export interface AdConfig {
  banner300x250_key: string;
  banner320x50_key: string;
  native_id: string;
  smartlink_url: string;
  social_bar_url: string;
}

export const DEFAULT_AD_CONFIG: AdConfig = {
  banner300x250_key: 'c97c7bc71e944ff18d15839eb9c0ff7c',
  banner320x50_key: '69976600341e6322e2e252fd2c896e1b',
  native_id: 'bd8dae669e7d18b16282e0c7a9d22040',
  smartlink_url: 'https://www.effectivecpmnetwork.com/h6vn3nv1vk?key=963778a235792dadd322f870e1200473',
  social_bar_url: 'https://pl30301335.effectivecpmnetwork.com/b8/50/08/b85008f131be694c55429a3bb17a2735.js',
};

export const getAdConfig = (): AdConfig => {
  try {
    const saved = localStorage.getItem('rasa_katha_ad_config');
    if (saved) {
      return { ...DEFAULT_AD_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_AD_CONFIG;
};

export const saveAdConfig = (config: AdConfig) => {
  localStorage.setItem('rasa_katha_ad_config', JSON.stringify(config));
};

const checkIsAdmin = (propIsAdmin?: boolean): boolean => {
  if (propIsAdmin !== undefined) return propIsAdmin;
  try {
    const stored = localStorage.getItem('rasa_katha_current_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      return !!parsed.isAdmin;
    }
  } catch (e) {}
  return false;
};

/**
 * Adsterra Banner 300x250 Component
 */
export const AdBanner300x250: React.FC<{ isVip?: boolean; isAdmin?: boolean }> = ({ isVip, isAdmin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const showAds = !checkIsAdmin(isAdmin);

  useEffect(() => {
    if (!showAds || !containerRef.current) return;
    
    // Clear any previous script content
    containerRef.current.innerHTML = '';

    const config = getAdConfig();

    // Options Script
    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.innerHTML = `
      atOptions = {
        'key' : '${config.banner300x250_key}',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    // Invoke Script
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = `https://www.highperformanceformat.com/${config.banner300x250_key}/invoke.js`;
    invokeScript.onerror = (e) => {
      console.warn("Skipped loading 300x250 ad script:", e);
    };
    containerRef.current.appendChild(invokeScript);
  }, [showAds]);

  if (!showAds) return null;

  return (
    <div className={`flex flex-col items-center justify-center my-6 mx-auto overflow-hidden text-center transition-all ${
      isVip ? 'opacity-80 scale-95 border-dashed border-[#c9a86a]/10' : 'opacity-100'
    }`} id="adsterra-banner-300-250">
      <span className="text-[9px] text-[#c9a86a]/60 font-mono tracking-widest mb-1 uppercase">
        {isVip ? '💎 VIP SPONSORED AD' : 'SPONSORED ADVERTISEMENT'}
      </span>
      <div 
        ref={containerRef} 
        className="w-[300px] h-[250px] bg-[#0c0c0c] border border-neutral-800 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden"
      >
        <span className="text-[10px] text-gray-700 font-serif">ප්‍රචාරණ දැන්වීම පූරණය වෙමින්...</span>
      </div>
    </div>
  );
};

/**
 * Adsterra Banner 320x50 Component
 */
export const AdBanner320x50: React.FC<{ isVip?: boolean; isAdmin?: boolean }> = ({ isVip, isAdmin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const showAds = !checkIsAdmin(isAdmin);

  useEffect(() => {
    if (!showAds || !containerRef.current) return;
    
    containerRef.current.innerHTML = '';

    const config = getAdConfig();

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.innerHTML = `
      atOptions = {
        'key' : '${config.banner320x50_key}',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = `https://www.highperformanceformat.com/${config.banner320x50_key}/invoke.js`;
    invokeScript.onerror = (e) => {
      console.warn("Skipped loading 320x50 ad script:", e);
    };
    containerRef.current.appendChild(invokeScript);
  }, [showAds]);

  if (!showAds) return null;

  return (
    <div className={`flex flex-col items-center justify-center my-4 mx-auto overflow-hidden text-center ${
      isVip ? 'opacity-70 scale-90' : 'opacity-100'
    }`} id="adsterra-banner-320-50">
      <span className="text-[8px] text-[#c9a86a]/50 font-mono tracking-widest mb-0.5 uppercase">
        {isVip ? '💎 VIP AD' : 'ADVERTISEMENT'}
      </span>
      <div 
        ref={containerRef} 
        className="w-[320px] h-[50px] bg-[#0c0c0c] border border-neutral-800 rounded-lg flex items-center justify-center shadow-sm overflow-hidden"
      >
        <span className="text-[9px] text-gray-700 font-serif">Loading ad...</span>
      </div>
    </div>
  );
};

/**
 * Adsterra Native Banner Component
 */
export const AdNativeBanner: React.FC<{ isVip?: boolean; isAdmin?: boolean }> = ({ isVip, isAdmin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const showAds = !checkIsAdmin(isAdmin);

  useEffect(() => {
    if (!showAds || !containerRef.current) return;
    
    containerRef.current.innerHTML = '';

    const config = getAdConfig();

    const divContainer = document.createElement('div');
    divContainer.id = `container-${config.native_id}`;
    containerRef.current.appendChild(divContainer);

    const invokeScript = document.createElement('script');
    invokeScript.async = true;
    invokeScript.setAttribute('data-cfasync', 'false');
    invokeScript.src = `https://pl30301401.effectivecpmnetwork.com/${config.native_id}/invoke.js`;
    invokeScript.onerror = (e) => {
      console.warn("Skipped loading native ad script:", e);
    };
    containerRef.current.appendChild(invokeScript);
  }, [showAds]);

  if (!showAds) return null;

  return (
    <div className={`flex flex-col items-center justify-center my-6 w-full max-w-lg mx-auto ${
      isVip ? 'opacity-70 scale-95' : 'opacity-100'
    }`} id="adsterra-native-banner">
      <span className="text-[9px] text-[#c9a86a]/60 font-mono tracking-widest mb-1.5 uppercase">
        {isVip ? '💎 VIP RECOMMENDATIONS' : 'RECOMMENDED SPONSORS'}
      </span>
      <div 
        ref={containerRef} 
        className="w-full bg-[#0a0a0a]/80 border border-neutral-800/80 p-2.5 rounded-2xl min-h-[100px] flex items-center justify-center"
      >
        <div className="text-center py-4">
          <span className="text-[10px] text-gray-600 block">ස්පොන්සර් කර ඇති දීමනා පූරණය වෙමින්...</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Adsterra Smartlink Buttons / Panels for extremely high CTR redirection.
 */
interface SmartlinkButtonProps {
  type: 'hot-stories' | 'fast-server' | 'lottery' | 'text-only' | 'sidebar';
  className?: string;
  isAdmin?: boolean;
}

export const SmartlinkButton: React.FC<SmartlinkButtonProps> = ({ type, className = '', isAdmin }) => {
  const showAds = !checkIsAdmin(isAdmin);
  if (!showAds) return null;

  const config = getAdConfig();
  const smartlinkUrl = config.smartlink_url;

  if (type === 'hot-stories') {
    return (
      <a
        href={smartlinkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-between p-4 bg-gradient-to-r from-red-950 via-amber-950 to-red-950 border border-red-900/60 rounded-2xl shadow-lg hover:border-red-500/80 transition-all group cursor-pointer ${className}`}
        id="adsterra-smartlink-hot"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-900/40 rounded-xl text-red-400 group-hover:scale-110 transition-transform duration-300">
            <Flame className="animate-pulse" size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#c9a86a] tracking-wider block">ඉතා රහසිගත උණුසුම් කතා (18+ Special)</span>
            <p className="text-white text-xs font-bold leading-relaxed mt-0.5">🔥 තවමත් ප්‍රසිද්ධ නොකළ, සීමිත පිරිසකට පමණක් විවෘත කතා කියවීමට මෙතැනින් පිවිසෙන්න!</p>
          </div>
        </div>
        <div className="text-red-400 group-hover:translate-x-1 transition-transform">
          <ExternalLink size={15} />
        </div>
      </a>
    );
  }

  if (type === 'fast-server') {
    return (
      <a
        href={smartlinkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-between p-4 bg-gradient-to-r from-blue-950 via-[#0d0d0d] to-blue-950 border border-blue-900/40 rounded-2xl shadow-md hover:border-blue-500/80 transition-all group cursor-pointer ${className}`}
        id="adsterra-smartlink-fast"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900/40 rounded-xl text-blue-400 group-hover:scale-110 transition-transform duration-300">
            <Zap className="animate-bounce" size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block font-mono">SERVER VELOCITY SPEED BOOST</span>
            <p className="text-white text-xs font-bold leading-relaxed mt-0.5">⚡ වෙබ් අඩවියේ වේගය 3x ගුණයකින් වැඩි කර ගැනීමට සහ දැන්වීම් ඉවත් කිරීමට මෙතැන ක්ලික් කරන්න</p>
          </div>
        </div>
        <div className="text-blue-400 group-hover:translate-x-1 transition-transform">
          <ExternalLink size={15} />
        </div>
      </a>
    );
  }

  if (type === 'lottery') {
    return (
      <a
        href={smartlinkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`block p-4 text-center bg-gradient-to-br from-[#1a140a] to-[#0c0c0c] border border-[#c9a86a]/30 rounded-2xl shadow-xl hover:border-[#c9a86a]/80 transition-all group cursor-pointer ${className}`}
        id="adsterra-smartlink-lottery"
      >
        <span className="text-[9px] uppercase font-extrabold text-[#c9a86a] tracking-widest block font-mono">Weekly Lucky Draw Promotion</span>
        <span className="text-white font-serif font-bold text-sm block mt-1">🎁 රු. 10,000/- ක් වටිනා මුදල් ත්‍යාගය දිනාගැනීමට මෙතැනින් ලියාපදිංචි වන්න!</span>
        <span className="text-gray-400 text-[10px] block mt-1 leading-relaxed">නොමිලේ එක්වීමට සහ දිනුම් අවස්ථා වැඩි කර ගැනීමට සබැඳිය ක්ලික් කරන්න.</span>
      </a>
    );
  }

  if (type === 'sidebar') {
    return (
      <a
        href={smartlinkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`block p-3.5 bg-[#0a0a0a] border border-red-950/70 hover:border-red-600/60 rounded-xl text-center transition-all group cursor-pointer ${className}`}
        id="adsterra-smartlink-sidebar"
      >
        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-red-500 uppercase tracking-widest mb-1 animate-pulse">
          <ShieldAlert size={11} /> HOT OFFERS
        </span>
        <p className="text-white text-[11px] font-bold leading-relaxed">🔥 අසභ්‍ය නොවන අතිශය ආකර්ශනීය වීඩියෝ නැරඹීමට සහ ක්ෂණික ප්‍රවේශය ලබා ගැනීමට මෙතැනින් පිවිසෙන්න!</p>
      </a>
    );
  }

  return (
    <a
      href={smartlinkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-xs font-bold text-[#c9a86a] hover:text-[#bba061] underline decoration-dotted underline-offset-4 cursor-pointer ${className}`}
      id="adsterra-smartlink-text"
    >
      ඊළඟ කොටස් ඉක්මනින් කියවන්න (Read fast servers)
    </a>
  );
};
