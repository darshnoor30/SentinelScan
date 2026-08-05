function LoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                {[1,2,3,4].map((item)=>(
                    <div
                        key={item}
                        className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
                    >

                        <div className="h-5 w-28 bg-gray-800 rounded mb-5"/>

                        <div className="h-10 w-20 bg-gray-700 rounded"/>

                    </div>
                ))}

            </div>

            {/* Charts */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <div className="bg-gray-900 rounded-2xl h-[380px]"/>

                <div className="bg-gray-900 rounded-2xl h-[380px]"/>

            </div>

            {/* Table */}

            <div className="bg-gray-900 rounded-2xl h-[350px]"/>

        </div>
    );
}

export default LoadingSkeleton;