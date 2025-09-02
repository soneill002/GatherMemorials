// Catholic-appropriate prompts and templates for AI obituary generation

export const EXAMPLE_OBITUARIES = {
  traditional: `
It is with heavy hearts that we announce the passing of [Name], who entered into eternal rest on [Date] at the age of [Age]. Born in [Birthplace] on [Birth Date], [he/she] was a beloved [spouse/parent/grandparent] and faithful servant of God.

[Name] dedicated [his/her] life to [career/calling], serving with distinction for [years]. [He/She] was a graduate of [education] and took great pride in [accomplishments]. A devout Catholic and active member of [Parish], [he/she] found strength and comfort in faith throughout [his/her] life.

[Name] is survived by [family members]. [He/She] was preceded in death by [predeceased]. [He/She] will be remembered for [qualities and memories].

A Mass of Christian Burial will be celebrated at [Church] on [Date]. In lieu of flowers, memorial donations may be made to [charity]. May perpetual light shine upon [him/her].
`,

  celebratory: `
With grateful hearts for a life well-lived, we celebrate the life of [Name], who peacefully went home to the Lord on [Date] at the age of [Age], surrounded by loving family.

[Name]'s journey began in [Birthplace] on [Birth Date], and what a remarkable journey it was! [He/She] touched countless lives through [career/passion], bringing joy and [qualities] to everyone [he/she] met. Whether [activities/hobbies], [Name] approached life with enthusiasm and faith.

A devoted [spouse/parent] and cherished [role], [Name] created a legacy of love that lives on through [family]. [His/Her] faith was the cornerstone of [his/her] life, finding joy in serving at [Parish] and [religious activities].

[Name] leaves behind [survivors] to carry on [his/her] beautiful spirit. [He/She] joins [predeceased] in God's eternal kingdom.

Join us in celebrating [Name]'s life at a Memorial Mass at [Church] on [Date]. In the spirit of [Name]'s generosity, donations to [charity] are welcomed. Until we meet again in paradise!
`,

  simple: `
[Name], age [Age], of [Location], passed away peacefully on [Date]. 

Born [Birth Date] in [Birthplace], [Name] was a [occupation] and devoted [family role]. [He/She] was a member of [Parish] and enjoyed [hobbies/interests].

Survived by [family members]. Preceded in death by [predeceased].

Services will be held at [Church] on [Date]. Memorial donations may be made to [charity].

May [he/she] rest in peace.
`,

  detailed: `
[Full Name], a beloved [roles] and pillar of the [Community] community, peacefully entered eternal life on [Date] at the age of [Age], after [circumstances if appropriate].

Born on [Birth Date] in [Birthplace] to [parents if known], [Name] grew up [childhood details]. [He/She] graduated from [schools] and went on to [career path], where [he/she] [career achievements]. [His/Her] professional life was marked by [qualities], earning the respect and admiration of [colleagues/community].

On [Marriage Date], [Name] married the love of [his/her] life, [Spouse Name], and together they built a beautiful family, welcoming [children details]. As a [parent role], [Name] [parenting qualities and activities]. [He/She] delighted in [family activities] and taught [his/her] children [values].

Faith was central to [Name]'s life. A devoted parishioner of [Parish] for [years], [he/she] served as [church roles]. [His/Her] faith was evident in [examples of faith in action]. [Name] found great comfort in [religious practices] and lived by the principle of [favorite scripture or motto].

[Name] had a passion for [hobbies and interests], and was known for [personal qualities]. Friends remember [him/her] as [friend qualities], always ready to [characteristic actions]. [He/She] volunteered with [organizations] and supported [causes].

[Name] is survived by [detailed list of survivors with relationships]. [He/She] was preceded in death by [predeceased with relationships]. [His/Her] legacy lives on through [specific legacy mentions].

Visitation will be held at [Funeral Home] on [Date and Time]. A Mass of Christian Burial will be celebrated at [Church] on [Date and Time], with [Celebrant] officiating. Interment will follow at [Cemetery]. 

In lieu of flowers, the family requests donations be made to [charity/cause], a cause dear to [Name]'s heart.

The family wishes to express their gratitude to [acknowledgments].

May the angels lead [him/her] into paradise, and may perpetual light shine upon [him/her].
`
};

