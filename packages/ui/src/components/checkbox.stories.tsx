import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './checkbox';
import { Label } from './label';
import { useState } from 'react';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

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
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

const ControlledCheckbox = () => {
  const [checked, setChecked] = useState(false);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="controlled"
          checked={checked}
          onCheckedChange={(value) => setChecked(value as boolean)}
        />
        <Label htmlFor="controlled">
          Controlled checkbox (currently {checked ? 'checked' : 'unchecked'})
        </Label>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Toggle via button
      </button>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledCheckbox />,
};

export const CheckboxGroup: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="font-semibold">Select your interests:</div>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox id="coding" defaultChecked />
          <Label htmlFor="coding">Coding</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="design" />
          <Label htmlFor="design">Design</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="writing" />
          <Label htmlFor="writing">Writing</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="music" defaultChecked />
          <Label htmlFor="music">Music</Label>
        </div>
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-4">Newsletter Preferences</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox id="weekly" defaultChecked />
            <div className="space-y-1">
              <Label htmlFor="weekly">Weekly Newsletter</Label>
              <p className="text-sm text-neutral-600">
                Get our weekly digest every Monday
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="monthly" />
            <div className="space-y-1">
              <Label htmlFor="monthly">Monthly Report</Label>
              <p className="text-sm text-neutral-600">
                Receive monthly analytics and insights
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="announcements" defaultChecked />
            <div className="space-y-1">
              <Label htmlFor="announcements">Product Announcements</Label>
              <p className="text-sm text-neutral-600">
                Stay updated on new features and releases
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};
