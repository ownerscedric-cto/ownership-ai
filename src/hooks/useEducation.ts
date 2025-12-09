import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================
// Types
// ============================================

export interface VideoCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface EducationVideo {
  id: string;
  title: string;
  description: string | null;
  category: VideoCategory; // Changed from string to VideoCategory relation
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

export interface KnowHow {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string | null;
  tags: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  downloadCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface DetailResponse<T> {
  success: boolean;
  data: T;
}

// ============================================
// Education Videos
// ============================================

export function useEducationVideos(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  return useQuery<ListResponse<EducationVideo>>({
    queryKey: ['educationVideos', params],
    queryFn: async () => {
      const res = await fetch(`/api/education/videos?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch videos');
      return res.json();
    },
  });
}

export function useEducationVideo(id: string) {
  return useQuery<DetailResponse<EducationVideo>>({
    queryKey: ['educationVideo', id],
    queryFn: async () => {
      const res = await fetch(`/api/education/videos/${id}`);
      if (!res.ok) throw new Error('Failed to fetch video');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useIncrementVideoViewCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/education/videos/${id}`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to increment view count');
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['educationVideo', id] });
      queryClient.invalidateQueries({ queryKey: ['educationVideos'] });
    },
  });
}

// ============================================
// KnowHow
// ============================================

export function useKnowHowList(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  return useQuery<ListResponse<KnowHow>>({
    queryKey: ['knowhow', params],
    queryFn: async () => {
      const res = await fetch(`/api/education/knowhow?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch knowhow');
      return res.json();
    },
  });
}

export function useKnowHow(id: string) {
  return useQuery<DetailResponse<KnowHow>>({
    queryKey: ['knowhow', id],
    queryFn: async () => {
      const res = await fetch(`/api/education/knowhow/${id}`);
      if (!res.ok) throw new Error('Failed to fetch knowhow');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useIncrementKnowHowViewCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/education/knowhow/${id}`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to increment view count');
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['knowhow', id] });
      queryClient.invalidateQueries({ queryKey: ['knowhow'] });
    },
  });
}

// ============================================
// Resources
// ============================================

export function useResources(params?: {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.append('type', params.type);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  return useQuery<ListResponse<Resource>>({
    queryKey: ['resources', params],
    queryFn: async () => {
      const res = await fetch(`/api/education/resources?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch resources');
      return res.json();
    },
  });
}

export function useResource(id: string) {
  return useQuery<DetailResponse<Resource>>({
    queryKey: ['resource', id],
    queryFn: async () => {
      const res = await fetch(`/api/education/resources/${id}`);
      if (!res.ok) throw new Error('Failed to fetch resource');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useDownloadResource() {
  return useMutation({
    mutationFn: async (id: string) => {
      // 다운로드 카운트는 서버에서 자동 증가
      window.location.href = `/api/education/resources/${id}/download`;
    },
  });
}
