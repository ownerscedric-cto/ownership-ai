import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Zod 스키마 정의
const invitationSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  name: z.string().min(1, '이름을 입력해주세요'),
  companyName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();

    // 입력 검증
    const validatedData = invitationSchema.parse(body);

    // 이미 등록된 이메일인지 확인
    const existingInvitation = await prisma.invitation.findUnique({
      where: { email: validatedData.email },
    });

    if (existingInvitation) {
      return NextResponse.json({ error: '이미 신청된 이메일 주소입니다' }, { status: 400 });
    }

    // 데이터베이스에 저장
    const invitation = await prisma.invitation.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        companyName: validatedData.companyName || null,
      },
    });

    // 성공 응답
    return NextResponse.json(
      {
        message: '초대 신청이 완료되었습니다',
        data: {
          id: invitation.id,
          email: invitation.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Zod 검증 오류
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    // 데이터베이스 오류
    console.error('Invitation API Error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
