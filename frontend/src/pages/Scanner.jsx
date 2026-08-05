import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import {
    FaExclamationTriangle,
    FaRedoAlt,
    FaSearch,
    FaShieldAlt
} from "react-icons/fa";

import api from "../api/axios";

import Layout from "../components/layout/Layout";
import URLInput from "../components/URLInput";
import LoadingSpinner from "../components/LoadingSpinner";
import PredictionCard from "../components/PredictionCard";
import RiskMeter from "../components/RiskMeter";
import ConfidenceCard from "../components/ConfidenceCard";
import ReasonsCard from "../components/ReasonsCard";
import ThreatIntelCard from "../components/ThreatIntelCard";
import ExplainabilityCard from "../components/ExplainabilityCard";
import ExportReport from "../components/ExportReport";

const normalizeUrl = (value) => {
    const input = String(value ?? "").trim();

    if (!input) {
        throw new Error("Please enter a URL.");
    }

    const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(input)
        ? input
        : `https://${input}`;

    let parsedUrl;

    try {
        parsedUrl = new URL(candidate);
    } catch {
        throw new Error(
            "Enter a valid URL, for example https://example.com."
        );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error(
            "Only HTTP and HTTPS URLs can be scanned."
        );
    }

    if (!parsedUrl.hostname) {
        throw new Error("The URL must contain a valid hostname.");
    }

    return parsedUrl.toString();
};

const getScanErrorMessage = (error) => {
    if (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError"
    ) {
        return null;
    }

    if (error?.response?.status === 401) {
        return "Authentication failed. Check the SentinelScan API key.";
    }

    if (error?.response?.status === 422) {
        return (
            error?.response?.data?.detail?.[0]?.msg ||
            "The submitted URL was rejected by the API."
        );
    }

    if (error?.response?.status >= 500) {
        return (
            error?.response?.data?.detail ||
            "The scanning engine encountered an internal error."
        );
    }

    if (error?.code === "ECONNABORTED") {
        return "The scan request timed out. Please try again.";
    }

    if (!error?.response) {
        return (
            "Unable to connect to the SentinelScan backend. " +
            "Confirm that FastAPI is running."
        );
    }

    return (
        error?.response?.data?.detail ||
        error?.message ||
        "Unable to complete the URL scan."
    );
};

const isValidScanResult = (data) =>
    data &&
    typeof data === "object" &&
    typeof data.prediction === "string";

function ScannerError({
    message,
    onDismiss
}) {
    return (
        <div
            role="alert"
            className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                        <FaExclamationTriangle className="text-xl text-red-400" />
                    </div>

                    <div>
                        <h2 className="font-bold text-red-300">
                            Scan Failed
                        </h2>

                        <p className="mt-1 text-sm text-gray-300">
                            {message}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onDismiss}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                >
                    <FaRedoAlt />
                    Dismiss
                </button>
            </div>
        </div>
    );
}

