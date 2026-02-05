/**
 * @file SnippetPicker.tsx
 * @description 스니펫 선택 컴포넌트 - 템플릿 편집 시 문구 삽입
 */

'use client';

import { useState } from 'react';
import { MessageSquarePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useCopySnippets, type CopySnippet } from '@/hooks/useCopySnippets';

interface SnippetPickerProps {
  onInsert: (content: string) => void;
  disabled?: boolean;
}

// 카테고리 라벨
const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  greeting: { label: '인사말', color: 'bg-green-100 text-green-800' },
  footer: { label: '마무리', color: 'bg-blue-100 text-blue-800' },
  alert: { label: '알림', color: 'bg-yellow-100 text-yellow-800' },
};

export function SnippetPicker({ onInsert, disabled }: SnippetPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading } = useCopySnippets();

  const snippets = data?.data || [];

  // 카테고리별 그룹핑
  const groupedSnippets = snippets.reduce(
    (acc, snippet) => {
      const category = snippet.category || 'etc';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(snippet);
      return acc;
    },
    {} as Record<string, CopySnippet[]>
  );

  const handleSelect = (snippet: CopySnippet) => {
    onInsert(snippet.content);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled} className="gap-1">
          <MessageSquarePlus className="w-4 h-4" />
          스니펫 삽입
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">자주 쓰는 문구</h4>
          <p className="text-xs text-gray-500 mt-1">클릭하여 삽입</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : snippets.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">등록된 스니펫이 없습니다</div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {Object.entries(groupedSnippets).map(([category, categorySnippets]) => (
              <div key={category}>
                <div className="px-3 py-2 bg-gray-50 border-b sticky top-0">
                  <Badge
                    variant="secondary"
                    className={CATEGORY_LABELS[category]?.color || 'bg-gray-100 text-gray-800'}
                  >
                    {CATEGORY_LABELS[category]?.label || category}
                  </Badge>
                </div>
                <div className="py-1">
                  {categorySnippets.map(snippet => (
                    <button
                      key={snippet.id}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
                      onClick={() => handleSelect(snippet)}
                    >
                      <div className="text-sm font-medium text-gray-900">{snippet.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {snippet.content}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
