# Document Generation System Implementation Plan
**Project**: Dual-Stack Document Generation (React-PDF + Puppeteer + GrapesJS)
**Duration**: 24 weeks (6 months)
**Architecture**: Clean Architecture with Port-Adapter Pattern
**Reference**: [DOCUMENT_GENERATION_ARCHITECTURE.md](./DOCUMENT_GENERATION_ARCHITECTURE.md)
***
## Phase 1: Foundation & Business Documents (Weeks 1-6)
### Week 1: Project Setup & Infrastructure
**Dependencies Installation**
```warp-runnable-command
# Business documents
pnpm add @react-pdf/renderer
pnpm add -D @types/react-pdf
# Memorial materials
pnpm add puppeteer
pnpm add generic-pool
pnpm add -D @types/generic-pool
# Template rendering
pnpm add handlebars cheerio
pnpm add -D @types/handlebars @types/cheerio
```
**Deliverables**:
- [x] Install all npm dependencies
- [x] Create folder structure per ARCHITECTURE.md
- [x] Set up TypeScript paths for new packages
- [x] Configure ESLint rules for document generation code
**File Structure**:
```warp-runnable-command
packages/
├── domain/src/documents/               # NEW
├── application/src/ports/              # ADD document ports
├── application/src/use-cases/documents/ # NEW
├── infrastructure/src/adapters/documents/ # NEW
```
**Acceptance Criteria**:
* All dependencies installed with no conflicts
* TypeScript compiles without errors
* Folder structure matches ARCHITECTURE.md
***
### Week 2: Domain Layer - Document Entities
**Create Domain Entities** (packages/domain/src/documents/)
**invoice-data.ts**:
```typescript
import { Data } from 'effect';
export class InvoiceData extends Data.Class<{
  readonly invoiceNumber: string;
  readonly caseId: string;
  readonly familyName: string;
  readonly lineItems: InvoiceLineItem[];
  readonly subtotal: number;
  readonly tax: number;
  readonly total: number;
  readonly dueDate: Date;
  readonly paymentStatus: 'pending' | 'paid' | 'overdue';
  readonly renderContext: 'electronic' | 'printed';
}> {
  shouldShowPaymentLink(): boolean {
    return this.renderContext === 'electronic' && this.paymentStatus !== 'paid';
  }
  
  getStatusColor(): string {
    if (this.paymentStatus === 'overdue' && this.renderContext === 'printed') {
      return '#d32f2f';
    }
    return '#000000';
  }
}
export class InvoiceLineItem extends Data.Class<{
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly amount: number;
}> {}
```
**service-program-data.ts**:
```typescript
export class ServiceProgramData extends Data.Class<{
  readonly caseId: string;
  readonly decedentName: string;
  readonly birthDate: Date;
  readonly deathDate: Date;
  readonly serviceDate: Date;
  readonly serviceLocation: string;
  readonly coverPhoto: string;
  readonly obituaryText: string;
  readonly orderOfService: ServiceEvent[];
  readonly musicSelections: MusicSelection[];
  readonly familyMembers: FamilyMember[];
  readonly pallbearers: string[];
  readonly additionalPhotos: string[];
  readonly theme: 'traditional' | 'modern' | 'religious' | 'nature' | 'military';
  readonly format: 'bifold' | 'trifold' | 'booklet' | 'graduated-fold';
}> {}
```
**template-structure.ts**:
```typescript
export class MemorialTemplate extends Data.Class<{
  readonly id: string;
  readonly businessKey: string;
  readonly version: number;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly isCurrent: boolean;
  readonly funeralHomeId: string;
  readonly name: string;
  readonly category: 'service-program' | 'prayer-card' | 'memorial-booklet';
  readonly format: 'bifold' | 'trifold' | 'booklet' | 'flat-card';
  readonly htmlStructure: string;
  readonly cssStyles: string;
  readonly componentTree: object;
  readonly dataBindings: Record<string, { selector: string }>;
}> {}
```
**Deliverables**:
- [x] InvoiceData entity with business rules
- [x] ServiceProgramData entity
- [x] MemorialTemplate entity (SCD2)
- [x] Supporting types (LineItem, ServiceEvent, etc.)
- [x] Unit tests for business rule methods
**Acceptance Criteria**:
* All entities extend Data.Class
* Business rules in domain methods (not adapters)
* Zero dependencies on infrastructure
* 100% test coverage on business rules
***
### Week 3: Application Layer - Ports
**Create Port Interfaces** (packages/application/src/ports/)
**document-generator-port.ts**:
```typescript
import { Effect, Context } from 'effect';
import type { InvoiceData, ServiceProgramData } from '@dykstra/domain';
export interface DocumentGeneratorPort {
  // Business documents
  readonly generateInvoice: (
    data: InvoiceData
  ) => Effect.Effect<Buffer, DocumentGenerationError>;
  
  readonly generatePurchaseOrder: (
    data: PurchaseOrderData
  ) => Effect.Effect<Buffer, DocumentGenerationError>;
  
  readonly generateReceipt: (
    data: ReceiptData
  ) => Effect.Effect<Buffer, DocumentGenerationError>;
  
  // Memorial documents
  readonly generateServiceProgram: (
    data: ServiceProgramData
  ) => Effect.Effect<MemorialDocument, DocumentGenerationError>;
  
  readonly generatePrayerCard: (
    data: PrayerCardData
  ) => Effect.Effect<MemorialDocument, DocumentGenerationError>;
}
export const DocumentGeneratorPort = Context.GenericTag<DocumentGeneratorPort>(
  '@dykstra/DocumentGeneratorPort'
);
export interface MemorialDocument {
  readonly documentId: string;
  readonly pdfUrl: string;
  readonly printFileUrl: string;
  readonly previewUrl: string;
}
export class DocumentGenerationError extends Data.TaggedError('DocumentGenerationError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}
```
**template-renderer-port.ts**:
```typescript
export interface TemplateRendererPort {
  readonly applyData: (
    template: MemorialTemplate,
    data: Record<string, unknown>
  ) => Effect.Effect<string, TemplateRenderError>;
}
export const TemplateRendererPort = Context.GenericTag<TemplateRendererPort>(
  '@dykstra/TemplateRendererPort'
);
```
**template-repository-port.ts**:
```typescript
export interface TemplateRepository {
  readonly findCurrentByBusinessKey: (
    templateId: string
  ) => Effect.Effect<MemorialTemplate | null, PersistenceError>;
  
  readonly findCurrentByFuneralHome: (
    funeralHomeId: string,
    category: string
  ) => Effect.Effect<MemorialTemplate[], PersistenceError>;
  
  readonly save: (
    template: MemorialTemplate
  ) => Effect.Effect<void, PersistenceError>;
  
  readonly getHistory: (
    businessKey: string
  ) => Effect.Effect<MemorialTemplate[], PersistenceError>;
}
export const TemplateRepository = Context.GenericTag<TemplateRepository>(
  '@dykstra/TemplateRepository'
);
```
**Deliverables**:
- [x] DocumentGeneratorPort interface
- [x] TemplateRendererPort interface
- [x] TemplateRepository port
- [x] DocumentGenerationError typed error
- [x] Context tags for DI
**Acceptance Criteria**:
* All ports are TypeScript interfaces
* All methods return Effect<Result, Error>
* Context.GenericTag for each port
* Zero implementation details in ports
***
### Week 4: Infrastructure - React-PDF Adapter
**Create React-PDF Adapter** (packages/infrastructure/src/adapters/documents/)
**react-pdf-adapter.ts**:
```typescript
import { pdf } from '@react-pdf/renderer';
import { Effect } from 'effect';
import type { DocumentGeneratorPort, InvoiceData } from '@dykstra/application';
import { InvoiceTemplate } from './templates/business/invoice-template';
import { DocumentGenerationError } from '@dykstra/application';
export const ReactPDFAdapter: Pick<DocumentGeneratorPort, 'generateInvoice' | 'generatePurchaseOrder' | 'generateReceipt'> = {
  generateInvoice: (data: InvoiceData) =>
    Effect.tryPromise({
      try: async () => {
        const doc = <InvoiceTemplate data={data} />;
        const blob = await pdf(doc).toBlob();
        return Buffer.from(await blob.arrayBuffer());
      },
      catch: (error) => new DocumentGenerationError({
        message: 'Invoice PDF generation failed',
        cause: error
      })
    }),
  
  generatePurchaseOrder: (data) =>
    Effect.tryPromise({
      try: async () => {
        const doc = <PurchaseOrderTemplate data={data} />;
        const blob = await pdf(doc).toBlob();
        return Buffer.from(await blob.arrayBuffer());
      },
      catch: (error) => new DocumentGenerationError({
        message: 'PO PDF generation failed',
        cause: error
      })
    }),
  
  generateReceipt: (data) =>
    Effect.tryPromise({
      try: async () => {
        const doc = <ReceiptTemplate data={data} />;
        const blob = await pdf(doc).toBlob();
        return Buffer.from(await blob.arrayBuffer());
      },
      catch: (error) => new DocumentGenerationError({
        message: 'Receipt PDF generation failed',
        cause: error
      })
    }),
};
```
**templates/business/invoice-template.tsx**:
```typescript
import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import type { InvoiceData } from '@dykstra/domain';
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { fontSize: 24, marginBottom: 20, color: '#1e3a5f' },
  lineItem: { flexDirection: 'row', marginBottom: 5 },
  total: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  paymentLink: { color: '#1976d2', textDecoration: 'underline', marginTop: 20 },
});
export const InvoiceTemplate: React.FC<{ data: InvoiceData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>Dykstra Funeral Home</Text>
        <Text style={{ fontSize: 12 }}>Invoice #{data.invoiceNumber}</Text>
      </View>
      
      <View style={{ marginBottom: 20 }}>
        <Text>Family: {data.familyName}</Text>
        <Text>Due Date: {data.dueDate.toLocaleDateString()}</Text>
        <Text style={{ color: data.getStatusColor() }}>
          Status: {data.paymentStatus.toUpperCase()}
        </Text>
      </View>
      
      {data.lineItems.map((item, idx) => (
        <View key={idx} style={styles.lineItem}>
          <Text style={{ flex: 2 }}>{item.description}</Text>
          <Text style={{ flex: 1, textAlign: 'right' }}>
            ${item.amount.toFixed(2)}
          </Text>
        </View>
      ))}
      
      <View style={styles.total}>
        <Text>Total: ${data.total.toFixed(2)}</Text>
      </View>
      
      {data.shouldShowPaymentLink() && (
        <Link 
          src={`https://dykstra.com/pay/${data.invoiceNumber}`} 
          style={styles.paymentLink}
        >
          Click here to pay online →
        </Link>
      )}
      
      {data.renderContext === 'printed' && (
        <View style={{ marginTop: 30, fontSize: 10, color: '#666' }}>
          <Text>Please remit payment to:</Text>
          <Text>Dykstra Funeral Home, 123 Main St, Anytown MI 12345</Text>
        </View>
      )}
    </Page>
  </Document>
);
```
**Deliverables**:
- [ ] ReactPDFAdapter (object-based, NOT class)
- [ ] InvoiceTemplate React component
- [ ] PurchaseOrderTemplate
- [ ] ReceiptTemplate
- [ ] Shared header/footer components
**Acceptance Criteria**:
* Adapter is const object (not class)
* All methods return Effect
* Templates are React components
* Smart conditional rendering (electronic vs. printed)
* Generation time <200ms
***
### Week 5: Use Cases - Business Documents
**Create Use Cases** (packages/application/src/use-cases/documents/)
**generate-invoice.ts**:
```typescript
import { Effect } from 'effect';
import { CaseRepository, DocumentGeneratorPort, DocumentRepository } from '@dykstra/application';
import { InvoiceData } from '@dykstra/domain';
import { NotFoundError } from '@dykstra/application';
export interface GenerateInvoiceCommand {
  readonly caseId: string;
  readonly deliveryMethod: 'email' | 'print';
}
export const generateInvoice = (command: GenerateInvoiceCommand) =>
  Effect.gen(function* () {
    // 1. Load case data
    const caseRepo = yield* CaseRepository;
    const case_ = yield* caseRepo.findByBusinessKey(command.caseId);
    
    if (!case_) {
      return yield* Effect.fail(new NotFoundError({
        entityType: 'Case',
        entityId: command.caseId
      }));
    }
    
    // 2. Build invoice data (domain entity)
    const invoiceData = new InvoiceData({
      invoiceNumber: generateInvoiceNumber(),
      caseId: case_.id,
      familyName: case_.familyContactName,
      lineItems: case_.invoiceLineItems,
      subtotal: calculateSubtotal(case_.invoiceLineItems),
      tax: calculateTax(case_.invoiceLineItems),
      total: calculateTotal(case_.invoiceLineItems),
      dueDate: calculateDueDate(case_.serviceDate),
      paymentStatus: determinePaymentStatus(case_),
      renderContext: command.deliveryMethod === 'email' ? 'electronic' : 'printed'
    });
    
    // 3. Generate PDF via adapter
    const docGenerator = yield* DocumentGeneratorPort;
    const pdfBuffer = yield* docGenerator.generateInvoice(invoiceData);
    
    // 4. Store document (SCD2)
    const docRepo = yield* DocumentRepository;
    yield* docRepo.save({
      caseId: case_.id,
      documentType: 'invoice',
      content: pdfBuffer,
      deliveryMethod: command.deliveryMethod
    });
    
    return { invoiceNumber: invoiceData.invoiceNumber, pdfBuffer };
  });
