import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Rocket, Mail, Lock, LogIn, UserPlus, Github } from 'lucide-react';

export default function Auth({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isResetting, setIsResetting] = useState(false);

  const handleAuth = async (type: 'login' | 'signup') => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: email.split('@')[0] }
          }
        });
        if (error) throw error;
        onLogin();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin();
      }
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setMessage({ text: 'Por favor, ingresa tu correo primero.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage({ text: '', type: '' });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: '¡Se ha enviado un enlace de recuperación a tu correo!', type: 'success' });
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) setMessage({ text: error.message, type: 'error' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0c10]">
      <div className="w-full max-w-md p-8 bg-[#1f2833] rounded-xl shadow-2xl border border-[#66fcf1]/20">
        <div className="flex flex-col items-center mb-8">
          <Rocket className="w-16 h-16 text-[#66fcf1] mb-4" />
          <h1 className="text-3xl font-bold text-white text-center">Holocron & Bounty Guild</h1>
          <p className="text-[#c5c6c7] mt-2">Acceso a la Red Cazarrecompensas</p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-lg mb-6 ${message.type === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500/50' : 'bg-green-500/20 text-green-200 border border-green-500/50'}`}>
            {message.text}
          </div>
        )}

        {isResetting ? (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm text-center mb-4">Ingresa tu holo-email y te enviaremos un enlace para crear una nueva clave.</p>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Holo-Email"
                className="w-full bg-[#0b0c10] text-white border border-gray-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-[#45a29e]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-[#45a29e] text-white py-2 rounded-lg hover:bg-[#66fcf1] hover:text-[#0b0c10] font-bold transition-colors"
            >
              Enviar enlace de recuperación
            </button>
            <div className="text-center mt-4">
              <button onClick={() => { setIsResetting(false); setMessage({text:'', type:''}); }} className="text-sm text-gray-400 hover:text-white underline">
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Holo-Email"
                className="w-full bg-[#0b0c10] text-white border border-gray-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-[#45a29e]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Código de seguridad"
                className="w-full bg-[#0b0c10] text-white border border-gray-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-[#45a29e]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => handleAuth('login')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-[#66fcf1] text-[#66fcf1] py-2 rounded-lg hover:bg-[#66fcf1]/10 transition-colors"
              >
                <LogIn className="w-5 h-5" /> Entrar
              </button>
              <button
                onClick={() => handleAuth('signup')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-[#45a29e] text-white py-2 rounded-lg hover:bg-[#66fcf1] hover:text-[#0b0c10] transition-colors"
              >
                <UserPlus className="w-5 h-5" /> Registrarse
              </button>
            </div>

            <div className="text-center mt-2">
              <button onClick={() => { setIsResetting(true); setMessage({text:'', type:''}); }} className="text-xs text-gray-400 hover:text-white underline">
                ¿Olvidaste tu código de seguridad?
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#1f2833] text-gray-400">O entrar con</span></div>
            </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleOAuth('google')}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>

            <button
              onClick={() => handleOAuth('github')}
              className="w-full flex items-center justify-center gap-2 bg-[#24292e] text-white py-2 rounded-lg hover:bg-[#2f363d] transition-colors"
            >
              <Github className="w-5 h-5" /> GitHub
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
