import React, {useEffect, useState} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// 💡 백엔드 DTO와 일치하는 인터페이스
interface BookInfo {
    title: string;
    subtitle: string;
    author: string;
}

interface BorrowInfo {
    memberId: number;
    username: string;
    title: string;
    subtitle: string;
    author: string;
    borrowedAt: string; // ISO 8601 (e.g. "2026-04-07T10:30:00")
}

function getMemberIdFromToken(token: string): number | null {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.memberId ?? null;
    } catch {
        return null;
    }
}

const LOAN_DAYS = 3;

function getDDayInfo(borrowedAt: string): { label: string; isOverdue: boolean; isSoon: boolean } {
    const due = new Date(borrowedAt);
    due.setDate(due.getDate() + LOAN_DAYS);
    due.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    const dueStr = `${due.getMonth() + 1}월 ${due.getDate()}일`;

    if (diff > 0)  return { label: `반납 기한: ${dueStr} (D-${diff})`, isOverdue: false, isSoon: diff <= 1 };
    if (diff === 0) return { label: `반납 기한: 오늘 (D-Day)`,           isOverdue: false, isSoon: true };
    return             { label: `반납 기한 초과 (D+${Math.abs(diff)})`,  isOverdue: true,  isSoon: false };
}

const BookDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

const [book, setBook] = useState<BookInfo | null>(null);
    const [borrowInfo, setBorrowInfo] = useState<BorrowInfo | null>(null);
    const [myMemberId, setMyMemberId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

    // 💡 초기 데이터 로딩 (책 정보 + 대출 상태 + 내 정보)
    useEffect(() => {
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

                // 3. JWT에서 memberId 추출
                if (token) {
                    setMyMemberId(getMemberIdFromToken(token));
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
            alert("로그인이 필요한 기능입니다.");
            sessionStorage.setItem('redirectAfterLogin', location.pathname);
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
    const isBorrowedByMe = borrowInfo && borrowInfo.memberId === myMemberId;
    const dday = borrowInfo ? getDDayInfo(borrowInfo.borrowedAt) : null;

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>{book.title}</h1>
                <h3 style={styles.subtitle}>{book.subtitle}</h3>
                <p style={styles.author}><strong>저자:</strong> {book.author}</p>

                <div style={styles.statusBox(isAvailable, dday?.isOverdue, dday?.isSoon)}>
                    {isAvailable
                        ? '대출 가능합니다.'
                        : isBorrowedByMe
                            ? `내가 대출 중 · ${dday!.label}`
                            : `[${borrowInfo!.username}]님이 대출 중 · ${dday!.label}`}
                </div>

                <div style={styles.buttonGroup}>
                    {/* 대출/반납 버튼 렌더링 */}
                    {isAvailable ? (
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
                            <button onClick={handleBorrow} style={styles.primaryBtn}>대출하기</button>
                            <p style={styles.loanHint}>대출 기한은 3일입니다.</p>
                        </div>
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
    container: { maxWidth: '600px', margin: '24px auto', fontFamily: "'Pretendard', sans-serif", padding: '0 16px', boxSizing: 'border-box' as const, width: '100%' },
    card: { background: 'white', padding: '24px 20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    title: { fontSize: '22px', margin: '0 0 8px 0', color: '#222', wordBreak: 'break-word' as const },
    subtitle: { fontSize: '15px', margin: '0 0 16px 0', color: '#666', fontWeight: 'normal', wordBreak: 'break-word' as const },
    author: { fontSize: '15px', margin: '0 0 20px 0' },
    statusBox: (isAvailable?: boolean, isOverdue?: boolean, isSoon?: boolean) => ({
        padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: 'bold' as const, textAlign: 'center' as const,
        background: isAvailable ? '#e6f4ea' : isOverdue ? '#fdecea' : isSoon ? '#fff8e1' : '#f8f9fa',
        color:      isAvailable ? '#137333' : isOverdue ? '#c62828' : isSoon ? '#e65100' : '#444',
    }),
    buttonGroup: { display: 'flex', gap: '10px', alignItems: 'stretch' },
    primaryBtn: { flex: 1, padding: '13px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', minWidth: 0 },
    returnBtn: { flex: 1, padding: '13px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', minWidth: 0 },
    disabledBtn: { flex: 1, padding: '13px', background: '#e9ecef', color: '#adb5bd', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontWeight: 'bold', fontSize: '15px', minWidth: 0 },
    secondaryBtn: { padding: '13px 16px', background: '#f1f3f5', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' as const, flexShrink: 0 },
    loanHint: { margin: 0, fontSize: '13px', color: '#888', textAlign: 'center' as const },
};

export default BookDetailPage;
