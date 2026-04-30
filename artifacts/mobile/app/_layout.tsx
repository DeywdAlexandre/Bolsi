import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ChatSheet } from "@/components/ChatSheet";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.light.background },
        headerTintColor: colors.light.foreground,
        headerTitleStyle: { fontFamily: "Inter_600SemiBold" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.light.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="transaction/new"
        options={{
          presentation: "modal",
          title: "Nova transação",
        }}
      />
      <Stack.Screen
        name="transaction/[id]"
        options={{
          presentation: "modal",
          title: "Editar transação",
        }}
      />
      <Stack.Screen
        name="recurring/new"
        options={{
          presentation: "modal",
          title: "Nova recorrência",
        }}
      />
      <Stack.Screen
        name="recurring/[id]"
        options={{
          presentation: "modal",
          title: "Editar recorrência",
        }}
      />
      <Stack.Screen name="settings" options={{ title: "Configurações" }} />
      <Stack.Screen name="categories" options={{ title: "Categorias" }} />
      <Stack.Screen
        name="vehicle/new"
        options={{ presentation: "modal", title: "Novo veículo" }}
      />
      <Stack.Screen
        name="vehicle/[id]"
        options={{ title: "Veículo" }}
      />
      <Stack.Screen
        name="fueling/[id]"
        options={{ presentation: "modal", title: "Abastecimento" }}
      />
      <Stack.Screen
        name="oilchange/[id]"
        options={{ presentation: "modal", title: "Troca de óleo" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [updateChecked, setUpdateChecked] = useState(__DEV__ || !Updates.isEnabled);

  useEffect(() => {
    if (updateChecked) return;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setUpdateChecked(true);
      }
    };
    const timer = setTimeout(finish, 6000);
    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
          return;
        }
      } catch {
      }
      finish();
    })();
    return () => {
      clearTimeout(timer);
      finish();
    };
  }, [updateChecked]);

  const ready = (fontsLoaded || fontError) && updateChecked;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.light.background }}>
            <KeyboardProvider>
              <SettingsProvider>
                <AppDataProvider>
                  <ChatProvider>
                    <StatusBar style="light" />
                    <RootLayoutNav />
                    <ChatSheet />
                  </ChatProvider>
                </AppDataProvider>
              </SettingsProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
