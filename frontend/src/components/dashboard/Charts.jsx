import React, { useMemo } from "react";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    LineChart,
    Line
} from "recharts";

const COLORS = [
    "#22c55e",
    "#84cc16",
    "#facc15",
    "#f97316",
    "#ef4444"
];

/* =======================================================
   Professional Tooltip
======================================================= */

function CustomTooltip({

    active,

    payload,

    label

}) {

    if (!active || !payload?.length) {

        return null;

    }

    return (

        <div className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 shadow-2xl">

            <p className="text-sm text-cyan-400 font-semibold mb-2">

                {label}

            </p>

            {

                payload.map((entry) => (

                    <div

                        key={entry.name}

                        className="flex justify-between gap-8"

                    >

                        <span

                            style={{
                                color: entry.color
                            }}

                        >

                            {entry.name}

                        </span>

                        <span className="font-bold text-white">

                            {entry.value}

                        </span>

                    </div>

                ))

            }

        </div>

    );

}

/* =======================================================
   Empty State
======================================================= */

function EmptyState({

    title

}) {

    return (

        <div className="flex items-center justify-center h-[320px]">

            <div className="text-center">

                <div className="text-6xl opacity-30">

                    📊

                </div>

                <h3 className="mt-5 text-lg font-semibold text-gray-300">

                    {title}

                </h3>

                <p className="text-sm text-gray-500 mt-2">

                    Data will appear after URL scans are completed.

                </p>

            </div>

        </div>

    );

}

/* =======================================================
   Main Component
======================================================= */

