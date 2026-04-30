import { useEffect, useRef, useState, useCallback } from "react";
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
    const socket = new WebSocket("wss://stock-app-r4pp.onrender.com");
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
        padding: "clamp(10px, 5vw, 20px)",
        fontFamily: "Arial, sans-serif",
        minHeight: "100vh",
        display: "grid",
        gridTemplateRows: "auto auto auto 1fr",
        backgroundColor: "#f5f5f5",
        gap: "clamp(10px, 3vw, 15px)",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      <h2 style={{ margin: 0, color: "#333", fontSize: "clamp(1.5rem, 5vw, 2rem)" }}>📈 Live Stock Tracker</h2>

      <div
        style={{
          padding: "clamp(12px, 3vw, 15px)",
          backgroundColor: "white",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "clamp(10px, 2vw, 15px)",
        }}
      >
        <label htmlFor="symbol-select" style={{ margin: 0, fontWeight: 500, color: "#555", fontSize: "clamp(0.85rem, 2vw, 1rem)" }}>
          Select Stock :
        </label>
        <select
          id="symbol-select"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          style={{
            padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 12px)",
            borderRadius: 5,
            border: "2px solid #ddd",
            cursor: "pointer",
            fontSize: "clamp(0.85rem, 2vw, 1rem)",
            transition: "all 0.2s",
            backgroundColor: "white",
            flex: "1 1 auto",
            minWidth: "120px",
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

        <div style={{ marginLeft: "auto", display: "flex", gap: "clamp(8px, 1.5vw, 10px)", flexWrap: "wrap" }}>
          <button
            onClick={() => setChartType("line")}
            style={{
              padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 2vw, 16px)",
              borderRadius: 5,
              border: chartType === "line" ? "2px solid #4CAF50" : "2px solid #ddd",
              backgroundColor: chartType === "line" ? "#e8f5e9" : "white",
              cursor: "pointer",
              fontSize: "clamp(0.8rem, 1.8vw, 0.9rem)",
              fontWeight: 500,
              color: chartType === "line" ? "#4CAF50" : "#555",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            Line
          </button>
          <button
            onClick={() => setChartType("candlestick")}
            style={{
              padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 2vw, 16px)",
              borderRadius: 5,
              border: chartType === "candlestick" ? "2px solid #4CAF50" : "2px solid #ddd",
              backgroundColor: chartType === "candlestick" ? "#e8f5e9" : "white",
              cursor: "pointer",
              fontSize: "clamp(0.8rem, 1.8vw, 0.9rem)",
              fontWeight: 500,
              color: chartType === "candlestick" ? "#4CAF50" : "#555",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            Candlestick
          </button>
        </div>
      </div>

      {currentPrice && (
        <div
          style={{
            padding: "clamp(12px, 3vw, 15px)",
            backgroundColor: "white",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            borderLeft: `5px solid ${color}`,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "clamp(15px, 3vw, 20px)",
          }}
        >
          <h3 style={{ margin: 0, color, fontSize: "clamp(1.3rem, 5vw, 1.8rem)" }}>
            ${currentPrice?.toFixed(2)}
          </h3>
          <span
            style={{
              color: "green",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: "clamp(0.8rem, 2vw, 1rem)",
            }}
          >
            ● LIVE
          </span>
          <span style={{ fontSize: "clamp(0.8rem, 2vw, 0.95rem)" }}>
            IST :  {formatIST(candleData[candleData.length - 1]?.time)}
          </span>
        </div>
      )}

      {error && (
        <div
          style={{
            color: "#d32f2f",
            padding: "clamp(12px, 3vw, 15px)",
            backgroundColor: "#ffebee",
            borderRadius: 8,
            borderLeft: "5px solid #d32f2f",
            fontSize: "clamp(0.85rem, 2vw, 1rem)",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          backgroundColor: "white",
          borderRadius: 8,
          padding: "clamp(12px, 3vw, 15px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden",
          minHeight: "300px",
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
