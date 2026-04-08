import './App.css'
import BookDetailPage from "./screens/BookDetailPage.tsx";
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import LoginPage from "./screens/LoginPage.tsx";
import LoginCallbackPage from "./screens/LoginCallbackPage.tsx";
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage/>} />
                <Route path="/books/:id" element={<BookDetailPage/> } />
                <Route path="/oauth/login/:provider" element={<LoginCallbackPage/>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App
