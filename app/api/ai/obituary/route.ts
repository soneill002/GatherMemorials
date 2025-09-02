import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import openai, { 
  validateOpenAIKey, 
  generateSystemPrompt, 
  formatUserPrompt, 
  sanitizeObituaryContent,
  generateSuggestions,
  checkRateLimit,
  AI_ERROR_MESSAGES,
  type ObituaryPrompt 
} from '@/lib/openai/client';
import { z } from 'zod';

// Request validation schema
const ObituaryRequestSchema = z.object({
  deceasedName: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  placeOfBirth: z.string().optional(),
  placeOfDeath: z.string().optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
  militaryService: z.string().optional(),
  hobbies: z.string().optional(),
  survivedBy: z.string().optional(),
  predeceased: z.string().optional(),
  specialMemories: z.string().optional(),
  tone: z.enum(['traditional', 'celebratory', 'simple', 'detailed']),
  includeReligious: z.boolean(),
  stream: z.boolean().optional().default(false)
});

export async function POST(req: NextRequest) {
  try {
    // Check if OpenAI is configured
    if (!validateOpenAIKey()) {
      return NextResponse.json(
        { error: AI_ERROR_MESSAGES.NO_API_KEY },
        { status: 503 }
      );
    }

    // Check authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please sign in to use AI assistance' },
        { status: 401 }
      );
    }

    // Check rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: AI_ERROR_MESSAGES.RATE_LIMIT },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = ObituaryRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: AI_ERROR_MESSAGES.INVALID_INPUT,
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data as ObituaryPrompt;

    // Generate prompts
    const systemPrompt = generateSystemPrompt(data.tone, data.includeReligious);
    const userPrompt = formatUserPrompt(data);

    // Log AI usage for analytics (optional)
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'obituary_generation',
      prompt_tokens: userPrompt.length,
      tone: data.tone,
      created_at: new Date().toISOString()
    });

    // Handle streaming response
    if (data.stream) {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      });

      // Create a ReadableStream for streaming response
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
              }
            }
            
            // Send suggestions at the end
            const suggestions = generateSuggestions(data);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              done: true, 
              suggestions 
            })}\n\n`));
            
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });

      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle non-streaming response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const generatedContent = completion.choices[0]?.message?.content || '';
    
    if (!generatedContent) {
      throw new Error('No content generated');
    }

    // Sanitize the content
    const sanitizedContent = sanitizeObituaryContent(generatedContent);
    
    // Generate suggestions for improvement
    const suggestions = generateSuggestions(data);

    // Update usage logs with completion tokens
    const totalTokens = completion.usage?.total_tokens || 0;
    await supabase
      .from('ai_usage_logs')
      .update({ 
        completion_tokens: completion.usage?.completion_tokens || 0,
        total_tokens: totalTokens 
      })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    return NextResponse.json({
      content: sanitizedContent,
      suggestions,
      usage: {
        tokens: totalTokens,
        model: 'gpt-4-turbo-preview'
      }
    });

  } catch (error) {
    console.error('Obituary generation error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: AI_ERROR_MESSAGES.RATE_LIMIT },
          { status: 429 }
        );
      }
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: AI_ERROR_MESSAGES.TIMEOUT },
          { status: 504 }
        );
      }
    }
    
    return NextResponse.json(
      { error: AI_ERROR_MESSAGES.API_ERROR },
      { status: 500 }
    );
  }
}

// GET endpoint to check AI availability
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { available: false, reason: 'Not authenticated' },
        { status: 401 }
      );
    }

    const hasApiKey = validateOpenAIKey();
    const hasRateLimit = checkRateLimit(user.id, 1, 0); // Check without consuming
    
    return NextResponse.json({
      available: hasApiKey && hasRateLimit,
      hasApiKey,
      hasRateLimit,
      remainingRequests: hasRateLimit ? 5 : 0
    });
    
  } catch (error) {
    console.error('AI availability check error:', error);
    return NextResponse.json(
      { available: false, reason: 'Service unavailable' },
      { status: 503 }
    );
  }
}