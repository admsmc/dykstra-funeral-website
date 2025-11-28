import { Effect, Data } from 'effect';
import { ValidationError } from '../errors/domain-errors';

/**
 * Referral Source ID branded type
 */
export type ReferralSourceId = string & { readonly _brand: 'ReferralSourceId' };

/**
 * Referral source type
 */
export type ReferralSourceType = 
  | 'funeral_home'   // Other funeral home
  | 'hospice'        // Hospice organization
  | 'hospital'       // Hospital
  | 'clergy'         // Religious organization
  | 'attorney'       // Attorney/law firm
  | 'family'         // Family referral
  | 'online'         // Online source
  | 'other';

/**
 * Referral Source entity
 * Tracks where leads come from
 * SCD Type 2: Track changes to referral source information and performance
 */
export class ReferralSource extends Data.Class<{
  readonly id: ReferralSourceId;
  readonly businessKey: string;
  readonly version: number;
  readonly funeralHomeId: string;
  readonly name: string;
  readonly type: ReferralSourceType;
  readonly contactPerson: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly address: string | null;
  readonly notes: string | null;
  readonly isActive: boolean;
  readonly totalReferrals: number;     // Total leads referred
  readonly convertedReferrals: number; // Converted to cases
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string;
}> {
  /**
   * Create a new Referral Source
   */
  static create(params: {
    id: string;
    businessKey: string;
    funeralHomeId: string;
    name: string;
    type: ReferralSourceType;
    createdBy: string;
  }): Effect.Effect<ReferralSource, ValidationError> {
    return Effect.gen(function* () {
      const trimmedName = params.name.trim();
      
      if (!trimmedName) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Name is required', 
            field: 'name' 
          })
        );
      }

      if (trimmedName.length > 200) {
        return yield* Effect.fail(
          new ValidationError({ 
            message: 'Name too long (max 200 characters)', 
            field: 'name' 
          })
        );
      }

      const now = new Date();

      return new ReferralSource({
        id: params.id as ReferralSourceId,
        businessKey: params.businessKey,
        version: 1,
        funeralHomeId: params.funeralHomeId,
        name: trimmedName,
        type: params.type,
        contactPerson: null,
        email: null,
        phone: null,
        address: null,
        notes: null,
        isActive: true,
        totalReferrals: 0,
        convertedReferrals: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: params.createdBy,
      });
    });
  }

  /**
   * Update contact information
   */
  updateContactInfo(params: {
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  }): ReferralSource {
    return new ReferralSource({
      ...this,
      version: this.version + 1,
      contactPerson: params.contactPerson !== undefined ? params.contactPerson : this.contactPerson,
      email: params.email !== undefined ? params.email : this.email,
      phone: params.phone !== undefined ? params.phone : this.phone,
      address: params.address !== undefined ? params.address : this.address,
      updatedAt: new Date(),
    });
  }

  /**
   * Update notes
   */
  updateNotes(notes: string): Effect.Effect<ReferralSource, ValidationError> {
    if (notes.length > 2000) {
      return Effect.fail(
        new ValidationError({ 
          message: 'Notes too long (max 2000 characters)', 
          field: 'notes' 
        })
      );
    }

    return Effect.succeed(
      new ReferralSource({
        ...this,
        version: this.version + 1,
        notes: notes.trim() || null,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Record a new referral
   */
  recordReferral(converted: boolean = false): ReferralSource {
    return new ReferralSource({
      ...this,
      version: this.version + 1,
      totalReferrals: this.totalReferrals + 1,
      convertedReferrals: converted ? this.convertedReferrals + 1 : this.convertedReferrals,
      updatedAt: new Date(),
    });
  }

  /**
   * Record a referral conversion (lead became a case)
   */
  recordConversion(): ReferralSource {
    if (this.convertedReferrals >= this.totalReferrals) {
      // Already at max conversions, just increment both
      return new ReferralSource({
        ...this,
        version: this.version + 1,
        totalReferrals: this.totalReferrals + 1,
        convertedReferrals: this.convertedReferrals + 1,
        updatedAt: new Date(),
      });
    }

    return new ReferralSource({
      ...this,
      version: this.version + 1,
      convertedReferrals: this.convertedReferrals + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Deactivate source
   */
  deactivate(): ReferralSource {
    return new ReferralSource({
      ...this,
      version: this.version + 1,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Reactivate source
   */
  reactivate(): ReferralSource {
    return new ReferralSource({
      ...this,
      version: this.version + 1,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Calculate conversion rate
   */
  get conversionRate(): number {
    if (this.totalReferrals === 0) return 0;
    return Math.round((this.convertedReferrals / this.totalReferrals) * 10000) / 100;
  }

  /**
   * Check if this is a high-performing source (>50% conversion rate with 10+ referrals)
   */
  get isHighPerformer(): boolean {
    return this.totalReferrals >= 10 && this.conversionRate >= 50;
  }

  /**
   * Check if this is an underperforming source (<20% conversion rate with 20+ referrals)
   */
  get isUnderPerformer(): boolean {
    return this.totalReferrals >= 20 && this.conversionRate < 20;
  }

  /**
   * Get quality score (0-100) based on conversion rate and volume
   */
  get qualityScore(): number {
    if (this.totalReferrals === 0) return 0;
    
    // Base score on conversion rate
    let score = this.conversionRate;
    
    // Bonus for volume (up to 20 points)
    const volumeBonus = Math.min(this.totalReferrals / 5, 20);
    score = Math.min(score + volumeBonus, 100);
    
    return Math.round(score);
  }

  /**
   * Check if source has contact information
   */
  get hasContactInfo(): boolean {
    return !!(this.email || this.phone || this.contactPerson);
  }
}
