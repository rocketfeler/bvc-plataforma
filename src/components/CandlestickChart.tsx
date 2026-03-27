'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';

interface CandleData {
  fecha: string;
  apertura: number;
  maximo: number;
  minimo: number;
  cierre: number;
  volumen: number;
  tipo?: 'historico' | 'intradia';
}

interface CandlestickChartProps {
  ticker: string;
  data?: CandleData[];
  height?: number;
  showVolume?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * Componente de Velas Japonesas usando Lightweight Charts (TradingView)
 * 
 * Muestra velas verdes cuando el cierre > apertura (subió)
 * Muestra velas rojas cuando el cierre < apertura (bajó)
 */
export default function CandlestickChart({
  ticker,
  data = [],
  height = 400,
  showVolume = true,
  theme = 'light',
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<CandleData[]>([]);

  // Convertir datos del backend a formato de Lightweight Charts
  const convertToChartData = (data: CandleData[]): CandlestickData[] => {
    return data.map((item) => ({
      time: new Date(item.fecha).getTime() / 1000 as Time,
      open: item.apertura,
      high: item.maximo,
      low: item.minimo,
      close: item.cierre,
    }));
  };

  // Cargar datos desde el backend si no se proporcionan
  useEffect(() => {
    const fetchData = async () => {
      if (data.length > 0) {
        setChartData(data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch datos históricos desde 2024
        const response = await fetch(`/api/bvc/candles/historical/${ticker}?desde=2024-01-01`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        setChartData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error cargando datos';
        setError(errorMessage);
        console.error('Error fetching candle data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchData();
    }
  }, [ticker, data]);

  // Inicializar gráfico
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    // Configurar tema
    const backgroundColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    const textColor = theme === 'dark' ? '#d1d4dc' : '#333333';
    const gridColor = theme === 'dark' ? '#2a2a2a' : '#e0e0e0';

    // Crear gráfico
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: backgroundColor },
        textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: 1, // Magnet mode
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: false,
        dateFormat: 'yyyy-MM-dd',
      },
    });

    chartRef.current = chart;

    // Serie de velas japonesas
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',        // Verde cuando sube
      downColor: '#ef5350',      // Rojo cuando baja
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candleSeriesRef.current = candleSeries;

    // Serie de volumen (opcional)
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.85,
          bottom: 0,
        },
      });

      volumeSeriesRef.current = volumeSeries;
    }

    // Ajustar gráfico al contenedor
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [height, showVolume, theme]);

  // Actualizar datos del gráfico
  useEffect(() => {
    if (!candleSeriesRef.current || chartData.length === 0) return;

    const candleData = convertToChartData(chartData);
    candleSeriesRef.current.setData(candleData);

    // Ajustar el viewport para mostrar todos los datos
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }

    // Actualizar volumen si está habilitado
    if (volumeSeriesRef.current && showVolume) {
      const volumeData = chartData.map((item) => ({
        time: new Date(item.fecha).getTime() / 1000 as Time,
        value: item.volumen,
        color: item.cierre >= item.apertura ? '#26a69a80' : '#ef535080',
      }));
      volumeSeriesRef.current.setData(volumeData);
    }
  }, [chartData, showVolume]);

  // Método para actualizar datos en tiempo real
  const updateCandle = (candle: CandleData) => {
    if (!candleSeriesRef.current) return;

    const candleData = {
      time: new Date(candle.fecha).getTime() / 1000 as Time,
      open: candle.apertura,
      high: candle.maximo,
      low: candle.minimo,
      close: candle.cierre,
    };

    candleSeriesRef.current.update(candleData);

    // Actualizar volumen
    if (volumeSeriesRef.current && showVolume) {
      volumeSeriesRef.current.update({
        time: candleData.time,
        value: candle.volumen,
        color: candle.cierre >= candle.apertura ? '#26a69a80' : '#ef535080',
      });
    }
  };

  // Exponer método updateCandle al padre vía ref
  useEffect(() => {
    (chartRef.current as any).updateCandle = updateCandle;
  }, [showVolume]);

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center" 
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Cargando velas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex items-center justify-center" 
        style={{ height: `${height}px` }}
      >
        <div className="text-center text-red-500">
          <p className="text-sm">Error: {error}</p>
          <p className="text-xs text-gray-400 mt-1">Ticker: {ticker}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={chartContainerRef} />
      
      {/* Leyenda */}
      {chartData.length > 0 && (
        <div className="absolute top-2 left-2 z-10 flex gap-4 text-xs bg-white/80 dark:bg-gray-800/80 px-3 py-2 rounded shadow">
          <span className="text-gray-600 dark:text-gray-300">{ticker}</span>
          <span className="text-green-600">▲ {chartData[chartData.length - 1]?.cierre?.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
