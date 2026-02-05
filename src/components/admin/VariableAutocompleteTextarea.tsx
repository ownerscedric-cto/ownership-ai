'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Variable {
  name: string;
  displayName: string;
  value?: string;
  isSystem?: boolean;
}

interface VariableAutocompleteTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  variables: Variable[];
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function VariableAutocompleteTextarea({
  id,
  value,
  onChange,
  variables,
  placeholder,
  rows = 4,
  className,
}: VariableAutocompleteTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterText, setFilterText] = useState('');
  const [triggerPosition, setTriggerPosition] = useState<number | null>(null);

  // 필터링된 변수 목록
  const filteredVariables = variables.filter(
    v =>
      v.name.toLowerCase().includes(filterText.toLowerCase()) ||
      v.displayName.toLowerCase().includes(filterText.toLowerCase())
  );

  // 드롭다운 위치 계산
  const calculateDropdownPosition = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const { selectionStart } = textarea;

    // 텍스트 위치를 기반으로 캐럿 위치 추정
    const textBeforeCursor = value.substring(0, selectionStart);
    const lines = textBeforeCursor.split('\n');
    const currentLineIndex = lines.length - 1;
    const currentLineText = lines[currentLineIndex];

    // 간단한 위치 계산 (정확하지 않을 수 있지만 대략적으로 동작)
    const lineHeight = 24; // 대략적인 라인 높이
    const charWidth = 8; // 대략적인 문자 너비

    const rect = textarea.getBoundingClientRect();
    const scrollTop = textarea.scrollTop;

    const top = Math.min(
      currentLineIndex * lineHeight - scrollTop + lineHeight + 4,
      textarea.offsetHeight - 200
    );
    const left = Math.min(currentLineText.length * charWidth, textarea.offsetWidth - 250);

    setDropdownPosition({
      top: Math.max(top, 30),
      left: Math.max(left, 0),
    });
  }, [value]);

  // 입력 핸들러
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(newValue);

    // {{ 패턴 감지
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastOpenBraces = textBeforeCursor.lastIndexOf('{{');
    const lastCloseBraces = textBeforeCursor.lastIndexOf('}}');

    if (lastOpenBraces !== -1 && lastOpenBraces > lastCloseBraces) {
      // {{ 이후의 텍스트를 필터로 사용
      const filterStart = lastOpenBraces + 2;
      const filter = textBeforeCursor.substring(filterStart);

      // }} 가 없으면 드롭다운 표시
      if (!filter.includes('}}')) {
        setFilterText(filter);
        setTriggerPosition(lastOpenBraces);
        setShowDropdown(true);
        setSelectedIndex(0);
        calculateDropdownPosition();
        return;
      }
    }

    setShowDropdown(false);
    setTriggerPosition(null);
  };

  // 변수 선택
  const selectVariable = useCallback(
    (variable: Variable) => {
      if (triggerPosition === null || !textareaRef.current) return;

      const cursorPos = textareaRef.current.selectionStart;
      const beforeTrigger = value.substring(0, triggerPosition);
      const afterCursor = value.substring(cursorPos);

      const newValue = `${beforeTrigger}{{${variable.name}}}${afterCursor}`;
      onChange(newValue);

      setShowDropdown(false);
      setTriggerPosition(null);
      setFilterText('');

      // 커서를 삽입한 변수 뒤로 이동
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = triggerPosition + variable.name.length + 4; // {{name}}
          textareaRef.current.selectionStart = newCursorPos;
          textareaRef.current.selectionEnd = newCursorPos;
          textareaRef.current.focus();
        }
      }, 0);
    },
    [triggerPosition, value, onChange]
  );

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredVariables.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        if (filteredVariables.length > 0) {
          e.preventDefault();
          selectVariable(filteredVariables[selectedIndex]);
        }
        break;
      case 'Tab':
        if (filteredVariables.length > 0) {
          e.preventDefault();
          selectVariable(filteredVariables[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
    }
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 선택된 항목이 보이도록 스크롤
  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, showDropdown]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />

      {/* 자동완성 드롭다운 */}
      {showDropdown && filteredVariables.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto min-w-[250px]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <div className="p-1">
            {filteredVariables.map((variable, index) => (
              <button
                key={variable.name}
                type="button"
                data-selected={index === selectedIndex}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  index === selectedIndex
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
                onClick={() => selectVariable(variable)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                      {`{{${variable.name}}}`}
                    </code>
                    <span className="text-gray-600">{variable.displayName}</span>
                  </div>
                  {variable.isSystem ? (
                    <span className="text-xs text-gray-400">시스템</span>
                  ) : (
                    <span className="text-xs text-blue-500">{variable.value}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 드롭다운이 열려있고 결과가 없을 때 */}
      {showDropdown && filteredVariables.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          일치하는 변수가 없습니다
        </div>
      )}
    </div>
  );
}
