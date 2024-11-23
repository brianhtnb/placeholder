import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/shared.css';

export const NoVehicleSelected: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="no-vehicle-selected">
            <div className="message-card">
                <h2>No Vehicle Selected</h2>
                <p>Please select a vehicle from the fleet to view its details.</p>
                <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/')}
                >
                    View Fleet Vehicles
                </button>
            </div>
        </div>
    );
}; 