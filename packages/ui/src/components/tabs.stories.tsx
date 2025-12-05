import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './tabs';
import { Card } from './card';

const meta: Meta = {
  title: 'Components/Tabs',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-full max-w-md">
      <div role="tablist" className="flex border-b">
        <button
          role="tab"
          className="px-4 py-2 border-b-2 border-primary font-medium"
        >
          Account
        </button>
        <button role="tab" className="px-4 py-2 text-neutral-600">
          Password
        </button>
        <button role="tab" className="px-4 py-2 text-neutral-600">
          Notifications
        </button>
      </div>
      <div role="tabpanel" className="p-4">
        <h3 className="text-lg font-semibold mb-2">Account Settings</h3>
        <p className="text-sm text-neutral-600">
          Manage your account settings and preferences here.
        </p>
      </div>
    </Tabs>
  ),
};

export const WithContent: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-full max-w-2xl">
      <div role="tablist" className="flex border-b mb-4">
        <button
          role="tab"
          className="px-4 py-2 border-b-2 border-primary font-medium"
        >
          Overview
        </button>
        <button role="tab" className="px-4 py-2 text-neutral-600">
          Analytics
        </button>
        <button role="tab" className="px-4 py-2 text-neutral-600">
          Reports
        </button>
        <button role="tab" className="px-4 py-2 text-neutral-600">
          Settings
        </button>
      </div>

      <div role="tabpanel">
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Dashboard Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">1,234</div>
              <div className="text-sm text-neutral-600">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success">567</div>
              <div className="text-sm text-neutral-600">Active Now</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning">89</div>
              <div className="text-sm text-neutral-600">Pending</div>
            </div>
          </div>
        </Card>
      </div>
    </Tabs>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex gap-4 max-w-2xl">
      <div className="flex flex-col border-r pr-4 space-y-2 min-w-[200px]">
        <button className="px-4 py-2 bg-primary text-white rounded text-left">
          Profile
        </button>
        <button className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded text-left">
          Account
        </button>
        <button className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded text-left">
          Appearance
        </button>
        <button className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded text-left">
          Notifications
        </button>
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold mb-4">Profile Settings</h3>
        <p className="text-sm text-neutral-600 mb-4">
          This is where you would edit your profile information.
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              defaultValue="John Doe"
              className="w-full mt-1 px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              defaultValue="john@example.com"
              className="w-full mt-1 px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>
    </div>
  ),
};
