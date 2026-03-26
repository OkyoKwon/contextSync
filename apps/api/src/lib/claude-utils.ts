import Anthropic from '@anthropic-ai/sdk';
import { AppError } from '../plugins/error-handler.plugin.js';

export async function callWithRetry(
  client: Anthropic,
  model: string,
  systemPrompt: string,
  userMessage: string,
  retries = 1,
  maxTokens = 8192,
): Promise<Anthropic.Message> {
  try {
    return await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      await delay(2000);
      return callWithRetry(client, model, systemPrompt, userMessage, retries - 1, maxTokens);
    }
    throw toAppError(error);
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof Anthropic.APIError) {
    // 외부 API 에러는 프론트엔드 세션 로직(401→로그아웃)과 충돌하지 않도록
    // 모두 4xx/5xx 범위에서 사용자 인증과 무관한 코드로 매핑
    switch (error.status) {
      case 401:
        return new AppError(
          'Anthropic API Key가 유효하지 않습니다. Settings에서 확인해주세요.',
          400,
        );
      case 403:
        return new AppError('해당 모델에 접근 권한이 없습니다.', 400);
      case 404:
        return new AppError('요청한 모델을 찾을 수 없습니다.', 400);
      case 429:
        return new AppError('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.', 429);
      default:
        return error.status >= 500
          ? new AppError('Anthropic API 서버 오류입니다. 잠시 후 다시 시도해주세요.', 502)
          : new AppError(`AI API 오류: ${error.message}`, 400);
    }
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  return new AppError(`AI 분석 중 오류가 발생했습니다: ${message}`, 500);
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    return error.status >= 500 || error.status === 429;
  }
  return false;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
