# Contact/Family CRM Router Implementation Plan

**Date**: December 5, 2024  
**Estimated Time**: 6-8 hours  
**Complexity**: High (28 endpoints, largest router)  
**Business Impact**: Critical (CRM is core to funeral home operations)

---

## 📊 Current State Analysis

### Existing Infrastructure
✅ **Contact Router**: 28 endpoints (100% implemented)  
✅ **Family Hierarchy Router**: Additional relationship management  
✅ **Basic UI**: `/staff/families` page with search, bulk actions  
✅ **Backend**: Full CRUD, grief journey, tags, merge, history

### Gap Analysis (from API_ROUTER_UI_COVERAGE_AUDIT.md)
❌ **Contact search** - Advanced filters not exposed  
❌ **Interaction history** - No timeline view  
❌ **Tag management** - Add/remove UI missing  
❌ **Duplicate merge** - Workflow incomplete  
❌ **Grief journey** - Tracking not visible  
❌ **Contact details** - Individual profile view missing  
❌ **Relationship graph** - Family tree visualization missing  
❌ **Contact stats** - Dashboard widgets missing

---

## 🎯 Implementation Strategy

### Phase 1: Contact Details & Profile (2 hours)
**Priority**: Critical  
**Goal**: Create comprehensive contact profile page

#### 1.1 Contact Detail Page (60 min)
**Route**: `/staff/families/[id]/page.tsx`

**Components to Create**:
1. `ContactProfileHeader` - Name, type, tags, actions
2. `ContactInfoCard` - Email, phone, address, demographics
3. `GriefJourneyCard` - Grief stage, check-ins, anniversary dates
4. `CulturalPreferencesCard` - Religion, dietary, language
5. `VeteranInfoCard` - Military service details
6. `ContactHistoryTimeline` - Temporal SCD2 changes

**Features**:
- Inline editing for all fields
- Tag add/remove with autocomplete
- Opt-in/out toggles (email, SMS)
- Do Not Contact warning banner
- Merged contact indicator

**tRPC Endpoints Used**:
- `contact.getById` - Fetch contact details
- `contact.getHistory` - Temporal changes
- `contact.updateInfo` - Edit contact info
- `contact.updateRelationship` - Edit relationship
- `contact.addTag` / `contact.removeTag` - Tag management
- `contact.updateOptIns` - Email/SMS preferences
- `contact.markDoNotContact` - DNC action

#### 1.2 Interaction Timeline (30 min)
**Component**: `InteractionTimeline`

**Features**:
- Phone calls, meetings, emails, grief check-ins
- Add new interaction with modal
- Filter by interaction type
- Link to related cases

**tRPC Endpoints Used**:
- `contact.addNote` - Add interaction
- Case-related queries for linked cases

#### 1.3 Delete Contact Action (30 min)
**Component**: `DeleteContactModal`

**Features**:
- Soft delete confirmation
- Show linked cases warning
- Reason for deletion dropdown
- Success celebration

**tRPC Endpoints Used**:
- `contact.delete` - Soft delete contact

---

### Phase 2: Grief Journey Tracking (1.5 hours)
**Priority**: High (unique differentiator for funeral home)  
**Goal**: Implement grief journey workflows

#### 2.1 Grief Journey Dashboard Widget (45 min)
**Component**: `GriefJourneyWidget` (for dashboard)

**Features**:
- Contacts needing check-in (badge count)
- Upcoming service anniversaries (next 30 days)
- Grief stage distribution chart
- Quick actions (record check-in, update stage)

**tRPC Endpoints Used**:
- `contact.getContactsNeedingGriefCheckIn` - Widget data
- `contact.list` with grief journey filters

#### 2.2 Start Grief Journey Modal (30 min)
**Component**: `StartGriefJourneyModal`

**Features**:
- Link to deceased (case selection)
- Service anniversary date picker
- Relationship to deceased dropdown
- Initial grief stage assessment

