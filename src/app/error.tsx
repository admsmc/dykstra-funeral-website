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
    // Log the error to error reporting service
    console.error('Root error:', error);
  }, [error]);

  return <PageErrorFallback error={error} reset={reset} />;
}
