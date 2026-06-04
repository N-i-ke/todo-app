import { useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';

export default function App() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </main>
    );
  }

  if (status === 'anonymous') {
    return <Login />;
  }

  return <Home />;
}
