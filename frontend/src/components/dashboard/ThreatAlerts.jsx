import React, {
    memo,
    useMemo,
    useState
} from "react";

import {
    FaBug,
    FaShieldAlt,
    FaExclamationTriangle,
    FaGlobe,
    FaDatabase,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaChevronDown,
    FaChevronUp,
    FaFingerprint
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

const formatRelativeTime = (value) => {
    if (!value) {
        return "Unknown time";
    }

    const timestamp = new Date(value).getTime();

    if (Number.isNaN(timestamp)) {
        return "Unknown time";
    }

    const difference =
        Date.now() - timestamp;

    const seconds = Math.floor(
        difference / 1000
    );

    if (seconds < 60) {
        return "Just now";
    }

    const minutes = Math.floor(
        seconds / 60
    );

    if (minutes < 60) {
        return `${minutes} min ago`;
    }

    const hours = Math.floor(
        minutes / 60
    );

    if (hours < 24) {
        return `${hours} hr ago`;
    }

    const days = Math.floor(
        hours / 24
    );

    return `${days} day${days === 1 ? "" : "s"} ago`;
};

const getAlertMeta = (prediction, severity) => {
    const normalizedPrediction =
        normalizeText(prediction);

    const normalizedSeverity =
        normalizeText(severity);

    if (
        normalizedPrediction === "PHISHING" ||
        normalizedSeverity === "CRITICAL"
    ) {
        return {
            icon: FaBug,
            label: "Critical Threat",
            border: "border-red-500",
            iconClass: "text-red-500",
            badge:
                "border-red-500/30 bg-red-500/10 text-red-400",
            glow: "shadow-red-500/5"
        };
    }

    if (
        normalizedPrediction === "SUSPICIOUS" ||
        normalizedSeverity === "HIGH"
    ) {
        return {
            icon: FaExclamationTriangle,
            label: "High Risk",
            border: "border-yellow-400",
            iconClass: "text-yellow-400",
            badge:
                "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
            glow: "shadow-yellow-500/5"
        };
    }

    return {
        icon: FaShieldAlt,
        label: "Security Alert",
        border: "border-cyan-500",
        iconClass: "text-cyan-400",
        badge:
            "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
        glow: "shadow-cyan-500/5"
    };
};

const getThreatSources = (
    threatIntelligence
) => {
    const intelligence =
        threatIntelligence &&
        typeof threatIntelligence ===
            "object"
            ? threatIntelligence
            : {};

    const virusTotal =
        intelligence.virustotal ?? {};

    const safeBrowsing =
        intelligence.safe_browsing ?? {};

    const phishTank =
        intelligence.phishtank ?? {};

    return [
        {
            name: "VirusTotal",
            available:
                Boolean(
                    virusTotal
                        .virustotal_available
                ) ||
                Number(
                    virusTotal
                        .vt_malicious_votes
                ) > 0 ||
                Number(
                    virusTotal
                        .vt_suspicious_votes
                ) > 0,
            detected:
                Number(
                    virusTotal
                        .vt_malicious_votes
                ) > 0 ||
                Number(
                    virusTotal
                        .vt_suspicious_votes
                ) > 0
        },
        {
            name: "Safe Browsing",
            available:
                Boolean(
                    safeBrowsing
                        .safe_browsing_available
                ) ||
                Number(
                    safeBrowsing
                        .threat_types_count
                ) > 0,
            detected:
                Number(
                    safeBrowsing
                        .malware_detected
                ) > 0 ||
                Number(
                    safeBrowsing
                        .social_engineering_detected
                ) > 0 ||
                Number(
                    safeBrowsing
                        .unwanted_software_detected
                ) > 0
        },
        {
            name: "PhishTank",
            available:
                Boolean(
                    phishTank
                        .phishtank_available
                ),
            detected:
                Boolean(
                    phishTank
                        .phishtank_listed
                )
        }
    ];
};

function MetricCard({
    label,
    value,
    valueClass = "text-white"
}) {
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-3">
            <p className="text-xs uppercase tracking-wider text-gray-500">
                {label}
            </p>

            <p
                className={`mt-1 text-lg font-bold ${valueClass}`}
            >
                {value}
            </p>
        </div>
    );
}

