import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@dykstra/infrastructure/prisma/client';
import { auth, clerkClient } from '@clerk/nextjs/server';

/**
 * Magic Link Acceptance Handler
 * 
 * Public route to process invitation magic links
 * - Validates token and expiration
 * - Creates/links Clerk user account
 * - Creates CaseMember relationship
 * - Updates invitation status to ACCEPTED (SCD2)
 * - Redirects to family portal
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  try {
    // Find invitation by token (current version only)
    const invitation = await prisma.familyInvitation.findFirst({
      where: {
        token,
        isCurrent: true,
      },
      include: {
        case: {
          include: {
            funeralHome: true,
          },
        },
      },
    });

    // Invalid token
    if (!invitation) {
      return NextResponse.redirect(
        new URL('/error?reason=invalid_invitation', request.url)
      );
    }

    // Check status
    if (invitation.status === 'ACCEPTED') {
      // Already accepted - redirect to portal
      return NextResponse.redirect(
        new URL(`/portal/cases/${invitation.caseId}`, request.url)
      );
    }

    if (invitation.status === 'REVOKED') {
      return NextResponse.redirect(
        new URL('/error?reason=invitation_revoked', request.url)
      );
    }

    // Check expiration
    const now = new Date();
    if (invitation.expiresAt < now) {
      // Mark as expired if not already
      if (invitation.status === 'PENDING') {
        await prisma.$transaction(async (tx) => {
          await tx.familyInvitation.update({
            where: { id: invitation.id },
            data: {
              isCurrent: false,
              validTo: new Date(),
            },
          });

          await tx.familyInvitation.create({
            data: {
              businessKey: invitation.businessKey,
              version: invitation.version + 1,
              caseId: invitation.caseId,
              email: invitation.email,
              name: invitation.name,
              phone: invitation.phone,
              relationship: invitation.relationship,
              role: invitation.role,
              permissions: invitation.permissions,
              status: 'EXPIRED',
              token: invitation.token,
              expiresAt: invitation.expiresAt,
              sentBy: invitation.sentBy,
              createdAt: invitation.createdAt,
            },
          });
        });
      }

      return NextResponse.redirect(
        new URL('/error?reason=invitation_expired', request.url)
      );
    }

    // Get current user session (if logged in)
    const { userId: clerkUserId } = auth();

    let userId: string;
    let isNewUser = false;

    if (clerkUserId) {
      // User is already logged in
      // Find or create user record in our database
      let user = await prisma.user.findFirst({
        where: {
          email: invitation.email,
        },
      });

      if (!user) {
        // Create user record linked to existing Clerk account
        user = await prisma.user.create({
          data: {
            email: invitation.email,
            name: invitation.name,
            phone: invitation.phone,
            role: invitation.role === 'PRIMARY_CONTACT' ? 'FAMILY_PRIMARY' : 'FAMILY_MEMBER',
            funeralHomeId: invitation.case.funeralHomeId,
          },
        });
        isNewUser = true;
      }

      userId = user.id;
    } else {
      // User is not logged in - need to create Clerk account
      // For now, redirect to sign-up with email pre-filled
      // In production, this would use Clerk's magic link or create account automatically
      const signUpUrl = new URL('/sign-up', request.url);
      signUpUrl.searchParams.set('email', invitation.email);
      signUpUrl.searchParams.set('name', invitation.name);
      signUpUrl.searchParams.set('invitation_token', token);
      
      return NextResponse.redirect(signUpUrl);
    }

    // Check if user is already a member of this case
    const existingMember = await prisma.caseMember.findFirst({
      where: {
        caseId: invitation.caseId,
        userId,
      },
    });

    if (!existingMember) {
      // Create case membership
      await prisma.caseMember.create({
        data: {
          caseId: invitation.caseId,
          userId,
          role: invitation.role,
          permissions: invitation.permissions as any,
          invitedAt: invitation.createdAt,
          acceptedAt: new Date(),
        },
      });
    }

    // Update invitation status to ACCEPTED (SCD2)
    await prisma.$transaction(async (tx) => {
      // Close current version
      await tx.familyInvitation.update({
        where: { id: invitation.id },
        data: {
          isCurrent: false,
          validTo: new Date(),
        },
      });

      // Create new version with ACCEPTED status
      await tx.familyInvitation.create({
        data: {
          businessKey: invitation.businessKey,
          version: invitation.version + 1,
          caseId: invitation.caseId,
          email: invitation.email,
          name: invitation.name,
          phone: invitation.phone,
          relationship: invitation.relationship,
          role: invitation.role,
          permissions: invitation.permissions,
          status: 'ACCEPTED',
          token: invitation.token,
          expiresAt: invitation.expiresAt,
          acceptedAt: new Date(),
          sentBy: invitation.sentBy,
          createdAt: invitation.createdAt,
        },
      });
    });

    // Redirect to family portal case page
    const successMessage = isNewUser ? 'welcome' : 'invitation_accepted';
    return NextResponse.redirect(
      new URL(`/portal/cases/${invitation.caseId}?message=${successMessage}`, request.url)
    );
  } catch (error) {
    console.error('[Invitation] Error processing magic link:', error);
    return NextResponse.redirect(
      new URL('/error?reason=server_error', request.url)
    );
  }
}
