import React, { useState } from "react";
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "../components/themedText";
import { ThemedView } from "../components/themedView";
import { Colors } from "@/constants/colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { auth, LoginSchema, LoginSchemaType, usersCollection } from "@/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Controller, useForm } from "react-hook-form";
import { getDocs, query, where } from "firebase/firestore";
import { useAuth, User } from "@/context/authContext";

export default function AuthScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const { 
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(LoginSchema),
  });
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleAuth(data: LoginSchemaType) {
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      if (!userCredential) {
        Alert.alert("Error", "Failed to log in. Please try again.");
        return;
      }

      const { user: firebaseUser } = userCredential;
      const q = query(
        usersCollection,
        where("email", "==", firebaseUser.email)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("Error", "User not found. Please check your email.");
        return;
      }

      const userDoc = querySnapshot.docs[0].data() as User
      console.log("User document:", userDoc);
      setUser(userDoc);
      
      Alert.alert("Success", `Welcome back, ${userDoc.email}`)

      router.replace("/(drawer)/Requests"); 
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        Alert.alert(
          "Authentication Failed",
          "Invalid email or password. Please try again."
        );
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert(
          "Too Many Attempts",
          "Access temporarily disabled due to many failed login attempts. Try again later or reset your password."
        );
      } else {
        Alert.alert(
          "Login Error",
          "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={[styles.keyboardAvoidingContainer, { backgroundColor: Colors[colorScheme].background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { backgroundColor: Colors[colorScheme].background }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image source={require("../assets/loginn.png")} style={styles.image} />
            <ThemedText type="title" style={[styles.title, { color: Colors[colorScheme].primary }]}>Service Desk</ThemedText>
          </View>

          <View style={styles.formContainer}>
            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <View style={[
                    styles.textInputWrapper,
                    { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border },
                    errors.email && { borderColor: Colors[colorScheme].error }
                  ]}>
                    <Ionicons name="mail-outline" size={20} color={Colors[colorScheme].icon} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor={Colors[colorScheme].placeholder}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      style={[styles.textInput, { color: Colors[colorScheme].text }]}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      accessibilityLabel="Email input"
                    />
                  </View>
                  {errors.email && (
                    <ThemedText style={[styles.errorText, { color: Colors[colorScheme].error }]}>
                      {errors.email.message || "Email is required"}
                    </ThemedText>
                  )}
                </View>
              )}
              name="email"
            />

            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <View style={[
                    styles.textInputWrapper,
                    { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border },
                    errors.password && { borderColor: Colors[colorScheme].error }
                  ]}>
                    <Ionicons name="lock-closed-outline" size={20} color={Colors[colorScheme].icon} style={styles.inputIcon} />
                    <TextInput
                      secureTextEntry={!showPassword}
                      placeholder="Enter password"
                      placeholderTextColor={Colors[colorScheme].placeholder}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      style={[styles.textInput, { color: Colors[colorScheme].text }]}
                      accessibilityLabel="Password input"
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.passwordToggle}
                      accessibilityLabel="Toggle password visibility"
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={Colors[colorScheme].icon}
                      />
                    </Pressable>
                  </View>
                  {errors.password && (
                    <ThemedText style={[styles.errorText, { color: Colors[colorScheme].error }]}>
                      {errors.password.message || "Password is required"}
                    </ThemedText>
                  )}
                </View>
              )}
              name="password"
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors[colorScheme].primary }]}
              onPress={handleSubmit(handleAuth)}
              disabled={loading}
              accessibilityLabel="Sign in button"
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.buttonText}>SIGN IN</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <ThemedText style={styles.signupText}>Don't have an account? </ThemedText>
              <TouchableOpacity onPress={() => router.push("/signup")}>
                <ThemedText style={[styles.signupLink, { color: Colors[colorScheme].primary }]}>Sign up</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 10,
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
  },
  inputContainer: {
    width: "90%",
    marginBottom: 15,
  },
  textInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    padding: 14,
  },
  passwordToggle: {
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  button: {
    width: "90%",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  signupContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontWeight: "bold",
    fontSize: 14,
  },
});