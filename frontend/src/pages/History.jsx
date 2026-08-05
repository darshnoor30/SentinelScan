import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import toast from "react-hot-toast";

import {
    FaHistory,
    FaSyncAlt,
    FaShieldAlt,
    FaExclamationTriangle,
    FaChevronLeft,
    FaChevronRight
} from "react-icons/fa";

import api from "../api/axios";

import Layout from "../components/layout/Layout";
import SearchBar from "../components/history/SearchBar";
import FilterBar from "../components/history/FilterBar";
import HistoryTable from "../components/history/HistoryTable";
import ScanDetailsModal from "../components/history/ScanDetailsModal";
import DeleteModal from "../components/history/DeleteModal";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const normalizeText = (value) =>
    String(value ?? "").trim().toUpperCase();

const normalizeScans = (value) =>
    Array.isArray(value) ? value : [];

const getHistoryErrorMessage = (error) => {
    if (
        error?.code === "ERR_CANCELED" ||
        error?.name === "CanceledError"
    ) {
        return null;
    }

    if (error?.response?.status === 401) {
        return "Authentication failed. Check the SentinelScan API key.";
    }

    if (error?.response?.status === 403) {
        return "Access to scan history was denied.";
    }

    if (error?.response?.status >= 500) {
        return "The backend encountered an error while loading scan history.";
    }

    if (!error?.response) {
        return "Unable to connect to the SentinelScan backend.";
    }

    return (
        error?.response?.data?.detail ||
        error?.message ||
        "Unable to load scan history."
    );
};

const getDeleteErrorMessage = (error) => {
    if (error?.response?.status === 404) {
        return "The selected scan no longer exists.";
    }

    if (error?.response?.status === 401) {
        return "Authentication failed. Check the SentinelScan API key.";
    }

    if (!error?.response) {
        return "Unable to connect to the SentinelScan backend.";
    }

    return (
        error?.response?.data?.detail ||
        error?.message ||
        "Unable to delete the selected scan."
    );
};

const getTimestamp = (scan) => {
    const value =
        scan?.scan_time ??
        scan?.created_at;

    if (!value) {
        return 0;
    }

    const timestamp =
        new Date(value).getTime();

    return Number.isNaN(timestamp)
        ? 0
        : timestamp;
};

function HistoryLoading() {
    return (
        <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
            <div className="space-y-4 p-6">
                {[1, 2, 3, 4, 5].map((item) => (
                    <div
                        key={item}
                        className="h-20 animate-pulse rounded-xl border border-gray-800 bg-gray-900"
                    />
                ))}
            </div>
        </section>
    );
}

function HistoryError({
    message,
    refreshing,
    onRetry
}) {
    return (
        <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 shadow-xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                        <FaExclamationTriangle className="text-xl text-red-400" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-red-300">
                            History Unavailable
                        </h2>

                        <p className="mt-2 text-sm text-gray-300">
                            {message}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onRetry}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <FaSyncAlt
                        className={
                            refreshing
                                ? "animate-spin"
                                : ""
                        }
                    />

                    {refreshing
                        ? "Retrying..."
                        : "Retry"}
                </button>
            </div>
        </section>
    );
}

function EmptyHistory({
    filtered
}) {
    return (
        <section className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                <FaShieldAlt className="text-3xl text-cyan-400" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
                {filtered
                    ? "No matching scans found"
                    : "No scan history available"}
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                {filtered
                    ? "Change the search term or prediction filter to view other scan records."
                    : "Run a URL scan to create your first history record."}
            </p>
        </section>
    );
}

function Pagination({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    startItem,
    endItem,
    onPageChange,
    onPageSizeChange
}) {
    return (
        <div className="flex flex-col gap-4 border-t border-gray-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-300">
                    {totalItems === 0
                        ? 0
                        : startItem}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-300">
                    {endItem}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-300">
                    {totalItems}
                </span>{" "}
                scans
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-sm text-gray-500">
                    Rows

                    <select
                        value={pageSize}
                        onChange={(event) =>
                            onPageSizeChange(
                                Number(event.target.value)
                            )
                        }
                        className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-gray-200 outline-none transition focus:border-cyan-500"
                    >
                        {PAGE_SIZE_OPTIONS.map(
                            (size) => (
                                <option
                                    key={size}
                                    value={size}
                                >
                                    {size}
                                </option>
                            )
                        )}
                    </select>
                </label>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            onPageChange(
                                currentPage - 1
                            )
                        }
                        disabled={
                            currentPage <= 1
                        }
                        aria-label="Previous page"
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-900 text-gray-300 transition hover:border-cyan-500 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <FaChevronLeft />
                    </button>

                    <span className="min-w-[110px] text-center text-sm text-gray-400">
                        Page{" "}
                        <span className="font-semibold text-white">
                            {currentPage}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-white">
                            {totalPages}
                        </span>
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            onPageChange(
                                currentPage + 1
                            )
                        }
                        disabled={
                            currentPage >=
                            totalPages
                        }
                        aria-label="Next page"
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-900 text-gray-300 transition hover:border-cyan-500 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <FaChevronRight />
                    </button>
                </div>
            </div>
        </div>
    );
}

