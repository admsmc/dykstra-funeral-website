# Case Router 100% Completion - Implementation Progress

**Date Started**: December 5, 2024  
**Current Status**: IN PROGRESS (60% → 85%)  
**Goal**: Complete Case Router to 100% with Linear/Notion-level UX

---

## 📊 Current State Assessment

### What Exists ✅ (60% Complete)

**Pages**:
- ✅ `/staff/cases` - Case list with ViewModel pattern (87 lines)
- ✅ `/staff/cases/[id]` - Case details with tabs (125 lines)
- ✅ `/staff/cases/new` - Case creation form
- ✅ Loading/error states with skeleton placeholders

**Components**:
- ✅ CaseListHeader, CaseListFilters, CaseTable, CaseListFooter
- ✅ CaseDetailHeader, QuickStatsCards, TabNavigation
- ✅ 9 tabs: Overview, Families, Arrangements, Contract, Payments, Memorial, Documents, Timeline, Internal Notes
- ✅ Bulk actions: Archive, Generate Docs, Assign Staff

**Features**:
- ✅ Pagination (cursor-based, 50 items per page)
- ✅ Filtering by status and type
- ✅ Keyboard shortcuts (Cmd+N for new, / for search, Esc to clear)
- ✅ Staff assignment
- ✅ Family invitations
- ✅ Internal notes with CRUD

**Backend (case.router.ts)**:
- ✅ 16+ endpoints fully implemented
- ✅ SCD Type 2 temporal queries (getHistory, getAtTime, getChangesBetween)
- ✅ Workflow state machine with validation
- ✅ Timeline events
- ✅ Document generation integration

---

## 🚧 What's Needed for 100% (40% Remaining)

### Priority 1: Status Management (STARTED - 25%)

**Component Created** ✅:
- `src/components/modals/CaseStatusChangeModal.tsx` (287 lines)
  - Workflow-aware status transitions
  - Reason textarea (required for terminal states)
  - Notification toggles (family, staff)
  - Success celebration with green checkmark
  - 2-column status grid with color-coded badges
  - Validates against WORKFLOW_TRANSITIONS
  - Integration with `case.updateStatus` mutation

**Integration Needed**:
1. Add status badge to CaseDetailHeader with click handler
2. Wire modal open/close state to case details page
3. Invalidate cache on success to refresh UI
4. Add status change to timeline events

**Time Estimate**: 30 minutes remaining

---

### Priority 2: Archive/Unarchive Workflow (NOT STARTED - 0%)

**Component Needed**:
- `src/components/modals/ArchiveCaseModal.tsx` (250 lines estimated)
  - Confirmation dialog with warning
  - Reason dropdown (Completed, Cancelled, Duplicate, Other)
  - Cascading effects warning (contracts, documents, family access)
  - Unarchive functionality for mistakes
  - Success toast notification

**Features**:
- Two-step confirmation for safety
- Show related entities that will be affected
- Provide undo option within 10 seconds
- Log archive event to timeline

**Time Estimate**: 45 minutes

---

### Priority 3: Enhanced Search (NOT STARTED - 0%)

**Component Needed**:
- `src/components/search/CaseSearchBar.tsx` (200 lines estimated)
  - Global search input with Cmd+K integration
  - Advanced filters dropdown:
    - Date range picker
    - Status multi-select
    - Assigned staff dropdown
    - Family name autocomplete
    - Case type toggles
  - Recent searches history
  - Search results preview with highlights

**Features**:
- Instant search with debounce (300ms)
- Fuzzy matching on decedent name
- Highlight matching text in results
- Keyboard navigation (arrow keys, Enter to select)
- Filter persistence in URL query params

**Time Estimate**: 1 hour

---

### Priority 4: Document Management Enhancement (NOT STARTED - 0%)

**Current State**: DocumentsTab exists but is placeholder

**Components Needed**:
1. `src/features/case-detail/components/DocumentsTab.tsx` (300 lines)
   - Upload button with drag-and-drop zone
   - Category selector (Death Certificate, Contract, Invoice, Photo, Other)
   - Document list with thumbnails
   - Download, Share, Delete actions
   - Version history for each document

2. `src/components/upload/DocumentUploader.tsx` (150 lines)
   - Drag-and-drop area with visual feedback
   - File type validation (PDF, DOCX, JPG, PNG)
   - Size limit (10MB per file)
   - Progress bars for uploads
   - Error handling for failed uploads

**Backend Integration**:
- Use existing `case.addDocument` mutation
- Integration with StoragePort for S3/blob storage
- Generate thumbnails for images
- Create download links with expiry

**Time Estimate**: 1.5 hours

---

### Priority 5: Notes/Comments Section (NOT STARTED - 0%)

**Current State**: InternalNotesTab exists with CRUD

**Enhancements Needed**:
1. Rich text editor (TipTap or similar)
   - Bold, italic, lists, links
   - Markdown support
   - @ mentions for staff
   - File attachments

2. Real-time updates (Websockets or polling)
   - Show "typing..." indicator
   - Auto-refresh when new notes added
   - Notification badge for unread notes

3. Note categories/tags
   - Important, Follow-up, Private, Family-visible
   - Color coding
   - Filter by category

**Time Estimate**: 1 hour

---

