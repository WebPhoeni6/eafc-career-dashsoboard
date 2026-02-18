import { request } from './http';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface SignupInput {
  email: string;
  password: string;
  username: string;
  avatarUrl?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ForgotPasswordResponse {
  sent: boolean;
  message: string;
  resetToken?: string;
  resetUrl?: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export async function signup(input: SignupInput): Promise<{ user: AuthUser; accessToken: string }> {
  return request('/api/auth/signup', {
    method: 'POST',
    body: input,
    skipAuth: true,
  });
}

export async function login(input: LoginInput): Promise<{ user: AuthUser; accessToken: string }> {
  return request('/api/auth/login', {
    method: 'POST',
    body: input,
    skipAuth: true,
  });
}

export async function refresh(): Promise<{ accessToken: string }> {
  return request('/api/auth/refresh', {
    method: 'POST',
    skipAuth: true,
    retryOn401: false,
  });
}

export async function logout(): Promise<void> {
  await request('/api/auth/logout', {
    method: 'POST',
    skipAuth: true,
    retryOn401: false,
  });
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: input,
    skipAuth: true,
    retryOn401: false,
  });
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await request('/api/auth/reset-password', {
    method: 'POST',
    body: input,
    skipAuth: true,
    retryOn401: false,
  });
}
