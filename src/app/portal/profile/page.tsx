"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/toast";
import { ErrorBoundary, PageErrorFallback } from "@/components/error";
import { User, Bell, FileText, Shield, Loader2, Save, Check } from "lucide-react";
import { useFormDraft } from "@/hooks/useFormDraft";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

type Tab = "personal" | "notifications" | "cases" | "security";

function ProfilePageContent() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch profile data
  const {
    data: profile,
    isLoading,
    refetch,
  } = trpc.user.getProfile.useQuery();

  // Update profile mutation
  const updateProfileMutation = trpc.user.updateProfile.useMutation();

  // Personal information state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasPersonalChanges, setHasPersonalChanges] = useState(false);

  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState({
    caseUpdates: true,
    paymentReminders: true,
    documentUploads: true,
    taskAssignments: true,
  });
  const [smsNotifications, setSmsNotifications] = useState({
    urgentUpdates: false,
    appointmentReminders: false,
  });
  const [hasNotificationChanges, setHasNotificationChanges] = useState(false);

  // Update local state when profile loads
  if (profile && !name && !phone) {
    setName(profile.name);
    setPhone(profile.phone || "");
    setEmailNotifications(profile.preferences.emailNotifications);
    setSmsNotifications(profile.preferences.smsNotifications);
  }

  // Form draft saving for personal info
  const { hasDraft, restoreDraft, lastSaved, clearDraft } = useFormDraft({
    key: `profile-personal-${profile?.id}`,
    data: { name, phone },
    enabled: activeTab === "personal",
    onRestore: (data) => {
      setName(data.name);
      setPhone(data.phone);
      setHasPersonalChanges(true);
    },
  });

  // Unsaved changes warning
  useUnsavedChanges({
    hasUnsavedChanges: hasPersonalChanges || hasNotificationChanges,
    message: "You have unsaved changes. Are you sure you want to leave?",
  });

  const handleSavePersonalInfo = async () => {
    setIsSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        name,
        phone: phone || null,
      });

      toast.success("Personal information updated successfully");
      setHasPersonalChanges(false);
      clearDraft(); // Clear draft after successful save
      refetch();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update personal information");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await updateProfileMutation.mutateAsync({
        preferences: {
          emailNotifications,
          smsNotifications,
        },
      });

      toast.success("Notification preferences updated successfully");
      setHasNotificationChanges(false);
      refetch();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update notification preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "personal" as Tab, label: "Personal Information", icon: User },
    { id: "notifications" as Tab, label: "Notifications", icon: Bell },
    { id: "cases" as Tab, label: "Case Access", icon: FileText },
    { id: "security" as Tab, label: "Security", icon: Shield },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[--navy]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-serif font-bold text-[--navy]">
            Profile Settings
          </h1>
          <p className="mt-1 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <nav className="space-y-1 bg-white rounded-lg shadow-sm p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-[--navy] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9 mt-6 lg:mt-0">
            {/* Personal Information */}
            {activeTab === "personal" && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Personal Information
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Update your basic account information
                  </p>
                </div>

                <div className="px-6 py-6 space-y-6">
                  {/* Draft Restore Banner */}
                  {hasDraft && !hasPersonalChanges && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-blue-900">
                            Unsaved changes found
                          </h3>
                          <p className="text-sm text-blue-700 mt-1">
                            You have unsaved changes from{" "}
                            {lastSaved && new Date(lastSaved).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={restoreDraft}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Restore Draft
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                        setName(e.target.value);
                        setHasPersonalChanges(true);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                        setPhone(e.target.value);
                        setHasPersonalChanges(true);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  {/* Role (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Role
                    </label>
                    <input
                      type="text"
                      value={
                        profile.role
                          .split("_")
                          .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
                          .join(" ")
                      }
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleSavePersonalInfo}
                      disabled={!hasPersonalChanges || isSaving}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Preferences */}
            {activeTab === "notifications" && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Notification Preferences
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Choose how you want to be notified about updates
                  </p>
                </div>

                <div className="px-6 py-6 space-y-8">
                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Email Notifications
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          key: "caseUpdates" as const,
                          label: "Case Updates",
                          description: "Get notified when there are updates to your cases",
                        },
                        {
                          key: "paymentReminders" as const,
                          label: "Payment Reminders",
                          description: "Receive reminders for upcoming payments",
                        },
                        {
                          key: "documentUploads" as const,
                          label: "Document Uploads",
                          description: "Get notified when new documents are uploaded",
                        },
                        {
                          key: "taskAssignments" as const,
                          label: "Task Assignments",
                          description: "Receive notifications when tasks are assigned to you",
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={emailNotifications[item.key]}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                              setEmailNotifications({
                                ...emailNotifications,
                                [item.key]: (e.target as HTMLInputElement).checked,
                              });
                              setHasNotificationChanges(true);
                            }}
                            className="mt-1 w-5 h-5 text-[--navy] border-gray-300 rounded focus:ring-[--navy]"
                          />
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-900 cursor-pointer">
                              {item.label}
                            </label>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      SMS Notifications
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          key: "urgentUpdates" as const,
                          label: "Urgent Updates",
                          description: "Receive SMS for time-sensitive updates",
                        },
                        {
                          key: "appointmentReminders" as const,
                          label: "Appointment Reminders",
                          description: "Get SMS reminders for scheduled appointments",
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={smsNotifications[item.key]}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                              setSmsNotifications({
                                ...smsNotifications,
                                [item.key]: (e.target as HTMLInputElement).checked,
                              });
                              setHasNotificationChanges(true);
                            }}
                            className="mt-1 w-5 h-5 text-[--navy] border-gray-300 rounded focus:ring-[--navy]"
                          />
                          <div className="flex-1">
                            <label className="text-sm font-medium text-gray-900 cursor-pointer">
                              {item.label}
                            </label>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleSaveNotifications}
                      disabled={!hasNotificationChanges || isSaving}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[--navy] text-white rounded-lg hover:bg-[--navy]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Preferences
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Case Access */}
            {activeTab === "cases" && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Case Access
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    View all cases you have access to
                  </p>
                </div>

                <div className="px-6 py-6">
                  {profile.caseMemberships.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No case access yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        You'll see cases here once they're assigned to you
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {profile.caseMemberships.map((membership) => (
                        <div
                          key={membership.caseId}
                          className="p-4 border border-gray-200 rounded-lg hover:border-[--navy] transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-base font-medium text-gray-900">
                                {membership.caseName}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Case #{membership.caseNumber}
                              </p>
                            </div>
                            <div className="ml-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {membership.role
                                  .split("_")
                                  .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
                                  .join(" ")}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                            <span>
                              Invited:{" "}
                              {new Date(membership.invitedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            {membership.acceptedAt && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Check className="w-4 h-4 text-green-600" />
                                  Accepted
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security */}
            {activeTab === "security" && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Security Settings
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage your account security
                  </p>
                </div>

                <div className="px-6 py-6 space-y-6">
                  {/* Password Management */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-base font-medium text-gray-900 mb-2">
                      Password
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Password management is handled through Clerk authentication.
                    </p>
                    <button
                      onClick={() => {
                        // Placeholder - would integrate with Clerk
                        toast.info("Password change redirects to Clerk");
                      }}
                      className="px-4 py-2 text-sm font-medium text-[--navy] border border-[--navy] rounded-lg hover:bg-[--navy] hover:text-white transition-colors"
                    >
                      Change Password
                    </button>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-base font-medium text-gray-900 mb-2">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Add an extra layer of security to your account.
                    </p>
                    <button
                      onClick={() => {
                        // Placeholder - would integrate with Clerk
                        toast.info("2FA setup redirects to Clerk");
                      }}
                      className="px-4 py-2 text-sm font-medium text-[--navy] border border-[--navy] rounded-lg hover:bg-[--navy] hover:text-white transition-colors"
                    >
                      Enable Two-Factor Auth
                    </button>
                  </div>

                  {/* Account Verification */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-base font-medium text-gray-900 mb-2">
                      Email Verification
                    </h3>
                    {profile.emailVerified ? (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="w-4 h-4" />
                        Email verified on{" "}
                        {new Date(profile.emailVerified).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mb-4">
                          Please verify your email address for full account access.
                        </p>
                        <button
                          onClick={() => {
                            // Placeholder - would integrate with Clerk
                            toast.info("Verification email sent");
                          }}
                          className="px-4 py-2 text-sm font-medium text-[--navy] border border-[--navy] rounded-lg hover:bg-[--navy] hover:text-white transition-colors"
                        >
                          Resend Verification Email
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ErrorBoundary fallback={(error, reset) => <PageErrorFallback error={error} reset={reset} />}>
      <ProfilePageContent />
    </ErrorBoundary>
  );
}
