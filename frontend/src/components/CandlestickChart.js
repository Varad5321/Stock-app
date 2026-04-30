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

  return <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />;
};

export default CandlestickChart;