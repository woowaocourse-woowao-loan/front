import React, {useEffect, useRef, useState} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// 💡 백엔드 DTO와 일치하는 인터페이스
interface BookInfo {
    title: string;
    subtitle: string;
    author: string;
}

interface BorrowInfo {
    username: string;
    title: string;
    subtitle: string;
    author: string;
}

const BookDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const isRedirecting = useRef(false);

    const [book, setBook] = useState<BookInfo | null>(null);
    const [borrowInfo, setBorrowInfo] = useState<BorrowInfo | null>(null);
    const [myUsername, setMyUsername] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const BASE_URL = 'http://localhost:8080';

    // 💡 초기 데이터 로딩 (책 정보 + 대출 상태 + 내 정보)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            if (!isRedirecting.current) {
                isRedirecting.current = true;
                alert("로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.")
                sessionStorage.setItem('redirectAfterLogin', location.pathname);
                navigate('/login');
            }
            return;
        }

        const fetchAllData = async () => {
            try {
                const token = localStorage.getItem('token');

                // 1. 책 기본 정보 가져오기 (GET /books/{id})
                const bookRes = await fetch(`${BASE_URL}/books/${id}`);
                if (bookRes.ok) setBook(await bookRes.json());

                // 2. 대출 상태 확인하기 (GET /borrows/{bookId})
                const borrowRes = await fetch(`${BASE_URL}/borrows/${id}`);
                if (borrowRes.status === 200) {
                    setBorrowInfo(await borrowRes.json()); // 대출 중인 정보 저장
                } else if (borrowRes.status === 204) {
                    setBorrowInfo(null); // 204 No Content면 대출 가능 상태
                }

                // 3. 로그인한 내 이름 가져오기 (GET /oauth/me)
                if (token) {
                    const meRes = await fetch(`${BASE_URL}/oauth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (meRes.ok) {
                        const name = await meRes.text();
                        setMyUsername(name); // 내 이름 저장 (반납 권한 확인용)
                    }
                }
            } catch (error) {
                console.error("데이터 로딩 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, [id, navigate, location.pathname]);

    // 💡 대출하기 (POST /borrows/{bookId})
    const handleBorrow = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("로그인이 필요합니다.");
            navigate('/login');
            return;
        }

        const res = await fetch(`${BASE_URL}/borrows/${id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 201) {
            alert("성공적으로 대출되었습니다!");
            window.location.reload();
        } else {
            alert("대출에 실패했습니다.");
        }
    };

    // 💡 반납하기 (PATCH /borrows/{bookId})
    const handleReturn = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE_URL}/borrows/${id}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            alert("성공적으로 반납되었습니다!");
            window.location.reload();
        } else {
            alert("반납 처리에 실패했습니다.");
        }
    };

    if (isLoading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>로딩 중...</div>;
    if (!book) return <div style={{ textAlign: 'center', marginTop: '50px' }}>책을 찾을 수 없습니다.</div>;

    // 💡 버튼 상태 계산 로직
    const isAvailable = borrowInfo === null;
    const isBorrowedByMe = borrowInfo && borrowInfo.username === myUsername;

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>{book.title}</h1>
                <h3 style={styles.subtitle}>{book.subtitle}</h3>
                <p style={styles.author}><strong>저자:</strong> {book.author}</p>

                <div style={styles.statusBox(isAvailable)}>
                    {isAvailable ? '🟢 현재 대출 가능합니다.' :
                        isBorrowedByMe ? '🟡 내가 대출 중인 도서입니다.' :
                            `🔴 [${borrowInfo.username}]님이 대출 중입니다.`}
                </div>

                <div style={styles.buttonGroup}>
                    {/* 대출/반납 버튼 렌더링 */}
                    {isAvailable ? (
                        <button onClick={handleBorrow} style={styles.primaryBtn}>대출하기</button>
                    ) : isBorrowedByMe ? (
                        <button onClick={handleReturn} style={styles.returnBtn}>반납하기</button>
                    ) : (
                        <button disabled style={styles.disabledBtn}>대출 불가</button>
                    )}

                    <button onClick={() => navigate('/')} style={styles.secondaryBtn}>목록으로</button>
                </div>
            </div>
        </div>
    );
};

// CSS 스타일 객체
const styles = {
    container: { maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif' },
    card: { background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    title: { fontSize: '24px', margin: '0 0 8px 0', color: '#222' },
    subtitle: { fontSize: '16px', margin: '0 0 20px 0', color: '#666', fontWeight: 'normal' },
    author: { fontSize: '16px', margin: '0 0 24px 0' },
    statusBox: (isAvailable: boolean) => ({
        padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: 'bold' as const, textAlign: 'center' as const,
        background: isAvailable ? '#e6f4ea' : '#f8f9fa',
        color: isAvailable ? '#137333' : '#444'
    }),
    buttonGroup: { display: 'flex', gap: '12px' },
    primaryBtn: { flex: 1, padding: '14px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    returnBtn: { flex: 1, padding: '14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    disabledBtn: { flex: 1, padding: '14px', background: '#e9ecef', color: '#adb5bd', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontWeight: 'bold' },
    secondaryBtn: { padding: '14px 20px', background: '#f1f3f5', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' },
};

export default BookDetailPage;
