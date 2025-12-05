import { z } from "zod";
import { staffProcedure, createTRPCRouter } from "../trpc";

// ============================================================================
// Schemas
// ============================================================================

export const templateTypeSchema = z.enum(["email", "sms"]);
export const communicationStatusSchema = z.enum([
  "pending",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "failed",
  "bounced",
]);

export const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: templateTypeSchema,
  subject: z.string().optional(), // Email only
  body: z.string(),
  variables: z.array(z.string()), // e.g., ["firstName", "serviceName"]
  usageCount: z.number().default(0),
  lastUsedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const communicationSchema = z.object({
  id: z.string(),
  type: templateTypeSchema,
  templateId: z.string().optional(),
  recipientId: z.string(),
  recipientName: z.string(),
  recipientContact: z.string(), // Email or phone
  caseId: z.string().optional(),
  subject: z.string().optional(),
  body: z.string(),
  status: communicationStatusSchema,
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  openedAt: z.date().optional(),
  clickedAt: z.date().optional(),
  failureReason: z.string().optional(),
});

export type Template = z.infer<typeof templateSchema>;
export type Communication = z.infer<typeof communicationSchema>;
export type TemplateType = z.infer<typeof templateTypeSchema>;
export type CommunicationStatus = z.infer<typeof communicationStatusSchema>;

// ============================================================================
// Mock Data
// ============================================================================

