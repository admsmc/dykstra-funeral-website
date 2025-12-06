import { useMemo } from 'react';
import { trpc } from '@/lib/trpc-client';
import { PaymentViewModel, PaymentHistoryViewModel } from '../view-models/payment-view-model';

export function usePaymentDetail(paymentId: string) {
  const { data, isLoading, error, refetch } = trpc.payment.getById.useQuery({
    paymentId,
    includeHistory: true,
  });

  const payment = useMemo(
    () => data?.payment ? new PaymentViewModel(data.payment) : null,
    [data?.payment]
  );

  const history = useMemo(
    () =>
      data?.payment && data?.history
        ? new PaymentHistoryViewModel([...data.history], data.payment)
        : null,
    [data?.payment, data?.history]
  );

  return {
    payment,
    history,
    isLoading,
    error,
    refetch,
  };
}
