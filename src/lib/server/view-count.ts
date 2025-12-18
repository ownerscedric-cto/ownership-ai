/**
 * 서버 사이드 조회수 관리 유틸리티
 * - 쿠키 기반 중복 방지 (24시간 TTL)
 * - Supabase를 통한 조회수 증가
 */

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/**
 * 조회수 체크 결과
 */
export interface ViewCountResult {
  viewCount: number;
  incremented: boolean;
}

/**
 * 쿠키에서 조회한 콘텐츠 ID 목록 가져오기
 */
async function getViewedContentIds(cookieName: string): Promise<string[]> {
  const cookieStore = await cookies();
  const viewedContent = cookieStore.get(cookieName);

  if (!viewedContent?.value) return [];

  try {
    return JSON.parse(viewedContent.value);
  } catch {
    return [];
  }
}

/**
 * 쿠키에 조회한 콘텐츠 ID 추가
 */
async function addViewedContentId(cookieName: string, contentId: string): Promise<void> {
  const cookieStore = await cookies();
  const viewedIds = await getViewedContentIds(cookieName);

  const newViewedIds = [...viewedIds, contentId];

  cookieStore.set(cookieName, JSON.stringify(newViewedIds), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

/**
 * 교육 비디오 조회수 증가
 * - 쿠키 기반 중복 방지 (24시간)
 */
export async function incrementEducationVideoViewCount(videoId: string): Promise<ViewCountResult> {
  const cookieName = 'viewed_education_videos';
  const viewedIds = await getViewedContentIds(cookieName);
  const supabase = await createClient();

  // 이미 조회한 비디오인 경우
  if (viewedIds.includes(videoId)) {
    const { data: video } = await supabase
      .from('education_videos')
      .select('viewCount')
      .eq('id', videoId)
      .single();

    return {
      viewCount: video?.viewCount ?? 0,
      incremented: false,
    };
  }

  // 현재 조회수 가져오기
  const { data: currentVideo } = await supabase
    .from('education_videos')
    .select('viewCount')
    .eq('id', videoId)
    .single();

  // 조회수 증가
  const { data: updatedVideo } = await supabase
    .from('education_videos')
    .update({ viewCount: (currentVideo?.viewCount ?? 0) + 1 })
    .eq('id', videoId)
    .select('viewCount')
    .single();

  // 쿠키에 추가
  await addViewedContentId(cookieName, videoId);

  return {
    viewCount: updatedVideo?.viewCount ?? 0,
    incremented: true,
  };
}

/**
 * 노하우 게시글 조회수 증가
 * - 쿠키 기반 중복 방지 (24시간)
 */
export async function incrementKnowHowPostViewCount(postId: string): Promise<ViewCountResult> {
  const cookieName = 'viewed_knowhow_posts';
  const viewedIds = await getViewedContentIds(cookieName);
  const supabase = await createClient();

  // 이미 조회한 게시글인 경우
  if (viewedIds.includes(postId)) {
    const { data: post } = await supabase
      .from('knowhow_posts')
      .select('viewCount')
      .eq('id', postId)
      .single();

    return {
      viewCount: post?.viewCount ?? 0,
      incremented: false,
    };
  }

  // 현재 조회수 가져오기
  const { data: currentPost } = await supabase
    .from('knowhow_posts')
    .select('viewCount')
    .eq('id', postId)
    .single();

  // 조회수 증가
  const { data: updatedPost } = await supabase
    .from('knowhow_posts')
    .update({ viewCount: (currentPost?.viewCount ?? 0) + 1 })
    .eq('id', postId)
    .select('viewCount')
    .single();

  // 쿠키에 추가
  await addViewedContentId(cookieName, postId);

  return {
    viewCount: updatedPost?.viewCount ?? 0,
    incremented: true,
  };
}

/**
 * 노하우 아카이브 조회수 증가 (기존 KnowHow 테이블)
 * - 쿠키 기반 중복 방지 (24시간)
 */
export async function incrementKnowHowViewCount(knowhowId: string): Promise<ViewCountResult> {
  const cookieName = 'viewed_knowhow';
  const viewedIds = await getViewedContentIds(cookieName);
  const supabase = await createClient();

  // 이미 조회한 노하우인 경우
  if (viewedIds.includes(knowhowId)) {
    const { data: knowhow } = await supabase
      .from('knowhow')
      .select('viewCount')
      .eq('id', knowhowId)
      .single();

    return {
      viewCount: knowhow?.viewCount ?? 0,
      incremented: false,
    };
  }

  // 현재 조회수 가져오기
  const { data: currentKnowHow } = await supabase
    .from('knowhow')
    .select('viewCount')
    .eq('id', knowhowId)
    .single();

  // 조회수 증가
  const { data: updatedKnowHow } = await supabase
    .from('knowhow')
    .update({ viewCount: (currentKnowHow?.viewCount ?? 0) + 1 })
    .eq('id', knowhowId)
    .select('viewCount')
    .single();

  // 쿠키에 추가
  await addViewedContentId(cookieName, knowhowId);

  return {
    viewCount: updatedKnowHow?.viewCount ?? 0,
    incremented: true,
  };
}
