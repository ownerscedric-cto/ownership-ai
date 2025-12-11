'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface KnowHowCategory {
  id: string;
  name: string;
  description: string | null;
}

export default function AdminKnowHowNewPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isEvent, setIsEvent] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // 공지사항이나 이벤트가 체크되면 자동으로 상단 고정
  const effectiveIsPinned = isAnnouncement || isEvent || isPinned;
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>([]);

  // 카테고리 목록 조회
  const { data: categories } = useQuery<KnowHowCategory[]>({
    queryKey: ['knowhow-categories'],
    queryFn: async () => {
      const res = await fetch('/api/education/knowhow/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      return data.data;
    },
  });

  // 이미지 업로드
  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Image upload failed');
    }

    const data = await res.json();
    const imageUrl = data.data.url;

    // 업로드된 이미지 URL 저장
    setUploadedImages(prev => [...prev, imageUrl]);

    return imageUrl;
  };

  // 파일 첨부
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'file');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('File upload failed');
      }

      const data = await res.json();
      setUploadedFiles(prev => [...prev, { url: data.data.url, name: data.data.fileName }]);

      toast.success('파일 업로드 성공', {
        description: `${data.data.fileName}이(가) 업로드되었습니다.`,
      });
    } catch {
      toast.error('파일 업로드 실패', {
        description: '파일 업로드 중 오류가 발생했습니다.',
      });
    }
  };

  // 파일 제거
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 게시글 생성
  const createPostMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/education/knowhow/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          categoryId,
          imageUrls: uploadedImages,
          fileUrls: uploadedFiles.map(f => f.url),
          fileNames: uploadedFiles.map(f => f.name),
          isAnnouncement,
          isEvent,
          isPinned: effectiveIsPinned, // 공지사항/이벤트면 자동 고정
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to create post');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('커뮤니티 게시글 작성 완료', {
        description: '노하우 커뮤니티 게시글이 성공적으로 작성되었습니다.',
      });
      router.push('/admin/education/knowhow');
    },
    onError: (error: Error) => {
      toast.error('게시글 작성 실패', {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검증
    if (!title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }

    if (!content.trim()) {
      toast.error('내용을 입력해주세요');
      return;
    }

    if (!categoryId && !isAnnouncement && !isEvent) {
      toast.error('카테고리를 선택해주세요');
      return;
    }

    if (isEvent && (!startDate || !endDate)) {
      toast.error('이벤트는 시작일과 종료일이 필수입니다');
      return;
    }

    createPostMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          노하우 관리로 돌아가기
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">노하우 게시글 작성</h1>
        <p className="text-gray-600 mt-2">노하우 커뮤니티에 공유할 게시글을 작성해주세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 제목 */}
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="게시글 제목을 입력하세요"
                maxLength={200}
                required
              />
            </div>

            {/* 카테고리 (공지사항/이벤트는 선택 사항) */}
            <div>
              <Label htmlFor="category">
                카테고리 {!isAnnouncement && !isEvent && '*'}
                {(isAnnouncement || isEvent) && (
                  <span className="text-sm text-gray-500 ml-2">(공지사항/이벤트는 선택사항)</span>
                )}
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 관리자 옵션 */}
            <div className="space-y-3">
              <Label>게시글 옵션</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAnnouncement"
                  checked={isAnnouncement}
                  onCheckedChange={checked => setIsAnnouncement(checked as boolean)}
                />
                <label
                  htmlFor="isAnnouncement"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  공지사항
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isEvent"
                  checked={isEvent}
                  onCheckedChange={checked => setIsEvent(checked as boolean)}
                />
                <label
                  htmlFor="isEvent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  이벤트
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPinned"
                  checked={isPinned}
                  onCheckedChange={checked => setIsPinned(checked as boolean)}
                />
                <label
                  htmlFor="isPinned"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  상단 고정
                </label>
              </div>
            </div>

            {/* 공지사항/이벤트 기간 */}
            {(isAnnouncement || isEvent) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">
                    시작일 {isEvent && '*'}
                    {isAnnouncement && (
                      <span className="text-sm text-gray-500 ml-2">(선택사항)</span>
                    )}
                  </Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required={isEvent}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">
                    종료일 {isEvent && '*'}
                    {isAnnouncement && (
                      <span className="text-sm text-gray-500 ml-2">(선택사항)</span>
                    )}
                  </Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required={isEvent}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 내용 */}
        <Card>
          <CardHeader>
            <CardTitle>내용 *</CardTitle>
          </CardHeader>
          <CardContent>
            <TiptapEditor
              content={content}
              onChange={setContent}
              onImageUpload={handleImageUpload}
              placeholder="게시글 내용을 작성하세요..."
            />
          </CardContent>
        </Card>

        {/* 파일 첨부 */}
        <Card>
          <CardHeader>
            <CardTitle>파일 첨부</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">
                파일 첨부 (PDF, Word, Excel, PowerPoint, ZIP, TXT - 최대 10MB)
              </Label>
              <div className="mt-2">
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  파일 업로드
                </Button>
              </div>
            </div>

            {/* 첨부된 파일 목록 */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>첨부된 파일</Label>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 버튼 */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button
            type="submit"
            disabled={createPostMutation.isPending}
            className="bg-[#0052CC] hover:bg-[#0047B3]"
          >
            {createPostMutation.isPending ? '작성 중...' : '작성 완료'}
          </Button>
        </div>
      </form>
    </div>
  );
}
