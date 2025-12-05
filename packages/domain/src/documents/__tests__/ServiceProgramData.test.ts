import { describe, it, expect } from 'vitest';
import {
  ServiceProgramData,
  type DeceasedInfo,
  type ServiceDetails,
  type ServiceEvent,
  type Survivor,
  type ServiceProgramMetadata,
} from '../ServiceProgramData';

describe('ServiceProgramData', () => {
  const mockDeceasedInfo: DeceasedInfo = {
    fullName: 'John William Smith',
    birthDate: new Date('1950-03-15'),
    deathDate: new Date('2024-11-28'),
    birthPlace: 'Grand Rapids, Michigan',
    residenceAtDeath: 'Holland, Michigan',
    photoUrl: 'https://storage.example.com/photos/john-smith.jpg',
  };

  const mockServiceDetails: ServiceDetails = {
    serviceDate: new Date('2024-12-05'),
    serviceTime: '2:00 PM',
    location: 'First Presbyterian Church',
    locationAddress: '123 Church St, Grand Rapids, MI 49503',
    officiant: 'Rev. James Anderson',
  };

  const mockOrderOfService: ServiceEvent[] = [
    { title: 'Prelude', description: 'Amazing Grace', performedBy: 'Church Organist' },
    { title: 'Opening Prayer', performedBy: 'Rev. James Anderson' },
    { title: 'Eulogy', performedBy: 'Michael Smith' },
  ];

  const mockSurvivors: Survivor[] = [
    { name: 'Jane Smith', relationship: 'Wife' },
    { name: 'Michael Smith', relationship: 'Son' },
    { name: 'Sarah Johnson', relationship: 'Daughter' },
  ];

  const mockMetadata: ServiceProgramMetadata = {
    caseId: 'case-2024-001',
    funeralHomeId: 'dykstra-funeral-home',
    programType: 'funeral',
    createdAt: new Date('2024-11-29'),
    createdBy: 'user-123',
  };

  describe('create', () => {
    it('should create a valid service program', () => {
      const program = ServiceProgramData.create(
        mockMetadata,
        mockDeceasedInfo,
        mockServiceDetails,
        mockOrderOfService,
        mockSurvivors
      );

      expect(program.deceased.fullName).toBe('John William Smith');
      expect(program.orderOfService).toHaveLength(3);
      expect(program.survivors).toHaveLength(3);
    });

    it('should throw error if death date before birth date', () => {
      const badDeceased = {
        ...mockDeceasedInfo,
        deathDate: new Date('1940-01-01'), // Before birth
      };

      expect(() => {
        ServiceProgramData.create(
          mockMetadata,
          badDeceased,
          mockServiceDetails,
          mockOrderOfService,
          mockSurvivors
        );
      }).toThrow('Death date cannot be before birth date');
    });

    it('should throw error if service date before death date', () => {
      const badService = {
        ...mockServiceDetails,
        serviceDate: new Date('2024-11-01'), // Before death
      };

      expect(() => {
        ServiceProgramData.create(
          mockMetadata,
          mockDeceasedInfo,
          badService,
          mockOrderOfService,
          mockSurvivors
        );
      }).toThrow('Service date cannot be before death date');
    });

    it('should throw error if order of service is empty', () => {
      expect(() => {
        ServiceProgramData.create(
          mockMetadata,
          mockDeceasedInfo,
          mockServiceDetails,
          [], // Empty
          mockSurvivors
        );
      }).toThrow('Service program must have at least one event in order of service');
    });

    it('should throw error if service time format is invalid', () => {
      const badService = {
        ...mockServiceDetails,
        serviceTime: '14:00', // 24-hour format not allowed
      };

      expect(() => {
        ServiceProgramData.create(
          mockMetadata,
          mockDeceasedInfo,
          badService,
          mockOrderOfService,
          mockSurvivors
        );
      }).toThrow('Service time must be in format "H:MM AM/PM"');
    });
  });

  describe('formatLifespan', () => {
    it('should format date range correctly', () => {
      const program = ServiceProgramData.create(
        mockMetadata,
        mockDeceasedInfo,
        mockServiceDetails,
        mockOrderOfService,
        mockSurvivors
      );

      const formatted = program.formatLifespan();
      // Verify format is correct (actual dates may vary by timezone)
      expect(formatted).toMatch(/\w+ \d{1,2}, \d{4} - \w+ \d{1,2}, \d{4}/);
      expect(formatted).toContain('1950');
      expect(formatted).toContain('2024');
    });
  });

  describe('calculateAgeAtDeath', () => {
    it('should calculate correct age', () => {
      const program = ServiceProgramData.create(
        mockMetadata,
        mockDeceasedInfo,
        mockServiceDetails,
        mockOrderOfService,
        mockSurvivors
      );

      // Born: March 15, 1950
      // Died: November 28, 2024
      // Age: 74 (birthday already passed in 2024)
      expect(program.calculateAgeAtDeath()).toBe(74);
    });

    it('should adjust age if birthday not yet reached in death year', () => {
      const deceased: DeceasedInfo = {
        ...mockDeceasedInfo,
        birthDate: new Date('1950-03-15'),
        deathDate: new Date('2024-01-10'), // Before birthday
      };

      const program = ServiceProgramData.create(
        mockMetadata,
        deceased,
        mockServiceDetails,
        mockOrderOfService,
        mockSurvivors
      );

      // Should be 73, not 74
      expect(program.calculateAgeAtDeath()).toBe(73);
    });

    it('should handle death on birthday', () => {
      const deceased: DeceasedInfo = {
        ...mockDeceasedInfo,
        birthDate: new Date('1950-03-15'),
        deathDate: new Date('2024-03-15'), // Same day/month
      };

      const program = ServiceProgramData.create(
        mockMetadata,
        deceased,
        mockServiceDetails,
        mockOrderOfService,
        mockSurvivors
      );

      expect(program.calculateAgeAtDeath()).toBe(74);
    });
  });

  describe('formatServiceDateTime', () => {
    it('should format service datetime correctly', () => {
      const program = ServiceProgramData.create(
        mockMetadata,
        mockDeceasedInfo,
        mockServiceDetails,
        mockOrderOfService,
        mockSurvivors
      );

      const formatted = program.formatServiceDateTime();
      // Verify format is correct (day of week may vary by timezone)
      expect(formatted).toMatch(/\w+, \w+ \d{1,2}, \d{4} at \d{1,2}:\d{2} [AP]M/);
      expect(formatted).toContain('December');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('2:00 PM');
    });
  });

  describe('groupSurvivorsByRelationship', () => {
    it('should group survivors by relationship', () => {
      const survivors: Survivor[] = [
        { name: 'Jane Smith', relationship: 'Wife' },
        { name: 'Michael Smith', relationship: 'Son' },
        { name: 'David Smith', relationship: 'Son' },
        { name: 'Sarah Johnson', relationship: 'Daughter' },
      ];

      const program = ServiceProgramData.create(
        mockMetadata,
        mockDeceasedInfo,
        mockServiceDetails,
        mockOrderOfService,
        survivors
      );

      const grouped = program.groupSurvivorsByRelationship();

      expect(grouped.get('Wife')).toEqual(['Jane Smith']);
      expect(grouped.get('Son')).toEqual(['Michael Smith', 'David Smith']);
      expect(grouped.get('Daughter')).toEqual(['Sarah Johnson']);
    });
  });

  describe('formatSurvivorsText', () => {
    it('should format survivors with proper grammar', () => {
      const survivors: Survivor[] = [
        { name: 'Jane Smith', relationship: 'Wife' },
        { name: 'Michael Smith', relationship: 'Son' },
        { name: 'David Smith', relationship: 'Son' },
        { name: 'Sarah Johnson', relationship: 'Daughter' },
      ];

      const program = ServiceProgramData.create(
        mockMetadata,
        mockDeceasedInfo,
        mockServiceDetails,
        mockOrderOfService,
        survivors
      );

      const formatted = program.formatSurvivorsText();
      expect(formatted).toContain('Wife: Jane Smith');
      expect(formatted).toContain('Sons: Michael Smith, David Smith');
      expect(formatted).toContain('Daughter: Sarah Johnson');
    });

    it('should handle single vs plural relationships', () => {
      const survivors: Survivor[] = [
        { name: 'Jane Smith', relationship: 'Sister' },
        { name: 'Mary Jones', relationship: 'Sister' },
      ];

      const program = ServiceProgramData.create(
        mockMetadata,
        mockDeceasedInfo,
        mockServiceDetails,
        mockOrderOfService,
        survivors
      );

      const formatted = program.formatSurvivorsText();
      expect(formatted).toBe('Sisters: Jane Smith, Mary Jones');
    });

    it('should handle irregular plurals', () => {
      const survivors: Survivor[] = [
        { name: 'Jane Smith', relationship: 'Child' },
        { name: 'John Smith', relationship: 'Child' },
      ];

      const program = ServiceProgramData.create(
        mockMetadata,
        mockDeceasedInfo,
        mockServiceDetails,
        mockOrderOfService,
        survivors
      );

      const formatted = program.formatSurvivorsText();
      expect(formatted).toBe('Children: Jane Smith, John Smith');
    });
  });

  describe('shouldIncludePhoto', () => {
    it('should return true if photo URL exists', () => {
      const program = ServiceProgramData.create(
        mockMetadata,
        mockDeceasedInfo,
        mockServiceDetails,
        mockOrderOfService,
        mockSurvivors
      );

      expect(program.shouldIncludePhoto()).toBe(true);
    });

    it('should return false if no photo URL', () => {
      const deceased = { ...mockDeceasedInfo, photoUrl: undefined };

      const program = ServiceProgramData.create(
        mockMetadata,
        deceased,
        mockServiceDetails,
        mockOrderOfService,
        mockSurvivors
      );

      expect(program.shouldIncludePhoto()).toBe(false);
    });
  });

  describe('getProgramTitle', () => {
    it('should return correct title for funeral', () => {
      const metadata = { ...mockMetadata, programType: 'funeral' as const };

      const program = ServiceProgramData.create(
        metadata,
        mockDeceasedInfo,
        mockServiceDetails,
        mockOrderOfService,
        mockSurvivors
      );

      expect(program.getProgramTitle()).toBe('Funeral Service');
    });

    it('should return correct title for memorial', () => {
      const metadata = { ...mockMetadata, programType: 'memorial' as const };

      const program = ServiceProgramData.create(
        metadata,
        mockDeceasedInfo,
        mockServiceDetails,
        mockOrderOfService,
        mockSurvivors
      );

      expect(program.getProgramTitle()).toBe('Memorial Service');
    });

    it('should return correct title for celebration of life', () => {
      const metadata = { ...mockMetadata, programType: 'celebration_of_life' as const };

      const program = ServiceProgramData.create(
        metadata,
        mockDeceasedInfo,
        mockServiceDetails,
        mockOrderOfService,
        mockSurvivors
      );

      expect(program.getProgramTitle()).toBe('Celebration of Life');
    });
  });
});
