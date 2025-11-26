import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700">
          This is the main content area of the card. It can contain any content
          you need to display.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="ghost">Cancel</Button>
        <Button>Submit</Button>
      </CardFooter>
    </Card>
  ),
};

export const Bordered: Story = {
  render: () => (
    <Card variant="bordered" className="w-[400px]">
      <CardHeader>
        <CardTitle>Bordered Card</CardTitle>
        <CardDescription>This card has a border</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700">Content goes here</p>
      </CardContent>
    </Card>
  ),
};

export const Elevated: Story = {
  render: () => (
    <Card variant="elevated" className="w-[400px]">
      <CardHeader>
        <CardTitle>Elevated Card</CardTitle>
        <CardDescription>This card has more shadow</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700">Content goes here</p>
      </CardContent>
    </Card>
  ),
};

export const SimpleCard: Story = {
  render: () => (
    <Card className="w-[400px]">
      <CardContent>
        <p className="text-sm text-gray-700">A simple card with just content</p>
      </CardContent>
    </Card>
  ),
};

export const CaseExample: Story = {
  name: 'Case Details Example',
  render: () => (
    <Card className="w-[500px]">
      <CardHeader>
        <CardTitle>John Doe</CardTitle>
        <CardDescription>Case #12345 • Created Jan 15, 2025</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Service Type:</span>
            <span className="text-sm text-gray-600">Traditional Funeral</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Status:</span>
            <span className="text-sm text-green-600">Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Total Cost:</span>
            <span className="text-sm text-gray-600">$12,500</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm">View Details</Button>
        <Button size="sm">Edit Case</Button>
      </CardFooter>
    </Card>
  ),
};
