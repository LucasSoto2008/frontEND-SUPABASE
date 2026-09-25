import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, User } from 'lucide-react';

export default function AvatarUploader({ userId }: { userId: string }) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('avatar_url').eq('id', userId).single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    fetchProfile();
  }, [userId]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar_${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('holocron-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('holocron-assets').getPublicUrl(filePath);
      
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId);
      setAvatarUrl(data.publicUrl);
      
    } catch (error: any) {
      alert(`Error al subir imagen: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-[#1f2833] p-4 rounded-lg border border-gray-700 w-fit">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 border-2 border-[#45a29e] flex items-center justify-center">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <User className="w-8 h-8 text-gray-500" />
        )}
      </div>
      <div>
        <p className="text-sm text-gray-400 mb-2">Identificación Visual</p>
        <label className="cursor-pointer flex items-center gap-2 bg-[#0b0c10] border border-gray-600 text-white px-3 py-1.5 rounded text-sm hover:border-[#66fcf1] transition-colors">
          <Upload className="w-4 h-4" />
          {uploading ? 'Subiendo...' : 'Cambiar Avatar'}
          <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
        </label>
      </div>
    </div>
  );
}