function Charts({

    riskData = [],

    topDomains = [],

    dailyScans = []

}) {

    riskData = Array.isArray(riskData)

        ? riskData

        : [];

    topDomains = Array.isArray(topDomains)

        ? topDomains

        : [];

    dailyScans = Array.isArray(dailyScans)

        ? dailyScans

        : [];

    /* ===================================================
       Risk Distribution
    =================================================== */

    const riskChart = useMemo(() => {

        return riskData.map((item) => ({

            name: item.range,

            value: Number(item.count) || 0

        }));

    }, [riskData]);

    const totalRisk = useMemo(() => {

        return riskChart.reduce(

            (sum, item) => sum + item.value,

            0

        );

    }, [riskChart]);

    /* ===================================================
       Domains
    =================================================== */

    const domainChart = useMemo(() => {

        return topDomains.map((item) => ({

            domain:

                item.domain.length > 22

                    ? item.domain.substring(0, 22) + "..."

                    : item.domain,

            count: item.count

        }));

    }, [topDomains]);

    /* ===================================================
       Daily Activity
    =================================================== */

    const activityChart = useMemo(() => {

        return dailyScans.map((item) => ({

            date: item.date,

            count: item.count

        }));

    }, [dailyScans]);

    return (

        <div className="space-y-8">
                        {/* =======================================================
                Risk Distribution
            ======================================================== */}

            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">

                <div className="flex items-center justify-between border-b border-gray-800 px-6 py-5">

                    <div>

                        <h2 className="text-xl font-bold text-white">

                            Risk Distribution

                        </h2>

                        <p className="text-sm text-gray-400 mt-1">

                            Distribution of scanned URLs by calculated risk score

                        </p>

                    </div>

                    <div className="text-right">

                        <p className="text-gray-400 text-xs uppercase">

                            Total URLs

                        </p>

                        <h3 className="text-cyan-400 text-3xl font-bold">

                            {totalRisk}

                        </h3>

                    </div>

                </div>

                {

                    totalRisk === 0 ?

                    (

                        <EmptyState

                            title="No Risk Distribution Available"

                        />

                    )

                    :

                    (

                        <div className="h-[380px] px-4 py-6">

                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >

                                <PieChart>

                                    <Pie

                                        data={riskChart}

                                        dataKey="value"

                                        nameKey="name"

                                        cx="50%"

                                        cy="50%"

                                        innerRadius={80}

                                        outerRadius={120}

                                        paddingAngle={4}

                                        stroke="#111827"

                                        strokeWidth={2}

                                        animationDuration={1000}

                                        animationBegin={0}

                                        isAnimationActive

                                    >

                                        {

                                            riskChart.map(

                                                (entry, index) => (

                                                    <Cell

                                                        key={entry.name}

                                                        fill={

                                                            COLORS[

                                                                index %

                                                                COLORS.length

                                                            ]

                                                        }

                                                    />

                                                )

                                            )

                                        }

                                    </Pie>

                                    <Tooltip

                                        content={<CustomTooltip />}

                                    />

                                    <Legend

                                        verticalAlign="bottom"

                                        height={40}

                                        wrapperStyle={{

                                            color: "#ffffff",

                                            fontSize: 13

                                        }}

                                    />

                                </PieChart>

                            </ResponsiveContainer>

                        </div>

                    )

                }

            </div>
                        {/* =======================================================
                Top Scanned Domains
            ======================================================== */}

            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">

                <div className="flex items-center justify-between border-b border-gray-800 px-6 py-5">

                    <div>

                        <h2 className="text-xl font-bold text-white">

                            Most Scanned Domains

                        </h2>

                        <p className="text-sm text-gray-400 mt-1">

                            Domains analysed most frequently by SentinelScan

                        </p>

                    </div>

                    <div className="text-right">

                        <p className="text-xs uppercase text-gray-400">

                            Domains

                        </p>

                        <h3 className="text-cyan-400 text-3xl font-bold">

                            {domainChart.length}

                        </h3>

                    </div>

                </div>

                {

                    domainChart.length === 0 ?

                    (

                        <EmptyState

                            title="No Domain Statistics Available"

                        />

                    )

                    :

                    (

                        <div className="h-[360px] px-4 py-6">

                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >

                                <BarChart

                                    data={domainChart}

                                    margin={{

                                        top: 20,

                                        right: 20,

                                        left: 0,

                                        bottom: 40

                                    }}

                                >

                                    <CartesianGrid

                                        stroke="#374151"

                                        strokeDasharray="4 4"

                                        vertical={false}

                                    />

                                    <XAxis

                                        dataKey="domain"

                                        stroke="#9CA3AF"

                                        tick={{

                                            fontSize: 11

                                        }}

                                        interval={0}

                                        angle={-15}

                                        textAnchor="end"

                                    />

                                    <YAxis

                                        stroke="#9CA3AF"

                                        allowDecimals={false}

                                    />

                                    <Tooltip

                                        content={<CustomTooltip />}

                                    />

                                    <Bar

                                        dataKey="count"

                                        radius={[10,10,0,0]}

                                        fill="#06b6d4"

                                        animationDuration={1000}

                                    />

                                </BarChart>

                            </ResponsiveContainer>

                        </div>

                    )

                }

            </div>
                        {/* =======================================================
                Daily Scan Activity
            ======================================================== */}

            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">

                <div className="flex items-center justify-between border-b border-gray-800 px-6 py-5">

                    <div>

                        <h2 className="text-xl font-bold text-white">

                            Daily Scan Activity

                        </h2>

                        <p className="text-sm text-gray-400 mt-1">

                            Number of URLs scanned over time

                        </p>

                    </div>

                    <div className="text-right">

                        <p className="text-xs uppercase text-gray-400">

                            Days

                        </p>

                        <h3 className="text-cyan-400 text-3xl font-bold">

                            {activityChart.length}

                        </h3>

                    </div>

                </div>

                {

                    activityChart.length === 0 ?

                    (

                        <EmptyState

                            title="No Daily Activity Available"

                        />

                    )

                    :

                    (

                        <div className="h-[340px] px-4 py-6">

                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >

                                <LineChart

                                    data={activityChart}

                                    margin={{

                                        top: 20,

                                        right: 20,

                                        left: 0,

                                        bottom: 10

                                    }}

                                >

                                    <CartesianGrid

                                        stroke="#374151"

                                        strokeDasharray="4 4"

                                        vertical={false}

                                    />

                                    <XAxis

                                        dataKey="date"

                                        stroke="#9CA3AF"

                                    />

                                    <YAxis

                                        stroke="#9CA3AF"

                                        allowDecimals={false}

                                    />

                                    <Tooltip

                                        content={<CustomTooltip />}

                                    />

                                    <Legend />

                                    <Line

                                        type="monotone"

                                        dataKey="count"

                                        name="Scans"

                                        stroke="#06b6d4"

                                        strokeWidth={4}

                                        dot={{

                                            r: 5,

                                            fill: "#06b6d4"

                                        }}

                                        activeDot={{

                                            r: 8

                                        }}

                                        animationDuration={1200}

                                    />

                                </LineChart>

                            </ResponsiveContainer>

                        </div>

                    )

                }

            </div>

        </div>

    );

}

export default React.memo(Charts);