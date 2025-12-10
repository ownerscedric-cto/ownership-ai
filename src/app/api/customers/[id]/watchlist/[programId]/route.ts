/**
 * @file /api/customers/[id]/watchlist/[programId]/route.ts
 * @description Remove program from customer's watchlist
 * - DELETE: Remove program from watchlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();

    // Validate parameters
    if (!id || typeof id !== 'string') {
      return errorResponse('INVALID_CUSTOMER_ID', 'Invalid customer ID', 400);
    }

    if (!programId || typeof programId !== 'string') {
      return errorResponse('INVALID_PROGRAM_ID', 'Invalid program ID', 400);
    }

    // Check if customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', id)
      .single();

    if (customerError || !customer) {
      return errorResponse('CUSTOMER_NOT_FOUND', 'Customer not found', 404);
    }

    // Check if program exists
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      return errorResponse('PROGRAM_NOT_FOUND', 'Program not found', 404);
    }

    // Check if in watchlist
    const { data: watchlistItem } = await supabase
      .from('customer_programs')
      .select('*')
      .eq('customerId', id)
      .eq('programId', programId)
      .single();

    if (!watchlistItem) {
      return errorResponse('NOT_IN_WATCHLIST', 'Program not found in watchlist', 404);
    }

    // Remove from watchlist
    const { error: deleteError } = await supabase
      .from('customer_programs')
      .delete()
      .eq('customerId', id)
      .eq('programId', programId);

    if (deleteError) {
      console.error('[DELETE /api/customers/[id]/watchlist/[programId]] Delete error:', deleteError);
      return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to remove from watchlist', 500);
    }

    return NextResponse.json({ success: true, message: 'Removed from watchlist' }, { status: 204 });
  } catch (error) {
    console.error('[DELETE /api/customers/[id]/watchlist/[programId]] Error:', error);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to remove from watchlist', 500);
  }
}
