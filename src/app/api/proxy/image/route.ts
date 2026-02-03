/**
 * @file /api/proxy/image
 * @description 외부 이미지 프록시 API
 *
 * 서울테크노파크 등 Referer 체크로 직접 이미지 로드가 차단되는 사이트의
 * 이미지를 서버 사이드에서 가져와 클라이언트에 전달
 */

import { NextRequest, NextResponse } from 'next/server';

/** 허용된 이미지 호스트 목록 (보안: 임의 URL 프록시 방지) */
const ALLOWED_HOSTS = ['www.seoultp.or.kr'];

/** 호스트별 Referer 매핑 */
const REFERER_MAP: Record<string, string> = {
  'www.seoultp.or.kr': 'https://www.seoultp.or.kr/user/nd19746.do',
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_URL', message: 'url 파라미터가 필요합니다' } },
      { status: 400 }
    );
  }

  // URL 파싱 및 호스트 검증
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_URL', message: '유효하지 않은 URL입니다' } },
      { status: 400 }
    );
  }

  if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN_HOST', message: '허용되지 않은 호스트입니다' } },
      { status: 403 }
    );
  }

  try {
    const referer = REFERER_MAP[parsedUrl.hostname] || `${parsedUrl.origin}/`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'image/*,*/*;q=0.8',
        Referer: referer,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FETCH_FAILED', message: `이미지 로드 실패: ${response.status}` },
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-Proxy-Source': parsedUrl.hostname,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'PROXY_ERROR', message: '이미지 프록시 오류' } },
      { status: 500 }
    );
  }
}
