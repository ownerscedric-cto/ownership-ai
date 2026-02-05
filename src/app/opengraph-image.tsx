import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'Ownership AI - 컨설턴트 관리 플랫폼';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(135deg, #0052CC 0%, #1a365d 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '60px',
        }}
      >
        {/* 로고 영역 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '24px',
            }}
          >
            <span style={{ fontSize: '48px', color: '#0052CC' }}>O</span>
          </div>
          <span
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
            }}
          >
            Ownership AI
          </span>
        </div>

        {/* 메인 타이틀 */}
        <div
          style={{
            fontSize: '36px',
            fontWeight: '500',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          1인 컨설턴트를 위한
        </div>

        <div
          style={{
            fontSize: '44px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          정부지원사업 AI 매칭 플랫폼
        </div>

        {/* 특징 배지들 */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
          }}
        >
          {['고객 관리', 'AI 매칭', '실시간 공고'].map(feature => (
            <div
              key={feature}
              style={{
                padding: '12px 28px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '30px',
                fontSize: '24px',
                fontWeight: '500',
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
