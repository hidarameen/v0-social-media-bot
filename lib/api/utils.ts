// أدوات API والاستدعاءات المساعدة

import { logger } from '@/lib/logger';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Record<string, any>;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * أدوات الاستدعاء الآمنة
 */
export async function safeApiCall<T>(
  fn: () => Promise<T>,
  context: string
): Promise<ApiResponse<T>> {
  try {
    const data = await fn();
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date(),
        requestId: generateRequestId(),
      },
    };
  } catch (error) {
    logger.error(`[API] Error in ${context}:`, error);

    if (error instanceof ApiError) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
        metadata: {
          timestamp: new Date(),
          requestId: generateRequestId(),
        },
      };
    }

    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'UNKNOWN_ERROR',
        details: { error: String(error) },
      },
      metadata: {
        timestamp: new Date(),
        requestId: generateRequestId(),
      },
    };
  }
}

/**
 * توليد معرف طلب فريد
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * التحقق من صحة البيانات
 */
export function validateData(data: any, schema: Record<string, any>): boolean {
  for (const [key, type] of Object.entries(schema)) {
    if (typeof data[key] !== type) {
      throw new ApiError(
        `Invalid data type for field: ${key}`,
        'INVALID_DATA_TYPE',
        400,
        { field: key, expected: type, received: typeof data[key] }
      );
    }
  }
  return true;
}

/**
 * معالجة الخطأ
 */
export function handleError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 'ERROR', 500);
  }

  return new ApiError('Unknown error', 'UNKNOWN_ERROR', 500);
}

/**
 * تقسيم البيانات الكبيرة
 */
export function paginate<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 20
): {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);

  return {
    items: items.slice(start, end),
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * تحويل البيانات
 */
export function transformData<T, U>(
  data: T[],
  transformer: (item: T) => U
): U[] {
  return data.map(transformer);
}

/**
 * تصفية البيانات
 */
export function filterData<T>(
  data: T[],
  predicate: (item: T) => boolean
): T[] {
  return data.filter(predicate);
}

/**
 * دمج البيانات
 */
export function mergeData<T>(
  source: T[],
  target: T[],
  key: keyof T
): T[] {
  const merged = [...source];

  for (const item of target) {
    const index = merged.findIndex(m => m[key] === item[key]);
    if (index >= 0) {
      merged[index] = { ...merged[index], ...item };
    } else {
      merged.push(item);
    }
  }

  return merged;
}

/**
 * تجميع البيانات
 */
export function groupData<T, K extends keyof T>(
  data: T[],
  key: K
): Map<T[K], T[]> {
  const grouped = new Map<T[K], T[]>();

  for (const item of data) {
    const groupKey = item[key];
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey)!.push(item);
  }

  return grouped;
}

/**
 * حساب الإحصائيات
 */
export function calculateStats(numbers: number[]): {
  sum: number;
  average: number;
  min: number;
  max: number;
  median: number;
  stdDev: number;
} {
  if (numbers.length === 0) {
    return { sum: 0, average: 0, min: 0, max: 0, median: 0, stdDev: 0 };
  }

  const sum = numbers.reduce((a, b) => a + b, 0);
  const average = sum / numbers.length;

  const sorted = [...numbers].sort((a, b) => a - b);
  const median =
    numbers.length % 2 === 0
      ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
      : sorted[Math.floor(numbers.length / 2)];

  const variance =
    numbers.reduce((sum, n) => sum + Math.pow(n - average, 2), 0) /
    numbers.length;
  const stdDev = Math.sqrt(variance);

  return {
    sum,
    average: parseFloat(average.toFixed(2)),
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    median: parseFloat(median.toFixed(2)),
    stdDev: parseFloat(stdDev.toFixed(2)),
  };
}

/**
 * تحويل التاريخ للصيغة المقروءة
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * حساب الفرق الزمني
 */
export function getTimeDifference(from: Date, to: Date): string {
  const diff = to.getTime() - from.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
}

/**
 * الحد من معدل الطلبات
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private window: number;

  constructor(limit: number = 100, window: number = 60000) {
    // 100 requests per minute
    this.limit = limit;
    this.window = window;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests
    const validRequests = requests.filter(time => now - time < this.window);

    if (validRequests.length >= this.limit) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * قائمة انتظار لمعالجة المهام
 */
export class TaskQueue {
  private queue: (() => Promise<any>)[] = [];
  private processing = false;

  async enqueue(task: () => Promise<any>): Promise<any> {
    this.queue.push(task);
    return this.process();
  }

  private async process(): Promise<any> {
    if (this.processing) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          logger.error('[TaskQueue] Error processing task:', error);
        }
      }
    }

    this.processing = false;
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}
