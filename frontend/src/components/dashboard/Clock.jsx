import React, {
    memo,
    useEffect,
    useState
} from "react";

import {
    FaClock,
    FaGlobe,
    FaCalendarAlt
} from "react-icons/fa";

const getTimeZone = () => {
    try {
        return (
            Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone || "Local Time"
        );
    } catch {
        return "Local Time";
    }
};

const formatLocalTime = (date) =>
    date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

const formatUtcTime = (date) =>
    date.toLocaleTimeString("en-GB", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

const formatFullDate = (date) =>
    date.toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

function Clock() {
    const [currentTime, setCurrentTime] =
        useState(() => new Date());

    const timezone = getTimeZone();

    useEffect(() => {
        const intervalId =
            window.setInterval(() => {
                setCurrentTime(new Date());
            }, 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

    const localTime =
        formatLocalTime(currentTime);

    const utcTime =
        formatUtcTime(currentTime);

    const fullDate =
        formatFullDate(currentTime);

    return (
        <section className="h-full overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="flex flex-col gap-4 border-b border-gray-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                        <FaClock className="text-2xl text-cyan-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">
                            System Clock
                        </h2>

                        <p className="mt-1 text-sm text-gray-400">
                            Local and UTC monitoring time
                        </p>
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />

                    <span className="text-xs font-semibold text-green-400">
                        LIVE
                    </span>
                </div>
            </div>

            <div className="p-6">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-8 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                        Local Time
                    </p>

                    <time
                        dateTime={currentTime.toISOString()}
                        className="mt-4 block break-all font-mono text-4xl font-extrabold tracking-wider text-cyan-400 sm:text-5xl xl:text-6xl"
                    >
                        {localTime}
                    </time>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-950/50 p-4">
                        <FaCalendarAlt className="mt-1 shrink-0 text-cyan-400" />

                        <div>
                            <p className="text-xs uppercase tracking-wider text-gray-500">
                                Current Date
                            </p>

                            <p className="mt-1 font-semibold text-gray-200">
                                {fullDate}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-950/50 p-4">
                        <FaGlobe className="mt-1 shrink-0 text-cyan-400" />

                        <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wider text-gray-500">
                                Time Zone
                            </p>

                            <p
                                title={timezone}
                                className="mt-1 truncate font-semibold text-gray-200"
                            >
                                {timezone}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-800 bg-gray-950/50 px-4 py-4">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500">
                            UTC Time
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                            Universal security log reference
                        </p>
                    </div>

                    <time
                        dateTime={currentTime.toISOString()}
                        className="font-mono text-lg font-bold text-cyan-400"
                    >
                        {utcTime}
                    </time>
                </div>
            </div>
        </section>
    );
}

export default memo(Clock);