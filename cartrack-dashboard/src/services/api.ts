import { TimesheetAssignment, TimesheetRecord } from '../types/timesheet';

interface APIResponse<T> {
    status: string;
    data: T;
}

interface ConnectWiseTicket {
    id: number;
    ticket_number: string;
    summary: string;
    company: string;
    status: string;
    priority: string;
    date_entered: string;
}

class CartrackAPIClass {
    // private static readonly BASE_URL = window.location.protocol + '//' + window.location.host.replace('3000', '5001') + '/api';
    private static readonly BASE_URL = 'https://cartrack.codebnn.com/api';
    private static readonly CACHE_DURATION = 900; // 15 minutes in seconds
    private static readonly MAX_RETRIES = 3;
    private static pendingRequests = new Map<string, Promise<any>>();

    private static getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('authToken');
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    private static async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
        const defaultOptions: RequestInit = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers,
            },
        };

        const response = await fetch(url, defaultOptions);

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            throw new Error('Authentication required');
        }

        return response;
    }

    private static async fetchWithRetry(url: string, options: RequestInit = {}, retryCount: number = 0): Promise<Response> {
        const defaultOptions: RequestInit = {
            ...options,
            credentials: 'include',
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers,
            },
            mode: 'cors'
        };

        try {
            const response = await fetch(url, defaultOptions);

            if (response.status === 401) {
                localStorage.removeItem('authToken');
                window.location.href = '/login';
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response;
        } catch (error) {
            if (retryCount < this.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return this.fetchWithRetry(url, options, retryCount + 1);
            }
            throw error;
        }
    }

    public static async getTripAnalysis(registration: string, startDate: string, endDate: string) {
        try {
            const requestKey = `tripAnalysis:${registration}:${startDate}:${endDate}`;
            
            if (this.pendingRequests.has(requestKey)) {
                return this.pendingRequests.get(requestKey);
            }

            const requestPromise = (async () => {
                const url = `${this.BASE_URL}/trips/analysis?registration=${registration}&start_date=${startDate}&end_date=${endDate}`;
                const response = await this.fetchWithAuth(url);
                return response.json();
            })();

            this.pendingRequests.set(requestKey, requestPromise);
            requestPromise.finally(() => {
                this.pendingRequests.delete(requestKey);
            });

            return requestPromise;
        } catch (error) {
            console.error('Error fetching trip analysis:', error);
            throw error;
        }
    }

    public static async getVehicles() {
        try {
            const cacheKey = 'vehicles';
            const cachedData = sessionStorage.getItem(cacheKey);
            
            // if (cachedData) {
            //     const { data, timestamp } = JSON.parse(cachedData);
            //     const age = Date.now() - timestamp;
            //     if (age < this.CACHE_DURATION * 1000) {
            //         return data;
            //     }
            // }

            const response = await this.fetchWithAuth(`${this.BASE_URL}/vehicles`);
            const data = await response.json();
            console.log('Vehicles API Response:', data);  // Debug log
            
            sessionStorage.setItem(cacheKey, JSON.stringify({
                data,
                timestamp: Date.now()
            }));

            return data;
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            throw error;
        }
    }

    public static async getTrips(registration: string, startDate: string, endDate: string) {
        try {
            const endDateObj = new Date(endDate);
            endDateObj.setDate(endDateObj.getDate() + 1);
            const bufferedEndDate = endDateObj.toISOString().split('T')[0];

            const url = `${this.BASE_URL}/trips?registration=${encodeURIComponent(registration)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(bufferedEndDate)}`;
            
            const response = await this.fetchWithAuth(url);
            const data = await response.json();
            console.log('API Response:', data);
            return data;
        } catch (error) {
            console.error('Error fetching trips:', error);
            throw error;
        }
    }

    public static async getUsers() {
        try {
            const response = await this.fetchWithAuth(`${this.BASE_URL}/users/`);
            const data = await response.json();
            console.log('Users API Response:', data);
            return data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    public static async initTestUsers() {
        try {
            const response = await this.fetchWithAuth(`${this.BASE_URL}/users/init/`, {
                method: 'POST',
                credentials: 'include',
                mode: 'cors'
            });
            return response.json();
        } catch (error) {
            console.error('Error initializing test users:', error);
            throw error;
        }
    }

    public static async processTimesheet(assignments: TimesheetAssignment[]) {
        try {
            console.log('Processing timesheet:', assignments);
            const response = await this.fetchWithAuth(`${this.BASE_URL}/timesheet/process`, {
                method: 'POST',
                body: JSON.stringify({ assignments }),
            });
            return response.json();
        } catch (error) {
            console.error('Error processing timesheet:', error);
            throw error;
        }
    }

    public static async getProcessedTimesheets(registration: string): Promise<APIResponse<TimesheetRecord[]>> {
        // Temporary implementation returning empty data
        return {
            status: 'success',
            data: [] // Empty array of processed timesheets
        };
    }

    public static async clearCache() {
        sessionStorage.clear();
        try {
            await this.fetchWithAuth(`${this.BASE_URL}/debug/cache?action=flush`);
        } catch (error) {
            console.error('Error clearing backend cache:', error);
        }
    }

    public static async processTrip(tripId: string, data: any) {
        // ... implementation
    }

    public static async assignDriver(tripId: string, driverId: string) {
        // ... implementation
    }

    public static async searchTickets(searchTerm: string): Promise<APIResponse<ConnectWiseTicket[]>> {
        try {
            const url = `${this.BASE_URL}/tickets/search?q=${encodeURIComponent(searchTerm)}`;
            const response = await this.fetchWithAuth(url);
            return response.json();
        } catch (error) {
            console.error('Error searching tickets:', error);
            throw error;
        }
    }

    public static async login(username: string, password: string) {
        try {
            const response = await fetch(`${this.BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error('Invalid credentials');
            }

            const data = await response.json();
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
}

export const CartrackAPI = CartrackAPIClass; 