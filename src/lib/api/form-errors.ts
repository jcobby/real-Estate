import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { ApiError, describeError } from "./http";

/**
 * Surface an API error on a form: map the backend's `fieldErrors` onto matching
 * form fields and toast the reason, so a rejected submit is never silent.
 * Returns the field keys that were mapped (useful for jumping to a wizard step).
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  opts: { fields?: readonly string[]; fallback?: string } = {},
): string[] {
  if (error instanceof ApiError && error.fieldErrors) {
    const mapped: string[] = [];
    for (const [field, message] of Object.entries(error.fieldErrors)) {
      if (!opts.fields || opts.fields.includes(field)) {
        setError(field as Path<T>, { message });
        mapped.push(field);
      }
    }
    toast.error("Please fix the highlighted fields", { description: Object.values(error.fieldErrors)[0] });
    if (mapped.length) return mapped;
  }
  toast.error(opts.fallback ?? "Something went wrong", { description: describeError(error) });
  return [];
}
