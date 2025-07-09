import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Octicons from '@expo/vector-icons/Octicons'; 
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ThemedText } from "@/components/themedText";
import { ThemedView } from "@/components/themedView";
import { Colors } from "@/constants/colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ServiceBotScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content:
        "Hello! I'm your IT Service Desk Assistant. I'm here to help you with technical issues, troubleshooting, and IT-related questions. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const systemInstruction = `You are a professional IT service desk assistant. 
      
      SCOPE: Answer questions only related to:
      - IT troubleshooting and technical support
      - Hardware repairs and maintenance
      - Software issues and installations
      - Network connectivity problems
      - Account access and password resets
      - Email and communication tools
      - Printer and peripheral device issues
      - System performance optimization
      - Security and antivirus concerns
      - Mobile device support
      
      BEHAVIOR:
      - If asked questions outside this scope, politely redirect users back to IT-related topics
      - When users greet you, respond warmly and explain your role
      - Maintain a professional yet friendly tone
      - Provide step-by-step solutions when possible
      - Ask clarifying questions if needed
      - Suggest escalation to log a request and it'll be assigned to a technician.
      
      RESPONSE FORMAT:
      - Keep responses concise but informative
      - Use bullet points for multi-step solutions
      - Include safety warnings when necessary
      - End with asking if they need further assistance`;

  const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemInstruction,
  });

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const result = await model.generateContent(inputMessage);
      const response = await result.response;
      const botResponse = response.text();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      Alert.alert('Error', 'Failed to get response. Please try again.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I'm experiencing technical difficulties. Please try again or log a request directly.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    return (
      <View key={message.id} style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        {!isUser && (
          <View style={[styles.botAvatar, { backgroundColor: Colors[colorScheme].backgroundTint }]}>
            <Octicons name="dependabot" size={20} color={Colors[colorScheme].primary} />
          </View>
        )}
        
        <View style={[
          styles.messageBubble, 
          isUser ? 
            [styles.userBubble, { backgroundColor: Colors[colorScheme].primary }] : 
            [styles.botBubble, { backgroundColor: Colors[colorScheme].backgroundTint }]
        ]}>
          <ThemedText style={[
            styles.messageText,
            isUser && { color: '#fff' }
          ]}>
            {message.content}
          </ThemedText>
          <ThemedText style={[
            styles.messageTime,
            isUser && { color: 'rgba(255, 255, 255, 0.7)' }
          ]}>
            {formatTime(message.timestamp)}
          </ThemedText>
        </View>

        {isUser && (
          <View style={[styles.userAvatar, { backgroundColor: Colors[colorScheme].backgroundTint }]}>
            <Icon name="person" size={20} color={Colors[colorScheme].icon} />
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { backgroundColor: Colors[colorScheme].background, borderBottomColor: Colors[colorScheme].border }]}>
          <Octicons name="dependabot" size={24} color={Colors[colorScheme].primary} />
          <View style={styles.headerText}>
            <ThemedText style={styles.headerSubtitle}>Your AI-powered IT support assistant</ThemedText>
          </View>
        </View>

        <KeyboardAvoidingView 
          style={styles.chatContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(renderMessage)}
            
            {isLoading && (
              <View style={styles.loadingContainer}>
                <View style={[styles.botAvatar, { backgroundColor: Colors[colorScheme].backgroundTint }]}>
                  <Octicons name="dependabot" size={20} color={Colors[colorScheme].primary} />
                </View>
                <View style={[styles.loadingBubble, { backgroundColor: Colors[colorScheme].backgroundTint }]}>
                  <ActivityIndicator size="small" color={Colors[colorScheme].icon} />
                  <ThemedText style={styles.loadingText}>Thinking...</ThemedText>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputContainer, { backgroundColor: Colors[colorScheme].background, borderTopColor: Colors[colorScheme].border }]}>
            <TextInput
              style={[
                styles.textInput,
                { 
                  backgroundColor: Colors[colorScheme].backgroundTint,
                  borderColor: Colors[colorScheme].border,
                  color: Colors[colorScheme].text
                }
              ]}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Ask me about IT issues, troubleshooting, or technical support..."
              placeholderTextColor={Colors[colorScheme].placeholder}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: Colors[colorScheme].primary },
                (!inputMessage.trim() || isLoading) && { backgroundColor: Colors[colorScheme].placeholder }
              ]}
              onPress={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default ServiceBotScreen;