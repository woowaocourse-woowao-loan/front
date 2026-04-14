import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../App.css';
import logo from "../assets/logo.png";

interface Book {
    id: number;
    title: string;
    subtitle: string;
    author: string;
    isBorrowed?: boolean;
}

const PAGE_SIZE = 20;

const BookListPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const BASE_URL = useMemo(() => import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080', []);

    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [page, setPage] = useState<number>((location.state as { page?: number } | null)?.page ?? 1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalElements, setTotalElements] = useState<number>(0);

    useEffect(() => {
        if (localStorage.getItem('token')) setIsLoggedIn(true);
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. 책 목록 가져오기 (signal 전달)
                const bookRes = await fetch(
                    `${BASE_URL}/books?page=${page - 1}&size=${PAGE_SIZE}&sort=title,asc&sort=author,asc`,
                    { signal }
                );
                if (!bookRes.ok) throw new Error('Fetch failed');

                const data: { content: Book[]; totalPages: number; totalElements: number } = await bookRes.json();

                // 2. 개별 도서 대출 상태 확인 (모든 fetch에 signal 전달)
                const statuses = await Promise.all(
                    data.content.map(book =>
                        fetch(`${BASE_URL}/borrows/${book.id}`, { signal })
                            .then(res => ({ id: book.id, isBorrowed: res.status === 200 }))
                            .catch(err => {
                                if (err.name === 'AbortError') throw err;
                                return { id: book.id, isBorrowed: false };
                            })
                    )
                );

                const statusMap = Object.fromEntries(statuses.map(s => [s.id, s.isBorrowed]));

                // 데이터 업데이트
                setBooks(data.content.map(book => ({ ...book, isBorrowed: statusMap[book.id] })));
                setTotalPages(data.totalPages);
                setTotalElements(data.totalElements);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    if (err.name === 'AbortError') {
                        console.log('이전 요청 취소됨');
                    } else {
                        console.error('에러 발생:', err.message);
                    }
                }
            } finally {
                // signal이 취소되지 않았을 때만 로딩 상태 해제
                if (!signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        // 클린업 함수: 페이지를 이탈하거나 다음 페이지 클릭 시 진행 중인 모든 fetch 중단
        return () => controller.abort();
    }, [page, BASE_URL]);

    const handleLogout = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            localStorage.removeItem('token');
            setIsLoggedIn(false);
        }
    };

    // 페이지네이션 배열 생성 최적화 (totalPages가 바뀔 때만 재계산)
    const pageNumbers = useMemo(() =>
            Array.from({ length: totalPages }, (_, i) => i + 1),
        [totalPages]);

    if (isLoading) return <div className="bl-loading">불러오는 중...</div>;

    return (
        <div className="bl-container">
            <div className="bl-header">
                <img src={logo} alt="우아론 로고" className="bl-logo" />
                <div className="bl-header-right">
                    <span className="bl-count">총 {totalElements}권</span>
                    {isLoggedIn ? (
                        <>
                            <button onClick={() => navigate('/profile')} className="bl-btn bl-btn-ghost">마이페이지</button>
                            <button onClick={handleLogout} className="bl-btn bl-btn-danger">로그아웃</button>
                        </>
                    ) : (
                        <button onClick={() => navigate('/login')} className="bl-btn bl-btn-primary">로그인</button>
                    )}
                </div>
            </div>

            {books.length === 0 ? (
                <div className="bl-empty">등록된 도서가 없습니다.</div>
            ) : (
                <>
                    {/* 테이블 — 태블릿·데스크톱 */}
                    <div className="bl-table-wrap">
                        <table className="bl-table">
                            <thead>
                                <tr>
                                    <th>도서명</th>
                                    <th style={{ width: '150px' }}>저자</th>
                                    <th style={{ width: '86px', textAlign: 'center' }}>상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {books.map((book) => (
                                    <tr key={book.id} onClick={() => navigate(`/books/${book.id}`, { state: { fromPage: page } })}>
                                        <td>
                                            <span className="bl-book-title">{book.title}</span>
                                            {book.subtitle && <span className="bl-book-sub">— {book.subtitle}</span>}
                                        </td>
                                        <td className="bl-author">{book.author.split(',')[0].trim()}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={book.isBorrowed ? 'bl-badge-no' : 'bl-badge-ok'}>
                                                {book.isBorrowed ? '대출 중' : '대출 가능'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bl-list">
                        {books.map((book) => (
                            <div key={book.id} className="bl-list-item" onClick={() => navigate(`/books/${book.id}`, { state: { fromPage: page } })}>
                                <div className="bl-list-info">
                                    <div className="bl-list-title">{book.title}</div>
                                    <div className="bl-list-author">{book.author.split(',')[0].trim()}</div>
                                </div>
                                <div className="bl-list-badge">
                                    <span className={book.isBorrowed ? 'bl-badge-no' : 'bl-badge-ok'}>
                                        {book.isBorrowed ? '대출 중' : '대출 가능'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="bl-pagination">
                            <button className="bl-page-btn" disabled={page === 1}
                                onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}>
                                이전
                            </button>
                            {pageNumbers.map(p => (
                                <button key={p}
                                    className={`bl-page-btn${p === page ? ' bl-page-btn-active' : ''}`}
                                    onClick={() => { setPage(p); window.scrollTo(0, 0); }}>
                                    {p}
                                </button>
                            ))}
                            <button className="bl-page-btn" disabled={page === totalPages}
                                onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}>
                                다음
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BookListPage;
