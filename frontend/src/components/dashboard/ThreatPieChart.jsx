import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from "recharts";

const data = [
    {
        name: "Safe",
        value: 72
    },
    {
        name: "Suspicious",
        value: 18
    },
    {
        name: "Phishing",
        value: 10
    }
];

const COLORS = [
    "#10B981",
    "#FACC15",
    "#EF4444"
];

function ThreatPieChart() {

    return (

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">

            <h2 className="text-xl font-semibold text-white mb-6">

                Threat Distribution

            </h2>

            <div className="h-80">

                <ResponsiveContainer width="100%" height="100%">

                    <PieChart>

                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={105}
                            paddingAngle={4}
                        >

                            {
                                data.map((entry, index) => (

                                    <Cell
                                        key={index}
                                        fill={COLORS[index]}
                                    />

                                ))
                            }

                        </Pie>

                        <Tooltip
                            contentStyle={{
                                background: "#111827",
                                border: "1px solid #374151",
                                borderRadius: "10px",
                                color: "#ffffff"
                            }}
                        />

                        <Legend />

                    </PieChart>

                </ResponsiveContainer>

            </div>

        </div>

    );

}

export default ThreatPieChart;