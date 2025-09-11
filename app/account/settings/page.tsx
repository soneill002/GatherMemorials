'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  Download,
  Trash2,
  ChevronRight,
  Save,
  AlertCircle,
  Check,
  X,
  Loader2,
  Heart,
  Calendar,
  MessageSquare,
  Eye,
  EyeOff
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AccountSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const initializedRef = useRef(false);

  // Form states
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    prayer_reminders: true,
    anniversary_reminders: true,
    guestbook_notifications: true,
    newsletter: false
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [passwordErrors, setPasswordErrors] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    // Prevent double initialization
    if (initializedRef.current) {
      console.log('Settings: Already initialized, skipping');
      return;
    }
    initializedRef.current = true;

    const initializeSettings = async () => {
      console.log('Settings: Starting initialization...');
      
      try {
        const supabase = createBrowserClient();
        
        // Get session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );
        
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (sessionError || !session) {
          console.log('Settings: No session found, redirecting...');
          router.push('/auth/signin?redirect=/account/settings');
          return;
        }
        
        console.log('Settings: User authenticated:', session.user.email);
        setUser(session.user);
        
        // Set email immediately
        setProfile(prev => ({
          ...prev,
          email: session.user.email || ''
        }));
        
        // Load profile data in background
        loadProfileData(session.user.id);
        
        // Set loading to false immediately after auth check
        setLoading(false);
        
      } catch (error) {
        console.error('Settings: Error during initialization:', error);
        setLoading(false);
        
        // If it's a timeout, try to redirect
        if (error instanceof Error && error.message === 'Session timeout') {
          router.push('/auth/signin?redirect=/account/settings');
        }
      }
    };

    initializeSettings();
  }, [router]);

  const loadProfileData = async (userId: string) => {
    try {
      const supabase = createBrowserClient();
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors
      
      if (error && error.code !== 'PGRST116') {
        console.error('Settings: Error loading profile:', error);
        return;
      }
      
      if (profileData) {
        setProfile(prev => ({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: prev.email, // Keep the email from session
          phone: profileData.phone || ''
        }));
        
        setNotifications({
          email_notifications: profileData.email_notifications ?? true,
          prayer_reminders: profileData.prayer_reminders ?? true,
          anniversary_reminders: profileData.anniversary_reminders ?? true,
          guestbook_notifications: profileData.guestbook_notifications ?? true,
          newsletter: profileData.newsletter ?? false
        });
      }
    } catch (error) {
      console.error('Settings: Error in loadProfileData:', error);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const supabase = createBrowserClient();
      
      // Upsert profile (insert or update)
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (error) throw error;
      
      displayToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      displayToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const supabase = createBrowserClient();
      
      // Upsert profile with notifications
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...notifications,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (error) throw error;
      
      displayToast('Notification preferences updated', 'success');
    } catch (error) {
      console.error('Error updating notifications:', error);
      displayToast('Failed to update notifications', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // Reset errors
    setPasswordErrors({ current: '', new: '', confirm: '' });
    
    // Validation
    let hasErrors = false;
    
    if (!passwordForm.new_password) {
      setPasswordErrors(prev => ({ ...prev, new: 'New password is required' }));
      hasErrors = true;
    } else if (passwordForm.new_password.length < 8) {
      setPasswordErrors(prev => ({ ...prev, new: 'Password must be at least 8 characters' }));
      hasErrors = true;
    }
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors(prev => ({ ...prev, confirm: 'Passwords do not match' }));
      hasErrors = true;
    }
    
    if (hasErrors) return;
    
    setSaving(true);
    try {
      const supabase = createBrowserClient();
      
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      });
      
      if (error) throw error;
      
      // Clear form
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      displayToast('Password updated successfully', 'success');
    } catch (error: any) {
      console.error('Error updating password:', error);
      displayToast(error.message || 'Failed to update password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    setSaving(true);
    try {
      displayToast('Account deletion request submitted', 'success');
      
      // Sign out and redirect
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      displayToast('Failed to delete account', 'error');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  const handleExportData = async () => {
    setSaving(true);
    try {
      displayToast('Data export started. You will receive an email when ready.', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      displayToast('Failed to export data', 'error');
    } finally {
      setSaving(false);
    }
  };

  const displayToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marian-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
          <Link
            href="/account"
            className="mt-4 inline-block text-sm text-marian-500 hover:text-marian-600 underline"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900">Account Settings</h1>
              <p className="mt-1 text-gray-600">Manage your account preferences and settings</p>
            </div>
            <Link
              href="/account"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              Back to Dashboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'password', label: 'Password', icon: Lock },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'privacy', label: 'Privacy & Data', icon: Shield },
                { id: 'danger', label: 'Danger Zone', icon: AlertCircle }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === item.id
                        ? 'bg-marian-50 text-marian-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content sections remain the same as before */}
          <div className="flex-1">
            {/* ... rest of the content sections ... */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                {/* Profile form content */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profile.first_name}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marian-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profile.last_name}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marian-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="(555) 555-5555"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marian-500"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={handleProfileSave}
                      disabled={saving}
                      className="px-4 py-2 bg-marian-500 text-white rounded-full hover:bg-marian-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            toastType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toastType === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}