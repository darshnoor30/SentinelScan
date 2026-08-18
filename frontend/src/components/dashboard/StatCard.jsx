import { memo } from "react";
import { motion } from "framer-motion";

const THEMES = {
    cyan: {
        text: "text-cyan-400",
        iconBackground: "bg-cyan-500/10",
        iconBorder: "border-cyan-500/20",
        progress: "bg-cyan-500",
        badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
        glow: "bg-cyan-500/10"
    },

    red: {
        text: "text-red-400",
        iconBackground: "bg-red-500/10",
        iconBorder: "border-red-500/20",
        progress: "bg-red-500",
        badge: "bg-red-500/15 text-red-300 border-red-500/20",
        glow: "bg-red-500/10"
    },

    yellow: {
        text: "text-yellow-400",
        iconBackground: "bg-yellow-500/10",
        iconBorder: "border-yellow-500/20",
        progress: "bg-yellow-500",
        badge: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
        glow: "bg-yellow-500/10"
    },

    green: {
        text: "text-green-400",
        iconBackground: "bg-green-500/10",
        iconBorder: "border-green-500/20",
        progress: "bg-green-500",
        badge: "bg-green-500/15 text-green-300 border-green-500/20",
        glow: "bg-green-500/10"
    }
};

const clampPercentage = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.min(100, Math.max(0, number));
};

const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
        return "0";
    }

    return value;
};

function StatCard({
    title = "Statistic",
    value = 0,
    subtitle = "",
    icon = null,
    color = "cyan",
    status = "Active",
    progress = 0
}) {
    const theme =
        THEMES[color] ??
        THEMES.cyan;

    const safeProgress =
        clampPercentage(progress);

    const displayValue =
        formatValue(value);

    return (
        <motion.article
            initial={{
                opacity: 0,
                y: 20
            }}
            animate={{
                opacity: 1,
                y: 0
            }}
            whileHover={{
                y: -6,
                scale: 1.015
            }}
            transition={{
                duration: 0.35,
                ease: "easeOut"
            }}
            className="
                relative
                h-full
                overflow-hidden
                rounded-2xl
                border
                border-gray-800
                bg-gradient-to-br
                from-gray-900
                via-gray-900
                to-gray-950
                p-6
                shadow-xl
                transition-shadow
                duration-300
                hover:border-gray-700
                hover:shadow-2xl
            "
        >
            <div
                aria-hidden="true"
                className={`
                    pointer-events-none
                    absolute
                    -right-12
                    -top-12
                    h-40
                    w-40
                    rounded-full
                    blur-3xl
                    ${theme.glow}
                `}
            />

            <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                            {title}
                        </p>

                        <p
                            className={`
                                mt-3
                                break-words
                                text-4xl
                                font-extrabold
                                tracking-tight
                                ${theme.text}
                            `}
                        >
                            {displayValue}
                        </p>

                        {subtitle && (
                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {icon && (
                        <div
                            aria-hidden="true"
                            className={`
                                flex
                                h-16
                                w-16
                                shrink-0
                                items-center
                                justify-center
                                rounded-2xl
                                border
                                text-3xl
                                ${theme.iconBackground}
                                ${theme.iconBorder}
                                ${theme.text}
                            `}
                        >
                            {icon}
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                            Distribution
                        </span>

                        <span className={`font-semibold ${theme.text}`}>
                            {safeProgress.toFixed(1)}%
                        </span>
                    </div>

                    <div
                        role="progressbar"
                        aria-label={`${title} progress`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(
                            safeProgress
                        )}
                        className="h-2 overflow-hidden rounded-full bg-gray-800"
                    >
                        <motion.div
                            initial={{
                                width: 0
                            }}
                            animate={{
                                width: `${safeProgress}%`
                            }}
                            transition={{
                                duration: 0.9,
                                ease: "easeOut"
                            }}
                            className={`
                                h-full
                                rounded-full
                                ${theme.progress}
                            `}
                        />
                    </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <span
                        className={`
                            inline-flex
                            max-w-[70%]
                            items-center
                            rounded-full
                            border
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            ${theme.badge}
                        `}
                    >
                        <span className="truncate">
                            {status || "Active"}
                        </span>
                    </span>

                    <span className="shrink-0 text-xs text-gray-600">
                        Live data
                    </span>
                </div>
            </div>
        </motion.article>
    );
}

export default memo(StatCard);
