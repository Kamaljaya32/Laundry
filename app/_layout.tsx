import { Stack, Slot, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import React from 'react';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/LoginScreen');     
    }
  }, [loading, user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Slot />                      
    </Stack>
  );
}
