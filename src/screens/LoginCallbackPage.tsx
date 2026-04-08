import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

const LoginCallbackPage: React.FC = () => {
    const { provider } = useParams<{ provider: string }>(); // URL에서 kakao 또는 github 추출
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const code = searchParams.get('code');
    const isCalled = useRef(false); // React 18 StrictMode의 두 번 실행 방지용

    useEffect(() => {
        // 코드와 프로바이더가 있고, 한 번도 호출되지 않았을 때만 실행
        if (code && provider && !isCalled.current) {
            isCalled.current = true;

            // 백엔드의 OauthController.login() API 호출
            // enum 타입 매칭을 위해 대문자로 변환 (kakao -> KAKAO)
            fetch(`http://localhost:8080/oauth/login/${provider.toUpperCase()}?code=${code}`)
                .then(res => {
                    if (!res.ok) throw new Error("로그인 처리에 실패했습니다.");
                    return res.json();
                })
                .then(data => {
                    if (data.token) {
                        // 1. 발급받은 JWT 토큰을 브라우저에 저장
                        localStorage.setItem('token', data.token);

                        // 2. 신규 유저라면 환영 알림
                        if (data.isNewUser) {
                            alert("환영합니다! 신규 회원가입이 완료되었습니다.");
                        }

                        // 3. 메인 페이지(도서 목록)로 이동!
                        navigate('/', { replace: true });
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert("로그인 중 오류가 발생했습니다.");
                    navigate('/login', { replace: true });
                });
        }
    }, [code, provider, navigate]);

    // 사용자는 아주 잠깐 이 화면을 보게 됩니다.
    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px', fontSize: '20px' }}>
            🔄 {provider === 'kakao' ? '카카오' : 'GitHub'} 로그인 처리 중...
        </div>
    );
};

export default LoginCallbackPage;