### Priority 6: Skeleton Loaders & UX Polish (NOT STARTED - 0%)

**Components Needed**:
- `src/components/skeletons/CaseSkeletons.tsx` (200 lines)
  - CaseListSkeleton (table rows)
  - CaseDetailSkeleton (header + tabs)
  - CaseStatsSkeleton (4-card grid)
  - TimelineSkeleton (event bubbles)

**UX Improvements**:
- Add loading states to all async operations
- Optimistic UI updates for mutations
- Empty states with helpful CTAs
- Error boundaries with retry buttons
- Mobile responsiveness audit
- Accessibility (ARIA labels, keyboard nav)

**UX/UI Guardrails Compliance**:
- ✅ Rule 1: Component isolation (already compliant)
- ✅ Rule 2: No business logic in pages (using ViewModels)
- ⚠️  Rule 3: Loading/error states (needs skeleton loaders)
- ✅ Rule 4: No inline styles (using Tailwind)
- ✅ Rule 5: 60fps animations (Framer Motion for modals)

**Time Estimate**: 1 hour

---

## 📅 Implementation Timeline

### Session 1: Status Management (CURRENT)
- ✅ Create CaseStatusChangeModal (287 lines) - DONE
- ⏳ Integrate into case details page - 15 min
- ⏳ Add status badge click handler - 10 min
- ⏳ Wire up cache invalidation - 5 min

**Total**: 30 minutes

### Session 2: Archive Workflow
- Create ArchiveCaseModal
- Add archive button to case actions
- Implement unarchive for mistakes
- Add timeline events

**Total**: 45 minutes

### Session 3: Enhanced Search
- Create CaseSearchBar component
- Add advanced filters
- Integrate with command palette
- Add URL query param persistence

**Total**: 1 hour

### Session 4: Document Management
- Enhance DocumentsTab
- Create DocumentUploader component
- Wire up storage integration
- Add download/share/delete actions

**Total**: 1.5 hours

### Session 5: Notes Enhancement
- Add rich text editor
- Implement @ mentions
- Add real-time updates
- Create note categories

**Total**: 1 hour

### Session 6: Polish & Testing
- Create skeleton loaders
- Add empty states
- Mobile responsiveness
- UX guardrails audit
- Validation & testing

**Total**: 1 hour

---

## 🎯 Total Remaining Time

**Estimated**: 5.5 hours total
- Session 1 (Status): 30 min (IN PROGRESS)
- Session 2 (Archive): 45 min
- Session 3 (Search): 1 hour
- Session 4 (Documents): 1.5 hours
- Session 5 (Notes): 1 hour
- Session 6 (Polish): 1 hour

**Progress**: 60% → 100% (40% remaining)

---

## ✅ Completion Criteria

Case Router will be 100% complete when:

1. **Status Management** ✅ (COMPONENT DONE, INTEGRATION PENDING)
   - Click status badge to change status
   - Workflow validation enforced
   - Success notification shown
   - Timeline updated

2. **Archive/Unarchive** ❌
   - Confirmation modal with warnings
   - Cascading effects displayed
   - Undo option available
   - Archived cases hideable in list

3. **Enhanced Search** ❌
   - Global search bar with Cmd+K
   - Advanced filters work
   - Results preview with highlights
   - URL persistence

4. **Document Management** ❌
   - Upload documents works
   - Categorization functional
   - Download/share/delete operational
   - Thumbnails generated

5. **Notes/Comments** ❌
   - Rich text editing
   - @ mentions functional
   - Real-time updates
   - Categories/tags work

6. **UX Polish** ❌
   - All pages have skeleton loaders
   - All empty states have helpful CTAs
   - All errors have retry buttons
   - Mobile responsive
   - 95%+ UX guardrails compliance

---

## 📚 Files Modified/Created

### Created (1 file)
- ✅ `src/components/modals/CaseStatusChangeModal.tsx` (287 lines)

### To Be Created (6 files)
- ⏳ `src/components/modals/ArchiveCaseModal.tsx` (250 lines)
- ⏳ `src/components/search/CaseSearchBar.tsx` (200 lines)
- ⏳ `src/features/case-detail/components/DocumentsTab.tsx` (300 lines)
- ⏳ `src/components/upload/DocumentUploader.tsx` (150 lines)
- ⏳ `src/components/skeletons/CaseSkeletons.tsx` (200 lines)
- ⏳ Enhanced `src/features/case-detail/components/InternalNotesTab.tsx` (+100 lines)

### To Be Modified (2 files)
- ⏳ `src/app/staff/cases/[id]/page.tsx` (integrate status modal)
- ⏳ `src/app/staff/cases/page.tsx` (add search bar)

**Total Lines**: ~1,487 lines of new/modified code

---

## 🎉 Next Steps

**Immediate** (Next 30 minutes):
1. Integrate CaseStatusChangeModal into case details page
2. Add status badge with click handler
3. Wire up cache invalidation on status change
4. Test workflow transitions

**Short Term** (Next session):
1. Create ArchiveCaseModal
2. Implement archive workflow
3. Add unarchive functionality

**Medium Term** (This week):
1. Enhanced search bar
2. Document management
3. Notes enhancements
4. UX polish & skeleton loaders

**Status**: Ready to continue implementation! 🚀
