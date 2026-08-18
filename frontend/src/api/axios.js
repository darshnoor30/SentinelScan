import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8001";

const API_KEY =
    import.meta.env.VITE_SENTINELSCAN_API_KEY ||
    "sentinelscan-development-key";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": API_KEY,
    },
});

api.interceptors.request.use(
    (config) => {
        config.headers["X-API-Key"] = API_KEY;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const message =
            error?.response?.data?.detail ||
            error?.message ||
            "Unable to communicate with SentinelScan.";

        console.error("SentinelScan API Error", {
            status,
            message,
        });

        return Promise.reject({
            status,
            message,
        });
    }
);

export default api;