function generateInvoiceNumber(): string {
  const now = new Date();
  return `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
}
```
**generate-purchase-order.ts**:
```typescript
export const generatePurchaseOrder = (command: GeneratePOCommand) =>
  Effect.gen(function* () {
    // Similar pattern to generateInvoice
  });
```
**Deliverables**:
- [ ] generateInvoice use case
- [ ] generatePurchaseOrder use case
- [ ] generateReceipt use case
- [ ] Helper functions (calculateSubtotal, etc.)
- [ ] Unit tests for all use cases
**Acceptance Criteria**:
* Use cases orchestrate domain + ports
* No business logic in use cases (delegate to domain)
* All operations via Effect
* Integration tests with mocked adapters
***
### Week 6: API Layer & Testing
**Create tRPC Router** (packages/api/src/routers/document-router.ts)
```typescript
import { z } from 'zod';
import { router, staffProcedure } from '../trpc';
import { generateInvoice, generatePurchaseOrder } from '@dykstra/application';
import { runEffect } from '../utils/run-effect';
export const documentRouter = router({
  generateInvoice: staffProcedure
    .input(z.object({
      caseId: z.string(),
      deliveryMethod: z.enum(['email', 'print'])
    }))
    .mutation(async ({ input }) => {
      return await runEffect(
        generateInvoice({
          caseId: input.caseId,
          deliveryMethod: input.deliveryMethod
        })
      );
    }),
  
  generatePurchaseOrder: staffProcedure
    .input(z.object({
      vendorId: z.string(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number()
      }))
    }))
    .mutation(async ({ input }) => {
      return await runEffect(generatePurchaseOrder(input));
    }),
});
```
**Integration Tests**:
```typescript
import { describe, it, expect } from 'vitest';
import { generateInvoice } from '@dykstra/application';
import { Layer, Effect } from 'effect';
describe('generateInvoice', () => {
  it('generates invoice PDF with payment link for electronic delivery', async () => {
    const result = await Effect.runPromise(
      generateInvoice({
        caseId: 'case-1',
        deliveryMethod: 'email'
      }).pipe(
        Effect.provide(
          Layer.merge(
            MockCaseRepositoryLayer,
            MockDocumentGeneratorLayer,
            MockDocumentRepositoryLayer
          )
        )
      )
    );
    
    expect(result.pdfBuffer).toBeInstanceOf(Buffer);
    expect(result.invoiceNumber).toMatch(/^INV-\d{4}-\d{2}-\d{4}$/);
  });
  
  it('generates invoice PDF without payment link for printed delivery', async () => {
    // Test printed context
  });
});
```
**Deliverables**:
- [ ] documentRouter with tRPC endpoints
- [ ] Integration tests (end-to-end)
- [ ] Performance tests (generation time)
- [ ] Documentation in WARP.md
**Acceptance Criteria**:
* All endpoints return Buffer (PDF)
* Integration tests pass
* Invoice generation <200ms
* Zero TypeScript errors
***
## Phase 2: Memorial Materials & Puppeteer (Weeks 7-12)
### Week 7: Puppeteer Infrastructure
**Install Additional Dependencies**:
```warp-runnable-command
pnpm add puppeteer generic-pool
pnpm add -D @types/puppeteer @types/generic-pool
```
**Create Browser Pool** (packages/infrastructure/src/adapters/documents/puppeteer-pool.ts)
```typescript
import genericPool from 'generic-pool';
import puppeteer, { Browser } from 'puppeteer';
const browserPool = genericPool.createPool<Browser>(
  {
    create: async () => {
      return await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
    },
    destroy: async (browser: Browser) => {
      await browser.close();
    },
    validate: async (browser: Browser) => {
      return browser.isConnected();
    }
  },
  {
    max: 3,
    min: 1,
    idleTimeoutMillis: 30000,
    evictionRunIntervalMillis: 10000
  }
);
export const acquireBrowser = (): Promise<Browser> => browserPool.acquire();
export const releaseBrowser = (browser: Browser): Promise<void> => browserPool.release(browser);
```
**Deliverables**:
- [ ] Browser pooling infrastructure
- [ ] Pool configuration (max 3, min 1)
- [ ] Graceful shutdown handler
- [ ] Health check endpoint
**Acceptance Criteria**:
* Browser pool initializes successfully
* Browsers reused (not relaunched)
* Idle browsers closed after 30s
* Memory usage <600MB (3 browsers)
***
### Week 8: Puppeteer Memorial Adapter
**Create Puppeteer Adapter** (packages/infrastructure/src/adapters/documents/puppeteer-memorial-adapter.ts)
```typescript
import { Effect } from 'effect';
import type { DocumentGeneratorPort, ServiceProgramData } from '@dykstra/application';
import { DocumentGenerationError } from '@dykstra/application';
import { acquireBrowser, releaseBrowser } from './puppeteer-pool';
export const PuppeteerMemorialAdapter: Pick<DocumentGeneratorPort, 'generateServiceProgram' | 'generatePrayerCard'> = {
  generateServiceProgram: (data: ServiceProgramData) =>
    Effect.gen(function* () {
      let browser;
      try {
        browser = yield* Effect.promise(() => acquireBrowser());
        const page = await browser.newPage();
        
        // Render HTML template
        const html = yield* Effect.tryPromise({
          try: async () => {
            const templateSource = await fs.readFile(
              './templates/memorial/service-program.hbs',
              'utf8'
            );
            const template = Handlebars.compile(templateSource);
            return template({
              decedentName: data.decedentName,
              coverPhoto: data.coverPhoto,
              obituary: data.obituaryText,
              orderOfService: data.orderOfService,
              theme: data.theme
            });
          },
          catch: (error) => new DocumentGenerationError({
            message: 'Template rendering failed',
            cause: error
          })
        });
        
        // Generate PDF
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
          format: data.format === 'bifold' ? 'Letter' : undefined,
          printBackground: true,
          preferCSSPageSize: true,
          scale: 1.0
        });
        
        await page.close();
        
        // Store PDF
        const documentId = generateId();
        const pdfUrl = yield* uploadToStorage(pdfBuffer);
        
        return {
          documentId,
          pdfUrl,
          printFileUrl: pdfUrl,
          previewUrl: await generatePreview(pdfBuffer)
        };
      } finally {
        if (browser) {
          await releaseBrowser(browser);
        }
      }
    }),
  
  generatePrayerCard: (data) =>
    Effect.gen(function* () {
      // Similar pattern for prayer cards
    }),
};
```
**Deliverables**:
- [ ] PuppeteerMemorialAdapter (object-based)
- [ ] Browser acquisition/release logic
- [ ] Error handling (browser crashes)
- [ ] PDF generation with 300 DPI
**Acceptance Criteria**:
* Adapter uses browser pool
* Browser always released (finally block)
* Generation time <2 seconds
* 300 DPI print-ready PDFs
***
### Week 9: HTML Template System
**Create Handlebars Templates** (packages/infrastructure/src/adapters/documents/templates/memorial/)
**service-program.hbs**:
```handlebars
<!DOCTYPE html>
<html>
<head>
  <style>
    @page {
      size: 8.5in 11in;
      margin: 0.5in;
      @bottom-center { content: "Dykstra Funeral Home"; }
    }
    
    body {
      font-family: 'Playfair Display', serif;
      color: #2c3539;
    }
    
    .cover-photo {
      width: 100%;
      height: 4in;
      object-fit: cover;
      border: 3px solid #b8956a;
    }
    
    .decedent-name {
      font-size: 32pt;
      text-align: center;
      margin: 20pt 0;
      color: #1e3a5f;
    }
    
    .obituary {
      font-size: 11pt;
      line-height: 1.6;
      column-count: 2;
      column-gap: 20pt;
    }
    
    .theme-traditional { background: #f5f3ed; }
    .theme-modern { background: #ffffff; }
  </style>
</head>
<body class="theme-{{theme}}">
  <div class="cover">
    <img src="{{coverPhoto}}" class="cover-photo" alt="{{decedentName}}" />
    <h1 class="decedent-name">{{decedentName}}</h1>
    <p class="dates">{{birthDate}} – {{deathDate}}</p>
  </div>
  
  <div class="obituary">
    {{{obituary}}}
  </div>
  
  <div class="order-of-service">
    <h2>Order of Service</h2>
    {{#each orderOfService}}
      <div class="service-item">
        <strong>{{this.title}}</strong>
        <p>{{this.description}}</p>
      </div>
    {{/each}}
  </div>
</body>
</html>
```
**prayer-card.hbs**:
```handlebars
<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: 2.5in 4.25in; margin: 0; }
    body {
      width: 2.5in;
      height: 4.25in;
      margin: 0;
      padding: 0.25in;
      font-family: 'Playfair Display', serif;
    }
    .photo {
      width: 100%;
      height: 2in;
      object-fit: cover;
    }
    .name {
      font-size: 16pt;
      text-align: center;
      margin: 10pt 0;
    }
    .prayer {
      font-size: 9pt;
      line-height: 1.4;
      text-align: center;
    }
  </style>
</head>
<body>
  <img src="{{photo}}" class="photo" />
  <h1 class="name">{{decedentName}}</h1>
  <p class="dates">{{birthDate}} - {{deathDate}}</p>
  <div class="prayer">
    {{{prayerText}}}
  </div>
</body>
</html>
```
**Deliverables**:
- [ ] service-program.hbs template
- [ ] prayer-card.hbs template
- [ ] memorial-booklet.hbs template
- [ ] Shared CSS styles (funeral-classic.css, funeral-modern.css)
- [ ] Theme system (traditional, modern, religious)
**Acceptance Criteria**:
* Templates use Handlebars syntax
* Print-ready CSS (@page rules)
* Professional typography
* Theme variations working
***
### Week 10: Template Renderer Adapter
**Create HTML Renderer** (packages/infrastructure/src/adapters/documents/grapesjs-renderer-adapter.ts)
```typescript
import { Effect } from 'effect';
import Handlebars from 'handlebars';
import cheerio from 'cheerio';
import type { TemplateRendererPort, MemorialTemplate } from '@dykstra/application';
import { TemplateRenderError } from '@dykstra/application';
export const HandlebarsRendererAdapter: TemplateRendererPort = {
  applyData: (template: MemorialTemplate, data: Record<string, unknown>) =>
    Effect.try({
      try: () => {
        let html = template.htmlStructure;
        
        // Replace data bindings using CSS selectors
        Object.entries(template.dataBindings).forEach(([key, binding]) => {
          const value = data[key];
          const $ = cheerio.load(html);
          const element = $(binding.selector);
          
          if (element.is('img')) {
            element.attr('src', String(value));
          } else if (Array.isArray(value)) {
            element.html(
              value.map(item => `
                <div class="service-item">
                  <strong>${item.title}</strong>
                  <p>${item.description}</p>
                </div>
              `).join('')
            );
          } else {
            element.html(String(value));
          }
          
          html = $.html();
        });
        
        return html;
      },
      catch: (error) => new TemplateRenderError({
        message: 'Failed to apply data to template',
        cause: error
      })
    })
};
```
**Deliverables**:
- [ ] HandlebarsRendererAdapter
- [ ] Data binding resolver (CSS selectors)
- [ ] Cheerio integration for DOM manipulation
- [ ] Array/object handling (order of service, photos)
**Acceptance Criteria**:
* Adapter is object-based
* Data bindings correctly applied
* Handles images, text, arrays
* Error handling for invalid selectors
***
### Week 11: Template Repository (SCD2)
**Database Migration** (packages/infrastructure/prisma/migrations/)
```prisma
model MemorialTemplate {
  id                  String    @id @default(cuid())
  businessKey         String
  version             Int       @default(1)
  validFrom           DateTime  @default(now())
  validTo             DateTime?
  isCurrent           Boolean   @default(true)
  funeralHomeId       String
  
  name                String
  category            String
  format              String
  
  htmlStructure       String    @db.Text
  cssStyles           String    @db.Text
  componentTree       Json
  dataBindings        Json
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  createdBy           String
  updatedBy           String?
  
  @@unique([businessKey, version])
  @@index([businessKey, isCurrent])
  @@index([funeralHomeId, isCurrent])
  @@map("memorial_templates")
}
```
**Create Repository** (packages/infrastructure/src/database/prisma-template-repository.ts)
```typescript
import { Effect } from 'effect';
import { prisma } from './prisma-client';
import type { TemplateRepository, MemorialTemplate } from '@dykstra/application';
import { PersistenceError } from '@dykstra/application';
export const PrismaTemplateRepository: TemplateRepository = {
  findCurrentByBusinessKey: (templateId: string) =>
    Effect.tryPromise({
      try: async () => {
        const row = await prisma.memorialTemplate.findFirst({
          where: { businessKey: templateId, isCurrent: true }
        });
        return row ? toDomain(row) : null;
      },
      catch: (error) => new PersistenceError('Failed to find template', error)
    }),
  
  findCurrentByFuneralHome: (funeralHomeId: string, category: string) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await prisma.memorialTemplate.findMany({
          where: { funeralHomeId, category, isCurrent: true }
        });
        return rows.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to find templates', error)
    }),
  
  save: (template: MemorialTemplate) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        
        if (template.version === 1) {
          await prisma.memorialTemplate.create({
            data: {
              ...toPrisma(template),
              validFrom: now,
              isCurrent: true
            }
          });
        } else {
          await prisma.$transaction(async (tx) => {
            await tx.memorialTemplate.updateMany({
              where: { businessKey: template.businessKey, isCurrent: true },
              data: { validTo: now, isCurrent: false }
            });
            
            await tx.memorialTemplate.create({
              data: {
                ...toPrisma(template),
                version: template.version + 1,
                validFrom: now,
                isCurrent: true,
                createdAt: template.validFrom
              }
            });
          });
        }
      },
      catch: (error) => new PersistenceError('Failed to save template', error)
    }),
  
  getHistory: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const rows = await prisma.memorialTemplate.findMany({
          where: { businessKey },
          orderBy: { version: 'asc' }
        });
        return rows.map(toDomain);
      },
      catch: (error) => new PersistenceError('Failed to get history', error)
    }),
};
function toDomain(row: any): MemorialTemplate {
  return new MemorialTemplate({
    id: row.id,
    businessKey: row.businessKey,
    version: row.version,
    validFrom: row.validFrom,
    validTo: row.validTo,
    isCurrent: row.isCurrent,
    funeralHomeId: row.funeralHomeId,
    name: row.name,
    category: row.category,
    format: row.format,
    htmlStructure: row.htmlStructure,
    cssStyles: row.cssStyles,
    componentTree: row.componentTree,
    dataBindings: row.dataBindings
  });
}
```
**Deliverables**:
- [ ] Prisma migration for memorial_templates table
- [ ] PrismaTemplateRepository (object-based, SCD2)
- [ ] Template versioning logic
- [ ] Template history queries
**Acceptance Criteria**:
* Repository follows SCD2 pattern
* Per-funeral-home isolation working
* Version history preserved
* Tests for all CRUD operations
***
### Week 12: Memorial Use Cases & Integration
**Create Use Cases** (packages/application/src/use-cases/documents/)
**generate-service-program.ts**:
```typescript
export const generateServiceProgram = (command: GenerateServiceProgramCommand) =>
  Effect.gen(function* () {
    // 1. Load template
    const templateRepo = yield* TemplateRepository;
    const template = yield* templateRepo.findCurrentByBusinessKey(command.templateId);
    
    if (!template) {
      return yield* Effect.fail(new NotFoundError({
        entityType: 'MemorialTemplate',
        entityId: command.templateId
      }));
    }
    
    // 2. Load case data
    const caseRepo = yield* CaseRepository;
    const case_ = yield* caseRepo.findByBusinessKey(command.caseId);
    
    if (!case_) {
      return yield* Effect.fail(new NotFoundError({
        entityType: 'Case',
        entityId: command.caseId
      }));
    }
    
    // 3. Build service program data
    const programData = new ServiceProgramData({
      caseId: case_.id,
      decedentName: case_.decedentName,
      birthDate: case_.birthDate,
      deathDate: case_.deathDate,
      serviceDate: case_.serviceDate,
      serviceLocation: case_.serviceLocation,
      coverPhoto: case_.coverPhotoUrl,
      obituaryText: case_.obituaryText,
      orderOfService: case_.serviceOrder,
      musicSelections: case_.musicSelections,
      familyMembers: case_.familyMembers,
      pallbearers: case_.pallbearers,
      additionalPhotos: case_.additionalPhotos,
      theme: command.theme || 'traditional',
      format: template.format as any
    });
    
    // 4. Apply data to template
    const renderer = yield* TemplateRendererPort;
    const populatedHtml = yield* renderer.applyData(template, {
      decedentName: programData.decedentName,
      coverPhoto: programData.coverPhoto,
      obituary: programData.obituaryText,
      orderOfService: programData.orderOfService,
      birthDate: formatDate(programData.birthDate),
      deathDate: formatDate(programData.deathDate)
    });
    
    // 5. Generate PDF via Puppeteer
    const pdfGenerator = yield* DocumentGeneratorPort;
    const document = yield* pdfGenerator.generateServiceProgram(programData);
    
    // 6. Store document
    const docRepo = yield* DocumentRepository;
    yield* docRepo.save({
      caseId: case_.id,
      templateId: template.id,
      documentType: 'service_program',
      content: await fetch(document.pdfUrl).then(r => r.arrayBuffer()).then(Buffer.from)
    });
    
    return document;
  });
```
**Deliverables**:
- [ ] generateServiceProgram use case
- [ ] generatePrayerCard use case
- [ ] previewTemplate use case
- [ ] saveTemplate use case
- [ ] Integration tests
**Acceptance Criteria**:
* Use cases orchestrate all layers
* Template system working end-to-end
* PDF generation <2 seconds
* All tests passing
***
## Phase 3: Visual Template Editor (Weeks 13-18)
### Week 13: GrapesJS Setup
**Install Dependencies**:
```warp-runnable-command
pnpm add grapesjs grapesjs-blocks-basic grapesjs-react
pnpm add -D @types/grapesjs
```
**Create Editor Component** (app/(staff)/template-editor/components/EditorCanvas.tsx)
```typescript
'use client';
import { useEffect, useRef } from 'react';
import grapesjs from 'grapesjs';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import type { MemorialTemplate } from '@dykstra/domain';
interface TemplateEditorProps {
  initialTemplate?: MemorialTemplate;
  onSave: (templateData: TemplateData) => void;
}
export const MemorialTemplateEditor: React.FC<TemplateEditorProps> = ({
  initialTemplate,
  onSave
}) => {
  const editorRef = useRef<any>(null);
  
  useEffect(() => {
    const editor = grapesjs.init({
      container: '#gjs-editor',
      height: '800px',
      width: '100%',
      components: initialTemplate?.htmlStructure || '',
      style: initialTemplate?.cssStyles || '',
      storageManager: { type: 'remote', autosave: false },
      plugins: [gjsBlocksBasic],
      canvas: {
        styles: [
          'https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap'
        ]
      },
      deviceManager: {
        devices: [
          { name: 'Letter (8.5x11)', width: '8.5in', height: '11in' },
          { name: 'Prayer Card', width: '2.5in', height: '4.25in' }
        ]
      }
    });
    
    // Add custom funeral element blocks
    editor.BlockManager.add('decedent-name', {
      label: 'Decedent Name',
      content: '<h1 class="decedent-name" data-bind="decedentName">John Doe</h1>',
      category: 'Memorial Elements'
    });
    
    editor.BlockManager.add('cover-photo', {
      label: 'Cover Photo',
      content: '<img class="cover-photo" data-bind="coverPhoto" src="https://via.placeholder.com/800x400" />',
      category: 'Memorial Elements'
    });
    
    editor.BlockManager.add('obituary', {
      label: 'Obituary Text',
      content: '<div class="obituary" data-bind="obituary"><p>Obituary text...</p></div>',
      category: 'Memorial Elements'
    });
    
    editor.BlockManager.add('order-of-service', {
      label: 'Order of Service',
      content: `
        <div class="order-of-service" data-bind="orderOfService">
          <h2>Order of Service</h2>
          <div class="service-item">
            <strong>Opening Prayer</strong>
            <p>Led by Pastor Smith</p>
          </div>
        </div>
      `,
      category: 'Memorial Elements'
    });
    
    editorRef.current = editor;
    
    return () => {
      editor.destroy();
    };
  }, []);
  
  const handleSave = () => {
    const editor = editorRef.current;
    
    const templateData = {
      htmlStructure: editor.getHtml(),
      cssStyles: editor.getCss(),
      componentTree: editor.getComponents(),
      dataBindings: extractDataBindings(editor.getHtml())
    };
    
    onSave(templateData);
  };
  
  return (
    <div className="template-editor">
      <div className="editor-toolbar">
        <button onClick={handleSave} className="btn-primary">
          Save Template
        </button>
        <button onClick={() => previewPdf(editorRef.current)}>
          Preview PDF
        </button>
      </div>
      <div id="gjs-editor"></div>
    </div>
  );
};
function extractDataBindings(html: string): Record<string, { selector: string }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const bindings: Record<string, { selector: string }> = {};
  
  doc.querySelectorAll('[data-bind]').forEach((el) => {
    const bindName = el.getAttribute('data-bind')!;
    bindings[bindName] = {
      selector: `.${el.className}[data-bind="${bindName}"]`
    };
  });
  
  return bindings;
}
```
**Deliverables**:
- [ ] GrapesJS React component
- [ ] Custom funeral element blocks
- [ ] Template save/load functionality
- [ ] Data binding extraction logic
**Acceptance Criteria**:
* Editor loads in browser
* Custom blocks appear in sidebar
* Drag-and-drop working
* Template saves to database
***
### Week 14-18: Visual Editor Features, Testing, Documentation
*(Details abbreviated for space - includes real-time preview, template library UI, family-facing simplified editor, approval workflow integration)*
***
## Phase 4: Polish & Production (Weeks 19-24)
### Week 19-24: Performance Optimization, Print Fulfillment, Analytics, Final Testing
*(Details abbreviated - includes caching, batch generation, external printer integration, analytics dashboard)*
***
## Success Metrics
**Performance**:
- [ ] Invoice generation: <200ms
- [ ] Service program generation: <2s
- [ ] Browser pool memory: <600MB
- [ ] Concurrent generations: 10+ business docs, 3 memorial docs
**Quality**:
- [ ] 300 DPI print-ready PDFs
- [ ] Zero TypeScript compilation errors
- [ ] 90%+ test coverage
- [ ] Zero security vulnerabilities
**Functionality**:
- [ ] Smart conditional rendering working
- [ ] Per-funeral-home branding working
- [ ] Template versioning (SCD2) working
- [ ] Approval workflow integrated
**User Experience**:
- [ ] Visual editor intuitive for non-technical users
- [ ] Real-time PDF preview accurate
- [ ] Template library searchable
- [ ] Error messages helpful
***
## Risk Mitigation
**Risk**: Puppeteer browser crashes
**Mitigation**: Browser pool with health checks, auto-restart
**Risk**: PDF generation too slow
**Mitigation**: Parallel processing, caching, template optimization
**Risk**: Template customization breaks layout
**Mitigation**: CSS constraints, validation rules, safe zones
**Risk**: Family data leaks in logs
**Mitigation**: Redaction filters, encrypted storage, access controls
***
## Resources Required
**Development Time**: 6 months (1 developer full-time)
**Infrastructure**: None (open-source stack)
**Third-Party Costs**: $0
**Testing Environment**: Local + staging
***
## Next Steps
1. Review and approve this plan
2. Begin Week 1 implementation
3. Schedule weekly check-ins
4. Set up project tracking (GitHub issues)
5. Create initial PR with folder structure
***
**Plan Created**: December 2, 2024
**Last Updated**: December 2, 2024
**Status**: ✅ Ready for Implementation