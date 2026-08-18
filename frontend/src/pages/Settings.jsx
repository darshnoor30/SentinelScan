import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import toast from "react-hot-toast";

import {
    FaCog,
    FaServer,
    FaSyncAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaUndo,
    FaClock,
    FaDatabase,
    FaShieldAlt,
    FaKey,
    FaExclamationTriangle
} from "react-icons/fa";

import api from "../api/axios";
import Layout from "../components/layout/Layout";

const STORAGE_KEY =
    "sentinelscan-interface-settings";

const DEFAULT_SETTINGS = {
    autoRefreshEnabled: true,
    refreshIntervalSeconds: 30,
    compactMode: false,
    showAnimations: true
};

const REFRESH_INTERVAL_OPTIONS = [
    {
        value: 15,
        label: "15 seconds"
    },
    {
        value: 30,
        label: "30 seconds"
    },
    {
        value: 60,
        label: "1 minute"
    },
    {
        value: 300,
        label: "5 minutes"
    }
];

function loadStoredSettings() {
    try {
        const storedValue =
            window.localStorage.getItem(
                STORAGE_KEY
            );

        if (!storedValue) {
            return DEFAULT_SETTINGS;
        }

        const parsed =
            JSON.parse(storedValue);

        if (
            !parsed ||
            typeof parsed !== "object"
        ) {
            return DEFAULT_SETTINGS;
        }

        return {
            ...DEFAULT_SETTINGS,
            ...parsed
        };
    } catch (error) {
        console.error(
            "Unable to load settings:",
            error
        );

        return DEFAULT_SETTINGS;
    }
}

function saveStoredSettings(settings) {
    window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
    );
}

function formatDateTime(value) {
    if (!value) {
        return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Invalid timestamp";
    }

    return date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

function getConnectionErrorMessage(error) {
    if (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError"
    ) {
        return null;
    }

    if (error?.code === "ECONNABORTED") {
        return "The connection test timed out.";
    }

    if (error?.response?.status === 401) {
        return "Authentication failed. Check the configured API key.";
    }

    if (error?.response?.status >= 500) {
        return "The SentinelScan backend returned an internal error.";
    }

    if (!error?.response) {
        return "Unable to connect to the SentinelScan backend.";
    }

    return (
        error?.response?.data?.detail ||
        error?.message ||
        "The connection test failed."
    );
}

function Toggle({
    enabled,
    onChange,
    label,
    description
}) {
    return (
        <div className="flex items-start justify-between gap-5 rounded-xl border border-gray-800 bg-gray-950/50 p-4">
            <div>
                <p className="font-semibold text-white">
                    {label}
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                    {description}
                </p>
            </div>

            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() =>
                    onChange?.(!enabled)
                }
                className={`
                    relative
                    h-7
                    w-12
                    shrink-0
                    rounded-full
                    transition
                    focus:outline-none
                    focus:ring-2
                    focus:ring-cyan-400
                    ${
                        enabled
                            ? "bg-cyan-500"
                            : "bg-gray-700"
                    }
                `}
            >
                <span
                    className={`
                        absolute
                        top-1
                        h-5
                        w-5
                        rounded-full
                        bg-white
                        shadow
                        transition-transform
                        ${
                            enabled
                                ? "translate-x-6"
                                : "translate-x-1"
                        }
                    `}
                />
            </button>
        </div>
    );
}

