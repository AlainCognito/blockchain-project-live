import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export function PriceChart({ fetchHistoricData }) {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        async function loadData() {
            try {
                // fetchHistoricData should return an array of objects like:
                // [{ timestamp: 1680307200, price: 1000 }, ... ]
                const data = await fetchHistoricData();
                const labels = data.map((point) =>
                    new Date(point.timestamp * 1000).toLocaleString()
                );
                const prices = data.map((point) => point.price);

                setChartData({
                    labels,
                    datasets: [
                        {
                            label: "Valuation History",
                            data: prices,
                            fill: false,
                            borderColor: "rgba(75,192,192,1)",
                            tension: 0.1,
                        },
                    ],
                });
            } catch (err) {
                console.error("Error fetching historical data:", err);
            }
        }

        loadData();
    }, [fetchHistoricData]);

    if (!chartData) {
        return <div>Loading chart...</div>;
    }

    return (
        <div className="my-4">
            <h3>Valuation History</h3>
            <Line data={chartData} />
        </div>
    );
}