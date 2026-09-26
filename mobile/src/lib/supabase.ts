import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const MemoryStorage = {
  store: new Map<string, string>(),
  getItem: (key: string) => {
    return Promise.resolve(MemoryStorage.store.get(key) || null);
  },
  setItem: (key: string, value: string) => {
    MemoryStorage.store.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    MemoryStorage.store.delete(key);
    return Promise.resolve();
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: MemoryStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
