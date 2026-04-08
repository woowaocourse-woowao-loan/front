import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 💡 프론트엔드에서 사용할 책 데이터 타입
interface Book {
    id: number;         // (중요) 상세 페이지 이동을 위해 반드시 필요한 식별자
    title: string;
    subtitle: string;
    author: string;
}

const BookListPage: React.FC = () => {
    const navigate = useNavigate();
    const BASE_URL = 'http://localhost:8080';

    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
    // 💡 페이지가 열릴 때 백엔드에서 책 목록 가져오기
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
        }
        const fetchBooks = async () => {
            try {
                const response = await fetch(`${BASE_URL}/books`);
                if (response.ok) {
                    const data = await response.json();
                    setBooks(data);
                } else {
                    console.error("책 목록을 불러오지 못했습니다.");
                }
            } catch (error) {
                console.error("서버 통신 오류:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBooks();
    }, []);

    const handleLogout = () => {
        if (window.confirm("로그아웃 하시겠습니까?")) {
            localStorage.removeItem('token'); // 토큰 삭제
            setIsLoggedIn(false); // 상태 업데이트 (화면 즉시 반영)
            alert("로그아웃 되었습니다.");
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>책 목록을 불러오는 중... 📚</div>;

    return (
        <div style={styles.container}>
            {/* 상단 헤더 영역 */}
            <div style={styles.header}>
                <h1 style={styles.title}>📚 우아한 도서관</h1>
                <div style={styles.headerButtons}>
                    {isLoggedIn ? (
                        <>
                            <button onClick={() => navigate('/profile')} style={styles.profileBtn}>마이페이지</button>
                            <button onClick={handleLogout} style={styles.logoutBtn}>로그아웃</button>
                        </>
                    ) : (
                        <button onClick={() => navigate('/login')} style={styles.loginBtn}>로그인</button>
                    )}
                </div>
            </div>

            {/* 책 목록 그리드 (비어있을 경우 안내 문구) */}
            {books.length === 0 ? (
                <div style={styles.emptyState}>현재 등록된 도서가 없습니다.</div>
            ) : (
                <div style={styles.grid}>
                    {books.map((book) => (
                        <div
                            key={book.id}
                            style={styles.card}
                            // 💡 카드를 클릭하면 해당 책의 ID를 들고 상세 페이지로 이동!
                            onClick={() => navigate(`/books/${book.id}`)}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={styles.cardHeader}>
                                <h3 style={styles.bookTitle}>{book.title}</h3>
                                <p style={styles.bookSubtitle}>{book.subtitle}</p>
                            </div>
                            <div style={styles.cardFooter}>
                                <span style={styles.author}>✍️ {book.author}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// CSS 스타일 (그리드 레이아웃 적용)
const styles: {[key: string]: React.CSSProperties}= {
    container: { maxWidth: '1000px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px', marginBottom: '40px', paddingBottom: '20px', borderBottom: '2px solid #f1f3f5' },
    title: { fontSize: '28px', color: '#222', margin: 0 },
    headerButtons: { display: 'flex', gap: '10px' },
    profileBtn: { padding: '8px 16px', background: '#f8f9fa', color: '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    loginBtn: { padding: '8px 16px', background: '#24292e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    logoutBtn: { padding: '8px 16px', background: 'white', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
    emptyState: { textAlign: 'center' as const, color: '#888', marginTop: '60px', fontSize: '18px' },

    // 카드 스타일
    card: {
        display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between',
        background: 'white', padding: '24px', borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)', cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        border: '1px solid #f1f3f5', height: '100%'
    },
    cardHeader: { marginBottom: '20px' },
    bookTitle: { fontSize: '20px', margin: '0 0 8px 0', color: '#333', lineHeight: '1.4' },
    bookSubtitle: { fontSize: '14px', margin: 0, color: '#666', lineHeight: '1.4' },
    cardFooter: { display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f1f3f5' },
    author: { fontSize: '14px', color: '#555', fontWeight: 'bold' }
};

export default BookListPage;
