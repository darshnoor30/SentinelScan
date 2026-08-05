import { useMemo } from "react";
import {
    FaBug,
    FaGlobe,
    FaShieldAlt,
    FaServer,
    FaExclamationTriangle,
    FaFire
} from "react-icons/fa";

import Layout from "../components/layout/Layout";

const threats = [
    {
        id: 1,
        ip: "185.220.101.4",
        country: "Russia",
        threat: "Known Phishing Server",
        severity: "HIGH",
        confidence: 96,
        source: "VirusTotal"
    },
    {
        id: 2,
        ip: "103.45.76.22",
        country: "China",
        threat: "Botnet Command & Control",
        severity: "CRITICAL",
        confidence: 99,
        source: "AbuseIPDB"
    },
    {
        id: 3,
        ip: "91.214.124.9",
        country: "Germany",
        threat: "Spam Campaign",
        severity: "MEDIUM",
        confidence: 81,
        source: "OpenPhish"
    },
    {
        id: 4,
        ip: "45.61.188.44",
        country: "United States",
        threat: "Credential Harvesting",
        severity: "HIGH",
        confidence: 93,
        source: "Google Safe Browsing"
    }
];

function severityColor(level) {
    switch (level) {
        case "CRITICAL":
            return "text-red-500 bg-red-500/10";
        case "HIGH":
            return "text-orange-400 bg-orange-500/10";
        case "MEDIUM":
            return "text-yellow-400 bg-yellow-500/10";
        default:
            return "text-green-400 bg-green-500/10";
    }
}

export default function ThreatIntel() {

    const stats = useMemo(() => ({
        total: threats.length,
        critical: threats.filter(t=>t.severity==="CRITICAL").length,
        high: threats.filter(t=>t.severity==="HIGH").length,
        avg: Math.round(
            threats.reduce((a,b)=>a+b.confidence,0)/threats.length
        )
    }),[]);

    return (

        <Layout>

            <div className="space-y-8">

                <div>

                    <h1 className="text-4xl font-bold text-white">
                        Threat Intelligence Center
                    </h1>

                    <p className="text-gray-400 mt-2">
                        Live IOC intelligence collected from multiple security
                        providers.
                    </p>

                </div>

                {/* Stats */}

                <div className="grid md:grid-cols-4 gap-6">

                    <Stat
                        icon={<FaBug/>}
                        title="Threats"
                        value={stats.total}
                    />

                    <Stat
                        icon={<FaFire/>}
                        title="Critical"
                        value={stats.critical}
                    />

                    <Stat
                        icon={<FaExclamationTriangle/>}
                        title="High"
                        value={stats.high}
                    />

                    <Stat
                        icon={<FaShieldAlt/>}
                        title="Avg Confidence"
                        value={`${stats.avg}%`}
                    />

                </div>

                {/* Threat Table */}

                <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">

                    <table className="w-full">

                        <thead className="bg-gray-950">

                            <tr className="text-gray-400">

                                <th className="p-4 text-left">
                                    IP Address
                                </th>

                                <th className="text-left">
                                    Country
                                </th>

                                <th className="text-left">
                                    Threat
                                </th>

                                <th className="text-left">
                                    Source
                                </th>

                                <th className="text-center">
                                    Confidence
                                </th>

                                <th className="text-center">
                                    Severity
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {threats.map((item)=>(

                                <tr
                                    key={item.id}
                                    className="border-t border-gray-800 hover:bg-gray-800 transition"
                                >

                                    <td className="p-4 font-mono text-cyan-400">
                                        {item.ip}
                                    </td>

                                    <td>

                                        <div className="flex items-center gap-2">

                                            <FaGlobe/>

                                            {item.country}

                                        </div>

                                    </td>

                                    <td className="text-white">
                                        {item.threat}
                                    </td>

                                    <td>

                                        <div className="flex items-center gap-2 text-gray-300">

                                            <FaServer/>

                                            {item.source}

                                        </div>

                                    </td>

                                    <td className="text-center">

                                        <span className="text-green-400 font-bold">

                                            {item.confidence}%

                                        </span>

                                    </td>

                                    <td className="text-center">

                                        <span
                                            className={`px-3 py-1 rounded-full font-semibold ${severityColor(item.severity)}`}
                                        >

                                            {item.severity}

                                        </span>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </Layout>

    );

}

function Stat({
    icon,
    title,
    value
}){

    return(

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">

            <div className="flex justify-between">

                <div>

                    <p className="text-gray-400 text-sm">

                        {title}

                    </p>

                    <h2 className="text-3xl font-bold text-white mt-2">

                        {value}

                    </h2>

                </div>

                <div className="text-cyan-400 text-3xl">

                    {icon}

                </div>

            </div>

        </div>

    );

}