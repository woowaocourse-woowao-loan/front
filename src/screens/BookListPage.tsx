import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalElements, setTotalElements] = useState<number>(0);

    useEffect(() => {
        if (localStorage.getItem('token')) setIsLoggedIn(true);
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetch(`${BASE_URL}/books?page=${page - 1}&size=${PAGE_SIZE}&sort=title,asc&sort=author,asc`)
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(async (data: { content: Book[]; totalPages: number; totalElements: number }) => {
                const statuses = await Promise.all(
                    data.content.map(book =>
                        fetch(`${BASE_URL}/borrows/${book.id}`)
                            .then(res => ({ id: book.id, isBorrowed: res.status === 200 }))
                            .catch(() => ({ id: book.id, isBorrowed: false }))
                    )
                );
                const statusMap = Object.fromEntries(statuses.map(s => [s.id, s.isBorrowed]));
                setBooks(data.content.map(book => ({ ...book, isBorrowed: statusMap[book.id] })));
                setTotalPages(data.totalPages);
                setTotalElements(data.totalElements);
            })
            .catch(() => console.error('책 목록을 불러오지 못했습니다.'))
            .finally(() => setIsLoading(false));
    }, [page]);

    const handleLogout = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            localStorage.removeItem('token');
            setIsLoggedIn(false);
        }
    };


    if (isLoading) return <div className="bl-loading">불러오는 중...</div>;

    return (
        <div className="bl-container">
            {/* 헤더 */}
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
                                    <th style={{ width: '72px' }}>번호</th>
                                    <th>도서명</th>
                                    <th style={{ width: '150px' }}>저자</th>
                                    <th style={{ width: '86px', textAlign: 'center' }}>상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {books.map((book, i) => (
                                    <tr key={book.id} onClick={() => navigate(`/books/${book.id}`)}>
                                        <td className="bl-id">#{(page - 1) * PAGE_SIZE + i + 1}</td>
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

                    {/* 카드 목록 — 모바일 */}
                    <div className="bl-list">
                        {books.map((book, i) => (
                            <div key={book.id} className="bl-list-item" onClick={() => navigate(`/books/${book.id}`)}>
                                <span className="bl-list-id">#{(page - 1) * PAGE_SIZE + i + 1}</span>
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

                    {/* 페이지네이션 */}
                    {totalPages > 1 && (
                        <div className="bl-pagination">
                            <button className="bl-page-btn" disabled={page === 1}
                                onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}>
                                이전
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
