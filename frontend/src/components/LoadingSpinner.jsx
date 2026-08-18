import { memo } from "react";

import {
    FaShieldAlt,
    FaSpinner
} from "react-icons/fa";

function LoadingSpinner() {
    return (
        <div
            role="status"
            aria-live="polite"
            className="
                rounded-2xl
                border
                border-cyan-500/20
                bg-gradient-to-br
                from-gray-900
                via-gray-900
                to-gray-950
                p-8
                shadow-xl
            "
        >
            <div className="flex flex-col items-center text-center">
                {/* Animated Loader */}

                <div className="relative mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-cyan-500/20 bg-cyan-500/5">
                        <FaShieldAlt className="text-3xl text-cyan-400" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <FaSpinner className="animate-spin text-6xl text-cyan-500" />
                    </div>
                </div>

                {/* Heading */}

                <h2 className="text-2xl font-bold text-white">
                    Scanning URL
                </h2>

                {/* Description */}

                <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400">
                    SentinelScan is analysing the submitted URL using
                    machine-learning detection, risk scoring and the configured
                    threat-intelligence services. This may take a few seconds
                    depending on network-based security checks.
                </p>

                {/* Activity */}

                <div className="mt-8 flex items-center gap-3 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-5 py-2">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" />

                    <span className="text-sm font-semibold text-cyan-300">
                        Scan in progress...
                    </span>
                </div>

                {/* Progress Bar */}

                <div className="mt-8 w-full max-w-lg overflow-hidden rounded-full bg-gray-800">
                    <div className="h-2 w-full animate-pulse rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400" />
                </div>

                <p className="mt-4 text-xs uppercase tracking-[0.25em] text-gray-500">
                    Please wait
                </p>
            </div>
        </div>
    );
}

export default memo(LoadingSpinner);
