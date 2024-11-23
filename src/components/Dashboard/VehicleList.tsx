import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartrackAPI } from '../../services/api';
import '../../styles/shared.css';
import './VehicleList.css';

interface Vehicle {
    registration: string;
    manufacturer: string;
    model: string;
    model_year: string;
    color?: string;
}

export const VehicleList: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        const loadVehicles = async () => {
            try {
                const response = await CartrackAPI.getVehicles();
                if (response.status === 'success') {
                    setVehicles(response.data);
                } else {
                    setError(response.message || 'Failed to load vehicles');
                }
            } catch (error) {
                console.error('Error loading vehicles:', error);
                setError('Failed to load vehicles');
            } finally {
                setLoading(false);
            }
        };

        loadVehicles();
    }, []);

    const getColorStyle = (color?: string) => {
        if (!color) return { backgroundColor: '#808080' };
        try {
            return { backgroundColor: color.toLowerCase() };
        } catch {
            return { backgroundColor: '#808080' };
        }
    };

    if (loading) return <div>Loading vehicles...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!vehicles.length) return <div>No vehicles found</div>;

    return (
        <div className="vehicle-list">
            <h2 className="page-title">Fleet Vehicles</h2>
            <div className="vehicle-grid">
                {vehicles.map((vehicle: Vehicle) => (
                    <div key={vehicle.registration} className="card vehicle-card">
                        <div className="vehicle-info">
                            <h3>{vehicle.registration}</h3>
                            <p className="vehicle-model">
                                {[vehicle.manufacturer, vehicle.model, vehicle.model_year]
                                    .filter(Boolean)
                                    .join(' ')}
                            </p>
                            <p className="vehicle-color">
                                <span 
                                    className="color-dot"
                                    style={getColorStyle(vehicle.color)}
                                ></span>
                                {vehicle.color || 'Unknown'}
                            </p>
                        </div>
                        <div className="vehicle-actions">
                            <button 
                                className="btn btn-primary"
                                onClick={() => navigate(`/trips/${vehicle.registration}`)}
                            >
                                View Trip Details
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => navigate(`/timesheet/${vehicle.registration}`)}
                            >
                                View Timesheet
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}; 