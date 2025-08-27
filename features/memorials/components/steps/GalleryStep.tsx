'use client';

import { useState, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  X, 
  Plus,
  Edit2,
  GripVertical,
  Info,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Trash2
} from 'lucide-react';
import { Memorial, GalleryItem } from '@/types/memorial';
import clsx from 'clsx';

interface GalleryStepProps {
  data: Memorial;
  updateData: (updates: Partial<Memorial>) => void;
  onNext: () => void;
  onPrevious: () => void;
  errors?: Record<string, string>;
}

// File type configurations
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_GALLERY_ITEMS = 50;

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export function GalleryStep({
  data,
  updateData,
  onNext,
  onPrevious,
  errors = {}
}: GalleryStepProps) {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(data.gallery || []);
  const [skipGallery, setSkipGallery] = useState(galleryItems.length === 0);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [draggedOver, setDraggedOver] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // Process uploaded files
  const processFiles = async (files: File[]) => {
    const newItems: GalleryItem[] = [];
    let errorCount = 0;

    for (const file of files) {
      // Check if we've reached the limit
      if (galleryItems.length + newItems.length >= MAX_GALLERY_ITEMS) {
        showToast(`Maximum ${MAX_GALLERY_ITEMS} items allowed`, 'error');
        break;
      }

      // Validate file type
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
      
      if (!isImage && !isVideo) {
        errorCount++;
        continue;
      }

      // Validate file size
      const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
      if (file.size > maxSize) {
        showToast(`${file.name} exceeds ${isImage ? '10MB' : '100MB'} limit`, 'error');
        errorCount++;
        continue;
      }

      // Create gallery item
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const localUrl = URL.createObjectURL(file);
      
      const newItem: GalleryItem = {
        id,
        type: isImage ? 'image' : 'video',
        url: localUrl,
        caption: '',
        fileName: file.name,
        fileSize: file.size,
        file // Store file for later upload
      };

      // Simulate upload progress (replace with actual upload)
      setUploadProgress(prev => ({ ...prev, [id]: 0 }));
      
      // Mock upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(prev => ({ ...prev, [id]: progress }));
        
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[id];
              return newProgress;
            });
          }, 500);
        }
      }, 100);

      newItems.push(newItem);
    }

    if (errorCount > 0) {
      showToast(`${errorCount} file(s) were invalid and skipped`, 'warning');
    }

    if (newItems.length > 0) {
      const updatedGallery = [...galleryItems, ...newItems];
      setGalleryItems(updatedGallery);
      updateData({ gallery: updatedGallery });
      setSkipGallery(false);
      showToast(`Added ${newItems.length} item(s) to gallery`, 'success');
    }
  };

  // Handle file input change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove gallery item
  const removeItem = (id: string) => {
    const updatedGallery = galleryItems.filter(item => item.id !== id);
    setGalleryItems(updatedGallery);
    updateData({ gallery: updatedGallery });
    showToast('Item removed from gallery', 'success');
  };

  // Update item caption
  const updateCaption = (id: string, caption: string) => {
    const updatedGallery = galleryItems.map(item => 
      item.id === id ? { ...item, caption } : item
    );
    setGalleryItems(updatedGallery);
    updateData({ gallery: updatedGallery });
  };

  // Handle drag start for reordering
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  // Handle drag enter for reordering
  const handleDragEnter = (index: number) => {
    if (draggedItem === null) return;
    setDraggedOver(index);
  };

  // Handle drag end for reordering
  const handleDragEnd = () => {
    if (draggedItem === null || draggedOver === null) {
      setDraggedItem(null);
      setDraggedOver(null);
      return;
    }

    const reorderedItems = [...galleryItems];
    const draggedItemContent = reorderedItems[draggedItem];
    
    // Remove dragged item
    reorderedItems.splice(draggedItem, 1);
    
    // Insert at new position
    reorderedItems.splice(draggedOver, 0, draggedItemContent);
    
    setGalleryItems(reorderedItems);
    updateData({ gallery: reorderedItems });
    
    setDraggedItem(null);
    setDraggedOver(null);
    showToast('Gallery order updated', 'success');
  };

  // Handle skip toggle
  const handleSkipToggle = () => {
    const newSkipState = !skipGallery;
    setSkipGallery(newSkipState);
    if (newSkipState) {
      showToast('Gallery will be skipped', 'info');
    }
  };

  const handleNext = () => {
    if (skipGallery) {
      updateData({ gallery: [] });
    }
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Photo & Video Gallery
        </h2>
        <p className="text-gray-600">
          Add photos and videos to celebrate your loved one's life and memories.
        </p>
      </div>

      {/* Skip Option */}
      <Card className="bg-gray-50">
        <div className="p-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={skipGallery}
              onChange={handleSkipToggle}
              className="mt-1 w-4 h-4 text-marianBlue border-gray-300 rounded focus:ring-marianBlue"
            />
            <div className="ml-3">
              <span className="font-medium text-gray-900">
                Skip photo & video gallery
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Select this if you don't want to include a gallery on the memorial
              </p>
            </div>
          </label>
        </div>
      </Card>

      {!skipGallery && (
        <>
          {/* Upload Area */}
          <Card>
            <div
              className={clsx(
                "p-8 border-2 border-dashed rounded-lg transition-colors",
                isDragging 
                  ? "border-marianBlue bg-blue-50" 
                  : "border-gray-300 hover:border-gray-400"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isDragging ? 'Drop files here' : 'Drag & drop photos or videos'}
                </h3>
                
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse files
                </p>
                
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  icon={Plus}
                >
                  Select Files
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="mt-4 text-xs text-gray-500">
                  <p>Images: JPG, PNG, GIF, WebP (max 10MB)</p>
                  <p>Videos: MP4, MPEG, QuickTime, AVI (max 100MB)</p>
                  <p>Maximum {MAX_GALLERY_ITEMS} items total</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Gallery Items */}
          {galleryItems.length > 0 && (
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Gallery Items ({galleryItems.length}/{MAX_GALLERY_ITEMS})
                  </h3>
                  {galleryItems.length > 1 && (
                    <p className="text-sm text-gray-500">
                      Drag to reorder
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryItems.map((item, index) => {
                    const isUploading = uploadProgress[item.id] !== undefined;
                    const progress = uploadProgress[item.id] || 0;
                    
                    return (
                      <div
                        key={item.id}
                        draggable={!isUploading}
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        className={clsx(
                          "group relative rounded-lg overflow-hidden bg-gray-100 cursor-move",
                          draggedOver === index && "ring-2 ring-marianBlue"
                        )}
                      >
                        {/* Drag Handle */}
                        {!isUploading && (
                          <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-1 bg-white rounded shadow">
                              <GripVertical className="w-4 h-4 text-gray-600" />
                            </div>
                          </div>
                        )}

                        {/* Item Actions */}
                        {!isUploading && (
                          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewItem(item)}
                              className="p-1.5 bg-white rounded shadow hover:bg-gray-100"
                              aria-label="Preview"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="p-1.5 bg-white rounded shadow hover:bg-red-50"
                              aria-label="Remove"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        )}

                        {/* Thumbnail */}
                        <div className="aspect-square relative">
                          {item.type === 'image' ? (
                            <img
                              src={item.url}
                              alt={item.caption || 'Gallery image'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <Video className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Upload Progress */}
                          {isUploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <div className="text-white text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                <p className="text-sm">{progress}%</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Caption */}
                        <div className="p-2 bg-white">
                          {editingCaption === item.id ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={item.caption || ''}
                                onChange={(e) => updateCaption(item.id, e.target.value)}
                                onBlur={() => setEditingCaption(null)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    setEditingCaption(null);
                                  }
                                }}
                                placeholder="Add caption..."
                                className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-marianBlue"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingCaption(item.id)}
                              className="w-full text-left group/caption"
                            >
                              <p className="text-xs text-gray-700 truncate">
                                {item.caption || (
                                  <span className="text-gray-400 group-hover/caption:text-gray-600">
                                    Add caption...
                                  </span>
                                )}
                              </p>
                            </button>
                          )}
                          
                          <p className="text-xs text-gray-400 mt-1">
                            {item.type === 'image' ? 'Photo' : 'Video'} • {formatFileSize(item.fileSize || 0)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Gallery Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Info className="w-5 h-5 mr-2 text-liturgicalGold" />
                Gallery Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Choose meaningful photos that capture special moments and relationships</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Include photos from different life stages - childhood, milestones, recent times</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Add captions to provide context or share memories about each photo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Videos should be under 2 minutes for best viewing experience</span>
                </li>
                <li className="flex items-start">
                  <span className="text-marianBlue mr-2">•</span>
                  <span>Drag and drop to arrange photos in chronological or thematic order</span>
                </li>
              </ul>
            </div>
          </Card>
        </>
      )}

      {/* Preview Modal (simplified - would be a proper modal in production) */}
      {previewItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div className="max-w-4xl max-h-full">
            {previewItem.type === 'image' ? (
              <img
                src={previewItem.url}
                alt={previewItem.caption || 'Preview'}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={previewItem.url}
                controls
                className="max-w-full max-h-full"
              />
            )}
            {previewItem.caption && (
              <p className="text-white text-center mt-4">{previewItem.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onPrevious}
        >
          Back to Donations
        </Button>
        
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
        >
          Continue to Guestbook
        </Button>
      </div>
    </div>
  );
}