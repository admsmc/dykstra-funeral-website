import type { Meta, StoryObj } from '@storybook/react';
import { DropdownMenu } from './dropdown-menu';
import { Button } from './button';

const meta: Meta = {
  title: 'Components/DropdownMenu',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <Button>Open Menu</Button>
      <div className="dropdown-content">
        <button className="dropdown-item">Profile</button>
        <button className="dropdown-item">Settings</button>
        <button className="dropdown-item">Sign out</button>
      </div>
    </DropdownMenu>
  ),
};

export const WithSections: Story = {
  render: () => (
    <div className="p-8">
      <p className="text-sm text-neutral-600 mb-4">Click the button to open the menu</p>
      <Button>Actions</Button>
      <div style={{ display: 'none' }} className="menu-content">
        <div className="p-2">
          <button className="w-full text-left px-3 py-2 hover:bg-neutral-100 rounded">
            Edit
          </button>
          <button className="w-full text-left px-3 py-2 hover:bg-neutral-100 rounded">
            Duplicate
          </button>
        </div>
        <hr className="my-1" />
        <div className="p-2">
          <button className="w-full text-left px-3 py-2 hover:bg-neutral-100 rounded text-red-600">
            Delete
          </button>
        </div>
      </div>
    </div>
  ),
};
