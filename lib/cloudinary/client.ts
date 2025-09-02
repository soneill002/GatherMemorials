import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryUploadResult, CloudinaryError } from '@/types/cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export default cloudinary;

// Check if Cloudinary is properly configured
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Upload presets for different types of media
export const UPLOAD_PRESETS = {
  memorial_photos: 'memorial_photos',
  memorial_videos: 'memorial_videos',
  profile_photos: 'profile_photos',
  cover_photos: 'cover_photos'
};

// Transformation presets for different display contexts
export const TRANSFORMATIONS = {
  thumbnail: {
    width: 150,
    height: 150,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto:good',
    fetch_format: 'auto'
  },
  gallery: {
    width: 800,
    height: 600,
    crop: 'limit',
    quality: 'auto:good',
    fetch_format: 'auto'
  },
  hero: {
    width: 1920,
    height: 600,
    crop: 'fill',
    gravity: 'center',
    quality: 'auto:best',
    fetch_format: 'auto',
    effect: 'improve'
  },
  profile: {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto:best',
    fetch_format: 'auto',
    radius: 'max'
  }
};

// File validation rules
export const FILE_RULES = {
  photo: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'],
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic']
  },
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedFormats: ['mp4', 'mov', 'avi', 'wmv', 'webm'],
    allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm']
  }
};

// Generate upload signature for client-side uploads
export async function generateUploadSignature(
  folder: string,
  transformation?: any
): Promise<{
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
}> {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const params: Record<string, any> = {
    timestamp,
    folder,
    upload_preset: UPLOAD_PRESETS.memorial_photos
  };

  if (transformation) {
    params.transformation = transformation;
  }

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!
  };
}

// Delete an asset from Cloudinary
export async function deleteAsset(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting asset:', error);
    return false;
  }
}

// Delete multiple assets
export async function deleteAssets(publicIds: string[]): Promise<{
  success: string[];
  failed: string[];
}> {
  const results = await Promise.allSettled(
    publicIds.map(id => deleteAsset(id))
  );

  const success: string[] = [];
  const failed: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      success.push(publicIds[index]);
    } else {
      failed.push(publicIds[index]);
    }
  });

  return { success, failed };
}

// Generate optimized URL for an asset
export function getOptimizedUrl(
  publicId: string,
  transformation: keyof typeof TRANSFORMATIONS
): string {
  return cloudinary.url(publicId, {
    transformation: TRANSFORMATIONS[transformation],
    secure: true
  });
}

// Validate file before upload
export function validateFile(
  file: File,
  type: 'photo' | 'video'
): { valid: boolean; error?: string } {
  const rules = FILE_RULES[type];

  // Check file size
  if (file.size > rules.maxSize) {
    const maxSizeMB = rules.maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    };
  }

  // Check file type
  if (!rules.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${rules.allowedFormats.join(', ')}`
    };
  }

  return { valid: true };
}

// Extract metadata from Cloudinary response
export function extractMetadata(result: any): {
  width: number;
  height: number;
  format: string;
  size: number;
  duration?: number;
} {
  return {
    width: result.width,
    height: result.height,
    format: result.format,
    size: result.bytes,
    duration: result.duration
  };
}

// Generate thumbnail URL for video
export function getVideoThumbnail(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    transformation: [
      { width: 400, height: 300, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' },
      { page: 1 } // First frame
    ],
    format: 'jpg',
    secure: true
  });
}

// Batch upload multiple files
export async function batchUpload(
  files: File[],
  folder: string,
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = [];
  const totalFiles = files.length;
  let completed = 0;

  for (const file of files) {
    try {
      // This would be replaced with actual upload logic
      // For now, returning mock result
      const result = await uploadFile(file, folder);
      results.push(result);
      
      completed++;
      if (onProgress) {
        onProgress((completed / totalFiles) * 100);
      }
    } catch (error) {
      console.error('Error uploading file:', file.name, error);
      // Continue with other files
    }
  }

  return results;
}

// Mock upload function (to be replaced with actual implementation)
async function uploadFile(file: File, folder: string): Promise<CloudinaryUploadResult> {
  // This is a placeholder - actual implementation would upload to Cloudinary
  return {
    public_id: `${folder}/${Date.now()}_${file.name}`,
    secure_url: URL.createObjectURL(file),
    resource_type: file.type.startsWith('video/') ? 'video' : 'image',
    format: file.name.split('.').pop() || 'unknown',
    width: 800,
    height: 600,
    bytes: file.size,
    created_at: new Date().toISOString()
  };
}

// Error handler for Cloudinary operations
export function handleCloudinaryError(error: any): CloudinaryError {
  if (error.http_code) {
    return {
      code: error.http_code,
      message: error.message || 'Cloudinary error occurred',
      details: error
    };
  }
  
  return {
    code: 500,
    message: 'Unknown error occurred during upload',
    details: error
  };
}