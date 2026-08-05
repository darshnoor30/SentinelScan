import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import { getDashboard } from "../services/dashboardService";

const SETTINGS_STORAGE_KEY =
    "sentinelscan-interface-settings";

const SETTINGS_EVENT =
    "sentinelscan-settings-updated";

const DEFAULT_SETTINGS = {
    autoRefreshEnabled: true,
    refreshIntervalSeconds: 30,
    compactMode: false,
    showAnimations: true
};

const DEFAULT_PREDICTION_DATA = [
    {
        prediction: "LEGITIMATE",
        count: 0
    },
    {
        prediction: "SUSPICIOUS",
        count: 0
    },
    {
        prediction: "PHISHING",
        count: 0
    }
];

const DEFAULT_RISK_DATA = [
    {
        range: "0-20",
        count: 0
    },
    {
        range: "21-40",
        count: 0
    },
    {
        range: "41-60",
        count: 0
    },
    {
        range: "61-80",
        count: 0
    },
    {
        range: "81-100",
        count: 0
    }
];

function readDashboardSettings() {
    try {
        const storedValue =
            window.localStorage.getItem(
                SETTINGS_STORAGE_KEY
            );

        if (!storedValue) {
            return DEFAULT_SETTINGS;
        }

        const parsed = JSON.parse(storedValue);

        if (
            !parsed ||
            typeof parsed !== "object" ||
            Array.isArray(parsed)
        ) {
            return DEFAULT_SETTINGS;
        }

        const refreshIntervalSeconds =
            Number(
                parsed.refreshIntervalSeconds
            );

        return {
            autoRefreshEnabled:
                typeof parsed.autoRefreshEnabled ===
                "boolean"
                    ? parsed.autoRefreshEnabled
                    : DEFAULT_SETTINGS.autoRefreshEnabled,

            refreshIntervalSeconds:
                Number.isFinite(
                    refreshIntervalSeconds
                ) &&
                refreshIntervalSeconds >= 15
                    ? refreshIntervalSeconds
                    : DEFAULT_SETTINGS.refreshIntervalSeconds,

            compactMode:
                typeof parsed.compactMode ===
                "boolean"
                    ? parsed.compactMode
                    : DEFAULT_SETTINGS.compactMode,

            showAnimations:
                typeof parsed.showAnimations ===
                "boolean"
                    ? parsed.showAnimations
                    : DEFAULT_SETTINGS.showAnimations
        };
    } catch (error) {
        console.error(
            "Unable to read dashboard settings:",
            error
        );

        return DEFAULT_SETTINGS;
    }
}

function normalizePredictionDistribution(
    distribution
) {
    const source =
        distribution &&
        typeof distribution === "object" &&
        !Array.isArray(distribution)
            ? distribution
            : {};

    return [
        {
            prediction: "LEGITIMATE",
            count:
                Number(source.LEGITIMATE) || 0
        },
        {
            prediction: "SUSPICIOUS",
            count:
                Number(source.SUSPICIOUS) || 0
        },
        {
            prediction: "PHISHING",
            count:
                Number(source.PHISHING) || 0
        }
    ];
}

function normalizeRiskDistribution(
    distribution
) {
    const source =
        distribution &&
        typeof distribution === "object" &&
        !Array.isArray(distribution)
            ? distribution
            : {};

    return [
        {
            range: "0-20",
            count:
                Number(source.LOW) || 0
        },
        {
            range: "21-40",
            count:
                Number(source.MEDIUM) || 0
        },
        {
            range: "41-60",
            count:
                Number(source.HIGH) || 0
        },
        {
            range: "61-80",
            count:
                Number(source.CRITICAL) || 0
        },
        {
            range: "81-100",
            count: 0
        }
    ];
}

function normalizeDashboard(data) {
    const source =
        data &&
        typeof data === "object" &&
        !Array.isArray(data)
            ? data
            : {};

    const statistics =
        source.statistics &&
        typeof source.statistics ===
            "object" &&
        !Array.isArray(source.statistics)
            ? source.statistics
            : {};

    return {
        statistics: {
            total_scans:
                Number(
                    statistics.total_scans
                ) || 0,

            phishing_detected:
                Number(
                    statistics.phishing_detected
                ) || 0,

            suspicious_detected:
                Number(
                    statistics.suspicious_detected
                ) || 0,

            legitimate_detected:
                Number(
                    statistics.legitimate_detected
                ) || 0,

            average_risk_score:
                Number(
                    statistics.average_risk_score
                ) || 0
        },

        prediction_distribution:
            source.prediction_distribution ??
            {},

        risk_distribution:
            source.risk_distribution ?? {},

        top_domains:
            Array.isArray(
                source.top_domains
            )
                ? source.top_domains
                : [],

        daily_scans:
            Array.isArray(
                source.daily_scans
            )
                ? source.daily_scans
                : [],

        recent_scans:
            Array.isArray(
                source.recent_scans
            )
                ? source.recent_scans
                : []
    };
}

