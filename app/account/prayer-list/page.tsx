'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  Heart, 
  Calendar, 
  Settings, 
  Trash2, 
  Clock, 
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Bell,
  Download,
  Grid3x3,
  List,
  User,
  Cake,
  Cross,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  FileCode,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { Skeleton } from '@/components/ui/Skeleton'
import { supabase } from '@/lib/supabase/client'
import { auth } from '@/lib/auth'  // Changed from requireAuth to auth
import type { Memorial } from '@/types/memorial'
import type { User } from '@/types/user'

interface PrayerListItem {
  id: string
  memorial_id: string
  added_date: string
  notes: string | null
  memorial: {
    id: string
    first_name: string
    middle_name: string | null
    last_name: string
    date_of_birth: string
    date_of_death: string
    headline: string
    featured_image: string | null
    privacy_setting: 'public' | 'private' | 'password'
    custom_url: string | null
  }
}

interface Anniversary {
  memorial_id: string
  memorial_name: string
  type: 'birthday' | 'death'
  date: string
  days_until: number
  years_since?: number
  years_old?: number
}

interface PrayerListStats {
  total_count: number
  anniversaries_count: number
  recent_additions: Array<{
    memorial_id: string
    memorial_name: string
    added_date: string
  }>
}

type ExportFormat = 'txt' | 'csv' | 'json' | 'html'

