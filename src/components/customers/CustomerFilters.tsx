'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { LOCATIONS } from '@/lib/constants/locations';

interface CustomerFiltersProps {
  filters: {
    search?: string;
    industry?: string;
    location?: string;
  };
  onFilterChange: (filters: { search?: string; industry?: string; location?: string }) => void;
  onReset: () => void;
}

export function CustomerFilters({ filters, onFilterChange, onReset }: CustomerFiltersProps) {
  const handleInputChange = (field: string, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const hasActiveFilters = filters.search || filters.industry || filters.location;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 고객명 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="고객명으로 검색"
            value={filters.search || ''}
            onChange={e => handleInputChange('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* 업종 필터 */}
        <Input
          placeholder="업종 필터"
          value={filters.industry || ''}
          onChange={e => handleInputChange('industry', e.target.value)}
        />

        {/* 지역 필터 */}
        <Select
          value={filters.location || undefined}
          onValueChange={value => handleInputChange('location', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="지역 선택 (전체)" />
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map(location => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 필터 초기화 버튼 */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onReset}>
            <X className="h-4 w-4 mr-2" />
            필터 초기화
          </Button>
        </div>
      )}
    </div>
  );
}
