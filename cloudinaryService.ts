import * as Crypto from 'expo-crypto';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET;

interface CloudinaryResponse {
  success: boolean;
  url?: string;
  public_id?: string;
  error?: string;
}

export const uploadToCloudinary = async (file: any): Promise<CloudinaryResponse> => {
  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary configuration is missing');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.mimeType || 'application/octet-stream',
      name: file.name || 'file',
    } as any);
    
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
    
    // Add folder organization based on file type
    if (file.mimeType?.startsWith('image/')) {
      formData.append('folder', 'requests/images');
    } else if (file.mimeType === 'application/pdf') {
      formData.append('folder', 'requests/documents');
    } else {
      formData.append('folder', 'requests/others');
    }

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = await response.json();

    if (response.ok && data.secure_url) {
      return {
        success: true,
        url: data.secure_url,
        public_id: data.public_id,
      };
    } else {
      return {
        success: false,
        error: data.error?.message || 'Upload failed',
      };
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary configuration is missing');
    }

    // Generate timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Create signature for authenticated request using expo-crypto
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA1,
      signatureString,
      { encoding: Crypto.CryptoEncoding.HEX }
    );

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    return data.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

export const getCloudinaryUrl = (publicId: string, transformation?: string): string => {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary cloud name is missing');
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}`;
  
  if (transformation) {
    return `${baseUrl}/image/upload/${transformation}/${publicId}`;
  }
  
  return `${baseUrl}/image/upload/${publicId}`;
};

export const generateThumbnail = (publicId: string): string => {
  return getCloudinaryUrl(publicId, 'w_150,h_150,c_fill');
};

export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

export const isPdfFile = (mimeType: string): boolean => {
  return mimeType === 'application/pdf';
};

export const getFileIcon = (mimeType: string): string => {
  if (isImageFile(mimeType)) {
    return '🖼️';
  } else if (isPdfFile(mimeType)) {
    return '📄';
  } else if (mimeType.includes('word')) {
    return '📝';
  } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return '📊';
  } else if (mimeType.includes('text')) {
    return '📄';
  } else {
    return '📁';
  }
};