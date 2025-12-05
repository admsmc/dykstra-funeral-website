# Document Generation Architecture

> **Architecture Decision Record (ADR)**  
> **Date**: December 2, 2024  
> **Status**: Accepted  
> **Decision**: Dual-stack document generation using React-PDF + Puppeteer + GrapesJS

---

## Context

The Dykstra Funeral Home ERP requires world-class document generation capabilities for three distinct categories:

1. **Business Documents**: Invoices, purchase orders, statements, receipts, checks, vendor remittances, internal reports
2. **Memorial Materials**: Service programs, prayer cards, memorial booklets, acknowledgement cards
3. **Financial Reports**: Balance sheets, P&L statements, cash flow reports

Each category has different requirements for quality, customization, generation speed, and design complexity.

---

## Decision

We will implement a **dual-stack architecture** using:

### Stack 1: React-PDF (Business Documents)
- **Purpose**: Fast generation of structured business documents
- **Use Cases**: Invoices, POs, statements, receipts, checks, vendor documents
- **Rationale**: Type-safe, fast (<200ms), programmatic generation for high-volume documents

### Stack 2: Puppeteer + HTML Templates + GrapesJS (Memorial Materials)
- **Purpose**: High-quality, customizable memorial materials
- **Use Cases**: Service programs, prayer cards, memorial booklets
- **Rationale**: Professional print quality (300 DPI), visual editor for families, complex photo layouts

### Optional Stack 3: Typst (Complex Financial Reports)
- **Purpose**: Advanced typography for complex financial statements
- **Use Cases**: Balance sheets, multi-page reports requiring mathematical layouts
- **Rationale**: Superior typography, template language for non-developers

---

## Architecture Alignment

This decision fully complies with [ARCHITECTURE.md](../ARCHITECTURE.md) Clean Architecture principles:

### Layer Separation
```
┌─────────────────────────────────────────┐
│           API Layer (tRPC)              │  ← Document generation endpoints
├─────────────────────────────────────────┤
│        Application Layer                │  ← Document ports + use cases
├─────────────────────────────────────────┤
│         Domain Layer                    │  ← Document data entities
├─────────────────────────────────────────┤
│      Infrastructure Layer               │  ← React-PDF & Puppeteer adapters
└─────────────────────────────────────────┘
```

### Port-Adapter Pattern
```typescript
// Application Layer - Port Interface
export interface DocumentGeneratorPort {
  readonly generateInvoice: (data: InvoiceData) => Effect<Buffer, Error>;
  readonly generateServiceProgram: (data: ServiceProgramData) => Effect<Buffer, Error>;
}

// Infrastructure Layer - Adapters (Object-based, NOT classes)
export const ReactPDFAdapter: DocumentGeneratorPort = {
  generateInvoice: (data) => Effect.tryPromise({...}),
};

export const PuppeteerAdapter: DocumentGeneratorPort = {
  generateServiceProgram: (data) => Effect.tryPromise({...}),
};
```

---

## Document Type Routing

### React-PDF (Fast, Structured)
✅ Invoices  
✅ Statements  
✅ Purchase orders  
✅ Receipts  
✅ Checks  
✅ Vendor remittances  
✅ Acknowledgement cards (simple text)

**Characteristics**:
- Tabular data (line items, ledgers)
- No design customization needed
- High-volume batch generation
- Real-time generation required
- Simple layouts (header, table, footer)

### Puppeteer (High-Quality, Customizable)
✅ Service programs (bifold, trifold, booklets)  
✅ Prayer cards (laminated, photo-heavy)  
✅ Memorial booklets (multi-page photo collages)  
✅ Memorial folders

**Characteristics**:
- Visual customization required
- Photo-heavy layouts
- Complex design (backgrounds, gradients, multiple fonts)
- Print quality matters (keepsake materials)
- WYSIWYG preview needed
- One-off generation per family

---

## Technology Stack

### Core Libraries

