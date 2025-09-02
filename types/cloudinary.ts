// Cloudinary type definitions

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  duration?: number;
  thumbnail_url?: string;
  eager?: CloudinaryTransformation[];
  original_filename?: string;
  api_key?: string;
}

export interface CloudinaryTransformation {
  transformation: string;
  width: number;
  height: number;
  bytes: number;
  url: string;
  secure_url: string;
}

export interface CloudinaryError {
  code: number;
  message: string;
  details?: any;
}

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  upload_url?: string;
}

export interface CloudinaryAsset {
  public_id: string;
  folder: string;
  filename: string;
  format: string;
  version: number;
  resource_type: 'image' | 'video' | 'raw';
  type: string;
  created_at: string;
  uploaded_at: string;
  bytes: number;
  backup_bytes: number;
  width?: number;
  height?: number;
  aspect_ratio?: number;
  pixels?: number;
  url: string;
  secure_url: string;
  status: string;
  access_mode: string;
  access_control?: any[];
  etag: string;
  metadata?: Record<string, any>;
  context?: Record<string, string>;
  colors?: string[][];
  predominant?: {
    google: string[][];
  };
  duration?: number;
  bit_rate?: number;
  video?: {
    codec: string;
    bit_rate: number;
    dar: string;
    fps: number;
  };
  audio?: {
    codec: string;
    bit_rate: number;
    frequency: number;
    channels: number;
    channel_layout: string;
  };
}

export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  type?: 'upload' | 'private' | 'authenticated';
  access_mode?: 'public' | 'authenticated';
  use_filename?: boolean;
  unique_filename?: boolean;
  overwrite?: boolean;
  tags?: string | string[];
  context?: string | Record<string, string>;
  metadata?: Record<string, any>;
  transformation?: any;
  format?: string;
  allowed_formats?: string[];
  eager?: any[];
  eager_async?: boolean;
  eager_notification_url?: string;
  categorization?: string;
  auto_tagging?: number;
  detection?: string;
  ocr?: string;
  upload_preset?: string;
  unsigned?: boolean;
  discard_original_filename?: boolean;
  invalidate?: boolean;
  notification_url?: string;
  proxy?: string;
  backup?: boolean;
  return_delete_token?: boolean;
  faces?: boolean;
  quality_analysis?: boolean;
  accessibility_analysis?: boolean;
  cinemagraph_analysis?: boolean;
  phash?: boolean;
  responsive_breakpoints?: any;
  timestamp?: number;
  signature?: string;
  api_key?: string;
}

export interface CloudinaryWidgetOptions {
  cloudName: string;
  uploadPreset?: string;
  folder?: string;
  sources?: string[];
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  maxImageFileSize?: number;
  maxVideoFileSize?: number;
  maxRawFileSize?: number;
  clientAllowedFormats?: string[];
  resourceType?: 'auto' | 'image' | 'video' | 'raw';
  cropping?: boolean;
  croppingAspectRatio?: number;
  croppingDefaultSelectionRatio?: number;
  croppingShowDimensions?: boolean;
  croppingCoordinatesMode?: 'custom' | 'face';
  croppingShowBackButton?: boolean;
  showSkipCropButton?: boolean;
  showPoweredBy?: boolean;
  showAdvancedOptions?: boolean;
  showCompletedButton?: boolean;
  showUploadMoreButton?: boolean;
  singleUploadAutoClose?: boolean;
  defaultSource?: string;
  styles?: {
    palette?: {
      window?: string;
      windowBorder?: string;
      tabIcon?: string;
      menuIcons?: string;
      textDark?: string;
      textLight?: string;
      link?: string;
      action?: string;
      inactiveTabIcon?: string;
      error?: string;
      inProgress?: string;
      complete?: string;
      sourceBg?: string;
    };
    fonts?: {
      default?: string;
      primary?: string;
    };
  };
  text?: {
    [locale: string]: {
      or?: string;
      back?: string;
      advanced?: string;
      close?: string;
      no_results?: string;
      search_placeholder?: string;
      about_uw?: string;
      menu?: Record<string, string>;
      local?: Record<string, string>;
      camera?: Record<string, string>;
      queue?: Record<string, string>;
    };
  };
}

export interface CloudinaryWidgetResult {
  event: 'success' | 'upload-added' | 'close' | 'error';
  info?: CloudinaryAsset | CloudinaryAsset[];
  error?: CloudinaryError;
}

export interface CloudinaryMediaLibraryOptions {
  cloud_name: string;
  api_key: string;
  username?: string;
  timestamp?: number;
  signature?: string;
  button_class?: string;
  button_caption?: string;
  insert_transformation?: boolean;
  default_transformations?: any[][];
  max_files?: number;
  multiple?: boolean;
  z_index?: number;
  inline_container?: string | HTMLElement;
  config?: any;
}

export interface MediaUploadOptions {
  memorialId: string;
  userId: string;
  mediaType: 'photo' | 'video';
  maxFiles?: number;
  folder?: string;
  transformations?: any;
  onProgress?: (progress: number) => void;
  onComplete?: (result: CloudinaryUploadResult) => void;
  onError?: (error: CloudinaryError) => void;
}