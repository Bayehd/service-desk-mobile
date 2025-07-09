import { Image, StyleSheet } from "react-native";
import { ThemedText } from "@/components/themedText";
import { ThemedView } from "@/components/themedView";
import { Colors } from "@/constants/colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const Page = () => {
    const colorScheme = useColorScheme() ?? "light";
    
    return (
       <ThemedView style={styles.container}>
        <ThemedText style={[styles.textStyle, { color: Colors[colorScheme].primary }]}>
             Call Service Desk Phone Number : " 1188 "
        </ThemedText>
        <Image
                source={require("../../assets/support.png")}
                style={[
                    styles.supportImage,
                    { 
                        tintColor: colorScheme === 'dark' ? Colors[colorScheme].tint : undefined 
                    }
                ]}
                />
        </ThemedView>
    );
};

export default Page;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
    },
    textStyle: {
        fontWeight: "bold",
        marginTop: 40,
        fontSize: 19,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    supportImage: {
        width: '70%',
        height: '55%',
        marginTop: 40,
        resizeMode: 'contain',
    }
});