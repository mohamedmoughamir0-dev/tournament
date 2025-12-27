import { StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '../../firebase';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TournamentsScreen() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTournaments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "tournois"));
      const tournamentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTournaments(tournamentsData);
    } catch (error) {
      console.error("Error fetching tournaments: ", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTournaments();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: "/tournament/[id]", params: { id: item.id } })}
    >
      <ThemedView style={styles.cardContent}>
        <IconSymbol name="gamecontroller.fill" size={40} color="#4A90E2" />
        <ThemedView style={styles.textContainer}>
          <ThemedText type="subtitle">{item.nom}</ThemedText>
          <ThemedText>{item.game}</ThemedText>
          <ThemedText style={styles.date}>
            {item.dateDebut ? new Date(item.dateDebut.seconds * 1000).toLocaleDateString() : 'TBD'}
          </ThemedText>
        </ThemedView>
        <IconSymbol name="chevron.right" size={24} color="#808080" />
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Tournaments</ThemedText>
      </ThemedView>

      <FlatList
        data={tournaments}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText>No tournaments found.</ThemedText>
            <ThemedText>Pull to refresh.</ThemedText>
          </ThemedView>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60, // Adjust for status bar
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333', // Subtle border
    backgroundColor: '#1E1E1E', // Dark card bg
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'transparent',
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
    backgroundColor: 'transparent',
  },
  date: {
    fontSize: 12,
    color: '#808080',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  }
});
