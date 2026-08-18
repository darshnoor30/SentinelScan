import { memo } from "react";
import { motion } from "framer-motion";

import {
    FaBrain,
    FaCheckCircle
} from "react-icons/fa";

const CIRCLE_RADIUS = 68;
const CIRCLE_CIRCUMFERENCE =
    2 * Math.PI * CIRCLE_RADIUS;

const clampPercentage = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.min(100, Math.max(0, number));
};

const getConfidenceMeta = (value) => {
    if (value >= 90) {
        return {
            label: "VERY HIGH",
            description:
                "The model is highly confident in this classification.",
            text: "text-green-400",
            stroke: "#22c55e",
            border: "border-green-500/30",
            background: "bg-green-500/10"
        };
    }

    if (value >= 70) {
        return {
            label: "HIGH",
            description:
                "The model shows strong confidence in this result.",
            text: "text-cyan-400",
            stroke: "#06b6d4",
            border: "border-cyan-500/30",
            background: "bg-cyan-500/10"
        };
    }

    if (value >= 50) {
        return {
            label: "MODERATE",
            description:
                "The result should be reviewed with supporting indicators.",
            text: "text-yellow-400",
            stroke: "#facc15",
            border: "border-yellow-500/30",
            background: "bg-yellow-500/10"
        };
    }

    return {
        label: "LOW",
        description:
            "The model has limited confidence in this classification.",
        text: "text-red-400",
        stroke: "#ef4444",
        border: "border-red-500/30",
        background: "bg-red-500/10"
    };
};

function ConfidenceCard({
    confidence = 0
}) {
    const value =
        clampPercentage(confidence);

    const confidenceMeta =
        getConfidenceMeta(value);

    const dashOffset =
        CIRCLE_CIRCUMFERENCE -
        (CIRCLE_CIRCUMFERENCE * value) /
            100;

    return (
        <section className="h-full overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="flex items-center gap-3 border-b border-gray-800 px-6 py-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                    <FaBrain className="text-xl text-cyan-400" />
                </div>

                <div>
                    <h2 className="text-xl font-bold text-white">
                        AI Confidence
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                        Model certainty for the final prediction
                    </p>
                </div>
            </div>

            <div className="p-6">
                <div className="flex justify-center">
                    <div className="relative h-48 w-48">
                        <svg
                            viewBox="0 0 160 160"
                            className="h-full w-full -rotate-90"
                            role="img"
                            aria-label={`AI confidence ${value.toFixed(
                                1
                            )} percent`}
                        >
                            <circle
                                cx="80"
                                cy="80"
                                r={
                                    CIRCLE_RADIUS
                                }
                                stroke="#1f2937"
                                strokeWidth="12"
                                fill="none"
                            />

                            <motion.circle
                                cx="80"
                                cy="80"
                                r={
                                    CIRCLE_RADIUS
                                }
                                stroke={
                                    confidenceMeta.stroke
                                }
                                strokeWidth="12"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={
                                    CIRCLE_CIRCUMFERENCE
                                }
                                initial={{
                                    strokeDashoffset:
                                        CIRCLE_CIRCUMFERENCE
                                }}
                                animate={{
                                    strokeDashoffset:
                                        dashOffset
                                }}
                                transition={{
                                    duration: 1.15,
                                    ease: "easeOut"
                                }}
                            />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span
                                className={`text-4xl font-extrabold ${confidenceMeta.text}`}
                            >
                                {value.toFixed(1)}%
                            </span>

                            <span className="mt-1 text-xs uppercase tracking-wider text-gray-500">
                                Confidence
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    className={`
                        mt-6
                        rounded-xl
                        border
                        p-4
                        ${confidenceMeta.border}
                        ${confidenceMeta.background}
                    `}
                >
                    <div className="flex items-start gap-3">
                        <FaCheckCircle
                            className={`mt-1 shrink-0 ${confidenceMeta.text}`}
                        />

                        <div>
                            <p className="text-xs uppercase tracking-wider text-gray-500">
                                Confidence Level
                            </p>

                            <p
                                className={`mt-1 text-xl font-bold ${confidenceMeta.text}`}
                            >
                                {
                                    confidenceMeta.label
                                }
                            </p>

                            <p className="mt-2 text-sm leading-6 text-gray-400">
                                {
                                    confidenceMeta.description
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-2 text-red-400">
                        Low
                    </div>

                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-2 py-2 text-yellow-400">
                        Moderate
                    </div>

                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-2 text-cyan-400">
                        High
                    </div>

                    <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-2 py-2 text-green-400">
                        Very High
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(ConfidenceCard);
