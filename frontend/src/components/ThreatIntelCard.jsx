import { memo, useMemo } from "react";

import {
    FaShieldAlt,
    FaGlobe,
    FaDatabase,
    FaBug,
    FaCheckCircle,
    FaTimesCircle,
    FaQuestionCircle
} from "react-icons/fa";

const toBoolean = (value) => {
    if (value === true || value === 1 || value === "1") {
        return true;
    }

    if (value === false || value === 0 || value === "0") {
        return false;
    }

    return null;
};

const toNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
};

const normalizeObject = (value) =>
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
        ? value
        : {};

function StatusBadge({
    status,
    positiveLabel = "Available",
    negativeLabel = "Unavailable",
    unknownLabel = "Unknown"
}) {
    if (status === true) {
        return (
            <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                <FaCheckCircle />
                {positiveLabel}
            </span>
        );
    }

    if (status === false) {
        return (
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                <FaTimesCircle />
                {negativeLabel}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-400">
            <FaQuestionCircle />
            {unknownLabel}
        </span>
    );
}

function DetectionBadge({
    detected
}) {
    if (detected === true) {
        return (
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                <FaTimesCircle />
                Threat detected
            </span>
        );
    }

    if (detected === false) {
        return (
            <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                <FaCheckCircle />
                No threat detected
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-400">
            <FaQuestionCircle />
            Not reported
        </span>
    );
}

function Metric({
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

function SourceCard({
    icon,
    title,
    iconClass,
    available,
    detected,
    metrics = []
}) {
    return (
        <article className="rounded-2xl border border-gray-800 bg-gray-950/40 p-5 transition hover:border-gray-700 hover:bg-gray-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-700 bg-gray-900">
                        <span className={`text-xl ${iconClass}`}>
                            {icon}
                        </span>
                    </div>

                    <div>
                        <h3 className="font-bold text-white">
                            {title}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                            External threat-intelligence source
                        </p>
                    </div>
                </div>

                <StatusBadge status={available} />
            </div>

            <div className="mt-5">
                <DetectionBadge detected={detected} />
            </div>

            {metrics.length > 0 && (
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {metrics.map((metric) => (
                        <Metric
                            key={metric.label}
                            label={metric.label}
                            value={metric.value}
                            valueClass={metric.valueClass}
                        />
                    ))}
                </div>
            )}
        </article>
    );
}

function EmptyState() {
    return (
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="border-b border-gray-800 px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                        <FaGlobe className="text-xl text-cyan-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Threat Intelligence
                        </h2>

                        <p className="mt-1 text-sm text-gray-400">
                            External reputation and threat-source results
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                <FaQuestionCircle className="text-4xl text-gray-600" />

                <h3 className="mt-5 text-lg font-semibold text-gray-200">
                    No threat intelligence available
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                    The backend did not return threat-intelligence information
                    for this scan.
                </p>
            </div>
        </section>
    );
}

function ThreatIntelCard({
    threatIntel
}) {
    const intelligence = useMemo(
        () => normalizeObject(threatIntel),
        [threatIntel]
    );

    const hasData =
        Object.keys(intelligence).length > 0;

    if (!hasData) {
        return <EmptyState />;
    }

    const virusTotal =
        normalizeObject(
            intelligence.virustotal
        );

    const safeBrowsing =
        normalizeObject(
            intelligence.safe_browsing
        );

    const phishTank =
        normalizeObject(
            intelligence.phishtank
        );

    const summary =
        normalizeObject(
            intelligence.summary
        );

    const virusTotalAvailable =
        toBoolean(
            virusTotal.virustotal_available
        );

    const virusTotalMaliciousVotes =
        toNumber(
            virusTotal.vt_malicious_votes
        );

    const virusTotalSuspiciousVotes =
        toNumber(
            virusTotal.vt_suspicious_votes
        );

    const virusTotalDetected =
        virusTotalAvailable === null
            ? null
            : virusTotalMaliciousVotes > 0 ||
              virusTotalSuspiciousVotes > 0;

    const safeBrowsingAvailable =
        toBoolean(
            safeBrowsing.safe_browsing_available
        );

    const malwareDetected =
        toBoolean(
            safeBrowsing.malware_detected
        );

    const socialEngineeringDetected =
        toBoolean(
            safeBrowsing.social_engineering_detected
        );

    const unwantedSoftwareDetected =
        toBoolean(
            safeBrowsing.unwanted_software_detected
        );

    const safeBrowsingDetected =
        safeBrowsingAvailable === null
            ? null
            : Boolean(
                  malwareDetected ||
                  socialEngineeringDetected ||
                  unwantedSoftwareDetected
              );

    const phishTankAvailable =
        toBoolean(
            phishTank.phishtank_available
        );

    const phishTankListed =
        toBoolean(
            phishTank.phishtank_listed
        );

    const sourcesChecked =
        toNumber(
            summary.sources_checked
        );

    const threatSourcesDetected =
        toNumber(
            summary.threat_sources_detected
        );

    const knownThreat =
        toBoolean(
            summary.is_known_threat
        );

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="flex flex-col gap-4 border-b border-gray-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                        <FaGlobe className="text-xl text-cyan-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Threat Intelligence
                        </h2>

                        <p className="mt-1 text-sm text-gray-400">
                            Reputation checks reported by configured sources
                        </p>
                    </div>
                </div>

                <StatusBadge
                    status={
                        knownThreat === null
                            ? null
                            : !knownThreat
                    }
                    positiveLabel="No known threat"
                    negativeLabel="Known threat"
                    unknownLabel="Threat status unknown"
                />
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                    <SourceCard
                        icon={<FaShieldAlt />}
                        title="VirusTotal"
                        iconClass="text-cyan-400"
                        available={virusTotalAvailable}
                        detected={virusTotalDetected}
                        metrics={[
                            {
                                label: "Malicious Votes",
                                value: virusTotalMaliciousVotes,
                                valueClass:
                                    virusTotalMaliciousVotes > 0
                                        ? "text-red-400"
                                        : "text-green-400"
                            },
                            {
                                label: "Suspicious Votes",
                                value: virusTotalSuspiciousVotes,
                                valueClass:
                                    virusTotalSuspiciousVotes > 0
                                        ? "text-yellow-400"
                                        : "text-green-400"
                            }
                        ]}
                    />

                    <SourceCard
                        icon={<FaGlobe />}
                        title="Google Safe Browsing"
                        iconClass="text-green-400"
                        available={safeBrowsingAvailable}
                        detected={safeBrowsingDetected}
                        metrics={[
                            {
                                label: "Malware",
                                value:
                                    malwareDetected === null
                                        ? "N/A"
                                        : malwareDetected
                                          ? "Detected"
                                          : "Not detected",
                                valueClass:
                                    malwareDetected
                                        ? "text-red-400"
                                        : "text-green-400"
                            },
                            {
                                label: "Social Engineering",
                                value:
                                    socialEngineeringDetected === null
                                        ? "N/A"
                                        : socialEngineeringDetected
                                          ? "Detected"
                                          : "Not detected",
                                valueClass:
                                    socialEngineeringDetected
                                        ? "text-red-400"
                                        : "text-green-400"
                            }
                        ]}
                    />

                    <SourceCard
                        icon={<FaDatabase />}
                        title="PhishTank"
                        iconClass="text-yellow-400"
                        available={phishTankAvailable}
                        detected={phishTankListed}
                        metrics={[
                            {
                                label: "Database Status",
                                value:
                                    phishTankListed === null
                                        ? "Not reported"
                                        : phishTankListed
                                          ? "Listed"
                                          : "Not listed",
                                valueClass:
                                    phishTankListed
                                        ? "text-red-400"
                                        : "text-green-400"
                            }
                        ]}
                    />
                </div>

                <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-950/50 p-5">
                    <div className="flex items-center gap-3">
                        <FaBug className="text-xl text-red-400" />

                        <div>
                            <h3 className="font-bold text-white">
                                Intelligence Summary
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                                Aggregated values returned by the backend
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Metric
                            label="Sources Checked"
                            value={sourcesChecked}
                            valueClass="text-cyan-400"
                        />

                        <Metric
                            label="Threat Sources"
                            value={threatSourcesDetected}
                            valueClass={
                                threatSourcesDetected > 0
                                    ? "text-red-400"
                                    : "text-green-400"
                            }
                        />

                        <Metric
                            label="Known Threat"
                            value={
                                knownThreat === null
                                    ? "Unknown"
                                    : knownThreat
                                      ? "Yes"
                                      : "No"
                            }
                            valueClass={
                                knownThreat
                                    ? "text-red-400"
                                    : knownThreat === false
                                      ? "text-green-400"
                                      : "text-gray-400"
                            }
                        />
                    </div>
                </div>

                <p className="mt-5 text-xs leading-5 text-gray-600">
                    “Unavailable” means the backend explicitly reported that a
                    source was not available. “Unknown” means the expected field
                    was not returned.
                </p>
            </div>
        </section>
    );
}

export default memo(ThreatIntelCard);