function History() {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [filter, setFilter] =
        useState("ALL");
    const [sortOrder, setSortOrder] =
        useState("NEWEST");

    const [currentPage, setCurrentPage] =
        useState(1);
    const [pageSize, setPageSize] =
        useState(10);

    const [selectedScan, setSelectedScan] =
        useState(null);

    const [deleteOpen, setDeleteOpen] =
        useState(false);
    const [selectedDelete, setSelectedDelete] =
        useState(null);
    const [deleting, setDeleting] =
        useState(false);

    const mountedRef = useRef(false);
    const controllerRef = useRef(null);
    const requestRunningRef = useRef(false);

    const loadHistory = useCallback(
        async ({ background = false } = {}) => {
            if (requestRunningRef.current) {
                return false;
            }

            requestRunningRef.current = true;

            controllerRef.current?.abort();

            const controller =
                new AbortController();

            controllerRef.current =
                controller;

            if (background) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const response =
                    await api.get(
                        "/history",
                        {
                            params: {
                                limit: 200
                            },
                            signal:
                                controller.signal
                        }
                    );

                const historyScans =
                    normalizeScans(
                        response?.data?.scans
                    );

                if (!mountedRef.current) {
                    return false;
                }

                setScans(historyScans);
                setError(null);

                return true;
            } catch (requestError) {
                const message =
                    getHistoryErrorMessage(
                        requestError
                    );

                if (
                    mountedRef.current &&
                    message
                ) {
                    console.error(
                        "History request failed:",
                        requestError
                    );

                    setError(message);

                    if (background) {
                        toast.error(message);
                    }
                }

                return false;
            } finally {
                requestRunningRef.current = false;

                if (mountedRef.current) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        []
    );

    useEffect(() => {
        mountedRef.current = true;

        document.title =
            "SentinelScan | Scan History";

        loadHistory();

        return () => {
            mountedRef.current = false;
            controllerRef.current?.abort();
        };
    }, [loadHistory]);

    useEffect(() => {
        setCurrentPage(1);
    }, [
        search,
        filter,
        sortOrder,
        pageSize
    ]);

    const handleRefresh = useCallback(
        async () => {
            const success =
                await loadHistory({
                    background: true
                });

            if (success) {
                toast.success(
                    "Scan history refreshed."
                );
            }
        },
        [loadHistory]
    );

    const openDeleteModal = useCallback(
        (scan) => {
            setSelectedDelete(scan);
            setDeleteOpen(true);
        },
        []
    );

    const closeDeleteModal = useCallback(
        () => {
            if (deleting) {
                return;
            }

            setDeleteOpen(false);
            setSelectedDelete(null);
        },
        [deleting]
    );

    const handleDelete = useCallback(
        async () => {
            const scanId =
                selectedDelete?.scan_id;

            if (!scanId || deleting) {
                return;
            }

            try {
                setDeleting(true);

                await api.delete(
                    `/scan/${encodeURIComponent(
                        scanId
                    )}`
                );

                setScans((previous) =>
                    previous.filter(
                        (scan) =>
                            scan?.scan_id !==
                            scanId
                    )
                );

                if (
                    selectedScan?.scan_id ===
                    scanId
                ) {
                    setSelectedScan(null);
                }

                toast.success(
                    "Scan deleted successfully."
                );

                setDeleteOpen(false);
                setSelectedDelete(null);
            } catch (deleteError) {
                console.error(
                    "Delete scan failed:",
                    deleteError
                );

                toast.error(
                    getDeleteErrorMessage(
                        deleteError
                    )
                );
            } finally {
                setDeleting(false);
            }
        },
        [
            deleting,
            selectedDelete,
            selectedScan
        ]
    );

    const filteredScans = useMemo(() => {
        const normalizedSearch =
            search.trim().toLowerCase();

        const filtered = scans.filter(
            (scan) => {
                const url = String(
                    scan?.url ?? ""
                ).toLowerCase();

                const scanId = String(
                    scan?.scan_id ?? ""
                ).toLowerCase();

                const prediction =
                    normalizeText(
                        scan?.prediction
                    );

                const matchesSearch =
                    !normalizedSearch ||
                    url.includes(
                        normalizedSearch
                    ) ||
                    scanId.includes(
                        normalizedSearch
                    );

                const matchesFilter =
                    filter === "ALL" ||
                    prediction === filter;

                return (
                    matchesSearch &&
                    matchesFilter
                );
            }
        );

        return [...filtered].sort(
            (first, second) => {
                const firstTime =
                    getTimestamp(first);

                const secondTime =
                    getTimestamp(second);

                if (sortOrder === "OLDEST") {
                    return (
                        firstTime -
                        secondTime
                    );
                }

                if (sortOrder === "RISK_HIGH") {
                    return (
                        (Number(
                            second?.risk_score
                        ) || 0) -
                        (Number(
                            first?.risk_score
                        ) || 0)
                    );
                }

                if (sortOrder === "RISK_LOW") {
                    return (
                        (Number(
                            first?.risk_score
                        ) || 0) -
                        (Number(
                            second?.risk_score
                        ) || 0)
                    );
                }

                return (
                    secondTime -
                    firstTime
                );
            }
        );
    }, [
        scans,
        search,
        filter,
        sortOrder
    ]);

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredScans.length /
                pageSize
        )
    );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedScans = useMemo(() => {
        const start =
            (currentPage - 1) *
            pageSize;

        return filteredScans.slice(
            start,
            start + pageSize
        );
    }, [
        currentPage,
        filteredScans,
        pageSize
    ]);

    const startItem =
        filteredScans.length === 0
            ? 0
            : (currentPage - 1) *
                  pageSize +
              1;

    const endItem = Math.min(
        currentPage * pageSize,
        filteredScans.length
    );

    const hasActiveFilters =
        Boolean(search.trim()) ||
        filter !== "ALL";

    return (
        <Layout>
            <main className="mx-auto max-w-[1800px] space-y-8">
                <section className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-gray-900 to-slate-950 p-6 shadow-2xl sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10">
                                <FaHistory className="text-2xl text-cyan-400" />
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
                                    Security Records
                                </p>

                                <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                                    Scan History
                                </h1>

                                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base">
                                    Search, review and manage URL analysis
                                    records stored by SentinelScan.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-center">
                                <p className="text-xs uppercase tracking-wider text-gray-500">
                                    Stored scans
                                </p>

                                <p className="mt-1 text-2xl font-bold text-cyan-400">
                                    {scans.length}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <FaSyncAlt
                                    className={
                                        refreshing
                                            ? "animate-spin"
                                            : ""
                                    }
                                />

                                {refreshing
                                    ? "Refreshing..."
                                    : "Refresh"}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-5 shadow-xl">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
                        <SearchBar
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                        <FilterBar
                            filter={filter}
                            setFilter={setFilter}
                        />

                        <select
                            value={sortOrder}
                            onChange={(event) =>
                                setSortOrder(
                                    event.target.value
                                )
                            }
                            aria-label="Sort scan history"
                            className="rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-200 outline-none transition focus:border-cyan-500"
                        >
                            <option value="NEWEST">
                                Newest first
                            </option>

                            <option value="OLDEST">
                                Oldest first
                            </option>

                            <option value="RISK_HIGH">
                                Highest risk
                            </option>

                            <option value="RISK_LOW">
                                Lowest risk
                            </option>
                        </select>
                    </div>
                </section>

                {loading && scans.length === 0 ? (
                    <HistoryLoading />
                ) : error && scans.length === 0 ? (
                    <HistoryError
                        message={error}
                        refreshing={refreshing}
                        onRetry={handleRefresh}
                    />
                ) : filteredScans.length === 0 ? (
                    <EmptyHistory
                        filtered={
                            hasActiveFilters
                        }
                    />
                ) : (
                    <section className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl">
                        <HistoryTable
                            scans={paginatedScans}
                            onView={
                                setSelectedScan
                            }
                            onDelete={
                                openDeleteModal
                            }
                        />

                        <Pagination
                            currentPage={
                                currentPage
                            }
                            totalPages={
                                totalPages
                            }
                            pageSize={pageSize}
                            totalItems={
                                filteredScans.length
                            }
                            startItem={
                                startItem
                            }
                            endItem={endItem}
                            onPageChange={(page) =>
                                setCurrentPage(
                                    Math.min(
                                        totalPages,
                                        Math.max(
                                            1,
                                            page
                                        )
                                    )
                                )
                            }
                            onPageSizeChange={
                                setPageSize
                            }
                        />
                    </section>
                )}

                {error && scans.length > 0 && (
                    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-200">
                        The latest history refresh failed. Existing stored data
                        remains visible.
                    </div>
                )}

                {selectedScan && (
                    <ScanDetailsModal
                        scan={selectedScan}
                        onClose={() =>
                            setSelectedScan(
                                null
                            )
                        }
                    />
                )}

                <DeleteModal
                    open={deleteOpen}
                    url={selectedDelete?.url}
                    deleting={deleting}
                    onClose={
                        closeDeleteModal
                    }
                    onDelete={
                        handleDelete
                    }
                />
            </main>
        </Layout>
    );
}

export default History;