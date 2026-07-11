import React, { useState, useEffect } from 'react';
import { Shell, Lock, User as UserIcon, ArrowRight, Mail } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';

interface LoginProps {
  onLogin: (username: string, role: 'admin' | 'kitchen' | 'seashell' | 'presto', kitchenContext?: 'room-service' | 'seashell' | 'presto') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [kitchenContext, setKitchenContext] = useState<'room-service' | 'seashell' | 'presto' | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Kitchen validation
    if (username.toLowerCase() === 'kitchen' && !kitchenContext) {
      setError('Please select a kitchen section.');
      return;
    }

    setLoading(true);

    try {
      let email = username;
      const lowerUsername = username.toLowerCase();
      
      // Dynamic Mapping for Admins (ID -> Email)
      if (lowerUsername === 'admin' || lowerUsername === 'admin2') {
        try {
          // Check both common document names for settings to be robust
          const docRef = doc(db, 'settings', 'global');
          const backupRef = doc(db, 'settings', 'global_settings');
          
          let settingsSnap = await getDoc(docRef);
          if (!settingsSnap.exists()) {
            settingsSnap = await getDoc(backupRef);
          }

          if (settingsSnap.exists()) {
            const data = settingsSnap.data();
            const mappedEmail = lowerUsername === 'admin' ? data.adminEmail : data.admin2Email;
            if (mappedEmail) {
              email = mappedEmail;
              console.log(`Mapped ID ${username} to ${email}`);
            }
          }
        } catch (err) {
          console.warn('Could not fetch dynamic admin mapping from Firestore. Using ID as is.');
        }
      } 
      // Simple Mapping for Staff (ID -> @seashell.internal)
      else if (!username.includes('@')) {
        email = `${lowerUsername}@seashell.internal`;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch role from Firestore staff_roles collection
      const roleSnap = await getDoc(doc(db, 'staff_roles', user.uid));
      
      if (roleSnap.exists()) {
        const role = roleSnap.data().role as 'admin' | 'kitchen' | 'seashell' | 'presto';
        onLogin(username, role, kitchenContext || undefined);
      } else {
        setError('Unauthorized: No role assigned to this user UID.');
        await auth.signOut();
      }
    } catch (err: any) {
      console.error('Login error detail:', err);
      const errorCode = err.code;
      
      if (
        errorCode === 'auth/user-not-found' || 
        errorCode === 'auth/wrong-password' || 
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/invalid-email'
      ) {
        setError('Invalid username or password.');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(`Login failed (${errorCode || 'Unknown error'}). Please check your connection.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      setError('Please enter your email/username first.');
      return;
    }
    
    setLoading(true);
    try {
      let email = username;
      if (!username.includes('@')) {
        const lowerUsername = username.toLowerCase();
        if (lowerUsername === 'admin' || lowerUsername === 'admin2') {
           const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
           if (settingsSnap.exists()) {
             email = (lowerUsername === 'admin' ? settingsSnap.data().adminEmail : settingsSnap.data().admin2Email) || username;
           }
        } else {
          email = `${lowerUsername}@seashell.internal`;
        }
      }
      
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      setError('Could not send reset email. Please contact IT.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 font-serif relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10000ms] scale-110 animate-slow-zoom"
        style={{ backgroundImage: `url('assets/images/login-bg.png')` }}
      ></div>
      <div className="absolute inset-0 z-0 bg-ink/40 backdrop-blur-[2px]"></div>
      
      <div className="absolute top-0 left-0 w-full h-1 bg-gold z-10"></div>

      <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-white/90 backdrop-blur-md rounded-full shadow-2xl mb-6 border-4 border-gold/30 relative overflow-hidden group p-4">
            <div className="absolute inset-0 bg-gold/10 group-hover:scale-150 transition-transform duration-1000"></div>
            <img src="assets/images/logo.png" alt="Seashell Logo" className="w-full h-full object-contain relative z-10" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2 drop-shadow-lg">Seashell Resort</h1>
          <p className="text-stone-200 italic font-medium drop-shadow-md">Internal Operations Portal</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20">
          <div className="p-8 sm:p-10">
            {!resetSent ? (
              <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-2">
                    {showForgotPassword ? 'Enter your Email' : 'Internal ID / Username'}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon size={18} className="text-stone-400 group-focus-within:text-gold transition-colors" />
                    </div>
                    <input
                      type={showForgotPassword ? 'email' : 'text'}
                      required
                      className="block w-full pl-10 pr-3 py-4 border-b-2 border-stone-100 bg-transparent text-ink placeholder-stone-300 focus:outline-none focus:border-gold transition-colors font-serif text-lg"
                      placeholder={showForgotPassword ? 'your@email.com' : 'e.g. admin, kitchen'}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (e.target.value.toLowerCase() !== 'kitchen') setKitchenContext('');
                      }}
                    />
                  </div>
                </div>

                {!showForgotPassword && (
                  <>
                    {username.toLowerCase() === 'kitchen' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gold mb-2">Select Kitchen Section</label>
                        <select
                          required
                          value={kitchenContext}
                          onChange={(e) => setKitchenContext(e.target.value as any)}
                          className="w-full bg-stone-50 border-2 border-gold/20 rounded-xl py-3 px-4 text-ink focus:outline-none focus:border-gold transition-all text-sm font-serif appearance-none shadow-inner"
                        >
                          <option value="">-- Select Section --</option>
                          <option value="room-service">Room Service Kitchen</option>
                          <option value="seashell">Seashell Kitchen</option>
                          <option value="presto">Presto Kitchen</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Security Password</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-stone-400 group-focus-within:text-gold transition-colors" />
                        </div>
                        <input
                          type="password"
                          required
                          className="block w-full pl-10 pr-4 py-4 border-b-2 border-stone-100 bg-transparent text-ink placeholder-stone-300 focus:outline-none focus:border-gold transition-colors font-mono text-lg"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100 flex items-start gap-3 animate-shake">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <p className="font-semibold">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ink text-white py-5 rounded-2xl font-bold uppercase tracking-[0.25em] text-xs hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-xl shadow-ink/20 disabled:opacity-50 active:scale-95"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {showForgotPassword ? 'Send Reset Link' : 'Initialize Access'}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(!showForgotPassword);
                      setError('');
                    }}
                    className="text-[10px] text-stone-400 hover:text-gold uppercase tracking-[0.2em] font-black transition-colors"
                  >
                    {showForgotPassword ? 'Back to Login' : 'Forgot password?'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full mb-2">
                  <Mail size={40} />
                </div>
                <h3 className="text-3xl font-bold text-ink">Check your inbox</h3>
                <p className="text-stone-500 leading-relaxed font-medium">
                  We've sent a secure password reset link to your email address.
                </p>
                <button
                  onClick={() => {
                    setResetSent(false);
                    setShowForgotPassword(false);
                  }}
                  className="w-full border-2 border-stone-100 text-ink py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-stone-50 transition-all"
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-10">
          <p className="text-[10px] text-stone-300 uppercase tracking-[0.3em] font-black opacity-60">
            Seashell Resort
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;