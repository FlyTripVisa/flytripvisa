/**
 * Validation Utilities
 * Provides request validation and data sanitization
 */

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  requiredFields.forEach((field) => {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      errors.push({
        field,
        message: `${field} is required`,
        value,
      });
    }
  });

  return errors;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Bangladesh format)
 */
export function validatePhone(phone: string): boolean {
  // Bangladeshi phone formats: +8801XXXXXXXXX or 01XXXXXXXXX
  const phoneRegex = /^(\+88)?01[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate date format (ISO 8601)
 */
export function validateDate(date: string): boolean {
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRegex.test(date)) return false;

  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Validate URL
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate minimum length
 */
export function validateMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength;
}

/**
 * Validate maximum length
 */
export function validateMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}

/**
 * Validate enum value
 */
export function validateEnum(
  value: any,
  allowedValues: any[]
): boolean {
  return allowedValues.includes(value);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML-like brackets
    .substring(0, 1000); // Limit length
}

/**
 * Validate request body
 */
export interface ValidationRule {
  field: string;
  validators: ((value: any) => boolean | ValidationError)[];
}

export function validateRequestBody(
  data: Record<string, any>,
  rules: ValidationRule[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  rules.forEach((rule) => {
    const value = data[rule.field];

    rule.validators.forEach((validator) => {
      const result = validator(value);
      if (result === false) {
        errors.push({
          field: rule.field,
          message: `Validation failed for ${rule.field}`,
          value,
        });
      } else if (typeof result === 'object' && result !== null) {
        errors.push(result as ValidationError);
      }
    });
  });

  return errors;
}

/**
 * Parse and validate JSON payload
 */
export async function parseAndValidateJSON(
  request: Request
): Promise<Record<string, any>> {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Content-Type must be application/json');
    }

    return await request.json();
  } catch (error) {
    throw {
      statusCode: 400,
      message: 'Invalid JSON payload',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: any, pageSize?: any) {
  const validatedPage = Math.max(1, parseInt(page) || 1);
  const validatedPageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 10));

  return { page: validatedPage, pageSize: validatedPageSize };
}