| Library | Version | Purpose | License | Cost |
|---------|---------|---------|---------|------|
| **Puppeteer** | 24.31.0+ | Browser automation, PDF generation | Apache 2.0 | $0 |
| **React-PDF** | 3.4.0+ | React-based PDF generation | MIT | $0 |
| **GrapesJS** | 0.21.0+ | Drag-and-drop HTML editor | BSD-3-Clause | $0 |
| **Handlebars** | 4.7.0+ | HTML templating | MIT | $0 |
| **Cheerio** | 1.0.0+ | Server-side DOM manipulation | MIT | $0 |
| **generic-pool** | 3.9.0+ | Browser instance pooling | MIT | $0 |

### Quality Indicators

**Puppeteer**:
- 93,000+ GitHub stars
- Officially maintained by Google Chrome Labs
- Active development (latest release Nov 2024)
- Production-grade stability

**React-PDF**:
- Used by millions of developers
- Active community
- Well-documented API

**GrapesJS**:
- 100,000+ projects using it
- Highly customizable
- React wrapper available

---

## Performance Characteristics

### Generation Times

| Document Type | Stack | Average Time | Quality |
|---------------|-------|--------------|---------|
| Invoice | React-PDF | 150ms | Business-grade |
| Statement | React-PDF | 180ms | Business-grade |
| Purchase Order | React-PDF | 120ms | Business-grade |
| Receipt | React-PDF | 100ms | Business-grade |
| Service Program | Puppeteer | 1.5s | Keepsake-grade |
| Prayer Card | Puppeteer | 1.2s | Keepsake-grade |
| Memorial Booklet | Puppeteer | 2.5s | Keepsake-grade |

### Resource Usage

**React-PDF**:
- Memory: ~50MB per worker
- CPU: Minimal (pure JavaScript)
- Concurrent: 10+ documents simultaneously

**Puppeteer**:
- Memory: ~200MB per browser instance
- CPU: Moderate (browser rendering)
- Concurrent: 2-3 documents (pooled)

### Optimization Strategy

```typescript
// Browser instance pooling for Puppeteer
const browserPool = genericPool.createPool(
  {
    create: async () => await puppeteer.launch({ headless: true }),
    destroy: async (browser) => await browser.close()
  },
  {
    max: 3,        // Max 3 concurrent instances
    min: 1,        // Keep 1 warm
    idleTimeoutMillis: 30000
  }
);
```

---

## File Structure

```
packages/
├── domain/src/documents/
│   ├── invoice-data.ts              # Business document entities
│   ├── service-program-data.ts      # Memorial document entities
│   └── template-structure.ts        # Template metadata entities
│
├── application/src/
│   ├── ports/
│   │   ├── document-generator-port.ts       # Main port interface
│   │   ├── template-renderer-port.ts        # HTML rendering port
│   │   └── template-repository-port.ts      # Template storage port
│   │
│   └── use-cases/documents/
│       ├── generate-invoice.ts              # Business doc use cases
│       ├── generate-service-program.ts      # Memorial use cases
│       ├── save-template.ts                 # Template management
│       └── preview-template.ts
│
├── infrastructure/src/adapters/documents/
│   ├── react-pdf-adapter.ts                 # Business documents
│   ├── puppeteer-memorial-adapter.ts        # Memorial materials
│   ├── grapesjs-renderer-adapter.ts         # JSON → HTML
│   ├── prisma-template-repository.ts        # Template storage (SCD2)
│   ├── templates/
│   │   ├── business/
│   │   │   ├── invoice-template.tsx         # React-PDF templates
│   │   │   ├── po-template.tsx
│   │   │   └── receipt-template.tsx
│   │   └── memorial/
│   │       ├── service-program.hbs          # Handlebars templates
│   │       ├── prayer-card.hbs
│   │       └── styles/
│   │           ├── funeral-classic.css
│   │           └── funeral-modern.css
│   └── puppeteer-pool.ts                    # Browser pooling
│
└── api/src/routers/
    └── document-router.ts                   # tRPC endpoints
```

