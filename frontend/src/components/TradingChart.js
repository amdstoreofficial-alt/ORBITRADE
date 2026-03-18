import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';

const TradingChart = ({ asset, currentPrice, assetType }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  
  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Create chart with professional styling
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280',
        fontFamily: "'Inter', sans-serif"
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(58, 134, 255, 0.5)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#3a86ff'
        },
        horzLine: {
          color: 'rgba(58, 134, 255, 0.5)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#3a86ff'
        }
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.2 }
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true
      },
      localization: {
        locale: 'en-US',
        dateFormat: 'yyyy-MM-dd'
      },
      handleScroll: { vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: true }
    });
    
    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#2af5ff',
      downColor: '#9d4edd',
      borderUpColor: '#2af5ff',
      borderDownColor: '#9d4edd',
      wickUpColor: 'rgba(42, 245, 255, 0.6)',
      wickDownColor: 'rgba(157, 78, 221, 0.6)'
    });
    
    // Volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#3a86ff',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: { top: 0.85, bottom: 0 }
    });
    
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    
    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);
  
  // Generate and update chart data
  useEffect(() => {
    if (!currentPrice || currentPrice === 0 || !candleSeriesRef.current) return;
    
    // Generate initial historical data
    const generateInitialData = () => {
      const data = [];
      const volumeData = [];
      let price = currentPrice;
      const now = Math.floor(Date.now() / 1000);
      const candleInterval = 60; // 1 minute candles
      const volatility = assetType === 'crypto' ? 0.003 : assetType === 'metals' ? 0.001 : 0.0003;
      
      // Generate 100 historical candles
      for (let i = 100; i >= 0; i--) {
        const time = now - i * candleInterval;
        const change = (Math.random() - 0.5) * 2 * volatility * price;
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
        const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
        const volume = Math.random() * 1000000 + 100000;
        
        data.push({
          time,
          open: parseFloat(open.toFixed(assetType === 'forex' ? 5 : 2)),
          high: parseFloat(high.toFixed(assetType === 'forex' ? 5 : 2)),
          low: parseFloat(low.toFixed(assetType === 'forex' ? 5 : 2)),
          close: parseFloat(close.toFixed(assetType === 'forex' ? 5 : 2))
        });
        
        volumeData.push({
          time,
          value: volume,
          color: close >= open ? 'rgba(42, 245, 255, 0.3)' : 'rgba(157, 78, 221, 0.3)'
        });
        
        price = close;
      }
      
      return { candles: data, volumes: volumeData };
    };
    
    const { candles, volumes } = generateInitialData();
    setChartData(candles);
    
    candleSeriesRef.current.setData(candles);
    volumeSeriesRef.current.setData(volumes);
    
    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [asset, currentPrice, assetType]);
  
  // Update last candle in real-time
  useEffect(() => {
    if (!currentPrice || currentPrice === 0 || !candleSeriesRef.current || chartData.length === 0) return;
    
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const lastCandle = chartData[chartData.length - 1];
      
      if (!lastCandle) return;
      
      // Small random fluctuation around current price
      const volatility = assetType === 'crypto' ? 0.001 : assetType === 'metals' ? 0.0005 : 0.0001;
      const fluctuation = (Math.random() - 0.5) * 2 * volatility * currentPrice;
      const newClose = currentPrice + fluctuation;
      
      const updatedCandle = {
        time: lastCandle.time,
        open: lastCandle.open,
        high: Math.max(lastCandle.high, newClose),
        low: Math.min(lastCandle.low, newClose),
        close: parseFloat(newClose.toFixed(assetType === 'forex' ? 5 : 2))
      };
      
      candleSeriesRef.current.update(updatedCandle);
      
      // Update volume
      const volumeColor = updatedCandle.close >= updatedCandle.open 
        ? 'rgba(42, 245, 255, 0.3)' 
        : 'rgba(157, 78, 221, 0.3)';
      volumeSeriesRef.current.update({
        time: lastCandle.time,
        value: Math.random() * 500000 + 100000,
        color: volumeColor
      });
      
      // Every minute, create a new candle
      if (now - lastCandle.time >= 60) {
        const newCandle = {
          time: now,
          open: updatedCandle.close,
          high: updatedCandle.close,
          low: updatedCandle.close,
          close: updatedCandle.close
        };
        
        setChartData(prev => [...prev.slice(-99), newCandle]);
        candleSeriesRef.current.update(newCandle);
        volumeSeriesRef.current.update({
          time: now,
          value: Math.random() * 100000,
          color: 'rgba(42, 245, 255, 0.2)'
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentPrice, assetType, chartData]);
  
  return (
    <div className="w-full h-full relative bg-space-dark/30">
      <div ref={chartContainerRef} className="w-full h-full" />
      
      {/* Chart Toolbar */}
      <div className="absolute top-3 left-3 flex gap-2 z-10">
        {['1m', '5m', '15m', '1H', '4H', '1D'].map((tf, i) => (
          <button 
            key={tf}
            className={`px-2 py-1 text-xs rounded ${
              i === 0 
                ? 'bg-electric/20 text-electric border border-electric/30' 
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            } transition-colors`}
          >
            {tf}
          </button>
        ))}
      </div>
      
      {/* Indicators */}
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          Indicators
        </button>
        <button className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          Draw
        </button>
      </div>
      
      {/* No Asset Selected */}
      {!asset && (
        <div className="absolute inset-0 flex items-center justify-center bg-space/80 backdrop-blur-sm">
          <p className="text-gray-500">Select an asset to view chart</p>
        </div>
      )}
    </div>
  );
};

export default TradingChart;
