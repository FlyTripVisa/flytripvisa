/**
 * Response Utility Functions
 * Provides consistent response formatting across all API endpoints
 */

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Content-Type': 'application/json',
};

/**
 * Success Response Builder
 */
export function successResponse(
  data: any,
  statusCode: number = 200
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }),
    {
      status: statusCode,
      headers: CORS_HEADERS,
    }
  );
}

/**
 * Error Response Builder
 */
export function errorResponse(
  error: string | Record<string, any>,
  statusCode: number = 400
): Response {
  const errorData =
    typeof error === 'string'
      ? {
          success: false,
          error,
          statusCode,
          timestamp: new Date().toISOString(),
        }
      : {
          success: false,
          ...error,
          statusCode,
          timestamp: new Date().toISOString(),
        };

  return new Response(JSON.stringify(errorData), {
    status: statusCode,
    headers: CORS_HEADERS,
  });
}

/**
 * Paginated Response Builder
 */
export function paginatedResponse(
  data: any[],
  total: number,
  page: number,
  pageSize: number,
  statusCode: number = 200
): Response {
  const totalPages = Math.ceil(total / pageSize);

  return new Response(
    JSON.stringify({
      success: true,
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    }),
    {
      status: statusCode,
      headers: CORS_HEADERS,
    }
  );
}

/**
 * Validation Error Response
 */
export function validationErrorResponse(
  errors: Record<string, string>
): Response {
  return errorResponse(
    {
      error: 'Validation failed',
      validationErrors: errors,
    },
    422
  );
}

/**
 * Unauthorized Response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): Response {
  return errorResponse(message, 401);
}

/**
 * Forbidden Response
 */
export function forbiddenResponse(message: string = 'Forbidden'): Response {
  return errorResponse(message, 403);
}

/**
 * Not Found Response
 */
export function notFoundResponse(message: string = 'Resource not found'): Response {
  return errorResponse(message, 404);
}

/**
 * Server Error Response
 */
export function serverErrorResponse(
  message: string = 'Internal server error',
  details?: any
): Response {
  return errorResponse(
    {
      error: message,
      ...(details && { details }),
    },
    500
  );
}
