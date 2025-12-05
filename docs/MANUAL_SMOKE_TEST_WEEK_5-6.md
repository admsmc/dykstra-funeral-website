# Manual Smoke Test Checklist - Week 5-6

**Testing Date**: ___________  
**Tester**: ___________  
**Environment**: Development / Staging / Production  
**Build Version**: ___________

## Overview
This checklist verifies all Week 5-6 (Core Operations Domain) features are working correctly.

---

## Phase 3.1: Case Router Enhancement

### ✅ Case Status Workflow
- [ ] Navigate to `/staff/cases`
- [ ] Open quick actions menu on any case (⋮ icon)
- [ ] Verify status transitions show only valid next statuses
- [ ] Click status change (e.g., inquiry → active)
- [ ] Verify toast notification appears
- [ ] Verify case list refreshes with new status

**Expected**: Only valid transitions shown, smooth status updates

### ✅ Case Financial Summary
- [ ] Check "Balance Due" column on cases page
- [ ] Verify dollar amounts display
- [ ] Verify color coding (green=paid, red=overdue, gray=pending)
- [ ] Hover over amount to see full financial details

**Expected**: Real-time financial data, proper formatting

### ✅ Case Quick Actions
- [ ] Click "Schedule Service" from quick actions menu
- [ ] Verify toast notification
- [ ] Click "Assign Staff" 
- [ ] Verify toast notification
- [ ] Click "Generate Documents"
- [ ] Verify toast notification

**Expected**: All actions execute with feedback

### ✅ Bulk Operations
- [ ] Select multiple cases (checkboxes)
- [ ] Verify bulk actions toolbar appears at top
- [ ] Click "Archive" button
- [ ] Confirm dialog and verify toast
- [ ] Click "Generate Docs" button
- [ ] Verify success message
- [ ] Click "Assign Staff" button
- [ ] Verify success message

**Expected**: Bulk toolbar visible, all actions work

---

## Phase 3.2: Contract Router Enhancement

### ✅ Contract Renewal
- [ ] Navigate to `/staff/contracts`
- [ ] Find a fully signed contract
- [ ] Click renewal icon (refresh icon)
- [ ] Modal opens with renewal form
- [ ] Select new expiration date (future date)
- [ ] Choose price adjustment (inflation/custom/none)
- [ ] Add notes
- [ ] Click "Review Renewal"
- [ ] Verify preview shows correct amounts
- [ ] Click "Confirm Renewal"
- [ ] Verify loading spinner appears
- [ ] Verify success message and modal closes
- [ ] Verify contract list refreshes

**Expected**: Smooth 3-step flow, real API call

### ✅ Send for Signature
- [ ] Find a draft contract
- [ ] Click "Send for Signature" icon
- [ ] Verify toast notification
- [ ] Verify status changes to "Pending Signatures"

**Expected**: E-signature workflow initiated

### ✅ PDF Generation
- [ ] Find pending or signed contract
- [ ] Click download icon
- [ ] Verify PDF generation toast
- [ ] Verify new tab opens with PDF URL

**Expected**: PDF generated with correct watermark

### ✅ Signature Tracking
- [ ] Verify signature status column shows family/staff signatures
- [ ] Check checkmark icons for signed
- [ ] Check clock icons for pending
- [ ] Verify dates display for completed signatures

**Expected**: Clear visual status indicators

---

## Phase 3.3: Cases Page Enhancements

### ✅ Workflow State Machine
- [ ] Create new case
- [ ] Verify starts in "inquiry" status
- [ ] Try to transition to invalid status
- [ ] Verify error message
- [ ] Transition through valid path: inquiry → active → completed → archived
- [ ] Verify each transition succeeds

**Expected**: Workflow enforcement working

### ✅ Navigation
- [ ] Verify cases page loads at `/staff/cases`
- [ ] Click on case name to view details
- [ ] Verify detail page loads
- [ ] Click back to cases list
- [ ] Use filters (status, type)
- [ ] Verify filtered results

**Expected**: Smooth navigation, filters work

---

## Phase 3.4: Contracts Page Enhancements

### ✅ Status-Based Actions
- [ ] Find DRAFT contract → verify "Send for Signature" button
- [ ] Find PENDING_SIGNATURES contract → verify "Send Reminder" and "Download" buttons
- [ ] Find FULLY_SIGNED contract → verify "Download" and "Renew" buttons
- [ ] Verify no wrong actions for wrong statuses

