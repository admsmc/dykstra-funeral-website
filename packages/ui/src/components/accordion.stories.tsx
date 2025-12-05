import type { Meta, StoryObj } from '@storybook/react';
import { Accordion } from './accordion';

const meta: Meta = {
  title: 'Components/Accordion',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-full max-w-md">
      <div className="border-b">
        <button className="flex justify-between w-full py-4 font-medium">
          Is it accessible?
          <span>▼</span>
        </button>
        <div className="pb-4 text-sm text-neutral-600">
          Yes. It adheres to the WAI-ARIA design pattern.
        </div>
      </div>
    </Accordion>
  ),
};

export const FAQ: Story = {
  render: () => (
    <div className="w-full max-w-2xl space-y-2">
      <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
      
      <div className="border rounded-lg">
        <button className="flex justify-between w-full p-4 text-left font-medium hover:bg-neutral-50">
          <span>What payment methods do you accept?</span>
          <span className="text-neutral-400">+</span>
        </button>
        <div className="px-4 pb-4 text-sm text-neutral-600" style={{ display: 'none' }}>
          We accept all major credit cards, PayPal, and bank transfers.
        </div>
      </div>

      <div className="border rounded-lg">
        <button className="flex justify-between w-full p-4 text-left font-medium hover:bg-neutral-50">
          <span>How long does shipping take?</span>
          <span className="text-neutral-400">+</span>
        </button>
        <div className="px-4 pb-4 text-sm text-neutral-600" style={{ display: 'none' }}>
          Standard shipping takes 5-7 business days. Express shipping is available for 2-3 business days.
        </div>
      </div>

      <div className="border rounded-lg">
        <button className="flex justify-between w-full p-4 text-left font-medium hover:bg-neutral-50">
          <span>What is your return policy?</span>
          <span className="text-neutral-400">+</span>
        </button>
        <div className="px-4 pb-4 text-sm text-neutral-600" style={{ display: 'none' }}>
          We offer a 30-day money-back guarantee. Items must be returned in original condition.
        </div>
      </div>

      <div className="border rounded-lg">
        <button className="flex justify-between w-full p-4 text-left font-medium hover:bg-neutral-50">
          <span>Do you offer international shipping?</span>
          <span className="text-neutral-400">+</span>
        </button>
        <div className="px-4 pb-4 text-sm text-neutral-600" style={{ display: 'none' }}>
          Yes, we ship to over 50 countries worldwide. Shipping costs vary by location.
        </div>
      </div>
    </div>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-2">
      <h3 className="font-semibold mb-4">Multiple items can be open</h3>
      
      <div className="border rounded">
        <button className="flex justify-between w-full p-3 text-left hover:bg-neutral-50">
          <span>Section 1</span>
          <span>▼</span>
        </button>
        <div className="px-3 pb-3 text-sm">Content for section 1</div>
      </div>

      <div className="border rounded">
        <button className="flex justify-between w-full p-3 text-left hover:bg-neutral-50">
          <span>Section 2</span>
          <span>▼</span>
        </button>
        <div className="px-3 pb-3 text-sm">Content for section 2</div>
      </div>

      <div className="border rounded">
        <button className="flex justify-between w-full p-3 text-left hover:bg-neutral-50">
          <span>Section 3</span>
          <span>▼</span>
        </button>
        <div className="px-3 pb-3 text-sm">Content for section 3</div>
      </div>
    </div>
  ),
};

export const Styled: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div>
          <button className="flex justify-between w-full p-4 bg-neutral-50 font-medium hover:bg-neutral-100">
            <span>🎨 Styled Item 1</span>
            <span>→</span>
          </button>
          <div className="p-4 bg-white text-sm text-neutral-600">
            This accordion has custom styling with background colors and icons.
          </div>
        </div>
        
        <div className="border-t">
          <button className="flex justify-between w-full p-4 bg-neutral-50 font-medium hover:bg-neutral-100">
            <span>⚡ Styled Item 2</span>
            <span>→</span>
          </button>
        </div>
        
        <div className="border-t">
          <button className="flex justify-between w-full p-4 bg-neutral-50 font-medium hover:bg-neutral-100">
            <span>🚀 Styled Item 3</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  ),
};
