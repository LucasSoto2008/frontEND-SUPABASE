import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Target, Coins, ShieldAlert, CheckCircle, Trash2, Plus } from 'lucide-react';

export default function MissionsBoard({ userId }: { userId: string }) {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el CRUD (Crear)
  const [newTitle, setNewTitle] = useState('');
  const [newBounty, setNewBounty] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchMissions();

    const channel = supabase.channel('realtime:missions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, (payload) => {
        console.log('Cambio detectado en el hyper-espacio:', payload);
        fetchMissions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMissions = async () => {
    const { data } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
    if (data) setMissions(data);
    setLoading(false);
  };

  // CREATE: Crear nueva misión
  const createMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newBounty) return;
    
    setIsCreating(true);
    const { error } = await supabase.from('missions').insert([{
      title: newTitle,
      bounty_credits: parseInt(newBounty),
      status: 'open',
      created_by: userId
    }]);
    
    if (error) alert(`Error creando misión: ${error.message}`);
    else {
      setNewTitle('');
      setNewBounty('');
      fetchMissions();
    }
    setIsCreating(false);
  };

  // DELETE: Borrar misión
  const deleteMission = async (missionId: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta misión del Holocron?')) return;
    
    const { error } = await supabase.from('missions').delete().eq('id', missionId);
    if (error) alert(`Error al borrar: ${error.message}`);
    else fetchMissions();
  };

  // UPDATE: Reclamar recompensa (llama a la Función de Base de Datos RPC)
  const claimBounty = async (missionId: string) => {
    try {
      const { data, error } = await supabase.rpc('claim_bounty', {
        mission_id: missionId,
        hunter_id: userId
      });
      
      if (error) {
        alert(`Error al contactar al Gremio: ${error.message}`);
        return;
      }

      if (!data.success) {
        alert(`Error cobrando recompensa: ${data.error}`);
      } else {
        alert(`¡Cobro exitoso! Recibiste ${data.payout} créditos. (Impuesto descontado: ${data.tax_deducted})`);
        fetchMissions();
      }
    } catch (err: any) {
      alert(`Error crítico en el sistema: ${err.message}`);
    }
  };

  if (loading) return <div className="text-[#66fcf1] flex justify-center p-8">Cargando misiones del Gremio...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-[#45a29e] pb-6 gap-4">
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <Target className="text-red-500 w-8 h-8" />
          Holocron de Misiones
        </h2>
        
        {/* Formulario CREATE */}
        <form onSubmit={createMission} className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Título del objetivo" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="bg-[#0b0c10] text-white border border-gray-700 px-3 py-2 rounded focus:border-[#66fcf1] outline-none"
            required
          />
          <input 
            type="number" 
            placeholder="Créditos" 
            value={newBounty}
            onChange={(e) => setNewBounty(e.target.value)}
            className="bg-[#0b0c10] text-white border border-gray-700 px-3 py-2 rounded focus:border-[#66fcf1] outline-none w-28"
            required
            min="1"
          />
          <button 
            type="submit"
            disabled={isCreating}
            className="flex items-center gap-1 bg-[#1f2833] border border-[#66fcf1] text-[#66fcf1] px-4 py-2 rounded hover:bg-[#66fcf1]/10 transition-colors disabled:opacity-50"
          >
            <Plus className="w-5 h-5" /> Añadir
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {missions.map(m => (
          <div key={m.id} className="bg-[#1f2833] border border-gray-700 rounded-lg p-5 hover:border-[#45a29e] transition-colors relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-2 h-full ${m.status === 'open' ? 'bg-green-500' : m.status === 'claimed' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
            
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-white mb-2 pr-6">{m.title}</h3>
              
              {/* Botón DELETE (Solo visible si el usuario creó la misión) */}
              {m.created_by === userId && (
                <button 
                  onClick={() => deleteMission(m.id)}
                  className="text-gray-500 hover:text-red-500 transition-colors p-1"
                  title="Eliminar misión"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-yellow-400 mb-4 font-mono text-lg">
              <Coins className="w-5 h-5" /> {m.bounty_credits.toLocaleString()} Créditos
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${m.status === 'open' ? 'bg-green-500/20 text-green-300' : m.status === 'claimed' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-500/20 text-gray-300'}`}>
                {m.status.toUpperCase()}
              </span>
              
              {/* Botón UPDATE (Reclamar / Completar) */}
              {m.status === 'open' && (
                <button 
                  onClick={() => claimBounty(m.id)}
                  className="flex items-center gap-1 bg-[#45a29e] text-black px-4 py-2 rounded hover:bg-[#66fcf1] font-bold text-sm transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" /> Reclamar & Cobrar
                </button>
              )}
              {m.status === 'completed' && (
                <span className="flex items-center gap-1 text-gray-400 text-sm">
                  <CheckCircle className="w-4 h-4" /> Completada
                </span>
              )}
            </div>
          </div>
        ))}
        {missions.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center text-gray-500 py-12">
            No hay misiones disponibles en el sector.
          </div>
        )}
      </div>
    </div>
  );
}
