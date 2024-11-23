export interface Classification {
    type: string;
    color: string;
}

export interface MergedTrip {
    start_time: string;
    end_time: string;
    start_location: string;
    end_location: string;
    distance: number;
    duration_seconds: number;
}

export interface GapPeriod {
    location: string;
    duration: string;
    duration_minutes: number;
    start: string;
    end: string;
}

export interface BaseTrip {
    id: string;
    start_timestamp: string;
    end_timestamp: string;
    start_time?: string;
    end_time?: string;
    start_location: string;
    end_location: string;
    distance: number;
    duration_seconds: number;
    duration?: string;
    trip_type: string;
    classification: Classification;
    trip_number?: string;
    gap_period?: GapPeriod;
}

export interface Trip extends BaseTrip {
    merged_trips?: MergedTrip[];
    driver?: string;
    ticket?: string;
}

export interface TripEvent extends BaseTrip {
    merged_trips?: MergedTrip[];
    driver?: string;
    ticket?: string;
}

export interface WorkPeriod {
    location: string;
    start: string;
    end: string;
    duration: string;
    duration_minutes: number;
}

export interface DailyTrips {
    date: string;
    total_trips: number;
    total_distance: number;
    office_trips: number;
    client_trips: number;
    personal_trips: number;
    trips: TripEvent[];
    work_periods?: WorkPeriod[];
}

export interface TripAnalysisResponse {
    status: string;
    data: {
        [date: string]: DailyTrips;
    };
} 