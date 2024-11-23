import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartrackAPI } from '../../services/api';
import './Login.css';

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            const response = await CartrackAPI.login(username, password);
            if (response.token) {
                localStorage.setItem('authToken', response.token);
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'Invalid username or password');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Cartrack Login</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        {/* <label htmlFor="username">Username</label> */}
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group">
                        {/* <label htmlFor="password">Password</label> */}
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    );
}; 