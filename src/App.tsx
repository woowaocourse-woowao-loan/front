import './App.css'
import BookDetailPage from "./screens/BookDetailPage.tsx";
import BookItemListPage from "./screens/BookItemListPage.tsx";
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import LoginPage from "./screens/LoginPage.tsx";
import LoginCallbackPage from "./screens/LoginCallbackPage.tsx";
import ProfilePage from "./screens/ProfilePage.tsx";
import BookListPage from "./screens/BookListPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>} />
                <Route path="/books/:bookId/items" element={<BookItemListPage/>} />
                <Route path="/books/:id" element={<BookDetailPage/>} />
                <Route path="/oauth/login/:provider" element={<LoginCallbackPage/>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/" element={<BookListPage/>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App
