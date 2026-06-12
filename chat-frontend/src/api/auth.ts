import api from './axios'
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth'

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data)
  return response.data
}

export const register = async (data: RegisterRequest): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/register', data)
  return response.data
}