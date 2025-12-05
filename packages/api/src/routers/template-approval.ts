/**
 * Template Approval Workflow Router
 * 
 * Handles multi-stage approval processes for memorial templates.
 * 
 * Features:
 * - Create approval workflows with multiple stages
 * - Submit reviews at each stage
 * - Auto-advance to next stage when quorum met
 * - Handle rejections and resubmissions
 * - Track approval history and audit trail
 * 
 * Workflow Stages Example:
 * 1. Designer Review (1 approval required)
 * 2. Manager Approval (1 approval required)
 * 3. Director Final Approval (1 approval required)
 * 
 * Stage progression:
 * - All stages start as 'pending'
 * - First stage automatically moves to 'in_review'
 * - When required approvals met, stage becomes 'approved'
 * - Next stage automatically moves to 'in_review'
 * - If any rejection, entire workflow becomes 'rejected'
 * - When final stage approved, workflow becomes 'approved'
 */

import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '@dykstra/infrastructure';

export const templateApprovalRouter = router({
  /**
   * Create Approval Workflow
   * 
   * Initialize a new multi-stage approval workflow for a template.
   * Creates workflow with stages and assigns reviewers.
   */
  createWorkflow: publicProcedure
    .input(
      z.object({
        templateBusinessKey: z.string(),
        templateVersion: z.number(),
        submittedBy: z.string(),
        workflowName: z.string().optional(),
        stages: z.array(
          z.object({
            stageName: z.string(),
            stageOrder: z.number(),
            requiredReviewers: z.number().default(1),
            reviewers: z.array(z.string()), // User IDs
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      // Create workflow with stages and initial reviewers
      const workflow = await prisma.templateApprovalWorkflow.create({
        data: {
          templateBusinessKey: input.templateBusinessKey,
          templateVersion: input.templateVersion,
          submittedBy: input.submittedBy,
          workflowName: input.workflowName || 'Standard Review',
          status: 'in_progress',
          stages: {
            create: input.stages.map((stage) => ({
              stageName: stage.stageName,
              stageOrder: stage.stageOrder,
              requiredReviewers: stage.requiredReviewers,
              status: stage.stageOrder === 1 ? 'in_review' : 'pending',
              reviews: {
                create: stage.reviewers.map((reviewerId) => ({
                  reviewerId,
                  decision: null,
                })),
              },
            })),
          },
        },
        include: {
          stages: {
            include: {
              reviews: true,
            },
            orderBy: {
              stageOrder: 'asc',
            },
          },
        },
      });

      return workflow;
    }),

  /**
   * Submit Review
   * 
   * Record a reviewer's decision at a specific stage.
   * Auto-advances workflow to next stage if quorum met.
   */
  submitReview: publicProcedure
    .input(
      z.object({
        reviewId: z.string(),
        decision: z.enum(['approved', 'rejected', 'request_changes']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Update the review
      const review = await prisma.templateApprovalReview.update({
        where: { id: input.reviewId },
        data: {
          decision: input.decision,
          notes: input.notes,
          reviewedAt: new Date(),
        },
        include: {
          stage: {
            include: {
              reviews: true,
              workflow: {
                include: {
                  stages: {
                    include: {
                      reviews: true,
                    },
                    orderBy: {
                      stageOrder: 'asc',
                    },
                  },
                },
              },
            },
          },
        },
      });

      const stage = review.stage;
      const workflow = stage.workflow;

      // If rejection, mark stage and workflow as rejected
      if (input.decision === 'rejected') {
        await prisma.templateApprovalStage.update({
          where: { id: stage.id },
          data: { status: 'rejected' },
        });

        await prisma.templateApprovalWorkflow.update({
          where: { id: workflow.id },
          data: {
            status: 'rejected',
            completedAt: new Date(),
          },
        });

        return { workflow, action: 'rejected' as const };
      }

      // Count approvals for this stage
      const approvals = stage.reviews.filter((r) => r.decision === 'approved').length;

      // Check if stage quorum met
      if (approvals >= stage.requiredReviewers) {
        // Mark current stage as approved
        await prisma.templateApprovalStage.update({
          where: { id: stage.id },
          data: { status: 'approved' },
        });

        // Find next stage
        const nextStage = workflow.stages.find(
          (s) => s.stageOrder === stage.stageOrder + 1
        );

        if (nextStage) {
          // Move to next stage
          await prisma.templateApprovalStage.update({
            where: { id: nextStage.id },
            data: { status: 'in_review' },
          });

          return { workflow, action: 'advanced_to_next_stage' as const };
        } else {
          // Final stage approved - complete workflow
          await prisma.templateApprovalWorkflow.update({
            where: { id: workflow.id },
            data: {
              status: 'approved',
              completedAt: new Date(),
            },
          });

          return { workflow, action: 'workflow_approved' as const };
        }
      }

      // Not enough approvals yet
      return { workflow, action: 'review_recorded' as const };
    }),

  /**
   * Get Workflow Details
   * 
   * Fetch complete workflow with all stages and reviews.
   */
  getWorkflow: publicProcedure
    .input(
      z.object({
        workflowId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const workflow = await prisma.templateApprovalWorkflow.findUnique({
        where: { id: input.workflowId },
        include: {
          stages: {
            include: {
              reviews: true,
            },
            orderBy: {
              stageOrder: 'asc',
            },
          },
        },
      });

      return workflow;
    }),

  /**
   * List Active Workflows
   * 
   * Get all workflows currently in progress.
   */
  listActiveWorkflows: publicProcedure
    .input(
      z.object({
        reviewerId: z.string().optional(), // Filter to workflows where user is a reviewer
      })
    )
    .query(async ({ input }) => {
      try {
        const workflows = await prisma.templateApprovalWorkflow.findMany({
        where: {
          status: 'in_progress',
          ...(input.reviewerId && {
            stages: {
              some: {
                status: 'in_review',
                reviews: {
                  some: {
                    reviewerId: input.reviewerId,
                    decision: null,
                  },
                },
              },
            },
          }),
        },
        include: {
          stages: {
            include: {
              reviews: true,
            },
            orderBy: {
              stageOrder: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

        return workflows;
      } catch (error) {
        return [];
      }
    }),

  /**
   * Get Pending Reviews for User
   * 
   * Fetch all reviews awaiting action from a specific user.
   */
  getPendingReviews: publicProcedure
    .input(
      z.object({
        reviewerId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const reviews = await prisma.templateApprovalReview.findMany({
        where: {
          reviewerId: input.reviewerId,
          decision: null,
          stage: {
            status: 'in_review',
          },
        },
        include: {
          stage: {
            include: {
              workflow: true,
              reviews: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

        return reviews;
      } catch (error) {
        return [];
      }
    }),

  /**
   * Cancel Workflow
   * 
   * Cancel an in-progress workflow (e.g., template was withdrawn).
   */
  cancelWorkflow: publicProcedure
    .input(
      z.object({
        workflowId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const workflow = await prisma.templateApprovalWorkflow.update({
        where: { id: input.workflowId },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
        },
      });

      return workflow;
    }),
});
