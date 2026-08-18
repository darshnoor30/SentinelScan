import {
    memo,
    useMemo,
    useState
} from "react";

import {
    FaCheckCircle,
    FaExclamationTriangle,
    FaTimesCircle,
    FaShieldAlt,
    FaSearch,
    FaCopy,
    FaExternalLinkAlt
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
                    "bg-green-500/15 text-green-400 border-green-500/20"
            };

        case "SUSPICIOUS":
            return {
                label: "Suspicious",
                icon: FaExclamationTriangle,
                className:
                    "bg-yellow-500/15 text-yellow-300 border-yellow-500/20"
            };

        case "PHISHING":
            return {
                label: "Phishing",
                icon: FaTimesCircle,
                className:
                    "bg-red-500/15 text-red-400 border-red-500/20"
            };

        default:
            return {
                label: "Unknown",
                icon: FaShieldAlt,
                className:
                    "bg-gray-700/70 text-gray-300 border-gray-600"
            };
    }
};

const getSeverityMeta = (severity) => {
    const normalized = normalizeText(severity);

    const styles = {
        LOW: "bg-green-500/10 text-green-400 border-green-500/20",
        MEDIUM:
            "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
        HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        CRITICAL:
            "bg-red-500/10 text-red-400 border-red-500/20"
    };

    return {
        label: normalized || "N/A",
        className:
            styles[normalized] ||
            "bg-gray-700/70 text-gray-300 border-gray-600"
    };
};

const getRiskColor = (riskScore) => {
    if (riskScore <= 25) {
        return "bg-green-500";
    }

    if (riskScore <= 50) {
        return "bg-yellow-400";
    }

    if (riskScore <= 75) {
        return "bg-orange-500";
    }

    return "bg-red-600";
};

const getConfidenceColor = (confidence) => {
    if (confidence >= 90) {
        return "text-green-400";
    }

    if (confidence >= 70) {
        return "text-yellow-400";
    }

    return "text-red-400";
};

