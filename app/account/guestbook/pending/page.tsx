'use client';

import ModerationQueue from '@/features/guestbook/components/ModerationQueue';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PendingGuestbookPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/account" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Guestbook Moderation
          </h1>
        </div>

        {/* Moderation Queue */}
        <ModerationQueue />
      </div>
    </div>
  );
}