function InformationCard({
    icon,
    title,
    value,
    subtitle,
    valueClass = "text-white"
}) {
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-4">
            <div className="flex items-start gap-3">
                <div className="mt-1 shrink-0 text-cyan-400">
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                        {title}
                    </p>

                    <p
                        title={String(
                            value ?? ""
                        )}
                        className={`mt-1 break-all font-semibold ${valueClass}`}
                    >
                        {value}
                    </p>

                    {subtitle && (
                        <p className="mt-1 text-xs leading-5 text-gray-600">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function ConnectionStatus({
    connection
}) {
    if (!connection) {
        return (
            <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-4">
                <div className="flex items-center gap-3 text-gray-400">
                    <FaServer />

                    <span className="text-sm">
                        Connection has not been
                        tested during this session.
                    </span>
                </div>
            </div>
        );
    }

    if (connection.success) {
        return (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                <div className="flex items-start gap-3">
                    <FaCheckCircle className="mt-1 shrink-0 text-green-400" />

                    <div>
                        <p className="font-semibold text-green-300">
                            Backend connection successful
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                            {connection.service} responded in{" "}
                            {connection.responseTimeMs} ms.
                        </p>

                        <p className="mt-1 text-xs text-gray-600">
                            Checked{" "}
                            {formatDateTime(
                                connection.checkedAt
                            )}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
                <FaTimesCircle className="mt-1 shrink-0 text-red-400" />

                <div>
                    <p className="font-semibold text-red-300">
                        Backend connection failed
                    </p>

                    <p className="mt-1 text-sm text-gray-300">
                        {connection.message}
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                        Checked{" "}
                        {formatDateTime(
                            connection.checkedAt
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}

function Settings() {
    const [settings, setSettings] =
        useState(loadStoredSettings);

    const [savedSettings, setSavedSettings] =
        useState(loadStoredSettings);

    const [testing, setTesting] =
        useState(false);

    const [connection, setConnection] =
        useState(null);

    useEffect(() => {
        document.title =
            "SentinelScan | Settings";
    }, []);

    const apiBaseUrl = useMemo(
        () =>
            api?.defaults?.baseURL ||
            import.meta.env
                .VITE_API_BASE_URL ||
            "Not configured",
        []
    );

    const apiKeyConfigured = useMemo(() => {
        const defaultHeaders =
            api?.defaults?.headers;

        const configuredKey =
            defaultHeaders?.common?.[
                "X-API-Key"
            ] ??
            defaultHeaders?.[
                "X-API-Key"
            ] ??
            import.meta.env
                .VITE_API_KEY;

        return Boolean(configuredKey);
    }, []);

    const hasChanges = useMemo(
        () =>
            JSON.stringify(settings) !==
            JSON.stringify(savedSettings),
        [settings, savedSettings]
    );

    const updateSetting = useCallback(
        (name, value) => {
            setSettings((current) => ({
                ...current,
                [name]: value
            }));
        },
        []
    );

    const handleSave = useCallback(() => {
        try {
            saveStoredSettings(settings);
            setSavedSettings(settings);

            window.dispatchEvent(
                new CustomEvent(
                    "sentinelscan-settings-updated",
                    {
                        detail: settings
                    }
                )
            );

            toast.success(
                "Settings saved successfully."
            );
        } catch (error) {
            console.error(
                "Unable to save settings:",
                error
            );

            toast.error(
                "Unable to save settings."
            );
        }
    }, [settings]);

    const handleReset = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
        setSavedSettings(
            DEFAULT_SETTINGS
        );

        saveStoredSettings(
            DEFAULT_SETTINGS
        );

        window.dispatchEvent(
            new CustomEvent(
                "sentinelscan-settings-updated",
                {
                    detail:
                        DEFAULT_SETTINGS
                }
            )
        );

        toast.success(
            "Settings reset to defaults."
        );
    }, []);

    const testConnection =
        useCallback(async () => {
            if (testing) {
                return;
            }

            setTesting(true);

            const controller =
                new AbortController();

            const startedAt =
                performance.now();

            const timeoutId =
                window.setTimeout(() => {
                    controller.abort();
                }, 10000);

            try {
                const response =
                    await api.get(
                        "/health",
                        {
                            signal:
                                controller.signal
                        }
                    );

                const responseTimeMs =
                    Math.round(
                        performance.now() -
                            startedAt
                    );

                const data =
                    response?.data &&
                    typeof response.data ===
                        "object"
                        ? response.data
                        : {};

                setConnection({
                    success: true,
                    service:
                        data.service ||
                        "SentinelScan API",
                    status:
                        data.status ||
                        "unknown",
                    responseTimeMs,
                    checkedAt: new Date()
                });

                toast.success(
                    "Backend connection successful."
                );
            } catch (error) {
                const message =
                    getConnectionErrorMessage(
                        error
                    );

                if (!message) {
                    return;
                }

                console.error(
                    "Connection test failed:",
                    error
                );

                setConnection({
                    success: false,
                    message,
                    checkedAt: new Date()
                });

                toast.error(message);
            } finally {
                window.clearTimeout(
                    timeoutId
                );

                setTesting(false);
            }
        }, [testing]);

    return (
        <Layout>
            <main className="mx-auto max-w-[1400px] space-y-8">
                <section className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-gray-900 to-slate-950 p-6 shadow-2xl sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                            <FaCog className="text-2xl text-cyan-400" />
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
                                Application Configuration
                            </p>

                            <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                                Settings
                            </h1>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base">
                                Configure local interface
                                preferences and verify the
                                SentinelScan API connection.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
                    <div className="flex items-center gap-3 border-b border-gray-800 px-6 py-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                            <FaClock className="text-xl text-cyan-400" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Dashboard Preferences
                            </h2>

                            <p className="mt-1 text-sm text-gray-400">
                                Stored locally in this browser
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 p-6">
                        <Toggle
                            enabled={
                                settings.autoRefreshEnabled
                            }
                            onChange={(value) =>
                                updateSetting(
                                    "autoRefreshEnabled",
                                    value
                                )
                            }
                            label="Automatic Refresh"
                            description="Allow dashboard data to refresh automatically while the application is open."
                        />

                        <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-4">
                            <label
                                htmlFor="refresh-interval"
                                className="font-semibold text-white"
                            >
                                Refresh Interval
                            </label>

                            <p className="mt-1 text-sm text-gray-500">
                                Controls how frequently supported
                                pages should request updated data.
                            </p>

                            <select
                                id="refresh-interval"
                                value={
                                    settings.refreshIntervalSeconds
                                }
                                onChange={(event) =>
                                    updateSetting(
                                        "refreshIntervalSeconds",
                                        Number(
                                            event
                                                .target
                                                .value
                                        )
                                    )
                                }
                                disabled={
                                    !settings.autoRefreshEnabled
                                }
                                className="mt-4 w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-gray-200 outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-xs"
                            >
                                {REFRESH_INTERVAL_OPTIONS.map(
                                    (option) => (
                                        <option
                                            key={
                                                option.value
                                            }
                                            value={
                                                option.value
                                            }
                                        >
                                            {
                                                option.label
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <Toggle
                            enabled={
                                settings.compactMode
                            }
                            onChange={(value) =>
                                updateSetting(
                                    "compactMode",
                                    value
                                )
                            }
                            label="Compact Interface"
                            description="Reduce selected spacing when supported by individual pages."
                        />

                        <Toggle
                            enabled={
                                settings.showAnimations
                            }
                            onChange={(value) =>
                                updateSetting(
                                    "showAnimations",
                                    value
                                )
                            }
                            label="Interface Animations"
                            description="Allow visual transitions and animated indicators."
                        />
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
                    <div className="flex flex-col gap-4 border-b border-gray-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
                                <FaServer className="text-xl text-purple-400" />
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Backend Connection
                                </h2>

                                <p className="mt-1 text-sm text-gray-400">
                                    Current Axios API configuration
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={
                                testConnection
                            }
                            disabled={testing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FaSyncAlt
                                className={
                                    testing
                                        ? "animate-spin"
                                        : ""
                                }
                            />

                            {testing
                                ? "Testing..."
                                : "Test Connection"}
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <InformationCard
                                icon={
                                    <FaServer />
                                }
                                title="API Base URL"
                                value={
                                    apiBaseUrl
                                }
                                subtitle="Read from the configured Axios instance."
                                valueClass="text-cyan-400"
                            />

                            <InformationCard
                                icon={<FaKey />}
                                title="API Authentication"
                                value={
                                    apiKeyConfigured
                                        ? "Configured"
                                        : "Not detected"
                                }
                                subtitle="The secret value is intentionally not displayed."
                                valueClass={
                                    apiKeyConfigured
                                        ? "text-green-400"
                                        : "text-yellow-400"
                                }
                            />

                            <InformationCard
                                icon={
                                    <FaDatabase />
                                }
                                title="Health Endpoint"
                                value="/health"
                                subtitle="Used for connection verification."
                                valueClass="font-mono text-purple-400"
                            />

                            <InformationCard
                                icon={
                                    <FaShieldAlt />
                                }
                                title="API Version"
                                value="1.0.0"
                                subtitle="Application version currently declared by SentinelScan."
                                valueClass="text-gray-200"
                            />
                        </div>

                        <div className="mt-5">
                            <ConnectionStatus
                                connection={
                                    connection
                                }
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 shadow-xl">
                    <div className="flex items-start gap-4">
                        <FaExclamationTriangle className="mt-1 shrink-0 text-xl text-yellow-400" />

                        <div>
                            <h2 className="font-bold text-yellow-200">
                                Client-side API key warning
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-gray-400">
                                Any API key bundled into a React
                                application can be inspected by a
                                user through browser developer
                                tools. A production deployment
                                should authenticate users through
                                the backend instead of treating a
                                frontend key as a private secret.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-900/70 p-5 shadow-xl sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-semibold text-white">
                            Settings status
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            {hasChanges
                                ? "You have unsaved changes."
                                : "All local settings are saved."}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-5 py-3 font-semibold text-gray-300 transition hover:border-red-500 hover:text-red-400"
                        >
                            <FaUndo />
                            Reset Defaults
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!hasChanges}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FaCheckCircle />
                            Save Settings
                        </button>
                    </div>
                </section>
            </main>
        </Layout>
    );
}

export default memo(Settings);
