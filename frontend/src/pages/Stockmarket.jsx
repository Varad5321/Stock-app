import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend
} from "chart.js";

import { Line } from "react-chartjs-2";
import CandlestickChart from "../components/CandlestickChart";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend
);

function Stockmarket() {
  const [symbol, setSymbol] = useState("AAPL");
  const [prices, setPrices] = useState([]);
  const [labels, setLabels] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState("line"); // "line" or "candlestick"

  const baseTimeRef = useRef(null);
  const buildCandles = (prices) => {
    const candles = [];
    const chunkSize = 2;



    if (!baseTimeRef.current) {
      baseTimeRef.current = Math.floor(Date.now() / 1000);
    }

    let baseTime = baseTimeRef.current;

    for (let i = 0; i < prices.length; i += chunkSize) {
      const chunk = prices.slice(i, i + chunkSize);
      if (chunk.length < chunkSize) break;

      candles.push({
        time: Math.floor(Date.now() / 1000) - (prices.length - i) * 60,
        open: chunk[0],
        high: Math.max(...chunk),
        low: Math.min(...chunk),
        close: chunk[chunk.length - 1],
      });

    }

    return candles;

  };

  const formatIST = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    });
  };



  const candleData = buildCandles(prices);
  const ws = useRef(null);

  // 🔌 WebSocket connect once
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:5000");
    ws.current = socket;

    socket.onopen = () => {
      console.log("WS Connected");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === "price") {
        const price = parseFloat(data.price);
        setPrices((prev) => [...prev.slice(-200), price]);
        setLabels((prev) => [...prev.slice(-30), new Date().toLocaleTimeString()]);
        setCurrentPrice(price);
      }
    };




    socket.onerror = (err) => {
      console.error("WS ERROR:", err);
    };

    socket.onclose = () => {
      console.log("WS Closed");
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  useEffect(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ symbol }));
    }
  }, [symbol]);

  const fetchInitialData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`https://stock-app-r4pp.onrender.com/api/stock?symbol=${symbol}`);
      const data = await res.json();

      if (data.values) {
        const values = data.values.slice(0, 20).reverse();
        setPrices(values.map((v) => parseFloat(v.close)));
        setLabels(values.map((v) => v.datetime));
        setCurrentPrice(parseFloat(values[values.length - 1].close));
      } else {
        setError("No data available for this symbol");
      }
    } catch (err) {
      setError("Failed to fetch stock data");
      console.error(err);
    }
  }, [symbol]);

  const last = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  const color = last > prev ? "green" : "red";

  const chartData = {
    labels,
    datasets: [
      {
        label: symbol,
        data: prices,
        borderColor: color,
        backgroundColor: last > prev ? "rgba(0, 200, 0, 0.1)" : "rgba(200, 0, 0, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Arial, sans-serif",
        height: "100vh",
        display: "grid",
        gridTemplateRows: "auto auto auto 1fr",
        backgroundColor: "#f5f5f5",
        gap: 15,
        overflow: "hidden",
      }}
    >
      <h2 style={{ margin: 0, color: "#333" }}>📈 Live Stock Tracker</h2>

      <div
        style={{
          padding: 15,
          backgroundColor: "white",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 15,
        }}
      >
        <label htmlFor="symbol-select" style={{ margin: 0, fontWeight: 500, color: "#555" }}>
          Select Stock :
        </label>
        <select
          id="symbol-select"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 5,
            border: "2px solid #ddd",
            cursor: "pointer",
            fontSize: "1em",
            transition: "all 0.2s",
            backgroundColor: "white",
          }}
        // onMouseEnter={(e) => (e.target.style.borderColor = "#4CAF50")}
        // onMouseLeave={(e) => (e.target.style.borderColor = "#ddd")}
        // onFocus={(e) => (e.target.style.borderColor = "#4CAF50")}
        // onBlur={(e) => (e.target.style.borderColor = "#ddd")}
        >
          <option value="AAPL">Apple</option>
          <option value="GOOGL">Google</option>
          <option value="MSFT">Microsoft</option>
          <option value="TSLA">Tesla</option>
          <option value="AMZN">Amazon</option>
          <option value="BTC/USD">Bitcoin</option>
        </select>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button
            onClick={() => setChartType("line")}
            style={{
              padding: "8px 16px",
              borderRadius: 5,
              border: chartType === "line" ? "2px solid #4CAF50" : "2px solid #ddd",
              backgroundColor: chartType === "line" ? "#e8f5e9" : "white",
              cursor: "pointer",
              fontSize: "0.9em",
              fontWeight: 500,
              color: chartType === "line" ? "#4CAF50" : "#555",
              transition: "all 0.2s",
            }}
          >
            Line
          </button>
          <button
            onClick={() => setChartType("candlestick")}
            style={{
              padding: "8px 16px",
              borderRadius: 5,
              border: chartType === "candlestick" ? "2px solid #4CAF50" : "2px solid #ddd",
              backgroundColor: chartType === "candlestick" ? "#e8f5e9" : "white",
              cursor: "pointer",
              fontSize: "0.9em",
              fontWeight: 500,
              color: chartType === "candlestick" ? "#4CAF50" : "#555",
              transition: "all 0.2s",
            }}
          >
            Candlestick
          </button>
        </div>
      </div>

      {currentPrice && (
        <div
          style={{
            padding: 15,
            backgroundColor: "white",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            borderLeft: `5px solid ${color}`,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <h3 style={{ margin: 0, color, fontSize: "1.8em" }}>
            ${currentPrice?.toFixed(2)}
          </h3>
          <span
            style={{
              color: "green",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            ● LIVE
          </span>
          <span>
            IST :  {formatIST(candleData[candleData.length - 1]?.time)}
          </span>
        </div>
      )}

      {error && (
        <div
          style={{
            color: "#d32f2f",
            padding: 15,
            backgroundColor: "#ffebee",
            borderRadius: 8,
            borderLeft: "5px solid #d32f2f",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          backgroundColor: "white",
          borderRadius: 8,
          padding: 15,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {chartType === "line" ? (
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  labels: {
                    padding: 15,
                  },
                },
              },
              scales: {
                x: {
                  display: true,
                  grid: {
                    color: "rgba(0,0,0,0.05)",
                  },
                },
                y: {
                  display: true,
                  grid: {
                    color: "rgba(0,0,0,0.05)",
                  },
                },
              },
            }}
          />
        ) : (
          <CandlestickChart data={candleData} />

        )}
      </div>
    </div>
  );
}

export default Stockmarket;
