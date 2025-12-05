import type { Meta, StoryObj } from '@storybook/react';
import { SuccessCelebration } from './success-celebration';
import { FriendlyError } from './friendly-error';
import { Button } from '../button';
import { useState } from 'react';

const meta: Meta = {
  title: '2025 Enhancements/Emotional Design',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const SuccessCelebrationDemo: Story = {
  render: () => {
    const [showSuccess, setShowSuccess] = useState(false);

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          {!showSuccess ? (
            <>
              <p className="text-neutral-600 mb-4">
                Click the button to see the celebration!
              </p>
              <Button onClick={() => setShowSuccess(true)}>
                Trigger Success
              </Button>
            </>
          ) : (
            <SuccessCelebration
              message="Template Created!"
              submessage="Your template has been successfully saved."
              onComplete={() => setShowSuccess(false)}
            />
          )}
        </div>
      </div>
    );
  },
};

export const SuccessVariations: Story = {
  render: () => {
    const [active, setActive] = useState<number | null>(null);

    const celebrations = [
      { id: 1, message: 'Saved!', submessage: 'Changes saved successfully' },
      { id: 2, message: 'Approved!', submessage: 'Workflow approved' },
      { id: 3, message: 'Published!', submessage: 'Template is now live' },
      { id: 4, message: 'Completed!', submessage: undefined },
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Success Variations</h3>
        <p className="text-sm text-neutral-600">
          Different success messages with optional submessages
        </p>

        <div className="grid grid-cols-2 gap-4">
          {celebrations.map((celebration) => (
            <div
              key={celebration.id}
              className="border rounded-lg p-6 min-h-[200px] flex items-center justify-center"
            >
              {active === celebration.id ? (
                <SuccessCelebration
                  message={celebration.message}
                  submessage={celebration.submessage}
                  onComplete={() => setActive(null)}
                />
              ) : (
                <Button size="sm" onClick={() => setActive(celebration.id)}>
                  Show "{celebration.message}"
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  },
};

export const FriendlyErrorDemo: Story = {
  render: () => (
    <div className="max-w-lg space-y-4">
      <h3 className="text-lg font-semibold">Friendly Error Messages</h3>
      <p className="text-sm text-neutral-600">
        Contextual errors with helpful suggestions
      </p>

      <FriendlyError
        title="Connection Error"
        message="Unable to connect to the server"
        suggestions={[
          {
            type: 'actionable',
            text: 'Check your internet connection',
          },
          {
            type: 'actionable',
            text: 'Try again in a few moments',
          },
          {
            type: 'informational',
            text: 'The server may be temporarily unavailable',
          },
        ]}
        onRetry={() => alert('Retrying...')}
        onDismiss={() => alert('Dismissed')}
      />
    </div>
  ),
};

export const ErrorVariations: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <h3 className="text-lg font-semibold">Error Variations</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Validation Error</h4>
          <FriendlyError
            title="Invalid Input"
            message="Please check the following fields"
            suggestions={[
              { type: 'actionable', text: 'Email must be a valid email address' },
              { type: 'actionable', text: 'Password must be at least 8 characters' },
            ]}
            onDismiss={() => {}}
          />
        </div>

        <div>
          <h4 className="font-medium mb-2">Permission Error</h4>
          <FriendlyError
            title="Access Denied"
            message="You don't have permission to perform this action"
            suggestions={[
              { type: 'informational', text: 'This feature requires admin privileges' },
              { type: 'actionable', text: 'Contact your administrator for access' },
            ]}
            onDismiss={() => {}}
          />
        </div>

        <div>
          <h4 className="font-medium mb-2">Not Found Error</h4>
          <FriendlyError
            title="Template Not Found"
            message="The template you're looking for doesn't exist"
            suggestions={[
              { type: 'actionable', text: 'Check the template ID' },
              { type: 'actionable', text: 'Browse available templates' },
              { type: 'informational', text: 'The template may have been deleted' },
            ]}
            onRetry={() => alert('Searching again...')}
            onDismiss={() => {}}
          />
        </div>
      </div>
    </div>
  ),
};

export const SuccessToErrorFlow: Story = {
  render: () => {
    const [state, setState] = useState<'idle' | 'success' | 'error'>('idle');

    return (
      <div className="max-w-lg space-y-6">
        <h3 className="text-lg font-semibold">Success/Error Flow</h3>
        <p className="text-sm text-neutral-600">
          Demonstrates emotional feedback in a typical workflow
        </p>

        <div className="border rounded-lg p-6 min-h-[300px] flex flex-col items-center justify-center">
          {state === 'idle' && (
            <div className="space-y-3 text-center">
              <p className="text-neutral-600">Simulate a workflow outcome:</p>
              <div className="flex gap-3">
                <Button onClick={() => setState('success')}>
                  Simulate Success
                </Button>
                <Button variant="danger" onClick={() => setState('error')}>
                  Simulate Error
                </Button>
              </div>
            </div>
          )}

          {state === 'success' && (
            <SuccessCelebration
              message="Operation Successful!"
              submessage="Everything worked perfectly"
              onComplete={() => setState('idle')}
            />
          )}

          {state === 'error' && (
            <div className="w-full">
              <FriendlyError
                title="Operation Failed"
                message="Something went wrong with your request"
                suggestions={[
                  { type: 'actionable', text: 'Try the operation again' },
                  { type: 'informational', text: 'If the problem persists, contact support' },
                ]}
                onRetry={() => {
                  // Simulate retry leading to success
                  setState('success');
                }}
                onDismiss={() => setState('idle')}
              />
            </div>
          )}
        </div>
      </div>
    );
  },
};

export const AllEmotionalComponents: Story = {
  render: () => {
    const [showSuccess, setShowSuccess] = useState(false);

    return (
      <div className="space-y-8 max-w-2xl">
        <section>
          <h3 className="text-lg font-semibold mb-4">1. Success Celebration</h3>
          <div className="border rounded-lg p-6 min-h-[200px] flex items-center justify-center">
            {!showSuccess ? (
              <Button onClick={() => setShowSuccess(true)}>
                Show Success
              </Button>
            ) : (
              <SuccessCelebration
                message="Success!"
                submessage="Operation completed successfully"
                onComplete={() => setShowSuccess(false)}
              />
            )}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4">2. Friendly Error</h3>
          <FriendlyError
            title="Example Error"
            message="This is what errors look like in our system"
            suggestions={[
              { type: 'actionable', text: 'Take this suggested action' },
              { type: 'informational', text: 'Here is some helpful context' },
            ]}
            onRetry={() => alert('Retry clicked')}
            onDismiss={() => alert('Dismiss clicked')}
          />
        </section>
      </div>
    );
  },
};
