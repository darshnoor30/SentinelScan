import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import api from "../api/axios";

const HEALTH_REFRESH_INTERVAL = 30000;

const getHealthErrorMessage = (error) => {
    if (error?.code === "ERR_CANCELED") {
        return null;
    }

    if (error?.code === "ECONNABORTED") {
        return "The health request timed out.";
    }

    if (!error?.response) {
        return "Unable to connect to the SentinelScan backend.";
    }

    if (error.response.status >= 500) {
        return "The backend health service returned an internal error.";
    }

    return (
        error?.response?.data?.detail ||
        error?.message ||
        "Unable to retrieve system health."
    );
};

export default function useSystemHealth() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);
    const [error, setError] = useState(null);
    const [lastChecked, setLastChecked] =
        useState(null);

    const mountedRef = useRef(false);
    const requestRunningRef = useRef(false);
    const controllerRef = useRef(null);

    const loadHealth = useCallback(
        async ({ background = false } = {}) => {
            if (requestRunningRef.current) {
                return false;
            }

            requestRunningRef.current = true;

            controllerRef.current?.abort();

            const controller =
                new AbortController();

            controllerRef.current = controller;

            if (background) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const requestStartedAt =
                performance.now();

            try {
                const response = await api.get(
                    "/health",
                    {
                        signal: controller.signal
                    }
                );

                const responseTimeMs = Math.round(
                    performance.now() -
                        requestStartedAt
                );

                const data =
                    response?.data &&
                    typeof response.data ===
                        "object"
                        ? response.data
                        : {};

                if (!mountedRef.current) {
                    return false;
                }

                setHealth({
                    status:
                        String(
                            data.status ?? "unknown"
                        ).toUpperCase(),

                    service:
                        data.service ||
                        "SentinelScan API",

                    backendTimestamp:
                        data.timestamp || null,

                    responseTimeMs
                });

                setLastChecked(new Date());
                setError(null);

                return true;
            } catch (requestError) {
                const message =
                    getHealthErrorMessage(
                        requestError
                    );

                if (
                    mountedRef.current &&
                    message
                ) {
                    console.error(
                        "System health request failed:",
                        requestError
                    );

                    setError(message);
                }

                return false;
            } finally {
                requestRunningRef.current = false;

                if (mountedRef.current) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        []
    );

    const refresh = useCallback(() => {
        return loadHealth({
            background: Boolean(health)
        });
    }, [health, loadHealth]);

    useEffect(() => {
        mountedRef.current = true;

        queueMicrotask(() => {
            loadHealth({
                background: false
            });
        });

        const intervalId =
            window.setInterval(() => {
                loadHealth({
                    background: true
                });
            }, HEALTH_REFRESH_INTERVAL);

        return () => {
            mountedRef.current = false;

            window.clearInterval(intervalId);

            controllerRef.current?.abort();
        };
    }, [loadHealth]);

    return {
        health,
        loading,
        refreshing,
        error,
        lastChecked,
        refresh
    };
}
