import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { CheckCircle, Send, Download } from 'lucide-react';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'soft', 'gradient'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    emphasis: {
      control: 'select',
      options: ['low', 'medium', 'high', 'premium'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    animateOnHover: {
      control: 'boolean',
    },
    animateOnTap: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Button',
    variant: 'secondary',
    size: 'md',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Button',
    variant: 'ghost',
    size: 'md',
  },
};

export const Danger: Story = {
  args: {
    children: 'Delete',
    variant: 'danger',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

export const Loading: Story = {
  args: {
    children: 'Processing...',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const Soft: Story = {
  args: {
    children: 'Soft Button',
    variant: 'soft',
    size: 'md',
  },
};

export const Gradient: Story = {
  args: {
    children: 'Gradient Button',
    variant: 'gradient',
    size: 'md',
  },
};

export const WithIcon: Story = {
  args: {
    children: 'Send Message',
    leftIcon: <Send className="w-4 h-4" />,
    variant: 'primary',
  },
};

export const IconRight: Story = {
  args: {
    children: 'Download',
    rightIcon: <Download className="w-4 h-4" />,
    variant: 'secondary',
  },
};

export const EmphasisLevels: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 items-center">
        <Button emphasis="low">Low Emphasis</Button>
        <Button emphasis="medium">Medium Emphasis</Button>
        <Button emphasis="high">High Emphasis</Button>
        <Button emphasis="premium">Premium Emphasis</Button>
      </div>
    </div>
  ),
};

export const AllVariants: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="soft">Soft</Button>
        <Button variant="gradient">Gradient</Button>
      </div>
      <div className="flex gap-3">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      <div className="flex gap-3">
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="flex gap-3">
        <Button leftIcon={<CheckCircle className="w-4 h-4" />}>With Icon</Button>
        <Button rightIcon={<Send className="w-4 h-4" />}>Icon Right</Button>
      </div>
    </div>
  ),
};
