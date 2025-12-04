/**
 * @file api-retry.ts
 * @description API 호출 재시도 전략 (Exponential Backoff + Jitter)
 * Phase 3: Rate Limiting 고도화
 */

/**
 * 재시도 옵션
 */
export interface RetryOptions {
  /**
   * 최대 재시도 횟수 (기본: 3)
   */
  maxRetries?: number;

  /**
   * 초기 지연 시간 (밀리초, 기본: 1000ms = 1초)
   */
  baseDelay?: number;

  /**
   * 최대 지연 시간 (밀리초, 기본: 30000ms = 30초)
   */
  maxDelay?: number;

  /**
   * 재시도 가능한 HTTP 상태 코드 목록
   */
  retryableStatusCodes?: number[];

  /**
   * 재시도 전에 호출될 콜백 함수
   * @param attempt - 현재 재시도 횟수 (1부터 시작)
   * @param delay - 다음 재시도까지의 지연 시간 (밀리초)
   * @param error - 발생한 에러
   */
  onRetry?: (attempt: number, delay: number, error: Error) => void;
}

/**
 * 기본 재시도 옵션
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1초
  maxDelay: 30000, // 30초
  retryableStatusCodes: [408, 429, 500, 502, 503, 504], // Timeout, Rate Limit, Server Errors
  onRetry: () => {}, // 기본 콜백 (아무것도 하지 않음)
};

/**
 * API 호출 재시도 전략 클래스
 *
 * Exponential Backoff + Jitter 알고리즘:
 * - 재시도 횟수가 증가할수록 지연 시간이 기하급수적으로 증가
 * - Jitter(무작위 값)를 추가하여 동시 재시도로 인한 충돌 방지
 *
 * 예시:
 * - 1차 재시도: 1초 + 0~1초 랜덤 = 1~2초
 * - 2차 재시도: 2초 + 0~1초 랜덤 = 2~3초
 * - 3차 재시도: 4초 + 0~1초 랜덤 = 4~5초
 * - 4차 재시도: 8초 + 0~1초 랜덤 = 8~9초
 * - 최대 30초까지
 */
export class RetryStrategy {
  private options: Required<RetryOptions>;

  constructor(options?: RetryOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 재시도 로직과 함께 비동기 함수 실행
   *
   * @param fn - 실행할 비동기 함수
   * @returns 함수 실행 결과
   * @throws 최대 재시도 횟수 초과 시 마지막 에러
   */
  async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        // 함수 실행
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 마지막 재시도면 에러 던지기
        if (attempt === this.options.maxRetries) {
          console.error(
            `[RetryStrategy] ❌ All retries exhausted (${this.options.maxRetries} attempts)`,
            lastError
          );
          throw lastError;
        }

        // 재시도 가능한 에러인지 확인
        if (!this.isRetryableError(lastError)) {
          console.error('[RetryStrategy] ❌ Non-retryable error, aborting', lastError);
          throw lastError;
        }

        // 다음 재시도까지 지연 시간 계산 (Exponential Backoff + Jitter)
        const delay = this.calculateDelay(attempt);

        // 재시도 콜백 호출
        this.options.onRetry(attempt + 1, delay, lastError);

        console.warn(
          `[RetryStrategy] ⚠️ Retry ${attempt + 1}/${this.options.maxRetries} after ${delay}ms`,
          {
            error: lastError.message,
            attempt: attempt + 1,
            delay,
          }
        );

        // 지연 시간만큼 대기
        await this.sleep(delay);
      }
    }

    // 여기까지 오면 안 되지만, TypeScript 타입 체크를 위해 추가
    throw lastError;
  }

  /**
   * Exponential Backoff + Jitter 지연 시간 계산
   *
   * @param attempt - 현재 재시도 횟수 (0부터 시작)
   * @returns 지연 시간 (밀리초)
   */
  private calculateDelay(attempt: number): number {
    // Exponential Backoff: baseDelay * 2^attempt
    const exponentialDelay = this.options.baseDelay * Math.pow(2, attempt);

    // Jitter: 0 ~ 1000ms 사이의 무작위 값
    const jitter = Math.random() * 1000;

    // 최대 지연 시간 초과 방지
    const delay = Math.min(exponentialDelay + jitter, this.options.maxDelay);

    return Math.floor(delay);
  }

  /**
   * 재시도 가능한 에러인지 확인
   *
   * @param error - 발생한 에러
   * @returns 재시도 가능 여부
   */
  private isRetryableError(error: Error): boolean {
    // Fetch API 에러 (네트워크 에러, CORS 에러 등)
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return true;
    }

    // HTTP 상태 코드 에러 (예: "API error: 429 Too Many Requests")
    const statusCodeMatch = error.message.match(/(\d{3})/);
    if (statusCodeMatch) {
      const statusCode = parseInt(statusCodeMatch[1], 10);
      return this.options.retryableStatusCodes.includes(statusCode);
    }

    // Timeout 에러
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return true;
    }

    // 기본적으로 재시도 불가
    return false;
  }

  /**
   * 지연 시간만큼 대기
   *
   * @param ms - 대기 시간 (밀리초)
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 기본 RetryStrategy 인스턴스 (싱글톤)
 */
export const defaultRetryStrategy = new RetryStrategy();

/**
 * 재시도와 함께 비동기 함수 실행 (헬퍼 함수)
 *
 * @param fn - 실행할 비동기 함수
 * @param options - 재시도 옵션
 * @returns 함수 실행 결과
 *
 * @example
 * ```typescript
 * const data = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 5, baseDelay: 2000 }
 * );
 * ```
 */
export async function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const strategy = options ? new RetryStrategy(options) : defaultRetryStrategy;
  return strategy.executeWithRetry(fn);
}