**tRPC Endpoints Used**:
- `contact.startGriefJourney` - Initialize journey

#### 2.3 Grief Check-In Workflow (15 min)
**Component**: `GriefCheckInModal`

**Features**:
- Record check-in date
- Update grief stage
- Add notes about conversation
- Schedule next check-in

**tRPC Endpoints Used**:
- `contact.recordGriefCheckIn` - Record check-in
- `contact.updateGriefStage` - Update stage
- `contact.addNote` - Add notes

---

### Phase 3: Duplicate Management (1.5 hours)
**Priority**: High (data quality critical)  
**Goal**: Complete duplicate detection and merge workflow

#### 3.1 Enhanced Duplicate Detection UI (45 min)
**Improvements to existing `/staff/families` page**:

**Features**:
- Duplicate groups with similarity scores
- Side-by-side comparison view
- Confidence level indicators (High/Medium/Low)
- Merge action buttons

**tRPC Endpoints Used**:
- `contact.findDuplicates` (already used)

#### 3.2 Contact Merge Workflow (45 min)
**Component**: `MergeContactsModal`

**Features**:
- Two-step wizard (Select Target → Preview Merge)
- Field-by-field comparison
- Choose which fields to keep
- Preview merged result
- Merge retention days indicator (30 days)
- Warning about cascading effects

**tRPC Endpoints Used**:
- `contact.merge` - Execute merge
- `contact.getById` (both contacts)

---

### Phase 4: Enhanced Search & Filters (1.5 hours)
**Priority**: Medium (usability improvement)  
**Goal**: Powerful search experience

#### 4.1 Global Contact Search (45 min)
**Component**: `ContactSearchBar` (integrate with Cmd+K)

**Features**:
- Fuzzy search (name, email, phone)
- Live results preview (top 5)
- Keyboard navigation
- Recent searches
- Search history

**tRPC Endpoints Used**:
- `contact.search` - Full-text search

#### 4.2 Advanced Filter Panel (30 min)
**Component**: `ContactFilterPanel`

**Features**:
- Filter by type (primary, secondary, professional)
- Filter by tags (multi-select)
- Filter by opt-ins (email, SMS)
- Filter by grief journey status
- Date range filters (created, updated)
- Clear all filters button

**tRPC Endpoints Used**:
- `contact.list` with filter parameters

#### 4.3 Saved Filters (15 min)
**Component**: `SavedFilters`

**Features**:
- Save current filters with name
- Quick access to saved filters
- Edit/delete saved filters
- Share filters with team (future)

**Storage**: LocalStorage or user preferences

---

### Phase 5: Tag Management (45 min)
**Priority**: Medium (workflow enhancement)  
**Goal**: Complete tag CRUD

#### 5.1 Tag Manager Modal (30 min)
**Component**: `TagManagerModal`

**Features**:
- List all tags in system
- Tag usage count
- Create new tag
- Rename tag (bulk update)
- Delete tag (bulk remove)
- Tag color picker

**tRPC Endpoints Used**:
- `contact.list` (aggregate tags)
- `contact.addTag` - Create tag
- `contact.removeTag` - Delete tag
- `contact.bulkUpdate` - Rename tag

#### 5.2 Tag Autocomplete (15 min)
**Component**: `TagAutocomplete`

**Features**:
- Autocomplete existing tags
- Create new tag inline
- Tag suggestions based on contact type
- Popular tags shown first

---

### Phase 6: Contact Stats & Dashboard Widgets (1 hour)
**Priority**: Low (analytics)  
**Goal**: Visibility into contact database

#### 6.1 Contact Stats Dashboard (45 min)
**Component**: `ContactStatsWidget` (for dashboard)

**Features**:
- Total contacts by type (pie chart)
- Contact growth trend (line chart, last 90 days)
- Email opt-in rate (percentage)
- SMS opt-in rate (percentage)
- Recently updated contacts (list, last 7 days)
- Top tags by usage (bar chart)

