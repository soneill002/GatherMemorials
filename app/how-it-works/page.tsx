import { Metadata } from 'next';
import Link from 'next/link';
import { 
  User, 
  FileText, 
  PenTool, 
  Calendar, 
  Heart, 
  Image, 
  MessageSquare, 
  Lock, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works - GatherMemorials',
  description: 'Learn how to create a beautiful digital memorial in 9 simple steps.',
};

const steps = [
  {
    icon: User,
    title: "Basic Information",
    description: "Start with essential details like name, dates, and location. This forms the foundation of your memorial page.",
    details: ["Full name", "Birth and passing dates", "Location", "Main photo"]
  },
  {
    icon: FileText,
    title: "Headline & Summary",
    description: "Create a meaningful headline that captures their essence, and write a brief summary of their life.",
    details: ["Memorial headline", "Short life summary", "Key accomplishments", "Character traits"]
  },
  {
    icon: PenTool,
    title: "Life Story & Obituary",
    description: "Share their full story with our AI-assisted editor that helps you create a beautiful tribute.",
    details: ["AI writing assistance", "Obituary text", "Life achievements", "Personal stories"]
  },
  {
    icon: Calendar,
    title: "Service Information",
    description: "Add details about memorial services, celebrations of life, or other gatherings.",
    details: ["Service dates & times", "Location details", "Virtual attendance options", "Special instructions"]
  },
  {
    icon: Heart,
    title: "Donation Links",
    description: "Honor their memory by linking to charities or causes they cared about.",
    details: ["Charity selection", "Custom donation messages", "Multiple organizations", "In lieu of flowers options"]
  },
  {
    icon: Image,
    title: "Photo & Video Gallery",
    description: "Upload unlimited photos and videos to celebrate their life journey.",
    details: ["Unlimited uploads", "Photo captions", "Video memories", "Automatic organization"]
  },
  {
    icon: MessageSquare,
    title: "Guestbook Settings",
    description: "Enable visitors to share memories and condolences with moderation controls.",
    details: ["Message moderation", "Email notifications", "Public or private entries", "Thank you messages"]
  },
  {
    icon: Lock,
    title: "Privacy & Access",
    description: "Control who can view the memorial with flexible privacy options.",
    details: ["Public or private", "Password protection", "Share settings", "Search visibility"]
  },
  {
    icon: CheckCircle,
    title: "Review & Publish",
    description: "Preview your memorial, make any final adjustments, and publish when ready.",
    details: ["Live preview", "Edit options", "Payment processing", "Instant publishing"]
  }
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-serif text-blue-900 mb-6">
            How It Works
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Create a beautiful memorial in 9 simple steps. Our guided process makes it easy to 
            honor your loved one with a lasting digital tribute.
          </p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="bg-white rounded-lg shadow-lg p-6 h-full">
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                        <Icon className="w-6 h-6 text-blue-900" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-blue-900 font-semibold">
                          Step {index + 1}
                        </div>
                        <h3 className="text-xl font-serif text-gray-900">
                          {step.title}
                        </h3>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">
                      {step.description}
                    </p>
                    
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start">
                          <span className="text-amber-600 mr-2">•</span>
                          <span className="text-sm text-gray-600">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-serif text-blue-900 mb-12 text-center">
            What Makes GatherMemorials Special
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">
                  Save As You Go
                </h3>
                <p className="text-gray-700">
                  Your work is automatically saved. Take breaks and return anytime to continue 
                  where you left off.
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-amber-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">
                  AI Assistance
                </h3>
                <p className="text-gray-700">
                  Get help writing obituaries and life stories with our respectful AI assistant 
                  that maintains your voice.
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">
                  Preview Before Payment
                </h3>
                <p className="text-gray-700">
                  See exactly how your memorial will look before making any payment. Make it 
                  perfect at your own pace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-serif text-blue-900 mb-6">
            Ready to Begin?
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Create a lasting tribute that celebrates a life well-lived. 
            Our caring team is here to support you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/memorials/new"
              className="bg-blue-900 text-white px-8 py-4 rounded-lg hover:bg-blue-800 transition-colors font-medium inline-flex items-center justify-center"
            >
              Start Creating Memorial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/faq"
              className="bg-white text-blue-900 px-8 py-4 rounded-lg border-2 border-blue-900 hover:bg-blue-50 transition-colors font-medium"
            >
              View FAQs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}