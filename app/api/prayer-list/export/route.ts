import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { cookies } from 'next/headers'

// Helper function to format date
const formatDate = (dateString: string | null, format: 'full' | 'short' = 'full') => {
  if (!dateString) return ''
  const date = new Date(dateString)
  
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }
  
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

// Helper function to calculate years since
const getYearsSince = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  return today.getFullYear() - date.getFullYear()
}

// GET /api/prayer-list/export - Export prayer list in various formats
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get format from query params (csv, json, txt, pdf)
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'txt'
    const includeNotes = searchParams.get('includeNotes') === 'true'
    const includeServices = searchParams.get('includeServices') === 'true'

    // Validate format
    const validFormats = ['csv', 'json', 'txt', 'pdf', 'html']
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be one of: csv, json, txt, pdf, html' },
        { status: 400 }
      )
    }

    // Fetch prayer list with all details
    const { data: prayerList, error: listError } = await supabase
      .from('prayer_lists')
      .select(`
        id,
        memorial_id,
        added_date,
        notes,
        remind_on_birthday,
        remind_on_death_anniversary,
        memorials (
          id,
          first_name,
          middle_name,
          last_name,
          nickname,
          date_of_birth,
          date_of_death,
          headline,
          obituary,
          featured_image,
          privacy_setting,
          custom_url,
          memorial_services (
            service_type,
            date,
            time,
            location_name,
            location_address
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('added_date', { ascending: false })

    if (listError) {
      console.error('Error fetching prayer list for export:', listError)
      return NextResponse.json(
        { error: 'Failed to fetch prayer list' },
        { status: 500 }
      )
    }

    if (!prayerList || prayerList.length === 0) {
      return NextResponse.json(
        { error: 'Prayer list is empty' },
        { status: 404 }
      )
    }

    // Get user profile for export metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const exportDate = new Date().toISOString()
    const exportTitle = `Prayer List Export - ${formatDate(exportDate)}`

    // Format based on requested type
    let content: string
    let contentType: string
    let filename: string

    switch (format) {
      case 'csv':
        contentType = 'text/csv'
        filename = `prayer-list-${new Date().toISOString().split('T')[0]}.csv`
        content = generateCSV(prayerList, includeNotes)
        break

      case 'json':
        contentType = 'application/json'
        filename = `prayer-list-${new Date().toISOString().split('T')[0]}.json`
        content = generateJSON(prayerList, profile, exportDate)
        break

      case 'html':
        contentType = 'text/html'
        filename = `prayer-list-${new Date().toISOString().split('T')[0]}.html`
        content = generateHTML(prayerList, profile, exportTitle, includeNotes, includeServices)
        break

      case 'pdf':
        // PDF generation would require a library like jsPDF or puppeteer
        // For now, return HTML with print styles
        contentType = 'text/html'
        filename = `prayer-list-${new Date().toISOString().split('T')[0]}.html`
        content = generatePrintableHTML(prayerList, profile, exportTitle, includeNotes)
        break

      default: // txt
        contentType = 'text/plain'
        filename = `prayer-list-${new Date().toISOString().split('T')[0]}.txt`
        content = generateTXT(prayerList, profile, exportTitle, includeNotes, includeServices)
    }

    // Track export event
    await supabase
      .from('memorial_analytics')
      .insert({
        user_id: user.id,
        event_type: 'prayer_list_exported',
        metadata: {
          format,
          count: prayerList.length,
          include_notes: includeNotes,
          include_services: includeServices
        }
      })

    // Return file download response
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Prayer list export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Generate CSV format
function generateCSV(prayerList: any[], includeNotes: boolean): string {
  const headers = [
    'Name',
    'Birth Date',
    'Death Date',
    'Years Since Passing',
    'Headline',
    'Added to Prayer List',
    'Birthday Reminders',
    'Anniversary Reminders'
  ]
  
  if (includeNotes) {
    headers.push('Notes')
  }

  const rows = prayerList.map(item => {
    const memorial = item.memorials
    if (!memorial) return []
    
    const fullName = [
      memorial.first_name,
      memorial.middle_name,
      memorial.last_name
    ].filter(Boolean).join(' ')

    const row = [
      fullName,
      formatDate(memorial.date_of_birth, 'short'),
      formatDate(memorial.date_of_death, 'short'),
      getYearsSince(memorial.date_of_death).toString(),
      memorial.headline || '',
      formatDate(item.added_date, 'short'),
      item.remind_on_birthday ? 'Yes' : 'No',
      item.remind_on_death_anniversary ? 'Yes' : 'No'
    ]

    if (includeNotes) {
      row.push(item.notes || '')
    }

    return row
  })

  // Escape CSV values
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  // Build CSV
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n')

  return csvContent
}

// Generate JSON format
function generateJSON(prayerList: any[], profile: any, exportDate: string): string {
  return JSON.stringify({
    export_info: {
      exported_by: profile?.full_name || 'Unknown',
      export_date: exportDate,
      total_count: prayerList.length,
      format: 'json',
      version: '1.0'
    },
    prayer_list: prayerList.map(item => ({
      memorial: {
        id: item.memorials?.id,
        name: {
          first: item.memorials?.first_name,
          middle: item.memorials?.middle_name,
          last: item.memorials?.last_name,
          nickname: item.memorials?.nickname
        },
        dates: {
          birth: item.memorials?.date_of_birth,
          death: item.memorials?.date_of_death,
          years_since_passing: item.memorials?.date_of_death ? 
            getYearsSince(item.memorials.date_of_death) : null
        },
        headline: item.memorials?.headline,
        url: item.memorials?.custom_url
      },
      prayer_list_info: {
        added_date: item.added_date,
        notes: item.notes,
        reminders: {
          birthday: item.remind_on_birthday,
          death_anniversary: item.remind_on_death_anniversary
        }
      },
      services: item.memorials?.memorial_services || []
    }))
  }, null, 2)
}

// Generate TXT format
function generateTXT(
  prayerList: any[], 
  profile: any, 
  title: string, 
  includeNotes: boolean,
  includeServices: boolean
): string {
  const lines = [
    '═'.repeat(60),
    title.toUpperCase(),
    '═'.repeat(60),
    '',
    `Exported by: ${profile?.full_name || 'Unknown'}`,
    `Date: ${formatDate(new Date().toISOString())}`,
    `Total in Prayer List: ${prayerList.length}`,
    '',
    '─'.repeat(60),
    ''
  ]

  prayerList.forEach((item, index) => {
    const memorial = item.memorials
    if (!memorial) return

    const fullName = [
      memorial.first_name,
      memorial.middle_name,
      memorial.last_name
    ].filter(Boolean).join(' ')

    lines.push(`${index + 1}. ${fullName.toUpperCase()}`)
    lines.push('─'.repeat(40))
    
    if (memorial.nickname) {
      lines.push(`   Also known as: ${memorial.nickname}`)
    }
    
    lines.push(`   Born: ${formatDate(memorial.date_of_birth)}`)
    lines.push(`   Passed: ${formatDate(memorial.date_of_death)}`)
    lines.push(`   Years Since Passing: ${getYearsSince(memorial.date_of_death)}`)
    
    if (memorial.headline) {
      lines.push(`   Headline: ${memorial.headline}`)
    }
    
    lines.push(`   Added to Prayer List: ${formatDate(item.added_date)}`)
    
    // Reminder settings
    lines.push(`   Reminders:`)
    lines.push(`      Birthday: ${item.remind_on_birthday ? '✓ Enabled' : '✗ Disabled'}`)
    lines.push(`      Death Anniversary: ${item.remind_on_death_anniversary ? '✓ Enabled' : '✗ Disabled'}`)
    
    if (includeNotes && item.notes) {
      lines.push(`   Notes: ${item.notes}`)
    }

    if (includeServices && memorial.memorial_services?.length > 0) {
      lines.push(`   Services:`)
      memorial.memorial_services.forEach((service: any) => {
        lines.push(`      • ${service.service_type}: ${formatDate(service.date)}`)
        if (service.time) lines.push(`        Time: ${service.time}`)
        if (service.location_name) lines.push(`        Location: ${service.location_name}`)
      })
    }
    
    lines.push('')
  })

  lines.push('─'.repeat(60))
  lines.push('')
  lines.push('May eternal rest grant unto them, O Lord,')
  lines.push('and let perpetual light shine upon them.')
  lines.push('May they rest in peace. Amen.')
  lines.push('')
  lines.push('═'.repeat(60))

  return lines.join('\n')
}

// Generate HTML format
function generateHTML(
  prayerList: any[], 
  profile: any, 
  title: string,
  includeNotes: boolean,
  includeServices: boolean
): string {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: Georgia, serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
      line-height: 1.6;
    }
    h1 {
      color: #003087;
      border-bottom: 3px solid #FFD700;
      padding-bottom: 10px;
    }
    .header {
      background: linear-gradient(to right, #003087, #004BA0);
      color: white;
      padding: 20px;
      margin: -20px -20px 20px -20px;
      text-align: center;
    }
    .memorial {
      border-left: 4px solid #003087;
      padding-left: 20px;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .memorial h2 {
      color: #003087;
      margin-bottom: 10px;
    }
    .detail {
      margin: 5px 0;
      color: #666;
    }
    .prayer {
      margin-top: 40px;
      padding: 20px;
      background: #f5f5f5;
      border-left: 4px solid #FFD700;
      font-style: italic;
      text-align: center;
    }
    .notes {
      background: #fff9e6;
      padding: 10px;
      margin: 10px 0;
      border-radius: 5px;
    }
    .services {
      background: #f0f7ff;
      padding: 10px;
      margin: 10px 0;
      border-radius: 5px;
    }
    @media print {
      .header {
        background: none;
        color: black;
        border-bottom: 2px solid black;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>Exported by ${profile?.full_name || 'Unknown'} on ${formatDate(new Date().toISOString())}</p>
    <p>Total: ${prayerList.length} ${prayerList.length === 1 ? 'person' : 'people'} in prayers</p>
  </div>
  
  ${prayerList.map((item, index) => {
    const memorial = item.memorials
    if (!memorial) return ''
    
    const fullName = [
      memorial.first_name,
      memorial.middle_name,
      memorial.last_name
    ].filter(Boolean).join(' ')
    
    return `
    <div class="memorial">
      <h2>${index + 1}. ${fullName}</h2>
      ${memorial.nickname ? `<div class="detail"><strong>Also known as:</strong> ${memorial.nickname}</div>` : ''}
      <div class="detail"><strong>Born:</strong> ${formatDate(memorial.date_of_birth)}</div>
      <div class="detail"><strong>Passed:</strong> ${formatDate(memorial.date_of_death)} (${getYearsSince(memorial.date_of_death)} years ago)</div>
      ${memorial.headline ? `<div class="detail"><strong>Headline:</strong> ${memorial.headline}</div>` : ''}
      <div class="detail"><strong>Added to Prayer List:</strong> ${formatDate(item.added_date)}</div>
      <div class="detail">
        <strong>Reminders:</strong> 
        Birthday ${item.remind_on_birthday ? '✓' : '✗'} | 
        Anniversary ${item.remind_on_death_anniversary ? '✓' : '✗'}
      </div>
      ${includeNotes && item.notes ? `<div class="notes"><strong>Notes:</strong> ${item.notes}</div>` : ''}
      ${includeServices && memorial.memorial_services?.length > 0 ? `
        <div class="services">
          <strong>Services:</strong>
          <ul>
            ${memorial.memorial_services.map((service: any) => `
              <li>
                ${service.service_type}: ${formatDate(service.date)}
                ${service.time ? ` at ${service.time}` : ''}
                ${service.location_name ? ` - ${service.location_name}` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    `
  }).join('')}
  
  <div class="prayer">
    <p><strong>Eternal Rest Prayer</strong></p>
    <p>May eternal rest grant unto them, O Lord,<br>
    and let perpetual light shine upon them.<br>
    May they rest in peace. Amen.</p>
  </div>
</body>
</html>`

  return html
}

// Generate printable HTML (optimized for PDF)
function generatePrintableHTML(
  prayerList: any[], 
  profile: any, 
  title: string,
  includeNotes: boolean
): string {
  // Similar to generateHTML but with print-specific styles
  return generateHTML(prayerList, profile, title, includeNotes, false).replace(
    '<style>',
    `<style>
    @page { size: letter; margin: 0.5in; }
    @media print {
      body { font-size: 11pt; }
      .memorial { page-break-inside: avoid; }
      .header { page-break-after: avoid; }
    }
    `
  )
}