import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries
} from "lightweight-charts";

const CandlestickChart = ({ data }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const [chartHeight, setChartHeight] = useState(400);
  const [tooltip, setTooltip] = useState(null);
  const pressTimerRef = useRef(null);
  const tooltipRef = useRef(null);

  // Handle responsive height
  useEffect(() => {
    const updateHeight = () => {
      if (chartContainerRef.current) {
        const parentHeight = chartContainerRef.current.parentElement?.clientHeight || 400;
        setChartHeight(Math.max(300, parentHeight - 60));
      }
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    if (chartContainerRef.current?.parentElement) {
      resizeObserver.observe(chartContainerRef.current.parentElement);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,

      layout: {
        background: { color: "#ffffff" },
        textColor: "#000",
      },

      grid: {
        vertLines: { color: "#eee" },
        horzLines: { color: "#eee" },
      },

      timeScale: {
        timeVisible: true,
        secondsVisible: false,

        tickMarkFormatter: (time) => {
          return new Date(time * 1000).toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
          });
        },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries);

    // store references
    chartRef.current = chart;
    seriesRef.current = candleSeries;

    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      isUserScrollingRef.current = true;
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartHeight]);

  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    seriesRef.current.setData(data);
    if (!isUserScrollingRef.current) {
      chartRef.current.timeScale().setVisibleLogicalRange({
        from: data.length - 50,
        to: data.length,
      });
    }
  }, [data]);

  // Handle mouse events for tooltip
  useEffect(() => {
    if (!chartContainerRef.current || !chartRef.current) return;

    const containerElement = chartContainerRef.current;

    const handleMouseDown = (e) => {
      pressTimerRef.current = setTimeout(() => {
        const rect = containerElement.getBoundingClientRect();
        const x = e.clientX - rect.left;

        const logicalIndex = chartRef.current.timeScale().coordinateToLogical(x);

        if (logicalIndex !== null && logicalIndex >= 0 && logicalIndex < data.length) {
          const candleIndex = Math.round(logicalIndex);
          if (candleIndex >= 0 && candleIndex < data.length) {
            const candle = data[candleIndex];
            setTooltip({
              x: e.clientX,
              y: e.clientY,
              data: candle,
            });
            tooltipRef.current = true;
          }
        }
      }, 300);
    };

    const handleMouseUp = () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
      setTooltip(null);
      tooltipRef.current = null;
    };

    const handleMouseMove = (e) => {
      if (tooltipRef.current) {
        setTooltip((prev) =>
          prev
            ? {
              ...prev,
              x: e.clientX,
              y: e.clientY,
            }
            : null
        );
      }
    };

    const handleMouseLeave = () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
      setTooltip(null);
      tooltipRef.current = null;
    };

    containerElement.addEventListener("mousedown", handleMouseDown);
    containerElement.addEventListener("mouseup", handleMouseUp);
    containerElement.addEventListener("mousemove", handleMouseMove);
    containerElement.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      containerElement.removeEventListener("mousedown", handleMouseDown);
      containerElement.removeEventListener("mouseup", handleMouseUp);
      containerElement.removeEventListener("mousemove", handleMouseMove);
      containerElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [data]);

  return (
    <>
      <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`,
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px 15px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
            fontSize: "12px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          <div style={{ marginBottom: "4px", fontWeight: "600" }}>
            {new Date(tooltip.data.time * 1000).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}
          </div>
          <div style={{ color: "#666" }}>
            Open: <span style={{ color: "#000", fontWeight: "600" }}>{tooltip.data.open.toFixed(2)}</span>
          </div>
          <div style={{ color: "#666" }}>
            High: <span style={{ color: "#000", fontWeight: "600" }}>{tooltip.data.high.toFixed(2)}</span>
          </div>
          <div style={{ color: "#666" }}>
            Low: <span style={{ color: "#000", fontWeight: "600" }}>{tooltip.data.low.toFixed(2)}</span>
          </div>
          <div style={{ color: "#666" }}>
            Close: <span style={{ color: "#000", fontWeight: "600" }}>{tooltip.data.close.toFixed(2)}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default CandlestickChart;