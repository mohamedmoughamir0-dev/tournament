import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// 📑 TabLayout : Gère la barre de navigation du bas.
// Il vérifie aussi si l'utilisateur est connecté.

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const [user, setUser] = useState(null);

    const router = useRouter();


    // 🔒 Vérifie l'état de connexion de l'utilisateur
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (!u) {
                router.replace('/');
            }

            // Si pas connecté, on est déjà sur la bonne page (Tabs), 
            // le composant index.jsx se chargera d'afficher le Login.
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };



    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarButton: HapticTab,
            }}>

            {/* 👤 Onglet 1 : Profil / Login */}
            <Tabs.Screen
                name="index"
                options={{
                    title: user ? 'Logout' : 'Login',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name={user ? "rectangle.portrait.and.arrow.right" : "person.fill"} color={color} />,
                    tabBarLabel: user ? 'Logout' : 'Login',
                }}
                listeners={{
                    tabPress: (e) => {
                        if (user) {
                            e.preventDefault(); // Don't switch to the tab
                            handleLogout();
                        }
                    },
                }}
            />

            {/* 🏆 Onglet 2 : Liste des tournois */}
            <Tabs.Screen
                name="tournaments"
                options={{
                    title: 'Tournaments',
                    href: user ? '/tournaments' : null,
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="trophy.fill" color={color} />,
                }}
            />
        </Tabs>
    );
}