---

## Smart Features

### Conditional Rendering (Electronic vs. Printed)

```typescript
// Domain entity with business rules
export class InvoiceData extends Data.Class<{
  readonly renderContext: 'electronic' | 'printed';
  readonly paymentStatus: 'pending' | 'paid' | 'overdue';
  // ...
}> {
  // Business rule: Show payment link only for electronic invoices
  shouldShowPaymentLink(): boolean {
    return this.renderContext === 'electronic' && 
           this.paymentStatus !== 'paid';
  }
}

// Template uses business rule
<InvoiceTemplate data={data}>
  {data.shouldShowPaymentLink() && (
    <Link href={`https://dykstra.com/pay/${data.invoiceNumber}`}>
      Click here to pay online →
    </Link>
  )}
  
  {data.renderContext === 'printed' && (
    <View>
      <Text>Please remit payment to:</Text>
      <Text>Dykstra Funeral Home, 123 Main St</Text>
    </View>
  )}
</InvoiceTemplate>
```

### Per-Funeral-Home Branding

Templates support per-funeral-home customization:
- Logo
- Color scheme (navy, sage, cream, gold)
- Contact information
- Typography preferences
- Signature styles

Stored in database with SCD2 versioning for audit trail.

---

## Template Management

### Pre-Built Template Library

**Business Documents** (React-PDF):
- Standard invoice template
- Detailed invoice template (with photos)
- Purchase order template
- Receipt template
- Check template

**Memorial Materials** (Puppeteer + GrapesJS):
- Traditional bifold program (navy + gold)
- Modern trifold program (light & airy)
- Catholic prayer card (Sacred Heart)
- Military service program
- Memorial booklet (8-page, photo-heavy)

### Visual Template Editor (Family-Facing)

Powered by GrapesJS:
- Drag-and-drop interface
- Custom blocks for funeral elements:
  - Decedent name
  - Cover photo
  - Obituary text
  - Order of service
  - Family photo collages
  - Prayer/poem sections
- Real-time PDF preview
- Template save/load
- Per-funeral-home template library

---

## Database Schema

### Template Storage (SCD2)

```prisma
model MemorialTemplate {
  id                  String    @id @default(cuid())
  businessKey         String    // Template identifier
  version             Int       @default(1)
  validFrom           DateTime  @default(now())
  validTo             DateTime?
  isCurrent           Boolean   @default(true)
  funeralHomeId       String    // Per-home isolation
  
  name                String    // "Traditional Bifold Program"
  category            String    // "service-program" | "prayer-card"
  format              String    // "bifold" | "trifold" | "booklet"
  
  htmlStructure       String    @db.Text  // GrapesJS HTML output
  cssStyles           String    @db.Text  // CSS styles
  componentTree       Json                // GrapesJS component tree (for re-editing)
  
  dataBindings        Json      // { decedentName: { selector: ".name" } }
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  createdBy           String
  
  @@unique([businessKey, version])
  @@index([businessKey, isCurrent])
  @@index([funeralHomeId, isCurrent])
  @@map("memorial_templates")
}
```

---

## Approval Workflow Integration

Memorial materials support family approval before printing:

1. Staff/family creates document using visual editor
2. System generates PDF preview
3. Approval task created (via `ApprovalWorkflowPort`)
4. Family reviews preview URL
5. Family approves or requests changes
6. Upon approval, final PDF sent to printer

```typescript
export const generateServiceProgram = (command: GenerateServiceProgramCommand) =>
  Effect.gen(function* () {
    const memorialDoc = yield* MemorialDocumentPort;
    const document = yield* memorialDoc.generateServiceProgram(data);
    
    // Create approval task
    const approvalTask = yield* ApprovalWorkflowPort;
    yield* approvalTask.create({
      caseId: case_.id,
      documentId: document.documentId,
      previewUrl: document.previewUrl,
      approvers: [case_.familyContactId],
      dueDate: addDays(case_.serviceDate, -2)  // 2 days before service
    });
    
    return { documentId: document.documentId, status: 'pending_approval' };
  });