function ThreatSourceBadge({
    source
}) {
    const className = source.detected
        ? "border-red-500/30 bg-red-500/10 text-red-400"
        : source.available
          ? "border-green-500/30 bg-green-500/10 text-green-400"
          : "border-gray-700 bg-gray-800 text-gray-400";

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
                ${className}
            `}
        >
            {source.detected ? (
                <FaTimesCircle />
            ) : source.available ? (
                <FaCheckCircle />
            ) : (
                <FaDatabase />
            )}

            {source.name}
        </span>
    );
}

function EmptyThreatState() {
    return (
        <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10">
                <FaShieldAlt className="text-3xl text-green-400" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-gray-200">
                No active threats detected
            </h3>

            <p className="mt-2 max-w-md text-sm text-gray-500">
                Recent scans contain no suspicious or phishing verdicts.
            </p>
        </div>
    );
}

function ThreatAlertCard({
    scan,
    expanded,
    onToggle
}) {
    const meta = getAlertMeta(
        scan?.prediction,
        scan?.severity
    );

    const Icon = meta.icon;

    const riskScore = clampPercentage(
        scan?.risk_score
    );

    const confidence = clampPercentage(
        scan?.confidence
    );

    const reasons = Array.isArray(
        scan?.reasons
    )
        ? scan.reasons.filter(Boolean)
        : [];

    const intelligence =
        scan?.threat_intelligence &&
        typeof scan.threat_intelligence ===
            "object"
            ? scan.threat_intelligence
            : {};

    const summary =
        intelligence.summary &&
        typeof intelligence.summary ===
            "object"
            ? intelligence.summary
            : {};

    const sources =
        getThreatSources(intelligence);

    const threatSourcesDetected =
        Number(
            summary
                .threat_sources_detected
        ) || 0;

    const sourcesChecked =
        Number(
            summary.sources_checked
        ) || 0;

    const knownThreat =
        Boolean(
            summary.is_known_threat
        );

    return (
        <article
            className={`
                overflow-hidden
                rounded-2xl
                border
                border-gray-800
                border-l-4
                bg-gray-900/80
                shadow-xl
                transition
                hover:bg-gray-800/80
                ${meta.border}
                ${meta.glow}
            `}
        >
            <div className="p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-700 bg-gray-950/60">
                            <Icon
                                className={`text-2xl ${meta.iconClass}`}
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-lg font-bold text-white">
                                    {normalizeText(
                                        scan?.prediction
                                    ) || "UNKNOWN"}
                                </h3>

                                <span
                                    className={`
                                        rounded-full
                                        border
                                        px-3
                                        py-1
                                        text-xs
                                        font-semibold
                                        ${meta.badge}
                                    `}
                                >
                                    {meta.label}
                                </span>

                                <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300">
                                    {normalizeText(
                                        scan?.severity
                                    ) || "N/A"}
                                </span>
                            </div>

                            <p
                                title={
                                    scan?.url ?? ""
                                }
                                className="mt-3 break-all text-sm text-gray-300"
                            >
                                {scan?.url ||
                                    "Unknown URL"}
                            </p>

                            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                                <MetricCard
                                    label="Risk score"
                                    value={`${riskScore.toFixed(
                                        0
                                    )}%`}
                                    valueClass={
                                        riskScore >=
                                        75
                                            ? "text-red-400"
                                            : riskScore >=
                                                50
                                              ? "text-orange-400"
                                              : "text-yellow-300"
                                    }
                                />

                                <MetricCard
                                    label="Confidence"
                                    value={`${confidence.toFixed(
                                        1
                                    )}%`}
                                    valueClass="text-cyan-400"
                                />

                                <MetricCard
                                    label="Threat sources"
                                    value={
                                        threatSourcesDetected
                                    }
                                    valueClass="text-red-400"
                                />

                                <MetricCard
                                    label="Known threat"
                                    value={
                                        knownThreat
                                            ? "YES"
                                            : "NO"
                                    }
                                    valueClass={
                                        knownThreat
                                            ? "text-red-400"
                                            : "text-green-400"
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 rounded-xl border border-gray-800 bg-gray-950/50 p-4 text-sm">
                        <div className="flex items-center gap-2 text-cyan-400">
                            <FaClock />

                            <span>
                                {formatRelativeTime(
                                    scan?.scan_time
                                )}
                            </span>
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                            {formatDateTime(
                                scan?.scan_time
                            )}
                        </p>

                        <div className="mt-4 flex items-center gap-2 text-gray-400">
                            <FaGlobe />

                            <span>
                                {sourcesChecked} sources checked
                            </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-gray-400">
                            <FaFingerprint />

                            <span>
                                ID:{" "}
                                {scan?.scan_id
                                    ? String(
                                          scan.scan_id
                                      ).slice(
                                          0,
                                          8
                                      )
                                    : "N/A"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    {sources.map((source) => (
                        <ThreatSourceBadge
                            key={source.name}
                            source={source}
                        />
                    ))}
                </div>

                <button
                    type="button"
                    onClick={onToggle}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-cyan-500 hover:text-cyan-400"
                >
                    {expanded ? (
                        <>
                            <FaChevronUp />
                            Hide details
                        </>
                    ) : (
                        <>
                            <FaChevronDown />
                            View detection details
                        </>
                    )}
                </button>
            </div>

            {expanded && (
                <div className="border-t border-gray-800 bg-gray-950/50 px-5 py-5">
                    <h4 className="font-semibold text-white">
                        Detection reasons
                    </h4>

                    {reasons.length === 0 ? (
                        <p className="mt-3 text-sm text-gray-500">
                            No explanation was returned for this scan.
                        </p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {reasons.map(
                                (reason, index) => (
                                    <li
                                        key={`${scan?.scan_id}-${index}`}
                                        className="flex gap-3 text-sm text-gray-400"
                                    >
                                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />

                                        <span>
                                            {reason}
                                        </span>
                                    </li>
                                )
                            )}
                        </ul>
                    )}
                </div>
            )}
        </article>
    );
}

function ThreatAlerts({
    scans = []
}) {
    const [expandedScanId, setExpandedScanId] =
        useState(null);

    const alerts = useMemo(() => {
        if (!Array.isArray(scans)) {
            return [];
        }

        return scans
            .filter((scan) => {
                const prediction =
                    normalizeText(
                        scan?.prediction
                    );

                return (
                    prediction ===
                        "SUSPICIOUS" ||
                    prediction ===
                        "PHISHING"
                );
            })
            .slice(0, 6);
    }, [scans]);

    const handleToggle = (scanId) => {
        setExpandedScanId(
            (current) =>
                current === scanId
                    ? null
                    : scanId
        );
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="flex flex-col gap-3 border-b border-gray-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">
                        Live Threat Intelligence
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                        Suspicious and phishing verdicts from recent scans
                    </p>
                </div>

                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300">
                    {alerts.length} active alert
                    {alerts.length === 1
                        ? ""
                        : "s"}
                </div>
            </div>

            {alerts.length === 0 ? (
                <EmptyThreatState />
            ) : (
                <div className="space-y-5 p-6">
                    {alerts.map(
                        (scan, index) => {
                            const scanId =
                                scan?.scan_id ??
                                scan?.id ??
                                `${scan?.url}-${index}`;

                            return (
                                <ThreatAlertCard
                                    key={scanId}
                                    scan={scan}
                                    expanded={
                                        expandedScanId ===
                                        scanId
                                    }
                                    onToggle={() =>
                                        handleToggle(
                                            scanId
                                        )
                                    }
                                />
                            );
                        }
                    )}
                </div>
            )}
        </section>
    );
}

export default memo(ThreatAlerts);