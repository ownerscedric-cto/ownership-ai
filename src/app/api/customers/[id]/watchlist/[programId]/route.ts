/**
 * @file /api/customers/[id]/watchlist/[programId]/route.ts
 * @description Remove program from customer's watchlist
 * - DELETE: Remove program from watchlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api/response';

/**
 * DELETE /api/customers/[id]/watchlist/[programId]
 * Remove program from customer's watchlist
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; programId: string }> }
) {
  try {
    const { id, programId } = await params;

    // Validate parameters
    if (!id || typeof id !== 'string') {
      return errorResponse('INVALID_CUSTOMER_ID', 'Invalid customer ID', 400);
    }

    if (!programId || typeof programId !== 'string') {
      return errorResponse('INVALID_PROGRAM_ID', 'Invalid program ID', 400);
    }

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

    // Check if in watchlist
    const watchlistItem = await prisma.customerProgram.findUnique({
      where: {
        customerId_programId: {
          customerId: id,
          programId,
        },
      },
    });

    if (!watchlistItem) {
      return errorResponse('NOT_IN_WATCHLIST', 'Program not found in watchlist', 404);
    }

    // Remove from watchlist
    await prisma.customerProgram.delete({
      where: {
        customerId_programId: {
          customerId: id,
          programId,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Removed from watchlist' }, { status: 204 });
  } catch (error) {
    console.error('[DELETE /api/customers/[id]/watchlist/[programId]] Error:', error);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to remove from watchlist', 500);
  }
}
