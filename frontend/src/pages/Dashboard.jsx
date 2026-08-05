import {
    useEffect,
    useMemo
} from "react";

import {
    motion,
    MotionConfig
} from "framer-motion";

import {
    FaShieldVirus,
    FaBug,
    FaExclamationTriangle,
    FaChartLine,
    FaSyncAlt
} from "react-icons/fa";

import Layout from "../components/layout/Layout";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import StatCard from "../components/dashboard/StatCard";
import PredictionChart from "../components/dashboard/PredictionChart";
import Charts from "../components/dashboard/Charts";
import RecentScans from "../components/dashboard/RecentScans";
import ThreatAlerts from "../components/dashboard/ThreatAlerts";
import Clock from "../components/dashboard/Clock";
import SystemHealth from "../components/dashboard/SystemHealth";

import useDashboard from "../hooks/useDashboard";

const clampPercentage = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return Math.min(
        100,
        Math.max(0, number)
    );
};

const calculatePercentage = (
    part,
    total
) => {
    const safePart =
        Number(part) || 0;

    const safeTotal =
        Number(total) || 0;

    if (safeTotal <= 0) {
        return 0;
    }

    return clampPercentage(
        (safePart / safeTotal) * 100
    );
};

function DashboardLoading() {
    return (
        <Layout>
            <div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-gray-800" />

                        <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-cyan-400" />
                    </div>

                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white sm:text-3xl">
                            Loading SentinelScan SOC
                        </h1>

                        <p className="mt-2 animate-pulse text-gray-400">
                            Fetching real-time security analytics...
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

function DashboardError({
    error,
    onRetry,
    retrying = false
}) {
    return (
        <Layout>
            <div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex min-h-[70vh] items-center justify-center">
                    <div className="w-full max-w-xl rounded-2xl border border-red-500/40 bg-red-950/20 p-8 shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl bg-red-500/10 p-4">
                                <FaExclamationTriangle className="text-3xl text-red-400" />
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-red-400">
                                    Unable to Load Dashboard
                                </h2>

                                <p className="mt-2 text-gray-300">
                                    {error ||
                                        "The dashboard service is unavailable."}
                                </p>

                                <p className="mt-3 text-sm leading-6 text-gray-500">
                                    Confirm that the FastAPI server is running on
                                    the configured backend port and that the API
                                    key is valid.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onRetry}
                            disabled={retrying}
                            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FaSyncAlt
                                className={
                                    retrying
                                        ? "animate-spin"
                                        : ""
                                }
                            />

                            {retrying
                                ? "Retrying..."
                                : "Retry Dashboard"}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

function SettingBadge({
    label,
    value,
    active = false,
    activeClasses =
        "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
}) {
    return (
        <span
            className={`
                rounded-full
                border
                px-3
                py-1.5
                text-xs
                font-semibold
                ${
                    active
                        ? activeClasses
                        : "border-gray-700 bg-gray-800 text-gray-400"
                }
            `}
        >
            {label}: {value}
        </span>
    );
}

function Dashboard() {
    const {
        dashboard,
        predictionData,
        riskData,
        topDomains,
        loading,
        refreshing,
        error,
        lastUpdated,
        refresh,
        autoRefreshEnabled,
        refreshIntervalSeconds,
        compactMode,
        showAnimations
    } = useDashboard();

    useEffect(() => {
        document.title =
            "SentinelScan | Security Dashboard";
    }, []);

    const stats =
        dashboard?.statistics ?? {};

    const totalScans =
        Number(stats.total_scans) || 0;

    const phishing =
        Number(
            stats.phishing_detected
        ) || 0;

    const suspicious =
        Number(
            stats.suspicious_detected
        ) || 0;

    const legitimate =
        Number(
            stats.legitimate_detected
        ) || 0;

    const averageRisk =
        clampPercentage(
            stats.average_risk_score
        );

    const recentScans =
        Array.isArray(
            dashboard?.recent_scans
        )
            ? dashboard.recent_scans
            : [];

    const dailyScans =
        Array.isArray(
            dashboard?.daily_scans
        )
            ? dashboard.daily_scans
            : [];

    const safePredictionData =
        Array.isArray(predictionData)
            ? predictionData
            : [];

    const safeRiskData =
        Array.isArray(riskData)
            ? riskData
            : [];

    const safeTopDomains =
        Array.isArray(topDomains)
            ? topDomains
            : [];

    const threatCount =
        phishing + suspicious;

    const phishingPercentage =
        useMemo(
            () =>
                calculatePercentage(
                    phishing,
                    totalScans
                ),
            [
                phishing,
                totalScans
            ]
        );

    const suspiciousPercentage =
        useMemo(
            () =>
                calculatePercentage(
                    suspicious,
                    totalScans
                ),
            [
                suspicious,
                totalScans
            ]
        );

    const legitimatePercentage =
        useMemo(
            () =>
                calculatePercentage(
                    legitimate,
                    totalScans
                ),
            [
                legitimate,
                totalScans
            ]
        );

    const pageSpacing =
        compactMode
            ? "space-y-5"
            : "space-y-8";

    const pagePadding =
        compactMode
            ? "px-3 py-4 sm:px-4 lg:px-6"
            : "px-4 py-8 sm:px-6 lg:px-8";

    const sectionGap =
        compactMode
            ? "gap-4"
            : "gap-6";

    const sectionMargin =
        compactMode
            ? "mb-3"
            : "mb-5";

    const motionInitial = showAnimations
        ? {
              opacity: 0,
              y: 22
          }
        : false;

    const horizontalMotionLeft =
        showAnimations
            ? {
                  opacity: 0,
                  x: -24
              }
            : false;

    const horizontalMotionRight =
        showAnimations
            ? {
                  opacity: 0,
                  x: 24
              }
            : false;

    if (loading && !dashboard) {
        return <DashboardLoading />;
    }

    if (error && !dashboard) {
        return (
            <DashboardError
                error={error}
                onRetry={refresh}
                retrying={refreshing}
            />
        );
    }

    return (
        <Layout>
            <MotionConfig
                reducedMotion={
                    showAnimations
                        ? "never"
                        : "always"
                }
            >
                <main
                    className={`
                        mx-auto
                        max-w-[1800px]
                        ${pageSpacing}
                        ${pagePadding}
                    `}
                >
                    <DashboardHeader
                        statistics={
                            dashboard?.statistics ??
                            {}
                        }
                        lastUpdated={
                            lastUpdated
                        }
                        refreshing={
                            refreshing
                        }
                        onRefresh={
                            refresh
                        }
                    />

                    {/* Active interface settings */}

                    <div className="flex flex-wrap items-center gap-3">
                        <SettingBadge
                            label="Auto Refresh"
                            value={
                                autoRefreshEnabled
                                    ? `Every ${refreshIntervalSeconds}s`
                                    : "Disabled"
                            }
                            active={
                                autoRefreshEnabled
                            }
                            activeClasses="border-green-500/20 bg-green-500/10 text-green-400"
                        />

                        <SettingBadge
                            label="Layout"
                            value={
                                compactMode
                                    ? "Compact"
                                    : "Comfortable"
                            }
                            active={
                                compactMode
                            }
                        />

                        <SettingBadge
                            label="Animations"
                            value={
                                showAnimations
                                    ? "Enabled"
                                    : "Disabled"
                            }
                            active={
                                showAnimations
                            }
                            activeClasses="border-purple-500/20 bg-purple-500/10 text-purple-400"
                        />
                    </div>

                    {/* Compact security summary */}

                    <motion.section
                        initial={
                            motionInitial
                        }
                        animate={{
                            opacity: 1,
                            y: 0
                        }}
                        transition={{
                            duration: 0.45,
                            delay: 0.08
                        }}
                        className={`
                            grid
                            grid-cols-1
                            md:grid-cols-3
                            ${sectionGap}
                        `}
                    >
                        <div
                            className={`
                                rounded-2xl
                                border
                                border-red-500/20
                                bg-red-500/5
                                ${
                                    compactMode
                                        ? "p-4"
                                        : "p-5"
                                }
                            `}
                        >
                            <p className="text-sm uppercase tracking-wider text-gray-400">
                                Threats Detected
                            </p>

                            <p className="mt-2 text-3xl font-bold text-red-400">
                                {threatCount}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                Phishing and suspicious
                                detections
                            </p>
                        </div>

                        <div
                            className={`
                                rounded-2xl
                                border
                                border-green-500/20
                                bg-green-500/5
                                ${
                                    compactMode
                                        ? "p-4"
                                        : "p-5"
                                }
                            `}
                        >
                            <p className="text-sm uppercase tracking-wider text-gray-400">
                                Legitimate URLs
                            </p>

                            <p className="mt-2 text-3xl font-bold text-green-400">
                                {legitimate}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                {legitimatePercentage.toFixed(
                                    1
                                )}
                                % of all scans
                            </p>
                        </div>

                        <div
                            className={`
                                rounded-2xl
                                border
                                border-yellow-500/20
                                bg-yellow-500/5
                                ${
                                    compactMode
                                        ? "p-4"
                                        : "p-5"
                                }
                            `}
                        >
                            <p className="text-sm uppercase tracking-wider text-gray-400">
                                Average Risk
                            </p>

                            <p className="mt-2 text-3xl font-bold text-yellow-400">
                                {averageRisk.toFixed(
                                    2
                                )}
                                %
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                Calculated across all
                                stored scans
                            </p>
                        </div>
                    </motion.section>

                    {/* Main KPI cards */}

                    <section>
                        <div
                            className={
                                sectionMargin
                            }
                        >
                            <h2 className="text-2xl font-bold text-white">
                                Security Overview
                            </h2>

                            <p className="mt-1 text-sm text-gray-400">
                                Real values calculated
                                from the SentinelScan
                                database
                            </p>
                        </div>

                        <motion.div
                            initial={
                                motionInitial
                            }
                            animate={{
                                opacity: 1,
                                y: 0
                            }}
                            transition={{
                                duration: 0.45,
                                delay: 0.12
                            }}
                            className={`
                                grid
                                grid-cols-1
                                sm:grid-cols-2
                                xl:grid-cols-4
                                ${sectionGap}
                            `}
                        >
                            <StatCard
                                title="Total Scans"
                                value={
                                    totalScans
                                }
                                subtitle="URLs analysed"
                                icon={
                                    <FaShieldVirus />
                                }
                                color="cyan"
                                progress={
                                    totalScans > 0
                                        ? 100
                                        : 0
                                }
                                status="Operational"
                            />

                            <StatCard
                                title="Phishing"
                                value={
                                    phishing
                                }
                                subtitle="Confirmed threats"
                                icon={
                                    <FaBug />
                                }
                                color="red"
                                progress={
                                    phishingPercentage
                                }
                                status={
                                    phishing > 0
                                        ? "Threats detected"
                                        : "No confirmed threats"
                                }
                            />

                            <StatCard
                                title="Suspicious"
                                value={
                                    suspicious
                                }
                                subtitle="Requires investigation"
                                icon={
                                    <FaExclamationTriangle />
                                }
                                color="yellow"
                                progress={
                                    suspiciousPercentage
                                }
                                status={
                                    suspicious > 0
                                        ? "Monitoring"
                                        : "No pending alerts"
                                }
                            />

                            <StatCard
                                title="Average Risk"
                                value={`${averageRisk.toFixed(
                                    2
                                )}%`}
                                subtitle="Overall risk score"
                                icon={
                                    <FaChartLine />
                                }
                                color={
                                    averageRisk >= 75
                                        ? "red"
                                        : averageRisk >=
                                            40
                                          ? "yellow"
                                          : "green"
                                }
                                progress={
                                    averageRisk
                                }
                                status={
                                    averageRisk >= 75
                                        ? "Critical"
                                        : averageRisk >=
                                            50
                                          ? "High"
                                          : averageRisk >=
                                              25
                                            ? "Moderate"
                                            : "Low"
                                }
                            />
                        </motion.div>
                    </section>

                    {/* Threat intelligence */}

                    <motion.section
                        initial={
                            motionInitial
                        }
                        animate={{
                            opacity: 1,
                            y: 0
                        }}
                        transition={{
                            duration: 0.45,
                            delay: 0.18
                        }}
                    >
                        <div
                            className={
                                sectionMargin
                            }
                        >
                            <h2 className="text-2xl font-bold text-white">
                                Threat Intelligence
                            </h2>

                            <p className="mt-1 text-sm text-gray-400">
                                Latest suspicious and
                                phishing detections
                            </p>
                        </div>

                        <ThreatAlerts
                            scans={
                                recentScans
                            }
                        />
                    </motion.section>

                    {/* Analytics */}

                    <section>
                        <div
                            className={
                                sectionMargin
                            }
                        >
                            <h2 className="text-2xl font-bold text-white">
                                Analytics Overview
                            </h2>

                            <p className="mt-1 text-sm text-gray-400">
                                Distribution, domain
                                and activity analytics
                            </p>
                        </div>

                        <div
                            className={`
                                grid
                                grid-cols-1
                                xl:grid-cols-2
                                ${sectionGap}
                            `}
                        >
                            <motion.div
                                initial={
                                    horizontalMotionLeft
                                }
                                animate={{
                                    opacity: 1,
                                    x: 0
                                }}
                                transition={{
                                    duration: 0.5,
                                    delay: 0.22
                                }}
                            >
                                <PredictionChart
                                    data={
                                        safePredictionData
                                    }
                                />
                            </motion.div>

                            <motion.div
                                initial={
                                    horizontalMotionRight
                                }
                                animate={{
                                    opacity: 1,
                                    x: 0
                                }}
                                transition={{
                                    duration: 0.5,
                                    delay: 0.22
                                }}
                            >
                                <Charts
                                    riskData={
                                        safeRiskData
                                    }
                                    topDomains={
                                        safeTopDomains
                                    }
                                    dailyScans={
                                        dailyScans
                                    }
                                />
                            </motion.div>
                        </div>
                    </section>

                    {/* Recent scans */}

                    <motion.section
                        initial={
                            motionInitial
                        }
                        animate={{
                            opacity: 1,
                            y: 0
                        }}
                        transition={{
                            duration: 0.45,
                            delay: 0.28
                        }}
                    >
                        <div
                            className={
                                sectionMargin
                            }
                        >
                            <h2 className="text-2xl font-bold text-white">
                                Recent Activity
                            </h2>

                            <p className="mt-1 text-sm text-gray-400">
                                Latest scan results
                                stored by SentinelScan
                            </p>
                        </div>

                        <RecentScans
                            scans={
                                recentScans
                            }
                        />
                    </motion.section>

                    {/* Clock and system health */}

                    <motion.section
                        initial={
                            motionInitial
                        }
                        animate={{
                            opacity: 1,
                            y: 0
                        }}
                        transition={{
                            duration: 0.45,
                            delay: 0.34
                        }}
                        className={`
                            grid
                            grid-cols-1
                            lg:grid-cols-2
                            ${sectionGap}
                        `}
                    >
                        <Clock />

                        <SystemHealth />
                    </motion.section>

                    {/* Non-blocking refresh warning */}

                    {error && dashboard && (
                        <div
                            role="alert"
                            className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-200"
                        >
                            The latest refresh failed,
                            so the dashboard is showing
                            the most recently loaded
                            data.
                        </div>
                    )}

                    <footer className="border-t border-gray-800 pt-6">
                        <div className="flex flex-col items-center justify-between gap-3 text-center text-sm text-gray-500 md:flex-row md:text-left">
                            <p>
                                © 2026 SentinelScan AI
                            </p>

                            <p>
                                Machine Learning •
                                Threat Intelligence •
                                Explainable Security
                                Analysis
                            </p>

                            <p>API v1.0.0</p>
                        </div>
                    </footer>
                </main>
            </MotionConfig>
        </Layout>
    );
}

export default Dashboard;