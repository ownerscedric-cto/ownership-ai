'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCreateInquiry, useMyPendingInquiry } from '@/hooks/useInquiries';

/**
 * 업그레이드 문의 모달 설정 옵션
 */
export interface UpgradeInquiryConfig {
  /** 모달 제목 */
  title: string;
  /** 모달 설명 */
  description: string;
  /** 제출 완료 제목 */
  successTitle?: string;
  /** 제출 완료 설명 */
  successDescription?: string;
  /** 대기 중 제목 */
  pendingTitle?: string;
  /** 대기 중 설명 */
  pendingDescription?: string;
  /** 메시지 입력 라벨 */
  messageLabel?: string;
  /** 메시지 입력 placeholder */
  messagePlaceholder?: string;
  /** 제출 버튼 텍스트 */
  submitButtonText?: string;
  /** 문의 유형 (API에 전달) */
  inquiryType?: string;
}

/**
 * 기본 프리미엄 업그레이드 설정
 */
export const PREMIUM_UPGRADE_CONFIG: UpgradeInquiryConfig = {
  title: '프리미엄 업그레이드 문의',
  description: '프리미엄 등급 업그레이드를 신청합니다. 관리자 승인 후 교육 센터 이용이 가능합니다.',
  successTitle: '문의가 접수되었습니다',
  successDescription:
    '프리미엄 업그레이드 문의가 성공적으로 접수되었습니다. 관리자 검토 후 승인되면 프리미엄 등급으로 업그레이드됩니다.',
  pendingTitle: '대기 중인 문의',
  pendingDescription:
    '이미 프리미엄 업그레이드 문의가 접수되어 있습니다. 관리자가 확인 후 처리해 드리겠습니다.',
  messageLabel: '문의 내용 (선택)',
  messagePlaceholder: '추가로 전달하실 내용이 있으시면 작성해주세요.',
  submitButtonText: '문의하기',
  inquiryType: 'premium_upgrade',
};

/**
 * 예시: 고급 기능 업그레이드 설정
 */
export const ADVANCED_FEATURE_CONFIG: UpgradeInquiryConfig = {
  title: '고급 기능 이용 문의',
  description: '고급 기능 이용 권한을 신청합니다. 관리자 승인 후 해당 기능 이용이 가능합니다.',
  successTitle: '문의가 접수되었습니다',
  successDescription:
    '고급 기능 이용 문의가 성공적으로 접수되었습니다. 관리자 검토 후 승인되면 해당 기능을 이용하실 수 있습니다.',
  pendingTitle: '대기 중인 문의',
  pendingDescription: '이미 문의가 접수되어 있습니다. 관리자가 확인 후 처리해 드리겠습니다.',
  messageLabel: '문의 내용 (선택)',
  messagePlaceholder: '이용하시려는 기능이나 추가 요청사항을 작성해주세요.',
  submitButtonText: '문의하기',
  inquiryType: 'advanced_feature',
};

interface UpgradeInquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 모달 설정 (기본값: PREMIUM_UPGRADE_CONFIG) */
  config?: UpgradeInquiryConfig;
}

/**
 * 범용 업그레이드 문의 모달
 *
 * @example
 * // 프리미엄 업그레이드 (기본)
 * <UpgradeInquiryModal open={open} onOpenChange={setOpen} />
 *
 * @example
 * // 커스텀 설정
 * <UpgradeInquiryModal
 *   open={open}
 *   onOpenChange={setOpen}
 *   config={{
 *     title: '커스텀 업그레이드',
 *     description: '커스텀 설명',
 *     // ... 기타 설정
 *   }}
 * />
 */
export function UpgradeInquiryModal({
  open,
  onOpenChange,
  config = PREMIUM_UPGRADE_CONFIG,
}: UpgradeInquiryModalProps) {
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: pendingData, isLoading: checkingPending } = useMyPendingInquiry();
  const createInquiry = useCreateInquiry();

  const hasPendingInquiry = pendingData?.data && pendingData.data.length > 0;

  const handleSubmit = async () => {
    try {
      await createInquiry.mutateAsync({
        message: message || undefined,
        // inquiryType은 추후 API 확장 시 사용
        // inquiryType: config.inquiryType,
      });
      setSubmitted(true);
      setMessage('');
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    onOpenChange(false);
  };

  // 이미 대기 중인 문의가 있는 경우
  if (hasPendingInquiry && !submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              {config.pendingTitle || '대기 중인 문의'}
            </DialogTitle>
            <DialogDescription>
              {config.pendingDescription ||
                '이미 문의가 접수되어 있습니다. 관리자가 확인 후 처리해 드리겠습니다.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // 제출 완료 화면
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              {config.successTitle || '문의가 접수되었습니다'}
            </DialogTitle>
            <DialogDescription>
              {config.successDescription ||
                '문의가 성공적으로 접수되었습니다. 관리자 검토 후 처리됩니다.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        {checkingPending ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#0052CC]" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">{config.messageLabel || '문의 내용 (선택)'}</Label>
              <Textarea
                id="message"
                placeholder={
                  config.messagePlaceholder || '추가로 전달하실 내용이 있으시면 작성해주세요.'
                }
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 text-right">{message.length}/1000</p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createInquiry.isPending || checkingPending}
            className="bg-[#0052CC] hover:bg-[#0052CC]/90"
          >
            {createInquiry.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                제출 중...
              </>
            ) : (
              config.submitButtonText || '문의하기'
            )}
          </Button>
        </DialogFooter>

        {createInquiry.isError && (
          <p className="text-sm text-red-600 text-center">{createInquiry.error.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * 하위 호환성을 위한 PremiumInquiryModal 별칭
 * @deprecated UpgradeInquiryModal을 직접 사용하세요
 */
export function PremiumInquiryModal(props: Omit<UpgradeInquiryModalProps, 'config'>) {
  return <UpgradeInquiryModal {...props} config={PREMIUM_UPGRADE_CONFIG} />;
}
