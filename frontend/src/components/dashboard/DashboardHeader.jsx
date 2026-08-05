import React, { memo, useMemo } from "react";

import {
    FaShieldAlt,
    FaShieldVirus,
    FaBug,
    FaChartLine,
    FaSyncAlt,
    FaClock
} from "react-icons/fa";

const clampPercentage = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.min(100, Math.max(0, number));
};

const formatLastUpdated = (value) => {
    if (!value) {
        return "Not available";
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
};

const getThreatLevel = (averageRisk) => {
    if (averageRisk >= 75) {
        return {
            label: "CRITICAL",
            color: "red"
        };
    }

    if (averageRisk >= 50) {
        return {
            label: "HIGH",
            color: "orange"
        };
    }

    if (averageRisk >= 25) {
        return {
            label: "MODERATE",
            color: "yellow"
        };
    }

    return {
        label: "LOW",
        color: "green"
    };
};

const COLOR_STYLES = {
    cyan: {
        container:
            "border-cyan-500/30 bg-cyan-500/10",
        text: "text-cyan-400",
        dot: "bg-cyan-400"
    },

    green: {
        container:
            "border-green-500/30 bg-green-500/10",
        text: "text-green-400",
        dot: "bg-green-400"
    },

    yellow: {
        container:
            "border-yellow-500/30 bg-yellow-500/10",
        text: "text-yellow-400",
        dot: "bg-yellow-400"
    },

    orange: {
        container:
            "border-orange-500/30 bg-orange-500/10",
        text: "text-orange-400",
        dot: "bg-orange-400"
    },

    red: {
        container:
            "border-red-500/30 bg-red-500/10",
        text: "text-red-400",
        dot: "bg-red-400"
    }
};

function StatusCard({
    icon,
    title,
    value,
    subtitle,
    color = "cyan",
    pulse = false
}) {
    const theme =
        COLOR_STYLES[color] ??
        COLOR_STYLES.cyan;

    return (
        <div
            className={`
                rounded-2xl
                border
                p-4
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-lg
                ${theme.container}
            `}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-gray-400">
                        {title}
                    </p>

                    <p
                        className={`
                            mt-2
                            truncate
                            text-lg
                            font-bold
                            ${theme.text}
                        `}
                    >
                        {value}
                    </p>
                </div>

                <div
                    className={`
                        shrink-0
                        text-2xl
                        ${theme.text}
                    `}
                >
                    {icon}
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
                <span
                    className={`
                        h-2.5
                        w-2.5
                        rounded-full
                        ${theme.dot}
                        ${pulse ? "animate-pulse" : ""}
                    `}
                />

                <span className="truncate text-xs text-gray-400">
                    {subtitle}
                </span>
            </div>
        </div>
    );
}

function DashboardHeader({
    statistics = {},
    lastUpdated = null,
    refreshing = false,
    onRefresh
}) {
    const {
        total_scans: totalScansRaw = 0,
        phishing_detected: phishingRaw = 0,
        suspicious_detected:
            suspiciousRaw = 0,
        average_risk_score:
            averageRiskRaw = 0
    } = statistics ?? {};

    const totalScans =
        Number(totalScansRaw) || 0;

    const phishing =
        Number(phishingRaw) || 0;

    const suspicious =
        Number(suspiciousRaw) || 0;

    const averageRisk =
        clampPercentage(averageRiskRaw);

    const activeThreats =
        phishing + suspicious;

    const threatLevel = useMemo(
        () => getThreatLevel(averageRisk),
        [averageRisk]
    );

    const formattedLastUpdated =
        formatLastUpdated(lastUpdated);

    return (
        <header className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-gray-900 to-slate-950 shadow-2xl">
            <div className="p-6 sm:p-8">
                <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                                <FaShieldAlt className="text-3xl text-cyan-400" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
                                    Security Operations Center
                                </p>

                                <h1 className="mt-2 text-3xl font-extrabold tracking-wide text-white sm:text-4xl xl:text-5xl">
                                    SentinelScan
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
                                    AI-powered phishing detection,
                                    threat intelligence and
                                    explainable security analytics
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />

                                Dashboard Connected
                            </span>

                            <span className="rounded-full border border-gray-700 bg-gray-800/70 px-3 py-1.5 text-xs text-gray-400">
                                API v1.0.0
                            </span>

                            <span className="rounded-full border border-gray-700 bg-gray-800/70 px-3 py-1.5 text-xs text-gray-400">
                                Live Database Analytics
                            </span>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-3 text-sm text-gray-400">
                            <FaClock className="text-cyan-400" />

                            <div>
                                <p className="text-xs uppercase tracking-wider text-gray-500">
                                    Last updated
                                </p>

                                <p className="mt-1 font-semibold text-gray-200">
                                    {formattedLastUpdated}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={
                                refreshing ||
                                typeof onRefresh !==
                                    "function"
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FaSyncAlt
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />

                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatusCard
                        icon={<FaShieldVirus />}
                        title="Total Scans"
                        value={totalScans}
                        subtitle="URLs analysed"
                        color="cyan"
                    />

                    <StatusCard
                        icon={<FaBug />}
                        title="Active Threats"
                        value={activeThreats}
                        subtitle={`${phishing} phishing • ${suspicious} suspicious`}
                        color={
                            activeThreats > 0
                                ? "red"
                                : "green"
                        }
                        pulse={
                            activeThreats > 0
                        }
                    />

                    <StatusCard
                        icon={<FaChartLine />}
                        title="Average Risk"
                        value={`${averageRisk.toFixed(
                            2
                        )}%`}
                        subtitle="Calculated from stored scans"
                        color={
                            threatLevel.color
                        }
                    />

                    <StatusCard
                        icon={<FaShieldAlt />}
                        title="Threat Level"
                        value={threatLevel.label}
                        subtitle="Based on average risk"
                        color={
                            threatLevel.color
                        }
                        pulse={
                            threatLevel.label ===
                                "HIGH" ||
                            threatLevel.label ===
                                "CRITICAL"
                        }
                    />
                </div>
            </div>
        </header>
    );
}

export default memo(DashboardHeader);