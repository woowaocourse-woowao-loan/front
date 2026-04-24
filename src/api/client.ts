export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
    constructor(message: string, public status: number) {
        super(message);
        this.name = 'ApiError';
    }
}

function handleAuthFailure(): void {
    localStorage.removeItem('token');
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = '/login';
}

/**
 * 공통 fetch 래퍼.
 * - BASE_URL 자동 prefix
 * - auth: true → localStorage 토큰을 Authorization 헤더에 자동 첨부
 * - 401 응답 → 토큰 삭제 + /login 리다이렉트 (자동 로그아웃)
 */
export async function apiFetch(
    path: string,
    options: RequestInit & { auth?: boolean } = {}
): Promise<Response> {
    const { auth = false, headers: rawHeaders, ...rest } = options;

    const headers = new Headers(rawHeaders as HeadersInit | undefined);

    if (auth) {
        const token = localStorage.getItem('token');
        if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

    if (res.status === 401) {
        handleAuthFailure();
        throw new ApiError('Unauthorized', 401);
    }

    return res;
}
