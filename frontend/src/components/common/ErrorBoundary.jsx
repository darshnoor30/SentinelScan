import React from "react";

import {
    FaExclamationTriangle,
    FaHome,
    FaRedoAlt
} from "react-icons/fa";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error, errorInfo) {
        console.error(
            "SentinelScan UI error:",
            error,
            errorInfo
        );
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null
        });

        window.location.reload();
    };

    handleDashboard = () => {
        window.location.assign("/");
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        const errorMessage =
            this.state.error?.message ||
            "An unexpected interface error occurred.";

        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-white">
                <div className="w-full max-w-2xl rounded-3xl border border-red-500/30 bg-gradient-to-br from-gray-900 to-red-950/20 p-8 shadow-2xl">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
                            <FaExclamationTriangle className="text-3xl text-red-400" />
                        </div>

                        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-red-400">
                            Interface Failure
                        </p>

                        <h1 className="mt-3 text-3xl font-extrabold">
                            SentinelScan encountered an error
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400">
                            A frontend component failed while rendering. The
                            backend and stored scan records may still be
                            available.
                        </p>
                    </div>

                    <div className="mt-7 rounded-xl border border-gray-800 bg-gray-950/70 p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-500">
                            Error message
                        </p>

                        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-sm text-red-300">
                            {errorMessage}
                        </pre>
                    </div>

                    <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={this.handleDashboard}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-5 py-3 font-semibold text-gray-300 transition hover:border-cyan-500 hover:text-cyan-400"
                        >
                            <FaHome />
                            Return to Dashboard
                        </button>

                        <button
                            type="button"
                            onClick={this.handleRetry}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-500"
                        >
                            <FaRedoAlt />
                            Reload Application
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;