import React, { useState } from 'react';
import { formatDuration, formatDistance, formatTime } from '../../utils/formatters';
import { Trip, MergedTrip } from '../../types/trip';

interface TripRowProps {
    trip: Trip;
    onDriverChange: (tripId: string, driver: string) => void;
    onTicketChange: (tripId: string, ticket: string) => void;
}

const TripRow: React.FC<TripRowProps> = ({ trip, onDriverChange, onTicketChange }) => {
    const [showMergedTrips, setShowMergedTrips] = useState(false);
    const [driver, setDriver] = useState(trip.driver || '');
    const [ticket, setTicket] = useState(trip.ticket || '');

    const handleDriverChange = (value: string) => {
        setDriver(value);
        onDriverChange(String(trip.id), value);
    };

    const handleTicketChange = (value: string) => {
        setTicket(value);
        onTicketChange(String(trip.id), value);
    };
    
    return (
        <>
            <tr 
                onMouseEnter={() => setShowMergedTrips(true)}
                onMouseLeave={() => setShowMergedTrips(false)}
                style={{ 
                    backgroundColor: trip.classification?.color || 'rgba(158, 158, 158, 0.15)',
                    cursor: trip.merged_trips ? 'pointer' : 'default'
                }}
            >
                <td>{formatTime(trip.start_timestamp)} - {formatTime(trip.end_timestamp)}</td>
                <td>{formatDuration(trip.duration_seconds)}</td>
                <td>{trip.classification?.type?.replace(/_/g, ' ') || 'UNKNOWN'}</td>
                <td>{trip.start_location}</td>
                <td>{trip.end_location}</td>
                <td>{formatDistance(trip.distance)}</td>
                <td>
                    <input
                        type="text"
                        value={driver}
                        onChange={(e) => handleDriverChange(e.target.value)}
                        placeholder="Driver name"
                    />
                </td>
                <td>
                    <input
                        type="text"
                        value={ticket}
                        onChange={(e) => handleTicketChange(e.target.value)}
                        placeholder="Ticket #"
                    />
                </td>
            </tr>
            {showMergedTrips && trip.merged_trips && (
                <tr className="merged-trips-details">
                    <td colSpan={8}>
                        <div className="merged-trips-container">
                            <h4>Merged Trips:</h4>
                            {trip.merged_trips.map((mergedTrip: MergedTrip, index: number) => (
                                <div key={index} className="merged-trip">
                                    <span>{mergedTrip.start_time} - {mergedTrip.end_time}</span>
                                    <span>{formatDuration(mergedTrip.duration_seconds)}</span>
                                    <span>{mergedTrip.start_location} → {mergedTrip.end_location}</span>
                                    <span>{formatDistance(mergedTrip.distance)}</span>
                                </div>
                            ))}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

export default TripRow; 