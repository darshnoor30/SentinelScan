import {
    memo,
    useEffect
} from "react";

import {
    NavLink,
    useLocation
} from "react-router-dom";

import { AnimatePresence, motion } from "framer-motion";

import {
    FaShieldAlt,
    FaSearch,
    FaHistory,
    FaBug,
    FaBrain,
    FaCog,
    FaTimes
} from "react-icons/fa";

const NAV_ITEMS = [
    {
        to: "/",
        label: "Dashboard",
        icon: FaShieldAlt,
        end: true
    },
    {
        to: "/scanner",
        label: "Scanner",
        icon: FaSearch
    },
    {
        to: "/history",
        label: "History",
        icon: FaHistory
    },
    {
        to: "/threat-intel",
        label: "Threat Intel",
        icon: FaBug
    },
    {
        to: "/explainability",
        label: "Explainability",
        icon: FaBrain
    },
    {
        to: "/settings",
        label: "Settings",
        icon: FaCog
    }
];

function NavigationLinks({ onNavigate }) {
    return (
        <nav className="flex-1 px-4 py-6">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
                Navigation
            </p>

            <div className="space-y-2">
                {NAV_ITEMS.map(
                    ({
                        to,
                        label,
                        icon: Icon,
                        end
                    }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={onNavigate}
                            className={({
                                isActive
                            }) =>
                                `
                                    group
                                    flex
                                    items-center
                                    gap-3
                                    rounded-xl
                                    border
                                    px-4
                                    py-3
                                    text-sm
                                    font-medium
                                    transition-all
                                    duration-200
                                    ${
                                        isActive
                                            ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5"
                                            : "border-transparent text-gray-400 hover:border-gray-800 hover:bg-gray-800/70 hover:text-white"
                                    }
                                `
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className={`
                                            flex
                                            h-9
                                            w-9
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-lg
                                            transition
                                            ${
                                                isActive
                                                    ? "bg-cyan-500/15 text-cyan-400"
                                                    : "bg-gray-800 text-gray-500 group-hover:text-cyan-400"
                                            }
                                        `}
                                    >
                                        <Icon />
                                    </span>

                                    <span className="truncate">
                                        {label}
                                    </span>

                                    {isActive && (
                                        <span
                                            aria-hidden="true"
                                            className="ml-auto h-2 w-2 rounded-full bg-cyan-400"
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    )
                )}
            </div>
        </nav>
    );
}

function SidebarContent({
    mobile = false,
    onClose
}) {
    return (
        <>
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                        <FaShieldAlt className="text-xl text-cyan-400" />
                    </div>

                    <div>
                        <h1 className="text-xl font-bold text-cyan-400">
                            SentinelScan
                        </h1>

                        <p className="mt-1 text-xs text-gray-500">
                            Security Operations Center
                        </p>
                    </div>
                </div>

                {mobile && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-gray-400 transition hover:border-red-500 hover:text-red-400"
                    >
                        <FaTimes />
                    </button>
                )}
            </div>

            <NavigationLinks
                onNavigate={
                    mobile ? onClose : undefined
                }
            />

            <div className="border-t border-gray-800 p-4">
                <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
                    <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />

                        <span className="text-xs font-semibold text-green-400">
                            Interface Active
                        </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-gray-500">
                        Dashboard data is provided by the
                        SentinelScan API.
                    </p>
                </div>

                <p className="mt-4 text-center text-xs text-gray-700">
                    SentinelScan v1.0.0
                </p>
            </div>
        </>
    );
}

function Sidebar({
    mobile = false,
    open = false,
    onClose = () => {}
}) {
    const location = useLocation();

    useEffect(() => {
        if (mobile && open) {
            onClose();
        }
        // Close the mobile drawer whenever the route changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    if (!mobile) {
        return (
            <aside
                aria-label="Primary navigation"
                className="
                    sticky
                    top-0
                    hidden
                    h-screen
                    w-64
                    shrink-0
                    overflow-y-auto
                    border-r
                    border-gray-800
                    bg-gradient-to-b
                    from-gray-900
                    to-gray-950
                    text-white
                    lg:flex
                    lg:flex-col
                "
            >
                <SidebarContent />
            </aside>
        );
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label="Close navigation overlay"
                        initial={{
                            opacity: 0
                        }}
                        animate={{
                            opacity: 1
                        }}
                        exit={{
                            opacity: 0
                        }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                    />

                    <motion.aside
                        aria-label="Mobile navigation"
                        initial={{
                            x: "-100%"
                        }}
                        animate={{
                            x: 0
                        }}
                        exit={{
                            x: "-100%"
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 32
                        }}
                        className="
                            fixed
                            inset-y-0
                            left-0
                            z-50
                            flex
                            w-[85vw]
                            max-w-72
                            flex-col
                            overflow-y-auto
                            border-r
                            border-gray-800
                            bg-gradient-to-b
                            from-gray-900
                            to-gray-950
                            text-white
                            shadow-2xl
                            lg:hidden
                        "
                    >
                        <SidebarContent
                            mobile
                            onClose={onClose}
                        />
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

export default memo(Sidebar);
