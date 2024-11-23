import React from 'react';
import { TripEvent, WorkPeriod } from '../../types/trip';
import { formatTime, formatDate, formatDuration, formatDistance } from '../../utils/formatters';
import './TripAnalysis.css';

interface TripDetailsProps {
    trips: TripEvent[];
    workPeriods: WorkPeriod[];
    date: string;
}

export const TripDetails: React.FC<TripDetailsProps> = ({ trips = [], workPeriods = [], date }) => {
    // Filter out invalid trips
    const validTrips = trips.filter(trip => {
        // Filter out trips with no distance or 0 distance
        if (!trip.distance || trip.distance === 0) return false;

        // Filter out trips that are too short (less than 1 minute)
        const startTimeStr = trip.start_timestamp || trip.start_time;
        const endTimeStr = trip.end_timestamp || trip.end_time;
        
        if (!startTimeStr || !endTimeStr) return false;
        
        const startTime = new Date(startTimeStr);
        const endTime = new Date(endTimeStr);
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        if (durationMinutes < 1) return false;

        // Filter out trips where start and end locations are identical
        if (trip.start_location === trip.end_location) return false;

        return true;
    });

    if (!validTrips || validTrips.length === 0) {
        return <div>No valid trips found for {formatDate(date)}</div>;
    }

    const getTimeString = (timestamp?: string): string => {
        if (!timestamp) return '';
        try {
            return formatTime(timestamp);
        } catch (e) {
            console.error('Error formatting time:', e);
            return '';
        }
    };

    // Calculate totals
    const totalDistance = validTrips.reduce((sum, trip) => {
        console.log('Processing trip distance:', {
            raw: trip.distance,
            type: typeof trip.distance,
            parsed: parseFloat(trip.distance.toString())
        });
        return sum + (parseFloat(trip.distance.toString()) || 0);
    }, 0);

    console.log('Total distance calculation:', {
        validTrips: validTrips.length,
        totalDistance,
        individualDistances: validTrips.map(t => t.distance)
    });

    return (
        <div className="trip-details">
            <h3>{formatDate(date)}</h3>
            
            {/* Summary row */}
            <div className="summary-row">
                <span>Total Trips: {validTrips.length}</span>
                <span>Total Distance: {formatDistance(totalDistance)}</span>
                <span>Total Duration: {formatDuration(validTrips.reduce((sum, trip) => sum + trip.duration_seconds, 0))}</span>
            </div>

            {/* Trips table */}
            <table className="trips-table">
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
                    {validTrips.map((trip, index) => (
                        <React.Fragment key={`${trip.id || index}-${trip.start_timestamp || trip.start_time}`}>
                            <tr>
                                <td>
                                    {getTimeString(trip.start_timestamp || trip.start_time)} - {getTimeString(trip.end_timestamp || trip.end_time)}
                                </td>
                                <td>{formatDuration(trip.duration_seconds)}</td>
                                <td>
                                    <span 
                                        className="trip-type" 
                                        style={{ backgroundColor: trip.classification?.color }}
                                    >
                                        {trip.classification?.type.replace(/_/g, ' ') || trip.trip_type || 'UNKNOWN'}
                                    </span>
                                </td>
                                <td>{trip.start_location}</td>
                                <td>{trip.end_location}</td>
                                <td>{formatDistance(trip.distance)}</td>
                            </tr>
                            {trip.gap_period && (
                                <tr className="gap-row">
                                    <td colSpan={6}>
                                        <div className="gap-info">
                                            <span className="gap-icon">⏱️</span>
                                            <span>{trip.gap_period.duration} at {trip.gap_period.location}</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}; 