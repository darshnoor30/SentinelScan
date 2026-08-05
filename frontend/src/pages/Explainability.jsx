import React, { memo } from "react";

import {
    FaBrain,
    FaChartBar,
    FaShieldAlt,
    FaExclamationTriangle
} from "react-icons/fa";

import Layout from "../components/layout/Layout";

function Explainability() {
    return (
        <Layout>
            <main className="mx-auto max-w-[1400px] space-y-8">
                <section className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-gray-900 to-slate-950 p-6 shadow-2xl sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                            <FaBrain className="text-2xl text-cyan-400" />
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
                                Explainable Artificial Intelligence
                            </p>

                            <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                                Model Explainability
                            </h1>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base">
                                Understand the evidence and model information
                                available for SentinelScan predictions.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
                    <div className="flex items-center gap-3 border-b border-gray-800 px-6 py-5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                            <FaChartBar className="text-xl text-cyan-400" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Feature Importance
                            </h2>

                            <p className="mt-1 text-sm text-gray-400">
                                Model-level contribution data
                            </p>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                            <div className="flex items-start gap-4">
                                <FaExclamationTriangle className="mt-1 shrink-0 text-xl text-yellow-400" />

                                <div>
                                    <h3 className="font-bold text-yellow-200">
                                        Real explainability data is not available yet
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-gray-400">
                                        The current backend response does not expose
                                        SHAP values, LIME explanations, per-feature
                                        contributions, or global feature-importance
                                        scores. Showing percentages here would be
                                        misleading.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-5">
                                <FaBrain className="text-2xl text-cyan-400" />

                                <h3 className="mt-4 font-bold text-white">
                                    Current Evidence
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-gray-500">
                                    Individual scan reasons returned by the
                                    backend can be reviewed on the Scanner page.
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-5">
                                <FaChartBar className="text-2xl text-purple-400" />

                                <h3 className="mt-4 font-bold text-white">
                                    Planned XAI
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-gray-500">
                                    Add SHAP or another supported method in the
                                    backend before displaying feature rankings.
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-5">
                                <FaShieldAlt className="text-2xl text-green-400" />

                                <h3 className="mt-4 font-bold text-white">
                                    Trustworthy Display
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-gray-500">
                                    This page intentionally avoids inventing
                                    model scores that were not produced by the
                                    trained model.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6 shadow-xl">
                    <h2 className="text-xl font-bold text-white">
                        Required Backend Data
                    </h2>

                    <p className="mt-2 text-sm text-gray-400">
                        A future scan response can include real explainability
                        values in a structure such as:
                    </p>

                    <pre className="mt-5 overflow-x-auto rounded-xl border border-gray-800 bg-gray-950 p-5 text-sm leading-6 text-cyan-300">
{`{
  "feature_importance": [
    {
      "name": "url_length",
      "value": 18.42
    },
    {
      "name": "ssl_final_state",
      "value": 14.77
    }
  ],
  "explanation_method": "SHAP"
}`}
                    </pre>
                </section>
            </main>
        </Layout>
    );
}

export default memo(Explainability);