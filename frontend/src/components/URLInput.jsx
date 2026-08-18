import {
    memo,
    useCallback,
    useId,
    useState
} from "react";

import {
    FaLink,
    FaSearch,
    FaSpinner,
    FaInfoCircle
} from "react-icons/fa";

function URLInput({
    onScan,
    loading = false
}) {
    const inputId = useId();

    const [url, setUrl] = useState("");
    const [validationError, setValidationError] =
        useState("");

    const handleChange = useCallback(
        (event) => {
            setUrl(event.target.value);

            if (validationError) {
                setValidationError("");
            }
        },
        [validationError]
    );

    const handleSubmit = useCallback(
        (event) => {
            event?.preventDefault();

            if (loading) {
                return;
            }

            const trimmedUrl =
                url.trim();

            if (!trimmedUrl) {
                setValidationError(
                    "Please enter a URL before starting the scan."
                );

                return;
            }

            if (typeof onScan !== "function") {
                setValidationError(
                    "The scanner is currently unavailable."
                );

                return;
            }

            setValidationError("");

            onScan(trimmedUrl);
        },
        [
            loading,
            onScan,
            url
        ]
    );

    const disabled =
        loading ||
        !url.trim();

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-5"
            noValidate
        >
            <div>
                <label
                    htmlFor={inputId}
                    className="mb-2 block text-sm font-semibold text-gray-200"
                >
                    URL to analyse
                </label>

                <div className="relative">
                    <FaLink
                        aria-hidden="true"
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    />

                    <input
                        id={inputId}
                        type="text"
                        inputMode="url"
                        autoComplete="url"
                        spellCheck="false"
                        placeholder="https://example.com"
                        value={url}
                        onChange={handleChange}
                        disabled={loading}
                        aria-invalid={Boolean(
                            validationError
                        )}
                        aria-describedby={
                            validationError
                                ? `${inputId}-error`
                                : `${inputId}-help`
                        }
                        className="
                            w-full
                            rounded-xl
                            border
                            border-gray-700
                            bg-gray-950
                            py-4
                            pl-11
                            pr-4
                            text-white
                            outline-none
                            transition
                            placeholder:text-gray-600
                            focus:border-cyan-500
                            focus:ring-2
                            focus:ring-cyan-500/20
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    />
                </div>

                {validationError ? (
                    <p
                        id={`${inputId}-error`}
                        role="alert"
                        className="mt-2 text-sm text-red-400"
                    >
                        {validationError}
                    </p>
                ) : (
                    <div
                        id={`${inputId}-help`}
                        className="mt-3 flex items-start gap-2 text-sm text-gray-500"
                    >
                        <FaInfoCircle className="mt-0.5 shrink-0 text-cyan-500" />

                        <p>
                            You may enter a full URL such as{" "}
                            <span className="text-gray-300">
                                https://example.com/login
                            </span>{" "}
                            or a domain such as{" "}
                            <span className="text-gray-300">
                                example.com
                            </span>
                            .
                        </p>
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={disabled}
                className="
                    inline-flex
                    w-full
                    items-center
                    justify-center
                    gap-3
                    rounded-xl
                    bg-cyan-600
                    px-5
                    py-4
                    font-semibold
                    text-white
                    transition
                    hover:bg-cyan-500
                    focus:outline-none
                    focus:ring-2
                    focus:ring-cyan-400
                    focus:ring-offset-2
                    focus:ring-offset-gray-950
                    disabled:cursor-not-allowed
                    disabled:bg-gray-700
                    disabled:text-gray-400
                "
            >
                {loading ? (
                    <>
                        <FaSpinner className="animate-spin" />
                        Scanning URL...
                    </>
                ) : (
                    <>
                        <FaSearch />
                        Analyse URL
                    </>
                )}
            </button>
        </form>
    );
}

export default memo(URLInput);
