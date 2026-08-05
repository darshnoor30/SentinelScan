import React, {
    memo,
    useMemo,
    useState
} from "react";

import {
    FaCheckCircle,
    FaExclamationTriangle,
    FaChevronDown,
    FaChevronUp,
    FaBrain
} from "react-icons/fa";

const DEFAULT_VISIBLE_COUNT = 5;

const normalizeReasons = (reasons) => {
    if (!Array.isArray(reasons)) {
        return [];
    }

    return reasons
        .map((reason) => String(reason ?? "").trim())
        .filter(Boolean);
};

const getReasonMeta = (reason) => {
    const normalized = reason.toLowerCase();

    const warningTerms = [
        "failed",
        "invalid",
        "suspicious",
        "phishing",
        "malicious",
        "unsafe",
        "listed",
        "high risk",
        "detected",
        "expired",
        "mismatch",
        "untrusted",
        "abnormal"
    ];

    const warning = warningTerms.some((term) =>
        normalized.includes(term)
    );

    if (warning) {
        return {
            icon: FaExclamationTriangle,
            iconClass: "text-yellow-400",
            borderClass: "border-yellow-500/20",
            backgroundClass: "bg-yellow-500/5",
            label: "Risk Indicator"
        };
    }

    return {
        icon: FaCheckCircle,
        iconClass: "text-green-400",
        borderClass: "border-green-500/20",
        backgroundClass: "bg-green-500/5",
        label: "Analysis Indicator"
    };
};

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
                            AI Explanation
                        </h2>

                        <p className="mt-1 text-sm text-gray-400">
                            Detection indicators returned by the analysis engine
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-800 bg-gray-950/60">
                    <FaBrain className="text-3xl text-gray-600" />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-gray-200">
                    No explanation available
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                    The backend did not return any detection reasons for this
                    scan.
                </p>
            </div>
        </section>
    );
}

function ReasonItem({
    reason,
    index
}) {
    const meta = getReasonMeta(reason);
    const Icon = meta.icon;

    return (
        <article
            className={`
                rounded-xl
                border
                p-4
                transition
                hover:bg-gray-800/70
                ${meta.borderClass}
                ${meta.backgroundClass}
            `}
        >
            <div className="flex items-start gap-4">
                <div
                    className={`
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-gray-700
                        bg-gray-950/60
                        ${meta.iconClass}
                    `}
                >
                    <Icon />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Indicator {index + 1}
                        </span>

                        <span
                            className={`
                                rounded-full
                                border
                                px-2.5
                                py-1
                                text-[11px]
                                font-semibold
                                ${meta.borderClass}
                                ${meta.iconClass}
                            `}
                        >
                            {meta.label}
                        </span>
                    </div>

                    <p className="mt-2 break-words text-sm leading-6 text-gray-200">
                        {reason}
                    </p>
                </div>
            </div>
        </article>
    );
}

function ReasonsCard({
    reasons = []
}) {
    const [expanded, setExpanded] = useState(false);

    const safeReasons = useMemo(
        () => normalizeReasons(reasons),
        [reasons]
    );

    if (safeReasons.length === 0) {
        return <EmptyState />;
    }

    const visibleReasons = expanded
        ? safeReasons
        : safeReasons.slice(0, DEFAULT_VISIBLE_COUNT);

    const hiddenCount =
        safeReasons.length - DEFAULT_VISIBLE_COUNT;

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="flex flex-col gap-4 border-b border-gray-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                        <FaBrain className="text-xl text-cyan-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">
                            AI Explanation
                        </h2>

                        <p className="mt-1 text-sm text-gray-400">
                            Why the analysis engine produced this prediction
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
                    {safeReasons.length} indicator
                    {safeReasons.length === 1 ? "" : "s"}
                </div>
            </div>

            <div className="space-y-4 p-6">
                {visibleReasons.map((reason, index) => (
                    <ReasonItem
                        key={`${reason}-${index}`}
                        reason={reason}
                        index={index}
                    />
                ))}

                {safeReasons.length > DEFAULT_VISIBLE_COUNT && (
                    <button
                        type="button"
                        onClick={() =>
                            setExpanded((current) => !current)
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-cyan-500 hover:text-cyan-400"
                    >
                        {expanded ? (
                            <>
                                <FaChevronUp />
                                Show fewer indicators
                            </>
                        ) : (
                            <>
                                <FaChevronDown />
                                Show {hiddenCount} more
                            </>
                        )}
                    </button>
                )}
            </div>
        </section>
    );
}

export default memo(ReasonsCard);