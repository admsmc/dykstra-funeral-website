import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Button } from './button';

const meta: Meta = {
  title: 'Components/Tooltip',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex items-center justify-center p-12">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>This is a tooltip</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

export const Positions: Story = {
  render: () => (
    <TooltipProvider>
      <div className="grid grid-cols-3 gap-8 p-12">
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm">Top</Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Top tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm">Right</Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Right tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm">Bottom</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Bottom tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm">Left</Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Left tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-12">
        <span>Hover the icon for help</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-xs">
              ?
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click here to get more information about this feature</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

export const LongContent: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex items-center justify-center p-12">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Hover for detailed info</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>This is a longer tooltip with multiple lines of text that provides more detailed information to the user.</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};
