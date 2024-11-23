import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

export const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="header-content">
                <h1>Cartrack Trip & Time Tracking</h1>
                <div className="nav-brand">Cartrack</div>
                <div className="nav-links">
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                        Vehicles
                    </Link>
                    <Link to="/trips" className={location.pathname.includes('/trips') ? 'active' : ''}>
                        Trip Analysis
                    </Link>
                    <Link to="/timesheet" className={location.pathname.includes('/timesheet') ? 'active' : ''}>
                        Timesheets
                    </Link>
                    <button 
                        onClick={handleLogout} 
                        className="logout-button"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}; 