function Scanner() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [lastScannedUrl, setLastScannedUrl] = useState("");

    const requestControllerRef = useRef(null);
    const mountedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        document.title = "SentinelScan | URL Scanner";

        return () => {
            mountedRef.current = false;
            requestControllerRef.current?.abort();
        };
    }, []);

    const handleScan = useCallback(
        async (rawUrl) => {
            if (loading) {
                return;
            }

            let normalizedUrl;

            try {
                normalizedUrl = normalizeUrl(rawUrl);
            } catch (validationError) {
                setError(validationError.message);
                setResult(null);
                return;
            }

            requestControllerRef.current?.abort();

            const controller = new AbortController();
            requestControllerRef.current = controller;

            setLoading(true);
            setError(null);
            setResult(null);
            setLastScannedUrl(normalizedUrl);

            try {
                const response = await api.post(
                    "/scan",
                    {
                        url: normalizedUrl
                    },
                    {
                        signal: controller.signal
                    }
                );

                if (!isValidScanResult(response?.data)) {
                    throw new Error(
                        "The API returned an invalid scan response."
                    );
                }

                if (mountedRef.current) {
                    setResult(response.data);
                }
            } catch (requestError) {
                const message =
                    getScanErrorMessage(requestError);

                if (
                    mountedRef.current &&
                    message
                ) {
                    console.error(
                        "URL scan failed:",
                        requestError
                    );

                    setError(message);
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false);
                }
            }
        },
        [loading]
    );

    const clearResult = useCallback(() => {
        requestControllerRef.current?.abort();
        setLoading(false);
        setResult(null);
        setError(null);
        setLastScannedUrl("");
    }, []);

    const safeReasons = Array.isArray(result?.reasons)
        ? result.reasons
        : [];

    const safeThreatIntelligence =
        result?.threat_intelligence &&
        typeof result.threat_intelligence === "object"
            ? result.threat_intelligence
            : {};

    return (
        <Layout>
            <main className="mx-auto max-w-[1600px] space-y-8">
                {/* Page header */}

                <section className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-gray-900 to-slate-950 p-6 shadow-2xl sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                                <FaSearch className="text-2xl text-cyan-400" />
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
                                    URL Threat Analysis
                                </p>

                                <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                                    SentinelScan Scanner
                                </h1>

                                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base">
                                    Analyse a URL using machine-learning
                                    detection, risk scoring, explainability and
                                    configured threat-intelligence services.
                                </p>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 self-start rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400">
                            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />
                            Scanner Ready
                        </div>
                    </div>
                </section>

                {/* Scanner input */}

                <section className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-xl">
                    <div className="mb-5 flex items-center gap-3">
                        <FaShieldAlt className="text-xl text-cyan-400" />

                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Scan a URL
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Enter a complete domain or HTTP/HTTPS URL.
                            </p>
                        </div>
                    </div>

                    <URLInput
                        onScan={handleScan}
                        loading={loading}
                    />

                    {lastScannedUrl && (
                        <p className="mt-4 break-all text-xs text-gray-500">
                            Analysing:{" "}
                            <span className="text-gray-300">
                                {lastScannedUrl}
                            </span>
                        </p>
                    )}
                </section>

                {/* Error */}

                {error && (
                    <ScannerError
                        message={error}
                        onDismiss={() => setError(null)}
                    />
                )}

                {/* Loading */}

                {loading && (
                    <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 shadow-xl">
                        <LoadingSpinner />

                        <p className="mt-4 text-center text-sm text-gray-400">
                            SentinelScan is processing the URL. The duration
                            depends on network-based security checks.
                        </p>
                    </section>
                )}

                {/* Result */}

                {result && !loading && (
                    <div className="space-y-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Scan Results
                                </h2>

                                <p className="mt-1 text-sm text-gray-400">
                                    Analysis completed for the submitted URL.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={clearResult}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-cyan-500 hover:text-cyan-400"
                            >
                                <FaRedoAlt />
                                New Scan
                            </button>
                        </div>

                        <PredictionCard result={result} />

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <RiskMeter
                                score={Number(result?.risk_score) || 0}
                            />

                            <ConfidenceCard
                                confidence={
                                    Number(result?.confidence) || 0
                                }
                            />
                        </div>

                        <ReasonsCard reasons={safeReasons} />

                        <ThreatIntelCard
                            threatIntel={safeThreatIntelligence}
                        />

                        <ExplainabilityCard result={result} />

                        <ExportReport result={result} />
                    </div>
                )}

                {/* Initial empty state */}

                {!loading && !result && !error && (
                    <section className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-14 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                            <FaShieldAlt className="text-3xl text-cyan-400" />
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-white">
                            Ready for Security Analysis
                        </h2>

                        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">
                            Submit a URL above to generate its prediction,
                            confidence, risk score, detection reasons and
                            available threat-intelligence results.
                        </p>
                    </section>
                )}
            </main>
        </Layout>
    );
}

export default Scanner;