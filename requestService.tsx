import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  addDoc,
  getDoc,
  DocumentData,
  Timestamp,
  FieldValue,
} from 'firebase/firestore';
import { db } from './lib/config/firebase';
import { deleteFromCloudinary } from './cloudinaryService';

const COLLECTION_NAME = 'requests';

export interface AttachmentData {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  uploadedAt: Date;
}

export interface RequestData {
  id?: string;
  requester?: string;
  description?: string;
  technician?: string;
  status?: string;
  priority?: string;
  site?: string;
  title?: string;
  name?: string;
  requesterUID?: string;
  requesterEmail?: string;
  attachments?: AttachmentData[];
  createdAt?: Date | Timestamp | FieldValue;
  updatedAt?: Date | Timestamp | FieldValue;
  updatedBy?: string;
  date?: Date | Timestamp | FieldValue;
}

/**
 * Create a new request
 * 
 * @param {RequestData} requestData - The request data
 * @returns {Promise<string>} - The ID of the created request
 */
export const createRequest = async (requestData: RequestData): Promise<string> => {
  try {
    if (!requestData.requester || !requestData.description) {
      throw new Error('Requester and description are required fields');
    }
    
    const requestRef = doc(collection(db, COLLECTION_NAME));
    const requestId = requestRef.id;
    
    const fullRequestData: any = {
      id: requestId,
      requester: requestData.requester,
      description: requestData.description,
      technician: requestData.technician || '',
      status: requestData.status || 'Open',
      priority: requestData.priority || 'Low [ ** User only **]',
      site: requestData.site || '',
      title: requestData.title || '',
      name: requestData.name || '',
      requesterUID: requestData.requesterUID || '',
      requesterEmail: requestData.requesterEmail || '',
      attachments: requestData.attachments || [],
      date: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(requestRef, fullRequestData);
    
    return requestId;
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
};

/**
 * Get a single request by ID
 * 
 * @param {string} requestId - The ID of the request to retrieve
 * @returns {Promise<RequestData|null>} - The request data or null if not found
 */
export const getRequestById = async (requestId: string): Promise<RequestData | null> => {
  try {
    const requestRef = doc(db, COLLECTION_NAME, requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (requestSnap.exists()) {
      const data = requestSnap.data();
      return { 
        id: requestSnap.id, 
        requester: data.requester,
        description: data.description,
        technician: data.technician,
        status: data.status,
        priority: data.priority,
        site: data.site,
        title: data.title,
        name: data.name,
        requesterUID: data.requesterUID,
        requesterEmail: data.requesterEmail,
        attachments: data.attachments || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
        date: data.date,
      } as RequestData;
    } else {
      console.log('No such request document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting request by ID:', error);
    throw error;
  }
};

/**
 * Update an existing request
 * 
 * @param {string} requestId - The ID of the request to update
 * @param {RequestData} requestData - The request data to update
 * @returns {Promise<void>}
 */
export const updateRequest = async (requestId: string, requestData: RequestData): Promise<void> => {
  try {
    const requestRef = doc(db, COLLECTION_NAME, requestId);
    
    const updatedData: any = {
      updatedAt: serverTimestamp(),
    };
    
    // Only update allowed fields
    if (requestData.technician !== undefined) {
      updatedData.technician = requestData.technician;
    }
    if (requestData.status !== undefined) {
      updatedData.status = requestData.status;
    }
    if (requestData.priority !== undefined) {
      updatedData.priority = requestData.priority;
    }
    if (requestData.site !== undefined) {
      updatedData.site = requestData.site;
    }
    if (requestData.attachments !== undefined) {
      updatedData.attachments = requestData.attachments;
    }
    if (requestData.updatedBy !== undefined) {
      updatedData.updatedBy = requestData.updatedBy;
    }
    
    console.log('Updating request with data:', updatedData);
    await setDoc(requestRef, updatedData, { merge: true });
  } catch (error) {
    console.error('Error updating request:', error, { requestId, requestData });
    throw error;
  }
};

/**
 * Delete a request and its attachments
 * 
 * @param {string} requestId - The ID of the request to delete
 * @returns {Promise<void>}
 */
export const deleteRequest = async (requestId: string): Promise<void> => {
  try {
    // First get the request to access attachments
    const requestData = await getRequestById(requestId);
    
    if (requestData?.attachments && requestData.attachments.length > 0) {
      // Delete all attachments from Cloudinary
      const deletePromises = requestData.attachments.map(attachment => 
        deleteFromCloudinary(attachment.cloudinaryPublicId)
      );
      
      await Promise.all(deletePromises);
    }
    
    // Delete the request document
    const requestRef = doc(db, COLLECTION_NAME, requestId);
    await deleteDoc(requestRef);
  } catch (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
};

/**
 * Get all requests with real-time updates
 * 
 * @param {Function} onSuccess - Callback function for successful data retrieval
 * @param {Function} onError - Callback function for errors
 * @returns {Function} - Unsubscribe function to stop listening for updates
 */
export const getAllRequests = (
  onSuccess: (requests: RequestData[]) => void,
  onError: (error: any) => void
): Function => {
  try {
    const requestsRef = collection(db, COLLECTION_NAME);
    const q = query(requestsRef, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const requests = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            requester: data.requester,
            description: data.description,
            technician: data.technician,
            status: data.status,
            priority: data.priority,
            site: data.site,
            title: data.title,
            name: data.name,
            requesterUID: data.requesterUID,
            requesterEmail: data.requesterEmail,
            attachments: data.attachments || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy,
            date: data.date,
          } as RequestData;
        });
        onSuccess(requests);
      },
      (error) => {
        console.error('Error getting requests:', error);
        onError(error);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up request listener:', error);
    onError(error);
    return () => {};
  }
};

/**
 * Get filtered requests
 * 
 * @param {Object} filters - Filters to apply
 * @param {Function} onSuccess - Callback function for successful data retrieval
 * @param {Function} onError - Callback function for errors
 * @returns {Function} - Unsubscribe function to stop listening for updates
 */
export const getFilteredRequests = (
  filters: { status?: string; priority?: string; technician?: string; },
  onSuccess: (requests: RequestData[]) => void,
  onError: (error: any) => void
): Function => {
  try {
    const requestsRef = collection(db, COLLECTION_NAME);
    
    const queryConstraints = [];
    
    if (filters.status) {
      queryConstraints.push(where('status', '==', filters.status));
    }
    
    if (filters.priority) {
      queryConstraints.push(where('priority', '==', filters.priority));
    }
    
    if (filters.technician) {
      queryConstraints.push(where('technician', '==', filters.technician));
    }
    
    queryConstraints.push(orderBy('date', 'desc'));
    
    const q = query(requestsRef, ...queryConstraints);
    
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const requests = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            requester: data.requester,
            description: data.description,
            technician: data.technician,
            status: data.status,
            priority: data.priority,
            site: data.site,
            title: data.title,
            name: data.name,
            requesterUID: data.requesterUID,
            requesterEmail: data.requesterEmail,
            attachments: data.attachments || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy,
            date: data.date,
          } as RequestData;
        });
        onSuccess(requests);
      },
      (error) => {
        console.error('Error getting filtered requests:', error);
        onError(error);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up filtered request listener:', error);
    onError(error);
    return () => {};
  }
};

/**
 * Get requests by user with real-time updates
 * 
 * @param {string} userUID - The UID of the user
 * @param {Function} onSuccess - Callback function for successful data retrieval
 * @param {Function} onError - Callback function for errors
 * @returns {Function} - Unsubscribe function to stop listening for updates
 */
export const getRequestsByUser = (
  userUID: string,
  onSuccess: (requests: RequestData[]) => void,
  onError: (error: any) => void
): Function => {
  try {
    const requestsRef = collection(db, COLLECTION_NAME);
    const q = query(
      requestsRef, 
      where('requesterUID', '==', userUID),
      orderBy('date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const requests = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            requester: data.requester,
            description: data.description,
            technician: data.technician,
            status: data.status,
            priority: data.priority,
            site: data.site,
            title: data.title,
            name: data.name,
            requesterUID: data.requesterUID,
            requesterEmail: data.requesterEmail,
            attachments: data.attachments || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy,
            date: data.date,
          } as RequestData;
        });
        onSuccess(requests);
      },
      (error) => {
        console.error('Error getting user requests:', error);
        onError(error);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up user request listener:', error);
    onError(error);
    return () => {};
  }
};