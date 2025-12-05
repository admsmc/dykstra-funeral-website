"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table";
import {
  CreditCard,
  Building2,
  Calendar,
  Shield,
  Download,
  Plus,
  Loader2,
  DollarSign,
  Clock,
  CheckCircle2,
} from "lucide-react";

type PaymentMethod = "card" | "ach" | "plan" | "insurance";

interface Payment {
  id: string;
  paidDate: Date | string;
  amount: number;
  method: string;
  status: string;
}

export default function PaymentsPage() {
  const params = useParams();
  const caseId = params.id as string;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Stripe state
  const [cardAmount, setCardAmount] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();

  // ACH form state
  const [achAmount, setAchAmount] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountType, setAccountType] = useState<"checking" | "savings">("checking");

  // Payment plan form state
  const [planTotalAmount, setPlanTotalAmount] = useState("");
  const [planDownPayment, setPlanDownPayment] = useState("");
  const [planInstallments, setPlanInstallments] = useState("12");
  const [planFrequency, setPlanFrequency] = useState<"MONTHLY" | "BI_WEEKLY">("MONTHLY");
  const [planStartDate, setPlanStartDate] = useState("");

  // Insurance form state
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [policyHolderName, setPolicyHolderName] = useState("");
  const [assignedAmount, setAssignedAmount] = useState("");
  const [claimNumber, setClaimNumber] = useState("");
  const [insuranceNotes, setInsuranceNotes] = useState("");

  // Fetch payment history
  const { data: paymentHistory, isLoading, refetch } = trpc.payment.getHistory.useQuery({
    caseId,
  });

  const { data: currentCase } = trpc.case.getById.useQuery({ id: caseId });

  // Mutations
  const processACHMutation = trpc.payment.processACH.useMutation();
  const createPlanMutation = trpc.payment.createPlan.useMutation();
  const assignInsuranceMutation = trpc.payment.assignInsurance.useMutation();
  const createPaymentIntentMutation = trpc.stripe.createPaymentIntent.useMutation();

  const handleACHPayment = async () => {
    if (!achAmount || !routingNumber || !accountNumber || !accountHolderName) {
      toast.error("Please fill in all ACH payment fields");
      return;
    }

    setIsProcessing(true);
    try {
      await processACHMutation.mutateAsync({
        caseId,
        amount: parseFloat(achAmount),
        routingNumber,
        accountNumber,
        accountHolderName,
        accountType,
      });

      toast.success("ACH payment initiated successfully");
      setSelectedMethod(null);
      setAchAmount("");
      setRoutingNumber("");
      setAccountNumber("");
      setAccountHolderName("");
      refetch();
    } catch (error) {
      console.error("ACH payment error:", error);
      toast.error("Failed to process ACH payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!planTotalAmount || !planDownPayment || !planStartDate) {
      toast.error("Please fill in all payment plan fields");
      return;
    }

    setIsProcessing(true);
    try {
      await createPlanMutation.mutateAsync({
        caseId,
        totalAmount: parseFloat(planTotalAmount),
        downPayment: parseFloat(planDownPayment),
        numberOfInstallments: parseInt(planInstallments),
        frequency: planFrequency,
        startDate: new Date(planStartDate),
      });

      toast.success("Payment plan created successfully");
      setSelectedMethod(null);
      setPlanTotalAmount("");
      setPlanDownPayment("");
      setPlanStartDate("");
      refetch();
    } catch (error) {
      console.error("Payment plan error:", error);
      toast.error("Failed to create payment plan");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignInsurance = async () => {
    if (!insuranceCompany || !policyNumber || !policyHolderName || !assignedAmount) {
      toast.error("Please fill in all required insurance fields");
      return;
    }

    setIsProcessing(true);
    try {
      await assignInsuranceMutation.mutateAsync({
        caseId,
        insuranceCompany,
        policyNumber,
        policyHolderName,
        assignedAmount: parseFloat(assignedAmount),
        claimNumber: claimNumber || undefined,
        notes: insuranceNotes || undefined,
      });

      toast.success("Insurance assignment created successfully");
      setSelectedMethod(null);
      setInsuranceCompany("");
      setPolicyNumber("");
      setPolicyHolderName("");
      setAssignedAmount("");
      setClaimNumber("");
      setInsuranceNotes("");
      refetch();
    } catch (error) {
      console.error("Insurance assignment error:", error);
      toast.error("Failed to assign insurance");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    toast.info("Receipt download would open in new tab");
    // In production, this would fetch the receipt and open PDF
    // const receipt = await trpc.payment.getReceipt.query({ paymentId });
    // Generate PDF and download
  };

  // Payment table column definitions
  const paymentColumns: ColumnDef<Payment>[] = [
    {
      accessorKey: "paidDate",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.original.paidDate);
        return (
          <span className="text-sm text-gray-900">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900">
          ${row.original.amount.toFixed(2)}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">
          {row.original.method.replace("_", " ")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const statusClasses =
          status === "SUCCEEDED"
            ? "bg-green-100 text-green-800"
            : status === "PENDING"
            ? "bg-yellow-100 text-yellow-800"
            : status === "FAILED"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-800";
        
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        if (row.original.status !== "SUCCEEDED") return null;
        
        return (
          <div className="text-right">
            <button
              onClick={() => handleDownloadReceipt(row.original.id)}
              className="inline-flex items-center gap-1 text-sm text-[--navy] hover:text-[--navy]/80"
            >
              <Download className="w-4 h-4" />
              Receipt
            </button>
          </div>
        );
      },
    },
  ];

  const paymentMethodOptions = [
    {
      id: "card" as PaymentMethod,
      icon: CreditCard,
      label: "Credit/Debit Card",
      description: "Pay securely with your card",
    },
    {
      id: "ach" as PaymentMethod,
      icon: Building2,
      label: "Bank Transfer (ACH)",
      description: "Direct payment from your bank account",
    },
    {
      id: "plan" as PaymentMethod,
      icon: Calendar,
      label: "Payment Plan",
      description: "Split into monthly installments",
    },
    {
      id: "insurance" as PaymentMethod,
      icon: Shield,
      label: "Insurance Assignment",
      description: "Assign benefits to cover costs",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-serif font-bold text-[--navy]">Payments</h1>
          {currentCase && (
            <p className="mt-1 text-gray-600">
              {currentCase.decedentFirstName} {currentCase.decedentLastName} • Case #
              {currentCase.caseNumber}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Balance Summary Cards */}
          <div className="lg:col-span-3 grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Total Paid</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                ${isLoading ? "..." : paymentHistory?.totalPaid.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Pending</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                ${isLoading ? "..." : paymentHistory?.pendingAmount.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Balance</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">$0.00</p>
              <p className="text-xs text-gray-500 mt-1">Contract required</p>
            </div>
          </div>

          {/* Payment History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
                <button
                  onClick={() => setSelectedMethod("card")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[--navy] text-white text-sm font-medium rounded-lg hover:bg-[--navy]/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Make Payment
                </button>
              </div>

              <div className="p-6">
                <DataTable
                  data={paymentHistory?.payments || []}
                  columns={paymentColumns}
                  isLoading={isLoading}
                  enableColumnVisibility={true}
                  enableExport={true}
                  enableStickyHeader={false}
                  pageSize={10}
                  exportFilename="payment-history"
                  emptyState={
                    <div className="text-center py-12">
                      <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No payments yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Your payment history will appear here
                      </p>
                    </div>
                  }
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector / Form */}
          <div className="lg:col-span-1">
            {!selectedMethod ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Options
                </h2>
                <div className="space-y-3">
                  {paymentMethodOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedMethod(option.id)}
                        className="w-full flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-[--navy] hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Icon className="w-5 h-5 text-gray-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900">
                            {option.label}
                          </h3>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedMethod === "card" && "Credit/Debit Card"}
                    {selectedMethod === "ach" && "Bank Transfer"}
                    {selectedMethod === "plan" && "Payment Plan"}
                    {selectedMethod === "insurance" && "Insurance Assignment"}
                  </h2>
                  <button
                    onClick={() => setSelectedMethod(null)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>

                <div className="px-6 py-6">
                  {/* Card Payment Form */}
                  {selectedMethod === "card" && (
                    <div className="space-y-4">
                      {!clientSecret ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Amount
                            </label>
                            <input
                              type="number"
                              value={cardAmount}
                              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setCardAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                            />
                          </div>
                          <button
                            onClick={async () => {
                              if (!cardAmount || parseFloat(cardAmount) <= 0) {
                                toast.error("Please enter a valid amount");
                                return;
                              }
                              setIsProcessing(true);
                              try {
                                const result = await createPaymentIntentMutation.mutateAsync({
                                  caseId,
                                  amount: parseFloat(cardAmount),
                                });
                                setClientSecret(result.clientSecret);
                              } catch (error) {
                                toast.error("Failed to initialize payment");
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Preparing...
                              </>
                            ) : (
                              "Continue to Payment"
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="p-4 bg-gray-50 rounded-lg mb-4">
                            <p className="text-sm text-gray-700">
                              Amount: <span className="font-semibold">${parseFloat(cardAmount).toFixed(2)}</span>
                            </p>
                          </div>
                          <PaymentElement />
                          <button
                            onClick={async () => {
                              if (!stripe || !elements) {
                                toast.error("Stripe not loaded");
                                return;
                              }
                              setIsProcessing(true);
                              try {
                                const { error } = await stripe.confirmPayment({
                                  elements,
                                  confirmParams: {
                                    return_url: `${window.location.origin}/cases/${caseId}/payments?success=true`,
                                  },
                                });
                                if (error) {
                                  toast.error(error.message || "Payment failed");
                                }
                              } catch (error) {
                                toast.error("Payment processing error");
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                            disabled={isProcessing || !stripe}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Pay Now"
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* ACH Payment Form */}
                  {selectedMethod === "ach" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount
                        </label>
                        <input
                          type="number"
                          value={achAmount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setAchAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          value={accountHolderName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setAccountHolderName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Routing Number
                        </label>
                        <input
                          type="text"
                          value={routingNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setRoutingNumber(e.target.value)}
                          placeholder="123456789"
                          maxLength={9}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setAccountNumber(e.target.value)}
                          placeholder="1234567890"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Type
                        </label>
                        <select
                          value={accountType}
                          onChange={(e) =>
                            setAccountType(e.target.value as "checking" | "savings")
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        >
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                        </select>
                      </div>

                      <button
                        onClick={handleACHPayment}
                        disabled={isProcessing}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Submit Payment"
                        )}
                      </button>
                    </div>
                  )}

                  {/* Payment Plan Form */}
                  {selectedMethod === "plan" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Amount
                        </label>
                        <input
                          type="number"
                          value={planTotalAmount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setPlanTotalAmount(e.target.value)}
                          placeholder="10000.00"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Down Payment
                        </label>
                        <input
                          type="number"
                          value={planDownPayment}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setPlanDownPayment(e.target.value)}
                          placeholder="2000.00"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Installments
                        </label>
                        <select
                          value={planInstallments}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setPlanInstallments(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        >
                          <option value="6">6 months</option>
                          <option value="12">12 months</option>
                          <option value="18">18 months</option>
                          <option value="24">24 months</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Frequency
                        </label>
                        <select
                          value={planFrequency}
                          onChange={(e) =>
                            setPlanFrequency(e.target.value as "MONTHLY" | "BI_WEEKLY")
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        >
                          <option value="MONTHLY">Monthly</option>
                          <option value="BI_WEEKLY">Bi-weekly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={planStartDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setPlanStartDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        />
                      </div>

                      <button
                        onClick={handleCreatePlan}
                        disabled={isProcessing}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Payment Plan"
                        )}
                      </button>
                    </div>
                  )}

                  {/* Insurance Assignment Form */}
                  {selectedMethod === "insurance" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Insurance Company
                        </label>
                        <input
                          type="text"
                          value={insuranceCompany}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setInsuranceCompany(e.target.value)}
                          placeholder="State Farm, Allstate, etc."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Policy Number
                        </label>
                        <input
                          type="text"
                          value={policyNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setPolicyNumber(e.target.value)}
                          placeholder="ABC123456789"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Policy Holder Name
                        </label>
                        <input
                          type="text"
                          value={policyHolderName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setPolicyHolderName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assigned Amount
                        </label>
                        <input
                          type="number"
                          value={assignedAmount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setAssignedAmount(e.target.value)}
                          placeholder="10000.00"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Claim Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={claimNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setClaimNumber(e.target.value)}
                          placeholder="CLM-2024-001"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={insuranceNotes}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setInsuranceNotes(e.target.value)}
                          placeholder="Additional information..."
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy]"
                        />
                      </div>

                      <button
                        onClick={handleAssignInsurance}
                        disabled={isProcessing}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Assignment"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
