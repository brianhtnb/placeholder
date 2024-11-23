import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CartrackAPI } from '../../services/api';
import { TripEvent } from '../../types/trip';
import { User, TimesheetAssignment, TimesheetRecord } from '../../types/timesheet';
import '../../styles/shared.css';
import './Timesheet.css';
import { NoVehicleSelected } from '../Common/NoVehicleSelected';
import { formatTime, formatDate, formatDuration, formatDistance } from '../../utils/formatters';
import { ProcessedAssignment } from '../../types/timesheet';
import { TicketSearch } from './TicketSearch';

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

interface DailyTrips {
    [date: string]: TripEvent[];
}

interface Assignment {
    userId: string;
    ticketNumber: string;
    ticketType?: string;
}

interface GapAssignment {
    tickets: string[];  // Allow multiple tickets for gap periods
    userId: string;     // Keep the same driver
}

interface TripAssignment {
    ticketNumber: string;  // Single ticket for travel
    userId: string;
}

interface ProcessedTimesheetsResponse {
    status: string;
    data: TimesheetRecord[];
}

interface TripsData {
    trips: TripEvent[];
    total_trips: number;
    total_distance: number;
}

export const Timesheet: React.FC = () => {
    const { registration } = useParams<{ registration: string }>();
    const location = useLocation();
    const [trips, setTrips] = useState<TripEvent[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [assignments, setAssignments] = useState<Map<string, Assignment>>(() => {
        const savedAssignments = location.state?.savedAssignments;
        if (savedAssignments) {
            return new Map(savedAssignments);
        }
        const stored = localStorage.getItem(`timesheet-assignments-${registration}`);
        if (stored) {
            return new Map(JSON.parse(stored));
        }
        return new Map();
    });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string>('');
    const [groupedTrips, setGroupedTrips] = useState<DailyTrips>({});
    const [gapAssignments, setGapAssignments] = useState<Map<string, GapAssignment>>(new Map());
    const [processedEntries, setProcessedEntries] = useState<Map<string, TimesheetRecord>>(new Map());
    const navigate = useNavigate();
    const [confirmedTickets] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (registration && assignments.size > 0) {
            localStorage.setItem(
                `timesheet-assignments-${registration}`,
                JSON.stringify(Array.from(assignments.entries()))
            );
        }
    }, [assignments, registration]);

    useEffect(() => {
        return () => {
            if (registration) {
                localStorage.removeItem(`timesheet-assignments-${registration}`);
            }
        };
    }, [registration]);

    const formatDateTime = (dateTimeStr: string) => {
        try {
            // Handle different date formats
            const cleanDateTime = dateTimeStr
                .replace(' ', 'T')  // Replace space with T for ISO format
                .replace('+13', '+1300');  // Fix timezone format

            const date = new Date(cleanDateTime);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.error('Invalid date:', dateTimeStr);
                return new Date();
            }
            
            return date;
        } catch (error) {
            console.error('Error parsing date:', dateTimeStr, error);
            return new Date();
        }
    };

    const formatDateForDisplay = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('en-NZ', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Pacific/Auckland'
            }).format(date);
        } catch (error) {
            console.error('Error formatting date for display:', error);
            return dateStr; // Return original string if parsing fails
        }
    };

    useEffect(() => {
        const loadData = async () => {
            if (!registration) {
                setError('No registration provided');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - 7);

                const [tripsResponse, usersResponse, processedResponse] = await Promise.all([
                    CartrackAPI.getTrips(
                        registration,
                        startDate.toISOString().split('T')[0],
                        endDate.toISOString().split('T')[0]
                    ) as Promise<TripResponse>,
                    CartrackAPI.getUsers(),
                    CartrackAPI.getProcessedTimesheets(registration)
                ]);

                // Create a map of processed entries
                const processedMap = new Map(
                    processedResponse.data.map((entry: TimesheetRecord) => [entry.trip_id, entry])
                );
                setProcessedEntries(processedMap);

                // Group trips by date
                const grouped = Object.entries(tripsResponse.data).reduce((acc: DailyTrips, [date, dayData]: [string, TripsData]) => {
                    const validTrips = dayData.trips.filter((trip: TripEvent) => trip.distance > 0);
                    if (validTrips.length > 0) {
                        acc[date] = validTrips;
                    }
                    return acc;
                }, {});

                setGroupedTrips(grouped);
                setTrips(Object.values(grouped).flat());
                setUsers(usersResponse.data);
            } catch (error) {
                console.error('Error loading data:', error);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [registration]);

    const handleUserAssignment = (tripId: string, userId: string) => {
        setAssignments(prev => {
            const newAssignments = new Map(prev);
            const existing = newAssignments.get(tripId) || { ticketNumber: '' };
            newAssignments.set(tripId, { 
                ...existing, 
                userId 
            });
            return newAssignments;
        });
    };

    const handleTicketAssignment = (tripId: string, ticketNumber: string, type: string, confirmed: boolean) => {
        setAssignments(prev => {
            const newAssignments = new Map(prev);
            const existing = newAssignments.get(tripId) || { userId: '' };
            newAssignments.set(tripId, { 
                ...existing, 
                ticketNumber,
                ticketType: type
            });
            return newAssignments;
        });
    };

    const handleProcessTimesheet = async () => {
        if (assignments.size === 0) {
            setError('Please assign drivers to trips first');
            return;
        }

        const timesheetRecords: ProcessedAssignment[] = Array.from(assignments.entries()).map(
            ([tripId, assignment]) => {
                const trip = trips.find(t => t.id === tripId);
                const user = users.find(u => u.id === assignment.userId);
                
                if (!trip || !user) {
                    throw new Error(`Trip ${tripId} or user ${assignment.userId} not found`);
                }

                return {
                    trip_id: tripId,
                    user_id: assignment.userId,
                    user_name: user.name,
                    resource_id: user.resource_id,
                    ticket_number: assignment.ticketNumber,
                    duration: trip.duration || '',
                    duration_seconds: trip.duration_seconds,
                    trip_type: trip.classification?.type || 'UNKNOWN',
                    start_location: trip.start_location || '',
                    end_location: trip.end_location || '',
                    start_time: trip.start_timestamp,
                    end_time: trip.end_timestamp,
                    isGap: false,
                    entryType: 'TRAVEL',
                    ticketType: assignment.ticketType
                };
            }
        );

        // Include registration in the navigation state
        navigate('/timesheet/review', { 
            state: { 
                assignments: timesheetRecords,
                savedAssignments: Array.from(assignments.entries()),
                registration: registration
            } 
        });
    };

    const handleGapTicketAssignment = (
        tripId: string, 
        gapStartTime: string, 
        ticket: string, 
        action: 'add' | 'remove'
    ) => {
        const gapKey = `${tripId}-${gapStartTime}`;
        const currentAssignment = gapAssignments.get(gapKey) || { 
            tickets: [], 
            userId: assignments.get(tripId)?.userId || '' 
        };

        if (action === 'add') {
            currentAssignment.tickets.push(ticket);
        } else {
            currentAssignment.tickets = currentAssignment.tickets.filter(t => t !== ticket);
        }

        setGapAssignments(new Map(gapAssignments.set(gapKey, currentAssignment)));
    };

    const isEntryProcessed = (tripId: string): boolean => {
        return processedEntries.has(tripId);
    };

    const getProcessedEntry = (tripId: string): TimesheetRecord | undefined => {
        return processedEntries.get(tripId);
    };

    const isValidAssignment = (assignment: { userId: string; ticketNumber: string }) => {
        // Check if the ticket was properly selected (not just typed)
        const isTicketSelected = assignment.ticketNumber && 
                               confirmedTickets.has(assignment.ticketNumber);
        
        return assignment.userId && 
               assignment.userId.trim() !== '' && 
               isTicketSelected;
    };

    const getValidAssignmentsCount = () => {
        let count = 0;
        assignments.forEach((assignment) => {
            // Count only if both userId and ticketNumber are present
            if (assignment.userId && assignment.ticketNumber) {
                count++;
            }
        });
        return count;
    };

    if (!registration) {
        return <NoVehicleSelected />;
    }

    return (
        <div className="timesheet">
            <h2>Timesheet Assignment - {registration}</h2>
            
            {loading && <div className="loading">Loading timesheet data...</div>}
            {error && <div className="error">{error}</div>}
            
            {!loading && !error && (
                <>
                    <div className="timesheet-controls">
                        <button 
                            className={`btn ${getValidAssignmentsCount() === 0 ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={handleProcessTimesheet}
                            disabled={processing || getValidAssignmentsCount() === 0}
                        >
                            {processing ? 'Processing...' : `Process Timesheet (${getValidAssignmentsCount()} assignments)`}
                        </button>
                    </div>

                    {Object.entries(groupedTrips).map(([date, dayTrips]) => (
                        <div key={date} className="day-section">
                            <h3 className="day-title">{formatDateForDisplay(date)}</h3>
                            <table className="table-modern">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Duration</th>
                                        <th>Type</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Driver</th>
                                        <th>Ticket #</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dayTrips.map((trip) => {
                                        const tripNumber = String(trip.trip_number || trip.id);
                                        const processedEntry = getProcessedEntry(tripNumber);
                                        const isProcessed = isEntryProcessed(tripNumber);
                                        const assignment = assignments.get(tripNumber);
                                        
                                        return (
                                            <tr 
                                                key={tripNumber}
                                                className={`${isProcessed ? 'processed' : ''} ${assignment ? 'assigned' : ''}`}
                                            >
                                                <td>
                                                    {formatTime(trip.start_timestamp)} - {formatTime(trip.end_timestamp)}
                                                </td>
                                                <td>{formatDuration(trip.duration_seconds)}</td>
                                                <td>
                                                    <span 
                                                        className={`trip-type ${trip.classification?.type || 'UNKNOWN'}`}
                                                    >
                                                        {trip.classification?.type.replace(/_/g, ' ') || 'UNKNOWN'}
                                                    </span>
                                                </td>
                                                <td>{trip.start_location}</td>
                                                <td>{trip.end_location}</td>
                                                <td>
                                                    {isProcessed ? (
                                                        <div className="processed-entry">
                                                            <span className="engineer-name">
                                                                {processedEntry?.assigned_user?.name}
                                                            </span>
                                                            <span className="status-badge">Processed</span>
                                                        </div>
                                                    ) : (
                                                        <select
                                                            className="select-modern"
                                                            value={assignment?.userId || ''}
                                                            onChange={(e) => handleUserAssignment(tripNumber, e.target.value)}
                                                        >
                                                            <option value="">Select Driver</option>
                                                            {users.map((user) => (
                                                                <option key={user.id} value={user.id}>
                                                                    {user.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>
                                                <td>
                                                    {isProcessed ? (
                                                        <span className="ticket-number">
                                                            {processedEntry?.ticket_number}
                                                        </span>
                                                    ) : (
                                                        <TicketSearch
                                                            onSelect={(ticketNumber, type) => handleTicketAssignment(tripNumber, ticketNumber, type, true)}
                                                            currentValue={assignment?.ticketNumber}
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}; 