import {
    Suspense,
    lazy
} from "react";
import ErrorBoundary from "./components/common/ErrorBoundary";
import {
    BrowserRouter,
    Link,
    Route,
    Routes
} from "react-router-dom";

import { Toaster } from "react-hot-toast";

import {
    FaExclamationTriangle,
    FaHome,
    FaSpinner
} from "react-icons/fa";

const Dashboard = lazy(
    () => import("./pages/Dashboard")
);

const Scanner = lazy(
    () => import("./pages/Scanner")
);

const History = lazy(
    () => import("./pages/History")
);

const ThreatIntel = lazy(
    () => import("./pages/ThreatIntel")
);

const Explainability = lazy(
    () => import("./pages/Explainability")
);

const Settings = lazy(
    () => import("./pages/Settings")
);

function PageLoader() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-white">
            <div className="text-center">
                <FaSpinner className="mx-auto animate-spin text-4xl text-cyan-400" />

                <h1 className="mt-5 text-2xl font-bold">
                    Loading SentinelScan
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                    Preparing the requested security module...
                </p>
            </div>
        </div>
    );
}

function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-white">
            <div className="w-full max-w-xl rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-8 text-center shadow-2xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-500/20 bg-yellow-500/10">
                    <FaExclamationTriangle className="text-3xl text-yellow-400" />
                </div>

                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
                    Error 404
                </p>

                <h1 className="mt-3 text-3xl font-extrabold text-white">
                    Page Not Found
                </h1>

                <p className="mt-3 text-sm leading-6 text-gray-400">
                    The requested SentinelScan page does not exist or the route
                    has changed.
                </p>

                <Link
                    to="/"
                    className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-500"
                >
                    <FaHome />
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}

function AppRoutes() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route
                    path="/"
                    element={<Dashboard />}
                />

                <Route
                    path="/scanner"
                    element={<Scanner />}
                />

                <Route
                    path="/history"
                    element={<History />}
                />

                <Route
                    path="/threat-intel"
                    element={<ThreatIntel />}
                />

                <Route
                    path="/explainability"
                    element={<Explainability />}
                />

                <Route
                    path="/settings"
                    element={<Settings />}
                />

                <Route
                    path="*"
                    element={<NotFound />}
                />
            </Routes>
        </Suspense>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={10}
                containerStyle={{
                    top: 20,
                    right: 20
                }}
                toastOptions={{
                    duration: 3500,

                    style: {
                        background: "#111827",
                        color: "#ffffff",
                        border: "1px solid #374151",
                        borderRadius: "12px",
                        fontSize: "14px",
                        maxWidth: "420px",
                        padding: "14px 16px",
                        boxShadow:
                            "0 20px 45px rgba(0, 0, 0, 0.35)"
                    },

                    success: {
                        iconTheme: {
                            primary: "#22c55e",
                            secondary: "#ffffff"
                        }
                    },

                    error: {
                        duration: 5000,

                        iconTheme: {
                            primary: "#ef4444",
                            secondary: "#ffffff"
                        }
                    }
                }}
            />

            <ErrorBoundary>
                <AppRoutes />
            </ErrorBoundary>
        </BrowserRouter>
    );
}

export default App;
