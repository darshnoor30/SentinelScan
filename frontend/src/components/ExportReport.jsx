import {
    memo,
    useCallback,
    useMemo,
    useState
} from "react";

import {
    FaDownload,
    FaFileCode,
    FaFilePdf,
    FaCheckCircle,
    FaExclamationTriangle
} from "react-icons/fa";

const sanitizeFilename = (value) =>
    String(value ?? "scan")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80) || "scan";

const formatDateTime = (value) => {
    if (!value) {
        return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Invalid timestamp";
    }

    return date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
};

const normalizeArray = (value) =>
    Array.isArray(value)
        ? value.filter(Boolean)
        : [];

const normalizeObject = (value) =>
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
        ? value
        : {};

const downloadBlob = ({
    content,
    type,
    filename
}) => {
    const blob = new Blob(
        [content],
        {
            type
        }
    );

    const objectUrl =
        URL.createObjectURL(blob);

    const anchor =
        document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
    }, 100);
};

const escapeHtml = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const formatJsonValue = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return "Not reported";
    }

    if (
        typeof value === "object"
    ) {
        return JSON.stringify(
            value,
            null,
            2
        );
    }

    return String(value);
};

function ExportButton({
    icon,
    title,
    description,
    onClick,
    disabled = false,
    variant = "cyan"
}) {
    const styles = {
        cyan:
            "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20",
        red:
            "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`
                flex
                w-full
                items-center
                gap-4
                rounded-xl
                border
                p-4
                text-left
                transition
                disabled:cursor-not-allowed
                disabled:opacity-50
                ${styles[variant] ?? styles.cyan}
            `}
        >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-black/10 text-xl">
                {icon}
            </span>

            <span className="min-w-0">
                <span className="block font-bold">
                    {title}
                </span>

                <span className="mt-1 block text-xs text-gray-400">
                    {description}
                </span>
            </span>
        </button>
    );
}

function ExportReport({
    result
}) {
    const [message, setMessage] =
        useState(null);

    const safeResult = useMemo(
        () =>
            normalizeObject(result),
        [result]
    );

    const reportMetadata = useMemo(
        () => ({
            exported_at:
                new Date().toISOString(),
            application:
                "SentinelScan",
            report_type:
                "URL Security Scan Report",
            scan:
                safeResult
        }),
        [safeResult]
    );

    const scanId =
        safeResult.scan_id ||
        "unknown-scan";

    const filenameBase =
        sanitizeFilename(
            `SentinelScan-${scanId}`
        );

    const showMessage = useCallback(
        (type, text) => {
            setMessage({
                type,
                text
            });

            window.setTimeout(() => {
                setMessage(null);
            }, 3000);
        },
        []
    );

    const downloadJSON =
        useCallback(() => {
            try {
                const json =
                    JSON.stringify(
                        reportMetadata,
                        null,
                        2
                    );

                downloadBlob({
                    content: json,
                    type: "application/json;charset=utf-8",
                    filename:
                        `${filenameBase}.json`
                });

                showMessage(
                    "success",
                    "JSON report downloaded successfully."
                );
            } catch (error) {
                console.error(
                    "JSON export failed:",
                    error
                );

                showMessage(
                    "error",
                    "Unable to export the JSON report."
                );
            }
        }, [
            filenameBase,
            reportMetadata,
            showMessage
        ]);

    const printReport =
        useCallback(() => {
            try {
                const reasons =
                    normalizeArray(
                        safeResult.reasons
                    );

                const threatIntelligence =
                    normalizeObject(
                        safeResult.threat_intelligence
                    );

                const reasonsHtml =
                    reasons.length > 0
                        ? reasons
                              .map(
                                  (reason) => `
                                      <li>${escapeHtml(reason)}</li>
                                  `
                              )
                              .join("")
                        : "<li>No detection reasons were returned.</li>";

                const threatIntelHtml =
                    Object.keys(
                        threatIntelligence
                    ).length > 0
                        ? `
                            <pre>${escapeHtml(
                                JSON.stringify(
                                    threatIntelligence,
                                    null,
                                    2
                                )
                            )}</pre>
                        `
                        : "<p>No threat-intelligence information was returned.</p>";

                const reportHtml = `
                    <!doctype html>
                    <html lang="en">
                    <head>
                        <meta charset="utf-8" />
                        <title>${escapeHtml(filenameBase)}</title>

                        <style>
                            * {
                                box-sizing: border-box;
                            }

                            body {
                                margin: 0;
                                padding: 36px;
                                color: #111827;
                                font-family: Arial, Helvetica, sans-serif;
                                line-height: 1.5;
                            }

                            .header {
                                padding-bottom: 22px;
                                border-bottom: 3px solid #0891b2;
                            }

                            .brand {
                                margin: 0;
                                color: #0891b2;
                                font-size: 30px;
                            }

                            .subtitle {
                                margin: 6px 0 0;
                                color: #4b5563;
                            }

                            .section {
                                margin-top: 28px;
                            }

                            .section h2 {
                                margin-bottom: 12px;
                                color: #111827;
                                font-size: 19px;
                                border-bottom: 1px solid #d1d5db;
                                padding-bottom: 7px;
                            }

                            .grid {
                                display: grid;
                                grid-template-columns: repeat(2, minmax(0, 1fr));
                                gap: 12px;
                            }

                            .metric {
                                padding: 14px;
                                border: 1px solid #d1d5db;
                                border-radius: 8px;
                                background: #f9fafb;
                            }

                            .label {
                                color: #6b7280;
                                font-size: 11px;
                                text-transform: uppercase;
                                letter-spacing: 0.08em;
                            }

                            .value {
                                margin-top: 5px;
                                font-size: 16px;
                                font-weight: 700;
                                overflow-wrap: anywhere;
                            }

                            ul {
                                padding-left: 22px;
                            }

                            li {
                                margin-bottom: 8px;
                            }

                            pre {
                                white-space: pre-wrap;
                                overflow-wrap: anywhere;
                                padding: 14px;
                                border: 1px solid #d1d5db;
                                border-radius: 8px;
                                background: #f3f4f6;
                                font-size: 11px;
                            }

                            .footer {
                                margin-top: 34px;
                                padding-top: 14px;
                                border-top: 1px solid #d1d5db;
                                color: #6b7280;
                                font-size: 11px;
                            }

                            @media print {
                                body {
                                    padding: 18px;
                                }

                                .section {
                                    break-inside: avoid;
                                }

                                @page {
                                    margin: 14mm;
                                }
                            }
                        </style>
                    </head>

                    <body>
                        <header class="header">
                            <h1 class="brand">
                                SentinelScan
                            </h1>

                            <p class="subtitle">
                                URL Security Scan Report
                            </p>
                        </header>

                        <section class="section">
                            <h2>Scan Summary</h2>

                            <div class="grid">
                                <div class="metric">
                                    <div class="label">Prediction</div>
                                    <div class="value">
                                        ${escapeHtml(
                                            safeResult.prediction ||
                                            "Not available"
                                        )}
                                    </div>
                                </div>

                                <div class="metric">
                                    <div class="label">Severity</div>
                                    <div class="value">
                                        ${escapeHtml(
                                            safeResult.severity ||
                                            "Not available"
                                        )}
                                    </div>
                                </div>

                                <div class="metric">
                                    <div class="label">Risk Score</div>
                                    <div class="value">
                                        ${escapeHtml(
                                            safeResult.risk_score ??
                                            "Not available"
                                        )}%
                                    </div>
                                </div>

                                <div class="metric">
                                    <div class="label">Confidence</div>
                                    <div class="value">
                                        ${escapeHtml(
                                            safeResult.confidence ??
                                            "Not available"
                                        )}%
                                    </div>
                                </div>

                                <div class="metric">
                                    <div class="label">Scan ID</div>
                                    <div class="value">
                                        ${escapeHtml(scanId)}
                                    </div>
                                </div>

                                <div class="metric">
                                    <div class="label">Scan Time</div>
                                    <div class="value">
                                        ${escapeHtml(
                                            formatDateTime(
                                                safeResult.scan_time
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section class="section">
                            <h2>Analysed URL</h2>

                            <p>
                                ${escapeHtml(
                                    safeResult.url ||
                                    "Not available"
                                )}
                            </p>
                        </section>

                        <section class="section">
                            <h2>Detection Reasons</h2>

                            <ul>
                                ${reasonsHtml}
                            </ul>
                        </section>

                        <section class="section">
                            <h2>Threat Intelligence</h2>

                            ${threatIntelHtml}
                        </section>

                        <section class="section">
                            <h2>Raw Model Prediction</h2>

                            <pre>${escapeHtml(
                                formatJsonValue(
                                    safeResult.ml_prediction
                                )
                            )}</pre>
                        </section>

                        <footer class="footer">
                            Exported from SentinelScan on
                            ${escapeHtml(
                                formatDateTime(
                                    new Date()
                                )
                            )}.
                            This report contains only values returned by the
                            SentinelScan backend.
                        </footer>
                    </body>
                    </html>
                `;

                const printWindow =
                    window.open(
                        "",
                        "_blank",
                        "width=1000,height=800"
                    );

                if (!printWindow) {
                    throw new Error(
                        "The browser blocked the report window."
                    );
                }

                printWindow.document.open();
                printWindow.document.write(
                    reportHtml
                );
                printWindow.document.close();

                printWindow.onload = () => {
                    printWindow.focus();
                    printWindow.print();
                };

                showMessage(
                    "success",
                    "Report opened. Choose “Save as PDF” in the print dialog."
                );
            } catch (error) {
                console.error(
                    "PDF export failed:",
                    error
                );

                showMessage(
                    "error",
                    error?.message ||
                    "Unable to prepare the PDF report."
                );
            }
        }, [
            filenameBase,
            safeResult,
            scanId,
            showMessage
        ]);

    if (
        !result ||
        typeof result !== "object"
    ) {
        return null;
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="border-b border-gray-800 px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                        <FaDownload className="text-xl text-cyan-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Export Scan Report
                        </h2>

                        <p className="mt-1 text-sm text-gray-400">
                            Download the complete backend response or generate
                            a printable security report
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ExportButton
                        icon={<FaFileCode />}
                        title="Download JSON"
                        description="Exports the complete scan response and report metadata."
                        onClick={downloadJSON}
                        variant="cyan"
                    />

                    <ExportButton
                        icon={<FaFilePdf />}
                        title="Print or Save as PDF"
                        description="Opens a formatted report in the browser print dialog."
                        onClick={printReport}
                        variant="red"
                    />
                </div>

                {message && (
                    <div
                        role="status"
                        className={`
                            mt-5
                            flex
                            items-start
                            gap-3
                            rounded-xl
                            border
                            px-4
                            py-3
                            text-sm
                            ${
                                message.type === "success"
                                    ? "border-green-500/30 bg-green-500/10 text-green-300"
                                    : "border-red-500/30 bg-red-500/10 text-red-300"
                            }
                        `}
                    >
                        {message.type === "success" ? (
                            <FaCheckCircle className="mt-0.5 shrink-0" />
                        ) : (
                            <FaExclamationTriangle className="mt-0.5 shrink-0" />
                        )}

                        <span>
                            {message.text}
                        </span>
                    </div>
                )}

                <div className="mt-6 rounded-xl border border-gray-800 bg-gray-950/50 p-4">
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                        Report filename
                    </p>

                    <p className="mt-2 break-all font-mono text-sm text-cyan-400">
                        {filenameBase}
                    </p>
                </div>

                <p className="mt-4 text-xs leading-5 text-gray-600">
                    The PDF option uses the browser print dialog. Select
                    “Save as PDF” as the printer destination. No scan values
                    are fabricated during export.
                </p>
            </div>
        </section>
    );
}

export default memo(ExportReport);
