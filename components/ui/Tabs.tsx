'use client';

import { Fragment, useState, createContext, useContext, ReactNode } from 'react';
import { Tab } from '@headlessui/react';
import { clsx } from 'clsx';

// Tab Types
export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

// Context for sharing tab state
interface TabsContextValue {
  variant: 'default' | 'pills' | 'underline' | 'bordered';
  size: 'sm' | 'md' | 'lg';
  fullWidth: boolean;
}

const TabsContext = createContext<TabsContextValue>({
  variant: 'default',
  size: 'md',
  fullWidth: false,
});

// Main Tabs Component
interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  selectedTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  tabListClassName?: string;
  tabPanelClassName?: string;
  children: ReactNode;
}

export function Tabs({
  tabs,
  defaultTab,
  selectedTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
  tabListClassName,
  tabPanelClassName,
  children,
}: TabsProps) {
  const defaultIndex = defaultTab ? tabs.findIndex(t => t.id === defaultTab) : 0;
  const selectedIndex = selectedTab ? tabs.findIndex(t => t.id === selectedTab) : undefined;
  
  const [localSelectedIndex, setLocalSelectedIndex] = useState(defaultIndex);
  const currentIndex = selectedIndex ?? localSelectedIndex;

  const handleChange = (index: number) => {
    const tab = tabs[index];
    if (!tab.disabled) {
      setLocalSelectedIndex(index);
      onChange?.(tab.id);
    }
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const variantListClasses = {
    default: 'bg-gray-100 p-1 rounded-lg',
    pills: 'gap-2',
    underline: 'border-b border-gray-200',
    bordered: 'bg-white border border-gray-200 rounded-lg p-1',
  };

  return (
    <TabsContext.Provider value={{ variant, size, fullWidth }}>
      <Tab.Group
        selectedIndex={currentIndex}
        onChange={handleChange}
        as="div"
        className={clsx('w-full', className)}
      >
        <Tab.List
          className={clsx(
            'flex',
            fullWidth ? 'w-full' : 'inline-flex',
            variantListClasses[variant],
            sizeClasses[size],
            tabListClassName
          )}
        >
          {tabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} />
          ))}
        </Tab.List>
        
        <Tab.Panels className={clsx('mt-4', tabPanelClassName)}>
          {children}
        </Tab.Panels>
      </Tab.Group>
    </TabsContext.Provider>
  );
}

// Individual Tab Button
interface TabButtonProps {
  tab: TabItem;
}

