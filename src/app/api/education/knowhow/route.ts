import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createKnowHowSchema, knowHowFilterSchema } from '@/lib/validations/education';
import { z } from 'zod';

/**
 * GET /api/education/knowhow - 노하우 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const filters = knowHowFilterSchema.parse(searchParams);

    const { page, limit, sortBy, sortOrder, category, search } = filters;
    const skip = (page - 1) * limit;

    // WHERE 조건
    const where: {
      category?: string;
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        content?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 데이터 조회
    const [knowhows, total] = await Promise.all([
      prisma.knowHow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.knowHow.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: knowhows,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/education/knowhow error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch knowhow list',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/education/knowhow - 노하우 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createKnowHowSchema.parse(body);

    const knowhow = await prisma.knowHow.create({
      data: validated,
    });

    return NextResponse.json(
      {
        success: true,
        data: knowhow,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/education/knowhow error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create knowhow',
        },
      },
      { status: 500 }
    );
  }
}
