import type { Meta, StoryObj } from '@storybook/react';
import { ToastContextProvider, useToast } from './toast';
import { Button } from './button';

const meta: Meta = {
  title: 'Components/Toast',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const ToastDemo = ({ variant }: { variant?: 'info' | 'success' | 'warning' | 'error' }) => {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: `${variant || 'info'} notification`,
          description: 'This is a toast notification message',
          variant: variant || 'info',
        });
      }}
    >
      Show Toast
    </Button>
  );
};

export const AllVariants: Story = {
  render: () => (
    <ToastContextProvider>
      <div className="flex flex-wrap gap-4">
        <ToastDemo variant="info" />
        <ToastDemo variant="success" />
        <ToastDemo variant="warning" />
        <ToastDemo variant="error" />
      </div>
    </ToastContextProvider>
  ),
};

export const WithAction: Story = {
  render: () => {
    const ToastWithAction = () => {
      const { toast } = useToast();

      return (
        <Button
          onClick={() => {
            toast({
              title: 'Action Required',
              description: 'Click the action button to proceed',
              variant: 'warning',
              action: {
                label: 'Undo',
                altText: 'Undo action',
                onClick: () => alert('Undo clicked!'),
              },
            });
          }}
        >
          Show Toast with Action
        </Button>
      );
    };

    return (
      <ToastContextProvider>
        <ToastWithAction />
      </ToastContextProvider>
    );
  },
};

export const Success: Story = {
  render: () => (
    <ToastContextProvider>
      <ToastDemo variant="success" />
    </ToastContextProvider>
  ),
};

export const Error: Story = {
  render: () => (
    <ToastContextProvider>
      <ToastDemo variant="error" />
    </ToastContextProvider>
  ),
};
