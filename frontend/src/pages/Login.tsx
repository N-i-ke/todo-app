import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HttpError } from '../services/http';

type Mode = 'login' | 'register';

const PASSWORD_HINT =
  '12 文字以上、英大文字・英小文字・数字を含めてください';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password });
      }
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message);
      } else {
        setError('予期しないエラーが発生しました');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">ToDo App</h1>
        <p className="mb-6 text-sm text-gray-500">
          {mode === 'login' ? 'ログイン' : '新規登録'}
        </p>

        <div className="mb-4 flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 rounded px-3 py-1 ${
              mode === 'login'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 rounded px-3 py-1 ${
              mode === 'register'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-gray-700">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus-visible:outline-2 focus-visible:outline-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-gray-700">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 12 : 1}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus-visible:outline-2 focus-visible:outline-blue-500"
            />
            {mode === 'register' ? (
              <p className="mt-1 text-xs text-gray-500">{PASSWORD_HINT}</p>
            ) : null}
          </div>

          {error ? (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {submitting
              ? '送信中...'
              : mode === 'login'
                ? 'ログイン'
                : '登録してログイン'}
          </button>
        </form>
      </div>
    </main>
  );
}
