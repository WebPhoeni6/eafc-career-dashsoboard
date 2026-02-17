import { validateImportPayload, type ValidationResult } from '../../utils/validate';

export interface ImportResult {
  valid: boolean;
  errors: string[];
  data?: Record<string, unknown>;
}

export function parseImport(raw: string): ImportResult {
  try {
    const data = JSON.parse(raw) as unknown;
    const result: ValidationResult = validateImportPayload(data);
    if (!result.valid) return { valid: false, errors: result.errors };
    return { valid: true, errors: [], data: data as Record<string, unknown> };
  } catch (e) {
    return { valid: false, errors: [`JSON parse error: ${(e as Error).message}`] };
  }
}
