import React, { memo } from "react";

import {
    FaCheckCircle,
    FaExclamationTriangle,
    FaTimesCircle,
    FaFingerprint,
    FaClock,
    FaShieldAlt,
    FaChartLine
} from "react-icons/fa";

const clampPercentage = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.min(100, Math.max(0, number));
};

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

const getPredictionMeta = (prediction) => {
    const normalized = String(
        prediction ?? "UNKNOWN"
    ).toUpperCase();

    if (normalized === "LEGITIMATE") {
        return {
            label: "LEGITIMATE",
            icon: FaCheckCircle,
            text: "text-green-400",
            border: "border-green-500/30",
            background: "bg-green-500/10"
        };
    }

    if (normalized === "PHISHING") {
        return {
            label: "PHISHING",
            icon: FaTimesCircle,
            text: "text-red-400",
            border: "border-red-500/30",
            background: "bg-red-500/10"
        };
    }

    if (normalized === "SUSPICIOUS") {
        return {
            label: "SUSPICIOUS",
            icon: FaExclamationTriangle,
            text: "text-yellow-400",
            border: "border-yellow-500/30",
            background: "bg-yellow-500/10"
        };
    }

    return {
        label: "UNKNOWN",
        icon: FaShieldAlt,
        text: "text-gray-400",
        border: "border-gray-700",
        background: "bg-gray-800"
    };
};

const getSeverityMeta = (severity) => {
    const normalized = String(
        severity ?? "UNKNOWN"
    ).toUpperCase();

    const themes = {
        LOW: {
            text: "text-green-400",
            border: "border-green-500/30",
            background: "bg-green-500/10"
        },
        MEDIUM: {
            text: "text-yellow-400",
            border: "border-yellow-500/30",
            background: "bg-yellow-500/10"
        },
        HIGH: {
            text: "text-orange-400",
            border: "border-orange-500/30",
            background: "bg-orange-500/10"
        },
        CRITICAL: {
            text: "text-red-400",
            border: "border-red-500/30",
            background: "bg-red-500/10"
        }
    };

    return {
        label: normalized,
        ...(themes[normalized] ?? {
            text: "text-gray-400",
            border: "border-gray-700",
            background: "bg-gray-800"
        })
    };
};

function MetricCard({
    icon,
    label,
    value,
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
                        {label}
                    </p>

                    <p
                        className={`mt-1 break-words text-xl font-bold ${valueClass}`}
                    >
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

function PredictionCard({ result }) {
    if (
        !result ||
        typeof result !== "object"
    ) {
        return null;
    }

    const predictionMeta =
        getPredictionMeta(
            result.prediction
        );

    const severityMeta =
        getSeverityMeta(
            result.severity
        );

    const PredictionIcon =
        predictionMeta.icon;

    const riskScore =
        clampPercentage(
            result.risk_score
        );

    const confidence =
        clampPercentage(
            result.confidence
        );

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="flex flex-col gap-4 border-b border-gray-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        Scan Result
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                        Final prediction and risk summary
                    </p>
                </div>

                <div
                    className={`
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        border
                        px-4
                        py-2
                        text-sm
                        font-bold
                        ${predictionMeta.text}
                        ${predictionMeta.border}
                        ${predictionMeta.background}
                    `}
                >
                    <PredictionIcon />
                    {predictionMeta.label}
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        icon={<FaShieldAlt />}
                        label="Severity"
                        value={severityMeta.label}
                        valueClass={
                            severityMeta.text
                        }
                    />

                    <MetricCard
                        icon={<FaChartLine />}
                        label="Risk Score"
                        value={`${riskScore.toFixed(
                            0
                        )}%`}
                        valueClass={
                            riskScore >= 75
                                ? "text-red-400"
                                : riskScore >= 50
                                  ? "text-orange-400"
                                  : riskScore >= 25
                                    ? "text-yellow-400"
                                    : "text-green-400"
                        }
                    />

                    <MetricCard
                        icon={<FaCheckCircle />}
                        label="Confidence"
                        value={`${confidence.toFixed(
                            1
                        )}%`}
                        valueClass={
                            confidence >= 90
                                ? "text-green-400"
                                : confidence >= 70
                                  ? "text-yellow-400"
                                  : "text-red-400"
                        }
                    />

                    <MetricCard
                        icon={<FaClock />}
                        label="Scan Time"
                        value={formatDateTime(
                            result.scan_time
                        )}
                        valueClass="text-gray-200"
                    />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div
                        className={`
                            rounded-xl
                            border
                            p-5
                            ${predictionMeta.border}
                            ${predictionMeta.background}
                        `}
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className={`
                                    flex
                                    h-12
                                    w-12
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    border
                                    ${predictionMeta.border}
                                    ${predictionMeta.text}
                                `}
                            >
                                <PredictionIcon className="text-2xl" />
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider text-gray-500">
                                    Detection Verdict
                                </p>

                                <p
                                    className={`mt-2 text-2xl font-bold ${predictionMeta.text}`}
                                >
                                    {predictionMeta.label}
                                </p>

                                <p className="mt-2 text-sm leading-6 text-gray-400">
                                    The verdict is based on the
                                    machine-learning prediction,
                                    calculated risk indicators and
                                    available threat-intelligence
                                    evidence.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-5">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                                <FaFingerprint className="text-2xl" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs uppercase tracking-wider text-gray-500">
                                    Scan Identifier
                                </p>

                                <p
                                    title={
                                        result.scan_id ??
                                        ""
                                    }
                                    className="mt-2 break-all font-mono text-sm font-semibold text-cyan-400"
                                >
                                    {result.scan_id ||
                                        "Not available"}
                                </p>

                                {result.url && (
                                    <>
                                        <p className="mt-4 text-xs uppercase tracking-wider text-gray-500">
                                            Analysed URL
                                        </p>

                                        <p
                                            title={
                                                result.url
                                            }
                                            className="mt-2 break-all text-sm text-gray-300"
                                        >
                                            {result.url}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(PredictionCard);