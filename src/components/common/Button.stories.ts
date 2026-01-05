import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import Button from './Button.vue';

const meta = {
  title: 'Parts/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    color: { control: 'radio', options: ['primary', 'secondary', 'error', undefined] },
    size: { control: 'radio', options: ['small', 'medium', 'large', undefined] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
  args: {
    primary: undefined,
    color: undefined,
    size: undefined,
    disabled: undefined,
    loading: undefined,
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

export const ExplicitErrorColor: Story = {
  args: {
    label: 'Error',
    color: 'error',
  },
};

export const LongLabel: Story = {
  args: {
    label: 'Looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong Button Label',
  },
};

export const LoadingDisablesButton: Story = {
  args: {
    label: '送信',
    loading: true,
    disabled: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');

    // 押せない（disabled）こと
    await expect(btn).toBeDisabled();

    const onClick = args.onClick as unknown as ReturnType<typeof fn>;
    onClick.mockClear();
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const DisabledDisablesButton: Story = {
  args: {
    label: '送信',
    loading: false,
    disabled: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');

    // 押せない（disabled）こと
    await expect(btn).toBeDisabled();

    const onClick = args.onClick as unknown as ReturnType<typeof fn>;
    onClick.mockClear();

    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(btn);

    await expect(onClick).not.toHaveBeenCalled();
  },
};
