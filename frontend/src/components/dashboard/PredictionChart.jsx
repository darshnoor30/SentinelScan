import React, { useMemo } from "react";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const PREDICTION_CONFIG = {
    LEGITIMATE: {
        label: "Legitimate",
        color: "#22c55e"
    },
    SUSPICIOUS: {
        label: "Suspicious",
        color: "#f59e0b"
    },
    PHISHING: {
        label: "Phishing",
        color: "#ef4444"
    }
};

const PREDICTION_ORDER = [
    "LEGITIMATE",
    "SUSPICIOUS",
    "PHISHING"
];

function normalizePredictionData(data) {
    const counts = {
        LEGITIMATE: 0,
        SUSPICIOUS: 0,
        PHISHING: 0
    };

    if (!Array.isArray(data)) {
        return counts;
    }

    data.forEach((item) => {
        const prediction = String(
            item?.prediction ?? ""
        ).toUpperCase();

        if (
            Object.prototype.hasOwnProperty.call(
                counts,
                prediction
            )
        ) {
            counts[prediction] =
                Math.max(0, Number(item?.count) || 0);
        }
    });

    return counts;
}

function CustomTooltip({
    active,
    payload,
    totalScans
}) {
    if (!active || !payload?.length) {
        return null;
    }

    const item = payload[0]?.payload;

    if (!item) {
        return null;
    }

    return (
        <div className="min-w-[170px] rounded-xl border border-gray-700 bg-gray-950/95 px-4 py-3 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2">
                <span
                    className="h-3 w-3 rounded-full"
                    style={{
                        backgroundColor: item.color
                    }}
                />

                <p className="font-semibold text-white">
                    {item.name}
                </p>
            </div>

            <div className="mt-3 space-y-1 text-sm">
                <div className="flex items-center justify-between gap-8">
                    <span className="text-gray-400">
                        Scans
                    </span>

                    <span className="font-semibold text-white">
                        {item.value}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-8">
                    <span className="text-gray-400">
                        Percentage
                    </span>

                    <span
                        className="font-semibold"
                        style={{
                            color: item.color
                        }}
                    >
                        {totalScans > 0
                            ? `${(
                                  (item.value /
                                      totalScans) *
                                  100
                              ).toFixed(1)}%`
                            : "0.0%"}
                    </span>
                </div>
            </div>
        </div>
    );
}

function CenterLabel({
    viewBox,
    totalScans
}) {
    const cx = viewBox?.cx ?? 0;
    const cy = viewBox?.cy ?? 0;

    return (
        <g>
            <text
                x={cx}
                y={cy - 5}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontSize="30"
                fontWeight="700"
            >
                {totalScans}
            </text>

            <text
                x={cx}
                y={cy + 24}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#9ca3af"
                fontSize="12"
                fontWeight="500"
            >
                TOTAL SCANS
            </text>
        </g>
    );
}

function PredictionLegendItem({
    item,
    totalScans
}) {
    const percentage =
        totalScans > 0
            ? (item.value / totalScans) * 100
            : 0;

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-4 transition hover:border-gray-700 hover:bg-gray-800/70">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span
                        className="h-3 w-3 rounded-full"
                        style={{
                            backgroundColor: item.color
                        }}
                    />

                    <span className="font-medium text-gray-200">
                        {item.name}
                    </span>
                </div>

                <span className="font-bold text-white">
                    {item.value}
                </span>
            </div>

            <div className="mt-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                        Distribution
                    </span>

                    <span
                        className="font-semibold"
                        style={{
                            color: item.color
                        }}
                    >
                        {percentage.toFixed(1)}%
                    </span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${Math.min(
                                100,
                                Math.max(0, percentage)
                            )}%`,
                            backgroundColor: item.color
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

function EmptyPredictionState() {
    return (
        <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-800 bg-gray-950/70 text-3xl">
                📊
            </div>

            <h3 className="mt-5 text-lg font-semibold text-gray-200">
                No prediction data available
            </h3>

            <p className="mt-2 max-w-sm text-sm text-gray-500">
                Scan a URL to populate the prediction
                distribution with legitimate, suspicious and
                phishing results.
            </p>
        </div>
    );
}

function PredictionChart({
    data = []
}) {
    const chartData = useMemo(() => {
        const counts =
            normalizePredictionData(data);

        return PREDICTION_ORDER.map(
            (prediction) => ({
                prediction,
                name:
                    PREDICTION_CONFIG[prediction]
                        .label,
                value: counts[prediction],
                color:
                    PREDICTION_CONFIG[prediction]
                        .color
            })
        );
    }, [data]);

    const totalScans = useMemo(
        () =>
            chartData.reduce(
                (total, item) =>
                    total + item.value,
                0
            ),
        [chartData]
    );

    return (
        <section className="h-full overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="flex flex-col gap-3 border-b border-gray-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">
                        Prediction Distribution
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                        Classification results from all URL
                        scans
                    </p>
                </div>

                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-right">
                    <p className="text-xs uppercase tracking-wider text-gray-400">
                        Total scans
                    </p>

                    <p className="text-2xl font-bold text-cyan-400">
                        {totalScans}
                    </p>
                </div>
            </div>

            {totalScans === 0 ? (
                <EmptyPredictionState />
            ) : (
                <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(230px,0.75fr)]">
                    <div className="min-h-[340px]">
                        <ResponsiveContainer
                            width="100%"
                            height={340}
                        >
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={82}
                                    outerRadius={125}
                                    paddingAngle={4}
                                    cornerRadius={5}
                                    stroke="#111827"
                                    strokeWidth={3}
                                    animationBegin={100}
                                    animationDuration={1100}
                                    animationEasing="ease-out"
                                    isAnimationActive
                                    labelLine={false}
                                    label={(props) => (
                                        <CenterLabel
                                            {...props}
                                            totalScans={
                                                totalScans
                                            }
                                        />
                                    )}
                                >
                                    {chartData.map(
                                        (item) => (
                                            <Cell
                                                key={
                                                    item.prediction
                                                }
                                                fill={
                                                    item.color
                                                }
                                            />
                                        )
                                    )}
                                </Pie>

                                <Tooltip
                                    cursor={false}
                                    content={(
                                        tooltipProps
                                    ) => (
                                        <CustomTooltip
                                            {...tooltipProps}
                                            totalScans={
                                                totalScans
                                            }
                                        />
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex flex-col justify-center gap-3">
                        {chartData.map((item) => (
                            <PredictionLegendItem
                                key={item.prediction}
                                item={item}
                                totalScans={
                                    totalScans
                                }
                            />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

export default React.memo(PredictionChart);