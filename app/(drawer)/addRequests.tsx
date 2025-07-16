import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView, StyleSheet,
  TextInput, TouchableOpacity,
  View, ActivityIndicator, FlatList, Image
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import * as DocumentPicker from 'expo-document-picker';
import { ThemedText } from "@/components/themedText";
import { ThemedView } from "@/components/themedView";
import { Colors } from "@/constants/colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { createRequest, updateRequest, getRequestById } from '../../requestService';
import { useAuth } from "@/context/authContext";
import { uploadToCloudinary, deleteFromCloudinary } from '../../cloudinaryService';

interface AttachmentData {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  uploadedAt: Date;
}

interface RequestDetails {
  id?: string;
  requester: string;
  description: string;
  technician: string;
  status: string;
  priority: string;
  site: string;
  requesterUID?: string;
  attachments?: AttachmentData[];
}

export default function RequestDetailsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const params = useLocalSearchParams();
  
  const requestId = params.requestId as string;
  const isEditMode = params.edit === "true";
  
  const [isLoading, setIsLoading] = useState<boolean>(requestId ? true : false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [openTechnician, setOpenTechnician] = useState<boolean>(false);
  const [openStatus, setOpenStatus] = useState<boolean>(false);
  const [openPriority, setOpenPriority] = useState<boolean>(false);
  const [openSite, setOpenSite] = useState<boolean>(false);
  const [showRequesterSuggestions, setShowRequesterSuggestions] = useState<boolean>(false);
  const [filteredRequesters, setFilteredRequesters] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  
  const possibleRequesters: string[] = [
    "knkansah", "Datsbe", "Onyarko", "Kosei", "Pbekoe", "Sashley",
    "Jappiah", "Jsackey", "Sagyoe", "Asulaiman", "Copoku", "Chodasi",
    "dneequaye", "Dattobrah", "Ehanson"
  ];

  const [requestDetails, setRequestDetails] = useState<RequestDetails>({
    requester: "",
    description: "",
    technician: "",
    status: "Open",
    priority: "Low [ ** User only **]",
    site: "",
    attachments: [],
  });

  useEffect(() => {
    if (requestId && isEditMode) {
      const fetchRequestDetails = async () => {
        try {
          setIsLoading(true);
          const requestData = await getRequestById(requestId);
          if (requestData) {
            setRequestDetails({
              id: requestId,
              requester: requestData.requester || "",
              description: requestData.description || "",
              technician: requestData.technician || "",
              status: requestData.status || "Open",
              priority: requestData.priority || "Low [ ** User only **]",
              site: requestData.site || "",
              requesterUID: requestData.requesterUID || "",
              attachments: requestData.attachments || [],
            });
            setAttachments(requestData.attachments || []);
          } else {
            Alert.alert("Error", "Request not found");
            router.back();
          }
        } catch (error) {
          console.error("Error fetching request details:", error);
          Alert.alert("Error", `Failed to load request details: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      };

      fetchRequestDetails();
    } else if (user && user.email) {
      const username = user.email.split('@')[0];
      setRequestDetails(prev => ({
        ...prev,
        requester: username,
        requesterUID: user.uid
      }));
    }
  }, [requestId, isEditMode, user]);

  const handleRequesterChange = (text: string) => {
    setRequestDetails(prev => ({ ...prev, requester: text }));
    
    if (text.length === 0) {
      setFilteredRequesters(possibleRequesters);
      setShowRequesterSuggestions(true);
    } else {
      const filtered = possibleRequesters.filter(
        item => item.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredRequesters(filtered);
      setShowRequesterSuggestions(filtered.length > 0);
    }
  };

  const selectRequester = (requester: string) => {
    setRequestDetails(prev => ({ ...prev, requester }));
    setShowRequesterSuggestions(false);
  };

  const handleFileUpload = async () => {
    try {
      setIsUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        
        // Check file size (limit to 10MB)
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('Error', 'File size must be less than 10MB');
          return;
        }

        // Upload to Cloudinary
        const cloudinaryResponse = await uploadToCloudinary(file);
        
        if (cloudinaryResponse.success) {
          const newAttachment: AttachmentData = {
            id: Date.now().toString(),
            fileName: file.name,
            fileType: file.mimeType || 'unknown',
            fileSize: file.size || 0,
            cloudinaryUrl: cloudinaryResponse.url||'',
            cloudinaryPublicId: cloudinaryResponse.public_id||'',
            uploadedAt: new Date(),
          };

          setAttachments(prev => [...prev, newAttachment]);
          Alert.alert('Success', 'File uploaded successfully');
        } else {
          Alert.alert('Error', 'Failed to upload file');
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = async (attachment: AttachmentData) => {
    Alert.alert(
      'Remove Attachment',
      `Are you sure you want to remove ${attachment.fileName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from Cloudinary
              await deleteFromCloudinary(attachment.cloudinaryPublicId);
              
              // Remove from local state
              setAttachments(prev => prev.filter(item => item.id !== attachment.id));
              
              Alert.alert('Success', 'Attachment removed successfully');
            } catch (error) {
              console.error('Error removing attachment:', error);
              Alert.alert('Error', 'Failed to remove attachment');
            }
          }
        }
      ]
    );
  };

  const renderAttachment = ({ item }: { item: AttachmentData }) => (
    <View style={[styles.attachmentItem, { backgroundColor: Colors[colorScheme].backgroundTint }]}>
      <View style={styles.attachmentInfo}>
        <ThemedText style={styles.attachmentName} numberOfLines={1}>
          {item.fileName}
        </ThemedText>
        <ThemedText style={styles.attachmentSize}>
          {(item.fileSize / 1024 / 1024).toFixed(2)} MB
        </ThemedText>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveAttachment(item)}
      >
        <ThemedText style={styles.removeButtonText}>×</ThemedText>
      </TouchableOpacity>
    </View>
  );
  
  const technicianOptions = [
    { label: "Abel Uche Ekwonyeaseso", value: "Abel Uche Ekwonyeaseso" },
    { label: "Adewunmi Akinyode", value: "Adewunmi Akinyode" },
    { label: "Adeyemi A. Adeola", value: "Adeyemi A. Adeola" },
    { label: "Leonard Acquah", value: "Leonard Acquah" },
    { label: "Prince T. Okutu", value: "Prince T. Okutu" },
    { label: "Joseph Appiah", value: "Joseph Appiah"},
    { label: "Kwame Opare Adufo", value: "Kwame Opare Adufo" },
    { label: "Joshua Sackey", value: "Joshua Sackey" },
    { label: "Samuel E.Calys-Tagoe", value: "Samuel E.Calys-Tagoe" },
    { label: "Kamoli O. Ganiyu", value: "Kamoli O. Ganiyu" },
    { label: "Gentle Agoh", value: "Gentle Agoh" },
    { label: "Timothy Jide Adebisi", value: "Timothy Jide Adebisi" }
  ];
  
  const adminStatusOptions = [
    { label: "Open", value: "Open" },
    { label: "Closed", value: "Closed" },
    { label: "On Hold", value: "On Hold" },
    { label: "Resolved", value: "Resolved" },
  ];
  
  const userStatusOptions = [
    { label: "Open", value: "Open" },
  ];
  
  const statusOptions = isAdmin ? adminStatusOptions : userStatusOptions;
  
  const priorityOptions = [
    { label: "High [ ** Entire Organisation **]", value: "High [ ** Entire Organisation **]" },
    { label: "Medium [ ** Department only **]", value: "Medium [ ** Department only **]" },
    { label: "Low [ ** User only **]", value: "Low [ ** User only **]" },
  ];
  
  const siteOptions = [
    { label: "Accra HQ", value: "Accra HQ" },
    { label: "Tema R&M station", value: "Tema R&M station" },
    { label: "Cotonou R&M station", value: "Cotonou R&M station" },
    { label: "Takoradi R&M station", value: "Takoradi R&M station" },
    { label: "Lome R&M station", value: "Lome R&M station" },
    { label: "Ikeja", value: "Ikeja" },
  ];

  const resetForm = () => {
    setRequestDetails({
      requester: user?.email ? user.email.split('@')[0] : "",
      description: "",
      technician: "",
      status: "Open",
      priority: "Low [ ** User only **]",
      site: "",
      requesterUID: user?.uid || "",
      attachments: [],
    });
    setAttachments([]);
  };

  const handleSaveChanges = async () => {
    try {
      if (!requestDetails.description) {
        Alert.alert('Error', 'Description is required');
        return;
      }

      setIsSubmitting(true);
      
      if (isEditMode && requestId) {
        if (!isAdmin) {
          Alert.alert('Error', 'Only admins can edit existing requests');
          return;
        }

        const requestData = {
          technician: requestDetails.technician,
          status: requestDetails.status,
          priority: requestDetails.priority,
          site: requestDetails.site,
          attachments: attachments,
          updatedBy: user?.uid || '',
        };

        console.log('Updating request with data:', requestData);
        await updateRequest(requestId, requestData);
        
        Alert.alert("Success", "Request updated successfully", [
          { text: "OK", onPress: () => router.replace("/(drawer)/Requests") },
        ]);
      } else {
        if (!requestDetails.requester) {
          Alert.alert('Error', 'Requester is required');
          return;
        }

        const requestData = {
          requester: requestDetails.requester,
          description: requestDetails.description,
          title: requestDetails.description.split('\n')[0].substring(0, 30),
          name: requestDetails.requester,
          technician: requestDetails.technician,
          status: "Open",
          priority: requestDetails.priority,
          site: requestDetails.site,
          attachments: attachments,
          requesterUID: user?.uid || '',
          requesterEmail: user?.email || '',
          date: new Date(),
          createdAt: new Date(),
        };

        console.log('Creating new request with data:', requestData);
        await createRequest(requestData);
        resetForm();

        Alert.alert("Success", "Request created successfully", [
          { text: "OK", onPress: () => router.replace("/(drawer)/Requests") },
        ]);
      }
    } catch (error) {
      console.error("Error saving request:", error);
      Alert.alert("Error", `Failed to save request: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
        <ThemedText style={[styles.loadingText, { color: Colors[colorScheme].primary }]}>
          Loading request details...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.formField}>
              <ThemedText style={styles.label}>Requester *</ThemedText>
              <TextInput
                style={[styles.textInput,
                  { 
                    backgroundColor: Colors[colorScheme].background,
                    borderColor: Colors[colorScheme].border,
                    color: Colors[colorScheme].text
                  },
                  isEditMode && { backgroundColor: Colors[colorScheme].backgroundTint, opacity: 0.7 }
                ]}
                placeholder="Enter requester name"
                placeholderTextColor={Colors[colorScheme].placeholder}
                value={requestDetails.requester}
                onChangeText={handleRequesterChange}
                editable={!isEditMode}
                onFocus={() => {
                  if (isEditMode) return;
                  if (!requestDetails.requester) {
                    setFilteredRequesters(possibleRequesters);
                    setShowRequesterSuggestions(true);
                  } else {
                    const filtered = possibleRequesters.filter(
                      item => item.toLowerCase().includes(requestDetails.requester.toLowerCase())
                    );
                    setFilteredRequesters(filtered);
                    setShowRequesterSuggestions(filtered.length > 0);
                  }
                }}
              />
              {showRequesterSuggestions && !isEditMode && (
                <View style={[
                  styles.suggestionsContainer,
                  { 
                    backgroundColor: Colors[colorScheme].background,
                    borderColor: Colors[colorScheme].border
                  }
                ]}>
                  <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true}>
                    {filteredRequesters.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[styles.suggestionItem, { borderBottomColor: Colors[colorScheme].border }]}
                        onPress={() => selectRequester(item)}
                      >
                        <ThemedText>{item}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <ThemedText style={styles.label}>Description *</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                styles.descriptionInput,
                { 
                  backgroundColor: Colors[colorScheme].background,
                  borderColor: Colors[colorScheme].border,
                  color: Colors[colorScheme].text
                },
                isEditMode && { backgroundColor: Colors[colorScheme].backgroundTint, opacity: 0.7 }
              ]}
              placeholder="Enter request description"
              placeholderTextColor={Colors[colorScheme].placeholder}
              multiline
              value={requestDetails.description}
              editable={!isEditMode}
              onChangeText={(text) => setRequestDetails((prev) => ({ ...prev, description: text }))}
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* File Attachments Section */}
            <View style={styles.attachmentsSection}>
              <ThemedText style={styles.label}>Attachments</ThemedText>
              
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  { 
                    backgroundColor: Colors[colorScheme].backgroundTint,
                    borderColor: Colors[colorScheme].border
                  },
                  isUploading && { opacity: 0.6 }
                ]}
                onPress={handleFileUpload}
                disabled={isUploading}
              >
                <ThemedText style={styles.uploadButtonText}>
                  {isUploading ? 'Uploading...' : '+ Add File'}
                </ThemedText>
              </TouchableOpacity>

              {attachments.length > 0 && (
                <FlatList
                  data={attachments}
                  renderItem={renderAttachment}
                  keyExtractor={(item) => item.id}
                  style={styles.attachmentsList}
                  scrollEnabled={false}
                />
              )}
            </View>

            {/* Only show Assigned to field for admins */}
            {isAdmin && (
              <View style={{ zIndex: 4000, marginTop: 20 }}>
                <ThemedText style={styles.label}>Assigned to</ThemedText>
                <DropDownPicker
                  open={openTechnician}
                  value={requestDetails.technician}
                  items={technicianOptions}
                  setOpen={setOpenTechnician}
                  setValue={(callback) => {
                    const value = typeof callback === "function" ? callback(requestDetails.technician) : callback;
                    setRequestDetails((prev) => ({ ...prev, technician: value }));
                  }}
                  placeholder="Select technician"
                  zIndex={4000}
                  listMode="MODAL"
                  disabled={!isEditMode}
                  style={[
                    { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border },
                    !isEditMode && { backgroundColor: Colors[colorScheme].backgroundTint, opacity: 0.7 }
                  ]}
                  textStyle={{ color: Colors[colorScheme].text }}
                  placeholderStyle={{ color: Colors[colorScheme].placeholder }}
                />
                {!isEditMode && (
                  <ThemedText style={styles.infoText}>Only available when editing requests</ThemedText>
                )}
              </View>
            )}

            {/* Only show Status field for admins */}
            {isAdmin && (
              <View style={{ zIndex: 3000, marginTop: 10 }}>
                <ThemedText style={styles.label}>Status</ThemedText>
                <DropDownPicker
                  open={openStatus}
                  value={requestDetails.status}
                  items={statusOptions}
                  setOpen={setOpenStatus}
                  setValue={(callback) => {
                    const value = typeof callback === "function" ? callback(requestDetails.status) : callback;
                    setRequestDetails((prev) => ({ ...prev, status: value }));
                  }}
                  placeholder="Select status"
                  zIndex={3000}
                  listMode="MODAL"
                  disabled={!isEditMode}
                  style={[
                    { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border },
                    !isEditMode && { backgroundColor: Colors[colorScheme].backgroundTint, opacity: 0.7 }
                  ]}
                  textStyle={{ color: Colors[colorScheme].text }}
                  placeholderStyle={{ color: Colors[colorScheme].placeholder }}
                />
                {!isEditMode && (
                  <ThemedText style={styles.infoText}>Only available when editing requests</ThemedText>
                )}
              </View>
            )}

            <View style={{ zIndex: 2000, marginTop: 10 }}>
              <ThemedText style={styles.label}>Priority</ThemedText>
              <DropDownPicker
                open={openPriority}
                value={requestDetails.priority}
                items={priorityOptions}
                setOpen={setOpenPriority}
                setValue={(callback) => {
                  const value = typeof callback === "function" ? callback(requestDetails.priority) : callback;
                  setRequestDetails((prev) => ({ ...prev, priority: value }));
                }}
                placeholder="Select priority"
                zIndex={2000}
                listMode="MODAL"
                disabled={isAdmin ? !isEditMode : false}
                style={[
                  { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border },
                  isAdmin && !isEditMode && { backgroundColor: Colors[colorScheme].backgroundTint, opacity: 0.7 }
                ]}
                textStyle={{ color: Colors[colorScheme].text }}
                placeholderStyle={{ color: Colors[colorScheme].placeholder }}
              />
              {isAdmin && !isEditMode && (
                <ThemedText style={styles.infoText}>Only available when editing requests</ThemedText>
              )}
            </View>
            
            <View style={{ zIndex: 1000, marginTop: 10 }}>
              <ThemedText style={styles.label}>Site</ThemedText>
              <DropDownPicker
                open={openSite}
                value={requestDetails.site}
                items={siteOptions}
                setOpen={setOpenSite}
                setValue={(callback) => {
                  const value = typeof callback === "function" ? callback(requestDetails.site) : callback;
                  setRequestDetails((prev) => ({ ...prev, site: value }));
                }}
                placeholder="Select site"
                zIndex={1000}
                listMode="MODAL"
                style={{ backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }}
                textStyle={{ color: Colors[colorScheme].text }}
                placeholderStyle={{ color: Colors[colorScheme].placeholder }}
              />
            </View>

            {(isAdmin && isEditMode) || !isEditMode ? (
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: Colors[colorScheme].primary },
                  isSubmitting && { backgroundColor: Colors[colorScheme].backgroundTint, opacity: 0.7 }
                ]}
                onPress={handleSaveChanges}
                disabled={isSubmitting}
              >
                <ThemedText style={styles.saveButtonText}>
                  {isSubmitting ? "Submitting..." : isEditMode ? "Update Request" : "Submit Request"}
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={[styles.viewOnlyNotice, { backgroundColor: Colors[colorScheme].backgroundTint }]}>
                <ThemedText style={styles.viewOnlyText}>
                  Only admins can edit requests.
                </ThemedText>
              </View>
            )}
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
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingBottom: 20
  },
  content: {
    padding: 15,
  },
  formField: {
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    minHeight: 45,
  },
  descriptionInput: {
    minHeight: 100,
    maxHeight: 200,
    textAlignVertical: "top"
  },
  attachmentsSection: {
    marginTop: 20,
  },
  uploadButton: {
    borderWidth: 1,
    borderRadius: 5,
    borderStyle: 'dashed',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  attachmentsList: {
    maxHeight: 200,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  attachmentSize: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    paddingVertical: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: "center"
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderRadius: 5,
    marginTop: -5,
    width: '100%',
    position: 'absolute',
    top: 45,
    left: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
  },
  infoText: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 5,
    opacity: 0.7
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  viewOnlyNotice: {
    padding: 15,
    borderRadius: 5,
    marginTop: 20
  },
  viewOnlyText: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8
  }
});