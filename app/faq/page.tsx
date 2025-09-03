'use client';

import { Metadata } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I create a memorial page?",
        a: "Creating a memorial is simple. Click 'Create Memorial' and follow our 9-step process. You'll add information about your loved one, upload photos, and customize the page. The entire process takes about 15-20 minutes."
      },
      {
        q: "How much does it cost?",
        a: "GatherMemorials costs $149 for a lifetime memorial page. This one-time payment includes unlimited photos, videos, guestbook entries, and permanent hosting with no recurring fees."
      },
      {
        q: "Can I preview the memorial before paying?",
        a: "Yes! You can complete the entire creation process and preview your memorial before making payment. Your work is automatically saved as you go."
      }
    ]
  },
  {
    category: "Features",
    questions: [
      {
        q: "What can I include on a memorial page?",
        a: "Memorial pages can include: a main photo, obituary, life story, photo gallery (unlimited photos), videos, service information, guestbook for condolences, donation links to charities, and prayer requests."
      },
      {
        q: "Can visitors leave messages?",
        a: "Yes, memorial pages include a guestbook where visitors can share memories and condolences. You can moderate all entries before they appear publicly."
      },
      {
        q: "Is there a limit on photos or videos?",
        a: "No, you can upload unlimited photos and videos to your memorial page. Each file can be up to 100MB."
      },
      {
        q: "Can I add the memorial to a prayer list?",
        a: "Yes, visitors can add your loved one to their personal prayer list and set reminders for special dates like anniversaries."
      }
    ]
  },
  {
    category: "Privacy & Access",
    questions: [
      {
        q: "Who can view the memorial page?",
        a: "You control the privacy settings. Memorials can be public (searchable), private (link-only access), or password-protected for family and friends only."
      },
      {
        q: "Can I edit the memorial after it's published?",
        a: "Yes, you can edit and update the memorial at any time. Add new photos, update information, or change privacy settings whenever needed."
      },
      {
        q: "Will there be ads on the memorial page?",
        a: "Never. We believe memorial pages should be respectful spaces. There will never be advertisements on any memorial page."
      }
    ]
  },
  {
    category: "Technical",
    questions: [
      {
        q: "How long will the memorial page last?",
        a: "Forever. Your one-time payment ensures the memorial page remains online permanently with no recurring fees or expiration dates."
      },
      {
        q: "Can I download or print the memorial?",
        a: "Yes, memorial pages are optimized for printing. You can also export all content and photos at any time."
      },
      {
        q: "What if I need help creating the memorial?",
        a: "We offer AI-powered assistance to help write obituaries and life stories. Our support team is also available to help with any questions."
      },
      {
        q: "Is the site mobile-friendly?",
        a: "Yes, all memorial pages are fully responsive and look beautiful on phones, tablets, and computers."
      }
    ]
  }
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-serif text-blue-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-700">
            Everything you need to know about creating a memorial on GatherMemorials
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-2xl font-serif text-blue-900 mb-6">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((item, itemIndex) => {
                  const itemId = `${categoryIndex}-${itemIndex}`;
                  const isOpen = openItems.includes(itemId);
                  
                  return (
                    <div
                      key={itemIndex}
                      className="bg-white rounded-lg shadow-md overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(itemId)}
                        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-blue-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900 pr-4">
                          {item.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-blue-900 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-blue-900 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-700 leading-relaxed">
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-50/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-serif text-blue-900 mb-6">
            Still have questions?
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            We&apos;re here to help you create a beautiful memorial for your loved one
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-blue-900 px-8 py-4 rounded-lg border-2 border-blue-900 hover:bg-blue-50 transition-colors font-medium"
            >
              Contact Support
            </Link>
            <Link
              href="/memorials/new"
              className="bg-blue-900 text-white px-8 py-4 rounded-lg hover:bg-blue-800 transition-colors font-medium"
            >
              Start Creating
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}