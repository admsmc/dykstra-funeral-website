"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { Calendar, DollarSign, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

/**
 * Payment Plan Tab
 * Manage payment plans and installments
 * 
 * Features:
 * - List payment plans by case
 * - Show installment schedule with status
 * - Calculate remaining balance
 * - Show overdue installments
 * - Link to payment records
 * - Visual progress tracking
 */

interface PaymentPlan {
  id: string;
  caseId: string;
  totalAmount: number;
  downPayment: number;
  remainingBalance: number;
  numberOfInstallments: number;
  installmentAmount: number;
  frequency: string;
  startDate: Date;
  nextPaymentDue: Date | null;
  status: string;
  createdAt: Date;
  installments: Installment[];
}

interface Installment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  status: string;
  paidDate: Date | null;
  paymentId: string | null;
}

export default function PaymentPlanTab() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");

  // Fetch payment plans (in production, this would filter by caseId)
  // For MVP, this tab renders mockPlans only; API wiring will be added later.

  // Mock data for MVP demonstration
  const mockPlans: PaymentPlan[] = [
    {
      id: "plan_1",
      caseId: "case_123",
      totalAmount: 10000,
      downPayment: 2000,
      remainingBalance: 6000,
      numberOfInstallments: 8,
      installmentAmount: 1000,
      frequency: "MONTHLY",
      startDate: new Date("2025-02-01"),
      nextPaymentDue: new Date("2025-12-01"),
      status: "ACTIVE",
      createdAt: new Date("2025-01-15"),
      installments: [
        {
          id: "inst_1",
          installmentNumber: 1,
          amount: 1000,
          dueDate: new Date("2025-02-01"),
          status: "PAID",
          paidDate: new Date("2025-02-01"),
          paymentId: "pay_1",
        },
        {
          id: "inst_2",
          installmentNumber: 2,
          amount: 1000,
          dueDate: new Date("2025-03-01"),
          status: "PAID",
          paidDate: new Date("2025-03-01"),
          paymentId: "pay_2",
        },
        {
          id: "inst_3",
          installmentNumber: 3,
          amount: 1000,
          dueDate: new Date("2025-11-15"),
          status: "OVERDUE",
          paidDate: null,
          paymentId: null,
        },
        {
          id: "inst_4",
          installmentNumber: 4,
          amount: 1000,
          dueDate: new Date("2025-12-01"),
          status: "PENDING",
          paidDate: null,
          paymentId: null,
        },
      ],
    },
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; icon: any }> = {
      ACTIVE: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
      COMPLETED: { bg: "bg-blue-100", text: "text-blue-800", icon: CheckCircle },
      CANCELLED: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircle },
      DEFAULTED: { bg: "bg-red-100", text: "text-red-800", icon: AlertCircle },
      PAID: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      OVERDUE: { bg: "bg-red-100", text: "text-red-800", icon: AlertCircle },
    };

    const statusConfig = config[status] || config.PENDING;
    const Icon = statusConfig.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
      >
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Payment Plans</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage installment payment plans for cases
            </p>
          </div>
          <button
            className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition"
            onClick={() => alert("Create new payment plan")}
          >
            Create Plan
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">MVP Note</p>
            <p>
              Payment plan functionality is available in the backend. Full UI integration
              coming soon. Current view shows mock data for demonstration.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Plans List */}
      {mockPlans.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Payment Plans
          </h3>
          <p className="text-gray-600 mb-4">
            Create a payment plan to allow families to pay in installments
          </p>
          <button
            className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:bg-opacity-90 transition"
            onClick={() => alert("Create payment plan")}
          >
            Create First Plan
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {mockPlans.map((plan) => {
            const paidInstallments = plan.installments.filter(
              (i) => i.status === "PAID"
            ).length;
            const progress = (paidInstallments / plan.numberOfInstallments) * 100;
            const overdueCount = plan.installments.filter(
              (i) => i.status === "OVERDUE"
            ).length;

            return (
              <div
                key={plan.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Plan Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Case: {plan.caseId}
                        </h3>
                        <StatusBadge status={plan.status} />
                      </div>
                      <p className="text-sm text-gray-600">
                        {plan.numberOfInstallments} installments •{" "}
                        {plan.frequency.replace("_", " ")} payments •{" "}
                        Started {formatDate(plan.startDate)}
                      </p>
                    </div>
                    <button
                      className="text-sm text-[--navy] hover:underline"
                      onClick={() => alert(`View case ${plan.caseId}`)}
                    >
                      View Case
                    </button>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(plan.totalAmount)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Down Payment</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(plan.downPayment)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Paid to Date</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(
                          plan.totalAmount - plan.remainingBalance
                        )}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Remaining</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(plan.remainingBalance)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Payment Progress
                      </span>
                      <span className="text-sm text-gray-600">
                        {paidInstallments} of {plan.numberOfInstallments} paid (
                        {progress.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 rounded-full h-2 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Overdue Warning */}
                  {overdueCount > 0 && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-900">
                        {overdueCount} installment{overdueCount > 1 ? "s" : ""}{" "}
                        overdue
                      </span>
                    </div>
                  )}
                </div>

                {/* Installment Schedule */}
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">
                    Installment Schedule
                  </h4>
                  <div className="space-y-3">
                    {plan.installments.map((installment) => (
                      <div
                        key={installment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Payment</p>
                            <p className="text-sm font-semibold text-gray-900">
                              #{installment.installmentNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(installment.amount)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Due: {formatDate(installment.dueDate)}
                              </span>
                              {installment.paidDate && (
                                <span className="text-green-600">
                                  • Paid: {formatDate(installment.paidDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={installment.status} />
                          {installment.paymentId ? (
                            <button
                              className="text-xs text-[--navy] hover:underline"
                              onClick={() =>
                                alert(`View payment ${installment.paymentId}`)
                              }
                            >
                              View Payment
                            </button>
                          ) : installment.status === "PENDING" || installment.status === "OVERDUE" ? (
                            <button
                              className="px-3 py-1 text-xs bg-[--navy] text-white rounded hover:bg-opacity-90 transition"
                              onClick={() =>
                                alert(`Record payment for installment ${installment.installmentNumber}`)
                              }
                            >
                              Record Payment
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
