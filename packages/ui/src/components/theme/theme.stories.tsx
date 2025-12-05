import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, useTheme, ThemeToggle } from './index';
import { Card } from '../card';
import { Button } from '../button';

const meta: Meta = {
  title: '2025 Enhancements/Theme System',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const ThemeDemo = () => {
  const { theme } = useTheme();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Theme System Demo</h2>
          <p className="text-sm text-neutral-600">Current theme: {theme}</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Light Mode</h3>
          <p className="text-sm text-neutral-600">
            Clean, bright interface for daytime use
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Dark Mode</h3>
          <p className="text-sm text-neutral-600">
            Reduced eye strain for low-light environments
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Low-Light Mode</h3>
          <p className="text-sm text-neutral-600">
            Reduced contrast for digital wellbeing
          </p>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Interactive Components</h3>
        <div className="flex flex-wrap gap-2">
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </Card>
    </div>
  );
};

export const ThemeToggleDemo: Story = {
  render: () => (
    <ThemeProvider>
      <ThemeDemo />
    </ThemeProvider>
  ),
};

export const LightMode: Story = {
  render: () => (
    <ThemeProvider defaultTheme="light">
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold">Light Mode</h2>
        <Card className="p-6">
          <p>This is how content appears in light mode</p>
        </Card>
      </div>
    </ThemeProvider>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <ThemeProvider defaultTheme="dark">
      <div className="p-6 space-y-4 bg-neutral-900 min-h-screen">
        <h2 className="text-2xl font-bold text-white">Dark Mode</h2>
        <Card className="p-6 bg-neutral-800 text-white">
          <p>This is how content appears in dark mode</p>
        </Card>
      </div>
    </ThemeProvider>
  ),
};
