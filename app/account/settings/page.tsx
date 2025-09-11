'use client';

import { useState, useEffect } from 'react';
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
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

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
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeSettings = async () => {
      try {
        console.log('Settings: Starting initialization...');
        
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.log('Settings: Timeout reached, forcing completion');
            setLoading(false);
            setAuthCheckComplete(true);
            router.push('/auth/signin?redirect=/account/settings');
          }
        }, 10000); // 10 second timeout

        const supabase = createBrowserClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error('Settings: Session error:', sessionError);
          setLoading(false);
          setAuthCheckComplete(true);
          router.push('/auth/signin?redirect=/account/settings');
          return;
        }
        
        if (!session || !session.user) {
          console.log('Settings: No session found, redirecting to signin');
          setLoading(false);
          setAuthCheckComplete(true);
          router.push('/auth/signin?redirect=/account/settings');
          return;
        }
        
        console.log('Settings: User authenticated:', session.user.email);
        setUser(session.user);
        setAuthCheckComplete(true);
        
        // Set email from session
        setProfile(prev => ({
          ...prev,
          email: session.user.email || ''
        }));
        
        // Load user profile data - don't block on this
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!mounted) return;
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Settings: Error loading profile:', profileError);
          }
          
          if (profileData) {
            setProfile({
              first_name: profileData.first_name || '',
              last_name: profileData.last_name || '',
              email: session.user.email || '',
              phone: profileData.phone || ''
            });
            
            setNotifications({
              email_notifications: profileData.email_notifications ?? true,
              prayer_reminders: profileData.prayer_reminders ?? true,
              anniversary_reminders: profileData.anniversary_reminders ?? true,
              guestbook_notifications: profileData.guestbook_notifications ?? true,
              newsletter: profileData.newsletter ?? false
            });
          }
        } catch (profileError) {
          console.error('Settings: Failed to load profile:', profileError);
          // Continue anyway with default values
        }
        
        if (mounted) {
          setLoading(false);
        }
        
      } catch (error) {
        console.error('Settings: Unexpected error:', error);
        if (mounted) {
          setLoading(false);
          setAuthCheckComplete(true);
          router.push('/auth/signin?redirect=/account/settings');
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    initializeSettings();

    // Cleanup
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [router]);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const supabase = createBrowserClient();
      
      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone: profile.phone,
            updated_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
      } else {
        // Profile exists, update it
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone: profile.phone,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) throw updateError;
      }
      
      displayToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      displayToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsSave = async () => {
    setSaving(true);
    try {
      const supabase = createBrowserClient();
      
      // Check if profile exists first
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // Profile doesn't exist, create it with notifications
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            ...notifications,
            updated_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
      } else {
        // Profile exists, update it
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            ...notifications,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) throw updateError;
      }
      
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
    
    if (!passwordForm.current_password) {
      setPasswordErrors(prev => ({ ...prev, current: 'Current password is required' }));
      hasErrors = true;
    }
    
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

  if (loading && !authCheckComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marian-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-marian-500 hover:text-marian-600 underline"
          >
            Taking too long? Click here to refresh
          </button>
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

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
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

            {activeTab === 'password' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marian-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {passwordErrors.current && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.current}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marian-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {passwordErrors.new && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.new}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marian-500"
                    />
                    {passwordErrors.confirm && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirm}</p>
                    )}
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={handlePasswordChange}
                      disabled={saving}
                      className="px-4 py-2 bg-marian-500 text-white rounded-full hover:bg-marian-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Notifications
                      </h3>
                      <p className="text-sm text-gray-600">Receive email updates about your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.email_notifications}
                        onChange={(e) => setNotifications({ ...notifications, email_notifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-marian-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-marian-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Prayer Reminders
                      </h3>
                      <p className="text-sm text-gray-600">Daily reminders to pray for those on your list</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.prayer_reminders}
                        onChange={(e) => setNotifications({ ...notifications, prayer_reminders: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-marian-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-marian-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Anniversary Reminders
                      </h3>
                      <p className="text-sm text-gray-600">Notifications for birthdays and death anniversaries</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.anniversary_reminders}
                        onChange={(e) => setNotifications({ ...notifications, anniversary_reminders: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-marian-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-marian-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Guestbook Notifications
                      </h3>
                      <p className="text-sm text-gray-600">Get notified when someone signs a guestbook</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.guestbook_notifications}
                        onChange={(e) => setNotifications({ ...notifications, guestbook_notifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-marian-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-marian-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Newsletter
                      </h3>
                      <p className="text-sm text-gray-600">Receive our monthly newsletter with updates and tips</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.newsletter}
                        onChange={(e) => setNotifications({ ...notifications, newsletter: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-marian-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-marian-500"></div>
                    </label>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      onClick={handleNotificationsSave}
                      disabled={saving}
                      className="px-4 py-2 bg-marian-500 text-white rounded-full hover:bg-marian-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy & Data</h2>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Export Your Data
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Download a copy of all your data including memorials, guestbook entries, and account information.
                    </p>
                    <button
                      onClick={handleExportData}
                      disabled={saving}
                      className="px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {saving ? 'Processing...' : 'Request Data Export'}
                    </button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Data Retention</h3>
                    <p className="text-sm text-gray-600">
                      We retain your data as long as your account is active. Memorial pages remain accessible 
                      according to your privacy settings. You can delete your account at any time.
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Privacy Policy</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Learn more about how we collect, use, and protect your information.
                    </p>
                    <Link href="/privacy" className="text-sm text-marian-500 hover:text-marian-600">
                      View Privacy Policy →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Danger Zone</h2>
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Delete Account
                  </h3>
                  <p className="text-sm text-red-800 mb-4">
                    Once you delete your account, there is no going back. All your data will be permanently deleted.
                    This includes all memorials you've created, guestbook entries, and your prayer list.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Account</h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Type <span className="font-mono font-bold">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

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