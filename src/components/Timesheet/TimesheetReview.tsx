import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CartrackAPI } from '../../services/api';
import { TimesheetAssignment, ProcessedAssignment, EntryType } from '../../types/timesheet';
import { formatTime, formatDuration } from '../../utils/formatters';
import './TimesheetReview.css';
import { TicketSearch } from './TicketSearch';

interface TimesheetReviewProps {
    assignments: ProcessedAssignment[];
    onSubmit: (assignments: ProcessedAssignment[]) => Promise<void>;
    onBack: () => void;
}

interface TimesheetNotes {
    [key: string]: string;  // Key is tripId-type (e.g., "123-travel" or "123-gap")
}

export const TimesheetReview: React.FC<TimesheetReviewProps> = ({ onSubmit, onBack }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<ProcessedAssignment[]>(
        location.state?.assignments || []
    );
    const [notes, setNotes] = useState<TimesheetNotes>({});
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string>('');

    const handleRemoveEntry = (tripId: string, isGap: boolean = false) => {
        setAssignments(assignments.filter(a => 
            !(a.trip_id === tripId && a.isGap === isGap)
        ));
    };

    const handleNotesChange = (tripId: string, isGap: boolean, value: string) => {
        setNotes({
            ...notes,
            [`${tripId}-${isGap ? 'gap' : 'travel'}`]: value
        });
    };

    const handleSubmit = async () => {
        setProcessing(true);
        setError('');

        try {
            const assignmentsWithNotes = assignments.map(assignment => ({
                ...assignment,
                notes: notes[`${assignment.trip_id}-${assignment.isGap ? 'gap' : 'travel'}`] || ''
            }));

            await onSubmit(assignmentsWithNotes);
            navigate('/timesheet/success');
        } catch (error) {
            setError('Failed to process timesheet');
            console.error('Error processing timesheet:', error);
        } finally {
            setProcessing(false);
        }
    };

    const getEntryTypeLabel = (entryType: EntryType) => {
        switch (entryType) {
            case 'TRAVEL':
                return 'Travel';
            case 'GAP':
                return 'Gap';
            case 'WORK':
                return 'Work';
            default:
                return entryType;
        }
    };

    const handleTicketSelect = (tripId: string, ticketNumber: string) => {
        const updatedAssignments = assignments.map(assignment => {
            if (assignment.trip_id === tripId) {
                return { ...assignment, ticket_number: ticketNumber };
            }
            return assignment;
        });
        setAssignments(updatedAssignments);
    };

    const handleBack = () => {
        const registration = location.state?.registration;
        
        navigate(`/timesheet/${registration}`, { 
            state: { 
                savedAssignments: location.state?.savedAssignments 
            } 
        });
    };

    return (
        <div className="timesheet-review">
            <div className="review-header">
                <h2>Review Timesheet Entries</h2>
                <div className="review-summary">
                    {assignments.length} {assignments.length === 1 ? 'entry' : 'entries'} to process
                </div>
            </div>

            <div className="review-controls">
                <button className="btn btn-secondary" onClick={handleBack}>
                    <i className="fas fa-arrow-left"></i> Back
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={processing || assignments.length === 0}
                >
                    {processing ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> Processing...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-check"></i> Submit Timesheet
                        </>
                    )}
                </button>
            </div>

            <div className="review-table-container">
                <table className="review-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Duration</th>
                            <th>Type</th>
                            <th>Location</th>
                            <th>Engineer</th>
                            <th>Ticket #</th>
                            <th>Notes</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.map((assignment, index) => (
                            <tr key={`${assignment.trip_id}-${index}`} className="review-row">
                                <td className="time-cell">
                                    <div className="time-range">
                                        <span>{formatTime(assignment.start_time)}</span>
                                        <span className="time-separator">-</span>
                                        <span>{formatTime(assignment.end_time)}</span>
                                    </div>
                                </td>
                                <td className="duration-cell">
                                    {formatDuration(assignment.duration_seconds || 0)}
                                </td>
                                <td>
                                    <span className={`entry-type ${assignment.entryType.toLowerCase()}`}>
                                        {getEntryTypeLabel(assignment.entryType)}
                                    </span>
                                </td>
                                <td className="location-cell">
                                    <div className="location-range">
                                        <span>{assignment.start_location}</span>
                                        <i className="fas fa-arrow-right location-arrow"></i>
                                        <span>{assignment.end_location}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="engineer-badge">
                                        <i className="fas fa-user"></i>
                                        {assignment.user_name}
                                    </div>
                                </td>
                                <td>
                                    <div className="ticket-badge">
                                        #{assignment.ticket_number}
                                    </div>
                                </td>
                                <td>
                                    <textarea
                                        className="notes-input"
                                        placeholder="Add notes..."
                                        value={notes[`${assignment.trip_id}-travel`] || ''}
                                        onChange={(e) => handleNotesChange(
                                            assignment.trip_id,
                                            false,
                                            e.target.value
                                        )}
                                    />
                                </td>
                                <td>
                                    <button
                                        className="remove-entry-btn"
                                        onClick={() => handleRemoveEntry(assignment.trip_id, false)}
                                        title="Remove this entry"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}; 