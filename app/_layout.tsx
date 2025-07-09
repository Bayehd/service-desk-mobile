import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/authContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { JSX, useEffect } from 'react';
import 'react-native-reanimated';
import Toast, { BaseToast, BaseToastProps, ErrorToast } from 'react-native-toast-message';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export const unstable_settings = {
  initialRouteName: "/create",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const queryClient = new QueryClient();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const toastConfig = {
    success: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: Colors[colorScheme].primary,
          backgroundColor: Colors[colorScheme].backgroundTint,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          color: Colors[colorScheme].text,
        }}
        text2Style={{
          fontSize: 14,
          color: Colors[colorScheme].text,
        }}
      />
    ),
    /*
      Overwrite 'error' type,
      by modifying the existing `ErrorToast` component
    */
    error: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: Colors[colorScheme].error,
          backgroundColor: Colors[colorScheme].backgroundTint,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          color: Colors[colorScheme].text,
        }}
        text2Style={{
          fontSize: 14,
          color: Colors[colorScheme].text,
        }}
      />
    ),
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen name='index' options={{ headerShown: false }} />
          <Stack.Screen name='signup' options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <Toast config={toastConfig} />
      </AuthProvider>
    </QueryClientProvider>
  );
}