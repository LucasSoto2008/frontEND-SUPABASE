import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import { Target, Coins, ShieldAlert, CheckCircle, Trash2, Plus } from 'lucide-react-native';

export default function MissionsBoard({ userId }: { userId: string }) {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newBounty, setNewBounty] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchMissions();

    const channel = supabase.channel('realtime:missions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, (payload) => {
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

  const createMission = async () => {
    if (!newTitle || !newBounty) return;
    setIsCreating(true);
    
    const { error } = await supabase.from('missions').insert([{
      title: newTitle,
      bounty_credits: parseInt(newBounty),
      status: 'open',
      created_by: userId
    }]);
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setNewTitle('');
      setNewBounty('');
      fetchMissions();
    }
    setIsCreating(false);
  };

  const deleteMission = async (missionId: string) => {
    Alert.alert('Borrar Misión', '¿Seguro que quieres eliminar esta misión del Holocron?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('missions').delete().eq('id', missionId);
        if (error) Alert.alert('Error', error.message);
        else fetchMissions();
      }}
    ]);
  };

  const claimBounty = async (missionId: string) => {
    try {
      const { data, error } = await supabase.rpc('claim_bounty', {
        mission_id: missionId,
        hunter_id: userId
      });
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (!data.success) {
        Alert.alert('Error', data.error);
      } else {
        Alert.alert('¡Cobro exitoso!', `Recibiste ${data.payout} créditos. (Impuesto descontado: ${data.tax_deducted})`);
        fetchMissions();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { borderRightColor: item.status === 'open' ? '#22c55e' : item.status === 'claimed' ? '#eab308' : '#6b7280', borderRightWidth: 4 }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.created_by === userId && (
          <TouchableOpacity onPress={() => deleteMission(item.id)} style={styles.deleteButton}>
            <Trash2 size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bountyContainer}>
        <Coins size={20} color="#eab308" />
        <Text style={styles.bountyText}>{item.bounty_credits} Créditos</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
        </View>

        {item.status === 'open' && (
          <TouchableOpacity onPress={() => claimBounty(item.id)} style={styles.claimButton}>
            <ShieldAlert size={16} color="#000" style={{marginRight: 4}} />
            <Text style={styles.claimButtonText}>Reclamar</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'completed' && (
          <View style={styles.completedBadge}>
            <CheckCircle size={16} color="#9ca3af" style={{marginRight: 4}} />
            <Text style={styles.completedText}>Completada</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.createContainer}>
        <TextInput 
          style={styles.inputTitle}
          placeholder="Título del objetivo"
          placeholderTextColor="#6b7280"
          value={newTitle}
          onChangeText={setNewTitle}
        />
        <TextInput 
          style={styles.inputCredits}
          placeholder="Créditos"
          placeholderTextColor="#6b7280"
          value={newBounty}
          onChangeText={setNewBounty}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addButton} onPress={createMission} disabled={isCreating}>
          <Plus size={20} color="#66fcf1" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Cargando misiones del Gremio...</Text>
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
  },
  createContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2833',
  },
  inputTitle: {
    flex: 2,
    backgroundColor: '#1f2833',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  inputCredits: {
    flex: 1,
    backgroundColor: '#1f2833',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  addButton: {
    backgroundColor: '#1f2833',
    borderWidth: 1,
    borderColor: '#66fcf1',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  loadingText: {
    color: '#66fcf1',
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#1f2833',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  bountyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bountyText: {
    color: '#eab308',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(75, 85, 99, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: 'bold',
  },
  claimButton: {
    backgroundColor: '#45a29e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  claimButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedText: {
    color: '#9ca3af',
    fontSize: 12,
  }
});
