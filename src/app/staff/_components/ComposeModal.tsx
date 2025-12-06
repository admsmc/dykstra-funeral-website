"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendEmailSchema, sendSMSSchema, type SendEmailInput, type SendSMSInput } from "@dykstra/domain";
import { trpc } from "@/lib/trpc/client";
import { Modal } from "@/components/ui/Modal";
import { Form, FormInput, FormTextarea, FormSelect } from "@/components/ui/Form";
import { SuccessCelebration } from "@/components/ui/SuccessCelebration";
import { Mail, MessageSquare, X } from "lucide-react";

type CommunicationType = "email" | "sms";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  type: CommunicationType;
  // Pre-populate recipients (optional)
  defaultRecipients?: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
  }>;
  caseId?: string;
}

export function ComposeModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  type,
  defaultRecipients = [],
  caseId,
}: ComposeModalProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [recipients, setRecipients] = useState(defaultRecipients);

  // Fetch templates
  const { data: templates = [] } = trpc.communication.listTemplates.useQuery({
    type,
  });

  const isEmail = type === "email";
  const schema = isEmail ? sendEmailSchema : sendSMSSchema;

  const form = useForm<SendEmailInput | SendSMSInput>({
    // @ts-expect-error - Union type resolver issue with conditional schema
    resolver: zodResolver(schema),
    defaultValues: {
      templateId: "",
      recipients: [],
      ...(isEmail ? { subject: "" } : {}),
      body: "",
      caseId,
    },
  });

  // Update recipients when defaultRecipients changes
  useEffect(() => {
    setRecipients(defaultRecipients);
  }, [defaultRecipients]);

  const sendEmailMutation = trpc.communication.sendEmail.useMutation({
    onSuccess: (data) => {
      setSentCount(data.sent);
      setShowCelebration(true);
      form.reset();
      setRecipients([]);
      setSelectedTemplate("");
      setTimeout(() => {
        setShowCelebration(false);
        onClose();
        onSuccess?.();
      }, 3000);
    },
    onError: (error) => {
      console.error("Failed to send email:", error);
      alert(`Failed to send email: ${error.message}`);
    },
  });

  const sendSMSMutation = trpc.communication.sendSMS.useMutation({
    onSuccess: (data) => {
      setSentCount(data.sent);
      setShowCelebration(true);
      form.reset();
      setRecipients([]);
      setSelectedTemplate("");
      setTimeout(() => {
        setShowCelebration(false);
        onClose();
        onSuccess?.();
      }, 3000);
    },
    onError: (error) => {
      console.error("Failed to send SMS:", error);
      alert(`Failed to send SMS: ${error.message}`);
    },
  });

  const mutation = isEmail ? sendEmailMutation : sendSMSMutation;

  const handleClose = () => {
    if (!mutation.isPending) {
      form.reset();
      setRecipients(defaultRecipients);
      setSelectedTemplate("");
      onClose();
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      if (isEmail && "subject" in form.getValues()) {
        form.setValue("subject", template.subject || "");
      }
      form.setValue("body", template.body);
    }
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const onSubmit = (data: SendEmailInput | SendSMSInput) => {
    // Map recipients based on type
    const mappedRecipients = recipients.map((r) => ({
      id: r.id,
      name: r.name,
      ...(isEmail ? { email: r.email || "" } : { phone: r.phone || "" }),
    }));

    const payload = {
      ...data,
      recipients: mappedRecipients,
      templateId: selectedTemplate || undefined,
      caseId,
    };

    if (isEmail) {
      sendEmailMutation.mutate(payload as SendEmailInput);
    } else {
      sendSMSMutation.mutate(payload as SendSMSInput);
    }
  };

  if (showCelebration) {
    return (
      <SuccessCelebration
        message={`${isEmail ? "Email" : "SMS"} sent successfully to ${sentCount} recipient${sentCount === 1 ? "" : "s"}!`}
        onComplete={() => setShowCelebration(false)}
      />
    );
  }

  const characterLimit = isEmail ? 5000 : 160;
  const currentLength = form.watch("body")?.length || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          {isEmail ? <Mail className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          <span>Compose {isEmail ? "Email" : "SMS"}</span>
        </div>
      }
      size="lg"
    >
      {/* @ts-expect-error - Form union type compatibility issue */}
      <Form form={form} onSubmit={onSubmit}>
        <div className="space-y-6">
          {/* Template Selection */}
          {templates.length > 0 && (
            <FormSelect
              name="templateId"
              label="Use Template (Optional)"
              options={[
                { label: "No template", value: "" },
                ...templates.map((t) => ({
                  label: `${t.name} (used ${t.usageCount}x)`,
                  value: t.id,
                })),
              ]}
              onChange={handleTemplateSelect}
            />
          )}

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients ({recipients.length})
            </label>
            {recipients.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                No recipients selected. You can manually add recipients or select contacts from the contacts page.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{recipient.name}</span>
                    <span className="text-indigo-400 text-xs">
                      ({isEmail ? recipient.email : recipient.phone})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(recipient.id)}
                      className="text-indigo-400 hover:text-indigo-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Subject (only for emails) */}
          {isEmail && (
            <FormInput
              name="subject"
              label="Subject"
              placeholder="Enter email subject"
              required
            />
          )}

          {/* Message Body */}
          <div>
            <FormTextarea
              name="body"
              label="Message"
              placeholder={isEmail ? "Enter your email message..." : "Enter your SMS message (160 characters max)..."}
              rows={isEmail ? 10 : 4}
              required
            />
            <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
              <span>
                {currentLength} / {characterLimit} characters
              </span>
              {!isEmail && currentLength > 160 && (
                <span className="text-red-600 font-medium">Message too long!</span>
              )}
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {isEmail ? (
                <>
                  <strong>Note:</strong> Email will be sent from your funeral home's address. Recipients will be able to reply directly.
                </>
              ) : (
                <>
                  <strong>Note:</strong> SMS messages are limited to 160 characters. Keep your message brief and clear.
                </>
              )}
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || recipients.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-[--navy] rounded-lg hover:bg-[--navy]/90 disabled:opacity-50 flex items-center space-x-2"
            >
              {mutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  {isEmail ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  <span>Send {isEmail ? "Email" : "SMS"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
