import React, { memo } from "react";

import {
    FaSearch,
    FaTimes
} from "react-icons/fa";

function SearchBar({
    value = "",
    onChange,
    placeholder = "Search by URL..."
}) {
    const clearSearch = () => {
        onChange?.({
            target: {
                value: ""
            }
        });
    };

    return (
        <div className="relative">
            <FaSearch
                className="
                    pointer-events-none
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                "
            />

            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete="off"
                spellCheck={false}
                className="
                    w-full
                    rounded-xl
                    border
                    border-gray-700
                    bg-gray-900
                    py-3
                    pl-12
                    pr-12
                    text-white
                    placeholder:text-gray-500
                    outline-none
                    transition
                    focus:border-cyan-500
                    focus:ring-2
                    focus:ring-cyan-500/20
                "
            />

            {value && (
                <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="
                        absolute
                        right-3
                        top-1/2
                        flex
                        h-8
                        w-8
                        -translate-y-1/2
                        items-center
                        justify-center
                        rounded-lg
                        text-gray-400
                        transition
                        hover:bg-gray-800
                        hover:text-white
                    "
                >
                    <FaTimes />
                </button>
            )}
        </div>
    );
}

export default memo(SearchBar);