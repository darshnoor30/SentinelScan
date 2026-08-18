import { memo, useMemo } from "react";

import {
    FaBrain,
    FaLock,
    FaLink,
    FaGlobe,
    FaRandom,
    FaCode,
    FaExclamationTriangle,
    FaCheckCircle,
    FaQuestionCircle
} from "react-icons/fa";

const normalizeReasons = (reasons) => {
    if (!Array.isArray(reasons)) {
        return [];
    }

    return reasons
        .map((reason) => String(reason ?? "").trim())
        .filter(Boolean);
};

const normalizeObject = (value) =>
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
        ? value
        : {};

const getEvidenceMeta = (reason) => {
    const text = reason.toLowerCase();

    if (
        text.includes("ssl") ||
        text.includes("certificate") ||
        text.includes("https")
    ) {
        return {
            category: "SSL and Certificate",
            icon: FaLock,
            color: "text-cyan-400"
        };
    }

    if (
        text.includes("url") ||
        text.includes("path") ||
        text.includes("domain")
    ) {
        return {
            category: "URL Structure",
            icon: FaLink,
            color: "text-blue-400"
        };
    }

    if (
        text.includes("reputation") ||
        text.includes("phishtank") ||
        text.includes("virustotal") ||
        text.includes("safe browsing")
    ) {
        return {
            category: "Threat Reputation",
            icon: FaGlobe,
            color: "text-purple-400"
        };
    }

    if (
        text.includes("random") ||
        text.includes("entropy")
    ) {
        return {
            category: "URL Randomness",
            icon: FaRandom,
            color: "text-yellow-400"
        };
    }

    if (
        text.includes("model") ||
        text.includes("feature") ||
        text.includes("indicator")
    ) {
        return {
            category: "Model Indicator",
            icon: FaCode,
            color: "text-green-400"
        };
    }

    return {
        category: "Security Evidence",
        icon: FaBrain,
        color: "text-gray-400"
    };
};

const getEvidenceStatus = (reason) => {
    const text = reason.toLowerCase();

    const negativeTerms = [
        "failed",
        "invalid",
        "phishing",
        "suspicious",
        "malicious",
        "listed",
        "high randomness",
        "detected"
    ];

    const positiveTerms = [
        "valid",
        "trusted",
        "no major",
        "clean",
        "not listed"
    ];

    if (
        negativeTerms.some((term) =>
            text.includes(term)
        )
    ) {
        return {
            label: "Risk Evidence",
            icon: FaExclamationTriangle,
            className:
                "border-yellow-500/20 bg-yellow-500/5 text-yellow-400"
        };
    }

    if (
        positiveTerms.some((term) =>
            text.includes(term)
        )
    ) {
        return {
            label: "Supporting Evidence",
            icon: FaCheckCircle,
            className:
                "border-green-500/20 bg-green-500/5 text-green-400"
        };
    }

    return {
        label: "Observed Evidence",
        icon: FaQuestionCircle,
        className:
            "border-gray-700 bg-gray-800/60 text-gray-400"
    };
};

function EvidenceItem({
    reason,
    index
}) {
    const meta = getEvidenceMeta(reason);
    const status = getEvidenceStatus(reason);

    const EvidenceIcon = meta.icon;
    const StatusIcon = status.icon;

    return (
        <article className="rounded-xl border border-gray-800 bg-gray-950/50 p-4">
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-700 bg-gray-900">
                    <EvidenceIcon
                        className={`text-xl ${meta.color}`}
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Evidence {index + 1}
                        </span>

                        <span
                            className={`
                                inline-flex
                                items-center
                                gap-2
                                rounded-full
                                border
                                px-2.5
                                py-1
                                text-[11px]
                                font-semibold
                                ${status.className}
                            `}
                        >
                            <StatusIcon />
                            {status.label}
                        </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-gray-300">
                        {meta.category}
                    </p>

                    <p className="mt-2 break-words text-sm leading-6 text-gray-400">
                        {reason}
                    </p>
                </div>
            </div>
        </article>
    );
}

function Metric({
    label,
    value,
    valueClass = "text-white"
}) {
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">
                {label}
            </p>

            <p
                className={`mt-1 text-xl font-bold ${valueClass}`}
            >
                {value}
            </p>
        </div>
    );
}

