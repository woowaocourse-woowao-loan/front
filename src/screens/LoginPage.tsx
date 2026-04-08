import React from 'react';

const LoginPage: React.FC = () => {
    const BASE_URL = 'http://localhost:8080';

    const handleLogin = (provider: string) => {
        window.location.href = `${BASE_URL}/oauth/${provider}`;
    };

    return (
        <div style={styles.container}>
            <div style={styles.box}>
                <h2>🔐 로그인</h2>
                <p>서비스를 이용하려면 로그인이 필요합니다.</p>
                <button onClick={() => handleLogin('KAKAO')} style={{ ...styles.btn, ...styles.kakao }}>
                    카카오로 로그인
                </button>
                <button onClick={() => handleLogin('GITHUB')} style={{ ...styles.btn, ...styles.github }}>
                    GitHub로 로그인
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', marginTop: '100px', fontFamily: "'Pretendard', sans-serif" },
    box: { padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center' as const, background: 'white' },
    btn: { width: '100%', padding: '14px', margin: '8px 0', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    kakao: { background: '#FEE500', color: '#000' },
    github: { background: '#24292e', color: '#fff' }
};

export default LoginPage;
