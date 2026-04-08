import './App.css'
import BookDetailPage from "./screens/BookDetailPage.tsx";
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import LoginPage from "./screens/LoginPage.tsx";
import LoginCallbackPage from "./screens/LoginCallbackPage.tsx";
import ProfilePage from "./screens/ProfilePage.tsx";
import BookListPage from "./screens/BookListPage.tsx";
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>} />
                <Route path="/books/:id" element={<BookDetailPage/> } />
                <Route path="/oauth/login/:provider" element={<LoginCallbackPage/>} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/" element={<BookListPage/>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App
