import { z } from "zod";
import { staffProcedure, createTRPCRouter } from "../trpc";

// ============================================================================
// Schemas
// ============================================================================

export const documentCategorySchema = z.enum([
  "Death Certificate",
  "Contract",
  "Invoice",
  "Photo",
  "Permit",
  "Other",
]);

export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: documentCategorySchema,
  tags: z.array(z.string()),
  uploadedBy: z.string(),
  uploadedAt: z.date(),
  size: z.number(), // in bytes
  url: z.string(),
  caseId: z.string().optional(),
  isPublic: z.boolean(),
  fileType: z.string(), // e.g., "application/pdf"
});

export type Document = z.infer<typeof documentSchema>;
export type DocumentCategory = z.infer<typeof documentCategorySchema>;

// ============================================================================
// Mock Data
// ============================================================================

const mockDocuments: Document[] = [
  {
    id: "doc-1",
    name: "Death Certificate - John Smith.pdf",
    category: "Death Certificate",
    tags: ["urgent", "verified"],
    uploadedBy: "John Director",
    uploadedAt: new Date("2024-12-01T10:00:00Z"),
    size: 245000,
    url: "/api/documents/doc-1",
    caseId: "case-123",
    isPublic: false,
    fileType: "application/pdf",
  },
  {
    id: "doc-2",
    name: "Service Contract - Jane Doe.pdf",
    category: "Contract",
    tags: ["signed", "archived"],
    uploadedBy: "Jane Admin",
    uploadedAt: new Date("2024-11-28T14:30:00Z"),
    size: 512000,
    url: "/api/documents/doc-2",
    caseId: "case-124",
    isPublic: false,
    fileType: "application/pdf",
  },
  {
    id: "doc-3",
    name: "Memorial Photo.jpg",
    category: "Photo",
    tags: ["memorial", "family-approved"],
    uploadedBy: "John Director",
    uploadedAt: new Date("2024-12-02T09:15:00Z"),
    size: 1024000,
    url: "/api/documents/doc-3",
    caseId: "case-123",
    isPublic: true,
    fileType: "image/jpeg",
  },
  {
    id: "doc-4",
    name: "Cremation Permit.pdf",
    category: "Permit",
    tags: ["approved", "county"],
    uploadedBy: "Sarah Manager",
    uploadedAt: new Date("2024-12-03T11:00:00Z"),
    size: 180000,
    url: "/api/documents/doc-4",
    caseId: "case-125",
    isPublic: false,
    fileType: "application/pdf",
  },
  {
    id: "doc-5",
    name: "Final Invoice - Johnson Family.pdf",
    category: "Invoice",
    tags: ["paid", "2024"],
    uploadedBy: "Emily Accountant",
    uploadedAt: new Date("2024-11-30T16:45:00Z"),
    size: 95000,
    url: "/api/documents/doc-5",
    caseId: "case-126",
    isPublic: false,
    fileType: "application/pdf",
  },
  {
    id: "doc-6",
    name: "Staff Certification - Embalmer License.pdf",
    category: "Other",
    tags: ["staff", "license", "current"],
    uploadedBy: "HR Department",
    uploadedAt: new Date("2024-11-15T08:00:00Z"),
    size: 320000,
    url: "/api/documents/doc-6",
    isPublic: false,
    fileType: "application/pdf",
  },
  {
    id: "doc-7",
    name: "Vendor Contract - Casket Supplier.pdf",
    category: "Contract",
    tags: ["vendor", "active", "2024"],
    uploadedBy: "Sarah Manager",
    uploadedAt: new Date("2024-10-20T13:30:00Z"),
    size: 450000,
    url: "/api/documents/doc-7",
    isPublic: false,
    fileType: "application/pdf",
  },
  {
    id: "doc-8",
    name: "Service Photos - Williams Family.jpg",
    category: "Photo",
    tags: ["service", "family-approved"],
    uploadedBy: "John Director",
    uploadedAt: new Date("2024-12-04T15:20:00Z"),
    size: 890000,
    url: "/api/documents/doc-8",
    caseId: "case-127",
    isPublic: true,
    fileType: "image/jpeg",
  },
  {
    id: "doc-9",
    name: "Burial Permit - County Clerk.pdf",
    category: "Permit",
    tags: ["approved", "county", "2024"],
    uploadedBy: "Jane Admin",
    uploadedAt: new Date("2024-12-01T12:00:00Z"),
    size: 165000,
    url: "/api/documents/doc-9",
    caseId: "case-128",
    isPublic: false,
    fileType: "application/pdf",
  },
  {
    id: "doc-10",
    name: "Death Certificate - Mary Johnson.pdf",
    category: "Death Certificate",
    tags: ["urgent", "pending-verification"],
    uploadedBy: "Sarah Manager",
    uploadedAt: new Date("2024-12-05T08:30:00Z"),
    size: 230000,
    url: "/api/documents/doc-10",
    caseId: "case-129",
    isPublic: false,
    fileType: "application/pdf",
  },
  {
    id: "doc-11",
    name: "Insurance Policy Document.pdf",
    category: "Other",
    tags: ["insurance", "pending-review"],
    uploadedBy: "Emily Accountant",
    uploadedAt: new Date("2024-11-29T10:15:00Z"),
    size: 580000,
    url: "/api/documents/doc-11",
    caseId: "case-126",
    isPublic: false,
    fileType: "application/pdf",
  },
  {
    id: "doc-12",
    name: "Pre-Need Contract Template.docx",
    category: "Contract",
    tags: ["template", "pre-need"],
    uploadedBy: "John Director",
    uploadedAt: new Date("2024-09-10T14:00:00Z"),
    size: 125000,
    url: "/api/documents/doc-12",
    isPublic: false,
    fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    id: "doc-13",
    name: "Quarterly Invoice Summary.pdf",
    category: "Invoice",
    tags: ["quarterly", "2024", "summary"],
    uploadedBy: "Emily Accountant",
    uploadedAt: new Date("2024-10-01T09:00:00Z"),
    size: 340000,
    url: "/api/documents/doc-13",
    isPublic: false,
    fileType: "application/pdf",
  },
  {
    id: "doc-14",
    name: "Facility Inspection Permit.pdf",
    category: "Permit",
    tags: ["facility", "annual", "approved"],
    uploadedBy: "Sarah Manager",
    uploadedAt: new Date("2024-08-15T11:30:00Z"),
    size: 290000,
    url: "/api/documents/doc-14",
    isPublic: false,
    fileType: "application/pdf",
  },
  {
    id: "doc-15",
    name: "Memorial Service Program.pdf",
    category: "Other",
    tags: ["memorial", "program", "family-approved"],
    uploadedBy: "John Director",
    uploadedAt: new Date("2024-12-02T16:00:00Z"),
    size: 75000,
    url: "/api/documents/doc-15",
    caseId: "case-123",
    isPublic: true,
    fileType: "application/pdf",
  },
];

