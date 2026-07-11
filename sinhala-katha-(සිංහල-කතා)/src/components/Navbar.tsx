import { User } from '../types';
import { BookOpen, User as UserIcon, LogOut, LogIn, ShieldCheck, Heart } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  showAdminPanel: boolean;
  onToggleAdminPanel: (show: boolean) => void;
}

export default function Navbar({
  user,
  onOpenAuth,
  onLogout,
  showAdminPanel,
  onToggleAdminPanel
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#222]" id="main-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <button
              id="navbar-logo-btn"
              onClick={() => onToggleAdminPanel(false)}
              className="flex items-center gap-2 cursor-pointer group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c9a86a] to-[#a2844d] flex items-center justify-center text-black font-extrabold shadow-lg shadow-[#c9a86a33] border border-[#c9a86a]/40 transform group-hover:scale-105 transition-all">
                <BookOpen size={18} />
              </div>
              <div>
                <h1 className="text-xl font-serif font-extrabold text-[#c9a86a] tracking-wider leading-none">
                  Sinhala Katha
                </h1>
                <span className="text-[10px] text-gray-500 font-sans tracking-wide uppercase font-semibold">සිංහල කතා</span>
              </div>
            </button>
            
            {/* Adult warning banner badge */}
            <span className="hidden sm:inline-flex items-center gap-1 bg-[#1a1a1a] border border-[#333] text-[10px] text-gray-400 font-medium px-2 py-0.5 rounded-full">
              🔞 18+ Mature
            </span>
          </div>

          {/* User controls / Actions */}
          <div className="flex items-center gap-3">
            
            {/* Authenticated user flow */}
            {user ? (
              <div className="flex items-center gap-3">
                
                {/* Greeting (Desktop Only) */}
                <div className="hidden md:flex items-center gap-2 bg-[#111] px-3.5 py-1.5 rounded-xl border border-[#222]">
                  <UserIcon size={12} className="text-[#c9a86a]" />
                  <span className="text-xs text-gray-300 font-medium">
                    ආයුබෝවන්, <span className="text-[#c9a86a] font-bold">{user.username}</span>!
                  </span>
                  {user.isAdmin && (
                    <span className="bg-[#c9a86a22] text-[#c9a86a] text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase border border-[#c9a86a44] flex items-center gap-0.5">
                      <ShieldCheck size={10} /> Creator
                    </span>
                  )}
                </div>

                {/* Admin Creator Studio toggle button */}
                {user.isAdmin && (
                  <button
                    id="toggle-admin-studio-btn"
                    onClick={() => onToggleAdminPanel(!showAdminPanel)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-md cursor-pointer ${
                      showAdminPanel
                        ? 'bg-[#c9a86a] text-black border-[#c9a86a] shadow-lg shadow-[#c9a86a33]'
                        : 'bg-[#111] text-[#c9a86a] border-[#222] hover:border-[#c9a86a]/40'
                    }`}
                  >
                    🛠️ {showAdminPanel ? 'මුල් පිටුවට' : 'Creator Studio'}
                  </button>
                )}

                {/* Logout Button */}
                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  className="flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-[#c9a86a] bg-[#111] hover:bg-[#1a1a1a] border border-[#222] transition-colors cursor-pointer"
                  title="ඉවත් වන්න"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline text-xs font-bold ml-1.5">ඉවත් වන්න</span>
                </button>

              </div>
            ) : (
              /* Unauthenticated user flow */
              <button
                id="navbar-login-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#c9a86a] text-[#c9a86a] hover:text-black font-bold text-xs py-2.5 px-5 rounded-full border border-[#333] transition-all active:scale-95 shadow-md cursor-pointer"
              >
                <LogIn size={14} />
                පිවිසෙන්න / ලියාපදිංචි වන්න
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
