import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

/**
 * Enhanced Button Component - 2025 Design System
 * 
 * New features:
 * - Soft and gradient variants for modern aesthetics
 * - Emphasis levels (low/medium/high/premium) for visual hierarchy
 * - Theme-aware colors (light/dark/lowLight modes)
 * - Enhanced micro-interactions with Framer Motion
 * - Loading state with animated spinner
 * - Success/error animation states
 */

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
  {
    variants: {
      variant: {
        // Classic solid variants
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600',
        secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus-visible:ring-neutral-400 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600',
        ghost: 'hover:bg-neutral-100 text-neutral-700 focus-visible:ring-neutral-400 dark:hover:bg-neutral-800 dark:text-neutral-300',
        danger: 'bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-500 dark:bg-error-500 dark:hover:bg-error-600',
        
        // 2025 new variants
        soft: 'bg-primary-100 text-primary-700 hover:bg-primary-200 focus-visible:ring-primary-500 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50',
        gradient: 'bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:from-primary-700 hover:to-accent-700 focus-visible:ring-primary-500',
      },
      size: {
        sm: 'h-9 px-3 text-sm gap-1.5',
        md: 'h-11 px-6 text-base gap-2',
        lg: 'h-14 px-8 text-lg gap-2.5',
      },
      emphasis: {
        low: 'shadow-none',
        medium: 'shadow-sm hover:shadow-md',
        high: 'shadow-md hover:shadow-lg',
        premium: 'shadow-lg hover:shadow-xl shadow-primary-500/20',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      emphasis: 'medium',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  children: React.ReactNode;
  /** Icon to display before the button text */
  icon?: React.ReactNode;
  /** Icon to display after the button text */
  iconAfter?: React.ReactNode;
  /** Animation state for success/error feedback */
  animationState?: 'idle' | 'success' | 'error';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    emphasis,
    loading, 
    disabled, 
    children, 
    icon,
    iconAfter,
    animationState = 'idle',
    type = 'button',
    onClick, 
    onMouseDown, 
    onMouseUp, 
    onKeyDown,
    ...props
  }, ref) => {
    const MotionButton = motion.button as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement> & { whileHover?: unknown; whileTap?: unknown; animate?: unknown; transition?: unknown }>;
    
    return (
      <MotionButton
        ref={ref}
        type={type}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onKeyDown={onKeyDown}
        className={cn(buttonVariants({ variant, size, emphasis, className }))}
        disabled={disabled || loading}
        // Animation props
        whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
        animate={{
          opacity: loading ? [1, 0.7, 1] : 1,
          scale: animationState === 'success' ? [1, 1.05, 1] : 1,
          x: animationState === 'error' ? [-2, 2, -2, 2, 0] : 0,
        }}
        transition={{
          duration: 0.2,
          opacity: { repeat: loading ? Infinity : 0, duration: 1.5 },
          scale: { duration: 0.6 },
          x: { duration: 0.4 },
        }}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <motion.svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </motion.svg>
        )}
        
        {/* Leading icon */}
        {!loading && icon && (
          <span className="inline-flex">{icon}</span>
        )}
        
        {/* Button content */}
        <span className="inline-flex items-center">{children}</span>
        
        {/* Trailing icon */}
        {!loading && iconAfter && (
          <span className="inline-flex">{iconAfter}</span>
        )}
      </MotionButton>
    );
  }
);

Button.displayName = 'Button';
