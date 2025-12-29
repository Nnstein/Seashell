import React, { useState, useEffect } from 'react';
import { Shell, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = 'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2050&q=80';
    img.onload = () => setImageLoaded(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      onLogin(username);
    } else {
      setError('Invalid credentials. Try admin/admin');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative transition-all duration-1000 ${imageLoaded ? "bg-[url('https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2050&q=80')]" : "bg-gradient-to-br from-slate-900 to-slate-800"}`}>
      <div className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}></div>

      <div className="bg-paper shadow-2xl w-full max-w-md relative z-10 border-t-4 border-gold fade-in-up overflow-hidden">
        <div className="p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="text-gold mb-4 transform hover:scale-110 transition-transform duration-500">
              <Shell size={48} strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl font-serif font-bold text-ink tracking-tight">Seashell</h1>
            <p className="text-slate-500 font-serif italic mt-2">Hotel & Resort</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon size={18} className="text-slate-400 group-focus-within:text-gold transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border-b-2 border-slate-200 bg-transparent text-ink placeholder-slate-300 focus:outline-none focus:border-gold transition-colors font-serif"
                  placeholder="Enter ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-gold transition-colors" />
                </div>
                <input
                  type="password"
                  className="block w-full pl-10 pr-3 py-3 border-b-2 border-slate-200 bg-transparent text-ink placeholder-slate-300 focus:outline-none focus:border-gold transition-colors font-serif"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center font-medium py-2 animate-pulse bg-red-50">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center items-center py-4 px-4 bg-ink text-white hover:bg-slate-800 transition-all duration-300 uppercase tracking-widest text-xs font-bold group mt-8"
            >
              Access Portal <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
        <div className="bg-sand/50 p-4 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            Restricted Access • Employee Portal
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;