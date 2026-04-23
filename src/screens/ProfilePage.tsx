import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type MyBorrow = {
    borrowId: number;
    bookItemId: number;
    bookId: number;
    title: string;
    subtitle: string;
    author: string;
    borrowedAt: string;
    dueAt: string;
};

function daysLeft(dueAt: string): number {
    const due = new Date(dueAt).getTime();
    const now = Date.now();
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

    const [currentName, setCurrentName] = useState<string>('');
    const [newName, setNewName] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [borrows, setBorrows] = useState<MyBorrow[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("로그인이 필요합니다.");
            navigate('/login');
            return;
        }

        // 1. 내 닉네임
        const fetchMyInfo = async () => {
            try {
                const res = await fetch(`${BASE_URL}/oauth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const name = await res.text();
                    setCurrentName(name);
                    setNewName(name);
                }
            } catch (e) { console.error("내 정보 조회 실패:", e); }
        };

        // 2. 내가 빌린 책
        const fetchMyBorrows = async () => {
            try {
                const res = await fetch(`${BASE_URL}/borrows/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setBorrows(await res.json());
            } catch (e) { console.error("빌린 책 조회 실패:", e); }
        };

        Promise.all([fetchMyInfo(), fetchMyBorrows()]).finally(() => setIsLoading(false));
    }, [navigate, BASE_URL]);

    const handleUpdateUsername = async () => {
        if (!newName.trim()) { alert("변경할 닉네임을 입력해 주세요."); return; }
        if (newName === currentName) { alert("현재 닉네임과 동일합니다."); return; }

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${BASE_URL}/oauth/username?username=${encodeURIComponent(newName)}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert("닉네임이 성공적으로 변경되었습니다! 🎉");
                setCurrentName(newName);
                navigate('/');
            } else {
                alert("닉네임 변경에 실패했습니다.");
            }
        } catch (e) {
            console.error("닉네임 변경 오류:", e);
            alert("서버와 통신 중 오류가 발생했습니다.");
        }
    };

    const handleLogout = () => {
        if (window.confirm("정말 로그아웃 하시겠습니까?")) {
            localStorage.removeItem('token');
            alert("로그아웃 되었습니다.");
            navigate('/');
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: 50 }}>로딩 중...</div>;

    const overdueCount = borrows.filter(b => daysLeft(b.dueAt) < 0).length;

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>👤 마이페이지</h2>

                {/* === 닉네임 설정 === */}
                <div style={styles.inputGroup}>
                    <label style={styles.label}>우테코 닉네임</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        style={styles.input}
                        placeholder="우테코 닉네임을 입력하세요"
                    />
                </div>
                <div style={styles.buttonGroup}>
                    <button onClick={handleUpdateUsername} style={styles.saveBtn}>저장하기</button>
                    <button onClick={() => navigate('/')} style={styles.cancelBtn}>목록으로</button>
                </div>

                <hr style={styles.divider} />

                {/* === 내가 빌린 책 === */}
                <h3 style={styles.sectionTitle}>📚 내가 빌린 책 ({borrows.length}권)</h3>

                {/* 🔔 연체 알림 */}
                {overdueCount > 0 && (
                    <div style={styles.alertBanner}>
                        ⚠️ <b>{overdueCount}권</b>이 연체되었습니다. 가능한 빨리 반납해 주세요!
                    </div>
                )}

                {borrows.length === 0 ? (
                    <p style={styles.emptyText}>현재 대출 중인 책이 없습니다.</p>
                ) : (
                    <ul style={styles.list}>
                        {borrows.map(b => {
                            const d = daysLeft(b.dueAt);
                            const isOverdue = d < 0;
                            return (
                                <li
                                    key={b.borrowId}
                                    style={{
                                        ...styles.borrowCard,
                                        border: isOverdue ? '2px solid #dc3545' : '1px solid #eee',
                                    }}
                                    onClick={() => navigate(`/books/${b.bookItemId}`)}
                                >
                                    <div style={styles.cardMain}>
                                        <div style={styles.bookTitle}>{b.title}</div>
                                        <div style={styles.bookMeta}>{b.author}</div>
                                        <div style={styles.bookDate}>
                                            빌린 날: {formatDate(b.borrowedAt)} · 반납 기한: {formatDate(b.dueAt)}
                                        </div>
                                    </div>
                                    <div style={{
                                        ...styles.ddayBadge,
                                        background: isOverdue ? '#dc3545' : d <= 1 ? '#ff9800' : '#4caf50',
                                    }}>
                                        {isOverdue ? `연체 ${Math.abs(d)}일` : d === 0 ? '오늘 반납' : `D-${d}`}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <hr style={styles.divider} />

                {/* === 유틸리티 === */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button onClick={handleLogout} style={styles.logoutBtn}>로그아웃</button>
                    <button style={styles.deleteBtn} onClick={() => alert("회원탈퇴 기능은 준비중입니다.")}>회원탈퇴</button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { maxWidth: 600, margin: '40px auto', fontFamily: "'Pretendard', sans-serif", padding: '0 16px' },
    card: { background: 'white', padding: 30, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    title: { fontSize: 22, margin: '0 0 24px 0', color: '#333', textAlign: 'center' as const },
    sectionTitle: { fontSize: 17, margin: '0 0 14px 0', color: '#333' },
    inputGroup: { marginBottom: 20 },
    label: { display: 'block', marginBottom: 8, fontSize: 14, color: '#666', fontWeight: 'bold' as const },
    input: { width: '100%', padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' as const },
    buttonGroup: { display: 'flex', gap: 10 },
    saveBtn: { flex: 2, padding: 14, background: '#007bff', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' as const, fontSize: 16 },
    cancelBtn: { flex: 1, padding: 14, background: '#e9ecef', color: '#333', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' as const, fontSize: 16 },
    divider: { border: 'none', borderTop: '1px solid #eee', margin: '30px 0 20px 0' },

    alertBanner: {
        background: '#fff3cd', color: '#856404', padding: '12px 14px',
        borderRadius: 8, marginBottom: 14, border: '1px solid #ffeaa7', fontSize: 14,
    },
    emptyText: { textAlign: 'center' as const, color: '#aaa', padding: '20px 0' },
    list: { listStyle: 'none', padding: 0, margin: 0 },
    borrowCard: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 14, marginBottom: 10, background: '#fafafa',
        borderRadius: 10, cursor: 'pointer',
    },
    cardMain: { flex: 1, minWidth: 0 },
    bookTitle: { fontSize: 15, fontWeight: 'bold' as const, marginBottom: 3 },
    bookMeta: { fontSize: 12, color: '#888', marginBottom: 4 },
    bookDate: { fontSize: 11, color: '#aaa' },
    ddayBadge: {
        color: 'white', padding: '6px 10px', borderRadius: 14,
        fontSize: 12, fontWeight: 'bold' as const, marginLeft: 10, whiteSpace: 'nowrap' as const,
    },

    logoutBtn: { padding: '8px 16px', background: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' },
    deleteBtn: { padding: '8px 16px', background: 'transparent', color: '#dc3545', border: 'none', textDecoration: 'underline', cursor: 'pointer' }
};

export default ProfilePage;