export const CATHOLIC_ELEMENTS = {
  openingPhrases: [
    "entered into eternal rest",
    "was called home to the Lord",
    "peacefully went to be with our Savior",
    "joined the communion of saints",
    "was welcomed into God's eternal kingdom",
    "returned to the loving arms of our Creator"
  ],
  
  closingPhrases: [
    "May perpetual light shine upon them.",
    "Eternal rest grant unto them, O Lord.",
    "May their soul rest in peace.",
    "Until we meet again in God's heavenly kingdom.",
    "May the angels lead them into paradise.",
    "Rest in the peace of Christ."
  ],
  
  faithDescriptions: [
    "devout Catholic",
    "faithful servant of God",
    "devoted parishioner",
    "person of deep faith",
    "committed to their faith",
    "guided by Catholic values"
  ],
  
  serviceTypes: [
    "Mass of Christian Burial",
    "Funeral Mass",
    "Memorial Mass",
    "Celebration of Life Mass",
    "Requiem Mass"
  ],
  
  scriptureReferences: [
    "John 14:2 - 'In my Father's house are many rooms'",
    "Psalm 23 - 'The Lord is my shepherd'",
    "2 Timothy 4:7 - 'I have fought the good fight'",
    "Revelation 21:4 - 'He will wipe every tear from their eyes'",
    "Romans 14:8 - 'Whether we live or die, we are the Lord's'"
  ]
};

export const WRITING_TIPS = [
  "Start with the full name and age for clarity",
  "Include dates in a consistent format",
  "List survivors in order: spouse, children, grandchildren, siblings, parents",
  "Mention church membership and faith activities",
  "Include career highlights and education",
  "Add personal qualities and hobbies to paint a complete picture",
  "Provide clear service information with dates, times, and locations",
  "Suggest memorial donations if desired",
  "Keep the tone respectful and appropriate to the family's wishes",
  "Proofread for accuracy, especially names and dates"
];

export const TONE_DESCRIPTIONS = {
  traditional: "Formal and reverent, following classic obituary conventions with appropriate Catholic references",
  celebratory: "Uplifting and joyful while remaining respectful, focusing on celebrating a life well-lived",
  simple: "Brief and straightforward, covering essential information without extensive detail",
  detailed: "Comprehensive and thorough, providing a complete life story with rich detail and context"
};

// Helper function to generate context-aware suggestions
export function generateContextualSuggestions(data: any): string[] {
  const suggestions: string[] = [];
  
  // Check for missing critical information
  if (!data.dateOfBirth && !data.dateOfDeath) {
    suggestions.push("Adding specific dates helps readers understand the timeline of their life");
  }
  
  if (!data.survivedBy && !data.predeceased) {
    suggestions.push("Including family members helps readers understand their connections");
  }
  
  if (!data.occupation && !data.education) {
    suggestions.push("Mentioning career or education provides context about their life's work");
  }
  
  if (!data.hobbies && !data.specialMemories) {
    suggestions.push("Personal interests and qualities make the obituary more meaningful");
  }
  
  if (data.includeReligious && !data.specialMemories?.includes('church') && !data.specialMemories?.includes('faith')) {
    suggestions.push("Consider mentioning their church involvement or faith journey");
  }
  
  // Add tone-specific suggestions
  switch (data.tone) {
    case 'traditional':
      suggestions.push("Traditional obituaries often include the cause of death if the family wishes");
      break;
    case 'celebratory':
      suggestions.push("Include specific anecdotes or achievements that showcase their personality");
      break;
    case 'simple':
      suggestions.push("Focus on the most essential information for a concise tribute");
      break;
    case 'detailed':
      suggestions.push("Consider adding information about their parents, childhood, or life philosophy");
      break;
  }
  
  return suggestions;
}

// Validation helpers
export function validateObituaryContent(content: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check minimum length
  if (content.length < 100) {
    issues.push("The obituary seems too short. Consider adding more detail.");
  }
  
  // Check maximum length
  if (content.length > 5000) {
    issues.push("The obituary is quite long. Consider condensing some sections.");
  }
  
  // Check for placeholder text
  const placeholders = ['[Name]', '[Date]', '[Location]', '[Church]'];
  placeholders.forEach(placeholder => {
    if (content.includes(placeholder)) {
      issues.push(`Please replace ${placeholder} with actual information`);
    }
  });
  
  // Check for potentially sensitive content
  const sensitiveTerms = ['suicide', 'murdered', 'overdose', 'addiction'];
  sensitiveTerms.forEach(term => {
    if (content.toLowerCase().includes(term)) {
      issues.push(`Contains potentially sensitive content: "${term}". Please review carefully.`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
}