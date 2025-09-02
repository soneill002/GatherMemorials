import cloudinary from './client';
import { CloudinaryUploadResult } from '@/types/cloudinary';

// Server-side upload function
export async function uploadToCloudinary(
  filePath: string,
  options: {
    folder: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    transformation?: any;
    tags?: string[];
    context?: Record<string, string>;
  }
): Promise<CloudinaryUploadResult> {
  try {
    const uploadOptions: any = {
      folder: options.folder,
      resource_type: options.resource_type || 'auto',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      tags: options.tags || [],
      context: options.context || {}
    };

    if (options.public_id) {
      uploadOptions.public_id = options.public_id;
    }

    if (options.transformation) {
      uploadOptions.transformation = options.transformation;
    }

    // Add memorial-specific metadata
    uploadOptions.context = {
      ...uploadOptions.context,
      uploaded_at: new Date().toISOString(),
      platform: 'gathermemorials'
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      resource_type: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      created_at: result.created_at,
      duration: result.duration,
      thumbnail_url: result.resource_type === 'video' 
        ? result.secure_url.replace(/\.[^/.]+$/, '.jpg')
        : undefined
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

// Upload from buffer (for API routes)
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: {
    folder: string;
    filename: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
  }
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resource_type || 'auto',
        public_id: `${Date.now()}_${options.filename}`,
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            resource_type: result.resource_type,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            created_at: result.created_at,
            duration: result.duration
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
}

// Upload from URL (for importing external images)
export async function uploadFromUrl(
  url: string,
  folder: string,
  filename?: string
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder,
      public_id: filename ? `${Date.now()}_${filename}` : undefined,
      resource_type: 'auto',
      use_filename: !filename,
      unique_filename: true
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      resource_type: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('Error uploading from URL:', error);
    throw new Error('Failed to upload image from URL');
  }
}

// Create upload widget configuration
export function createUploadWidgetConfig(
  folder: string,
  maxFiles: number = 10
) {
  return {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset: 'memorial_photos',
    folder,
    sources: ['local', 'camera', 'google_drive', 'dropbox', 'facebook', 'instagram'],
    multiple: maxFiles > 1,
    maxFiles,
    maxFileSize: 10485760, // 10MB
    maxImageFileSize: 10485760,
    maxVideoFileSize: 104857600, // 100MB
    maxRawFileSize: 10485760,
    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov'],
    resourceType: 'auto',
    cropping: false,
    showPoweredBy: false,
    showAdvancedOptions: false,
    showCompletedButton: true,
    showUploadMoreButton: true,
    styles: {
      palette: {
        window: '#FFFFFF',
        windowBorder: '#90A0B3',
        tabIcon: '#003087', // Marian Blue
        menuIcons: '#5A616A',
        textDark: '#000000',
        textLight: '#FFFFFF',
        link: '#003087',
        action: '#FFD700', // Liturgical Gold
        inactiveTabIcon: '#90A0B3',
        error: '#F44235',
        inProgress: '#003087',
        complete: '#20B832',
        sourceBg: '#FAFAFA'
      },
      fonts: {
        default: 'Lato, sans-serif',
        primary: 'Lato, sans-serif'
      }
    },
    text: {
      en: {
        or: 'Or',
        back: 'Back',
        advanced: 'Advanced',
        close: 'Close',
        no_results: 'No results',
        search_placeholder: 'Search files',
        about_uw: 'About Upload Widget',
        menu: {
          files: 'My Files',
          web: 'Web Address',
          camera: 'Camera',
          gsearch: 'Image Search',
          gdrive: 'Google Drive',
          dropbox: 'Dropbox',
          facebook: 'Facebook',
          instagram: 'Instagram'
        },
        local: {
          browse: 'Browse',
          dd_title_single: 'Drag and drop a photo or video here',
          dd_title_multi: 'Drag and drop photos or videos here',
          drop_title_single: 'Drop file to upload',
          drop_title_multiple: 'Drop files to upload'
        },
        camera: {
          capture: 'Capture',
          cancel: 'Cancel',
          take_pic: 'Take a picture or video and upload it',
          explanation: 'Make sure your camera is connected and your browser allows camera access.',
          camera_error: 'Failed to access camera',
          retry: 'Retry camera',
          file_name: 'Camera_{{time}}'
        },
        queue: {
          title: 'Upload queue',
          title_uploading_with_counter: 'Uploading {{num}} files',
          title_processing_with_counter: 'Processing {{num}} files',
          abort_all: 'Abort all',
          retry_failed: 'Retry failed',
          done: 'Done',
          mini_title: '{{num}} uploaded',
          mini_title_uploading: 'Uploading',
          mini_title_processing: 'Processing',
          show_completed: 'Show completed',
          hide_completed: 'Hide completed'
        }
      }
    }
  };
}