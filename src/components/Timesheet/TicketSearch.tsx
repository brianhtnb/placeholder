import React, { useState, useEffect, useRef } from 'react';
import { CartrackAPI } from '../../services/api';
import './TicketSearch.css';

interface ConnectWiseTicket {
    id: number;
    ticket_number: string;
    summary: string;
    company: string;
    status: string;
    priority: string;
    date_entered: string;
    type: 'service';
}

interface ApiResponse {
    status: 'success';
    data: ConnectWiseTicket[];
}

type FormattedTicket = ConnectWiseTicket;

interface TicketSearchProps {
    onSelect: (ticketNumber: string, type: string) => void;
    currentValue?: string;
}

export const TicketSearch: React.FC<TicketSearchProps> = ({ onSelect, currentValue }) => {
    const [searchTerm, setSearchTerm] = useState(currentValue || '');
    const [tickets, setTickets] = useState<ConnectWiseTicket[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSearchTerm(currentValue || '');
    }, [currentValue]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchTickets = async () => {
            if (!searchTerm || searchTerm.length < 3) {
                setTickets([]);
                return;
            }

            setLoading(true);
            try {
                const response = await CartrackAPI.searchTickets(searchTerm);
                if (response.status === 'success') {
                    setTickets(response.data as unknown as ConnectWiseTicket[]);
                }
            } catch (error) {
                console.error('Error searching tickets:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(searchTickets, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentValue) {
            const value = e.target.value;
            setSearchTerm(value);
            setShowResults(true);
        }
    };

    const handleSelect = (ticketNumber: string, type: string) => {
        onSelect(ticketNumber, type);
        setShowResults(false);
        setSearchTerm(ticketNumber);
    };

    const handleRemoveTicket = () => {
        onSelect('', '');
        setSearchTerm('');
    };

    const getStatusClass = (status: string): string => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('new')) return 'new';
        if (statusLower.includes('closed')) return 'closed';
        return 'open';
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-NZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tickets.length > 0) {
            e.preventDefault();
            const firstResult = tickets[0];
            handleSelect(firstResult.ticket_number, firstResult.type);
            setTickets([]);
        }
    };

    return (
        <div className="ticket-search" ref={wrapperRef}>
            <div className="search-input-container">
                {currentValue ? (
                    <div className="selected-ticket-tag">
                        <span className="ticket-number">#{currentValue}</span>
                        <button 
                            type="button" 
                            className="remove-ticket-btn"
                            onClick={handleRemoveTicket}
                            aria-label="Remove ticket"
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <input
                        type="text"
                        className="ticket-search-input"
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={() => setShowResults(true)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search by ticket #"
                    />
                )}
                {loading && <div className="search-spinner" />}
            </div>
            
            {showResults && searchTerm && (
                <div className="ticket-results">
                    {loading ? (
                        <div className="loading">Searching tickets...</div>
                    ) : tickets.length > 0 ? (
                        <ul className="ticket-list">
                            {tickets.map((ticket) => (
                                <li
                                    key={ticket.id}
                                    className="ticket-item"
                                    onClick={() => handleSelect(ticket.ticket_number, ticket.type)}
                                >
                                    <div className="ticket-header">
                                        <span className="ticket-number">#{ticket.ticket_number}</span>
                                        <span className={`ticket-status ${getStatusClass(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <div className="ticket-summary">{ticket.summary}</div>
                                    <div className="ticket-details">
                                        <span>{ticket.company}</span>
                                        <span>{formatDate(ticket.date_entered)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : searchTerm.length >= 3 ? (
                        <div className="no-results">
                            No tickets found matching "{searchTerm}"
                        </div>
                    ) : (
                        <div className="no-results">
                            Enter at least 6 characters to search
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}; 