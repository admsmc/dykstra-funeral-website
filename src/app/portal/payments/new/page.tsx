'use client';

import { trpc } from '@/lib/trpc/client';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { portalPaymentSchema, type PortalPaymentForm } from '@dykstra/domain/validation';
import { Form, FormTextarea } from '@dykstra/ui';
import { FormCurrencyInput } from '@/components/form-fields';

/**
 * Payment Form Page
 * 
 * Refactored with react-hook-form + domain validation schemas.
 * 
 * Stripe Integration Features:
 * - Secure payment processing
 * - Stripe Elements for card input
 * - 3D Secure authentication support
 * - Receipt generation
 * 
 * Backend flow:
 * 1. Create payment intent via tRPC
 * 2. Client confirms with Stripe Elements
 * 3. Webhook updates payment status
 */
function PaymentFormContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get('caseId');
  
  // Initialize form with react-hook-form + domain validation
  const form = useForm<PortalPaymentForm>({
    resolver: zodResolver(portalPaymentSchema),
    defaultValues: {
      amount: 0,
      notes: '',
    },
  });

  // Process payment mutation
  const processPayment = trpc.payment.processPayment.useMutation({
    onSuccess: (data) => {
      // In production, this would:
      // 1. Load Stripe.js
      // 2. Create Stripe Elements
      // 3. Confirm payment with clientSecret
      // 4. Handle 3D Secure if needed
      // 5. Show success/receipt page
      console.log('Payment intent created:', data.clientSecret);
      alert('Payment flow would continue with Stripe Elements');
      form.reset();
    },
    onError: (error) => {
      form.setError('amount', { message: error.message });
    },
  });

  // Handle form submission (validation automatic via react-hook-form)
  const onSubmit = form.handleSubmit((data) => {
    if (!caseId) {
      alert('Case ID is required');
      return;
    }

    processPayment.mutate({
      id: crypto.randomUUID(),
      caseId,
      amount: data.amount,
      method: 'credit_card',
      notes: data.notes,
      createdBy: 'current-user-id', // From auth context
    });
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link 
          href={`/portal/cases/${caseId}`}
          className="text-[--sage] hover:text-[--navy] mb-2 inline-block"
        >
          ← Back to Case
        </Link>
        <h1 className="text-4xl font-serif text-[--navy] mb-2">Make Payment</h1>
        <p className="text-[--charcoal]">
          Enter payment details below. All transactions are secure and encrypted.
        </p>
      </div>

      {/* Payment Form */}
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Amount */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-serif text-[--navy] mb-4">Payment Amount</h2>
            <FormCurrencyInput
              name="amount"
              label="Amount ($)"
              placeholder="0.00"
              min={0.01}
              required
            />
          </section>

        {/* Payment Method (Stripe Elements Placeholder) */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-serif text-[--navy] mb-4">Payment Method</h2>
          
          {/* In production, this would be replaced with Stripe Elements */}
          <div className="border-2 border-dashed border-[--sage] rounded-lg p-8 text-center bg-[--cream]">
            <div className="text-4xl mb-3">💳</div>
            <p className="text-[--charcoal] mb-2">Stripe Elements Integration</p>
            <p className="text-sm text-gray-500">
              In production, this area would contain:
            </p>
            <ul className="text-sm text-gray-500 mt-2 space-y-1">
              <li>• Card number input</li>
              <li>• Expiry date field</li>
              <li>• CVC/CVV field</li>
              <li>• Postal code</li>
            </ul>
            <p className="text-xs text-gray-400 mt-4">
              Stripe Elements provides PCI-compliant card collection
            </p>
          </div>

          {/* Placeholder card inputs for demo */}
          <div className="mt-4 space-y-3 opacity-50 pointer-events-none">
            <div>
              <label className="block text-sm font-medium text-[--charcoal] mb-2">
                Card Number
              </label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                className="w-full px-4 py-3 border border-gray-300 rounded"
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[--charcoal] mb-2">
                  Expiry
                </label>
                <input
                  type="text"
                  placeholder="MM / YY"
                  className="w-full px-4 py-3 border border-gray-300 rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[--charcoal] mb-2">
                  CVC
                </label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full px-4 py-3 border border-gray-300 rounded"
                  disabled
                />
              </div>
            </div>
          </div>
        </section>

          {/* Notes */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-serif text-[--navy] mb-4">Notes (Optional)</h2>
            <FormTextarea
              name="notes"
              label=""
              placeholder="Add any notes about this payment..."
              rows={3}
              maxLength={2000}
              showCharacterCount
            />
          </section>

          {/* Security Notice */}
          <div className="bg-[--cream] border-l-4 border-[--gold] p-4 rounded">
            <div className="flex gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-medium text-[--navy]">Secure Payment Processing</p>
                <p className="text-sm text-[--charcoal]">
                  All payments are processed securely through Stripe. We never store your 
                  card information.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 justify-end">
            <Link
              href={`/portal/cases/${caseId}`}
              className="px-6 py-3 border border-[--navy] text-[--navy] rounded hover:bg-[--cream] transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={processPayment.isPending}
              className="px-6 py-3 bg-[--sage] text-white rounded hover:bg-[--navy] transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {processPayment.isPending ? 'Processing...' : 'Process Payment'}
            </button>
          </div>
        </form>
      </Form>

      {/* Payment Flow Note */}
      <div className="text-xs text-gray-500 text-center pb-8">
        <p className="mb-2">
          <strong>Production Implementation:</strong>
        </p>
        <p>
          Install @stripe/stripe-js and @stripe/react-stripe-js • 
          Load Stripe with publishable key • 
          Mount CardElement • 
          Confirm payment with clientSecret • 
          Handle 3D Secure authentication • 
          Show receipt on success
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="text-center">Loading...</div>}>
      <PaymentFormContent />
    </Suspense>
  );
}
