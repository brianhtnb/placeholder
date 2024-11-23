export const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
};

export const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-NZ', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

export const formatDistance = (kilometers: number): string => {
    if (kilometers < 0.1) {
        return '0 km';
    }
    return `${kilometers.toFixed(1)} km`;
}; 