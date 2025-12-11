'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Upload, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface KnowHowCategory {
  id: string;
  name: string;
  description: string | null;
}

interface KnowHow {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  author: string | null;
  tags: string[];
  imageUrls: string[];
  fileUrls: string[];
  fileNames: string[];
}

export default function AdminKnowHowArchiveEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>([]);

  const { data: knowhow, isLoading: knowhowLoading } = useQuery<KnowHow>({
    queryKey: ['knowhow-archive', id],
    queryFn: async () => {
      const res = await fetch(`/api/education/knowhow/archive/${id}`);
      if (!res.ok) throw new Error('Failed to fetch knowhow');
      const data = await res.json();
      return data.data;
    },
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<KnowHowCategory[]>({
    queryKey: ['knowhow-categories'],
    queryFn: async () => {
      const res = await fetch('/api/education/knowhow/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      return data.data;
    },
  });

  useEffect(() => {
    if (knowhow) {
      setTitle(knowhow.title);
      setContent(knowhow.content);
      setCategoryId(knowhow.categoryId || '');
      setAuthor(knowhow.author || '');
      setTags((knowhow.tags || []).join(', '));
      setUploadedImages(knowhow.imageUrls || []);
      setUploadedFiles(
        (knowhow.fileUrls || []).map((url, index) => ({
          url,
          name: knowhow.fileNames?.[index] || `file-${index + 1}`,
        }))
      );
    }
  }, [knowhow]);

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
        description: '다시 시도해주세요.',
      });
    }
  };

  const handleFileRemove = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateArchiveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/education/knowhow/archive/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          categoryId: categoryId || undefined,
          author: author || undefined,
          tags: tags
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0),
          imageUrls: uploadedImages,
          fileUrls: uploadedFiles.map(f => f.url),
          fileNames: uploadedFiles.map(f => f.name),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to update archive');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('노하우 아카이브 수정 완료', {
        description: '노하우 아카이브가 성공적으로 수정되었습니다.',
      });
      router.push('/admin/education/knowhow');
    },
    onError: (error: Error) => {
      toast.error('노하우 아카이브 수정 실패', {
        description: error.message,
      });
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

    updateArchiveMutation.mutate();
  };

  if (knowhowLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!knowhow) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center text-red-600">노하우를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button
            onClick={() => router.push('/admin/education/knowhow')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            노하우 관리로 돌아가기
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">노하우 아카이브 수정</h1>
          <p className="text-gray-600 mt-2">오너스경영연구소 전문 노하우를 수정합니다</p>
        </div>
      </div>

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
                placeholder="노하우 제목을 입력하세요"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">카테고리 (선택)</Label>
              {categoriesLoading ? (
                <div className="text-sm text-gray-500">카테고리 로딩 중...</div>
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택하세요 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories || []).map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>내용 *</CardTitle>
          </CardHeader>
          <CardContent>
            <TiptapEditor
              content={content}
              onChange={setContent}
              onImageUpload={handleImageUpload}
              placeholder="노하우 내용을 작성하세요..."
            />
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
            disabled={updateArchiveMutation.isPending}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={updateArchiveMutation.isPending}
            className="bg-[#0052CC] hover:bg-[#003d99]"
          >
            {updateArchiveMutation.isPending ? '수정 중...' : '수정 완료'}
          </Button>
        </div>
      </form>
    </div>
  );
}
