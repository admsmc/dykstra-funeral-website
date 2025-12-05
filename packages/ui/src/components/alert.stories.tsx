import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './alert';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    children: 'This is a default alert message.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Your changes have been saved successfully!',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Please review your information before submitting.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'An error occurred while processing your request.',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'New features are available. Check the changelog for details.',
  },
};

export const WithTitle: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="success">
        <div className="font-semibold">Success</div>
        <div className="text-sm mt-1">Your operation completed successfully.</div>
      </Alert>
      <Alert variant="error">
        <div className="font-semibold">Error</div>
        <div className="text-sm mt-1">Something went wrong. Please try again.</div>
      </Alert>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert>Default alert message</Alert>
      <Alert variant="success">Success alert message</Alert>
      <Alert variant="warning">Warning alert message</Alert>
      <Alert variant="error">Error alert message</Alert>
      <Alert variant="info">Info alert message</Alert>
    </div>
  ),
};