function getErrorMessage(error) {
    if (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError"
    ) {
        return null;
    }

    if (error?.response?.status === 401) {
        return (
            "Authentication failed. Check " +
            "the SentinelScan API key."
        );
    }

    if (error?.response?.status === 403) {
        return (
            "Access to the dashboard API " +
            "was denied."
        );
    }

    if (error?.response?.status >= 500) {
        return (
            "The SentinelScan backend " +
            "encountered an internal error."
        );
    }

    if (error?.code === "ECONNABORTED") {
        return (
            "The dashboard request timed out."
        );
    }

    if (!error?.response) {
        return (
            "Unable to connect to the " +
            "SentinelScan backend."
        );
    }

    return (
        error?.response?.data?.detail ||
        error?.message ||
        "Unable to load dashboard data."
    );
}

export default function useDashboard() {
    const [dashboard, setDashboard] =
        useState(null);

    const [
        predictionData,
        setPredictionData
    ] = useState(
        DEFAULT_PREDICTION_DATA
    );

    const [riskData, setRiskData] =
        useState(DEFAULT_RISK_DATA);

    const [topDomains, setTopDomains] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState(null);

    const [lastUpdated, setLastUpdated] =
        useState(null);

    const [
        dashboardSettings,
        setDashboardSettings
    ] = useState(readDashboardSettings);

    const mountedRef = useRef(false);

    const requestInProgressRef =
        useRef(false);

    const abortControllerRef =
        useRef(null);

    const dashboardRef = useRef(null);

    useEffect(() => {
        dashboardRef.current = dashboard;
    }, [dashboard]);

    const loadDashboard = useCallback(
        async ({
            background = false
        } = {}) => {
            if (
                requestInProgressRef.current
            ) {
                return false;
            }

            requestInProgressRef.current =
                true;

            abortControllerRef.current?.abort();

            const controller =
                new AbortController();

            abortControllerRef.current =
                controller;

            if (background) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const response =
                    await getDashboard({
                        signal:
                            controller.signal
                    });

                const normalized =
                    normalizeDashboard(
                        response
                    );

                if (!mountedRef.current) {
                    return false;
                }

                setDashboard(normalized);

                setPredictionData(
                    normalizePredictionDistribution(
                        normalized
                            .prediction_distribution
                    )
                );

                setRiskData(
                    normalizeRiskDistribution(
                        normalized
                            .risk_distribution
                    )
                );

                setTopDomains(
                    normalized.top_domains
                );

                setLastUpdated(new Date());

                setError(null);

                return true;
            } catch (requestError) {
                const message =
                    getErrorMessage(
                        requestError
                    );

                if (
                    mountedRef.current &&
                    message
                ) {
                    console.error(
                        "Dashboard request failed:",
                        requestError
                    );

                    setError(message);
                }

                return false;
            } finally {
                requestInProgressRef.current =
                    false;

                if (mountedRef.current) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        []
    );

    const refresh = useCallback(() => {
        return loadDashboard({
            background: Boolean(
                dashboardRef.current
            )
        });
    }, [loadDashboard]);

    /*
     * Initial dashboard request.
     */

    useEffect(() => {
        mountedRef.current = true;

        loadDashboard({
            background: false
        });

        return () => {
            mountedRef.current = false;

            abortControllerRef.current?.abort();
        };
    }, [loadDashboard]);

    /*
     * Listen for settings updates from
     * the Settings page.
     */

    useEffect(() => {
        const handleSettingsUpdate = (
            event
        ) => {
            const eventSettings =
                event?.detail &&
                typeof event.detail ===
                    "object"
                    ? event.detail
                    : readDashboardSettings();

            setDashboardSettings({
                ...DEFAULT_SETTINGS,
                ...eventSettings
            });
        };

        const handleStorageUpdate = (
            event
        ) => {
            if (
                event.key ===
                SETTINGS_STORAGE_KEY
            ) {
                setDashboardSettings(
                    readDashboardSettings()
                );
            }
        };

        window.addEventListener(
            SETTINGS_EVENT,
            handleSettingsUpdate
        );

        window.addEventListener(
            "storage",
            handleStorageUpdate
        );

        return () => {
            window.removeEventListener(
                SETTINGS_EVENT,
                handleSettingsUpdate
            );

            window.removeEventListener(
                "storage",
                handleStorageUpdate
            );
        };
    }, []);

    /*
     * Create or remove the auto-refresh
     * interval whenever settings change.
     */

    useEffect(() => {
        if (
            !dashboardSettings
                .autoRefreshEnabled
        ) {
            return undefined;
        }

        const seconds =
            Number(
                dashboardSettings
                    .refreshIntervalSeconds
            );

        const safeSeconds =
            Number.isFinite(seconds) &&
            seconds >= 15
                ? seconds
                : DEFAULT_SETTINGS
                      .refreshIntervalSeconds;

        const intervalMs =
            safeSeconds * 1000;

        const intervalId =
            window.setInterval(() => {
                loadDashboard({
                    background: true
                });
            }, intervalMs);

        return () => {
            window.clearInterval(
                intervalId
            );
        };
    }, [
        dashboardSettings
            .autoRefreshEnabled,
        dashboardSettings
            .refreshIntervalSeconds,
        loadDashboard
    ]);

    return {
        dashboard,
        predictionData,
        riskData,
        topDomains,
        loading,
        refreshing,
        error,
        lastUpdated,
        refresh,

        autoRefreshEnabled:
            dashboardSettings
                .autoRefreshEnabled,

        refreshIntervalSeconds:
            dashboardSettings
                .refreshIntervalSeconds,

        compactMode:
            dashboardSettings.compactMode,

        showAnimations:
            dashboardSettings.showAnimations
    };
}