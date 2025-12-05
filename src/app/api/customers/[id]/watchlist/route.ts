/**
 * @file /api/customers/[id]/watchlist/route.ts
 * @description Customer watchlist API endpoints
 * - POST: Add program to watchlist
 * - GET: Get customer's watchlist programs
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * Zod schema for POST request body
 */
const addToWatchlistSchema = z.object({
  programId: z.string().uuid('Invalid program ID format'),
  notes: z.string().optional(),
});

/**
 * POST /api/customers/[id]/watchlist
 * Add program to customer's watchlist
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Validate id format
    if (!id || typeof id !== 'string') {
      return errorResponse('INVALID_CUSTOMER_ID', 'Invalid customer ID', 400);
    }

    // Parse request body
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = addToWatchlistSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid request data',
        validationResult.error.issues,
        400
      );
    }

    const { programId, notes } = validationResult.data;

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return errorResponse('CUSTOMER_NOT_FOUND', 'Customer not found', 404);
    }

    // Check if program exists
    const program = await prisma.program.findUnique({
      where: { id: programId },
    });

    if (!program) {
      return errorResponse('PROGRAM_NOT_FOUND', 'Program not found', 404);
    }

    // Check if already in watchlist (to prevent duplicates)
    const existing = await prisma.customerProgram.findUnique({
      where: {
        customerId_programId: {
          customerId: id,
          programId,
        },
      },
    });

    if (existing) {
      return errorResponse('ALREADY_IN_WATCHLIST', 'Program already in watchlist', 409);
    }

    // Add to watchlist and update preferred keywords
    const [watchlistItem] = await prisma.$transaction([
      // 1. Add to watchlist
      prisma.customerProgram.create({
        data: {
          customerId: id,
          programId,
          notes: notes || null,
        },
        include: {
          program: {
            select: {
              id: true,
              title: true,
              dataSource: true,
              deadline: true,
              targetAudience: true,
              targetLocation: true,
            },
          },
        },
      }),
      // 2. Update customer's preferred keywords
      prisma.customer.update({
        where: { id },
        data: {
          preferredKeywords: {
            set: Array.from(
              new Set([
                ...customer.preferredKeywords,
                ...program.keywords, // Add program's keywords to preferred keywords
              ])
            ).slice(0, 100), // Limit to 100 keywords to prevent excessive growth
          },
        },
      }),
    ]);

    return successResponse(watchlistItem, undefined, 201);
  } catch (error) {
    console.error('[POST /api/customers/[id]/watchlist] Error:', error);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to add to watchlist', 500);
  }
}

/**
 * GET /api/customers/[id]/watchlist
 * Get all programs in customer's watchlist
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Validate id format
    if (!id || typeof id !== 'string') {
      return errorResponse('INVALID_CUSTOMER_ID', 'Invalid customer ID', 400);
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return errorResponse('CUSTOMER_NOT_FOUND', 'Customer not found', 404);
    }

    // Get watchlist with program details
    const watchlist = await prisma.customerProgram.findMany({
      where: { customerId: id },
      orderBy: { addedAt: 'desc' },
      include: {
        program: {
          select: {
            id: true,
            dataSource: true,
            title: true,
            description: true,
            category: true,
            targetAudience: true,
            targetLocation: true,
            keywords: true,
            budgetRange: true,
            deadline: true,
            sourceUrl: true,
            registeredAt: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    return successResponse({
      total: watchlist.length,
      items: watchlist,
    });
  } catch (error) {
    console.error('[GET /api/customers/[id]/watchlist] Error:', error);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch watchlist', 500);
  }
}
