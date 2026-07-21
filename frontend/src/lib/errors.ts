import { AxiosError } from 'axios'

interface ApiErrorBody {
  error?: string
  message?: string
}

/**
 * Extracts a human-readable message from an API/axios error, checking the
 * `error` and `message` fields of the response body before falling back to the
 * provided default.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as AxiosError<ApiErrorBody>)?.response?.data
  return data?.error || data?.message || fallback
}
