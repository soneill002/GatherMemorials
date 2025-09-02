import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  generateUploadSignature, 
  validateFile,
  deleteAsset,
  isCloudinaryConfigured 
} from '@/lib/cloudinary/client';
import { uploadBufferToCloudinary } from '@/lib/cloudinary/upload';
import { z } from 'zod';

// Schema for signature request
const SignatureRequestSchema = z.object({
  folder: z.string(),
  memorial_id: z.string().optional(),
  transformation: z.any().optional()
});

// Schema for upload request
const UploadRequestSchema = z.object({
  memorial_id: z.string(),
  media_type: z.enum(['photo', 'video']),
  caption: z.string().optional(),
  is_primary: z.boolean().optional()
});

// POST /api/uploads/cloudinary - Generate upload signature
export async function POST(req: NextRequest) {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: 'Media upload service is not configured' },
        { status: 503 }
      );
    }

    // Check authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validationResult = SignatureRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const { folder, memorial_id, transformation } = validationResult.data;

    // If memorial_id provided, verify ownership
    if (memorial_id) {
      const { data: memorial, error: memorialError } = await supabase
        .from('memorials')
        .select('user_id')
        .eq('id', memorial_id)
        .single();

      if (memorialError || !memorial) {
        return NextResponse.json(
          { error: 'Memorial not found' },
          { status: 404 }
        );
      }

      if (memorial.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized to upload to this memorial' },
          { status: 403 }
        );
      }
    }

    // Generate upload signature
    const signatureData = await generateUploadSignature(
      `memorials/${memorial_id || user.id}/${folder}`,
      transformation
    );

    // Log upload intent for analytics
    await supabase.from('upload_logs').insert({
      user_id: user.id,
      memorial_id,
      folder,
      status: 'signature_generated',
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      ...signatureData,
      upload_url: `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/upload`
    });

  } catch (error) {
    console.error('Signature generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}

// PUT /api/uploads/cloudinary - Direct server upload
export async function PUT(req: NextRequest) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: 'Media upload service is not configured' },
        { status: 503 }
      );
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const memorial_id = formData.get('memorial_id') as string;
    const media_type = formData.get('media_type') as 'photo' | 'video';
    const caption = formData.get('caption') as string;
    const is_primary = formData.get('is_primary') === 'true';

    if (!file || !memorial_id || !media_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file, media_type);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Verify memorial ownership
    const { data: memorial, error: memorialError } = await supabase
      .from('memorials')
      .select('user_id')
      .eq('id', memorial_id)
      .single();

    if (memorialError || !memorial) {
      return NextResponse.json(
        { error: 'Memorial not found' },
        { status: 404 }
      );
    }

    if (memorial.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to upload to this memorial' },
        { status: 403 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await uploadBufferToCloudinary(buffer, {
      folder: `memorials/${memorial_id}/${media_type}s`,
      filename: file.name,
      resource_type: media_type === 'video' ? 'video' : 'image'
    });

    // Save media record to database
    const { data: mediaRecord, error: dbError } = await supabase
      .from('media')
      .insert({
        memorial_id,
        user_id: user.id,
        media_type,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        thumbnail_url: uploadResult.thumbnail_url,
        caption,
        is_primary,
        metadata: {
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          size: uploadResult.bytes,
          duration: uploadResult.duration
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      // Try to delete from Cloudinary if database save fails
      await deleteAsset(uploadResult.public_id);
      throw dbError;
    }

    // If set as primary, update other media
    if (is_primary) {
      await supabase
        .from('media')
        .update({ is_primary: false })
        .eq('memorial_id', memorial_id)
        .eq('media_type', media_type)
        .neq('id', mediaRecord.id);
    }

    // Update upload log
    await supabase.from('upload_logs').insert({
      user_id: user.id,
      memorial_id,
      media_id: mediaRecord.id,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      media: mediaRecord,
      url: uploadResult.secure_url,
      thumbnail_url: uploadResult.thumbnail_url
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// DELETE /api/uploads/cloudinary - Delete media
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const media_id = searchParams.get('media_id');
    
    if (!media_id) {
      return NextResponse.json(
        { error: 'Media ID required' },
        { status: 400 }
      );
    }

    // Get media record
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .select('*, memorial:memorials(user_id)')
      .eq('id', media_id)
      .single();

    if (mediaError || !media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (media.memorial.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this media' },
        { status: 403 }
      );
    }

    // Delete from Cloudinary
    const deleted = await deleteAsset(media.public_id);
    
    if (!deleted) {
      console.error('Failed to delete from Cloudinary:', media.public_id);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('media')
      .delete()
      .eq('id', media_id);

    if (deleteError) {
      throw deleteError;
    }

    // Log deletion
    await supabase.from('upload_logs').insert({
      user_id: user.id,
      memorial_id: media.memorial_id,
      media_id,
      status: 'deleted',
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}

// GET /api/uploads/cloudinary/validate - Validate file before upload
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileSize = parseInt(searchParams.get('size') || '0');
    const fileType = searchParams.get('type') || '';
    const mediaType = searchParams.get('media_type') as 'photo' | 'video';

    if (!fileSize || !fileType || !mediaType) {
      return NextResponse.json(
        { error: 'Missing validation parameters' },
        { status: 400 }
      );
    }

    // Create a mock file for validation
    const mockFile = {
      size: fileSize,
      type: fileType
    } as File;

    const validation = validateFile(mockFile, mediaType);

    return NextResponse.json({
      valid: validation.valid,
      error: validation.error,
      maxSize: mediaType === 'video' ? 104857600 : 10485760,
      allowedTypes: mediaType === 'video' 
        ? ['video/mp4', 'video/quicktime', 'video/webm']
        : ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}