import { memo } from "react";

import {
    FaEye,
    FaTrash,
    FaCheckCircle,
    FaExclamationTriangle,
    FaTimesCircle,
    FaShieldAlt,
    FaClock
} from "react-icons/fa";

const clampPercentage = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.min(100, Math.max(0, number));
};

const normalizeText = (value) =>
    String(value ?? "").trim().toUpperCase();

const formatDateTime = (value) => {
    if (!value) {
        return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Invalid date";
    }

    return date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const getPredictionMeta = (prediction) => {
    switch (normalizeText(prediction)) {
        case "LEGITIMATE":
            return {
                label: "Legitimate",
                icon: FaCheckCircle,
                className:
                    "border-green-500/20 bg-green-500/10 text-green-400"
            };

        case "SUSPICIOUS":
            return {
                label: "Suspicious",
                icon: FaExclamationTriangle,
                className:
                    "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
            };

        case "PHISHING":
            return {
                label: "Phishing",
                icon: FaTimesCircle,
                className:
                    "border-red-500/20 bg-red-500/10 text-red-400"
            };

        default:
            return {
                label: "Unknown",
                icon: FaShieldAlt,
                className:
                    "border-gray-700 bg-gray-800 text-gray-400"
            };
    }
};

const getSeverityMeta = (severity) => {
    const normalized = normalizeText(severity);

    const styles = {
        LOW:
            "border-green-500/20 bg-green-500/10 text-green-400",

        MEDIUM:
            "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",

        HIGH:
            "border-orange-500/20 bg-orange-500/10 text-orange-400",

        CRITICAL:
            "border-red-500/20 bg-red-500/10 text-red-400"
    };

    return {
        label: normalized || "N/A",
        className:
            styles[normalized] ??
            "border-gray-700 bg-gray-800 text-gray-400"
    };
};

const getRiskColor = (value) => {
    if (value <= 25) {
        return "bg-green-500";
    }

    if (value <= 50) {
        return "bg-yellow-400";
    }

    if (value <= 75) {
        return "bg-orange-500";
    }

    return "bg-red-600";
};

function PredictionBadge({ prediction }) {
    const meta =
        getPredictionMeta(prediction);

    const Icon = meta.icon;

    return (
        <span
            className={`
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                px-3
                py-1
                text-xs
                font-semibold
                ${meta.className}
            `}
        >
            <Icon />
            {meta.label}
        </span>
    );
}

function SeverityBadge({ severity }) {
    const meta =
        getSeverityMeta(severity);

    return (
        <span
            className={`
                inline-flex
                rounded-full
                border
                px-3
                py-1
                text-xs
                font-semibold
                ${meta.className}
            `}
        >
            {meta.label}
        </span>
    );
}

function EmptyState() {
    return (
        <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-800 bg-gray-950/60">
                <FaShieldAlt className="text-3xl text-cyan-400" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
                No Scan History
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                No scan records were found for the current page.
            </p>
        </div>
    );
}

function HistoryTable({
    scans = [],
    onView,
    onDelete
}) {
    const safeScans =
        Array.isArray(scans)
            ? scans
            : [];

    if (safeScans.length === 0) {
        return <EmptyState />;
    }

    return (
        <>
            {/* Desktop table */}

            <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full">
                    <thead className="bg-gray-950/70">
                        <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                            <th className="px-6 py-4 text-left">
                                URL
                            </th>

                            <th className="px-4 py-4 text-center">
                                Prediction
                            </th>

                            <th className="px-4 py-4 text-center">
                                Risk
                            </th>

                            <th className="px-4 py-4 text-center">
                                Severity
                            </th>

                            <th className="px-4 py-4 text-center">
                                Scan Time
                            </th>

                            <th className="px-6 py-4 text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {safeScans.map(
                            (scan, index) => {
                                const key =
                                    scan?.scan_id ??
                                    scan?.id ??
                                    `${scan?.url}-${index}`;

                                const riskScore =
                                    clampPercentage(
                                        scan?.risk_score
                                    );

                                return (
                                    <tr
                                        key={key}
                                        className="border-b border-gray-800/80 transition hover:bg-gray-800/60"
                                    >
                                        <td className="max-w-md px-6 py-4">
                                            <p
                                                title={
                                                    scan?.url ??
                                                    ""
                                                }
                                                className="truncate font-medium text-white"
                                            >
                                                {scan?.url ||
                                                    "Unknown URL"}
                                            </p>

                                            <p className="mt-1 truncate font-mono text-xs text-gray-600">
                                                {scan?.scan_id ||
                                                    "No scan ID"}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <PredictionBadge
                                                prediction={
                                                    scan?.prediction
                                                }
                                            />
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="mx-auto flex max-w-[150px] items-center gap-3">
                                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${getRiskColor(
                                                            riskScore
                                                        )}`}
                                                        style={{
                                                            width: `${riskScore}%`
                                                        }}
                                                    />
                                                </div>

                                                <span className="min-w-[42px] text-right text-sm font-semibold text-cyan-400">
                                                    {riskScore.toFixed(
                                                        0
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <SeverityBadge
                                                severity={
                                                    scan?.severity
                                                }
                                            />
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-center text-sm text-gray-400">
                                            <div className="inline-flex items-center gap-2">
                                                <FaClock className="text-gray-600" />

                                                {formatDateTime(
                                                    scan?.scan_time ??
                                                        scan?.created_at
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onView?.(
                                                            scan
                                                        )
                                                    }
                                                    title="View scan details"
                                                    aria-label="View scan details"
                                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-cyan-400 transition hover:border-cyan-500 hover:bg-cyan-500/10"
                                                >
                                                    <FaEye />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onDelete?.(
                                                            scan
                                                        )
                                                    }
                                                    title="Delete scan"
                                                    aria-label="Delete scan"
                                                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-red-400 transition hover:border-red-500 hover:bg-red-500/10"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}

            <div className="space-y-4 p-4 lg:hidden">
                {safeScans.map(
                    (scan, index) => {
                        const key =
                            scan?.scan_id ??
                            scan?.id ??
                            `${scan?.url}-${index}`;

                        const riskScore =
                            clampPercentage(
                                scan?.risk_score
                            );

                        return (
                            <article
                                key={key}
                                className="rounded-xl border border-gray-800 bg-gray-950/50 p-4"
                            >
                                <p
                                    title={
                                        scan?.url ??
                                        ""
                                    }
                                    className="break-all font-semibold text-white"
                                >
                                    {scan?.url ||
                                        "Unknown URL"}
                                </p>

                                <p className="mt-1 break-all font-mono text-xs text-gray-600">
                                    {scan?.scan_id ||
                                        "No scan ID"}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <PredictionBadge
                                        prediction={
                                            scan?.prediction
                                        }
                                    />

                                    <SeverityBadge
                                        severity={
                                            scan?.severity
                                        }
                                    />
                                </div>

                                <div className="mt-5">
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-gray-400">
                                            Risk score
                                        </span>

                                        <span className="font-semibold text-cyan-400">
                                            {riskScore.toFixed(
                                                0
                                            )}
                                            %
                                        </span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                                        <div
                                            className={`h-full rounded-full ${getRiskColor(
                                                riskScore
                                            )}`}
                                            style={{
                                                width: `${riskScore}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                                    <FaClock />

                                    {formatDateTime(
                                        scan?.scan_time ??
                                            scan?.created_at
                                    )}
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onView?.(
                                                scan
                                            )
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                                    >
                                        <FaEye />
                                        View
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            onDelete?.(
                                                scan
                                            )
                                        }
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                                    >
                                        <FaTrash />
                                        Delete
                                    </button>
                                </div>
                            </article>
                        );
                    }
                )}
            </div>
        </>
    );
}

export default memo(HistoryTable);
