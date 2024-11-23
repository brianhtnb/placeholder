import React from 'react';
import TripRow from './TripRow';
import { Trip } from '../../types/trip';
import './TripList.css';

interface TripListProps {
    trips: Trip[];
    onDriverChange: (tripId: string, driver: string) => void;
    onTicketChange: (tripId: string, ticket: string) => void;
}

const TripList: React.FC<TripListProps> = ({ trips, onDriverChange, onTicketChange }) => {
    return (
        <table className="trip-list">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Duration</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Distance</th>
                    <th>Driver</th>
                    <th>Ticket #</th>
                </tr>
            </thead>
            <tbody>
                {trips.map((trip) => (
                    <TripRow
                        key={trip.id}
                        trip={trip}
                        onDriverChange={onDriverChange}
                        onTicketChange={onTicketChange}
                    />
                ))}
            </tbody>
        </table>
    );
};

export default TripList; 