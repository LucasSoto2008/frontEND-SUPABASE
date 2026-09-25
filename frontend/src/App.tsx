import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import MissionsBoard from './components/MissionsBoard';
import AvatarUploader from './components/AvatarUploader';
import { LogOut } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      alert('¡Contraseña actualizada exitosamente!');
      setRecoveryMode(false);
    }
  };

  if (!session) {
    return <Auth onLogin={() => {}} />;
  }

  if (recoveryMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0c10]">
        <form onSubmit={handleUpdatePassword} className="w-full max-w-md p-8 bg-[#1f2833] rounded-xl shadow-2xl border border-[#66fcf1]/20">
          <h2 className="text-2xl font-bold text-white mb-4">Restablecer Contraseña</h2>
          <p className="text-gray-400 mb-6">Ingresa tu nueva contraseña para acceder al Gremio.</p>
          <input 
            type="password" 
            placeholder="Nueva contraseña" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-[#0b0c10] text-white border border-gray-700 rounded-lg py-2 px-4 focus:border-[#45a29e] outline-none mb-4"
            required
            minLength={6}
          />
          <button type="submit" className="w-full bg-[#45a29e] text-white py-2 rounded-lg hover:bg-[#66fcf1] hover:text-[#0b0c10] font-bold transition-colors">
            Actualizar Contraseña
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#c5c6c7]">
      <header className="bg-[#1f2833] border-b border-[#45a29e]/30 p-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-white tracking-wider uppercase text-[#66fcf1]">Gremio Cazarrecompensas</h1>
            <AvatarUploader userId={session.user.id} />
          </div>
          
          <div className="flex items-center gap-4">
            {profile && (
              <div className="text-right">
                <p className="text-white font-bold">{profile.username || session.user.email}</p>
                <p className="text-sm text-yellow-400 font-mono">{profile.credits} Créditos</p>
                <p className="text-xs text-gray-400">{profile.faction}</p>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white bg-[#0b0c10] rounded-lg border border-gray-700 hover:border-red-500 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="py-8">
        <MissionsBoard userId={session.user.id} />
      </main>
    </div>
  );
}
