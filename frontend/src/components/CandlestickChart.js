import React, { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries
} from "lightweight-charts";

const CandlestickChart = ({ data }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const isUserScrollingRef = useRef(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,

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

    return () => chart.remove();
  }, []); // Empty dependency array - chart created once

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

  return <div ref={chartContainerRef} style={{ width: "100%" }} />;
};

export default CandlestickChart;