function TabButton({ tab }: TabButtonProps) {
  const { variant, size, fullWidth } = useContext(TabsContext);

  const sizeClasses = {
    sm: 'px-2 py-1 min-h-[28px]',
    md: 'px-3 py-1.5 min-h-[36px]',
    lg: 'px-4 py-2 min-h-[44px]',
  };

  const variantClasses = {
    default: clsx(
      'rounded-md transition-colors',
      'ui-selected:bg-white ui-selected:shadow-sm ui-selected:text-blue-600',
      'ui-not-selected:text-gray-600 ui-not-selected:hover:text-gray-900'
    ),
    pills: clsx(
      'rounded-full transition-all',
      'ui-selected:bg-blue-600 ui-selected:text-white ui-selected:shadow-sm',
      'ui-not-selected:bg-gray-100 ui-not-selected:text-gray-600',
      'ui-not-selected:hover:bg-gray-200'
    ),
    underline: clsx(
      'relative pb-2 transition-colors border-b-2 -mb-px',
      'ui-selected:border-blue-600 ui-selected:text-blue-600',
      'ui-not-selected:border-transparent ui-not-selected:text-gray-600',
      'ui-not-selected:hover:text-gray-900 ui-not-selected:hover:border-gray-300'
    ),
    bordered: clsx(
      'rounded-md transition-colors',
      'ui-selected:bg-blue-600 ui-selected:text-white ui-selected:shadow-sm',
      'ui-not-selected:text-gray-600 ui-not-selected:hover:text-gray-900',
      'ui-not-selected:hover:bg-gray-50'
    ),
  };

  return (
    <Tab
      className={clsx(
        'flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'flex-1',
        tab.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
      disabled={tab.disabled}
    >
      {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
      <span>{tab.label}</span>
      {tab.badge !== undefined && (
        <span className={clsx(
          'inline-flex items-center justify-center rounded-full bg-current/10 font-semibold',
          size === 'sm' && 'px-1.5 py-0.5 text-[10px] min-w-[18px]',
          size === 'md' && 'px-2 py-0.5 text-xs min-w-[20px]',
          size === 'lg' && 'px-2.5 py-0.5 text-sm min-w-[24px]'
        )}>
          {tab.badge}
        </span>
      )}
    </Tab>
  );
}

// Tab Panel Component
export function TabPanel({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <Tab.Panel
      className={clsx(
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg',
        className
      )}
    >
      {children}
    </Tab.Panel>
  );
}

// Vertical Tabs Component
interface VerticalTabsProps extends Omit<TabsProps, 'fullWidth'> {
  tabListWidth?: string;
}

export function VerticalTabs({
  tabs,
  defaultTab,
  selectedTab,
  onChange,
  variant = 'default',
  size = 'md',
  className,
  tabListClassName,
  tabPanelClassName,
  tabListWidth = 'w-48',
  children,
}: VerticalTabsProps) {
  const defaultIndex = defaultTab ? tabs.findIndex(t => t.id === defaultTab) : 0;
  const selectedIndex = selectedTab ? tabs.findIndex(t => t.id === selectedTab) : undefined;
  
  const [localSelectedIndex, setLocalSelectedIndex] = useState(defaultIndex);
  const currentIndex = selectedIndex ?? localSelectedIndex;

  const handleChange = (index: number) => {
    const tab = tabs[index];
    if (!tab.disabled) {
      setLocalSelectedIndex(index);
      onChange?.(tab.id);
    }
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const variantListClasses = {
    default: 'bg-gray-100 p-1 rounded-lg',
    pills: 'gap-2 p-2',
    underline: 'border-r border-gray-200 pr-2',
    bordered: 'bg-white border border-gray-200 rounded-lg p-1',
  };

  return (
    <TabsContext.Provider value={{ variant, size, fullWidth: true }}>
      <Tab.Group
        selectedIndex={currentIndex}
        onChange={handleChange}
        as="div"
        className={clsx('flex gap-6', className)}
        vertical
      >
        <Tab.List
          className={clsx(
            'flex flex-col',
            tabListWidth,
            variantListClasses[variant],
            sizeClasses[size],
            tabListClassName
          )}
        >
          {tabs.map((tab) => (
            <VerticalTabButton key={tab.id} tab={tab} />
          ))}
        </Tab.List>
        
        <Tab.Panels className={clsx('flex-1', tabPanelClassName)}>
          {children}
        </Tab.Panels>
      </Tab.Group>
    </TabsContext.Provider>
  );
}

// Vertical Tab Button
function VerticalTabButton({ tab }: TabButtonProps) {
  const { variant, size } = useContext(TabsContext);

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-2.5',
    lg: 'px-5 py-3',
  };

  const variantClasses = {
    default: clsx(
      'rounded-md transition-colors text-left',
      'ui-selected:bg-white ui-selected:shadow-sm ui-selected:text-blue-600',
      'ui-not-selected:text-gray-600 ui-not-selected:hover:text-gray-900'
    ),
    pills: clsx(
      'rounded-md transition-all text-left',
      'ui-selected:bg-blue-600 ui-selected:text-white ui-selected:shadow-sm',
      'ui-not-selected:text-gray-600',
      'ui-not-selected:hover:bg-gray-100'
    ),
    underline: clsx(
      'relative transition-colors text-left border-r-2 -mr-px',
      'ui-selected:border-blue-600 ui-selected:text-blue-600',
      'ui-not-selected:border-transparent ui-not-selected:text-gray-600',
      'ui-not-selected:hover:text-gray-900 ui-not-selected:hover:border-gray-300'
    ),
    bordered: clsx(
      'rounded-md transition-colors text-left',
      'ui-selected:bg-blue-600 ui-selected:text-white ui-selected:shadow-sm',
      'ui-not-selected:text-gray-600 ui-not-selected:hover:text-gray-900',
      'ui-not-selected:hover:bg-gray-50'
    ),
  };

  return (
    <Tab
      className={clsx(
        'flex items-center gap-3 w-full font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        sizeClasses[size],
        variantClasses[variant],
        tab.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
      disabled={tab.disabled}
    >
      {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
      <span className="flex-1">{tab.label}</span>
      {tab.badge !== undefined && (
        <span className={clsx(
          'inline-flex items-center justify-center rounded-full bg-current/10 font-semibold',
          size === 'sm' && 'px-1.5 py-0.5 text-[10px] min-w-[18px]',
          size === 'md' && 'px-2 py-0.5 text-xs min-w-[20px]',
          size === 'lg' && 'px-2.5 py-0.5 text-sm min-w-[24px]'
        )}>
          {tab.badge}
        </span>
      )}
    </Tab>
  );
}

// Mobile Accordion Tabs (for responsive design)
interface AccordionTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  children: ReactNode[];
}

export function AccordionTabs({
  tabs,
  defaultTab,
  onChange,
  className,
  children,
}: AccordionTabsProps) {
  const [openTab, setOpenTab] = useState<string | null>(
    defaultTab || tabs[0]?.id || null
  );

  const handleToggle = (tabId: string) => {
    setOpenTab(openTab === tabId ? null : tabId);
    onChange?.(tabId);
  };

  return (
    <div className={clsx('space-y-2', className)}>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => handleToggle(tab.id)}
            disabled={tab.disabled}
            className={clsx(
              'w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors text-left',
              tab.disabled && 'opacity-50 cursor-not-allowed',
              openTab === tab.id && 'bg-blue-50 border-b border-gray-200'
            )}
          >
            <div className="flex items-center gap-3">
              {tab.icon && <span>{tab.icon}</span>}
              <span className="font-medium">{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
                  {tab.badge}
                </span>
              )}
            </div>
            <svg
              className={clsx(
                'w-5 h-5 transition-transform',
                openTab === tab.id && 'rotate-180'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {openTab === tab.id && (
            <div className="p-4 bg-white">
              {children[index]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Memorial Wizard Tabs (specific for mobile form/preview toggle)
interface WizardTabsProps {
  activeTab: 'form' | 'preview';
  onChange: (tab: 'form' | 'preview') => void;
  currentStep: number;
  totalSteps: number;
  hasErrors?: boolean;
}

export function WizardTabs({
  activeTab,
  onChange,
  currentStep,
  totalSteps,
  hasErrors = false,
}: WizardTabsProps) {
  const tabs: TabItem[] = [
    {
      id: 'form',
      label: 'Edit',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      badge: hasErrors ? '!' : undefined,
    },
    {
      id: 'preview',
      label: 'Preview',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Step {currentStep} of {totalSteps}
          </span>
          {hasErrors && (
            <span className="text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Please fix errors
            </span>
          )}
        </div>
        
        <Tabs
          tabs={tabs}
          selectedTab={activeTab}
          onChange={(tab) => onChange(tab as 'form' | 'preview')}
          variant="pills"
          size="sm"
          fullWidth
        >
          <TabPanel>{/* Form content handled by parent */}</TabPanel>
          <TabPanel>{/* Preview content handled by parent */}</TabPanel>
        </Tabs>
      </div>
    </div>
  );
}