/**
 * @file /api/customers/[id]/watchlist/route.ts
 * @description Customer watchlist API endpoints
 * - POST: Add program to watchlist
 * - GET: Get customer's watchlist programs
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();

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
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('preferredKeywords')
      .eq('id', id)
      .single();

    if (customerError || !customer) {
      return errorResponse('CUSTOMER_NOT_FOUND', 'Customer not found', 404);
    }

    // Check if program exists
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, title, dataSource, deadline, targetAudience, targetLocation, keywords')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      return errorResponse('PROGRAM_NOT_FOUND', 'Program not found', 404);
    }

    // Check if already in watchlist (to prevent duplicates)
    const { data: existing } = await supabase
      .from('customer_programs')
      .select('*')
      .eq('customerId', id)
      .eq('programId', programId)
      .single();

    if (existing) {
      return errorResponse('ALREADY_IN_WATCHLIST', 'Program already in watchlist', 409);
    }

    // 1. Add to watchlist
    const { data: watchlistItem, error: insertError } = await supabase
      .from('customer_programs')
      .insert({
        customerId: id,
        programId,
        notes: notes || null,
      })
      .select('*, program:programs(*)')
      .single();

    if (insertError) {
      console.error('[POST /api/customers/[id]/watchlist] Insert error:', insertError);
      return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to add to watchlist', 500);
    }

    // 2. Update customer's preferred keywords
    const updatedKeywords = Array.from(
      new Set([
        ...(customer.preferredKeywords || []),
        ...(program.keywords || []),
      ])
    ).slice(0, 100);

    const { error: updateError } = await supabase
      .from('customers')
      .update({ preferredKeywords: updatedKeywords })
      .eq('id', id);

    if (updateError) {
      console.error('[POST /api/customers/[id]/watchlist] Update keywords error:', updateError);
      // Continue even if keyword update fails
    }

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
    const supabase = await createClient();

    // Validate id format
    if (!id || typeof id !== 'string') {
      return errorResponse('INVALID_CUSTOMER_ID', 'Invalid customer ID', 400);
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

    // Get watchlist with program details
    const { data: watchlist, error: watchlistError } = await supabase
      .from('customer_programs')
      .select(`
        *,
        program:programs (
          id,
          dataSource,
          title,
          description,
          category,
          targetAudience,
          targetLocation,
          keywords,
          budgetRange,
          deadline,
          sourceUrl,
          registeredAt,
          startDate,
          endDate
        )
      `)
      .eq('customerId', id)
      .order('addedAt', { ascending: false });

    if (watchlistError) {
      console.error('[GET /api/customers/[id]/watchlist] Error:', watchlistError);
      return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch watchlist', 500);
    }

    return successResponse({
      total: watchlist?.length || 0,
      items: watchlist || [],
    });
  } catch (error) {
    console.error('[GET /api/customers/[id]/watchlist] Error:', error);
    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to fetch watchlist', 500);
  }
}
