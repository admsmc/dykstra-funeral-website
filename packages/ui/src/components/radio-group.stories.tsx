import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup } from './radio-group';
import { Label } from './label';

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex items-center space-x-2">
        <input type="radio" value="option-1" id="r1" />
        <Label htmlFor="r1">Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <input type="radio" value="option-2" id="r2" />
        <Label htmlFor="r2">Option 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <input type="radio" value="option-3" id="r3" />
        <Label htmlFor="r3">Option 3</Label>
      </div>
    </RadioGroup>
  ),
};

export const WithDescriptions: Story = {
  render: () => (
    <RadioGroup defaultValue="plan-1" className="space-y-4">
      <div className="flex items-start space-x-3">
        <input type="radio" value="plan-1" id="plan-1" className="mt-1" />
        <div>
          <Label htmlFor="plan-1" className="font-semibold">
            Free Plan
          </Label>
          <p className="text-sm text-neutral-600">
            Perfect for getting started. Includes basic features.
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-3">
        <input type="radio" value="plan-2" id="plan-2" className="mt-1" />
        <div>
          <Label htmlFor="plan-2" className="font-semibold">
            Pro Plan - $19/month
          </Label>
          <p className="text-sm text-neutral-600">
            For professionals. Includes advanced features and priority support.
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-3">
        <input type="radio" value="plan-3" id="plan-3" className="mt-1" />
        <div>
          <Label htmlFor="plan-3" className="font-semibold">
            Enterprise Plan - $99/month
          </Label>
          <p className="text-sm text-neutral-600">
            For large teams. Custom integrations and dedicated support.
          </p>
        </div>
      </div>
    </RadioGroup>
  ),
};

export const PaymentMethod: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold">Payment Method</h3>
      <RadioGroup defaultValue="card" className="space-y-3">
        <div className="flex items-center space-x-2">
          <input type="radio" value="card" id="card" />
          <Label htmlFor="card">Credit Card</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input type="radio" value="paypal" id="paypal" />
          <Label htmlFor="paypal">PayPal</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input type="radio" value="bank" id="bank" />
          <Label htmlFor="bank">Bank Transfer</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input type="radio" value="crypto" id="crypto" />
          <Label htmlFor="crypto">Cryptocurrency</Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="small" className="flex space-x-4">
      <div className="flex items-center space-x-2">
        <input type="radio" value="small" id="small" />
        <Label htmlFor="small">Small</Label>
      </div>
      <div className="flex items-center space-x-2">
        <input type="radio" value="medium" id="medium" />
        <Label htmlFor="medium">Medium</Label>
      </div>
      <div className="flex items-center space-x-2">
        <input type="radio" value="large" id="large" />
        <Label htmlFor="large">Large</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option-1" className="space-y-3">
      <div className="flex items-center space-x-2">
        <input type="radio" value="option-1" id="d1" />
        <Label htmlFor="d1">Available Option</Label>
      </div>
      <div className="flex items-center space-x-2 opacity-50">
        <input type="radio" value="option-2" id="d2" disabled />
        <Label htmlFor="d2">Disabled Option</Label>
      </div>
      <div className="flex items-center space-x-2">
        <input type="radio" value="option-3" id="d3" />
        <Label htmlFor="d3">Another Available Option</Label>
      </div>
    </RadioGroup>
  ),
};