// ============================================================================
// Router
// ============================================================================

export const documentLibraryRouter = createTRPCRouter({
  // List documents with pagination and filters
  list: staffProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        category: z.array(documentCategorySchema).optional(),
        tags: z.array(z.string()).optional(),
        caseId: z.string().optional(),
        uploadedBy: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        sortBy: z.enum(["date", "name", "size"]).default("date"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(({ input }) => {
      let filtered = [...mockDocuments];

      // Apply filters
      if (input.category && input.category.length > 0) {
        filtered = filtered.filter((doc) => input.category!.includes(doc.category));
      }

      if (input.tags && input.tags.length > 0) {
        filtered = filtered.filter((doc) =>
          input.tags!.some((tag) => doc.tags.includes(tag))
        );
      }

      if (input.caseId) {
        filtered = filtered.filter((doc) => doc.caseId === input.caseId);
      }

      if (input.uploadedBy) {
        filtered = filtered.filter((doc) => doc.uploadedBy === input.uploadedBy);
      }

      if (input.startDate) {
        filtered = filtered.filter((doc) => doc.uploadedAt >= input.startDate!);
      }

      if (input.endDate) {
        filtered = filtered.filter((doc) => doc.uploadedAt <= input.endDate!);
      }

      // Sort
      filtered.sort((a, b) => {
        let comparison = 0;
        if (input.sortBy === "date") {
          comparison = a.uploadedAt.getTime() - b.uploadedAt.getTime();
        } else if (input.sortBy === "name") {
          comparison = a.name.localeCompare(b.name);
        } else if (input.sortBy === "size") {
          comparison = a.size - b.size;
        }
        return input.sortOrder === "asc" ? comparison : -comparison;
      });

      // Paginate
      const start = (input.page - 1) * input.limit;
      const end = start + input.limit;
      const paginated = filtered.slice(start, end);

      return {
        documents: paginated,
        total: filtered.length,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(filtered.length / input.limit),
      };
    }),

  // Search documents by name and tags
  search: staffProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().default(10),
      })
    )
    .query(({ input }) => {
      const query = input.query.toLowerCase();

      const results = mockDocuments
        .filter(
          (doc) =>
            doc.name.toLowerCase().includes(query) ||
            doc.tags.some((tag) => tag.toLowerCase().includes(query)) ||
            doc.category.toLowerCase().includes(query)
        )
        .slice(0, input.limit);

      return results;
    }),

  // Get single document by ID
  get: staffProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const document = mockDocuments.find((doc) => doc.id === input.id);
      if (!document) {
        throw new Error("Document not found");
      }
      return document;
    }),

  // Upload new document (metadata only)
  upload: staffProcedure
    .input(
      z.object({
        name: z.string(),
        category: documentCategorySchema,
        tags: z.array(z.string()).default([]),
        size: z.number(),
        url: z.string(),
        caseId: z.string().optional(),
        isPublic: z.boolean().default(false),
        fileType: z.string(),
      })
    )
    .mutation(({ input, ctx }) => {
      const newDocument: Document = {
        id: `doc-${Date.now()}`,
        name: input.name,
        category: input.category,
        tags: input.tags,
        uploadedBy: ctx.user?.name || "Unknown User",
        uploadedAt: new Date(),
        size: input.size,
        url: input.url,
        caseId: input.caseId,
        isPublic: input.isPublic,
        fileType: input.fileType,
      };

      mockDocuments.push(newDocument);
      return newDocument;
    }),

  // Update document metadata
  update: staffProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        category: documentCategorySchema.optional(),
        tags: z.array(z.string()).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const current = mockDocuments.find((doc) => doc.id === input.id);
      if (!current) {
        throw new Error("Document not found");
      }

      const updated: Document = {
        id: current.id,
        name: input.name ?? current.name,
        category: input.category ?? current.category,
        tags: input.tags ?? current.tags,
        uploadedBy: current.uploadedBy,
        uploadedAt: current.uploadedAt,
        size: current.size,
        url: current.url,
        caseId: current.caseId,
        isPublic: input.isPublic !== undefined ? input.isPublic : current.isPublic,
        fileType: current.fileType,
      };

      const index = mockDocuments.findIndex((doc) => doc.id === input.id);
      mockDocuments[index] = updated;
      return updated;
    }),

  // Delete document
  delete: staffProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const index = mockDocuments.findIndex((doc) => doc.id === input.id);
      if (index === -1) {
        throw new Error("Document not found");
      }

      mockDocuments.splice(index, 1);
      return { success: true, id: input.id };
    }),

  // Bulk add tags to documents
  addTags: staffProcedure
    .input(
      z.object({
        documentIds: z.array(z.string()),
        tags: z.array(z.string()),
      })
    )
    .mutation(({ input }) => {
      const updated: Document[] = [];

      input.documentIds.forEach((id) => {
        const doc = mockDocuments.find((d) => d.id === id);
        if (doc) {
          const existingTags = doc.tags;
          const newTags = [...new Set([...existingTags, ...input.tags])];
          const updatedDoc: Document = {
            ...doc,
            tags: newTags,
          };
          const index = mockDocuments.findIndex((d) => d.id === id);
          mockDocuments[index] = updatedDoc;
          updated.push(updatedDoc);
        }
      });

      return {
        success: true,
        updated: updated.length,
        documents: updated,
      };
    }),

  // Generate shareable link
  getShareableLink: staffProcedure
    .input(
      z.object({
        id: z.string(),
        expiresIn: z.number().default(7), // days
      })
    )
    .mutation(({ input }) => {
      const document = mockDocuments.find((doc) => doc.id === input.id);
      if (!document) {
        throw new Error("Document not found");
      }

      // Generate a mock shareable link
      const token = btoa(`${input.id}-${Date.now()}`);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresIn);

      return {
        url: `/share/documents/${token}`,
        expiresAt,
        documentName: document.name,
      };
    }),

  // Get all unique tags
  getAllTags: staffProcedure.query(() => {
    const allTags = mockDocuments.flatMap((doc) => doc.tags);
    const uniqueTags = [...new Set(allTags)].sort();
    return uniqueTags;
  }),

  // Get all unique uploaders
  getAllUploaders: staffProcedure.query(() => {
    const uploaders = [...new Set(mockDocuments.map((doc) => doc.uploadedBy))].sort();
    return uploaders;
  }),
});
