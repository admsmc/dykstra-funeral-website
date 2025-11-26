import * as React from 'react';
import { cn } from '../lib/utils';

/**
 * PaymentForm Component
 * 
 * This is a styled wrapper for Stripe Elements.
 * Requires @stripe/stripe-js and @stripe/react-stripe-js to be installed.
 * 
 * Installation:
 * npm install @stripe/stripe-js @stripe/react-stripe-js
 * 
 * Usage:
 * import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
 * import { loadStripe } from '@stripe/stripe-js';
 * 
 * const stripePromise = loadStripe('pk_test_...');
 * 
 * <Elements stripe={stripePromise}>
 *   <PaymentForm onSubmit={handlePayment} />
 * </Elements>
 */

export interface PaymentFormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  onSubmit?: (e: React.FormEvent) => void | Promise<void>;
  loading?: boolean;
  error?: string;
  showBillingDetails?: boolean;
}

export const PaymentForm = React.forwardRef<HTMLFormElement, PaymentFormProps>(
  (
    {
      className,
      onSubmit,
      loading = false,
      error,
      showBillingDetails = false,
      children,
      ...props
    },
    ref
  ) => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;
      await onSubmit?.(e);
    };

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn('space-y-6', className)}
        {...props}
      >
        {children}
      </form>
    );
  }
);

PaymentForm.displayName = 'PaymentForm';

/**
 * Styled container for Stripe CardElement
 * 
 * Usage:
 * <PaymentCardContainer>
 *   <CardElement options={cardElementOptions} />
 * </PaymentCardContainer>
 */
export const PaymentCardContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'w-full rounded border bg-white px-4 py-3 transition-colors',
      error
        ? 'border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500 focus-within:ring-offset-1'
        : 'border-gray-300 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy focus-within:ring-offset-1',
      className
    )}
    {...props}
  />
));
PaymentCardContainer.displayName = 'PaymentCardContainer';

/**
 * Stripe CardElement styling options
 * Use this with CardElement's options prop
 */
export const stripeCardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#2c3539', // charcoal
      fontFamily: 'var(--font-inter, sans-serif)',
      '::placeholder': {
        color: '#9ca3af', // gray-400
      },
      iconColor: '#9ca3af',
    },
    invalid: {
      color: '#ef4444', // red-500
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: false,
};

/**
 * Example implementation with Stripe Elements
 * Copy this into your app and customize as needed
 */
export const PaymentFormExample = `
import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import {
  PaymentForm,
  PaymentCardContainer,
  stripeCardElementOptions,
  FormField,
  Button,
} from '@dykstra/ui';

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    if (!stripe || !elements) return;

    setLoading(true);
    setError(undefined);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Process payment on your backend
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: paymentMethod.id }),
      });

      const data = await response.json();

      // Handle 3D Secure if required
      if (data.requiresAction) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          data.clientSecret
        );
        
        if (confirmError) {
          setError(confirmError.message);
          return;
        }
      }

      // Success!
      console.log('Payment successful:', data);
      
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaymentForm onSubmit={handleSubmit} error={error} loading={loading}>
      <FormField label="Card Details" required error={error}>
        <PaymentCardContainer error={!!error}>
          <CardElement options={stripeCardElementOptions} />
        </PaymentCardContainer>
      </FormField>

      <Button type="submit" loading={loading} disabled={!stripe}>
        Pay Now
      </Button>
    </PaymentForm>
  );
}
`;
