import { View, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '../../firebase';

// ℹ️ TournamentDetailsScreen : Affiche les détails d'un tournoi spécifique.
// C'est une route dynamique : [id] sera remplacé par l'ID du tournoi.

export default function TournamentDetailsScreen() {
    const { id } = useLocalSearchParams(); // 🎣 Récupère l'ID depuis l'URL
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        const fetchTournament = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "tournois", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setTournament(docSnap.data());
                } else {
                    Alert.alert("Error", "Tournament not found");
                    router.back();
                }
            } catch (error) {
                console.error("Error fetching tournament:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTournament();
    }, [id]);

    // ➕ Gestion de l'inscription au tournoi
    const handleJoin = async () => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            Alert.alert("Login Required", "You must be logged in to join a tournament.");
            return;
        }

        setJoining(true);
        try {
            const tournamentRef = doc(db, "tournois", id);

            // Add user ID to participants array
            await updateDoc(tournamentRef, {
                participants: arrayUnion(user.uid)
            });

            Alert.alert("Success", "You have joined the tournament!");
            router.back();
        } catch (error) {
            console.error("Error joining tournament:", error);
            Alert.alert("Error", "Failed to join tournament. Please try again.");
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <ThemedView style={styles.center}>
                <ActivityIndicator size="large" color="#ffffff" />
            </ThemedView>
        );
    }

    if (!tournament) return null;

    return (
        <>
            <Stack.Screen options={{ title: tournament.nom || 'Tournament Details' }} />
            <ThemedView style={styles.container}>
                <ThemedText type="title" style={styles.title}>{tournament.nom}</ThemedText>
                <ThemedText type="subtitle" style={styles.subtitle}>{tournament.game}</ThemedText>

                <View style={styles.infoSection}>
                    <ThemedText>📅 Date: {tournament.dateDebut ? new Date(tournament.dateDebut.seconds * 1000).toLocaleDateString() : 'TBD'}</ThemedText>
                    <ThemedText>👥 Players: {tournament.participants ? tournament.participants.length : 0} / {tournament.nombreJoueurs || '?'}</ThemedText>
                </View>

                <View style={styles.section}>
                    <ThemedText type="defaultSemiBold">Rules:</ThemedText>
                    <ThemedText>Standard tournament rules apply. Single elimination bracket.</ThemedText>
                </View>

                <View style={styles.footer}>
                    <Button
                        title={joining ? "Joining..." : "Join Tournament"}
                        onPress={handleJoin}
                        disabled={joining}
                    />
                </View>
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        marginBottom: 10,
    },
    subtitle: {
        color: '#808080',
        marginBottom: 20,
    },
    infoSection: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#333',
        borderRadius: 10,
        gap: 10,
    },
    section: {
        marginBottom: 20,
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 20,
    }
});
