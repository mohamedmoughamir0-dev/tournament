import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
    anchor: '(tabs)',
};

// 🌍 RootLayout : C'est le point d'entrée principal de l'interface.
// Il gère la navigation globale (Stack) et le thème (Dark/Light).

export default function RootLayout() {
    const colorScheme = useColorScheme();


    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
                {/* 🏠 (tabs) : Contient la navigation par onglets définie dans app/(tabs) */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                {/* 🔔 modal : Une fenêtre modale pour afficher des infos par-dessus */}
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}
