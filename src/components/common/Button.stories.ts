import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn } from 'storybook/test';
import Button from './Button.vue';

const meta = {
  title: 'Parts/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    primary: undefined,
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Button',
  },
};

export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    primary: false,
    label: 'Button',
  },
};

export const Small: Story = {
  args: {
    label: 'Button',
    size: 'small',
  },
};

export const Medium: Story = {
  args: {
    label: 'Button',
    size: 'medium',
  },
};

export const Large: Story = {
  args: {
    label: 'Button',
    size: 'large',
  },
};

export const Disable: Story = {
  args: {
    label: 'Button',
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    label: 'Button',
    loading: true,
  },
};
