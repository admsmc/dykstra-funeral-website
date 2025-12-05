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
          onChange={(e) => setValue(e.target.value)}
          placeholder="Start typing to get AI suggestions..."
          context="email"
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
        <AIAssistantBubble isTyping={false}>
          Hello! I'm your AI assistant. How can I help you today?
        </AIAssistantBubble>

        <AIAssistantBubble isTyping={true}>
          <span className="text-sm text-neutral-400">AI is typing...</span>
        </AIAssistantBubble>

        <AIAssistantBubble isTyping={false}>
          Based on your input, I recommend checking the documentation for more details.
        </AIAssistantBubble>
      </div>
    </div>
  ),
};

export const PredictiveSearchDemo: Story = {
  render: () => {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<string | null>(null);

    const items = [
      { id: '1', title: 'Template Analytics', category: 'trending' },
      { id: '2', title: 'Template Library', category: 'recent' },
      { id: '3', title: 'Create New Template', category: 'suggested' },
      { id: '4', title: 'Approval Workflows', category: 'trending' },
      { id: '5', title: 'Template Editor', category: 'recent' },
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
          items={filteredItems}
          onSelect={(item) => {
            setSelected(item.title);
            setQuery('');
          }}
          placeholder="Search templates..."
          renderItem={(item) => (
            <div className="flex items-center justify-between">
              <span>{item.title}</span>
              <span className="text-xs text-neutral-500 capitalize">
                {item.category}
              </span>
            </div>
          )}
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
                onChange={(e) => setInput(e.target.value)}
                placeholder="What would you like to create?"
                context="general"
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
              <AIAssistantBubble isTyping={isTyping}>
                {!isTyping && response}
              </AIAssistantBubble>

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
          placeholder="Type for suggestions..."
          context="general"
        />
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">2. AI Assistant Bubble</h3>
        <div className="space-y-2">
          <AIAssistantBubble>
            Standard AI response message
          </AIAssistantBubble>
          <AIAssistantBubble isTyping>
            Typing indicator
          </AIAssistantBubble>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-4">3. Predictive Search</h3>
        <PredictiveSearch
          items={[
            { id: '1', title: 'Search Result 1', category: 'trending' },
            { id: '2', title: 'Search Result 2', category: 'recent' },
          ]}
          onSelect={(item) => console.log('Selected:', item)}
          placeholder="Search..."
          renderItem={(item) => <span>{item.title}</span>}
        />
      </section>
    </div>
  ),
};
