import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { invitationSchema } from '@/lib/validations/invitation';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();

    // 입력 검증
    const validatedData = invitationSchema.parse(body);

    // 이미 등록된 이메일인지 확인
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('email')
      .eq('email', validatedData.email)
      .single();

    if (existingInvitation) {
      return NextResponse.json({ error: '이미 신청된 이메일 주소입니다' }, { status: 400 });
    }

    // 데이터베이스에 저장
    const { data: invitation, error: insertError } = await supabase
      .from('invitations')
      .insert({
        id: uuidv4(),
        email: validatedData.email,
        name: validatedData.name,
        companyName: validatedData.companyName || null,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ error: '초대 신청 중 오류가 발생했습니다' }, { status: 500 });
    }

    // 성공 응답
    return NextResponse.json(
      {
        message: '초대 신청이 완료되었습니다! 검토 후 연락드리겠습니다.',
        data: {
          id: invitation.id,
          email: invitation.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Zod 검증 오류
    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'ZodError' &&
      'errors' in error &&
      Array.isArray(error.errors)
    ) {
      const firstError = error.errors[0] as { message: string };
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    // 데이터베이스 오류
    console.error('Invitation API Error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
