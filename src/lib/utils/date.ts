/**
 * @file date.ts
 * @description 날짜/시간 유틸리티 함수 (한국 시간 KST 변환)
 *
 * Supabase는 UTC로 저장하므로, 클라이언트에서 표시할 때 KST(UTC+9)로 변환
 */

import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * UTC 시간을 KST(한국 시간)로 변환
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns KST Date 객체
 */
export function toKST(date: string | Date): Date {
  const utcDate = typeof date === 'string' ? parseISO(date) : date;
  // UTC 시간에 9시간 추가 (KST = UTC+9)
  return new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
}

/**
 * 날짜를 "YYYY-MM-DD" 형식으로 포맷 (KST 기준)
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns "2025-01-21" 형식
 */
export function formatDate(date: string | Date): string {
  const kstDate = toKST(date);
  return format(kstDate, 'yyyy-MM-dd', { locale: ko });
}

/**
 * 날짜와 시간을 "YYYY-MM-DD HH:mm" 형식으로 포맷 (KST 기준)
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns "2025-01-21 14:30" 형식
 */
export function formatDateTime(date: string | Date): string {
  const kstDate = toKST(date);
  return format(kstDate, 'yyyy-MM-dd HH:mm', { locale: ko });
}

/**
 * 날짜와 시간을 "YYYY.MM.DD HH:mm" 형식으로 포맷 (KST 기준)
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns "2025.01.21 14:30" 형식
 */
export function formatDateTimeDot(date: string | Date): string {
  const kstDate = toKST(date);
  return format(kstDate, 'yyyy.MM.dd HH:mm', { locale: ko });
}

/**
 * 날짜와 시간을 "YYYY년 MM월 DD일 HH:mm" 형식으로 포맷 (KST 기준)
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns "2025년 01월 21일 14:30" 형식
 */
export function formatDateTimeKorean(date: string | Date): string {
  const kstDate = toKST(date);
  return format(kstDate, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
}

/**
 * 시간만 "HH:mm" 형식으로 포맷 (KST 기준)
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns "14:30" 형식
 */
export function formatTime(date: string | Date): string {
  const kstDate = toKST(date);
  return format(kstDate, 'HH:mm', { locale: ko });
}

/**
 * 상대 시간 포맷 ("3분 전", "2시간 전", "5일 전" 등) (KST 기준)
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns "3분 전" 형식
 */
export function formatRelativeTime(date: string | Date): string {
  // Supabase UTC 시간을 브라우저가 자동으로 로컬 시간으로 변환
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;

  return formatDistanceToNow(parsedDate, {
    addSuffix: true,
    locale: ko,
    includeSeconds: true,
  });
}

/**
 * 날짜가 오늘인지 확인 (KST 기준)
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns 오늘이면 true
 */
export function isToday(date: string | Date): boolean {
  const kstDate = toKST(date);
  const today = toKST(new Date());

  return (
    kstDate.getFullYear() === today.getFullYear() &&
    kstDate.getMonth() === today.getMonth() &&
    kstDate.getDate() === today.getDate()
  );
}

/**
 * 날짜가 어제인지 확인 (KST 기준)
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns 어제면 true
 */
export function isYesterday(date: string | Date): boolean {
  const kstDate = toKST(date);
  const yesterday = toKST(new Date());
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    kstDate.getFullYear() === yesterday.getFullYear() &&
    kstDate.getMonth() === yesterday.getMonth() &&
    kstDate.getDate() === yesterday.getDate()
  );
}

/**
 * 스마트 날짜 포맷 (KST 기준)
 * - 오늘: "HH:mm"
 * - 어제: "어제 HH:mm"
 * - 이번 주: "월요일 HH:mm"
 * - 그 외: "YYYY-MM-DD"
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns 상황에 맞는 포맷
 */
export function formatSmartDate(date: string | Date): string {
  const kstDate = toKST(date);

  if (isToday(date)) {
    return formatTime(date);
  }

  if (isYesterday(date)) {
    return `어제 ${formatTime(date)}`;
  }

  const now = toKST(new Date());
  const diffInDays = Math.floor((now.getTime() - kstDate.getTime()) / (1000 * 60 * 60 * 24));

  // 7일 이내면 요일 표시
  if (diffInDays < 7) {
    return format(kstDate, 'EEEE HH:mm', { locale: ko });
  }

  // 그 외에는 날짜만 표시
  return formatDate(date);
}

/**
 * datetime-local input용 포맷 (KST 기준)
 * HTML input[type="datetime-local"]에 사용
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns "2025-01-21T14:30" 형식
 */
export function formatDateTimeLocal(date: string | Date): string {
  const kstDate = toKST(date);
  return format(kstDate, "yyyy-MM-dd'T'HH:mm", { locale: ko });
}

/**
 * datetime-local input 값을 UTC ISO 문자열로 변환
 * 사용자가 입력한 KST 시간을 UTC로 변환하여 DB 저장
 *
 * @param dateTimeLocal - "2025-01-21T14:30" 형식
 * @returns UTC ISO 문자열 "2025-01-21T05:30:00.000Z"
 */
export function fromDateTimeLocal(dateTimeLocal: string): string {
  // 사용자가 입력한 시간은 KST이므로 9시간 빼기
  const kstDate = new Date(dateTimeLocal);
  const utcDate = new Date(kstDate.getTime() - 9 * 60 * 60 * 1000);
  return utcDate.toISOString();
}

/**
 * 날짜를 "YY.MM.DD" 형식으로 포맷 (KST 기준)
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns "25.01.21" 형식
 */
export function formatDateShort(date: string | Date): string {
  const kstDate = toKST(date);
  return format(kstDate, 'yy.MM.dd', { locale: ko });
}

/**
 * 날짜를 "YYYY.MM.DD" 형식으로 포맷 (KST 기준)
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns "2025.01.21" 형식
 */
export function formatDateDot(date: string | Date): string {
  const kstDate = toKST(date);
  return format(kstDate, 'yyyy.MM.dd', { locale: ko });
}

/**
 * 날짜를 "YYYY년 M월 D일" 형식으로 포맷 (KST 기준)
 *
 * @param date - UTC 날짜 문자열 또는 Date 객체
 * @returns "2025년 1월 21일" 형식
 */
export function formatDateKoreanShort(date: string | Date): string {
  const kstDate = toKST(date);
  return format(kstDate, 'yyyy년 M월 d일', { locale: ko });
}
