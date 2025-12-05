"use client";

import { useEffect } from 'react';
import { PageErrorFallback } from '@/components/error';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Contracts page error:', error);
  }, [error]);

  return <PageErrorFallback error={error} reset={reset} />;
}
