'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { 
  MessageSquare, 
  User, 
  Mail, 
  Image as ImageIcon, 
  X, 
  Send,
  Lock,
  LogIn,
  UserPlus,
  Heart,
  AlertCircle,
  Check
} from 'lucide-react';

interface GuestbookFormProps {
  memorialId: string;
  memorialName: string;
  requiresModeration: boolean;
  onEntrySubmitted?: () => void;
}

interface GuestbookEntry {
  id?: string;
  memorial_id: string;
  user_id: string;
  author_name: string;
  author_email: string;
  message: string;
  photo_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

export function GuestbookForm({
  memorialId,
  memorialName,
  requiresModeration = true,
  onEntrySubmitted
}: GuestbookFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Form state
  const [message, setMessage] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Auth form state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Character limit
  const MAX_MESSAGE_LENGTH = 500;
  const charactersRemaining = MAX_MESSAGE_LENGTH - message.length;
  
  // Check authentication on mount
  useState(() => {
    checkAuth();
  });
  
  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsAuthenticated(true);
      setUserEmail(user.email || '');
      
      // Fetch user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserName(profile.full_name || user.email?.split('@')[0] || 'Anonymous');
      }
    }
  }
  
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    
    try {
      if (authMode === 'signup') {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              full_name: authName
            }
          }
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Create profile
          await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: authEmail,
              full_name: authName
            });
          
          setIsAuthenticated(true);
          setUserName(authName);
          setUserEmail(authEmail);
          setShowAuthModal(false);
          setAuthEmail('');
          setAuthPassword('');
          setAuthName('');
        }
      } else {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });
        
        if (error) throw error;
        
        if (data.user) {
          setIsAuthenticated(true);
          setUserEmail(data.user.email || '');
          
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', data.user.id)
            .single();
          
          if (profile) {
            setUserName(profile.full_name || data.user.email?.split('@')[0] || 'Anonymous');
          }
          
          setShowAuthModal(false);
          setAuthEmail('');
          setAuthPassword('');
        }
      }
    } catch (error: any) {
      setAuthError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Photo must be less than 5MB');
        setShowErrorToast(true);
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select an image file');
        setShowErrorToast(true);
        return;
      }
      
      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }
  
  function removePhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Check authentication first
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    // Validate message
    if (!message.trim()) {
      setErrorMessage('Please enter a message');
      setShowErrorToast(true);
      return;
    }
    
    if (message.length > MAX_MESSAGE_LENGTH) {
      setErrorMessage(`Message must be less than ${MAX_MESSAGE_LENGTH} characters`);
      setShowErrorToast(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setShowAuthModal(true);
        return;
      }
      
      let photoUrl = null;
      
      // Upload photo if provided (placeholder - will integrate with Cloudinary later)
      if (photoFile) {
        // TODO: Implement Cloudinary upload
        // For now, we'll store as base64 in the database (not recommended for production)
        photoUrl = photoPreview;
      }
      
      // Create guestbook entry
      const entry: Partial<GuestbookEntry> = {
        memorial_id: memorialId,
        user_id: user.id,
        author_name: userName,
        author_email: userEmail,
        message: message.trim(),
        photo_url: photoUrl || undefined,
        status: requiresModeration ? 'pending' : 'approved'
      };
      
      const { error } = await supabase
        .from('guestbook_entries')
        .insert(entry);
      
      if (error) throw error;
      
      // Clear form
      setMessage('');
      setPhotoFile(null);
      setPhotoPreview(null);
      
      // Show success message
      setShowSuccessToast(true);
      
      // Notify parent component
      if (onEntrySubmitted) {
        onEntrySubmitted();
      }
      
      // Refresh the page after a delay to show the new entry (if approved)
      if (!requiresModeration) {
        setTimeout(() => {
          router.refresh();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error submitting guestbook entry:', error);
      setErrorMessage('Failed to submit your message. Please try again.');
      setShowErrorToast(true);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Leave a Memory
            </h3>
            <p className="text-sm text-gray-600">
              Share your thoughts and memories of {memorialName}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User info display (if authenticated) */}
          {isAuthenticated && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-full">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-600">{userEmail}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setIsAuthenticated(false);
                  setUserName('');
                  setUserEmail('');
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          )}
          
          {/* Message textarea */}
          <div>
            <label htmlFor="message" className="sr-only">
              Your message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share a memory, story, or condolence..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-gray-500">
                {requiresModeration && (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Messages are reviewed before appearing
                  </span>
                )}
              </span>
              <span className={`${charactersRemaining < 50 ? 'text-amber-600' : 'text-gray-500'}`}>
                {charactersRemaining} characters remaining
              </span>
            </div>
          </div>
          
          {/* Photo upload */}
          <div>
            {!photoPreview ? (
              <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="sr-only"
                />
                <ImageIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Add a photo (optional)
                </span>
              </label>
            ) : (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* Submit button */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || (!message.trim() && !photoFile)}
              loading={isSubmitting}
              className="flex-1"
            >
              {!isAuthenticated ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Sign in to Post
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {requiresModeration ? 'Submit for Review' : 'Post Message'}
                </>
              )}
            </Button>
          </div>
          
          {/* Sign in prompt for non-authenticated users */}
          {!isAuthenticated && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Sign in required
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    To prevent spam and ensure authenticity, we require you to sign in before posting.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Sign in or create an account →
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
      
      {/* Authentication Modal */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title={authMode === 'signin' ? 'Sign In to Continue' : 'Create Your Account'}
      >
        <form onSubmit={handleAuth} className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            {authMode === 'signin' 
              ? 'Sign in to leave a message in the guestbook.'
              : 'Create an account to leave messages and add memorials to your prayer list.'}
          </p>
          
          {authMode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          
          {authError && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {authError}
            </div>
          )}
          
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="flex-1"
            >
              {authMode === 'signin' ? (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAuthModal(false)}
            >
              Cancel
            </Button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                setAuthError('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {authMode === 'signin' 
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Success Toast */}
      <Toast
        isVisible={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        message={
          requiresModeration
            ? 'Your message has been submitted for review. It will appear once approved.'
            : 'Your message has been posted successfully!'
        }
        type="success"
        icon={requiresModeration ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
      />
      
      {/* Error Toast */}
      <Toast
        isVisible={showErrorToast}
        onClose={() => setShowErrorToast(false)}
        message={errorMessage}
        type="error"
      />
      
      {/* Catholic Prayer (optional footer) */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium mb-1">
              Eternal Rest Prayer
            </p>
            <p className="text-sm text-blue-700 italic">
              "Eternal rest grant unto them, O Lord, and let perpetual light shine upon them. 
              May they rest in peace. Amen."
            </p>
          </div>
        </div>
      </div>
    </>
  );
}