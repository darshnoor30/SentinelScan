import { memo } from "react";
import { motion } from "framer-motion";
import {
    FaShieldAlt,
    FaExclamationTriangle
} from "react-icons/fa";

const clampPercentage = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.min(100, Math.max(0, number));
};

const getRiskMeta = (value) => {
    if (value > 75) {
        return {
            label: "CRITICAL",
            description: "Immediate investigation is recommended.",
            bar: "bg-red-600",
            text: "text-red-400",
            border: "border-red-500/30",
            background: "bg-red-500/10"
        };
    }

    if (value > 50) {
        return {
            label: "HIGH",
            description: "Multiple high-risk indicators were detected.",
            bar: "bg-orange-500",
            text: "text-orange-400",
            border: "border-orange-500/30",
            background: "bg-orange-500/10"
        };
    }

    if (value > 25) {
        return {
            label: "MODERATE",
            description: "Some indicators require additional review.",
            bar: "bg-yellow-400",
            text: "text-yellow-400",
            border: "border-yellow-500/30",
            background: "bg-yellow-500/10"
        };
    }

    return {
        label: "LOW",
        description: "Few or no significant risk indicators were detected.",
        bar: "bg-green-500",
        text: "text-green-400",
        border: "border-green-500/30",
        background: "bg-green-500/10"
    };
};

function RiskMeter({ score = 0 }) {
    const value = clampPercentage(score);
    const riskMeta = getRiskMeta(value);

    return (
        <section className="h-full overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                        <FaShieldAlt className="text-xl text-red-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Risk Score
                        </h2>

                        <p className="mt-1 text-sm text-gray-400">
                            Overall security risk assessment
                        </p>
                    </div>
                </div>

                <span className={`text-3xl font-extrabold ${riskMeta.text}`}>
                    {value.toFixed(0)}%
                </span>
            </div>

            <div className="p-6">
                <div
                    role="progressbar"
                    aria-label="URL risk score"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(value)}
                    className="h-4 overflow-hidden rounded-full bg-gray-800"
                >
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{
                            duration: 1,
                            ease: "easeOut"
                        }}
                        className={`h-full rounded-full ${riskMeta.bar}`}
                    />
                </div>

                <div className="mt-3 flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                </div>

                <div
                    className={`
                        mt-6
                        rounded-xl
                        border
                        p-4
                        ${riskMeta.border}
                        ${riskMeta.background}
                    `}
                >
                    <div className="flex items-start gap-3">
                        <FaExclamationTriangle
                            className={`mt-1 shrink-0 ${riskMeta.text}`}
                        />

                        <div>
                            <p className="text-xs uppercase tracking-wider text-gray-500">
                                Risk Level
                            </p>

                            <p className={`mt-1 text-xl font-bold ${riskMeta.text}`}>
                                {riskMeta.label}
                            </p>

                            <p className="mt-2 text-sm leading-6 text-gray-400">
                                {riskMeta.description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-2 py-2 text-green-400">
                        Low
                    </div>

                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-2 py-2 text-yellow-400">
                        Moderate
                    </div>

                    <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 px-2 py-2 text-orange-400">
                        High
                    </div>

                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-2 text-red-400">
                        Critical
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(RiskMeter);
