/**
 * @file education.ts
 * @description Education 관련 타입 정의
 * Supabase Database Schema Types
 */

/**
 * EducationVideo 타입 (Supabase Database)
 */
export interface EducationVideo {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  videoUrl: string;
  videoType: string;
  thumbnailUrl: string | null;
  duration: number | null;
  viewCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * VideoCategory 타입 (Supabase Database)
 */
export interface VideoCategory {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    videos: number;
  };
}

/**
 * KnowHowPost 타입 (Supabase Database)
 */
export interface KnowHowPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  userId: string;
  categoryId: string;
  viewCount: number;
  isPinned: boolean;
  isAnnouncement: boolean;
  isEvent: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * KnowHowCategory 타입 (Supabase Database)
 */
export interface KnowHowCategory {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
    archives: number;
  };
}

/**
 * KnowHowComment 타입 (Supabase Database)
 */
export interface KnowHowComment {
  id: string;
  content: string;
  authorName: string;
  userId: string;
  postId: string;
  parentId: string | null; // 대댓글인 경우 부모 댓글 ID
  createdAt: string;
  updatedAt: string;
  replies?: KnowHowComment[]; // 대댓글 목록 (클라이언트에서 구성)
}

/**
 * VideoComment 타입 (Supabase Database)
 * 교육 비디오 댓글
 */
export interface VideoComment {
  id: string;
  content: string;
  authorName: string;
  userId: string;
  videoId: string;
  parentId: string | null; // 대댓글인 경우 부모 댓글 ID
  createdAt: string;
  updatedAt: string;
  replies?: VideoComment[]; // 대댓글 목록 (클라이언트에서 구성)
}
