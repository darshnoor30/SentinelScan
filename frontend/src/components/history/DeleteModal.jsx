import {
    memo,
    useEffect,
    useRef
} from "react";

import {
    FaTrash,
    FaTimes,
    FaExclamationTriangle,
    FaSpinner
} from "react-icons/fa";

function DeleteModal({
    open = false,
    onClose,
    onDelete,
    url = "",
    deleting = false
}) {
    const cancelButtonRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        const handleKeyDown = (event) => {
            if (
                event.key === "Escape" &&
                !deleting
            ) {
                onClose?.();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        window.setTimeout(() => {
            cancelButtonRef.current?.focus();
        }, 0);

        return () => {
            document.body.style.overflow =
                previousOverflow;

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [
        deleting,
        onClose,
        open
    ]);

    if (!open) {
        return null;
    }

    const handleBackdropClick = (event) => {
        if (
            event.target ===
                event.currentTarget &&
            !deleting
        ) {
            onClose?.();
        }
    };

    const handleDelete = () => {
        if (
            deleting ||
            typeof onDelete !== "function"
        ) {
            return;
        }

        onDelete();
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
            onMouseDown={handleBackdropClick}
            className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                bg-black/75
                p-4
                backdrop-blur-sm
                sm:p-6
            "
        >
            <div
                className="
                    w-full
                    max-w-lg
                    overflow-hidden
                    rounded-2xl
                    border
                    border-red-500/30
                    bg-gradient-to-br
                    from-gray-900
                    to-gray-950
                    shadow-2xl
                "
            >
                <div className="border-b border-gray-800 px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                                <FaExclamationTriangle className="text-2xl text-red-400" />
                            </div>

                            <div>
                                <h2
                                    id="delete-modal-title"
                                    className="text-xl font-bold text-white"
                                >
                                    Delete Scan
                                </h2>

                                <p className="mt-1 text-sm text-gray-400">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={deleting}
                            aria-label="Close delete confirmation"
                            className="
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                border
                                border-gray-700
                                bg-gray-800
                                text-gray-400
                                transition
                                hover:border-gray-600
                                hover:text-white
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <p
                        id="delete-modal-description"
                        className="text-sm leading-6 text-gray-300"
                    >
                        Are you sure you want to permanently
                        delete this scan record from the
                        SentinelScan database?
                    </p>

                    <div className="mt-5 rounded-xl border border-gray-800 bg-gray-950/60 p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-500">
                            URL
                        </p>

                        <p
                            title={url}
                            className="mt-2 break-all text-sm font-semibold text-cyan-400"
                        >
                            {url || "Unknown URL"}
                        </p>
                    </div>

                    <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                        <div className="flex items-start gap-3">
                            <FaTrash className="mt-1 shrink-0 text-red-400" />

                            <p className="text-sm leading-6 text-red-200">
                                Deleting this record removes its
                                history, prediction, reasons and
                                stored threat-intelligence data.
                            </p>
                        </div>
                    </div>

                    <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                            ref={cancelButtonRef}
                            type="button"
                            onClick={onClose}
                            disabled={deleting}
                            className="
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                border
                                border-gray-700
                                bg-gray-800
                                px-5
                                py-3
                                font-semibold
                                text-gray-300
                                transition
                                hover:border-gray-600
                                hover:bg-gray-700
                                hover:text-white
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            <FaTimes />
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-red-600
                                px-5
                                py-3
                                font-semibold
                                text-white
                                transition
                                hover:bg-red-500
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                            "
                        >
                            {deleting ? (
                                <>
                                    <FaSpinner className="animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <FaTrash />
                                    Delete Scan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(DeleteModal);