function PredictionBadge({ prediction }) {
    const meta = getPredictionMeta(prediction);
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
    const meta = getSeverityMeta(severity);

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

function EmptyState({ filtered }) {
    return (
        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-800 bg-gray-950/70 text-3xl">
                <FaShieldAlt className="text-cyan-400" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-gray-200">
                {filtered
                    ? "No matching scans found"
                    : "No scan history available"}
            </h3>

            <p className="mt-2 max-w-md text-sm text-gray-500">
                {filtered
                    ? "Try changing the search text or selected filters."
                    : "Run a URL scan to populate the recent activity table."}
            </p>
        </div>
    );
}

function RecentScans({ scans = [] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [predictionFilter, setPredictionFilter] =
        useState("ALL");
    const [severityFilter, setSeverityFilter] =
        useState("ALL");
    const [copiedId, setCopiedId] = useState(null);

    const safeScans = useMemo(
        () => (Array.isArray(scans) ? scans : []),
        [scans]
    );

    const filteredScans = useMemo(() => {
        const normalizedSearch =
            searchTerm.trim().toLowerCase();

        return safeScans.filter((scan) => {
            const url = String(scan?.url ?? "");
            const prediction = normalizeText(
                scan?.prediction
            );
            const severity = normalizeText(
                scan?.severity
            );

            const matchesSearch =
                !normalizedSearch ||
                url
                    .toLowerCase()
                    .includes(normalizedSearch);

            const matchesPrediction =
                predictionFilter === "ALL" ||
                prediction === predictionFilter;

            const matchesSeverity =
                severityFilter === "ALL" ||
                severity === severityFilter;

            return (
                matchesSearch &&
                matchesPrediction &&
                matchesSeverity
            );
        });
    }, [
        safeScans,
        searchTerm,
        predictionFilter,
        severityFilter
    ]);

    const handleCopy = async (scan) => {
        const url = String(scan?.url ?? "");

        if (!url) {
            return;
        }

        try {
            await navigator.clipboard.writeText(url);

            setCopiedId(scan?.scan_id ?? scan?.id);

            window.setTimeout(() => {
                setCopiedId(null);
            }, 1500);
        } catch (error) {
            console.error(
                "Unable to copy URL:",
                error
            );
        }
    };

    const hasActiveFilters =
        searchTerm.trim() ||
        predictionFilter !== "ALL" ||
        severityFilter !== "ALL";

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="border-b border-gray-800 px-6 py-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <FaShieldAlt className="text-xl text-cyan-400" />

                            <h2 className="text-2xl font-bold text-white">
                                Recent Scan History
                            </h2>
                        </div>

                        <p className="mt-2 text-sm text-gray-400">
                            Latest real URL analysis records
                            stored by SentinelScan
                        </p>
                    </div>

                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
                        {filteredScans.length} of{" "}
                        {safeScans.length} results
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
                    <label className="relative">
                        <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />

                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                            placeholder="Search by URL..."
                            className="w-full rounded-xl border border-gray-800 bg-gray-950/70 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-500"
                        />
                    </label>

                    <select
                        value={predictionFilter}
                        onChange={(event) =>
                            setPredictionFilter(
                                event.target.value
                            )
                        }
                        className="rounded-xl border border-gray-800 bg-gray-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
                    >
                        <option value="ALL">
                            All predictions
                        </option>
                        <option value="LEGITIMATE">
                            Legitimate
                        </option>
                        <option value="SUSPICIOUS">
                            Suspicious
                        </option>
                        <option value="PHISHING">
                            Phishing
                        </option>
                    </select>

                    <select
                        value={severityFilter}
                        onChange={(event) =>
                            setSeverityFilter(
                                event.target.value
                            )
                        }
                        className="rounded-xl border border-gray-800 bg-gray-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
                    >
                        <option value="ALL">
                            All severities
                        </option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">
                            Medium
                        </option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">
                            Critical
                        </option>
                    </select>
                </div>
            </div>

            {filteredScans.length === 0 ? (
                <EmptyState
                    filtered={Boolean(
                        hasActiveFilters
                    )}
                />
            ) : (
                <>
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
                                        Severity
                                    </th>
                                    <th className="px-4 py-4 text-center">
                                        Risk
                                    </th>
                                    <th className="px-4 py-4 text-center">
                                        Confidence
                                    </th>
                                    <th className="px-4 py-4 text-center">
                                        Scan time
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredScans.map(
                                    (scan, index) => {
                                        const key =
                                            scan?.scan_id ??
                                            scan?.id ??
                                            `${scan?.url}-${index}`;

                                        const riskScore =
                                            clampPercentage(
                                                scan?.risk_score
                                            );

                                        const confidence =
                                            clampPercentage(
                                                scan?.confidence
                                            );

                                        return (
                                            <tr
                                                key={key}
                                                className="border-b border-gray-800/80 transition hover:bg-gray-800/60"
                                            >
                                                <td className="max-w-md px-6 py-4">
                                                    <div
                                                        title={
                                                            scan?.url ??
                                                            ""
                                                        }
                                                        className="truncate font-medium text-white"
                                                    >
                                                        {scan?.url ||
                                                            "Unknown URL"}
                                                    </div>

                                                    <div className="mt-1 text-xs text-gray-600">
                                                        ID:{" "}
                                                        {scan?.scan_id ||
                                                            "N/A"}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <PredictionBadge
                                                        prediction={
                                                            scan?.prediction
                                                        }
                                                    />
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <SeverityBadge
                                                        severity={
                                                            scan?.severity
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

                                                <td
                                                    className={`px-4 py-4 text-center text-sm font-semibold ${getConfidenceColor(
                                                        confidence
                                                    )}`}
                                                >
                                                    {confidence.toFixed(
                                                        1
                                                    )}
                                                    %
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-4 text-center text-sm text-gray-400">
                                                    {formatDateTime(
                                                        scan?.scan_time
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCopy(
                                                                    scan
                                                                )
                                                            }
                                                            title="Copy URL"
                                                            className="rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 transition hover:border-cyan-500 hover:text-cyan-400"
                                                        >
                                                            <FaCopy />
                                                        </button>

                                                        <a
                                                            href={
                                                                scan?.url ||
                                                                "#"
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            title="Open URL"
                                                            className="rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 transition hover:border-cyan-500 hover:text-cyan-400"
                                                        >
                                                            <FaExternalLinkAlt />
                                                        </a>
                                                    </div>

                                                    {copiedId ===
                                                        key && (
                                                        <p className="mt-1 text-right text-xs text-green-400">
                                                            Copied
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-4 p-4 lg:hidden">
                        {filteredScans.map(
                            (scan, index) => {
                                const key =
                                    scan?.scan_id ??
                                    scan?.id ??
                                    `${scan?.url}-${index}`;

                                const riskScore =
                                    clampPercentage(
                                        scan?.risk_score
                                    );

                                const confidence =
                                    clampPercentage(
                                        scan?.confidence
                                    );

                                return (
                                    <article
                                        key={key}
                                        className="rounded-xl border border-gray-800 bg-gray-950/50 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-white">
                                                    {scan?.url ||
                                                        "Unknown URL"}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    {formatDateTime(
                                                        scan?.scan_time
                                                    )}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCopy(
                                                        scan
                                                    )
                                                }
                                                className="rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300"
                                            >
                                                <FaCopy />
                                            </button>
                                        </div>

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

                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-sm text-gray-400">
                                                Confidence
                                            </span>

                                            <span
                                                className={`font-semibold ${getConfidenceColor(
                                                    confidence
                                                )}`}
                                            >
                                                {confidence.toFixed(
                                                    1
                                                )}
                                                %
                                            </span>
                                        </div>
                                    </article>
                                );
                            }
                        )}
                    </div>
                </>
            )}
        </section>
    );
}

export default memo(RecentScans);
