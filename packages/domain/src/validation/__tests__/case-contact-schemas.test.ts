import { describe, it, expect } from 'vitest';
import {
  newCaseSchema,
  caseDetailsSchema,
  familyMemberSchema,
  caseAssignmentSchema,
  CASE_TYPES,
  CASE_STATUSES,
  SERVICE_TYPES,
} from '../case-schemas';
import {
  contactFormSchema,
  profileSettingsSchema,
  notificationPreferencesSchema,
  emailInvitationSchema,
} from '../contact-schemas';

// ============================================================================
// Case Schemas Tests
// ============================================================================

describe('New Case Schema', () => {
  it('validates correct new case data', () => {
    const validCase = {
      decedentName: 'John Doe',
      type: 'AT_NEED' as const,
    };
    
    const result = newCaseSchema.parse(validCase);
    expect(result.decedentName).toBe('John Doe');
    expect(result.type).toBe('AT_NEED');
  });

  it('requires decedent name', () => {
    const invalid = {
      decedentName: '',
      type: 'AT_NEED' as const,
    };
    expect(() => newCaseSchema.parse(invalid)).toThrow('Decedent name is required');
  });

  it('validates case types', () => {
    expect(CASE_TYPES).toContain('AT_NEED');
    expect(CASE_TYPES).toContain('PRE_NEED');
    expect(CASE_TYPES).toContain('INQUIRY');
  });
});

describe('Case Details Schema', () => {
  const validDetails = {
    decedentName: 'Jane Smith',
    dateOfBirth: new Date('1950-01-15'),
    dateOfDeath: new Date('2025-11-30'),
    placeOfDeath: 'Community Hospital',
    type: 'AT_NEED' as const,
    status: 'ARRANGEMENT' as const,
    serviceType: 'TRADITIONAL_FUNERAL' as const,
    serviceDate: new Date('2025-12-05'),
    serviceLocation: 'Main Chapel',
    notes: 'Family prefers morning service',
  };

  it('validates complete case details', () => {
    const result = caseDetailsSchema.parse(validDetails);
    expect(result.decedentName).toBe('Jane Smith');
    expect(result.serviceType).toBe('TRADITIONAL_FUNERAL');
  });

  it('validates date of death is after date of birth', () => {
    const invalid = {
      ...validDetails,
      dateOfBirth: new Date('2025-12-01'),
      dateOfDeath: new Date('1950-01-01'),
    };
    expect(() => caseDetailsSchema.parse(invalid)).toThrow('Date of death must be after date of birth');
  });

  it('validates service date is after date of death', () => {
    const invalid = {
      ...validDetails,
      dateOfDeath: new Date('2025-12-05'),
      serviceDate: new Date('2025-12-01'),
    };
    expect(() => caseDetailsSchema.parse(invalid)).toThrow('Service date should be after date of death');
  });

  it('allows optional fields', () => {
    const minimal = {
      decedentName: 'John Doe',
      type: 'INQUIRY' as const,
      status: 'INQUIRY' as const,
      notes: '',
    };
    expect(caseDetailsSchema.parse(minimal)).toBeTruthy();
  });

  it('validates service types enum', () => {
    expect(SERVICE_TYPES).toContain('TRADITIONAL_FUNERAL');
    expect(SERVICE_TYPES).toContain('MEMORIAL_SERVICE');
    expect(SERVICE_TYPES).toContain('CREMATION_ONLY');
  });
});

describe('Family Member Schema', () => {
  const validMember = {
    name: 'Robert Smith',
    relationship: 'SPOUSE' as const,
    email: 'robert@example.com',
    phone: '555-123-4567',
    isPrimaryContact: true,
    notes: 'Prefers text messages',
  };

  it('validates correct family member data', () => {
    const result = familyMemberSchema.parse(validMember);
    expect(result.name).toBe('Robert Smith');
    expect(result.relationship).toBe('SPOUSE');
    expect(result.isPrimaryContact).toBe(true);
  });

  it('requires name and relationship', () => {
    const invalid = { ...validMember, name: '' };
    expect(() => familyMemberSchema.parse(invalid)).toThrow('Name is required');
    
    const invalid2 = { ...validMember, relationship: '' };
    expect(() => familyMemberSchema.parse(invalid2)).toThrow();
  });

  it('validates email format', () => {
    const invalid = { ...validMember, email: 'invalid-email' };
    expect(() => familyMemberSchema.parse(invalid)).toThrow('Please enter a valid email address');
  });

  it('validates phone format', () => {
    const invalid = { ...validMember, phone: '123' };
    expect(() => familyMemberSchema.parse(invalid)).toThrow('Phone must be in format (555) 123-4567');
  });

  it('allows optional contact fields', () => {
    const minimal = {
      name: 'Jane Doe',
      relationship: 'CHILD' as const,
      email: '',
      phone: '',
      isPrimaryContact: false,
      notes: '',
    };
    expect(familyMemberSchema.parse(minimal)).toBeTruthy();
  });
});

