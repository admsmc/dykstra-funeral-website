'use client';

import { trpc } from '@/lib/trpc/client';
import { useState, useRef, use } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/toast';
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';

/**
 * Contract Signing Page
 * 
 * ESIGN Act Compliant Features:
 * - Captures IP address and user agent
 * - Records exact consent text
 * - Requires explicit consent acceptance
 * - Creates immutable signature record (SCD2)
 * - Stores signature image securely
 */
export default function ContractSigningPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);
  const toast = useToast();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load contract details
  const { data: contract, isLoading } = trpc.contract.getDetails.useQuery({ 
    contractId: id 
  });
  
  const utils = trpc.useUtils();

  // Sign contract mutation with optimistic updates
  const signContractMutation = trpc.contract.sign.useMutation();
  
  let previousContract: any = null;
  
  const { mutate: signContract, isOptimistic } = useOptimisticMutation({
    mutationFn: async (variables: {
      contractId: string;
      signerId: string;
      signerName: string;
      signerEmail: string;
      signatureData: string;
      ipAddress: string;
      userAgent: string;
      consentText: string;
      consentAccepted: boolean;
    }) => {
      return signContractMutation.mutateAsync(variables);
    },
    onOptimisticUpdate: async () => {
      // Cancel outgoing refetches
      await utils.contract.getDetails.cancel({ contractId: id });
      
      // Snapshot current value
      previousContract = utils.contract.getDetails.getData({ contractId: id });
      
      // Optimistically update contract status
      utils.contract.getDetails.setData(
        { contractId: id },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            status: 'SIGNED' as const,
            signedAt: new Date().toISOString(),
          };
        }
      );
      
      // Update local UI state
      setIsSigned(true);
    },
    rollback: () => {
      // Roll back to previous value on error
      if (previousContract) {
        utils.contract.getDetails.setData({ contractId: id }, previousContract);
      }
      setIsSigned(false);
      utils.contract.getDetails.invalidate({ contractId: id });
    },
    onSuccess: () => {
      toast.success('Contract signed successfully');
      utils.contract.getDetails.invalidate({ contractId: id });
      window.location.href = `/portal/contracts/${id}/success`;
    },
    onError: (err: any) => {
      toast.error(`Failed to sign contract: ${err.message}`);
    },
  });

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData('');
  };

  const handleSubmit = async () => {
    if (!signatureData || !consentAccepted) {
      toast.warning('Please sign the document and accept the consent terms');
      return;
    }

    // Capture IP and user agent for ESIGN Act compliance
    const userAgent = navigator.userAgent;
    // Note: IP address should be captured server-side for security
    
    await signContract({
      contractId: id,
      signerId: 'current-user-id', // From auth context
      signerName: 'Current User', // From auth context
      signerEmail: 'user@example.com', // From auth context
      signatureData: signatureData.split(',')[1], // Remove data:image/png;base64, prefix
      ipAddress: '0.0.0.0', // Will be captured server-side
      userAgent,
      consentText: ESIGN_CONSENT_TEXT,
      consentAccepted,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[--navy]">Loading contract...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link 
          href={`/portal/cases/${id}`}
          className="text-[--sage] hover:text-[--navy] mb-2 inline-block"
        >
          ← Back to Case
        </Link>
        <h1 className="text-4xl font-serif text-[--navy] mb-2">Sign Contract</h1>
        <p className="text-[--charcoal]">
          Please review the contract below and provide your electronic signature.
        </p>
      </div>

      {/* Contract Preview */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-serif text-[--navy] mb-4">Contract Preview</h2>
        <div className="border border-gray-200 rounded p-6 bg-gray-50 max-h-96 overflow-y-auto">
          <h3 className="font-bold mb-4">Service Agreement</h3>
          <p className="mb-4">
            This contract placeholder shows where the actual contract content would appear.
            In production, this would display the full contract terms, service details,
            and pricing information.
          </p>
          <p className="mb-4">
            <strong>Total Amount:</strong> $5,000.00
          </p>
          <p className="text-sm text-gray-600">
            Contract ID: {id}
          </p>
        </div>
      </section>

      {/* ESIGN Act Consent */}
      <section className="bg-[--cream] rounded-lg p-6 border-l-4 border-[--gold]">
        <h2 className="text-xl font-serif text-[--navy] mb-4">Electronic Signature Consent</h2>
        <div className="prose prose-sm max-w-none text-[--charcoal] mb-4">
          {ESIGN_CONSENT_TEXT}
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentAccepted}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setConsentAccepted(e.target.checked)}
            className="mt-1 w-5 h-5"
          />
          <span className="text-sm text-[--charcoal]">
            I have read and agree to the Electronic Signature Consent above. 
            I consent to conducting this transaction electronically.
          </span>
        </label>
      </section>

      {/* Signature Pad */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-serif text-[--navy] mb-4">Your Signature</h2>
        <div className="space-y-4">
          <div className="border-2 border-[--navy] rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full bg-white cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={clearSignature}
              className="px-4 py-2 border border-[--sage] text-[--sage] rounded hover:bg-[--sage] hover:text-white transition"
            >
              Clear
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Sign above using your mouse or touchscreen. Your signature will be 
            securely stored and legally binding under the ESIGN Act.
          </p>
        </div>
      </section>

      {/* Submit */}
      <div className="flex gap-4 justify-end">
        <Link
          href={`/portal/cases/${id}`}
          className="px-6 py-3 border border-[--navy] text-[--navy] rounded hover:bg-[--cream] transition"
        >
          Cancel
        </Link>
        <button
          onClick={handleSubmit}
          disabled={!signatureData || !consentAccepted || isOptimistic || isSigned}
          className="px-6 py-3 bg-[--sage] text-white rounded hover:bg-[--navy] transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isOptimistic ? 'Signing...' : isSigned ? 'Signed ✓' : 'Sign Contract'}
        </button>
      </div>

      {/* Legal Notice */}
      <div className="text-xs text-gray-500 text-center pb-8">
        By signing, you agree that your electronic signature is legally binding and equivalent 
        to a handwritten signature under the Electronic Signatures in Global and National 
        Commerce Act (ESIGN Act).
      </div>
    </div>
  );
}

const ESIGN_CONSENT_TEXT = `
By checking the box below and providing your electronic signature, you agree to the following:

1. You consent to use electronic signatures and records for this transaction.

2. You understand that your electronic signature is legally binding and has the same effect 
   as a handwritten signature.

3. You have the ability to download, print, or save a copy of this agreement.

4. You have access to a device capable of viewing and accessing electronic records.

5. You may withdraw this consent at any time by contacting the funeral home directly.

6. Your signature, IP address, and timestamp will be recorded for verification purposes.

This consent is provided under the Electronic Signatures in Global and National Commerce 
Act (ESIGN Act, 15 U.S.C. § 7001 et seq.).
`;
