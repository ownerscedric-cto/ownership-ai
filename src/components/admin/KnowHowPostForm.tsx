'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation } from '@tanstack/react-query';
import { Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { flattenCategories, HierarchicalCategory } from '@/lib/category-utils';

interface KnowHowPost {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  author: string | null;
  tags: string[];
  imageUrls: string[];
  fileUrls: string[];
  fileNames: string[];
  isAnnouncement: boolean;
  isEvent: boolean;
  isPinned: boolean;
  startDate: string | null;
  endDate: string | null;
}

interface KnowHowPostFormProps {
  mode: 'create' | 'edit';
  post?: KnowHowPost;
  categories: HierarchicalCategory[];
}

export function KnowHowPostForm({ mode, post, categories }: KnowHowPostFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [categoryId, setCategoryId] = useState(post?.categoryId || '');
  const [author, setAuthor] = useState(post?.author || '');
  const [tags, setTags] = useState((post?.tags || []).join(', '));
  const [isAnnouncement, setIsAnnouncement] = useState(post?.isAnnouncement || false);
  const [isEvent, setIsEvent] = useState(post?.isEvent || false);
  const [isPinned, setIsPinned] = useState(post?.isPinned || false);
  const [startDate, setStartDate] = useState(post?.startDate ? post.startDate.slice(0, 16) : '');
  const [endDate, setEndDate] = useState(post?.endDate ? post.endDate.slice(0, 16) : '');
  const [uploadedImages, setUploadedImages] = useState<string[]>(post?.imageUrls || []);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>(
    (post?.fileUrls || []).map((url, index) => ({
      url,
      name: post?.fileNames?.[index] || `file-${index + 1}`,
    }))
  );

  const effectiveIsPinned = isAnnouncement || isEvent || isPinned;
  const flatCategories = flattenCategories(categories);

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Image upload failed');

    const data = await res.json();
    const imageUrl = data.data.url;
    setUploadedImages(prev => [...prev, imageUrl]);
    return imageUrl;
  };

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

      if (!res.ok) throw new Error('File upload failed');

      const data = await res.json();
      setUploadedFiles(prev => [...prev, { url: data.data.url, name: data.data.fileName }]);
      toast.success('파일 업로드 성공', {
        description: `${data.data.fileName}이(가) 업로드되었습니다.`,
      });
    } catch {
      toast.error('파일 업로드 실패', { description: '다시 시도해주세요.' });
    }
  };

  const handleFileRemove = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const url =
        mode === 'create'
          ? '/api/admin/education/knowhow/posts'
          : `/api/education/knowhow/posts/${post!.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          categoryId: categoryId || undefined,
          author: author || undefined,
          tags: tags
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0),
          isAnnouncement,
          isEvent,
          isPinned: effectiveIsPinned,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          imageUrls: uploadedImages,
          fileUrls: uploadedFiles.map(f => f.url),
          fileNames: uploadedFiles.map(f => f.name),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to save post');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success(mode === 'create' ? '커뮤니티 글 작성 완료' : '커뮤니티 글 수정 완료');
      router.push('/admin/education/knowhow');
    },
    onError: (error: Error) => {
      toast.error(mode === 'create' ? '작성 실패' : '수정 실패', { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              placeholder="게시글 제목을 입력하세요"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              카테고리 {!isAnnouncement && !isEvent && '*'}
              {(isAnnouncement || isEvent) && (
                <span className="text-sm text-gray-500 ml-2">(공지사항/이벤트는 선택사항)</span>
              )}
            </Label>
            <Select value={categoryId || undefined} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {flatCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">작성자 (선택)</Label>
            <Input
              id="author"
              placeholder="작성자 이름 (미입력 시 자동)"
              value={author}
              onChange={e => setAuthor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
            <Input
              id="tags"
              placeholder="예: 컨설팅, 정부지원사업, 팁"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              쉼표(,)로 구분하여 여러 태그를 입력할 수 있습니다
            </p>
          </div>

          <div className="space-y-3">
            <Label>게시글 옵션</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAnnouncement"
                checked={isAnnouncement}
                onCheckedChange={checked => setIsAnnouncement(checked as boolean)}
              />
              <label htmlFor="isAnnouncement" className="text-sm font-medium leading-none">
                공지사항
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isEvent"
                checked={isEvent}
                onCheckedChange={checked => setIsEvent(checked as boolean)}
              />
              <label htmlFor="isEvent" className="text-sm font-medium leading-none">
                이벤트
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPinned"
                checked={isPinned}
                onCheckedChange={checked => setIsPinned(checked as boolean)}
              />
              <label htmlFor="isPinned" className="text-sm font-medium leading-none">
                상단 고정
              </label>
            </div>
          </div>

          {(isAnnouncement || isEvent) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">
                  시작일 {isEvent && '*'}
                  {isAnnouncement && <span className="text-sm text-gray-500 ml-2">(선택사항)</span>}
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
                  {isAnnouncement && <span className="text-sm text-gray-500 ml-2">(선택사항)</span>}
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

      <Card>
        <CardHeader>
          <CardTitle>내용 *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <TiptapEditor
            content={content}
            onChange={setContent}
            onImageUpload={handleImageUpload}
            placeholder="게시글 내용을 작성하세요..."
          />
          <p className="text-xs text-gray-500">에디터 내 이미지 업로드는 최대 5MB까지 가능합니다</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>파일 첨부 (선택)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
            />
            <Label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              파일 선택
            </Label>
            <span className="text-sm text-gray-500">
              PDF, Word, Excel, PowerPoint, ZIP, TXT 파일 (최대 10MB)
            </span>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                첨부된 파일 ({uploadedFiles.length})
              </p>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#0052CC]" />
                      <span className="text-sm text-gray-900">{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileRemove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/education/knowhow')}
          disabled={mutation.isPending}
        >
          취소
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="bg-[#0052CC] hover:bg-[#003d99]"
        >
          {mutation.isPending
            ? mode === 'create'
              ? '작성 중...'
              : '수정 중...'
            : mode === 'create'
              ? '작성 완료'
              : '수정 완료'}
        </Button>
      </div>
    </form>
  );
}
