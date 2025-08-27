'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { 
  Sparkles, 
  Save, 
  FileText, 
  Bold,
  Italic,
  List,
  Quote,
  Undo,
  Redo,
  Loader2,
  Info,
  ChevronRight,
  Heart,
  Church,
  Users,
  Briefcase
} from 'lucide-react';
import { Memorial } from '@/types/memorial';
import clsx from 'clsx';

interface ObituaryStepProps {
  data: Memorial;
  updateData: (updates: Partial<Memorial>) => void;
  onNext: () => void;
  onPrevious: () => void;
  errors?: Record<string, string>;
}

// AI Prompt templates for different approaches
const aiPromptTemplates = [
  {
    id: 'traditional',
    title: 'Traditional Catholic',
    icon: Church,
    description: 'Formal obituary with faith elements',
    prompts: [
      'Include their Catholic faith journey',
      'Mention parish involvement',
      'Add favorite prayers or saints',
      'Include sacraments received'
    ]
  },
  {
    id: 'life-story',
    title: 'Life Story',
    icon: Heart,
    description: 'Chronological life narrative',
    prompts: [
      'Where were they born and raised?',
      'What was their education?',
      'Career and accomplishments?',
      'How did they meet their spouse?'
    ]
  },
  {
    id: 'family-focused',
    title: 'Family Focused',
    icon: Users,
    description: 'Emphasize relationships',
    prompts: [
      'Role as parent/grandparent',
      'Family traditions they started',
      'Favorite family memories',
      'Legacy for future generations'
    ]
  },
  {
    id: 'accomplishments',
    title: 'Accomplishments',
    icon: Briefcase,
    description: 'Highlight achievements',
    prompts: [
      'Professional achievements',
      'Community service',
      'Hobbies and passions',
      'Impact on others'
    ]
  }
];

// Example obituary snippets for inspiration
const exampleSnippets = [
  {
    category: 'Opening',
    examples: [
      'It is with heavy hearts that we announce the passing of [Name], who was called home to the Lord on [Date].',
      '[Name] passed away peacefully on [Date], surrounded by loving family.',
      'With faith in the resurrection, we commend to God\'s mercy [Name], who entered eternal life on [Date].'
    ]
  },
  {
    category: 'Faith',
    examples: [
      'A devout Catholic, [he/she] was a longtime member of [Parish Name].',
      '[He/She] found great comfort in daily prayer and the rosary.',
      '[His/Her] faith was the cornerstone of [his/her] life, guiding every decision with love and compassion.'
    ]
  },
  {
    category: 'Character',
    examples: [
      '[Name] will be remembered for [his/her] generous spirit and warm smile.',
      '[He/She] had a gift for making everyone feel special and loved.',
      'Known for [his/her] quick wit and infectious laughter, [Name] brought joy to all who knew [him/her].'
    ]
  },
  {
    category: 'Closing',
    examples: [
      'May [his/her] soul and the souls of all the faithful departed, through the mercy of God, rest in peace.',
      '[Name]\'s memory will live on in the hearts of all who loved [him/her].',
      'In lieu of flowers, donations may be made to [Charity/Church] in [Name]\'s memory.'
    ]
  }
];

const MIN_WORDS = 50;
const SUGGESTED_WORDS = 150;
const MAX_WORDS = 1000;

