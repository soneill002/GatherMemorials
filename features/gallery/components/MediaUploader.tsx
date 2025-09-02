'use client';

import { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Trash2,
  Eye,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { validateFile } from '@/lib/cloudinary/client';
import clsx from 'clsx';

interface MediaUploaderProps {
  memorialId: string;
  existingMedia?: MediaItem[];
  maxFiles?: number;
  onUploadComplete?: (media: MediaItem[]) => void;
  onDelete?: (mediaId: string) => void;
}

interface MediaItem {
  id: string;
  url: string;
  thumbnail_url?: string;
  media_type: 'photo' | 'video';
  caption?: string;
  is_primary?: boolean;
  public_id: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
    duration?: number;
  };
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  result?: MediaItem;
}

export function MediaUploader({
  memorialId,
  existingMedia = [],
  maxFiles = 50,
  onUploadComplete,
  onDelete
}: MediaUploaderProps) {
  const [media, setMedia] = useState<MediaItem[]>(existingMedia);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const remainingSlots = maxFiles - media.length - uploads.length;

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Check max files limit
    if (fileArray.length > remainingSlots) {
      showToast(`You can only upload ${remainingSlots} more files`, 'warning');
      return;
    }

    // Validate and prepare uploads
    const newUploads: UploadProgress[] = [];
    
    for (const file of fileArray) {
      const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';
      const validation = validateFile(file, mediaType);
      
      if (!validation.valid) {
        showToast(`${file.name}: ${validation.error}`, 'error');
        continue;
      }

      newUploads.push({
        file,
        progress: 0,
        status: 'pending'
      });
    }

    if (newUploads.length > 0) {
      setUploads(prev => [...prev, ...newUploads]);
      uploadFiles(newUploads);
    }
  }, [remainingSlots]);

  // Upload files to Cloudinary
  const uploadFiles = async (uploadItems: UploadProgress[]) => {
    for (let i = 0; i < uploadItems.length; i++) {
      const item = uploadItems[i];
      
      try {
        // Update status to uploading
        setUploads(prev => prev.map(u => 
          u.file === item.file 
            ? { ...u, status: 'uploading', progress: 10 }
            : u
        ));

        // Get upload signature
        const signatureResponse = await fetch('/api/uploads/cloudinary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folder: item.file.type.startsWith('video/') ? 'videos' : 'photos',
            memorial_id: memorialId
          })
        });

        if (!signatureResponse.ok) {
          throw new Error('Failed to get upload signature');
        }

        const signatureData = await signatureResponse.json();

        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('api_key', signatureData.apiKey);
        formData.append('timestamp', signatureData.timestamp.toString());
        formData.append('signature', signatureData.signature);
        formData.append('folder', `memorials/${memorialId}/${item.file.type.startsWith('video/') ? 'videos' : 'photos'}`);

        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 90) + 10;
            setUploads(prev => prev.map(u => 
              u.file === item.file 
                ? { ...u, progress }
                : u
            ));
          }
        };

        // Handle completion
        xhr.onload = async () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            
            // Save to database
            const saveResponse = await fetch('/api/media', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                memorial_id: memorialId,
                media_type: item.file.type.startsWith('video/') ? 'video' : 'photo',
                url: result.secure_url,
                public_id: result.public_id,
                thumbnail_url: result.thumbnail_url || result.secure_url,
                metadata: {
                  width: result.width,
                  height: result.height,
                  format: result.format,
                  size: result.bytes,
                  duration: result.duration
                }
              })
            });

            if (saveResponse.ok) {
              const mediaData = await saveResponse.json();
              
              // Update state
              setUploads(prev => prev.map(u => 
                u.file === item.file 
                  ? { ...u, status: 'complete', progress: 100, result: mediaData }
                  : u
              ));
              
              setMedia(prev => [...prev, mediaData]);
              showToast('File uploaded successfully', 'success');
            } else {
              throw new Error('Failed to save media record');
            }
          } else {
            throw new Error('Upload failed');
          }
        };

        // Handle errors
        xhr.onerror = () => {
          setUploads(prev => prev.map(u => 
            u.file === item.file 
              ? { ...u, status: 'error', error: 'Upload failed' }
              : u
          ));
          showToast(`Failed to upload ${item.file.name}`, 'error');
        };

        // Send request
        xhr.open('POST', signatureData.upload_url);
        xhr.send(formData);

      } catch (error) {
        console.error('Upload error:', error);
        setUploads(prev => prev.map(u => 
          u.file === item.file 
            ? { ...u, status: 'error', error: 'Upload failed' }
            : u
        ));
        showToast(`Failed to upload ${item.file.name}`, 'error');
      }
    }
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Delete media
  const handleDelete = async (mediaId: string) => {
    setIsDeleting(mediaId);
    
    try {
      const response = await fetch(`/api/uploads/cloudinary?media_id=${mediaId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMedia(prev => prev.filter(m => m.id !== mediaId));
        if (onDelete) onDelete(mediaId);
        showToast('Media deleted successfully', 'success');
      } else {
        throw new Error('Failed to delete media');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete media', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  // Update caption
  const handleUpdateCaption = async (mediaId: string, caption: string) => {
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption })
      });

      if (response.ok) {
        setMedia(prev => prev.map(m => 
          m.id === mediaId ? { ...m, caption } : m
        ));
        showToast('Caption updated', 'success');
      }
    } catch (error) {
      console.error('Caption update error:', error);
      showToast('Failed to update caption', 'error');
    } finally {
      setEditingCaption(null);
    }
  };

  // Set primary photo
  const handleSetPrimary = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/media/${mediaId}/primary`, {
        method: 'PUT'
      });

      if (response.ok) {
        setMedia(prev => prev.map(m => ({
          ...m,
          is_primary: m.id === mediaId
        })));
        showToast('Primary photo updated', 'success');
      }
    } catch (error) {
      console.error('Set primary error:', error);
      showToast('Failed to set primary photo', 'error');
    }
  };

  // Clear completed uploads
  const clearCompleted = () => {
    setUploads(prev => prev.filter(u => u.status !== 'complete'));
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card
        className={clsx(
          'border-2 border-dashed transition-colors',
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
          remainingSlots === 0 && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          
          <p className="text-lg font-medium text-gray-900 mb-2">
            {remainingSlots > 0 
              ? 'Drop photos or videos here'
              : 'Maximum files reached'
            }
          </p>
          
          <p className="text-sm text-gray-500 mb-4">
            {remainingSlots > 0 && `or click to browse (${remainingSlots} slots remaining)`}
          </p>
          
          {remainingSlots > 0 && (
            <>
              <Button
                type="button"
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Files
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                className="hidden"
              />
            </>
          )}
          
          <div className="mt-4 text-xs text-gray-400">
            Photos: max 10MB (JPG, PNG, GIF, WebP) • Videos: max 100MB (MP4, MOV, WebM)
          </div>
        </div>
      </Card>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Uploading {uploads.length} files</h3>
              {uploads.some(u => u.status === 'complete') && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearCompleted}
                >
                  Clear completed
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              {uploads.map((upload, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  {upload.file.type.startsWith('video/') ? (
                    <Video className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium truncate">
                        {upload.file.name}
                      </span>
                      {upload.status === 'complete' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {upload.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      {upload.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                    </div>
                    
                    {upload.status !== 'error' && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {upload.error && (
                      <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="relative group rounded-lg overflow-hidden bg-gray-100"
            >
              {/* Thumbnail */}
              {item.media_type === 'video' ? (
                <div className="relative aspect-square">
                  <img
                    src={item.thumbnail_url || item.url}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <Video className="absolute top-2 left-2 w-6 h-6 text-white drop-shadow" />
                </div>
              ) : (
                <img
                  src={item.thumbnail_url || item.url}
                  alt={item.caption || 'Memorial photo'}
                  className="w-full aspect-square object-cover"
                />
              )}
              
              {/* Primary badge */}
              {item.is_primary && (
                <div className="absolute top-2 right-2 bg-gold text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => setSelectedMedia(item)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition"
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                {item.media_type === 'photo' && !item.is_primary && (
                  <button
                    onClick={() => handleSetPrimary(item.id)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition"
                    title="Set as primary"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => setEditingCaption(item.id)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition"
                  title="Edit caption"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isDeleting === item.id}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition"
                  title="Delete"
                >
                  {isDeleting === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-600" />
                  )}
                </button>
              </div>
              
              {/* Caption */}
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs truncate">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedMedia && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMedia(null)}
          title={selectedMedia.caption || 'Media'}
          size="large"
        >
          {selectedMedia.media_type === 'video' ? (
            <video
              src={selectedMedia.url}
              controls
              className="w-full"
            />
          ) : (
            <img
              src={selectedMedia.url}
              alt={selectedMedia.caption || 'Memorial photo'}
              className="w-full"
            />
          )}
        </Modal>
      )}

      {/* Caption Edit Modal */}
      {editingCaption && (
        <Modal
          isOpen={true}
          onClose={() => setEditingCaption(null)}
          title="Edit Caption"
          size="small"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const caption = formData.get('caption') as string;
              handleUpdateCaption(editingCaption, caption);
            }}
            className="space-y-4"
          >
            <textarea
              name="caption"
              defaultValue={media.find(m => m.id === editingCaption)?.caption || ''}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Add a caption..."
            />
            
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditingCaption(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Caption
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}