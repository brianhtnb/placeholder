import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CartrackAPI } from '../../services/api';
import { TripEvent } from '../../types/trip';
import './TripAnalysis.css';

interface DailyData {
    trips: TripEvent[];
    total_trips: number;
    total_distance: number;
}

interface TripResponse {
    status: string;
    data: {
        [date: string]: DailyData;
    };
}

export const TripAnalysis: React.FC = () => {
    const { registration } = useParams<{ registration: string }>();
    const [tripData, setTripData] = useState<{ [date: string]: DailyData }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [currentDate, setCurrentDate] = useState<string>('');
    const [availableDates, setAvailableDates] = useState<string[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!registration) {
                setError('No registration provided');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');

                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - 7);

                const startDateStr = startDate.toISOString().split('T')[0];
                const endDateStr = endDate.toISOString().split('T')[0];

                const response = await CartrackAPI.getTrips(
                    registration,
                    startDateStr,
                    endDateStr
                ) as TripResponse;

                if (response.status === 'success' && response.data) {
                    // Group trips by date
                    const groupedData: { [key: string]: DailyData } = {};
                    
                    // Process each day's data
                    Object.entries(response.data).forEach(([date, dayData]) => {
                        const validTrips = dayData.trips.filter(trip => trip.distance > 0);
                        if (validTrips.length > 0) {
                            groupedData[date] = {
                                trips: validTrips,
                                total_trips: validTrips.length,
                                total_distance: validTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0)
                            };
                        }
                    });

                    const dates = Object.keys(groupedData).sort();
                    setTripData(groupedData);
                    setAvailableDates(dates);
                    setCurrentDate(dates[dates.length - 1]); // Start with most recent date
                } else {
                    setError('Failed to load trip data');
                }
            } catch (error) {
                console.error('Error loading trip data:', error);
                setError('Failed to load trip data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [registration]);

    const navigateDate = (direction: 'prev' | 'next') => {
        const currentIndex = availableDates.indexOf(currentDate);
        if (direction === 'prev' && currentIndex > 0) {
            setCurrentDate(availableDates[currentIndex - 1]);
        } else if (direction === 'next' && currentIndex < availableDates.length - 1) {
            setCurrentDate(availableDates[currentIndex + 1]);
        }
    };

    const formatDate = (dateStr: string): string => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-NZ', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateStr;
        }
    };

    if (loading) return <div className="loading">Loading trip data...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!currentDate || !tripData[currentDate]) return <div>No trip data available</div>;

    const currentDayData = tripData[currentDate];
    const currentIndex = availableDates.indexOf(currentDate);

    return (
        <div className="trip-analysis">
            <div className="date-navigation">
                <button 
                    className="nav-button"
                    onClick={() => navigateDate('prev')}
                    disabled={currentIndex === 0}
                >
                    ←
                </button>
                <h2>{formatDate(currentDate)}</h2>
                <button 
                    className="nav-button"
                    onClick={() => navigateDate('next')}
                    disabled={currentIndex === availableDates.length - 1}
                >
                    →
                </button>
            </div>

            <div className="daily-summary">
                <div className="summary-item">
                    <span className="label">Total Trips:</span>
                    <span className="value">{currentDayData.total_trips}</span>
                </div>
                <div className="summary-item">
                    <span className="label">Total Distance:</span>
                    <span className="value">{currentDayData.total_distance.toFixed(1)} km</span>
                </div>
            </div>

            <div className="trips-table">
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Duration</th>
                            <th>Type</th>
                            <th>From</th>
                            <th>To</th>
                            <th>Distance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentDayData.trips.map((trip, index) => (
                            <tr key={index}>
                                <td>
                                    {new Date(trip.start_timestamp).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: false
                                    })} - {new Date(trip.end_timestamp).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: false
                                    })}
                                </td>
                                <td>{Math.floor((trip.duration_seconds || 0) / 60)} mins</td>
                                <td>
                                    <span className={`trip-type ${trip.classification?.type || 'unknown'}`}>
                                        {trip.classification?.type?.replace(/_/g, ' ') || 'Unknown'}
                                    </span>
                                </td>
                                <td>{trip.start_location || '-'}</td>
                                <td>{trip.end_location || '-'}</td>
                                <td>{(trip.distance || 0).toFixed(1)} km</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}; 