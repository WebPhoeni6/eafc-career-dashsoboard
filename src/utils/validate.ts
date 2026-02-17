export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateImportPayload(data: unknown): ValidationResult {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    errors.push('Not a valid JSON object.');
    return { valid: false, errors };
  }
  const d = data as Record<string, unknown>;
  if (!('matches' in d) || !Array.isArray(d.matches)) errors.push('Missing or invalid matches[] array.');
  if ('career' in d && d.career !== null && typeof d.career !== 'object') errors.push('career must be an object or null.');
  return { valid: errors.length === 0, errors };
}
