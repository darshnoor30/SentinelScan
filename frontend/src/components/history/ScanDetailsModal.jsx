import React, {
    memo,
    useEffect,
    useMemo
} from "react";

import {
    FaTimes,
    FaShieldAlt,
    FaLink,
    FaExclamationTriangle,
    FaBrain,
    FaClock,
    FaFingerprint,
    FaGlobe,
    FaDatabase,
    FaCheckCircle,
    FaTimesCircle
} from "react-icons/fa";

const clampPercentage = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.min(100, Math.max(0, number));
};

const normalizeObject = (value) =>
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
        ? value
        : {};

const normalizeArray = (value) =>
    Array.isArray(value)
        ? value.filter(Boolean)
        : [];

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

    const themes = {
        LEGITIMATE: {
            label: "LEGITIMATE",
            text: "text-green-400",
            border: "border-green-500/30",
            background: "bg-green-500/10",
            icon: FaCheckCircle
        },
        SUSPICIOUS: {
            label: "SUSPICIOUS",
            text: "text-yellow-400",
            border: "border-yellow-500/30",
            background: "bg-yellow-500/10",
            icon: FaExclamationTriangle
        },
        PHISHING: {
            label: "PHISHING",
            text: "text-red-400",
            border: "border-red-500/30",
            background: "bg-red-500/10",
            icon: FaTimesCircle
        }
    };

    return (
        themes[normalized] ?? {
            label: normalized,
            text: "text-gray-400",
            border: "border-gray-700",
            background: "bg-gray-800",
            icon: FaShieldAlt
        }
    );
};

function InfoCard({
    icon,
    title,
    value,
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
                        className={`mt-1 break-all font-semibold ${valueClass}`}
                    >
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

function ThreatBox({
    title,
    data,
    icon
}) {
    const safeData =
        normalizeObject(data);

    const hasData =
        Object.keys(safeData).length > 0;

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-5">
            <div className="flex items-center gap-3">
                <span className="text-cyan-400">
                    {icon}
                </span>

                <h4 className="font-semibold text-white">
                    {title}
                </h4>
            </div>

            {hasData ? (
                <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-gray-800 bg-gray-900 p-4 text-xs leading-5 text-gray-300">
                    {JSON.stringify(
                        safeData,
                        null,
                        2
                    )}
                </pre>
            ) : (
                <p className="mt-4 text-sm text-gray-500">
                    No data returned.
                </p>
            )}
        </div>
    );
}

function ScanDetailsModal({
    scan,
    onClose
}) {
    useEffect(() => {
        if (!scan) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

            document.body.style.overflow =
                previousOverflow;
        };
    }, [scan, onClose]);

    const reasons = useMemo(
        () => normalizeArray(scan?.reasons),
        [scan?.reasons]
    );

    const threatIntelligence =
        normalizeObject(
            scan?.threat_intelligence
        );

    if (!scan) {
        return null;
    }

    const predictionMeta =
        getPredictionMeta(
            scan.prediction
        );

    const PredictionIcon =
        predictionMeta.icon;

    const riskScore =
        clampPercentage(
            scan.risk_score
        );

    const confidence =
        clampPercentage(
            scan.confidence
        );

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="scan-details-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose?.();
                }
            }}
        >
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-800 px-6 py-5">
                    <div>
                        <h2
                            id="scan-details-title"
                            className="text-2xl font-bold text-white"
                        >
                            Scan Details
                        </h2>

                        <p className="mt-1 text-sm text-gray-400">
                            Complete stored analysis for the selected scan
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close scan details"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-gray-400 transition hover:border-red-500 hover:text-red-400"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <div
                        className={`
                            mb-6
                            flex
                            flex-col
                            gap-4
                            rounded-2xl
                            border
                            p-5
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                            ${predictionMeta.border}
                            ${predictionMeta.background}
                        `}
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className={`
                                    flex
                                    h-12
                                    w-12
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
                                    Prediction
                                </p>

                                <p
                                    className={`mt-1 text-2xl font-bold ${predictionMeta.text}`}
                                >
                                    {predictionMeta.label}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-800 bg-gray-950/40 px-4 py-3">
                            <p className="text-xs uppercase tracking-wider text-gray-500">
                                Severity
                            </p>

                            <p className="mt-1 font-bold text-white">
                                {String(
                                    scan.severity ??
                                        "N/A"
                                ).toUpperCase()}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <InfoCard
                            icon={<FaLink />}
                            title="URL"
                            value={
                                scan.url ||
                                "Not available"
                            }
                        />

                        <InfoCard
                            icon={<FaExclamationTriangle />}
                            title="Risk Score"
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

                        <InfoCard
                            icon={<FaBrain />}
                            title="Confidence"
                            value={`${confidence.toFixed(
                                1
                            )}%`}
                            valueClass="text-cyan-400"
                        />

                        <InfoCard
                            icon={<FaFingerprint />}
                            title="Scan ID"
                            value={
                                scan.scan_id ||
                                "Not available"
                            }
                            valueClass="font-mono text-cyan-400"
                        />

                        <InfoCard
                            icon={<FaClock />}
                            title="Scan Time"
                            value={formatDateTime(
                                scan.scan_time ??
                                    scan.created_at
                            )}
                        />

                        <InfoCard
                            icon={<FaShieldAlt />}
                            title="Database ID"
                            value={
                                scan.id ??
                                "Not available"
                            }
                        />
                    </div>

                    <section className="mt-8">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white">
                                Detection Reasons
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Evidence returned by the analysis engine
                            </p>
                        </div>

                        {reasons.length === 0 ? (
                            <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-5 text-sm text-gray-500">
                                No detection reasons were returned.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reasons.map(
                                    (reason, index) => (
                                        <div
                                            key={`${reason}-${index}`}
                                            className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-950/50 p-4"
                                        >
                                            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-bold text-cyan-400">
                                                {index + 1}
                                            </span>

                                            <p className="text-sm leading-6 text-gray-300">
                                                {reason}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </section>

                    <section className="mt-8">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white">
                                Threat Intelligence
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Raw source data stored with the scan
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <ThreatBox
                                title="VirusTotal"
                                icon={<FaShieldAlt />}
                                data={
                                    threatIntelligence.virustotal
                                }
                            />

                            <ThreatBox
                                title="Safe Browsing"
                                icon={<FaGlobe />}
                                data={
                                    threatIntelligence.safe_browsing
                                }
                            />

                            <ThreatBox
                                title="PhishTank"
                                icon={<FaDatabase />}
                                data={
                                    threatIntelligence.phishtank
                                }
                            />

                            <ThreatBox
                                title="Summary"
                                icon={<FaBrain />}
                                data={
                                    threatIntelligence.summary
                                }
                            />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default memo(ScanDetailsModal);