import React, { memo } from "react";

import {
    FaList,
    FaCheckCircle,
    FaExclamationTriangle,
    FaTimesCircle
} from "react-icons/fa";

const FILTERS = [
    {
        value: "ALL",
        label: "All",
        icon: FaList,
        active:
            "bg-cyan-600 text-white border-cyan-500",
        inactive:
            "bg-gray-800 text-gray-300 border-gray-700 hover:border-cyan-500 hover:text-white"
    },
    {
        value: "LEGITIMATE",
        label: "Legitimate",
        icon: FaCheckCircle,
        active:
            "bg-green-600 text-white border-green-500",
        inactive:
            "bg-gray-800 text-green-400 border-gray-700 hover:border-green-500"
    },
    {
        value: "SUSPICIOUS",
        label: "Suspicious",
        icon: FaExclamationTriangle,
        active:
            "bg-yellow-500 text-black border-yellow-400",
        inactive:
            "bg-gray-800 text-yellow-400 border-gray-700 hover:border-yellow-400"
    },
    {
        value: "PHISHING",
        label: "Phishing",
        icon: FaTimesCircle,
        active:
            "bg-red-600 text-white border-red-500",
        inactive:
            "bg-gray-800 text-red-400 border-gray-700 hover:border-red-500"
    }
];

function FilterBar({
    filter = "ALL",
    setFilter
}) {
    return (
        <div className="flex flex-wrap gap-3">
            {FILTERS.map((item) => {
                const Icon = item.icon;

                const active =
                    filter === item.value;

                return (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                            setFilter?.(
                                item.value
                            )
                        }
                        className={`
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            px-5
                            py-2.5
                            text-sm
                            font-semibold
                            transition-all
                            duration-200
                            ${
                                active
                                    ? item.active
                                    : item.inactive
                            }
                        `}
                    >
                        <Icon />

                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}

export default memo(FilterBar);