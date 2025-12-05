import type { Meta, StoryObj } from '@storybook/react';
import { AIInput } from './ai-input';
import { AIAssistantBubble } from './ai-assistant-bubble';
import { PredictiveSearch } from './predictive-search';
import { useState } from 'react';

const meta: Meta = {
  title: '2025 Enhancements/AI Components',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const AIInputDemo: Story = {
  render: () => {
    const [value, setValue] = useState('');
    
    return (
      <div className="max-w-md space-y-4">
        <h3 className="text-lg font-semibold">AI-Powered Input</h3>
        <p className="text-sm text-neutral-600">
          Type to see AI suggestions appear below the input
        </p>
        <AIInput
          value={value}
          onChange={setValue}
          onSubmit={async () => {}}
          placeholder="Start typing to get AI suggestions..."
        />
      </div>
    );
  },
};

export const AIAssistantDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">AI Assistant Bubble</h3>
      <p className="text-sm text-neutral-600">
        Shows AI assistant responses with typing animation
      </p>
      
      <div className="space-y-3">
        <AIAssistantBubble message="Hello! I'm your AI assistant. How can I help you today?" isTyping={false} />
        <AIAssistantBubble message="" isTyping={true} />
        <AIAssistantBubble message="Based on your input, I recommend checking the documentation for more details." isTyping={false} />
      </div>
    </div>
  ),
};

export const PredictiveSearchDemo: Story = {
  render: () => {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<string | null>(null);

    const items = [
      { id: '1', title: 'Template Analytics', type: 'trending' as const },
      { id: '2', title: 'Template Library', type: 'recent' as const },
      { id: '3', title: 'Create New Template', type: 'suggested' as const },
      { id: '4', title: 'Approval Workflows', type: 'trending' as const },
      { id: '5', title: 'Template Editor', type: 'recent' as const },
    ];

    const filteredItems = items.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );

    return (
      <div className="max-w-lg space-y-4">
        <h3 className="text-lg font-semibold">Predictive Search</h3>
        <p className="text-sm text-neutral-600">
          Search with trending, recent, and suggested results
        </p>
        
        <PredictiveSearch
          value={query}
          onChange={setQuery}
          results={filteredItems}
          onSelectResult={(item) => {
            setSelected(item.title);
            setQuery('');
          }}
          placeholder="Search templates..."
        />

        {selected && (
          <div className="p-4 bg-neutral-100 rounded">
            <p className="text-sm">
              <strong>Selected:</strong> {selected}
            </p>
          </div>
        )}
      </div>
    );
  },
};

export const AIWorkflow: Story = {
  render: () => {
    const [step, setStep] = useState(1);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [response, setResponse] = useState('');

    const handleSubmit = () => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setResponse('Great! I can help you with that. Here are some suggestions...');
        setStep(2);
      }, 2000);
    };

    return (
      <div className="max-w-2xl space-y-6">
        <h3 className="text-lg font-semibold">Complete AI Workflow</h3>
        <p className="text-sm text-neutral-600">
          Demonstrates all AI components working together
        </p>

        <div className="space-y-4 p-6 border rounded-lg">
          {step === 1 && (
            <>
        <AIInput
                value={input}
                onChange={setInput}
                onSubmit={async () => handleSubmit()}
                placeholder="What would you like to create?"
              />
              <button
                onClick={handleSubmit}
                disabled={!input}
                className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
              >
                Ask AI Assistant
              </button>
            </>
          )}

          {(step === 2 || isTyping) && (
            <div className="space-y-3">
              <AIAssistantBubble message={isTyping ? '' : response} isTyping={isTyping} />

              {!isTyping && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStep(1);
                      setInput('');
                      setResponse('');
                    }}
                    className="px-4 py-2 border rounded"
                  >
                    Start Over
                  </button>
                  <button className="px-4 py-2 bg-primary text-white rounded">
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
};

export const AllAIComponents: Story = {
  render: () => (
    <div className="space-y-8 max-w-3xl">
      <section>
        <h3 className="text-lg font-semibold mb-4">1. AI Input</h3>
        <AIInput
          value=""
          onChange={() => {}}
          onSubmit={async () => {}}
          placeholder="Type for suggestions..."
        />
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">2. AI Assistant Bubble</h3>
        <div className="space-y-2">
          <AIAssistantBubble message="Standard AI response message" isTyping={false} />
          <AIAssistantBubble message="" isTyping={true} />
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">3. Predictive Search</h3>
        <PredictiveSearch
          value=""
          onChange={() => {}}
          results={[
            { id: '1', title: 'Search Result 1', type: 'trending' },
            { id: '2', title: 'Search Result 2', type: 'recent' },
          ]}
          onSelectResult={(item) => console.log('Selected:', item)}
          placeholder="Search..."
        />
      </section>
    </div>
  ),
};
