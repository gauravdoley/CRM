import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
                    {isLogin ? 'Welcome Back!' : 'Create Account'}
                </h1>
                {isLogin ? <LoginForm /> : <RegisterForm />}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.msg || 'Failed to login');
            }
            login(data.token);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             {error && <p className="text-red-500 text-center">{error}</p>}
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Login</button>
        </form>
    );
};

const RegisterForm = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
         try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.msg || 'Failed to register');
            }
            login(data.token);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-center">{error}</p>}
            <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700">Register</button>
        </form>
    );
};

export default AuthPage;