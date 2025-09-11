// app/account/memorials/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Memorial {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  headline: string | null;
  status: 'draft' | 'published';
  featured_image_url: string | null;
  cover_photo_url: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  privacy: 'public' | 'private' | 'password';
  guestbook_enabled: boolean;
}

export default function MyMemorialsPage() {
  const router = useRouter();
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'name'>('created');

  useEffect(() => {
    const loadMemorials = async () => {
      try {
        const supabase = createBrowserClient();
        
        // Get user session
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          router.push('/auth/signin?redirect=/account/memorials');
          return;
        }
        
        setUser(currentUser);
        
        // Load memorials
        const { data: memorialsData, error: memorialsError } = await supabase
          .from('memorials')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
        
        if (memorialsError) {
          console.error('Error loading memorials:', memorialsError);
          setError('Failed to load memorials');
        } else {
          setMemorials(memorialsData || []);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError('An unexpected error occurred');
        setIsLoading(false);
      }
    };
    
    loadMemorials();
  }, [router]);

  const handleDeleteMemorial = async (memorialId: string) => {
    if (!confirm('Are you sure you want to permanently delete this memorial? This action cannot be undone.')) {
      return;
    }
    
    try {
      const supabase = createBrowserClient();
      
      const { error } = await supabase
        .from('memorials')
        .delete()
        .eq('id', memorialId);
      
      if (error) {
        console.error('Error deleting memorial:', error);
        alert('Failed to delete memorial. Please try again.');
      } else {
        setMemorials(prev => prev.filter(m => m.id !== memorialId));
        alert('Memorial deleted successfully');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while deleting the memorial.');
    }
  };

  const handleDuplicateMemorial = async (memorial: Memorial) => {
    try {
      const supabase = createBrowserClient();
      
      // Create a copy of the memorial
      const newMemorial = {
        ...memorial,
        id: undefined,
        first_name: `${memorial.first_name} (Copy)`,
        status: 'draft' as const,
        created_at: undefined,
        updated_at: undefined,
        view_count: 0
      };
      
      delete newMemorial.id;
      delete newMemorial.created_at;
      delete newMemorial.updated_at;
      
      const { data, error } = await supabase
        .from('memorials')
        .insert(newMemorial)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        router.push(`/memorials/new?id=${data.id}`);
      }
    } catch (error) {
      console.error('Error duplicating memorial:', error);
      alert('Failed to duplicate memorial. Please try again.');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: '