import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response';

// GET /api/education/resources/[id] - 자료 상세 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 자료 조회
    const resource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      return errorResponse(ErrorCode.NOT_FOUND, '자료를 찾을 수 없습니다', null, 404);
    }

    return successResponse(resource);
  } catch (error) {
    console.error('Resource detail error:', error);
    return errorResponse(ErrorCode.INTERNAL_ERROR, '자료 조회 중 오류가 발생했습니다', null, 500);
  }
}
