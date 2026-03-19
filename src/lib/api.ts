const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type ApiError = {
  error?: string
  message?: string
}

export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!res.ok) {
    let errorData: ApiError = {}

    try {
      errorData = (await res.json()) as ApiError
    } catch {
      // resposta não é JSON
    }

    throw new Error(
      errorData.error || errorData.message || 'Erro na API'
    )
  }

  return res.json()
}