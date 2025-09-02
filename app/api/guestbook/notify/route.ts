import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Email templates (in production, use a proper email service)
const emailTemplates = {
  new_entry_moderation: (data: any) => ({
    subject: `New guestbook entry for ${data.memorial_name} requires moderation`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #003087; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
            .message { background: white; padding: 15px; border-left: 3px solid #003087; margin: 15px 0; }
            .button { display: inline-block; padding: 10px 20px; background: #003087; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Guestbook Entry</h2>
            </div>
            <div class="content">
              <p>Hello ${data.owner_name},</p>
              <p>A new guestbook entry has been posted for <strong>${data.memorial_name}</strong> and requires your approval.</p>
              
              <div class="message">
                <p><strong>From:</strong> ${data.author_name}</p>
                <p><strong>Message:</strong></p>
                <p>${data.message}</p>
                ${data.photo_url ? `<p><strong>Photo attached:</strong> Yes</p>` : ''}
              </div>
              
              <p>Please review and moderate this entry:</p>
              <div style="text-align: center;">
                <a href="${data.moderation_url}" class="button">Review Entry</a>
              </div>
              
              <p style="margin-top: 20px;">You can manage all pending entries in your account dashboard.</p>
            </div>
            <div class="footer">
              <p>© 2024 GatherMemorials. Created with love and respect.</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      New Guestbook Entry
      
      Hello ${data.owner_name},
      
      A new guestbook entry has been posted for ${data.memorial_name} and requires your approval.
      
      From: ${data.author_name}
      Message: ${data.message}
      ${data.photo_url ? 'Photo attached: Yes' : ''}
      
      Please review this entry at: ${data.moderation_url}
      
      You can manage all pending entries in your account dashboard.
      
      © 2024 GatherMemorials
    `
  }),

  entry_approved: (data: any) => ({
    subject: `Your message on ${data.memorial_name}'s memorial has been approved`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
            .button { display: inline-block; padding: 10px 20px; background: #003087; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Your Message Has Been Approved</h2>
            </div>
            <div class="content">
              <p>Dear ${data.author_name},</p>
              <p>Your message on <strong>${data.memorial_name}'s</strong> memorial has been approved and is now visible to all visitors.</p>
              
              <p>Thank you for sharing your memories and condolences with the family.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.memorial_url}" class="button">View Memorial</a>
              </div>
              
              <p>Your thoughtful words bring comfort during this difficult time.</p>
            </div>
            <div class="footer">
              <p>© 2024 GatherMemorials. Created with love and respect.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Your Message Has Been Approved
      
      Dear ${data.author_name},
      
      Your message on ${data.memorial_name}'s memorial has been approved and is now visible to all visitors.
      
      Thank you for sharing your memories and condolences with the family.
      
      View the memorial at: ${data.memorial_url}
      
      Your thoughtful words bring comfort during this difficult time.
      
      © 2024 GatherMemorials
    `
  }),

  entry_rejected: (data: any) => ({
    subject: `Update on your message for ${data.memorial_name}'s memorial`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Message Not Approved</h2>
            </div>
            <div class="content">
              <p>Dear ${data.author_name},</p>
              <p>We wanted to let you know that your message on <strong>${data.memorial_name}'s</strong> memorial was not approved for display.</p>
              
              ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
              
              <p>Memorial guestbooks are moderated to ensure all messages are appropriate and respectful. If you believe this was in error, please contact our support team.</p>
              
              <p>Thank you for your understanding.</p>
            </div>
            <div class="footer">
              <p>© 2024 GatherMemorials. Created with love and respect.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Message Not Approved
      
      Dear ${data.author_name},
      
      We wanted to let you know that your message on ${data.memorial_name}'s memorial was not approved for display.
      
      ${data.reason ? `Reason: ${data.reason}` : ''}
      
      Memorial guestbooks are moderated to ensure all messages are appropriate and respectful. If you believe this was in error, please contact our support team.
      
      Thank you for your understanding.
      
      © 2024 GatherMemorials
    `
  })
};

// Mock email sending function (replace with actual email service)
async function sendEmail(to: string, template: any) {
  // In production, this would use SendGrid, Resend, or another email service
  console.log('Sending email to:', to);
  console.log('Subject:', template.subject);
  console.log('HTML:', template.html);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return { success: true, messageId: `msg_${Date.now()}` };
}

// POST /api/guestbook/notify - Send notification emails
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // This endpoint should typically be called by internal services
    // or after moderation actions, not directly by users
    
    const body = await request.json();
    const { type, recipient_email, data } = body;

    // Validate required fields
    if (!type || !recipient_email || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, recipient_email, data' },
        { status: 400 }
      );
    }

    // Validate email type
    if (!['new_entry_moderation', 'entry_approved', 'entry_rejected'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Generate email template
    const template = emailTemplates[type as keyof typeof emailTemplates](data);

    // Send email
    try {
      const result = await sendEmail(recipient_email, template);
      
      // Log email send
      await supabase
        .from('email_logs')
        .insert({
          to: recipient_email,
          type,
          subject: template.subject,
          status: 'sent',
          message_id: result.messageId,
          sent_at: new Date().toISOString()
        });

      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully',
        messageId: result.messageId
      });

    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      // Log failed email
      await supabase
        .from('email_logs')
        .insert({
          to: recipient_email,
          type,
          subject: template.subject,
          status: 'failed',
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          sent_at: new Date().toISOString()
        });

      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in POST /api/guestbook/notify:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/guestbook/notify/preferences - Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (prefError && prefError.code !== 'PGRST116') { // Not found is ok
      console.error('Error fetching preferences:', prefError);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Return preferences or defaults
    return NextResponse.json({
      preferences: preferences || {
        new_guestbook_entry: true,
        entry_approved: true,
        entry_rejected: false,
        weekly_summary: false,
        email_frequency: 'instant' // instant, daily, weekly
      }
    });

  } catch (error) {
    console.error('Error in GET /api/guestbook/notify/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/guestbook/notify/preferences - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences object is required' },
        { status: 400 }
      );
    }

    // Upsert preferences
    const { error: upsertError } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: session.user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error updating preferences:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/guestbook/notify/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}