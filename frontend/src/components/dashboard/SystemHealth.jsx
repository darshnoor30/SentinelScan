import React, { memo } from "react";

import {
    FaServer,
    FaClock,
    FaSyncAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaHeartbeat,
    FaNetworkWired
} from "react-icons/fa";

import useSystemHealth from "../../hooks/useSystemHealth";

const formatDateTime = (value) => {
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
};

const getStatusMeta = (status) => {
    const normalizedStatus = String(
        status ?? ""
    ).toUpperCase();

    const healthyStatuses = [
        "RUNNING",
        "ONLINE",
        "HEALTHY",
        "OK"
    ];

    const healthy =
        healthyStatuses.includes(
            normalizedStatus
        );

    return {
        healthy,
        label:
            normalizedStatus ||
            "UNKNOWN",
        dotClass: healthy
            ? "bg-green-500"
            : "bg-red-500",
        textClass: healthy
            ? "text-green-400"
            : "text-red-400",
        badgeClass: healthy
            ? "border-green-500/30 bg-green-500/10"
            : "border-red-500/30 bg-red-500/10"
    };
};

function LoadingState() {
    return (
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="border-b border-gray-800 px-6 py-5">
                <div className="h-6 w-40 animate-pulse rounded bg-gray-800" />

                <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-800/70" />
            </div>

            <div className="space-y-4 p-6">
                {[1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="h-20 animate-pulse rounded-xl border border-gray-800 bg-gray-900"
                    />
                ))}
            </div>
        </section>
    );
}

function ErrorState({
    message,
    refreshing,
    onRetry
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-gray-900 to-red-950/20 shadow-xl">
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                        <FaTimesCircle className="text-2xl text-red-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">
                            System Health Unavailable
                        </h2>

                        <p className="mt-2 text-sm text-gray-400">
                            {message}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onRetry}
                    disabled={refreshing}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <FaSyncAlt
                        className={
                            refreshing
                                ? "animate-spin"
                                : ""
                        }
                    />

                    {refreshing
                        ? "Checking..."
                        : "Retry Health Check"}
                </button>
            </div>
        </section>
    );
}

function HealthMetric({
    icon,
    title,
    value,
    subtitle,
    valueClass = "text-white"
}) {
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-4">
            <div className="flex items-start gap-3">
                <div className="mt-1 text-cyan-400">
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                        {title}
                    </p>

                    <p
                        className={`mt-1 break-words text-lg font-bold ${valueClass}`}
                    >
                        {value}
                    </p>

                    {subtitle && (
                        <p className="mt-1 text-xs text-gray-500">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function SystemHealth() {
    const {
        health,
        loading,
        refreshing,
        error,
        lastChecked,
        refresh
    } = useSystemHealth();

    if (loading && !health) {
        return <LoadingState />;
    }

    if (error && !health) {
        return (
            <ErrorState
                message={error}
                refreshing={refreshing}
                onRetry={refresh}
            />
        );
    }

    if (!health) {
        return null;
    }

    const statusMeta =
        getStatusMeta(health.status);

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="flex flex-col gap-4 border-b border-gray-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <FaHeartbeat className="text-xl text-cyan-400" />

                        <h2 className="text-2xl font-bold text-white">
                            System Health
                        </h2>
                    </div>

                    <p className="mt-2 text-sm text-gray-400">
                        Live status reported by the
                        SentinelScan backend
                    </p>
                </div>

                <div
                    className={`inline-flex items-center gap-3 rounded-xl border px-4 py-2 ${statusMeta.badgeClass}`}
                >
                    <span
                        className={`h-3 w-3 rounded-full ${statusMeta.dotClass} ${
                            statusMeta.healthy
                                ? "animate-pulse"
                                : ""
                        }`}
                    />

                    <span
                        className={`font-semibold ${statusMeta.textClass}`}
                    >
                        {statusMeta.label}
                    </span>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <HealthMetric
                        icon={<FaServer />}
                        title="Backend Service"
                        value={health.service}
                        subtitle="FastAPI application"
                        valueClass="text-cyan-400"
                    />

                    <HealthMetric
                        icon={<FaNetworkWired />}
                        title="API Response Time"
                        value={`${health.responseTimeMs ?? 0} ms`}
                        subtitle="Measured from this browser"
                        valueClass={
                            health.responseTimeMs <=
                            250
                                ? "text-green-400"
                                : health.responseTimeMs <=
                                    1000
                                  ? "text-yellow-400"
                                  : "text-red-400"
                        }
                    />

                    <HealthMetric
                        icon={<FaClock />}
                        title="Backend Timestamp"
                        value={formatDateTime(
                            health.backendTimestamp
                        )}
                        subtitle="Timestamp returned by FastAPI"
                    />

                    <HealthMetric
                        icon={<FaCheckCircle />}
                        title="Last Health Check"
                        value={formatDateTime(
                            lastChecked
                        )}
                        subtitle="Automatically checked every 30 seconds"
                        valueClass="text-green-400"
                    />
                </div>

                {error && (
                    <div className="mt-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                        The latest health refresh failed.
                        The panel is showing the most recent
                        successful result.
                    </div>
                )}

                <div className="mt-6 flex items-center justify-between border-t border-gray-800 pt-5">
                    <p className="text-xs text-gray-500">
                        No CPU, RAM, database or model
                        statistics are displayed until the
                        backend reports those values.
                    </p>

                    <button
                        type="button"
                        onClick={refresh}
                        disabled={refreshing}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-cyan-500 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <FaSyncAlt
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "Checking..."
                            : "Check Now"}
                    </button>
                </div>
            </div>
        </section>
    );
}

export default memo(SystemHealth);