**tRPC Endpoints Used**:
- `contact.list` (aggregate stats)
- Custom stats endpoint (if needed)

#### 6.2 Recently Updated Widget (15 min)
**Component**: `RecentlyUpdatedContactsWidget`

**Features**:
- Last 10 updated contacts
- Show what changed (tags, info, opt-ins)
- Quick link to contact profile

---

### Phase 7: Cultural & Veteran Info (45 min)
**Priority**: Low (nice-to-have)  
**Goal**: Comprehensive contact profiling

#### 7.1 Cultural Preferences Form (30 min)
**Component**: `CulturalPreferencesForm`

**Features**:
- Religious affiliation dropdown
- Cultural preferences multi-select
- Dietary restrictions checklist
- Language preference dropdown (8 languages)

**tRPC Endpoints Used**:
- `contact.updateCulturalPreferences`
- `contact.updateLanguagePreference`

#### 7.2 Veteran Information Form (15 min)
**Component**: `VeteranInfoForm`

**Features**:
- Veteran checkbox
- Military branch dropdown (6 branches)
- Service dates (optional)
- VA benefits eligibility notes

**tRPC Endpoints Used**:
- `contact.updateVeteranInfo`

---

## 📋 Implementation Checklist

### Must-Have (MVP) - 4.5 hours
- [ ] **Contact Detail Page** (60 min) - Individual profile view
- [ ] **Interaction Timeline** (30 min) - Activity history
- [ ] **Delete Contact** (30 min) - Soft delete workflow
- [ ] **Grief Journey Dashboard Widget** (45 min) - High-value widget
- [ ] **Start Grief Journey** (30 min) - Initialize tracking
- [ ] **Grief Check-In** (15 min) - Record check-ins
- [ ] **Enhanced Duplicate Detection** (45 min) - UI improvements
- [ ] **Contact Merge Workflow** (45 min) - Complete merge process

### Should-Have (High Value) - 2.5 hours
- [ ] **Global Contact Search** (45 min) - Fuzzy search
- [ ] **Advanced Filter Panel** (30 min) - Multi-criteria filters
- [ ] **Saved Filters** (15 min) - Save/restore filters
- [ ] **Tag Manager** (30 min) - Tag CRUD
- [ ] **Tag Autocomplete** (15 min) - Smart suggestions
- [ ] **Contact Stats Widget** (45 min) - Dashboard analytics

### Nice-to-Have (Polish) - 1 hour
- [ ] **Recently Updated Widget** (15 min) - Activity feed
- [ ] **Cultural Preferences Form** (30 min) - Detailed profiling
- [ ] **Veteran Info Form** (15 min) - Military details

**Total**: 8 hours (aggressive), 10 hours (comfortable)

---

## 🎨 UX/UI Guardrails Compliance

### Rule 1: Component Isolation
- ✅ Create separate components for each section
- ✅ Use ViewModel pattern for data transformation
- ✅ Components receive props, no direct API calls

### Rule 2: No Business Logic in Pages
- ✅ Pages orchestrate components
- ✅ All business rules in domain/application layers
- ✅ tRPC endpoints handle logic

### Rule 3: Loading/Error States
- ✅ Skeleton loaders for contact profile
- ✅ Error boundaries with friendly messages
- ✅ Empty states for no contacts
- ✅ Loading spinners for mutations

### Rule 4: No Inline Styles
- ✅ Tailwind utilities throughout
- ✅ CSS variables for colors (`--navy`, `--sage`, etc.)
- ✅ Consistent spacing (4px grid)

### Rule 5: 60fps Animations
- ✅ Framer Motion for all transitions
- ✅ GPU-accelerated transforms
- ✅ Staggered list animations
- ✅ Smooth modal enter/exit

---

## 📂 File Structure Plan

