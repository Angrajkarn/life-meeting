const getApiUrl = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // If we're on localhost or 127.0.0.1, use 127.0.0.1 to avoid IPv6 issues
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `http://127.0.0.1:8000`;
        }
        return `http://${hostname}:8000`;
    }
    return "http://127.0.0.1:8000";
};

export const API_URL = getApiUrl();

export const api = {
    get: async (endpoint: string) => {
        const token = localStorage.getItem("token");
        const url = `${API_URL}${endpoint}`;
        console.log(`[API] GET ${url}`);
        const res = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!res.ok) {
            let errorMessage = res.statusText;
            try {
                const errorData = await res.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                // Not JSON or no detail
            }
            console.error(`[API] GET ${url} Failed: ${res.status} ${errorMessage}`);
            throw new Error(errorMessage);
        }
        return res.json();
    },

    post: async (endpoint: string, body: any) => {
        const token = localStorage.getItem("token");
        const url = `${API_URL}${endpoint}`;
        console.log(`[API] POST ${url}`, body);
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            let errorMessage = res.statusText;
            try {
                const errorData = await res.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                // Not JSON or no detail
            }
            console.error(`[API] POST ${url} Failed: ${res.status} ${errorMessage}`);
            throw new Error(errorMessage);
        }
        return res.json();
    },

    patch: async (endpoint: string, body: any) => {
        const token = localStorage.getItem("token");
        const url = `${API_URL}${endpoint}`;
        console.log(`[API] PATCH ${url}`, body);
        const res = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            let errorMessage = res.statusText;
            try {
                const errorData = await res.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                // Not JSON or no detail
            }
            console.error(`[API] PATCH ${url} Failed: ${res.status} ${errorMessage}`);
            throw new Error(errorMessage);
        }
        return res.json();
    },

    put: async (endpoint: string, body: any) => {
        const token = localStorage.getItem("token");
        const url = `${API_URL}${endpoint}`;
        console.log(`[API] PUT ${url}`, body);
        const res = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            let errorMessage = res.statusText;
            try {
                const errorData = await res.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                // Not JSON or no detail
            }
            console.error(`[API] PUT ${url} Failed: ${res.status} ${errorMessage}`);
            throw new Error(errorMessage);
        }
        return res.json();
    },

    delete: async (endpoint: string) => {
        const token = localStorage.getItem("token");
        const url = `${API_URL}${endpoint}`;
        console.log(`[API] DELETE ${url}`);
        const res = await fetch(url, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!res.ok) {
            let errorMessage = res.statusText;
            try {
                const errorData = await res.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                // Not JSON or no detail
            }
            console.error(`[API] DELETE ${url} Failed: ${res.status} ${errorMessage}`);
            throw new Error(errorMessage);
        }
        return res.status === 204 ? null : res.json();
    },

    // Helper to get headers for SWR
    fetcher: async (url: string) => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}${url}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        // Allow guest access - return null instead of throwing on 401
        if (res.status === 401) {
            return null;
        }
        
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
    }
};

export const fetcher = api.fetcher;

export async function getChatHistory(channelId: string) {
    return api.get(`/chat/channels/${channelId}/messages`);
}

export async function getMeetingHistory() {
    return api.get('/meetings/history');
}

export async function getPresence() {
    return api.get('/chat/presence');
}
