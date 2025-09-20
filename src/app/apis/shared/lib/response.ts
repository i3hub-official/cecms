// src/app/shared/lib/response.ts

/**
 * Standard success response structure
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

/**
 * Creates a standardized success response
 */
export function successResponse<T = unknown>(
  data: T,
  message?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    message: message || "Operation completed successfully",
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: unknown
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Common error codes and messages
 */
export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // Rate limiting
  RATE_LIMITED: "RATE_LIMITED",

  // API key specific errors
  API_KEY_INVALID: "API_KEY_INVALID",
  API_KEY_EXPIRED: "API_KEY_EXPIRED",
  API_KEY_NOT_FOUND: "API_KEY_NOT_FOUND",
} as const;

/**
 * Pre-defined error responses for common scenarios
 */
export const CommonErrors = {
  unauthorized: (message: string = "Authentication required") =>
    errorResponse(ErrorCodes.UNAUTHORIZED, message),

  forbidden: (message: string = "Access denied") =>
    errorResponse(ErrorCodes.FORBIDDEN, message),

  notFound: (resource: string = "Resource") =>
    errorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`),

  validationError: (details: string, message: string = "Validation failed") =>
    errorResponse(ErrorCodes.VALIDATION_ERROR, message, details),

  internalError: (message: string = "Internal server error") =>
    errorResponse(ErrorCodes.INTERNAL_ERROR, message),

  invalidInput: (message: string = "Invalid input provided") =>
    errorResponse(ErrorCodes.INVALID_INPUT, message),

  alreadyExists: (resource: string = "Resource") =>
    errorResponse(ErrorCodes.ALREADY_EXISTS, `${resource} already exists`),
};

/**
 * Type guard to check if an object is a SuccessResponse
 */
export function isSuccessResponse(obj: any): obj is SuccessResponse {
  return obj && obj.success === true && obj.data !== undefined;
}

/**
 * Type guard to check if an object is an ErrorResponse
 */
export function isErrorResponse(obj: any): obj is ErrorResponse {
  return obj && obj.success === false && obj.error !== undefined;
}

/**
 * Helper to extract data from response or throw error
 */
export function unwrapResponse<T>(
  response: SuccessResponse<T> | ErrorResponse
): T {
  if (isErrorResponse(response)) {
    throw new Error(response.error.message);
  }
  return response.data;
}

/**
 * Creates a response with pagination metadata
 */
export function paginatedResponse<T = unknown>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  },
  message?: string
): SuccessResponse<{
  data: T[];
  pagination: typeof pagination;
}> {
  return successResponse(
    {
      data,
      pagination,
    },
    message
  );
}

/**
 * HTTP status code mappings for error responses
 */
export const ErrorStatusCodes: Record<string, number> = {
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.INVALID_TOKEN]: 401,
  [ErrorCodes.SESSION_EXPIRED]: 401,
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.INVALID_INPUT]: 400,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.ALREADY_EXISTS]: 409,
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.RATE_LIMITED]: 429,
  [ErrorCodes.API_KEY_INVALID]: 401,
  [ErrorCodes.API_KEY_EXPIRED]: 401,
  [ErrorCodes.API_KEY_NOT_FOUND]: 404,
};

/**
 * Gets the appropriate HTTP status code for an error response
 */
export function getStatusCodeForError(errorCode: string): number {
  return ErrorStatusCodes[errorCode] || 500;
}
