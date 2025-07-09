import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../lib/config/firebase';
import { useAuth } from '../../context/authContext';
import { useRouter } from 'expo-router';
import { ThemedText } from "@/components/themedText";
import { ThemedView } from "@/components/themedView";
import { Colors } from "@/constants/colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface Request {
  id: string;
  requester: string;
  requesterEmail: string;
  requesterUID: string;
  name: string;
  title: string;
  technician: string;
  priority: string;
  date: any;
  status: 'Open' | 'Closed' | 'Resolved' | 'Unassigned';
  description?: string;
  site?: string;
}

export default function RequestScreen() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    if (!user) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }
    return fetchRequests();
  }, [user, isAdmin]);

  const fetchRequests = () => {
    if (!user) return () => {};
    
    const requestsRef = collection(db, "requests");
    let requestsQuery;
    
    if (isAdmin) {
      requestsQuery = query(requestsRef, orderBy("date", "desc"));
    } else {
      requestsQuery = query(
        requestsRef,
        where("requesterUID", "==", user.uid),
        orderBy("date", "desc")
      );
    }
  
    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const fetchedRequests: Request[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Request, 'id'>;
        return {
          id: doc.id,
          ...data,
        };
      });
  
      setRequests(fetchedRequests);
      setLoading(false);
    }, (error) => {
      setError("Failed to fetch requests");
      console.error("Firestore Error:", error);
      setLoading(false);
    });
  
    return unsubscribe;
  };
  
  const deleteRequest = async (id: string, requesterUID: string) => {
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to delete requests.');
        return;
      }
      if (isAdmin || user.uid === requesterUID) {
        Alert.alert(
          'Delete Request',
          'Are you sure you want to delete this request?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                const requestRef = doc(db, 'requests', id);
                await deleteDoc(requestRef);
              },
            },
          ]
        );
      } else {
        Alert.alert('Permission Denied', 'You can only delete your own requests.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to delete request. Please try again.');
      console.error('Delete request error:', err);
    }
  };

  const handleRequestPress = (request: Request) => {
    if (isAdmin) {
      router.push({
        pathname: "/(drawer)/addRequests",
        params: {
          requestId: request.id,
          edit: "true"
        }
      });
    }
  };

  const getStatusStyle = (status: string) => {
    const baseStyle = {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    };
    
    switch (status) {
      case 'Open':
        return { ...baseStyle, backgroundColor: Colors[colorScheme].statusOpen };
      case 'Closed':
        return { ...baseStyle, backgroundColor: Colors[colorScheme].statusClosed };
      case 'Resolved':
        return { ...baseStyle, backgroundColor: Colors[colorScheme].statusResolved };
      case 'Unassigned':
        return { ...baseStyle, backgroundColor: Colors[colorScheme].statusUnassigned };
      default:
        return baseStyle;
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'Open':
        return Colors[colorScheme].statusOpenText;
      case 'Closed':
        return Colors[colorScheme].statusClosedText;
      case 'Resolved':
        return Colors[colorScheme].statusResolvedText;
      case 'Unassigned':
        return Colors[colorScheme].statusUnassignedText;
      default:
        return Colors[colorScheme].text;
    }
  };

  const filteredRequests = requests.filter((request) => {
    const title = request.title || '';
    const name = request.name || '';
    
    const matchesSearch = searchQuery.toLowerCase() === '' ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });
  
  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <Text style={[styles.errorText, { color: Colors[colorScheme].error }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: Colors[colorScheme].primary }]}
          onPress={() => {
            setError(null);
            setLoading(true);
            fetchRequests();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[
        styles.searchContainer,
        { 
          backgroundColor: Colors[colorScheme].searchBackground,
          borderColor: Colors[colorScheme].border,
        }
      ]}>
        <Ionicons 
          name="search" 
          size={20} 
          color={Colors[colorScheme].icon} 
          style={styles.searchIcon} 
        />
        <TextInput
          style={[
            styles.searchInput,
            { color: Colors[colorScheme].text }
          ]}
          placeholder="Search requests..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          placeholderTextColor={Colors[colorScheme].placeholder}
        />
      </View>
      
      {loading ? (
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
        </ThemedView>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.requestCard,
                { 
                  backgroundColor: Colors[colorScheme].cardBackground,
                  borderColor: Colors[colorScheme].border,
                  shadowColor: Colors[colorScheme].shadowColor,
                }
              ]}
              onPress={() => handleRequestPress(item)}
              onLongPress={() => deleteRequest(item.id, item.requesterUID)}
            >
              <View style={styles.requestHeader}>
                <Text style={[
                  styles.requestTitle,
                  { color: Colors[colorScheme].titleColor }
                ]}>
                  {item.title}
                </Text>
                <View style={getStatusStyle(item.status)}>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusTextColor(item.status) }
                  ]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.requestDetails,
                { color: Colors[colorScheme].subtitleColor }
              ]}>
                {item.name}
              </Text>
              <Text style={[
                styles.technician,
                { color: Colors[colorScheme].technicianColor }
              ]}>
                {item.technician || 'Unassigned'}
              </Text>
              <Text style={[
                styles.requestDetails,
                { color: Colors[colorScheme].subtitleColor }
              ]}>
                Priority: {item.priority}
              </Text>
              <Text style={[
                styles.requestDate,
                { color: Colors[colorScheme].dateColor }
              ]}>
                {item.date?.toDate?.()?.toLocaleString() || 'No date'}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <Text style={[
                styles.emptyText,
                { color: Colors[colorScheme].emptyStateColor }
              ]}>
                {isAdmin
                  ? "No requests found in the system"
                  : "You haven't submitted any requests yet"}
              </Text>
            </ThemedView>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  listContainer: {
    padding: 10,
    paddingBottom: 80,
  },
  requestCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  requestDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  technician: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: "500",
  },
  requestDate: {
    fontSize: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});