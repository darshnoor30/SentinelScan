import {
    memo,
    useCallback,
    useEffect,
    useState
} from "react";

import {
    FaBars,
    FaShieldAlt
} from "react-icons/fa";

import Sidebar from "./Sidebar";

function Layout({ children }) {
    const [mobileSidebarOpen, setMobileSidebarOpen] =
        useState(false);

    const openSidebar = useCallback(() => {
        setMobileSidebarOpen(true);
    }, []);

    const closeSidebar = useCallback(() => {
        setMobileSidebarOpen(false);
    }, []);

    useEffect(() => {
        if (!mobileSidebarOpen) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                closeSidebar();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

            document.body.style.overflow = "";
        };
    }, [mobileSidebarOpen, closeSidebar]);

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="flex min-h-screen">
                <Sidebar />

                <Sidebar
                    mobile
                    open={mobileSidebarOpen}
                    onClose={closeSidebar}
                />

                <div className="min-w-0 flex-1">
                    <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/90 backdrop-blur lg:hidden">
                        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                            <button
                                type="button"
                                onClick={openSidebar}
                                aria-label="Open navigation"
                                aria-expanded={
                                    mobileSidebarOpen
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-gray-300 transition hover:border-cyan-500 hover:text-cyan-400"
                            >
                                <FaBars />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                                    <FaShieldAlt className="text-cyan-400" />
                                </div>

                                <div>
                                    <p className="font-bold text-cyan-400">
                                        SentinelScan
                                    </p>

                                    <p className="text-[10px] uppercase tracking-wider text-gray-500">
                                        Security Operations
                                    </p>
                                </div>
                            </div>

                            <div
                                aria-hidden="true"
                                className="h-10 w-10"
                            />
                        </div>
                    </header>

                    <main className="min-w-0 overflow-x-hidden bg-gray-950">
                        <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default memo(Layout);
