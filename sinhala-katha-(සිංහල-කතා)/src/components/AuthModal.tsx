import React, { useState } from 'react';
import { User as UserIcon, Lock, Mail, X, ShieldAlert } from 'lucide-react';
import { User } from '../types';
import { getUserProfile, registerUserProfile } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password || (!isLogin && !email)) {
      setError('කරුණාකර සියලුම ක්ෂේත්‍ර පුරවන්න. (Please fill all fields)');
      return;
    }

    try {
      if (isLogin) {
        const foundUser = await getUserProfile(username);

        if (foundUser && foundUser.password === password) {
          const loggedInUser: User = {
            username: foundUser.username,
            email: foundUser.email,
            isAdmin: !!foundUser.isAdmin,
            likedStories: foundUser.likedStories || [],
            isVip: !!foundUser.isVip,
            subscriptionType: foundUser.subscriptionType || 'none',
            subscriptionDate: foundUser.subscriptionDate || '',
            hasPartnerAccess: !!foundUser.hasPartnerAccess,
            hasMoviesAccess: !!foundUser.hasMoviesAccess,
            hasVideosAccess: !!foundUser.hasVideosAccess
          };
          setSuccess('පිවිසීම සාර්ථකයි! (Login Successful!)');
          setTimeout(() => {
            onAuthSuccess(loggedInUser);
            onClose();
          }, 1000);
        } else {
          setError('පරිශීලක නාමය හෝ මුරපදය වැරදියි. (Invalid username or password)');
        }
      } else {
        // Registration
        const userExists = await getUserProfile(username);

        if (userExists) {
          setError('මෙම පරිශීලක නාමය දැනටමත් භාවිතයේ ඇත.');
          return;
        }

        const newUserProfile = {
          username: username,
          email: email,
          password: password,
          isAdmin: false,
          likedStories: []
        };

        await registerUserProfile(newUserProfile);

        const loggedInUser: User = {
          username: newUserProfile.username,
          email: newUserProfile.email,
          isAdmin: false,
          likedStories: [],
          isVip: false,
          subscriptionType: 'none',
          subscriptionDate: '',
          hasPartnerAccess: false,
          hasMoviesAccess: false,
          hasVideosAccess: false
        };

        setSuccess('ලියාපදිංචි වීම සාර්ථකයි! (Registration Successful!)');
        setTimeout(() => {
          onAuthSuccess(loggedInUser);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setError(`දෝෂයක් සිදු විය: ${err?.message || err}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        id="auth-modal-container"
        className="bg-[#111] border border-[#222] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative"
      >
        {/* Header decoration */}
        <div className="h-1 bg-gradient-to-r from-[#c9a86a] via-[#e4cf9c] to-[#c9a86a]"></div>
        
        <button 
          id="auth-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#c9a86a] transition-colors p-1 rounded-full hover:bg-[#1a1a1a]"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
              {isLogin ? 'Scribe.lk වෙත පිවිසෙන්න' : 'නව ගිණුමක් සාදන්න'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {isLogin ? 'රසවත් සිංහල කතා ලෝකයට පිවිසෙන්න' : 'අදම ලියාපදිංචි වී කතා කියවන්න එකතු වන්න'}
            </p>
          </div>

          {error && (
            <div id="auth-error" className="mb-4 p-3 bg-red-950/50 border border-red-800/50 text-red-200 text-xs rounded-lg flex items-start gap-2">
              <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div id="auth-success" className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800/50 text-emerald-200 text-xs rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">පරිශීලක නාමය (Username)</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 text-gray-500" size={16} />
                <input
                  id="auth-username-input"
                  type="text"
                  placeholder="e.g. nimal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#c9a86a] transition-colors"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">ඊමේල් ලිපිනය (Email)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-gray-500" size={16} />
                  <input
                    id="auth-email-input"
                    type="email"
                    placeholder="nimal@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#c9a86a] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">මුරපදය (Password)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-500" size={16} />
                <input
                  id="auth-password-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#222] text-white placeholder-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#c9a86a] transition-colors"
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              className="w-full mt-2 bg-[#c9a86a] hover:bg-[#bba061] text-black font-bold py-3 px-4 rounded-full text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {isLogin ? 'පිවිසෙන්න' : 'ගිණුම සාදන්න'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            {isLogin ? (
              <>
                තවමත් ගිණුමක් නොමැතිද?{' '}
                <button
                  id="auth-toggle-register"
                  onClick={() => setIsLogin(false)}
                  className="text-[#c9a86a] font-semibold hover:underline hover:text-[#e4cf9c]"
                >
                  මෙහිදී ලියාපදිංචි වන්න
                </button>
              </>
            ) : (
              <>
                දැනටමත් ගිණුමක් තිබේද?{' '}
                <button
                  id="auth-toggle-login"
                  onClick={() => setIsLogin(true)}
                  className="text-[#c9a86a] font-semibold hover:underline hover:text-[#e4cf9c]"
                >
                  මෙහිදී පිවිසෙන්න
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
