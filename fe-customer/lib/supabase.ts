import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config';

// Lazy-load AsyncStorage only on native to avoid web crashes
const nativeStorageAdapter = Platform.OS !== 'web'
  ? {
      getItem: async (key: string) => {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        return AsyncStorage.getItem(key);
      },
      setItem: async (key: string, value: string) => {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem(key, value);
      },
      removeItem: async (key: string) => {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.removeItem(key);
      },
    }
  : undefined;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: nativeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    // On web: Supabase reads the OAuth code/hash from the URL automatically after redirect
    // On native: we handle the deep-link code exchange manually
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});
