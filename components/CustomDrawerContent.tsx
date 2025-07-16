import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Image, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAuth, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { ThemedText } from "@/components/themedText";
import { ThemedView } from "@/components/themedView";
import { Colors } from "@/constants/colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const auth = getAuth();
  const colorScheme = useColorScheme() ?? "light";

  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("User");

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const email = currentUser.email || "";
      setUserEmail(email);
      setDisplayName(currentUser.displayName || email.split("@")[0] || "User");
    }
        
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const email = user.email || "";
        setUserEmail(email);
        setDisplayName(user.displayName || email.split("@")[0] || "User");
      } else {
        setUserEmail("");
        setDisplayName("User");
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <DrawerContentScrollView 
        {...props}
        contentContainerStyle={{
          backgroundColor: Colors[colorScheme].background
        }}
      >
        <ThemedView style={{ alignItems: "center", paddingVertical: 20 }}>
          <Image
            source={require("../assets/Profile.png")}
            style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 40,
              borderWidth: 2,
              borderColor: Colors[colorScheme].border
            }}
          />
          <ThemedText style={{ 
            fontSize: 16, 
            fontWeight: "bold", 
            marginTop: 10,
            color: Colors[colorScheme].text
          }}>
            {displayName}
          </ThemedText>
          <ThemedText style={{ 
            fontSize: 14, 
            color: Colors[colorScheme].subtitleColor,
            opacity: 0.8
          }}>
            {userEmail}
          </ThemedText>
        </ThemedView>
        
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      
      <ThemedView style={{ 
        borderTopWidth: 1, 
        borderTopColor: Colors[colorScheme].border, 
        padding: 10 
      }}>
        <DrawerItem
          label="Sign Out"
          onPress={handleSignOut}
          labelStyle={{ 
            color: Colors[colorScheme].primary, 
            fontWeight: "bold" 
          }}
          icon={({ size }) => (
            <View style={{
              width: size,
              height: size,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{ 
                color: Colors[colorScheme].primary,
                fontSize: 16
              }}>⏻</Text>
            </View>
          )}
        />
      </ThemedView>
    </ThemedView>
  );
}