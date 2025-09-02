import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;

// Validate API key exists
export function validateOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// Type definitions for our AI features
export interface ObituaryPrompt {
  deceasedName: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  placeOfBirth?: string;
  placeOfDeath?: string;
  occupation?: string;
  education?: string;
  militaryService?: string;
  hobbies?: string;
  survivedBy?: string;
  predeceased?: string;
  specialMemories?: string;
  tone: 'traditional' | 'celebratory' | 'simple' | 'detailed';
  includeReligious: boolean;
}

export interface ObituaryResponse {
  content: string;
  suggestions?: string[];
}

// Catholic-appropriate prompt templates
export const OBITUARY_PROMPTS = {
  traditional: `Write a respectful, traditional Catholic obituary that includes appropriate religious language and references to faith. Keep the tone formal yet warm.`,
  
  celebratory: `Write a life-celebrating obituary that focuses on joy, accomplishments, and positive memories while maintaining Catholic reverence and hope in eternal life.`,
  
  simple: `Write a brief, straightforward obituary with essential information and gentle Catholic faith references.`,
  
  detailed: `Write a comprehensive obituary that thoroughly covers the person's life story, relationships, and faith journey in the Catholic tradition.`
};

// Catholic phrases and references
export const CATHOLIC_PHRASES = {
  opening: [
    "entered into eternal rest",
    "was called home to the Lord",
    "peacefully went to be with our Savior",
    "joined the communion of saints"
  ],
  closing: [
    "May perpetual light shine upon them.",
    "Eternal rest grant unto them, O Lord.",
    "May their soul rest in peace.",
    "Until we meet again in God's heavenly kingdom."
  ],
  comfort: [
    "taking comfort in the promise of resurrection",
    "trusting in God's infinite mercy",
    "finding peace in our faith",
    "held in the loving arms of our Savior"
  ]
};

// Generate system prompt based on tone and preferences
export function generateSystemPrompt(tone: ObituaryPrompt['tone'], includeReligious: boolean): string {
  const basePrompt = OBITUARY_PROMPTS[tone];
  
  const guidelines = `
Guidelines:
- Be respectful and dignified
- Use appropriate Catholic terminology if religious content is requested
- Avoid clichés while maintaining tradition
- Focus on celebrating the life lived
- Include specific details provided to personalize the obituary
- Keep sentences clear and readable
- Organize chronologically or by life themes
- End with service information placeholder if not provided
${includeReligious ? '- Include appropriate prayers or Catholic references' : '- Keep religious references minimal and universal'}
`;

  return `${basePrompt}\n${guidelines}`;
}

// Format the user prompt with provided information
export function formatUserPrompt(data: ObituaryPrompt): string {
  const sections: string[] = [];
  
  sections.push(`Please write an obituary for ${data.deceasedName}.`);
  
  if (data.dateOfBirth || data.dateOfDeath) {
    sections.push(`Dates: Born ${data.dateOfBirth || '[date]'}, passed away ${data.dateOfDeath || '[date]'}`);
  }
  
  if (data.placeOfBirth || data.placeOfDeath) {
    sections.push(`Places: Born in ${data.placeOfBirth || '[location]'}, passed away in ${data.placeOfDeath || '[location]'}`);
  }
  
  if (data.occupation) {
    sections.push(`Career: ${data.occupation}`);
  }
  
  if (data.education) {
    sections.push(`Education: ${data.education}`);
  }
  
  if (data.militaryService) {
    sections.push(`Military Service: ${data.militaryService}`);
  }
  
  if (data.hobbies) {
    sections.push(`Hobbies and Interests: ${data.hobbies}`);
  }
  
  if (data.survivedBy) {
    sections.push(`Survived by: ${data.survivedBy}`);
  }
  
  if (data.predeceased) {
    sections.push(`Predeceased by: ${data.predeceased}`);
  }
  
  if (data.specialMemories) {
    sections.push(`Special memories or qualities: ${data.specialMemories}`);
  }
  
  return sections.join('\n\n');
}

// Validate and sanitize generated content
export function sanitizeObituaryContent(content: string): string {
  // Remove any inappropriate content or personal information that shouldn't be there
  let sanitized = content;
  
  // Remove email addresses if accidentally included
  sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email]');
  
  // Remove phone numbers if accidentally included
  sanitized = sanitized.replace(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[phone]');
  
  // Ensure proper spacing
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

// Generate content suggestions based on what's missing
export function generateSuggestions(data: ObituaryPrompt): string[] {
  const suggestions: string[] = [];
  
  if (!data.dateOfBirth) {
    suggestions.push("Consider adding the date of birth");
  }
  
  if (!data.placeOfBirth && !data.placeOfDeath) {
    suggestions.push("Include birthplace or place of passing");
  }
  
  if (!data.survivedBy && !data.predeceased) {
    suggestions.push("List surviving family members");
  }
  
  if (!data.specialMemories) {
    suggestions.push("Add personal qualities or cherished memories");
  }
  
  if (!data.occupation && !data.education) {
    suggestions.push("Include career or educational achievements");
  }
  
  if (data.includeReligious) {
    suggestions.push("Consider mentioning church membership or faith activities");
    suggestions.push("Add favorite scripture or prayer if applicable");
  }
  
  return suggestions;
}

// Rate limiting helper
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(userId, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Error messages for user-friendly display
export const AI_ERROR_MESSAGES = {
  RATE_LIMIT: "You've made too many requests. Please wait a moment before trying again.",
  API_ERROR: "Unable to generate content at this time. Please try again later.",
  INVALID_INPUT: "Please provide more information about your loved one.",
  NO_API_KEY: "AI assistance is temporarily unavailable. You can still write the obituary manually.",
  TIMEOUT: "The request is taking longer than expected. Please try again.",
  INAPPROPRIATE: "The generated content needs revision. Please try again with different information."
};