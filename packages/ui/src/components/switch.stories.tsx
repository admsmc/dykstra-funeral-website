import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './switch';
import { Label } from './label';
import { useState } from 'react';

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="notifications" />
      <Label htmlFor="notifications">Enable notifications</Label>
    </div>
  ),
};

const ControlledSwitch = () => {
  const [enabled, setEnabled] = useState(false);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="controlled-switch"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
        <Label htmlFor="controlled-switch">
          Notifications are {enabled ? 'enabled' : 'disabled'}
        </Label>
      </div>
      <p className="text-sm text-neutral-600">
        Click the switch or the text to toggle
      </p>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledSwitch />,
};

export const Settings: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notif" className="font-medium">
                Email Notifications
              </Label>
              <p className="text-sm text-neutral-600">
                Receive notifications via email
              </p>
            </div>
            <Switch id="email-notif" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-notif" className="font-medium">
                Push Notifications
              </Label>
              <p className="text-sm text-neutral-600">
                Receive push notifications on your device
              </p>
            </div>
            <Switch id="push-notif" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-notif" className="font-medium">
                SMS Notifications
              </Label>
              <p className="text-sm text-neutral-600">
                Receive notifications via SMS
              </p>
            </div>
            <Switch id="sms-notif" defaultChecked />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Privacy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="public-profile" className="font-medium">
                Public Profile
              </Label>
              <p className="text-sm text-neutral-600">
                Make your profile visible to everyone
              </p>
            </div>
            <Switch id="public-profile" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="analytics" className="font-medium">
                Analytics
              </Label>
              <p className="text-sm text-neutral-600">
                Help us improve by sharing usage data
              </p>
            </div>
            <Switch id="analytics" defaultChecked />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Switch />
        <span className="text-sm">Unchecked</span>
      </div>
      <div className="flex items-center space-x-4">
        <Switch defaultChecked />
        <span className="text-sm">Checked</span>
      </div>
      <div className="flex items-center space-x-4">
        <Switch disabled />
        <span className="text-sm">Disabled (unchecked)</span>
      </div>
      <div className="flex items-center space-x-4">
        <Switch disabled defaultChecked />
        <span className="text-sm">Disabled (checked)</span>
      </div>
    </div>
  ),
};
