const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Erro na API');
  }

  return res.json();
}