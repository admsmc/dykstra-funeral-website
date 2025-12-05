'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import { 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  FileText, 
  Lock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  DollarSign,
  Scale,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Select Period', icon: Calendar },
  { id: 2, title: 'Review Trial Balance', icon: Scale },
  { id: 3, title: 'Post Adjustments', icon: FileText },
  { id: 4, title: 'Review Close Report', icon: TrendingUp },
  { id: 5, title: 'Finalize & Lock', icon: Lock },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function PeriodClosePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState<Date | null>(null);
  const [closeId, setCloseId] = useState<string | null>(null);
  const [skipReconciliation, setSkipReconciliation] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');

  // Query: Validate month-end close readiness
  const { data: validation, isLoading: validating } = trpc.financial.periodClose.validate.useQuery(
    { periodEnd: selectedPeriod! },
    { enabled: !!selectedPeriod && currentStep === 2 }
  );

  // Query: Get trial balance
  const { data: trialBalance, isLoading: loadingTrialBalance } = trpc.financial.gl.getTrialBalance.useQuery(
    { period: selectedPeriod!, funeralHomeId: 'default' },
    { enabled: !!selectedPeriod && currentStep === 2 }
  );

  // Mutation: Execute month-end close
  const executeMutation = trpc.financial.periodClose.execute.useMutation({
    onSuccess: (data) => {
      toast.success('Month-end close completed successfully');
      setCloseId(data.closeId);
      setCurrentStep(5);
    },
    onError: (error) => {
      toast.error(`Close failed: ${error.message}`);
    },
  });

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return selectedPeriod !== null;
      case 2:
        return validation?.canClose || skipReconciliation;
      case 3:
        return true; // Can always proceed from adjustments
      case 4:
        return true;
      case 5:
        return closeId !== null;
      default:
        return false;
    }
  }, [currentStep, selectedPeriod, validation, skipReconciliation, closeId]);

  const handleNext = async () => {
    if (currentStep === 4) {
      // Execute close on step 4 -> 5 transition
      if (!selectedPeriod) return;
      
      executeMutation.mutate({
        periodEnd: selectedPeriod,
        tenant: 'default',
        notes: closeNotes,
        skipReconciliationCheck: skipReconciliation,
      });
    } else if (canProceed && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    toast.success('Period closed and locked');
    // Navigate back or reset wizard
    setTimeout(() => {
      window.location.href = '/staff/finops';
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[--cream] p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[--navy] mb-2">
            Month-End Close
          </h1>
          <p className="text-[--charcoal] opacity-70">
            Complete the period close process in 5 steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isLast = index === STEPS.length - 1;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isCompleted
                          ? 'var(--sage)'
                          : isActive
                          ? 'var(--navy)'
                          : 'white',
                        borderColor: isCompleted || isActive ? 'transparent' : 'var(--sage)',
                      }}
                      className="w-12 h-12 rounded-full flex items-center justify-center border-2"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <Icon
                          className={`w-6 h-6 ${
                            isActive ? 'text-white' : 'text-[--sage]'
                          }`}
                        />
                      )}
                    </motion.div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        isActive ? 'text-[--navy]' : 'text-[--charcoal] opacity-60'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>

                  {!isLast && (
                    <div className="flex-1 h-0.5 bg-[--sage] opacity-30 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-[--sage] border-opacity-20 p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <SelectPeriodStep
                key="step1"
                selectedPeriod={selectedPeriod}
                onSelectPeriod={setSelectedPeriod}
              />
            )}
            {currentStep === 2 && (
              <ReviewTrialBalanceStep
                key="step2"
                validation={validation}
                trialBalance={trialBalance}
                loading={validating || loadingTrialBalance}
                skipReconciliation={skipReconciliation}
                onToggleSkip={() => setSkipReconciliation(!skipReconciliation)}
              />
            )}
            {currentStep === 3 && (
              <PostAdjustmentsStep
                key="step3"
                period={selectedPeriod}
              />
            )}
            {currentStep === 4 && (
              <ReviewReportStep
                key="step4"
                period={selectedPeriod}
                notes={closeNotes}
                onNotesChange={setCloseNotes}
              />
            )}
            {currentStep === 5 && (
              <FinalizeStep
                key="step5"
                closeId={closeId}
                onComplete={handleComplete}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || executeMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white border border-[--sage] border-opacity-30 text-[--navy] font-medium hover:bg-[--cream] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed || executeMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[--navy] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {executeMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Executing Close...
                </>
              ) : (
                <>
                  {currentStep === 4 ? 'Execute Close' : 'Next'}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[--sage] text-white font-medium hover:opacity-90 transition-opacity"
            >
              <CheckCircle2 className="w-5 h-5" />
              Complete
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ============================================
   STEP 1: SELECT PERIOD
   ============================================ */
function SelectPeriodStep({ 
  selectedPeriod, 
  onSelectPeriod 
}: { 
  selectedPeriod: Date | null; 
  onSelectPeriod: (date: Date) => void;
}) {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);

  const periods = [lastMonth, twoMonthsAgo];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-serif text-[--navy] mb-2">
          Select Period to Close
        </h2>
        <p className="text-[--charcoal] opacity-70">
          Choose the accounting period you want to close
        </p>
      </div>

      <motion.div variants={item} className="grid gap-4">
        {periods.map((period) => {
          const isSelected = selectedPeriod?.getTime() === period.getTime();
          const monthYear = period.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          });

          return (
            <button
              key={period.toISOString()}
              onClick={() => onSelectPeriod(period)}
              className={`p-6 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-[--navy] bg-[--navy] bg-opacity-5'
                  : 'border-[--sage] border-opacity-20 hover:border-[--sage] hover:bg-[--cream]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Calendar className={`w-8 h-8 ${isSelected ? 'text-[--navy]' : 'text-[--sage]'}`} />
                  <div>
                    <div className="text-xl font-semibold text-[--navy]">
                      {monthYear}
                    </div>
                    <div className="text-sm text-[--charcoal] opacity-60">
                      Period ending {period.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-6 h-6 text-[--navy]" />
                )}
              </div>
            </button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

/* ============================================
   STEP 2: REVIEW TRIAL BALANCE
   ============================================ */
function ReviewTrialBalanceStep({ 
  validation, 
  trialBalance,
  loading,
  skipReconciliation,
  onToggleSkip,
}: { 
  validation: any; 
  trialBalance: any;
  loading: boolean;
  skipReconciliation: boolean;
  onToggleSkip: () => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-[--navy] animate-spin mb-4" />
        <p className="text-[--charcoal] opacity-70">Validating period close readiness...</p>
      </div>
    );
  }

  const canClose = validation?.canClose || skipReconciliation;
  const issues = validation?.issues || [];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-serif text-[--navy] mb-2">
          Review Trial Balance
        </h2>
        <p className="text-[--charcoal] opacity-70">
          Verify all accounts are balanced before proceeding
        </p>
      </div>

      {/* Validation Status */}
      <motion.div 
        variants={item}
        className={`p-6 rounded-lg border-2 ${
          canClose
            ? 'border-green-500 border-opacity-30 bg-green-50'
            : 'border-yellow-500 border-opacity-30 bg-yellow-50'
        }`}
      >
        <div className="flex items-start gap-4">
          {canClose ? (
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className="font-semibold text-lg mb-1">
              {canClose ? 'Ready to Close' : 'Issues Found'}
            </h3>
            <p className="text-sm opacity-80">
              {canClose 
                ? 'All validation checks passed. You can proceed with the close.'
                : `${issues.length} issue(s) must be resolved before closing.`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Issues List */}
      {issues.length > 0 && (
        <motion.div variants={item} className="space-y-3">
          <h3 className="font-semibold text-[--navy]">Outstanding Issues:</h3>
          {issues.map((issue: string, index: number) => (
            <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{issue}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Trial Balance Summary */}
      <motion.div variants={item} className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-[--cream] rounded-lg">
          <div className="text-sm text-[--charcoal] opacity-60 mb-1">Total Debits</div>
          <div className="text-2xl font-semibold text-[--navy]">
            ${(trialBalance?.totalDebits || 0).toLocaleString()}
          </div>
        </div>
        <div className="p-4 bg-[--cream] rounded-lg">
          <div className="text-sm text-[--charcoal] opacity-60 mb-1">Total Credits</div>
          <div className="text-2xl font-semibold text-[--navy]">
            ${(trialBalance?.totalCredits || 0).toLocaleString()}
          </div>
        </div>
        <div className="p-4 bg-[--cream] rounded-lg">
          <div className="text-sm text-[--charcoal] opacity-60 mb-1">Status</div>
          <div className={`text-2xl font-semibold ${trialBalance?.balanced ? 'text-green-600' : 'text-red-600'}`}>
            {trialBalance?.balanced ? 'Balanced' : 'Out of Balance'}
          </div>
        </div>
      </motion.div>

      {/* Skip Option */}
      {!canClose && (
        <motion.div variants={item} className="pt-4 border-t border-[--sage] border-opacity-20">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={skipReconciliation}
              onChange={onToggleSkip}
              className="w-5 h-5 rounded border-[--sage] text-[--navy] focus:ring-[--navy]"
            />
            <span className="text-sm text-[--charcoal]">
              Skip reconciliation check and proceed anyway (not recommended)
            </span>
          </label>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ============================================
   STEP 3: POST ADJUSTMENTS
   ============================================ */
function PostAdjustmentsStep({ period }: { period: Date | null }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-serif text-[--navy] mb-2">
          Post Adjusting Entries
        </h2>
        <p className="text-[--charcoal] opacity-70">
          Record any necessary adjusting entries before finalizing the close
        </p>
      </div>

      <motion.div variants={item} className="p-6 bg-[--cream] rounded-lg text-center">
        <FileText className="w-12 h-12 text-[--sage] mx-auto mb-4" />
        <p className="text-[--charcoal] mb-4">
          No pending adjusting entries for this period
        </p>
        <button className="px-4 py-2 bg-[--navy] text-white rounded-lg hover:opacity-90 transition-opacity">
          Create Journal Entry
        </button>
      </motion.div>

      <motion.div variants={item} className="text-sm text-[--charcoal] opacity-60">
        Common adjusting entries include:
        <ul className="mt-2 space-y-1 ml-4 list-disc">
          <li>Accrued expenses</li>
          <li>Deferred revenue</li>
          <li>Depreciation</li>
          <li>Prepaid expenses</li>
        </ul>
      </motion.div>
    </motion.div>
  );
}

/* ============================================
   STEP 4: REVIEW CLOSE REPORT
   ============================================ */
function ReviewReportStep({ 
  period, 
  notes,
  onNotesChange,
}: { 
  period: Date | null;
  notes: string;
  onNotesChange: (notes: string) => void;
}) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-serif text-[--navy] mb-2">
          Review Close Summary
        </h2>
        <p className="text-[--charcoal] opacity-70">
          Review the summary before executing the close
        </p>
      </div>

      <motion.div variants={item} className="space-y-4">
        <div className="p-4 bg-[--cream] rounded-lg">
          <div className="text-sm text-[--charcoal] opacity-60 mb-1">Period</div>
          <div className="text-lg font-semibold text-[--navy]">
            {period?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[--charcoal] mb-2">
            Close Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add any notes about this period close..."
            rows={4}
            className="w-full px-4 py-3 border border-[--sage] border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent"
          />
        </div>
      </motion.div>

      <motion.div 
        variants={item}
        className="p-6 bg-yellow-50 border-2 border-yellow-500 border-opacity-30 rounded-lg"
      >
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg mb-1">Warning</h3>
            <p className="text-sm opacity-80">
              Executing this close will lock the period and prevent further changes. 
              Make sure all transactions are recorded correctly.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================
   STEP 5: FINALIZE
   ============================================ */
function FinalizeStep({ 
  closeId, 
  onComplete 
}: { 
  closeId: string | null;
  onComplete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-6" />
      </motion.div>

      <h2 className="text-3xl font-serif text-[--navy] mb-4">
        Period Close Complete!
      </h2>
      <p className="text-[--charcoal] opacity-70 mb-8">
        The period has been successfully closed and locked
      </p>

      <div className="inline-block p-4 bg-[--cream] rounded-lg mb-8">
        <div className="text-sm text-[--charcoal] opacity-60 mb-1">Close ID</div>
        <div className="font-mono text-lg text-[--navy]">{closeId || 'N/A'}</div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 border border-[--sage] border-opacity-30 rounded-lg text-[--navy] hover:bg-[--cream] transition-colors"
        >
          Print Summary
        </button>
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-[--navy] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Return to Dashboard
        </button>
      </div>
    </motion.div>
  );
}