describe('Case Assignment Schema', () => {
  const validAssignment = {
    staffId: 'staff-123',
    role: 'FUNERAL_DIRECTOR' as const,
    notes: 'Primary director for this case',
  };

  it('validates correct assignment data', () => {
    const result = caseAssignmentSchema.parse(validAssignment);
    expect(result.staffId).toBe('staff-123');
    expect(result.role).toBe('FUNERAL_DIRECTOR');
  });

  it('requires staff ID and role', () => {
    const invalid = { ...validAssignment, staffId: '' };
    expect(() => caseAssignmentSchema.parse(invalid)).toThrow('Please select a staff member');
  });
});

// ============================================================================
// Contact Schemas Tests
// ============================================================================

describe('Contact Form Schema', () => {
  const validContact = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-123-4567',
    message: 'I would like to inquire about pre-planning services.',
  };

  it('validates correct contact form data', () => {
    const result = contactFormSchema.parse(validContact);
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.message).toContain('pre-planning');
  });

  it('requires name, email, and message', () => {
    expect(() => contactFormSchema.parse({ ...validContact, name: '' })).toThrow('Name is required');
    expect(() => contactFormSchema.parse({ ...validContact, email: '' })).toThrow('Email is required');
    expect(() => contactFormSchema.parse({ ...validContact, message: '' })).toThrow('This field is required');
  });

  it('allows optional phone', () => {
    const withoutPhone = { ...validContact, phone: '' };
    expect(contactFormSchema.parse(withoutPhone)).toBeTruthy();
  });

  it('validates email format', () => {
    const invalid = { ...validContact, email: 'not-an-email' };
    expect(() => contactFormSchema.parse(invalid)).toThrow('Please enter a valid email address');
  });

  it('validates message length', () => {
    const tooLong = { ...validContact, message: 'A'.repeat(2001) };
    expect(() => contactFormSchema.parse(tooLong)).toThrow('Must be less than 2000 characters');
  });
});

describe('Profile Settings Schema', () => {
  const validProfile = {
    name: 'Jane Smith',
    phone: '555-987-6543',
  };

  it('validates correct profile data', () => {
    const result = profileSettingsSchema.parse(validProfile);
    expect(result.name).toBe('Jane Smith');
    expect(result.phone).toBe('555-987-6543');
  });

  it('requires name', () => {
    const invalid = { ...validProfile, name: '' };
    expect(() => profileSettingsSchema.parse(invalid)).toThrow('Name is required');
  });

  it('allows optional phone', () => {
    const withoutPhone = { ...validProfile, phone: '' };
    expect(profileSettingsSchema.parse(withoutPhone)).toBeTruthy();
  });
});

describe('Notification Preferences Schema', () => {
  const validPreferences = {
    emailNotifications: {
      caseUpdates: true,
      paymentReminders: false,
      documentUploads: true,
      taskAssignments: false,
    },
    smsNotifications: {
      urgentUpdates: true,
      appointmentReminders: false,
    },
  };

  it('validates notification preferences', () => {
    const result = notificationPreferencesSchema.parse(validPreferences);
    expect(result.emailNotifications.caseUpdates).toBe(true);
    expect(result.smsNotifications.urgentUpdates).toBe(true);
  });

  it('applies defaults when not provided', () => {
    const partial = {};
    const result = notificationPreferencesSchema.parse(partial);
    expect(result.emailNotifications.caseUpdates).toBe(true); // default
    expect(result.smsNotifications.urgentUpdates).toBe(false); // default
  });

  it('validates boolean values', () => {
    const invalid = {
      emailNotifications: {
        caseUpdates: 'yes', // Should be boolean
      },
    };
    expect(() => notificationPreferencesSchema.parse(invalid)).toThrow();
  });
});

describe('Email Invitation Schema', () => {
  const validInvitation = {
    email: 'family@example.com',
    name: 'Family Member',
    message: 'Please join us to access case information.',
  };

  it('validates correct invitation data', () => {
    const result = emailInvitationSchema.parse(validInvitation);
    expect(result.email).toBe('family@example.com');
    expect(result.name).toBe('Family Member');
  });

  it('requires email and name', () => {
    expect(() => emailInvitationSchema.parse({ ...validInvitation, email: '' })).toThrow('Email is required');
    expect(() => emailInvitationSchema.parse({ ...validInvitation, name: '' })).toThrow('Name is required');
  });

  it('allows optional message', () => {
    const withoutMessage = { ...validInvitation, message: '' };
    expect(emailInvitationSchema.parse(withoutMessage)).toBeTruthy();
  });

  it('enforces message max length', () => {
    const tooLong = { ...validInvitation, message: 'A'.repeat(501) };
    expect(() => emailInvitationSchema.parse(tooLong)).toThrow('Message must be less than 500 characters');
  });
});
