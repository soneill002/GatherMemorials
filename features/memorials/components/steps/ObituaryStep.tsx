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
  Briefcase,
  AlertCircle,
  CheckCircle,
  X,
  Calendar,
  MapPin,
  GraduationCap,
  Shield
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

interface AIFormData {
  deceasedName: string;
  dateOfBirth: string;
  dateOfDeath: string;
  placeOfBirth: string;
  placeOfDeath: string;
  occupation: string;
  education: string;
  militaryService: string;
  hobbies: string;
  survivedBy: string;
  predeceased: string;
  specialMemories: string;
  tone: 'traditional' | 'celebratory' | 'simple' | 'detailed';
  includeReligious: boolean;
}

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { showToast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AI form state
  const [aiFormData, setAiFormData] = useState<AIFormData>({
    deceasedName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    dateOfBirth: data.birthDate || '',
    dateOfDeath: data.deathDate || '',
    placeOfBirth: '',
    placeOfDeath: '',
    occupation: '',
    education: '',
    militaryService: '',
    hobbies: '',
    survivedBy: '',
    predeceased: '',
    specialMemories: '',
    tone: 'traditional',
    includeReligious: true
  });

  // Calculate word count
  useEffect(() => {
    const words = (data.obituary || '').trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [data.obituary]);

  // Check AI availability on mount
  useEffect(() => {
    checkAIAvailability();
  }, []);

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

  const checkAIAvailability = async () => {
    try {
      const response = await fetch('/api/ai/obituary', {
        method: 'GET',
        credentials: 'include'
      });
      const result = await response.json();
      setAiAvailable(result.available);
    } catch (error) {
      setAiAvailable(false);
    }
  };

  const handleGenerateObituary = async () => {
    setIsGenerating(true);
    setAiError(null);
    setStreamedContent('');
    setSuggestions([]);

    try {
      const response = await fetch('/api/ai/obituary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...aiFormData,
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate obituary');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulatedContent = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.done) {
                  setSuggestions(data.suggestions || []);
                } else if (data.content) {
                  accumulatedContent += data.content;
                  setStreamedContent(accumulatedContent);
                }
              } catch (e) {
                console.error('Error parsing stream data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating obituary:', error);
      setAiError(error instanceof Error ? error.message : 'Failed to generate obituary');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptAIContent = () => {
    updateData({ obituary: streamedContent });
    setShowAIAssistant(false);
    setStreamedContent('');
    showToast('AI obituary added! Feel free to edit and personalize.', 'success');
  };

  const handleAppendAIContent = () => {
    const currentText = data.obituary || '';
    updateData({ obituary: currentText ? `${currentText}\n\n${streamedContent}` : streamedContent });
    setStreamedContent('');
    showToast('AI content appended to obituary', 'success');
  };

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
        {aiAvailable && (
          <Button
            type="button"
            variant="primary"
            onClick={() => setShowAIAssistant(true)}
            icon={Sparkles}
          >
            AI Writing Assistant
          </Button>
        )}
        
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
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <h3 className="text-xl font-serif">AI Obituary Assistant</h3>
                </div>
                <button
                  onClick={() => {
                    setShowAIAssistant(false);
                    setStreamedContent('');
                    setSuggestions([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!isGenerating && !streamedContent && (
                <>
                  <p className="text-gray-600 mb-6">
                    Provide information about your loved one and I'll help you write a meaningful obituary.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left column - Basic Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Basic Information
                      </h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={aiFormData.deceasedName}
                          onChange={(e) => setAiFormData({...aiFormData, deceasedName: e.target.value})}
                          placeholder="John Michael Smith"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={aiFormData.dateOfBirth}
                            onChange={(e) => setAiFormData({...aiFormData, dateOfBirth: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Date of Death
                          </label>
                          <input
                            type="date"
                            value={aiFormData.dateOfDeath}
                            onChange={(e) => setAiFormData({...aiFormData, dateOfDeath: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Place of Birth
                        </label>
                        <input
                          type="text"
                          value={aiFormData.placeOfBirth}
                          onChange={(e) => setAiFormData({...aiFormData, placeOfBirth: e.target.value})}
                          placeholder="Boston, Massachusetts"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Place of Death
                        </label>
                        <input
                          type="text"
                          value={aiFormData.placeOfDeath}
                          onChange={(e) => setAiFormData({...aiFormData, placeOfDeath: e.target.value})}
                          placeholder="Philadelphia, Pennsylvania"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          Occupation/Career
                        </label>
                        <input
                          type="text"
                          value={aiFormData.occupation}
                          onChange={(e) => setAiFormData({...aiFormData, occupation: e.target.value})}
                          placeholder="Teacher, Engineer, Nurse..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          Education
                        </label>
                        <input
                          type="text"
                          value={aiFormData.education}
                          onChange={(e) => setAiFormData({...aiFormData, education: e.target.value})}
                          placeholder="University of Pennsylvania, BS in Engineering"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Right column - Personal Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Personal Details
                      </h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Survived By
                        </label>
                        <textarea
                          value={aiFormData.survivedBy}
                          onChange={(e) => setAiFormData({...aiFormData, survivedBy: e.target.value})}
                          rows={3}
                          placeholder="Wife Mary, children John Jr. and Sarah, 5 grandchildren..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Predeceased By
                        </label>
                        <textarea
                          value={aiFormData.predeceased}
                          onChange={(e) => setAiFormData({...aiFormData, predeceased: e.target.value})}
                          rows={2}
                          placeholder="Parents William and Elizabeth, brother Thomas..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Military Service
                        </label>
                        <input
                          type="text"
                          value={aiFormData.militaryService}
                          onChange={(e) => setAiFormData({...aiFormData, militaryService: e.target.value})}
                          placeholder="US Army, Vietnam War veteran..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hobbies & Interests
                        </label>
                        <textarea
                          value={aiFormData.hobbies}
                          onChange={(e) => setAiFormData({...aiFormData, hobbies: e.target.value})}
                          rows={2}
                          placeholder="Gardening, woodworking, volunteering at church..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Special Memories & Qualities
                        </label>
                        <textarea
                          value={aiFormData.specialMemories}
                          onChange={(e) => setAiFormData({...aiFormData, specialMemories: e.target.value})}
                          rows={3}
                          placeholder="Known for his kindness, devoted to family, active in parish..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tone and Options */}
                  <div className="mt-6 space-y-4 border-t pt-6">
                    <div className="flex gap-6">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Writing Tone
                        </label>
                        <select
                          value={aiFormData.tone}
                          onChange={(e) => setAiFormData({...aiFormData, tone: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="traditional">Traditional & Formal</option>
                          <option value="celebratory">Celebratory & Joyful</option>
                          <option value="simple">Simple & Brief</option>
                          <option value="detailed">Detailed & Comprehensive</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="includeReligious"
                          checked={aiFormData.includeReligious}
                          onChange={(e) => setAiFormData({...aiFormData, includeReligious: e.target.checked})}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor="includeReligious" className="text-sm text-gray-700 flex items-center gap-1">
                          <Church className="h-4 w-4" />
                          Include Catholic faith references
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* AI Error */}
              {aiError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error generating obituary</p>
                    <p className="text-sm text-red-600 mt-1">{aiError}</p>
                  </div>
                </div>
              )}

              {/* Generated Content */}
              {(isGenerating || streamedContent) && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                    <h4 className="font-medium">Generated Obituary</h4>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg min-h-[300px] whitespace-pre-wrap font-serif">
                    {streamedContent || (
                      <div className="flex items-center justify-center h-[300px] text-gray-400">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Suggestions for Improvement:</h5>
                      <ul className="space-y-1">
                        {suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowAIAssistant(false);
                    setStreamedContent('');
                    setSuggestions([]);
                    setAiError(null);
                  }}
                >
                  Cancel
                </Button>
                
                {!streamedContent && (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleGenerateObituary}
                    disabled={isGenerating || !aiFormData.deceasedName}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Obituary
                      </>
                    )}
                  </Button>
                )}
                
                {streamedContent && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAppendAIContent}
                    >
                      Add to Existing
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAcceptAIContent}
                    >
                      Use This Obituary
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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