export function ObituaryStep({
  data,
  updateData,
  onNext,
  onPrevious,
  errors = {}
}: ObituaryStepProps) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate word count
  useEffect(() => {
    const words = (data.obituary || '').trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [data.obituary]);

  // Auto-save draft
  useEffect(() => {
    if (data.obituary && data.obituary !== data.obituaryDraft) {
      const timer = setTimeout(() => {
        updateData({ obituaryDraft: data.obituary });
        setLastSaved(new Date());
        showToast('Draft saved', 'success');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [data.obituary]);

  // Validate the obituary
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!data.obituary?.trim()) {
      newErrors.obituary = 'Please write an obituary for the memorial';
    } else if (wordCount < MIN_WORDS) {
      newErrors.obituary = `Obituary should be at least ${MIN_WORDS} words (currently ${wordCount})`;
    } else if (wordCount > MAX_WORDS) {
      newErrors.obituary = `Obituary should be no more than ${MAX_WORDS} words (currently ${wordCount})`;
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    } else {
      showToast('Please complete the obituary', 'error');
    }
  };

  // Format toolbar actions
  const handleFormat = (format: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = selectedText ? `**${selectedText}**` : '**bold text**';
        break;
      case 'italic':
        formattedText = selectedText ? `*${selectedText}*` : '*italic text*';
        break;
      case 'quote':
        formattedText = selectedText ? `\n> ${selectedText}\n` : '\n> quote\n';
        break;
      case 'list':
        formattedText = selectedText 
          ? selectedText.split('\n').map(line => `• ${line}`).join('\n')
          : '• List item';
        break;
    }
    
    const newValue = 
      textarea.value.substring(0, start) + 
      formattedText + 
      textarea.value.substring(end);
    
    updateData({ obituary: newValue });
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + formattedText.length,
        start + formattedText.length
      );
    }, 0);
  };

  // Generate AI content (mock for now)
  const handleGenerateAI = async () => {
    if (!selectedTemplate) {
      showToast('Please select a template first', 'warning');
      return;
    }

    setIsGenerating(true);
    
    // Mock AI generation - replace with actual OpenAI API call
    setTimeout(() => {
      const template = aiPromptTemplates.find(t => t.id === selectedTemplate);
      const mockObituary = `${data.firstName} ${data.lastName} passed away peacefully on ${data.deathDate}. 

A devoted ${template?.title.toLowerCase()} individual, ${data.firstName} lived a life filled with love, faith, and dedication to family.

Born on ${data.birthDate}, ${data.firstName} grew up with strong Catholic values that guided ${data.firstName === 'Mary' || data.firstName === 'Sarah' ? 'her' : 'his'} throughout life.

[This is where the AI would generate personalized content based on your answers to the prompts]

${data.firstName} is survived by loving family members and countless friends whose lives were touched by ${data.firstName === 'Mary' || data.firstName === 'Sarah' ? 'her' : 'his'} kindness and generosity.

May ${data.firstName}'s soul and the souls of all the faithful departed, through the mercy of God, rest in peace. Amen.`;

      updateData({ obituary: mockObituary });
      setShowAIAssistant(false);
      setIsGenerating(false);
      showToast('AI obituary generated! Feel free to edit and personalize.', 'success');
    }, 2000);
  };

  // Insert example snippet
  const insertSnippet = (snippet: string) => {
    const personalized = snippet
      .replace('[Name]', data.firstName || '[Name]')
      .replace('[Date]', data.deathDate ? new Date(data.deathDate).toLocaleDateString() : '[Date]')
      .replace('[he/she]', 'they')
      .replace('[He/She]', 'They')
      .replace('[his/her]', 'their')
      .replace('[His/Her]', 'Their')
      .replace('[him/her]', 'them');
    
    const currentText = data.obituary || '';
    updateData({ obituary: currentText + (currentText ? '\n\n' : '') + personalized });
    setShowExamples(false);
    showToast('Snippet added to obituary', 'success');
  };

  const getWordCountColor = () => {
    if (wordCount < MIN_WORDS) return 'text-red-600';
    if (wordCount > MAX_WORDS) return 'text-red-600';
    if (wordCount < SUGGESTED_WORDS) return 'text-amber-600';
    return 'text-green-600';
  };

  const getWordCountMessage = () => {
    if (wordCount < MIN_WORDS) return `Minimum ${MIN_WORDS} words required`;
    if (wordCount > MAX_WORDS) return `Maximum ${MAX_WORDS} words exceeded`;
    if (wordCount < SUGGESTED_WORDS) return `Aim for ${SUGGESTED_WORDS}+ words for a complete obituary`;
    return 'Good length!';
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Obituary
        </h2>
        <p className="text-gray-600">
          Write a meaningful obituary to honor your loved one's life and legacy.
        </p>
      </div>

      {/* AI Assistant Button */}
      <div className="flex flex-wrap gap-4">
        <Button
          type="button"
          variant="primary"
          onClick={() => setShowAIAssistant(true)}
          icon={Sparkles}
        >
          Help me write this
        </Button>
        
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowExamples(!showExamples)}
        >
          <FileText className="w-4 h-4 mr-2" />
          Example Snippets
        </Button>
        
        {lastSaved && (
          <div className="flex items-center text-sm text-gray-500">
            <Save className="w-4 h-4 mr-1" />
            Saved {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Example Snippets */}
      {showExamples && (
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Example Snippets</h3>
            {exampleSnippets.map((section) => (
              <div key={section.category}>
                <h4 className="font-medium text-gray-700 mb-2">{section.category}</h4>
                <div className="space-y-2">
                  {section.examples.map((example, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertSnippet(example)}
                      className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-marianBlue transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Editor Card */}
      <Card>
        <div className="border-b">
          {/* Formatting Toolbar */}
          <div className="p-2 flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => handleFormat('bold')}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('italic')}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('list')}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('quote')}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <Textarea
            ref={textareaRef}
            value={data.obituary || ''}
            onChange={(e) => updateData({ obituary: e.target.value })}
            placeholder={`Begin writing about ${data.firstName || 'your loved one'}'s life, legacy, and the impact they had on others...`}
            rows={15}
            className="font-serif text-lg leading-relaxed"
            error={localErrors.obituary || errors?.obituary}
          />
          
          {/* Word Count */}
          <div className={clsx("mt-4 flex justify-between items-center text-sm", getWordCountColor())}>
            <span>{getWordCountMessage()}</span>
            <span className="font-medium">{wordCount} words</span>
          </div>
        </div>
      </Card>

      {/* Writing Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <Info className="w-5 h-5 mr-2 text-liturgicalGold" />
            Writing Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span>Start with announcing their passing and basic information</span>
            </li>
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span>Include their faith journey and church involvement</span>
            </li>
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span>Share their life story - education, career, achievements</span>
            </li>
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span>Highlight their relationships and family</span>
            </li>
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span>Include hobbies, interests, and what brought them joy</span>
            </li>
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span>End with survivors and any memorial preferences</span>
            </li>
          </ul>
        </div>
      </Card>

      {/* AI Assistant Modal */}
      <Modal
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        title="AI Obituary Assistant"
        size="large"
      >
        <div className="space-y-6">
          <p className="text-gray-600">
            Choose a style and answer a few questions to generate a personalized obituary.
          </p>
          
          {/* Template Selection */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Select a Style:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiPromptTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={clsx(
                    "p-4 rounded-lg border-2 text-left transition-all",
                    selectedTemplate === template.id
                      ? "border-marianBlue bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <template.icon className="w-5 h-5 text-marianBlue mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{template.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Prompts for selected template */}
          {selectedTemplate && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Tell us more:</h3>
              <div className="space-y-4">
                {aiPromptTemplates
                  .find(t => t.id === selectedTemplate)
                  ?.prompts.map((prompt, idx) => (
                    <div key={idx}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {prompt}
                      </label>
                      <Textarea
                        value={aiResponses[prompt] || ''}
                        onChange={(e) => setAiResponses({
                          ...aiResponses,
                          [prompt]: e.target.value
                        })}
                        rows={2}
                        placeholder="Optional - leave blank to skip"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAIAssistant(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleGenerateAI}
              disabled={!selectedTemplate || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Obituary
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onPrevious}
        >
          Back to Headline
        </Button>
        
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
        >
          Continue to Service Info
        </Button>
      </div>
    </div>
  );
}