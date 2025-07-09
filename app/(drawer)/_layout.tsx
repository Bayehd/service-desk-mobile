import "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Octicons from '@expo/vector-icons/Octicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import CustomDrawerContent from "@/components/CustomDrawerContent";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/colors";

export default function DrawerLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    
    return(
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer 
                drawerContent={CustomDrawerContent}
                screenOptions={{
                    drawerActiveBackgroundColor: Colors[colorScheme].primary,
                    drawerActiveTintColor: Colors[colorScheme].background,
                    drawerInactiveTintColor: Colors[colorScheme].text,
                    drawerStyle: {
                        backgroundColor: Colors[colorScheme].background,
                    },
                    headerStyle: {
                        backgroundColor: Colors[colorScheme].background,
                    },
                    headerTintColor: Colors[colorScheme].text,
                    headerTitleStyle: {
                        color: Colors[colorScheme].text,
                    },
                }}
            >
                <Drawer.Screen 
                    name="Requests" 
                    options={{ 
                        drawerLabel: "Requests",
                        headerTitle: "Requests",
                        drawerIcon: ({ size, color }) => (
                            <AntDesign name="filetext1" size={size} color={color} />
                        ),
                    }}
                />
                <Drawer.Screen 
                    name="addRequests" 
                    options={{ 
                        drawerLabel: "Add Requests", 
                        headerTitle: "Request Details",
                        drawerIcon: ({ size, color }) => (
                            <AntDesign name="plus" size={size} color={color} />
                        ),
                    }}
                />
                <Drawer.Screen 
                    name="serviceBot" 
                    options={{ 
                        drawerLabel: "Service Bot", 
                        headerTitle: "Service Bot",
                        drawerIcon: ({ size, color }) => (
                            <Octicons name="dependabot" size={size} color={color} />
                        ),
                    }}
                />
                <Drawer.Screen 
                    name="Reports" 
                    options={{ 
                        drawerLabel: "Reports",
                        headerTitle: "Report Information",
                        drawerIcon: ({ size, color }) => (
                            <AntDesign name="barschart" size={size} color={color} />
                        ),
                    }}
                />
                <Drawer.Screen 
                    name="Support" 
                    options={{ 
                        drawerLabel: "Support",
                        headerTitle: "For Support",
                        drawerIcon: ({ size, color }) => (
                            <AntDesign name="questioncircleo" size={size} color={color} />
                        ),
                    }}
                />
            </Drawer>
        </GestureHandlerRootView>
    );
}