```

---

## Print Fulfillment

### In-House Printing (Local Printer)

```typescript
export const LocalPrinterAdapter: PrintFulfillmentPort = {
  submitPrintJob: (document, options) =>
    Effect.tryPromise({
      try: async () => {
        await sendToPrinter({
          printerName: 'HP_LaserJet_ColorLaser',
          file: document.printFileUrl,
          copies: options.quantity,
          paperStock: '120lb Gloss Cover',  // Memorial materials
          duplex: options.duplex
        });
      },
      catch: (error) => new PrintError('Print failed', error)
    })
};
```

### Professional Printer Integration (External Fulfillment)

```typescript
export const ProfessionalPrinterAdapter: PrintFulfillmentPort = {
  submitPrintJob: (document, options) =>
    Effect.gen(function* () {
      const order = yield* Effect.tryPromise({
        try: async () => {
          return await printingForLessAPI.createOrder({
            printFile: document.printFileUrl,
            productType: 'funeral_program_bifold',
            quantity: options.quantity,
            paperStock: '100lb_gloss_text',
            finishOptions: ['laminate', 'rounded_corners'],
            shippingAddress: options.shippingAddress,
            rushService: options.rushService  // Same-day available
          });
        },
        catch: (error) => new PrintError('Order failed', error)
      });
      
      return { orderId: order.id, trackingNumber: order.trackingNumber };
    })
};
```

---

## Security Considerations

### Template Storage
- Templates stored in database with SCD2 versioning (audit trail)
- Per-funeral-home isolation (no cross-home access)
- User permissions for template creation/modification

### PDF Generation
- Puppeteer runs in sandboxed headless mode
- Browser instances pooled and isolated
- No arbitrary code execution in templates

### Family Data
- Sensitive family data never logged
- PDFs stored encrypted at rest
- Access control via existing RBAC system

---

## Testing Strategy

### Unit Tests
- Domain entities (business rules)
- Template rendering logic
- Data binding resolution
- PDF generation adapters

### Integration Tests
- End-to-end document generation
- Template save/load workflows
- Approval workflow integration
- Print fulfillment integration

### Visual Regression Tests
- PDF output comparison (pixel-perfect)
- Template preview accuracy
- Cross-browser rendering (Puppeteer)

---

## Cost Analysis (5-Year)

| Solution | Year 1 | Years 2-5 | Total 5-Year |
|----------|--------|-----------|--------------|
| **Dual-Stack (Our Choice)** | $0 | $0 | **$0** |
| Canva API Enterprise | $3,000 | $12,000 | $15,000 |
| Adobe InDesign Server | $5,000 | $20,000 | $25,000 |

**ROI**: $15,000-25,000 saved vs. commercial alternatives

---

## Future Enhancements

### Phase 1 (Weeks 1-6): Core Implementation
- React-PDF business documents
- Puppeteer memorial materials
- Basic template library

### Phase 2 (Weeks 7-12): Visual Editor
- GrapesJS integration
- Family-facing customization
- Template preview system

### Phase 3 (Weeks 13-18): Advanced Features
- AI-powered photo enhancement
- Automatic obituary formatting
- Template recommendation engine
- Batch document generation

### Phase 4 (Weeks 19-24): Optimization
- Performance tuning
- Advanced caching
- Print fulfillment automation
- Analytics dashboard

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Clean Architecture guidelines
- [Puppeteer Official Docs](https://pptr.dev/)
- [React-PDF Documentation](https://react-pdf.org/)
- [GrapesJS Documentation](https://grapesjs.com/docs/)

---

## Approval

**Approved By**: Andrew Mathers  
**Date**: December 2, 2024  
**Status**: ✅ Accepted - Ready for Implementation
