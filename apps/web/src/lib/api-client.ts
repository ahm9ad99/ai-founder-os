import { auth } from '@clerk/nextjs/server'

const API_BASE = process.env.API_URL || 'http://localhost:4000'

async function getAuthHeaders(): Promise<HeadersInit> {
  const { getToken } = auth()
  const token = await getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = await getAuthHeaders()
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiClient<T>(endpoint)
}

export async function apiPost<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiClient<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function apiPut<T>(endpoint: string, data?: unknown): Promise<T> {
  return apiClient<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiClient<T>(endpoint, {
    method: 'DELETE',
  })
}


