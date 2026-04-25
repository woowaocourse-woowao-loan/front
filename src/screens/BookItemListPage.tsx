import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import '../App.css';
import logo from '../assets/logo.svg';
import { apiFetch } from '../api/client';

interface BookInfo {
    id: number;
    title: string;
    subtitle: string;
    author: string;
    stock: number;
    numOfBooks: number;
}

interface BookItemInfo {
    id: number;
    borrowStatus: 'BORROWED' | 'RETURNED';
}

interface BookDetailInfo {
    bookInfo: BookInfo;
    bookItemInfos: BookItemInfo[];
}

const BookItemListPage: React.FC = () => {
    const { bookId } = useParams<{ bookId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [bookDetail, setBookDetail] = useState<BookDetailInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    const fromPage = (location.state as { fromPage?: number } | null)?.fromPage ?? 1;

    useEffect(() => {
        if (localStorage.getItem('token')) setIsLoggedIn(true);

        const controller = new AbortController();

        apiFetch(`/books/${bookId}`, { signal: controller.signal })
            .then(res => res.ok ? res.json() : null)
            .then(data => setBookDetail(data))
            .catch(() => {})
            .finally(() => setIsLoading(false));

        return () => controller.abort();
    }, [bookId]);

    const handleLogout = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            localStorage.removeItem('token');
            setIsLoggedIn(false);
        }
    };

    if (isLoading) return <div className="bl-loading">불러오는 중...</div>;
    if (!bookDetail) return <div className="bl-empty">도서 정보를 불러올 수 없습니다.</div>;

    const { bookInfo, bookItemInfos } = bookDetail;
    const available = bookItemInfos.filter(i => i.borrowStatus === 'RETURNED').length;

    return (
        <div className="bl-container">
            <div className="bl-header">
                <div className="bl-logo-wrap" onClick={() => navigate('/', { state: { page: fromPage } })}>
                    <img src={logo} alt="우아론 로고" className="bl-logo" />
                </div>
                <div className="bl-header-right">
                    <span className="bl-count">총 {bookItemInfos.length}권</span>
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

            <div className="bil-book-info">
                <div className="bil-book-title">
                    {bookInfo.title}
                    {bookInfo.subtitle && <span className="bl-book-sub"> — {bookInfo.subtitle}</span>}
                </div>
                <div className="bil-book-meta">
                    {bookInfo.author.split(',')[0].trim()}
                    &nbsp;·&nbsp;대출 가능&nbsp;
                    <strong style={{ color: available > 0 ? '#2e7d32' : '#c62828' }}>
                        {available}
                    </strong>
                    &nbsp;/&nbsp;{bookItemInfos.length}권
                </div>
            </div>

            <div className="bl-table-wrap">
                <table className="bl-table">
                    <thead>
                        <tr>
                            <th style={{ width: '100px' }}>도서 번호</th>
                            <th>도서명</th>
                            <th style={{ width: '86px', textAlign: 'center' }}>상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookItemInfos.map(item => {
                            const isAvailable = item.borrowStatus === 'RETURNED';
                            return (
                                <tr
                                    key={item.id}
                                    onClick={() => navigate(`/books/${item.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td><span className="bl-id">#{item.id}</span></td>
                                    <td>
                                        <span className="bl-book-title">{bookInfo.title}</span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={isAvailable ? 'bl-badge-ok' : 'bl-badge-no'}>
                                            {isAvailable ? '대출 가능' : '대출 중'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="bl-list">
                <div className="bl-list-header">
                    <div className="bl-list-header-info">도서 번호 / 도서명</div>
                    <div className="bl-list-header-badge">상태</div>
                </div>
                {bookItemInfos.map(item => {
                    const isAvailable = item.borrowStatus === 'RETURNED';
                    return (
                        <div
                            key={item.id}
                            className="bl-list-item"
                            onClick={() => navigate(`/books/${item.id}`)}
                        >
                            <div className="bl-list-info">
                                <div className="bl-list-title">#{item.id} · {bookInfo.title}</div>
                                <div className="bl-list-author">{bookInfo.author.split(',')[0].trim()}</div>
                            </div>
                            <div className="bl-list-badge">
                                <span className={isAvailable ? 'bl-badge-ok' : 'bl-badge-no'}>
                                    {isAvailable ? '대출 가능' : '대출 중'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                className="bl-btn bl-btn-ghost"
                style={{ marginTop: 16 }}
                onClick={() => navigate('/', { state: { page: fromPage } })}>
                ← 목록으로
            </button>
        </div>
    );
};

export default BookItemListPage;