**Expected**: Context-aware action buttons

---

## Phase 3.5: Document Generation

### ✅ Documents Page Access
- [ ] From cases page, click quick actions → "Generate Documents"
- [ ] Verify redirects to `/staff/cases/[id]/documents`
- [ ] Verify page loads with case name in header
- [ ] Verify back button returns to case detail

**Expected**: Seamless navigation to documents page

### ✅ Template Selection
- [ ] Verify 6 templates display:
  - [ ] Service Program
  - [ ] Prayer Card
  - [ ] Obituary
  - [ ] Thank You Card
  - [ ] Memorial Folder
  - [ ] Register Book Pages
- [ ] Click one template to select
- [ ] Verify checkmark appears
- [ ] Verify border turns navy blue
- [ ] Click again to deselect
- [ ] Click "Select All" button
- [ ] Verify all 6 templates selected
- [ ] Click "Deselect All"
- [ ] Verify all templates unselected

**Expected**: Interactive selection with visual feedback

### ✅ Template Preview
- [ ] Select any template
- [ ] Click "Preview data mapping" link
- [ ] Verify modal opens
- [ ] Verify template variables shown
- [ ] Verify case data values displayed (e.g., {{decedentName}} → "John Smith")
- [ ] Click "Close Preview"
- [ ] Verify modal closes

**Expected**: Data mapping preview accurate

### ✅ Document Generation
- [ ] Select 2-3 templates
- [ ] Choose output format (PDF or DOCX)
- [ ] Click "Generate X Document(s)" button
- [ ] Verify loading spinner appears
- [ ] Verify success toast
- [ ] Verify generated documents appear in list below
- [ ] Verify document name, timestamp, format shown

**Expected**: Bulk generation works

### ✅ Document Actions
- [ ] Click download icon on generated document
- [ ] Verify success toast
- [ ] Click email icon
- [ ] Verify success toast

**Expected**: Download and email actions work

---

## Phase 3.6: Workflow Tracking

### ✅ Workflow Tracker Component (if integrated)
- [ ] Navigate to case detail page (if tracker integrated)
- [ ] Verify workflow tracker visible
- [ ] Verify current step highlighted
- [ ] Verify completed steps show checkmark
- [ ] Verify pending steps show gray circle
- [ ] Verify connector lines color-coded

**Expected**: Visual progress clear

### ✅ Compact Mode (if integrated in list/cards)
- [ ] Check if compact workflow appears on case cards
- [ ] Verify horizontal step indicators
- [ ] Hover over steps to see tooltips

**Expected**: Compact visualization functional

---

## General System Checks

### ✅ Performance
- [ ] Cases page loads < 2 seconds
- [ ] Contracts page loads < 2 seconds
- [ ] No visible lag when selecting items
- [ ] Smooth animations on modals

**Expected**: Fast, responsive UI

### ✅ Error Handling
- [ ] Try invalid action (e.g., finalize incomplete case)
- [ ] Verify error toast appears
- [ ] Verify user-friendly message
- [ ] Verify system doesn't crash

**Expected**: Graceful error handling

### ✅ Loading States
- [ ] Verify spinners appear during API calls
- [ ] Verify buttons disable during pending operations
- [ ] Verify "Loading..." text where appropriate

**Expected**: Clear loading feedback

### ✅ Data Persistence
- [ ] Make changes (status update, document generation)
- [ ] Refresh page
- [ ] Verify changes persisted

**Expected**: Data saved correctly

### ✅ Browser Console
- [ ] Open DevTools Console (F12)
- [ ] Perform all actions above
- [ ] Check for errors (should be none)
- [ ] Check for warnings (minimize)

**Expected**: Clean console logs

---

## Test Results Summary

**Total Tests**: 50  
**Passed**: ______  
**Failed**: ______  
**Blocked**: ______  
**Pass Rate**: ______%

### Critical Issues Found
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Minor Issues Found
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Notes
_____________________________________________
_____________________________________________
_____________________________________________

### Sign-Off
- [ ] All critical features tested
- [ ] No blocking issues
- [ ] Ready for E2E testing

**Tester Signature**: ___________________  
**Date**: ___________________
