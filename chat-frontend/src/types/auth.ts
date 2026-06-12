export interface LoginRequest {
    username: string
    password: string
}

export interface RegisterRequest {
    username: string
    password: string
    email: string
}

export interface AuthResponse {
    token: string
    username: string
    id: number
}

export interface User {
    id: number
    username: string
}