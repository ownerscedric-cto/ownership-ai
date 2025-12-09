import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createResourceSchema, resourceFilterSchema } from '@/lib/validations/education';
import { z } from 'zod';

/**
 * GET /api/education/resources - 자료 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const filters = resourceFilterSchema.parse(searchParams);

    const { page, limit, sortBy, sortOrder, type, search } = filters;
    const skip = (page - 1) * limit;

    // WHERE 조건
    const where: {
      type?: string;
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 데이터 조회
    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.resource.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: resources,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/education/resources error:', error);

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
          message: 'Failed to fetch resources list',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/education/resources - 자료 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createResourceSchema.parse(body);

    const resource = await prisma.resource.create({
      data: validated,
    });

    return NextResponse.json(
      {
        success: true,
        data: resource,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/education/resources error:', error);

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
          message: 'Failed to create resource',
        },
      },
      { status: 500 }
    );
  }
}