function EmptyState() {
    return (
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="border-b border-gray-800 px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                        <FaBrain className="text-xl text-cyan-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">
                            AI Explainability
                        </h2>

                        <p className="mt-1 text-sm text-gray-400">
                            Evidence returned by the prediction engine
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                <FaQuestionCircle className="text-4xl text-gray-600" />

                <h3 className="mt-5 text-lg font-semibold text-gray-200">
                    No explainability data available
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                    The backend did not return feature importance, SHAP values,
                    or detection evidence for this scan.
                </p>
            </div>
        </section>
    );
}

function ExplainabilityCard({
    result
}) {
    const reasons = useMemo(
        () =>
            normalizeReasons(
                result?.reasons
            ),
        [result?.reasons]
    );

    const threatIntelligence =
        normalizeObject(
            result?.threat_intelligence
        );

    const summary =
        normalizeObject(
            threatIntelligence.summary
        );

    const featureImportance =
        Array.isArray(
            result?.feature_importance
        )
            ? result.feature_importance
            : [];

    const hasExplainability =
        reasons.length > 0 ||
        featureImportance.length > 0;

    if (!result || !hasExplainability) {
        return <EmptyState />;
    }

    const riskScore =
        Number(result?.risk_score) || 0;

    const confidence =
        Number(result?.confidence) || 0;

    const sourcesChecked =
        Number(
            summary.sources_checked
        ) || 0;

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="flex flex-col gap-4 border-b border-gray-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                        <FaBrain className="text-xl text-cyan-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">
                            AI Explainability
                        </h2>

                        <p className="mt-1 text-sm text-gray-400">
                            Evidence supporting the final prediction
                        </p>
                    </div>
                </div>

                <span className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
                    {reasons.length} evidence item
                    {reasons.length === 1
                        ? ""
                        : "s"}
                </span>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Metric
                        label="Risk Score"
                        value={`${riskScore}%`}
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

                    <Metric
                        label="Model Confidence"
                        value={`${confidence}%`}
                        valueClass="text-cyan-400"
                    />

                    <Metric
                        label="Threat Sources Checked"
                        value={sourcesChecked}
                        valueClass="text-purple-400"
                    />
                </div>

                {reasons.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-bold text-white">
                            Detection Evidence
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            These statements are shown exactly as returned by the
                            backend.
                        </p>

                        <div className="mt-4 space-y-4">
                            {reasons.map(
                                (reason, index) => (
                                    <EvidenceItem
                                        key={`${reason}-${index}`}
                                        reason={reason}
                                        index={index}
                                    />
                                )
                            )}
                        </div>
                    </div>
                )}

                {featureImportance.length > 0 && (
                    <div className="mt-8 border-t border-gray-800 pt-6">
                        <h3 className="text-lg font-bold text-white">
                            Feature Importance
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Displayed only because the backend returned feature
                            importance data.
                        </p>

                        <div className="mt-4 space-y-3">
                            {featureImportance.map(
                                (feature, index) => {
                                    const name =
                                        String(
                                            feature?.name ??
                                                `Feature ${index + 1}`
                                        );

                                    const rawValue =
                                        Number(
                                            feature?.value
                                        );

                                    const value =
                                        Number.isFinite(
                                            rawValue
                                        )
                                            ? Math.min(
                                                  100,
                                                  Math.max(
                                                      0,
                                                      rawValue
                                                  )
                                              )
                                            : 0;

                                    return (
                                        <div
                                            key={`${name}-${index}`}
                                        >
                                            <div className="mb-2 flex items-center justify-between text-sm">
                                                <span className="text-gray-300">
                                                    {name}
                                                </span>

                                                <span className="font-semibold text-cyan-400">
                                                    {value.toFixed(
                                                        1
                                                    )}
                                                    %
                                                </span>
                                            </div>

                                            <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                                                <div
                                                    className="h-full rounded-full bg-cyan-500"
                                                    style={{
                                                        width: `${value}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                    <p className="text-sm leading-6 text-yellow-200">
                        This panel does not generate fake SHAP, LIME, or feature
                        scores. Feature importance appears only when the backend
                        explicitly returns it.
                    </p>
                </div>
            </div>
        </section>
    );
}

export default memo(ExplainabilityCard);
