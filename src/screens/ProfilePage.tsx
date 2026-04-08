import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const BASE_URL = 'http://localhost:8080';

    const [currentName, setCurrentName] = useState<string>('');
    const [newName, setNewName] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // 💡 1. 페이지 접속 시 내 현재 이름 가져오기 (GET /oauth/me)
    useEffect(() => {
        const fetchMyInfo = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("로그인이 필요합니다.");
                navigate('/login');
                return;
            }

            try {
                const res = await fetch(`${BASE_URL}/oauth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const name = await res.text();
                    setCurrentName(name); // 현재 이름 표시용
                    setNewName(name);     // 입력창 기본값 세팅
                }
            } catch (error) {
                console.error("내 정보 조회 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMyInfo();
    }, [navigate]);

    // 💡 2. 닉네임 변경 요청 (PATCH /oauth/username)
    const handleUpdateUsername = async () => {
        if (!newName.trim()) {
            alert("변경할 닉네임을 입력해 주세요.");
            return;
        }

        if (newName === currentName) {
            alert("현재 닉네임과 동일합니다.");
            return;
        }

        const token = localStorage.getItem('token');
        try {
            // @RequestParam 방식이므로 URL 파라미터로 붙여서 전송합니다. (한글 깨짐 방지를 위해 인코딩 필수!)
            const res = await fetch(`${BASE_URL}/oauth/username?username=${encodeURIComponent(newName)}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                alert("닉네임이 성공적으로 변경되었습니다! 🎉");
                setCurrentName(newName);

                // 변경 후 메인 페이지(도서 목록)로 이동
                navigate('/');
            } else {
                alert("닉네임 변경에 실패했습니다.");
            }
        } catch (error) {
            console.error("닉네임 변경 오류:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        }
    };

    // 💡 3. 로그아웃 처리
    const handleLogout = () => {
        if (window.confirm("정말 로그아웃 하시겠습니까?")) {
            localStorage.removeItem('token');
            alert("로그아웃 되었습니다.");
            navigate('/');
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>로딩 중...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>👤 마이페이지 / 프로필 설정</h2>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>현재 닉네임 (또는 임시 발급 닉네임)</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        style={styles.input}
                        placeholder="사용할 닉네임을 입력하세요"
                    />
                </div>

                <div style={styles.buttonGroup}>
                    <button onClick={handleUpdateUsername} style={styles.saveBtn}>
                        저장하기
                    </button>
                    <button onClick={() => navigate('/')} style={styles.cancelBtn}>
                        취소
                    </button>
                </div>

                <hr style={styles.divider} />

                {/* 하단 유틸리티 버튼들 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <button onClick={handleLogout} style={styles.logoutBtn}>로그아웃</button>
                    {/* 회원 탈퇴(DELETE /oauth/user) API를 연결할 수 있는 자리입니다. */}
                    <button style={styles.deleteBtn} onClick={() => alert("회원탈퇴 기능은 준비중입니다.")}>회원탈퇴</button>
                </div>
            </div>
        </div>
    );
};

// CSS 스타일 (다른 페이지들과 통일감을 맞춤)
const styles = {
    container: { maxWidth: '500px', margin: '50px auto', fontFamily: 'sans-serif' },
    card: { background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    title: { fontSize: '22px', margin: '0 0 24px 0', color: '#333', textAlign: 'center' as const },
    inputGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666', fontWeight: 'bold' },
    input: { width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' as const },
    buttonGroup: { display: 'flex', gap: '10px' },
    saveBtn: { flex: 2, padding: '14px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
    cancelBtn: { flex: 1, padding: '14px', background: '#e9ecef', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
    divider: { border: 'none', borderTop: '1px solid #eee', margin: '30px 0 20px 0' },
    logoutBtn: { padding: '8px 16px', background: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' },
    deleteBtn: { padding: '8px 16px', background: 'transparent', color: '#dc3545', border: 'none', textDecoration: 'underline', cursor: 'pointer' }
};

export default ProfilePage;
