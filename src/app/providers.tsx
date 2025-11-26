'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import SuperJSON from 'superjson';
import { StripeProvider } from '@/lib/stripe-provider';
import { Toaster } from 'sonner';
import { ClerkProvider } from '@clerk/nextjs';

/**
 * Providers component
 * Wraps app with tRPC and React Query providers
 * 
 * Features:
 * - Automatic request batching
 * - SuperJSON for Date serialization
 * - React Query devtools in development
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: SuperJSON,
        }),
      ],
    })
  );

  return (
    <ClerkProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <StripeProvider>
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  fontFamily: 'var(--font-inter), sans-serif',
                },
                className: 'sonner-toast',
              }}
              richColors
            />
            {children}
          </StripeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ClerkProvider>
  );
}
