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
  createdAt: string;
  updatedAt: string;
}
