interface ApiErrorPayload {
  error?: {
    code?: string
    message?: string
    requestId?: string
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  token?: string
}

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'
).replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, token, ...requestOptions } = options
  const headers = new Headers(requestOptions.headers)

  if (body !== undefined) {
    headers.set('content-type', 'application/json')
  }

  if (token) {
    headers.set('authorization', `Bearer ${token}`)
  }

  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...requestOptions,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers,
    })
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Tidak dapat terhubung ke server. Periksa koneksi dan alamat API.',
    )
  }

  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload.error?.code ?? 'API_ERROR',
      payload.error?.message ?? 'Permintaan ke server gagal.',
      payload.error?.requestId,
    )
  }

  return payload as T
}

export function userFacingApiError(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof ApiError)) {
    return fallback
  }

  const messages: Record<string, string> = {
    EMAIL_ALREADY_REGISTERED: 'Email tersebut sudah terdaftar.',
    AUTHENTICATION_REQUIRED: 'Sesi masuk diperlukan untuk melanjutkan.',
    AI_EXPLANATION_NOT_CONFIGURED:
      'Layanan Penjelasan AI belum dikonfigurasi pada backend.',
    AI_REPLACEMENT_ASSISTANT_NOT_CONFIGURED:
      'Asisten penggantian AI belum dikonfigurasi pada backend.',
    AI_REPLACEMENT_FILTER_EMPTY:
      'Sebutkan bahan yang ingin dihindari atau lebih diinginkan.',
    AI_INVALID_RESPONSE:
      'Respons AI tidak lolos pemeriksaan keamanan. Silakan coba kembali.',
    AI_PROVIDER_RATE_LIMITED:
      'Batas penggunaan AI sedang tercapai. Silakan coba beberapa saat lagi.',
    AI_PROVIDER_TIMEOUT:
      'Penyedia AI membutuhkan waktu terlalu lama untuk merespons.',
    AI_PROVIDER_UNAVAILABLE:
      'Penyedia AI sedang tidak tersedia. Silakan coba kembali.',
    CALORIE_CALCULATION_UNSUPPORTED:
      'Kebutuhan kalori belum dapat dihitung dari profil ini.',
    INVALID_CREDENTIALS: 'Email atau kata sandi salah.',
    MENU_NOT_FOUND: 'Menu tersebut tidak ditemukan atau belum disetujui.',
    INVALID_REPLACEMENT_MENU:
      'Menu aktif tidak sesuai dengan slot makan yang dipilih.',
    NETWORK_ERROR:
      'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.',
    PROFILE_ALREADY_EXISTS: 'Profil pengguna sudah pernah dibuat.',
    PROFILE_NOT_FOUND: 'Profil pengguna belum tersedia.',
    NO_SAFE_RECOMMENDATION:
      'Belum ada kombinasi menu yang aman untuk profil dan tanggal ini.',
    NO_SAFE_ALTERNATIVE:
      'Belum ada menu pengganti yang aman untuk slot makan ini.',
    RECOMMENDATION_ITEM_CHANGED:
      'Menu pada slot ini sudah berubah. Muat ulang rekomendasi sebelum mengganti lagi.',
    VALIDATION_ERROR: 'Data yang dikirim belum valid.',
  }

  return messages[error.code] ?? fallback
}