const mockTemplates: Template[] = [
  {
    id: "tpl-1",
    name: "Welcome Email",
    type: "email",
    subject: "Welcome to {{funeralHomeName}}",
    body: "Dear {{firstName}},\n\nWe are honored to serve your family during this difficult time. Our team at {{funeralHomeName}} is here to support you every step of the way.\n\nIf you have any questions, please don't hesitate to reach out at {{funeralHomePhone}}.\n\nWith our deepest sympathies,\n{{funeralHomeName}}",
    variables: ["firstName", "funeralHomeName", "funeralHomePhone"],
    usageCount: 45,
    lastUsedAt: new Date("2024-12-03T10:00:00Z"),
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  {
    id: "tpl-2",
    name: "Appointment Reminder Email",
    type: "email",
    subject: "Appointment Reminder - {{serviceName}} for {{decedentName}}",
    body: "Dear {{firstName}},\n\nThis is a reminder about your appointment at {{funeralHomeName}}.\n\nService: {{serviceName}}\nDate: {{serviceDate}}\nLocation: {{serviceLocation}}\n\nIf you need to reschedule, please call us at {{funeralHomePhone}}.\n\nWith our deepest sympathies,\n{{funeralHomeName}}",
    variables: [
      "firstName",
      "serviceName",
      "decedentName",
      "funeralHomeName",
      "serviceDate",
      "serviceLocation",
      "funeralHomePhone",
    ],
    usageCount: 120,
    lastUsedAt: new Date("2024-12-04T14:30:00Z"),
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-03-20T00:00:00Z"),
  },
  {
    id: "tpl-3",
    name: "Service Reminder Email",
    type: "email",
    subject: "Service Reminder - {{serviceName}} for {{decedentName}}",
    body: "Dear {{firstName}} {{lastName}},\n\nThis is a reminder about the upcoming service:\n\nService: {{serviceName}}\nDate: {{serviceDate}}\nTime: 10:00 AM\nLocation: {{serviceLocation}}\n\nWe look forward to honoring {{decedentName}}'s memory with you and your family.\n\nWith sympathy,\n{{funeralHomeName}}\n{{funeralHomePhone}}",
    variables: [
      "firstName",
      "lastName",
      "serviceName",
      "decedentName",
      "serviceDate",
      "serviceLocation",
      "funeralHomeName",
      "funeralHomePhone",
    ],
    usageCount: 89,
    lastUsedAt: new Date("2024-12-02T09:15:00Z"),
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  {
    id: "tpl-4",
    name: "Thank You Email",
    type: "email",
    subject: "Thank You from {{funeralHomeName}}",
    body: "Dear {{firstName}},\n\nWe want to express our sincere gratitude for allowing us to serve your family during this difficult time. It was an honor to help celebrate {{decedentName}}'s life.\n\nIf you need anything in the coming weeks, please don't hesitate to reach out. We're here to support you.\n\nWith heartfelt sympathy,\nThe team at {{funeralHomeName}}\n{{funeralHomePhone}}",
    variables: ["firstName", "decedentName", "funeralHomeName", "funeralHomePhone"],
    usageCount: 67,
    lastUsedAt: new Date("2024-12-01T16:45:00Z"),
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  {
    id: "tpl-5",
    name: "Pre-Need Consultation Email",
    type: "email",
    subject: "Pre-Planning Services at {{funeralHomeName}}",
    body: "Hello {{firstName}},\n\nThank you for your interest in pre-planning services at {{funeralHomeName}}. Planning ahead can provide peace of mind for you and your loved ones.\n\nWe offer complimentary consultations to discuss your wishes and answer any questions you may have.\n\nPlease call us at {{funeralHomePhone}} to schedule your consultation.\n\nWarm regards,\n{{funeralHomeName}}",
    variables: ["firstName", "funeralHomeName", "funeralHomePhone"],
    usageCount: 34,
    lastUsedAt: new Date("2024-11-28T11:20:00Z"),
    createdAt: new Date("2024-02-10T00:00:00Z"),
    updatedAt: new Date("2024-02-10T00:00:00Z"),
  },
  {
    id: "tpl-6",
    name: "Payment Reminder Email",
    type: "email",
    subject: "Payment Reminder - Case {{caseNumber}}",
    body: "Dear {{firstName}} {{lastName}},\n\nThis is a friendly reminder about the outstanding balance for Case {{caseNumber}}.\n\nIf you have any questions about your account or would like to discuss payment options, please contact us at {{funeralHomePhone}}.\n\nThank you for your attention to this matter.\n\nSincerely,\n{{funeralHomeName}}",
    variables: [
      "firstName",
      "lastName",
      "caseNumber",
      "funeralHomePhone",
      "funeralHomeName",
    ],
    usageCount: 28,
    lastUsedAt: new Date("2024-11-30T13:00:00Z"),
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  {
    id: "tpl-7",
    name: "Document Request Email",
    type: "email",
    subject: "Document Request - Case {{caseNumber}}",
    body: "Dear {{firstName}},\n\nTo proceed with the arrangements for {{decedentName}}, we need the following documents:\n\n- Death certificate\n- Photo ID of next of kin\n- Any pre-planned service documents\n\nYou can drop these off at our office or email them to us.\n\nIf you have any questions, please call {{funeralHomePhone}}.\n\nThank you,\n{{funeralHomeName}}",
    variables: [
      "firstName",
      "decedentName",
      "caseNumber",
      "funeralHomePhone",
      "funeralHomeName",
    ],
    usageCount: 52,
    lastUsedAt: new Date("2024-12-03T08:30:00Z"),
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  {
    id: "tpl-8",
    name: "Service Change Notification",
    type: "email",
    subject: "Important: Service Update for {{decedentName}}",
    body: "Dear {{firstName}} {{lastName}},\n\nWe wanted to inform you of a change to the service arrangements for {{decedentName}}:\n\nNew Date: {{serviceDate}}\nNew Location: {{serviceLocation}}\n\nWe apologize for any inconvenience this may cause. If you have any questions, please contact us at {{funeralHomePhone}}.\n\nSincerely,\n{{funeralHomeName}}",
    variables: [
      "firstName",
      "lastName",
      "decedentName",
      "serviceDate",
      "serviceLocation",
      "funeralHomePhone",
      "funeralHomeName",
    ],
    usageCount: 8,
    lastUsedAt: new Date("2024-11-25T15:10:00Z"),
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  {
    id: "tpl-9",
    name: "Grief Resources Email",
    type: "email",
    subject: "Support Resources from {{funeralHomeName}}",
    body: "Dear {{firstName}},\n\nWe understand that grief is a journey, and we want you to know that support is available.\n\nWe offer:\n- Grief support groups\n- Counseling referrals\n- Online resources\n\nPlease visit our website or call {{funeralHomePhone}} to learn more about these services.\n\nYou are not alone in this journey.\n\nWith care,\n{{funeralHomeName}}",
    variables: ["firstName", "funeralHomePhone", "funeralHomeName"],
    usageCount: 23,
    lastUsedAt: new Date("2024-11-29T10:00:00Z"),
    createdAt: new Date("2024-01-20T00:00:00Z"),
    updatedAt: new Date("2024-01-20T00:00:00Z"),
  },
  {
    id: "tpl-10",
    name: "Anniversary Remembrance",
    type: "email",
    subject: "Remembering {{decedentName}}",
    body: "Dear {{firstName}} {{lastName}},\n\nOn this anniversary, we wanted to reach out and let you know that we are thinking of you and your family.\n\nWe hope the memories of {{decedentName}} bring you comfort during this time.\n\nIf there is anything we can do to support you, please don't hesitate to contact us at {{funeralHomePhone}}.\n\nWith sympathy,\n{{funeralHomeName}}",
    variables: [
      "firstName",
      "lastName",
      "decedentName",
      "funeralHomePhone",
      "funeralHomeName",
    ],
    usageCount: 41,
    lastUsedAt: new Date("2024-11-27T09:00:00Z"),
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  // SMS Templates
  {
    id: "tpl-11",
    name: "Appointment Reminder SMS",
    type: "sms",
    body: "{{firstName}}, reminder: Appt at {{funeralHomeName}} on {{serviceDate}}. Call {{funeralHomePhone}} to reschedule.",
    variables: ["firstName", "funeralHomeName", "serviceDate", "funeralHomePhone"],
    usageCount: 156,
    lastUsedAt: new Date("2024-12-04T07:00:00Z"),
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  {
    id: "tpl-12",
    name: "Service Reminder SMS",
    type: "sms",
    body: "{{firstName}}, reminder: {{serviceName}} for {{decedentName}} today at {{serviceLocation}}. - {{funeralHomeName}}",
    variables: ["firstName", "serviceName", "decedentName", "serviceLocation", "funeralHomeName"],
    usageCount: 203,
    lastUsedAt: new Date("2024-12-04T06:30:00Z"),
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  {
    id: "tpl-13",
    name: "Payment Received SMS",
    type: "sms",
    body: "Payment received for Case {{caseNumber}}. Thank you. - {{funeralHomeName}}",
    variables: ["caseNumber", "funeralHomeName"],
    usageCount: 87,
    lastUsedAt: new Date("2024-12-03T15:20:00Z"),
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  {
    id: "tpl-14",
    name: "Document Received SMS",
    type: "sms",
    body: "Documents received for Case {{caseNumber}}. We'll proceed with arrangements. - {{funeralHomeName}}",
    variables: ["caseNumber", "funeralHomeName"],
    usageCount: 64,
    lastUsedAt: new Date("2024-12-02T11:45:00Z"),
    createdAt: new Date("2024-01-15T00:00:00Z"),
    updatedAt: new Date("2024-01-15T00:00:00Z"),
  },
  {
    id: "tpl-15",
    name: "Quick Check-in SMS",
    type: "sms",
    body: "Hi {{firstName}}, checking in to see how you're doing. Call us anytime at {{funeralHomePhone}}. - {{funeralHomeName}}",
    variables: ["firstName", "funeralHomePhone", "funeralHomeName"],
    usageCount: 31,
    lastUsedAt: new Date("2024-11-28T14:00:00Z"),
    createdAt: new Date("2024-02-01T00:00:00Z"),
    updatedAt: new Date("2024-02-01T00:00:00Z"),
  },
];

const mockCommunications: Communication[] = Array.from({ length: 30 }, (_, i) => {
  const type: "email" | "sms" = i % 3 === 0 ? "sms" : "email";
  const statuses: CommunicationStatus[] = ["sent", "delivered", "opened", "clicked", "failed"];
  const status = statuses[i % 5] as CommunicationStatus;
  const daysAgo = i * 3;
  const sentAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  return {
    id: `comm-${i + 1}`,
    type,
    templateId: type === "email" ? `tpl-${(i % 10) + 1}` : `tpl-${11 + (i % 5)}`,
    recipientId: `contact-${i + 1}`,
    recipientName: `Test Family ${i + 1}`,
    recipientContact: type === "email" ? `family${i + 1}@example.com` : `555-010${i}`,
    caseId: i % 2 === 0 ? `case-${Math.floor(i / 2) + 1}` : undefined,
    subject: type === "email" ? `Test Subject ${i + 1}` : undefined,
    body: `Test communication body ${i + 1}`,
    status,
    sentAt,
    deliveredAt: status !== "failed" ? new Date(sentAt.getTime() + 1000 * 60 * 5) : undefined,
    openedAt:
      status === "opened" || status === "clicked"
        ? new Date(sentAt.getTime() + 1000 * 60 * 60)
        : undefined,
    clickedAt: status === "clicked" ? new Date(sentAt.getTime() + 1000 * 60 * 65) : undefined,
    failureReason: status === "failed" ? "Invalid email address" : undefined,
  };
});

// ============================================================================
// Router
// ============================================================================

export const communicationRouter = createTRPCRouter({
  // List all templates
  listTemplates: staffProcedure
    .input(
      z.object({
        type: templateTypeSchema.optional(),
        search: z.string().optional(),
      })
    )
    .query(({ input }) => {
      let filtered = [...mockTemplates];

      if (input.type) {
        filtered = filtered.filter((t) => t.type === input.type);
      }

      if (input.search) {
        const query = input.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.name.toLowerCase().includes(query) ||
            t.body.toLowerCase().includes(query) ||
            (t.subject && t.subject.toLowerCase().includes(query))
        );
      }

      // Sort by usage count desc
      filtered.sort((a, b) => b.usageCount - a.usageCount);

      return filtered;
    }),

  // Get single template
  getTemplate: staffProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
    const template = mockTemplates.find((t) => t.id === input.id);
    if (!template) {
      throw new Error("Template not found");
    }
    return template;
  }),

  // Create template
  createTemplate: staffProcedure
    .input(
      z.object({
        name: z.string(),
        type: templateTypeSchema,
        subject: z.string().optional(),
        body: z.string(),
        variables: z.array(z.string()),
      })
    )
    .mutation(({ input }) => {
      const newTemplate: Template = {
        id: `tpl-${Date.now()}`,
        name: input.name,
        type: input.type,
        subject: input.subject,
        body: input.body,
        variables: input.variables,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTemplates.push(newTemplate);
      return newTemplate;
    }),

  // Update template
  updateTemplate: staffProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(({ input }) => {
      const current = mockTemplates.find((t) => t.id === input.id);
      if (!current) {
        throw new Error("Template not found");
      }

      const updated: Template = {
        id: current.id,
        name: input.name ?? current.name,
        type: current.type,
        subject: input.subject !== undefined ? input.subject : current.subject,
        body: input.body ?? current.body,
        variables: input.variables ?? current.variables,
        usageCount: current.usageCount,
        lastUsedAt: current.lastUsedAt,
        createdAt: current.createdAt,
        updatedAt: new Date(),
      };

      const index = mockTemplates.findIndex((t) => t.id === input.id);
      mockTemplates[index] = updated;
      return updated;
    }),

  // Delete template
  deleteTemplate: staffProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const index = mockTemplates.findIndex((t) => t.id === input.id);
      if (index === -1) {
        throw new Error("Template not found");
      }

      mockTemplates.splice(index, 1);
      return { success: true, id: input.id };
    }),

  // Send email
  sendEmail: staffProcedure
    .input(
      z.object({
        templateId: z.string().optional(),
        recipients: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
          })
        ),
        subject: z.string(),
        body: z.string(),
        caseId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock email sending
      const communications: Communication[] = input.recipients.map((recipient) => ({
        id: `comm-${Date.now()}-${recipient.id}`,
        type: "email" as const,
        templateId: input.templateId,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientContact: recipient.email,
        caseId: input.caseId,
        subject: input.subject,
        body: input.body,
        status: "sent" as const,
        sentAt: new Date(),
      }));

      mockCommunications.push(...communications);

      // Update template usage count
      if (input.templateId) {
        const template = mockTemplates.find((t) => t.id === input.templateId);
        if (template) {
          template.usageCount++;
          template.lastUsedAt = new Date();
        }
      }

      return {
        success: true,
        sent: communications.length,
        communications,
      };
    }),

  // Send SMS
  sendSMS: staffProcedure
    .input(
      z.object({
        templateId: z.string().optional(),
        recipients: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            phone: z.string(),
          })
        ),
        body: z.string(),
        caseId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Mock SMS sending
      const communications: Communication[] = input.recipients.map((recipient) => ({
        id: `comm-${Date.now()}-${recipient.id}`,
        type: "sms" as const,
        templateId: input.templateId,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientContact: recipient.phone,
        caseId: input.caseId,
        body: input.body,
        status: "sent" as const,
        sentAt: new Date(),
      }));

      mockCommunications.push(...communications);

      // Update template usage count
      if (input.templateId) {
        const template = mockTemplates.find((t) => t.id === input.templateId);
        if (template) {
          template.usageCount++;
          template.lastUsedAt = new Date();
        }
      }

      return {
        success: true,
        sent: communications.length,
        communications,
      };
    }),

  // Get communication history
  getCommunicationHistory: staffProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        type: templateTypeSchema.optional(),
        status: communicationStatusSchema.optional(),
        caseId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(({ input }) => {
      let filtered = [...mockCommunications];

      if (input.type) {
        filtered = filtered.filter((c) => c.type === input.type);
      }

      if (input.status) {
        filtered = filtered.filter((c) => c.status === input.status);
      }

      if (input.caseId) {
        filtered = filtered.filter((c) => c.caseId === input.caseId);
      }

      if (input.startDate && input.endDate) {
        filtered = filtered.filter(
          (c) => c.sentAt && c.sentAt >= input.startDate! && c.sentAt <= input.endDate!
        );
      }

      // Sort by sent date desc
      filtered.sort((a, b) => {
        if (!a.sentAt || !b.sentAt) return 0;
        return b.sentAt.getTime() - a.sentAt.getTime();
      });

      // Paginate
      const start = (input.page - 1) * input.limit;
      const end = start + input.limit;
      const paginated = filtered.slice(start, end);

      return {
        communications: paginated,
        total: filtered.length,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(filtered.length / input.limit),
      };
    }),

  // Get communication stats
  getCommunicationStats: staffProcedure
    .input(
      z.object({
        days: z.number().default(30),
      })
    )
    .query(({ input }) => {
      const cutoffDate = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const recentComms = mockCommunications.filter(
        (c) => c.sentAt && c.sentAt >= cutoffDate
      );

      const totalSent = recentComms.length;
      const delivered = recentComms.filter((c) => c.status !== "failed").length;
      const opened = recentComms.filter((c) => c.openedAt).length;
      const clicked = recentComms.filter((c) => c.clickedAt).length;

      return {
        totalSent,
        delivered,
        deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
        opened,
        openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
        clicked,
        clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
        byType: {
          email: recentComms.filter((c) => c.type === "email").length,
          sms: recentComms.filter((c) => c.type === "sms").length,
        },
        byStatus: {
          sent: recentComms.filter((c) => c.status === "sent").length,
          delivered: recentComms.filter((c) => c.status === "delivered").length,
          opened: recentComms.filter((c) => c.status === "opened").length,
          clicked: recentComms.filter((c) => c.status === "clicked").length,
          failed: recentComms.filter((c) => c.status === "failed").length,
        },
      };
    }),
});
