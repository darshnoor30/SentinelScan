import { FaExclamationTriangle } from "react-icons/fa";

function ErrorCard({

    title="Dashboard Error",

    message="Something went wrong.",

    onRetry

}){

    return(

        <div className="flex justify-center items-center h-[70vh]">

            <div className="bg-red-900/20 border border-red-600 rounded-2xl p-10 w-full max-w-lg">

                <div className="flex items-center gap-4 mb-6">

                    <FaExclamationTriangle
                        className="text-red-500 text-4xl"
                    />

                    <h2 className="text-white text-3xl font-bold">

                        {title}

                    </h2>

                </div>

                <p className="text-gray-300">

                    {message}

                </p>

                {onRetry && (

                    <button

                        onClick={onRetry}

                        className="mt-8 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 transition"

                    >

                        Retry

                    </button>

                )}

            </div>

        </div>

    );

}

export default ErrorCard;