export interface User {
    id: string;
    name: string;
    department: string;
    resource_id: string;
}

export interface GapPeriod {
    duration: string;
    location: string;
    start: string;
    end: string;
}

export interface TimesheetAssignment {
    trip_id: string;
    user_id: string;
    user_name: string;
    resource_id: string;
    ticket_number: string;
    duration: string;
    trip_type: string;
    start_location: string;
    end_location: string;
    notes?: string;
    gap_period?: GapPeriod;
    start_time: string;
    end_time: string;
    ticket_type?: string;
}

export type EntryType = 'TRAVEL' | 'GAP' | 'WORK';

export interface ProcessedAssignment extends TimesheetAssignment {
    duration_seconds: number;
    isGap: boolean;
    entryType: EntryType;
    location?: string;
    start_time: string;
    end_time: string;
    ticket_number: string;
}

export type TimesheetNotes = Record<string, string>;

export type TimesheetStatus = 'NEW' | 'PROCESSED' | 'REJECTED' | 'DELETED';

export interface TimesheetRecord {
    trip_id: string;
    user_id: string;
    date: string;
    start_time: string;
    end_time: string;
    duration: string;
    trip_type: string;
    start_location: string;
    end_location: string;
    distance: number;
    notes: string;
    status: TimesheetStatus;
    processed_at?: string;
    ticket_number?: string;
    assigned_user?: {
        id: string;
        name: string;
    };
} 


export interface TimesheetStatusBadge {
    status: TimesheetStatus;
    label: string;
    color: string;
}

export const statusConfig: Record<TimesheetStatus, TimesheetStatusBadge> = {
    NEW: { status: 'NEW', label: 'Not Synced', color: 'gray' },
    PROCESSED: { status: 'PROCESSED', label: 'Synced to CW', color: 'green' },
    REJECTED: { status: 'REJECTED', label: 'Sync Failed', color: 'red' },
    DELETED: { status: 'DELETED', label: 'Deleted', color: 'black' }
};