'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface RowError {
  row: number;
  field: string;
  message: string;
}

interface UploadResult {
  total: number;
  success: number;
  failed: number;
  errors: RowError[];
}

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // react-dropzone 설정
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setError(null);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  // 템플릿 다운로드
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/customers/bulk/template');
      if (!response.ok) {
        throw new Error('템플릿 다운로드 실패');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer_bulk_upload_template_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError('템플릿 다운로드 중 오류가 발생했습니다');
    }
  };

  // 파일 업로드
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(10);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(30);

      const response = await fetch('/api/customers/bulk', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '업로드 실패');
      }

      const data = await response.json();
      setProgress(100);

      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error?.message || '업로드 실패');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setUploading(false);
    }
  };

  // 파일 제거
  const handleRemoveFile = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* 템플릿 다운로드 섹션 */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">1. 템플릿 다운로드</h3>
        <p className="mb-4 text-sm text-gray-600">
          먼저 엑셀 템플릿을 다운로드하여 고객 정보를 입력해주세요.
        </p>
        <Button onClick={handleDownloadTemplate} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          템플릿 다운로드
        </Button>
      </div>

      {/* 파일 업로드 섹션 */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">2. 파일 업로드</h3>

        {/* 드래그앤드롭 영역 */}
        {!file && (
          <div
            {...getRootProps()}
            className={`
              cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors
              ${
                isDragActive
                  ? 'border-[#0052CC] bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            {isDragActive ? (
              <p className="text-[#0052CC]">파일을 여기에 놓으세요...</p>
            ) : (
              <div>
                <p className="mb-2 text-gray-700">파일을 드래그하여 놓거나 클릭하여 선택하세요</p>
                <p className="text-sm text-gray-500">엑셀 파일(.xlsx, .xls)만 업로드 가능합니다</p>
              </div>
            )}
          </div>
        )}

        {/* 선택된 파일 표시 */}
        {file && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <Button onClick={handleRemoveFile} variant="outline" size="sm" disabled={uploading}>
                제거
              </Button>
            </div>

            {/* 업로드 버튼 */}
            <Button onClick={handleUpload} className="w-full gap-2" disabled={uploading}>
              {uploading ? '업로드 중...' : '업로드 시작'}
            </Button>

            {/* 진행률 표시 */}
            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-center text-sm text-gray-600">{progress}%</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 에러 표시 */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 업로드 결과 표시 */}
      {result && (
        <div className="space-y-4">
          {/* 성공 통계 */}
          {result.success > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>업로드 완료</AlertTitle>
              <AlertDescription>
                총 {result.total}개 중 {result.success}개가 성공적으로 등록되었습니다.
              </AlertDescription>
            </Alert>
          )}

          {/* 실패 통계 및 에러 목록 */}
          {result.failed > 0 && (
            <div className="rounded-lg border bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold">{result.failed}개 행에서 오류 발생</h3>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">행 번호</TableHead>
                      <TableHead className="w-32">필드</TableHead>
                      <TableHead>오류 메시지</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{error.row}</TableCell>
                        <TableCell className="text-sm text-gray-600">{error.field}</TableCell>
                        <TableCell className="text-sm text-red-600">{error.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
