import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        router.replace('/');
      }
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

  if (loading) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: user ? 'Logout' : 'Login',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name={user ? "rectangle.portrait.and.arrow.right" : "person.fill"} color={color} />,
          tabBarLabel: user ? 'Logout' : 'Login',
        }}
        listeners={{
          tabPress: (e: any) => {
            if (user) {
              e.preventDefault(); // Don't switch to the tab
              handleLogout();
            }
          },
        }}
      />

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
