import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const video = await prisma.educationVideo.create({
    data: {
      title: '정부지원사업 개요 - 테스트 비디오',
      description:
        '정부지원사업의 기본 개념과 종류를 설명하는 교육 비디오입니다.\n\n이 비디오에서 다루는 내용:\n- 정부지원사업이란?\n- 주요 지원사업 유형\n- 신청 절차 개요',
      category: '개요',
      videoUrl: 'https://www.youtube.com/watch?v=nl-qYniT-2U',
      videoType: 'youtube',
      thumbnailUrl: 'https://img.youtube.com/vi/nl-qYniT-2U/maxresdefault.jpg',
      duration: 300,
      tags: ['기초', '개요', '입문'],
    },
  });

  console.log('✅ 테스트 비디오가 등록되었습니다:');
  console.log(JSON.stringify(video, null, 2));
}

main()
  .catch(e => {
    console.error('❌ 에러:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