export default function PrayerListPage() {
  const router = useRouter()
  const { success: showSuccess, error: showError, ToastContainer } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [prayerList, setPrayerList] = useState<PrayerListItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<PrayerListItem | null>(null)
  const [upcomingAnniversaries, setUpcomingAnniversaries] = useState<Anniversary[]>([])
  const [stats, setStats] = useState<PrayerListStats | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('txt')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const currentUser = await auth.getUser()  // Changed to use auth.getUser()
    if (!currentUser) {
      router.push('/auth/signin?redirect=/account/prayer-list')
      return
    }
    setUser(currentUser as any)  // Type cast as User type might differ slightly
    loadPrayerList()  // Load prayer list immediately after auth check
  }

  const loadPrayerList = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/prayer-list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch prayer list')
      }
      
      const data = await response.json()
      
      // Set the prayer list
      setPrayerList(data.prayer_list || [])
      
      // Set upcoming anniversaries
      setUpcomingAnniversaries(data.upcoming_anniversaries || [])
      
      // Set stats
      setStats(data.stats || null)
    } catch (error) {
      console.error('Error loading prayer list:', error)
      showError('Failed to load prayer list')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (item: PrayerListItem) => {
    setItemToRemove(item)
    setShowRemoveModal(true)
  }

  const confirmRemove = async () => {
    if (!itemToRemove) return

    setIsRemoving(true)
    try {
      const response = await fetch(`/api/prayer-list/${itemToRemove.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to remove from prayer list')
      }

      const data = await response.json()
      
      // Update the prayer list by removing the item
      setPrayerList(prev => prev.filter(item => item.id !== itemToRemove.id))
      
      // Update anniversaries by removing related ones
      setUpcomingAnniversaries(prev => 
        prev.filter(ann => ann.memorial_id !== itemToRemove.memorial_id)
      )
      
      // Update stats if available
      if (stats) {
        setStats({
          ...stats,
          total_count: data.remaining_count || stats.total_count - 1
        })
      }
      
      showSuccess(`${data.memorial_name} removed from prayer list`)
      setShowRemoveModal(false)
      setItemToRemove(null)
    } catch (error) {
      console.error('Error removing from prayer list:', error)
      showError('Failed to remove from prayer list')
    } finally {
      setIsRemoving(false)
    }
  }

  const exportPrayerList = async (format: ExportFormat = 'txt') => {
    setIsExporting(true)
    setShowExportMenu(false)
    
    try {
      const response = await fetch(
        `/api/prayer-list/export?format=${format}&includeNotes=true&includeServices=false`,
        {
          method: 'GET',
          credentials: 'include'
        }
      )

      if (!response.ok) {
        // Check for specific error messages
        if (response.status === 404) {
          throw new Error('Prayer list is empty')
        }
        throw new Error('Failed to export prayer list')
      }

      // Get the blob from the response
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Set filename based on format
      const date = new Date().toISOString().split('T')[0]
      const extension = format === 'html' ? 'html' : format
      a.download = `prayer-list-${date}.${extension}`
      
      // Trigger download
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      showSuccess(`Prayer list exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Error exporting prayer list:', error)
      showError(error instanceof Error ? error.message : 'Failed to export prayer list')
    } finally {
      setIsExporting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const formatAnniversaryDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getYearsSince = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    return today.getFullYear() - date.getFullYear()
  }

  const filteredList = prayerList.filter(item => {
    if (!item.memorial) return false
    const fullName = `${item.memorial.first_name} ${item.memorial.middle_name || ''} ${item.memorial.last_name}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase())
  })

  const exportOptions = [
    { value: 'txt' as ExportFormat, label: 'Text File', icon: FileText, description: 'Simple text format' },
    { value: 'csv' as ExportFormat, label: 'CSV (Excel)', icon: FileSpreadsheet, description: 'For spreadsheets' },
    { value: 'json' as ExportFormat, label: 'JSON', icon: FileCode, description: 'Structured data' },
    { value: 'html' as ExportFormat, label: 'HTML', icon: Globe, description: 'Formatted webpage' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif text-gray-900 flex items-center gap-2">
                <Heart className="h-8 w-8 text-marian-blue" />
                My Prayer List
              </h1>
              <p className="mt-2 text-gray-600">
                {stats?.total_count || prayerList.length} {(stats?.total_count || prayerList.length) === 1 ? 'person' : 'people'} in your prayers
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isExporting || prayerList.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export'}
                  <ChevronDown className="h-3 w-3" />
                </Button>
                
                {showExportMenu && !isExporting && (
                  <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-56 z-10">
                    {exportOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.value}
                          onClick={() => exportPrayerList(option.value)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-start gap-3"
                        >
                          <Icon className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <div className="font-medium text-sm text-gray-900">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              
              <Link href="/account/prayer-list/settings">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Reminder Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upcoming Anniversaries */}
        {upcomingAnniversaries.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-marian-blue/5 to-liturgical-gold/5">
            <div className="p-6">
              <h2 className="text-xl font-serif text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-marian-blue" />
                Upcoming Anniversaries
              </h2>
              <div className="space-y-3">
                {upcomingAnniversaries.slice(0, 3).map((anniversary, index) => (
                  <div key={`${anniversary.memorial_id}-${anniversary.type}-${index}`} className="flex items-center justify-between bg-white rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      {anniversary.type === 'birthday' ? (
                        <Cake className="h-5 w-5 text-liturgical-gold" />
                      ) : (
                        <Cross className="h-5 w-5 text-marian-blue" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {anniversary.memorial_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {anniversary.type === 'birthday' ? 'Birthday' : 'Death Anniversary'} - {formatAnniversaryDate(anniversary.date)}
                          {anniversary.years_since && ` (${anniversary.years_since} years)`}
                          {anniversary.years_old && ` (would be ${anniversary.years_old})`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {anniversary.days_until === 0 ? (
                        <span className="text-sm font-medium text-marian-blue">Today</span>
                      ) : anniversary.days_until === 1 ? (
                        <span className="text-sm font-medium text-marian-blue">Tomorrow</span>
                      ) : (
                        <span className="text-sm text-gray-600">In {anniversary.days_until} days</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {upcomingAnniversaries.length > 3 && (
                <div className="mt-4 text-center">
                  <Link href="/account/prayer-list/anniversaries">
                    <Button variant="ghost" size="sm">
                      View all {upcomingAnniversaries.length} anniversaries
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Prayer List */}
        {loading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <Card className="p-12 text-center">
            {searchTerm ? (
              <>
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try adjusting your search terms</p>
              </>
            ) : prayerList.length === 0 ? (
              <>
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your prayer list is empty</h3>
                <p className="text-gray-600 mb-6">
                  Add people to your prayer list from their memorial pages
                </p>
                <Link href="/memorials">
                  <Button variant="primary">Browse Memorials</Button>
                </Link>
              </>
            ) : (
              <>
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">No one in your prayer list matches "{searchTerm}"</p>
              </>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/memorials/${item.memorial.custom_url || item.memorial.id}`}>
                  <div className="aspect-w-3 aspect-h-4 relative h-48 bg-gray-100">
                    {item.memorial.featured_image ? (
                      <Image
                        src={item.memorial.featured_image}
                        alt={`${item.memorial.first_name} ${item.memorial.last_name}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <User className="h-20 w-20 text-gray-400" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/memorials/${item.memorial.custom_url || item.memorial.id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-marian-blue transition-colors">
                      {item.memorial.first_name} {item.memorial.middle_name && `${item.memorial.middle_name} `}
                      {item.memorial.last_name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">{item.memorial.headline}</p>
                  <div className="mt-3 space-y-1 text-sm text-gray-500">
                    <p>{formatDate(item.memorial.date_of_birth)} - {formatDate(item.memorial.date_of_death)}</p>
                    <p className="italic">Passed {getYearsSince(item.memorial.date_of_death)} years ago</p>
                  </div>
                  {item.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      {item.notes}
                    </div>
                  )}
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Added {formatDate(item.added_date)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        handleRemove(item)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredList.map((item) => (
              <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <Link href={`/memorials/${item.memorial.custom_url || item.memorial.id}`}>
                    <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.memorial.featured_image ? (
                        <Image
                          src={item.memorial.featured_image}
                          alt={`${item.memorial.first_name} ${item.memorial.last_name}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <User className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <Link href={`/memorials/${item.memorial.custom_url || item.memorial.id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-marian-blue transition-colors">
                        {item.memorial.first_name} {item.memorial.middle_name && `${item.memorial.middle_name} `}
                        {item.memorial.last_name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">{item.memorial.headline}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>{formatDate(item.memorial.date_of_birth)} - {formatDate(item.memorial.date_of_death)}</span>
                      <span className="italic">Passed {getYearsSince(item.memorial.date_of_death)} years ago</span>
                      <span>Added {formatDate(item.added_date)}</span>
                    </div>
                    {item.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                        {item.notes}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(item)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-12 bg-gradient-to-r from-vatican-white to-gray-50">
          <div className="p-8 text-center">
            <Cross className="h-12 w-12 text-marian-blue mx-auto mb-4" />
            <h2 className="text-2xl font-serif text-gray-900 mb-4">
              Prayer Resources
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Find comfort and guidance through our collection of Catholic prayers, 
              scripture readings, and resources for remembering loved ones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/prayers">
                <Button variant="outline">
                  Browse Prayers
                </Button>
              </Link>
              <Link href="/blog/grief-support">
                <Button variant="outline">
                  Grief Support Articles
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveModal && itemToRemove && (
        <Modal
          isOpen={showRemoveModal}
          onClose={() => !isRemoving && setShowRemoveModal(false)}
          title="Remove from Prayer List"
        >
          <div className="p-6">
            <p className="text-gray-600">
              Are you sure you want to remove{' '}
              <span className="font-semibold">
                {itemToRemove.memorial.first_name} {itemToRemove.memorial.last_name}
              </span>{' '}
              from your prayer list?
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRemoveModal(false)}
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmRemove}
                disabled={isRemoving}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400"
              >
                {isRemoving ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
}