```
src/app/staff/families/
├── page.tsx                          # List view (existing, enhance)
├── [id]/
│   ├── page.tsx                      # Contact detail page (NEW)
│   └── loading.tsx                   # Skeleton loader (NEW)
└── new/
    └── page.tsx                      # Create contact (existing?)

src/components/
├── contacts/
│   ├── ContactProfileHeader.tsx     # Header with actions
│   ├── ContactInfoCard.tsx          # Basic info card
│   ├── GriefJourneyCard.tsx         # Grief tracking
│   ├── CulturalPreferencesCard.tsx  # Cultural info
│   ├── VeteranInfoCard.tsx          # Military info
│   ├── ContactHistoryTimeline.tsx   # SCD2 history
│   └── InteractionTimeline.tsx      # Activity log
├── modals/
│   ├── DeleteContactModal.tsx       # Delete confirmation
│   ├── StartGriefJourneyModal.tsx   # Initialize grief journey
│   ├── GriefCheckInModal.tsx        # Record check-in
│   ├── MergeContactsModal.tsx       # Merge workflow
│   └── TagManagerModal.tsx          # Tag CRUD
├── widgets/
│   ├── GriefJourneyWidget.tsx       # Dashboard widget
│   ├── ContactStatsWidget.tsx       # Dashboard stats
│   └── RecentlyUpdatedContactsWidget.tsx
└── forms/
    ├── ContactSearchBar.tsx         # Global search
    ├── ContactFilterPanel.tsx       # Advanced filters
    ├── CulturalPreferencesForm.tsx  # Cultural info form
    └── VeteranInfoForm.tsx          # Military form

docs/
└── CONTACT_CRM_ROUTER_COMPLETION.md # Session log
```

**Estimated File Count**: 23 new files

---

## 🚀 Session Execution Plan

### Session 1: Core Profile & Grief Journey (3 hours)
1. **Contact Detail Page** - Full profile view
2. **Interaction Timeline** - Activity history
3. **Delete Contact** - Soft delete
4. **Grief Journey Widgets** - Dashboard & modals

**Goal**: Contact profile functional, grief journey tracking live

### Session 2: Merge & Search (2.5 hours)
1. **Enhanced Duplicate Detection** - UI improvements
2. **Contact Merge Workflow** - Complete merge process
3. **Global Contact Search** - Fuzzy search
4. **Advanced Filters** - Multi-criteria

**Goal**: Duplicate management complete, search powerful

### Session 3: Tags & Polish (2.5 hours)
1. **Tag Manager** - Tag CRUD
2. **Tag Autocomplete** - Smart suggestions
3. **Contact Stats** - Dashboard analytics
4. **Cultural/Veteran Forms** - Detailed profiling

**Goal**: Tag management complete, analytics live, polish applied

---

## 📊 Success Criteria

### Functional
- ✅ Contact detail page shows all 40+ fields
- ✅ Grief journey can be started and tracked
- ✅ Contacts can be merged with field selection
- ✅ Global search returns results < 200ms
- ✅ Tags can be added/removed with autocomplete
- ✅ Dashboard widgets show real-time stats

### UX Quality
- ✅ Linear/Notion-level modal design
- ✅ Smooth animations (60fps)
- ✅ Content-aware skeleton loaders
- ✅ Error handling with friendly messages
- ✅ Success celebrations for key actions

### Technical
- ✅ All 28 contact endpoints exposed in UI
- ✅ TypeScript compiles with zero errors
- ✅ 100% UX/UI guardrails compliance
- ✅ Responsive design (mobile-friendly)

---

## 🎯 Next Steps

**Immediate**: Start Session 1 with Contact Detail Page  
**Timeline**: 3 sessions over 8 hours  
**Outcome**: Contact/Family CRM Router 100% complete

---

**Ready to proceed?** Let's start with **Session 1: Core Profile & Grief Journey** (3 hours)!
