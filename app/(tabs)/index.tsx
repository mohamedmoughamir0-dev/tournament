import { View, StyleSheet, Text, Alert, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, LayoutAnimation, UIManager, Image } from "react-native";
import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";

import {
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { IconSymbol } from '@/components/ui/icon-symbol';

WebBrowser.maybeCompleteAuthSession();

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function App() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  // Setup Auth Listener
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Optional: Auto-redirect if needed, but tabs handle navigation now
    });
    return () => unsubscribe();
  }, []);

  const toggleAuthMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLogin(!isLogin);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  /* 💾 Save User to Firestore */
  const saveUserData = async (user: User, customName?: string) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: customName || user.displayName || user.email?.split('@')[0],
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          games: [],
        });
        console.log("User created in Firestore!");
      }
    } catch (error: any) {
      console.error("Error saving user data:", error);
    }
  };

  /* 📧 Email/Password Handlers */
  const handleEmailSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert("Incomplete", "Please fill in all fields including your name.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak Password", "Password should be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);


      // Update the user's profile with their name
      await updateProfile(userCredential.user, {
        displayName: name
      });

      console.log("Registered with:", userCredential.user.email);
      // ⚡ Don't await DB write - let user in immediately!
      saveUserData(userCredential.user, name);
      router.replace("/tournaments");
    } catch (error: any) {
      console.log("Registration Error:", error.code);
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Info", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in with:", userCredential.user.email);

      // ⚡ Don't await DB write - let user in immediately!
      saveUserData(userCredential.user);
      router.replace("/tournaments");
    } catch (error: any) {
      console.log("Login Error:", error.message);
      Alert.alert("Login Failed", "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };


  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: "230059253546-677cjd0afijc3dfvitmdtne2lh8lnb06.apps.googleusercontent.com",
    androidClientId: "230059253546-677cjd0afijc3dfvitmdtne2lh8lnb06.apps.googleusercontent.com",
    iosClientId: "230059253546-677cjd0afijc3dfvitmdtne2lh8lnb06.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          saveUserData(userCredential.user);
          router.replace("/tournaments");
        })
        .catch((error) => console.log("Google Sign-In Error", error));
    }
  }, [response]);

  // 🟢 LOGGED IN VIEW
  if (user) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <IconSymbol size={60} name="person.fill" color="#fff" />
            </View>
            <Text style={styles.title}>Welcome!</Text>
            <Text style={styles.subtitle}>{user.displayName || user.email}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.value}>{new Date(user.metadata.creationTime || Date.now()).toLocaleDateString()}</Text>
            </View>

            <View style={{ marginTop: 30 }}>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#E53E3E' }]} onPress={handleLogout}>
                <Text style={styles.buttonText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 🔴 LOGGED OUT VIEW (Login/Signup)
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <IconSymbol size={60} name="trophy.fill" color="#fff" />
          </View>
          <Text style={styles.title}>{isLogin ? "Hello Again!" : "Create Account"}</Text>
          <Text style={styles.subtitle}>
            {isLogin ? "Welcome back to the Tournament" : "Join us and start competing today!"}
          </Text>
        </View>

        <View style={styles.card}>

          {/* Name Field - Only for Signup */}
          {!isLogin && (
            <View style={styles.inputWrapper}>
              <IconSymbol size={20} name="person.fill" color="#A0AEC0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#A0AEC0"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <IconSymbol size={20} name="envelope.fill" color="#A0AEC0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#A0AEC0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <IconSymbol size={20} name="lock.fill" color="#A0AEC0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0AEC0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#4A90E2" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={isLogin ? handleEmailLogin : handleEmailSignUp}>
                <Text style={styles.buttonText}>{isLogin ? "Log In" : "Sign Up"}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
            <IconSymbol size={20} name="globe" color="#4A5568" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.switchButton} onPress={toggleAuthMode}>
          <Text style={styles.switchButtonText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#4A90E2',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D3748",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    maxWidth: '80%',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2D3748",
    height: '100%',
  },
  buttonContainer: {
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    marginHorizontal: 16,
    color: '#CBD5E0',
    fontWeight: 'bold',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A5568",
  },
  switchButton: {
    alignItems: 'center',
    padding: 16,
  },
  switchButtonText: {
    color: "#4A90E2",
    fontSize: 16,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '600',
  },
});
