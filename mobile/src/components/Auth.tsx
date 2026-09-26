import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Rocket, Mail, Lock } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (type: 'login' | 'signup') => {
    setLoading(true);
    
    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: email.split('@')[0] }
          }
        });
        if (error) Alert.alert('Error', error.message);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) Alert.alert('Error', error.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const redirectUrl = Linking.createURL('/');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success' && result.url) {
          // Usar Linking.parse de Expo para evitar que 'new URL()' crashee con 'exp://'
          const parsedUrl = Linking.parse(result.url);
          
          // Supabase manda los tokens en el fragmento (hash) o en los query params
          const queryParams = parsedUrl.queryParams;
          
          let accessToken = queryParams?.access_token as string;
          let refreshToken = queryParams?.refresh_token as string;

          // A veces los manda en el fragmento y expo-linking no los parsea automáticamente,
          // así que extraemos manualmente si es necesario:
          if (!accessToken && result.url.includes('#')) {
            const hashPart = result.url.split('#')[1];
            const hashParams = new URLSearchParams(hashPart);
            accessToken = hashParams.get('access_token') || '';
            refreshToken = hashParams.get('refresh_token') || '';
          }

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Aviso', 'El login de Google requiere configuración adicional en Expo Go. Por favor, usa correo electrónico para la demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Rocket size={48} color="#66fcf1" style={{ marginBottom: 16 }} />
          <Text style={styles.title}>Holocron & Bounty Guild</Text>
          <Text style={styles.subtitle}>Acceso a la Red Cazarrecompensas</Text>
        </View>

        <View style={styles.inputContainer}>
          <Mail size={20} color="#c5c6c7" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Holo-Email"
            placeholderTextColor="#c5c6c7"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color="#c5c6c7" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Código de seguridad"
            placeholderTextColor="#c5c6c7"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#66fcf1" style={{ marginTop: 20 }} />
        ) : (
          <>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.loginButton} onPress={() => handleAuth('login')}>
                <Text style={styles.loginButtonText}>Entrar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.signupButton} onPress={() => handleAuth('signup')}>
                <Text style={styles.signupButtonText}>Registrarse</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>o</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
              <Text style={styles.googleButtonText}>Continuar con Google</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0c10',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#1f2833',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(102, 252, 241, 0.2)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    color: '#c5c6c7',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b0c10',
    borderWidth: 1,
    borderColor: '#45a29e',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    paddingVertical: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  loginButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#66fcf1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#66fcf1',
    fontWeight: 'bold',
  },
  signupButton: {
    flex: 1,
    backgroundColor: '#45a29e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  orText: {
    color: '#9ca3af',
    marginHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  googleButtonText: {
    color: '#1f2937',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
