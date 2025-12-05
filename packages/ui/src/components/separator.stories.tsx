import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './separator';

const meta: Meta<typeof Separator> = {
  title: 'Components/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Section 1</h3>
        <p className="text-sm text-neutral-600">Content for section 1</p>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-semibold">Section 2</h3>
        <p className="text-sm text-neutral-600">Content for section 2</p>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center space-x-4">
      <div>Item 1</div>
      <Separator orientation="vertical" />
      <div>Item 2</div>
      <Separator orientation="vertical" />
      <div>Item 3</div>
    </div>
  ),
};

export const InMenu: Story = {
  render: () => (
    <div className="w-64 p-4 border rounded-lg space-y-1">
      <div className="px-2 py-1.5 hover:bg-neutral-100 rounded cursor-pointer">
        Profile
      </div>
      <div className="px-2 py-1.5 hover:bg-neutral-100 rounded cursor-pointer">
        Settings
      </div>
      <Separator className="my-2" />
      <div className="px-2 py-1.5 hover:bg-neutral-100 rounded cursor-pointer text-red-600">
        Sign out
      </div>
    </div>
  ),
};
