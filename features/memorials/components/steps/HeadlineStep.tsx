'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Sparkles, ChevronRight, Info } from 'lucide-react';
import { Memorial } from '@/types/memorial';
import clsx from 'clsx';

interface HeadlineStepProps {
  data: Memorial;
  updateData: (updates: Partial<Memorial>) => void;
  onNext: () => void;
  onPrevious: () => void;
  errors?: Record<string, string>;
}

// Example headlines for inspiration
const exampleHeadlines = [
  {
    text: "Forever in Our Hearts",
    description: "A timeless expression of eternal love"
  },
  {
    text: "Celebrating a Life of Faith and Family",
    description: "Highlights their devotion and relationships"
  },
  {
    text: "A Life Well Lived",
    description: "Simple and dignified"
  },
  {
    text: "In Loving Memory of a Beautiful Soul",
    description: "Emphasizes their inner beauty"
  },
  {
    text: "Remembering a Beloved [Mother/Father/etc.]",
    description: "Focuses on their family role"
  },
  {
    text: "Rest in Peace with the Angels",
    description: "Spiritual and comforting"
  },
  {
    text: "Gone but Never Forgotten",
    description: "Emphasizes lasting memories"
  },
  {
    text: "A Legacy of Love and Kindness",
    description: "Highlights their impact on others"
  },
  {
    text: "Until We Meet Again in Heaven",
    description: "Catholic faith-centered"
  },
  {
    text: "Cherished Memories of [Name]",
    description: "Personal and warm"
  }
];

const MAX_HEADLINE_LENGTH = 80;

export function HeadlineStep({
  data,
  updateData,
  onNext,
  onPrevious,
  errors = {}
}: HeadlineStepProps) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [showExamples, setShowExamples] = useState(false);
  const { showToast } = useToast();

  // Calculate remaining characters
  const headlineLength = data.headline?.length || 0;
  const remainingChars = MAX_HEADLINE_LENGTH - headlineLength;
  const isNearLimit = remainingChars <= 20;
  const isOverLimit = remainingChars < 0;

  // Generate personalized suggestion based on the name
  const getPersonalizedSuggestion = () => {
    if (data.firstName && data.lastName) {
      return `Celebrating the Life of ${data.firstName} ${data.lastName}`;
    } else if (data.firstName) {
      return `In Loving Memory of ${data.firstName}`;
    }
    return "In Loving Memory";
  };

  // Validate the headline
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!data.headline?.trim()) {
      newErrors.headline = 'Please enter a headline for the memorial';
    } else if (data.headline.length > MAX_HEADLINE_LENGTH) {
      newErrors.headline = `Headline must be ${MAX_HEADLINE_LENGTH} characters or less`;
    } else if (data.headline.trim().length < 10) {
      newErrors.headline = 'Headline should be at least 10 characters';
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    } else {
      showToast('Please enter a valid headline', 'error');
    }
  };

  const handleExampleClick = (example: string) => {
    // Replace [Name] or [Mother/Father/etc.] with actual name or relationship
    let personalizedHeadline = example;
    
    if (example.includes('[Name]') && data.firstName) {
      personalizedHeadline = example.replace('[Name]', data.firstName);
    } else if (example.includes('[Mother/Father/etc.]')) {
      // This could be enhanced with a relationship field
      personalizedHeadline = example.replace('[Mother/Father/etc.]', 'Friend');
    }
    
    updateData({ headline: personalizedHeadline });
    setShowExamples(false);
    showToast('Headline updated', 'success');
  };

  const handleInputChange = (value: string) => {
    // Allow typing but show error if over limit
    updateData({ headline: value });
    
    // Clear error when user starts fixing it
    if (localErrors.headline && value.length <= MAX_HEADLINE_LENGTH) {
      setLocalErrors({});
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Memorial Headline
        </h2>
        <p className="text-gray-600">
          Create a meaningful headline that captures the essence of your loved one's memory.
        </p>
      </div>

      {/* Main Input Card */}
      <Card>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Headline <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    value={data.headline || ''}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={getPersonalizedSuggestion()}
                    error={localErrors.headline || errors?.headline}
                    className={clsx(
                      "text-lg",
                      isOverLimit && "border-red-500 focus:border-red-500"
                    )}
                    maxLength={MAX_HEADLINE_LENGTH + 20} // Allow some overflow for better UX
                  />
                  
                  {/* Character counter */}
                  <div className={clsx(
                    "absolute right-2 top-2 text-xs font-medium",
                    isOverLimit ? "text-red-600" : 
                    isNearLimit ? "text-amber-600" : 
                    "text-gray-400"
                  )}>
                    {headlineLength}/{MAX_HEADLINE_LENGTH}
                  </div>
                </div>
              </div>
            </div>

            {/* Character limit helper text */}
            <div className={clsx(
              "flex items-start gap-2 text-sm",
              isOverLimit ? "text-red-600" : "text-gray-500"
            )}>
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                {isOverLimit 
                  ? `Please shorten your headline by ${Math.abs(remainingChars)} character${Math.abs(remainingChars) === 1 ? '' : 's'}`
                  : `${remainingChars} character${remainingChars === 1 ? '' : 's'} remaining`
                }
              </span>
            </div>

            {/* Personalized suggestion button */}
            {!data.headline && data.firstName && (
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={() => updateData({ headline: getPersonalizedSuggestion() })}
                className="text-marianBlue"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Use suggested headline
              </Button>
            )}
          </div>

          {/* Preview of how it will look */}
          {data.headline && (
            <div className="border-t pt-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-2xl md:text-3xl font-serif text-center text-gray-900">
                  {data.headline}
                </h3>
                {data.firstName && data.lastName && (
                  <p className="text-center text-gray-600 mt-2">
                    {data.firstName} {data.middleName} {data.lastName}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Example Headlines Card */}
      <Card>
        <div className="p-6">
          <button
            type="button"
            onClick={() => setShowExamples(!showExamples)}
            className="w-full flex items-center justify-between text-left group"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-marianBlue transition-colors">
                Need Inspiration?
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                View example headlines to help you get started
              </p>
            </div>
            <ChevronRight 
              className={clsx(
                "w-5 h-5 text-gray-400 transition-transform",
                showExamples && "rotate-90"
              )}
            />
          </button>

          {showExamples && (
            <div className="mt-6 space-y-3">
              <div className="grid gap-3">
                {exampleHeadlines.map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleExampleClick(example.text)}
                    className="text-left p-4 rounded-lg border border-gray-200 hover:border-marianBlue hover:bg-blue-50 transition-all group"
                  >
                    <p className="font-medium text-gray-900 group-hover:text-marianBlue">
                      "{example.text}"
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {example.description}
                    </p>
                  </button>
                ))}
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-liturgicalGold mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Tip:</span> The best headlines are personal and meaningful. 
                    Feel free to modify any example to better reflect your loved one's unique story.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Writing Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-liturgicalGold" />
            Writing Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span>Keep it concise but meaningful - aim for 30-60 characters</span>
            </li>
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span>Consider using their role (Mother, Grandfather, Friend) or a quality they embodied</span>
            </li>
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span>Religious phrases can provide comfort and reflect faith</span>
            </li>
            <li className="flex items-start">
              <span className="text-marianBlue mr-2">•</span>
              <span>It's okay to keep it simple - sometimes less is more</span>
            </li>
          </ul>
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onPrevious}
        >
          Back to Basic Info
        </Button>
        
        <Button
          type="button"
          variant="primary"
          onClick={handleNext}
          disabled={isOverLimit}
        >
          Continue to Obituary
        </Button>
      </div>
    </div>
  );
}