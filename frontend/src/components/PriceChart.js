import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

// Register the necessary Chart.js components.
Chart.register(...registerables);

export function PriceChart({ provider, jfpContractAddress }) {
  const [historicData, setHistoricData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistoricData() {
      // For demonstration, generate dummy history for the past 7 days at an hourly interval.
      // In a production dApp, you can use your provider and contract to query historical events and derive the price.
      const now = Math.floor(Date.now() / 1000);
      const oneHour = 3600;
      const data = [];
      // Generate data for (7 days * 24 hours = 168) points.
      for (let i = 168; i >= 0; i--) {
        data.push({
          timestamp: now - i * oneHour,
          price: 0.000001 // constant price of 10^-6 ETH
        });
      }
      return data;
    }

    fetchHistoricData()
      .then((data) => {
        setHistoricData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching price data:", err);
        setLoading(false);
      });
  }, [provider, jfpContractAddress]);

  if (loading) {
    return <div>Loading Price Chart...</div>;
  }

  // Prepare the chart data.
  const chartData = {
    labels: historicData.map((point) =>
      new Date(point.timestamp * 1000).toLocaleString()
    ),
    datasets: [
      {
        label: "JFP Token Price (ETH)",
        data: historicData.map((point) => point.price),
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.1
      }
    ]
  };

  return (
    <div className="container p-4">
      <h3>JFP Token Price Chart</h3>
      <Line data={chartData} />
    </div>
  );
}