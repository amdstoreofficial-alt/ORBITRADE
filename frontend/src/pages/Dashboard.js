import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Search, ArrowUp, ArrowDown, Clock, 
  TrendingUp, TrendingDown, Wallet, Zap, Activity,
  MessageCircle, X, Send, Minus, Plus, Sparkles, Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import TradingChart from '../components/TradingChart';
import api from '../services/api';
import socketService from '../services/socket';

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [assets, setAssets] = useState([]);
  const [prices, setPrices] = useState({ crypto: {}, forex: {}, metals: {} });
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('forex');
  const [openTrades, setOpenTrades] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Trade form state
  const [tradeAmount, setTradeAmount] = useState(100);
  const [expiryTime, setExpiryTime] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  
  // AI Prediction state
  const [prediction, setPrediction] = useState({ buy_confidence: 50, sell_confidence: 50, reasoning: '' });
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Live countdown interval
  const countdownRef = useRef(null);
  const predictionRef = useRef(null);
  const [, forceUpdate] = useState({});

  // Expiry options - SHORT TIMEFRAMES
  const expiryOptions = [
    { value: 5, label: '5s' },
    { value: 10, label: '10s' },
    { value: 15, label: '15s' },
    { value: 30, label: '30s' },
    { value: 60, label: '60s' }
  ];

  // Crypto symbol mapping
  const cryptoMap = {
    'BTC/USD': 'bitcoin',
    'ETH/USD': 'ethereum',
    'XRP/USD': 'ripple',
    'LTC/USD': 'litecoin',
    'SOL/USD': 'solana',
    'DOGE/USD': 'dogecoin',
    'ADA/USD': 'cardano',
    'DOT/USD': 'polkadot'
  };

  // Fetch AI prediction
  const fetchPrediction = useCallback(async () => {
    if (!selectedAsset) return;
    
    try {
      setPredictionLoading(true);
      const currentPrice = getCurrentPrice();
      
      const response = await api.post('/api/predict', {
        asset: selectedAsset.symbol,
        asset_type: selectedAsset.asset_type,
        current_price: currentPrice,
        price_history: priceHistory.slice(-10)
      });
      
      setPrediction(response.data);
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setPredictionLoading(false);
    }
  }, [selectedAsset, priceHistory]);

  // Fetch assets and prices
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, pricesRes, tradesRes] = await Promise.all([
          api.get('/api/assets'),
          api.get('/api/prices'),
          api.get('/api/trades?limit=50')
        ]);
        
        setAssets(assetsRes.data);
        setPrices(pricesRes.data || { crypto: {}, forex: {}, metals: {} });
        
        // Set default selected asset
        const forexAssets = assetsRes.data.filter(a => a.asset_type === 'forex');
        if (forexAssets.length > 0 && !selectedAsset) {
          setSelectedAsset(forexAssets[0]);
        }
        
        // Separate open and closed trades
        setOpenTrades(tradesRes.data.filter(t => t.status === 'open'));
        setTradeHistory(tradesRes.data.filter(t => t.status !== 'open'));
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load market data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Connect to socket for real-time prices
    socketService.connect();
    
    socketService.on('price_update', (data) => {
      if (data) {
        setPrices(data);
      }
    });
    
    socketService.on('trade_settled', (data) => {
      const profitText = data.profit >= 0 ? `+$${data.profit.toFixed(2)}` : `-$${Math.abs(data.profit).toFixed(2)}`;
      if (data.status === 'won') {
        toast.success(`🎉 WINNER! ${profitText}`);
      } else {
        toast.error(`Trade closed: ${profitText}`);
      }
      refreshUser();
      fetchTrades();
    });

    // Refresh trades every 2 seconds
    const interval = setInterval(() => {
      fetchTrades();
    }, 2000);

    // Live countdown update every 100ms
    countdownRef.current = setInterval(() => {
      forceUpdate({});
    }, 100);

    return () => {
      socketService.disconnect();
      clearInterval(interval);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (predictionRef.current) clearInterval(predictionRef.current);
    };
  }, []);

  // Update price history and fetch prediction when asset changes
  useEffect(() => {
    if (selectedAsset) {
      // Reset price history
      setPriceHistory([]);
      
      // Fetch initial prediction
      fetchPrediction();
      
      // Update prediction every 5 seconds
      if (predictionRef.current) clearInterval(predictionRef.current);
      predictionRef.current = setInterval(fetchPrediction, 5000);
    }
    
    return () => {
      if (predictionRef.current) clearInterval(predictionRef.current);
    };
  }, [selectedAsset]);

  // Track price history
  useEffect(() => {
    const price = getCurrentPrice();
    if (price > 0) {
      setPriceHistory(prev => [...prev.slice(-19), price]);
    }
  }, [prices]);

  const fetchTrades = async () => {
    try {
      const res = await api.get('/api/trades?limit=50');
      setOpenTrades(res.data.filter(t => t.status === 'open'));
      setTradeHistory(res.data.filter(t => t.status !== 'open'));
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  // Get current price for selected asset
  const getCurrentPrice = useCallback((assetSymbol = null, assetType = null) => {
    const symbol = assetSymbol || selectedAsset?.symbol;
    const type = assetType || selectedAsset?.asset_type;
    
    if (!symbol || !prices) return 0;
    
    if (type === 'crypto') {
      const cryptoId = cryptoMap[symbol];
      return prices.crypto?.[cryptoId]?.usd || 0;
    }
    
    if (type === 'forex') {
      return prices.forex?.[symbol]?.price || 0;
    }
    
    if (type === 'metals') {
      return prices.metals?.[symbol]?.price || 0;
    }
    
    return 0;
  }, [selectedAsset, prices]);

  const getChange24h = useCallback((assetSymbol = null, assetType = null) => {
    const symbol = assetSymbol || selectedAsset?.symbol;
    const type = assetType || selectedAsset?.asset_type;
    
    if (!symbol || !prices) return 0;
    
    if (type === 'crypto') {
      const cryptoId = cryptoMap[symbol];
      return prices.crypto?.[cryptoId]?.usd_24h_change || 0;
    }
    
    if (type === 'forex') {
      return prices.forex?.[symbol]?.change_24h || 0;
    }
    
    if (type === 'metals') {
      return prices.metals?.[symbol]?.change_24h || 0;
    }
    
    return 0;
  }, [selectedAsset, prices]);

  // Place trade
  const placeTrade = async (direction) => {
    if (!selectedAsset) {
      toast.error('Please select an asset');
      return;
    }
    
    if (tradeAmount < 1) {
      toast.error('Minimum trade amount is $1');
      return;
    }
    
    if (tradeAmount > (user?.balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }
    
    setSubmitting(true);
    
    try {
      await api.post('/api/trades', {
        asset: selectedAsset.symbol,
        direction,
        amount: tradeAmount,
        expiry_seconds: expiryTime
      });
      
      toast.success(`${direction.toUpperCase()} position opened on ${selectedAsset.symbol}!`);
      await refreshUser();
      await fetchTrades();
      
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to place trade';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Chat functions
  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    
    try {
      const response = await api.post('/api/chat', { message: userMessage });
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      toast.error('Chat service unavailable');
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Filter assets by category
  const filteredAssets = assets.filter(a => a.asset_type === selectedCategory);

  // Format price display
  const formatPrice = (price, assetType) => {
    if (!price || price === 0) return '-.--';
    if (assetType === 'forex') return price.toFixed(5);
    if (assetType === 'metals') return price.toFixed(2);
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Calculate time left for trade
  const getTimeLeft = (expiryTime) => {
    const now = new Date();
    const expiry = new Date(expiryTime);
    return Math.max(0, expiry - now);
  };

  const formatTimeLeft = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  // Calculate potential payout
  const potentialPayout = tradeAmount * (1 + (selectedAsset?.payout_rate || 0.85));

  if (loading) {
    return (
      <div className="min-h-screen bg-space flex items-center justify-center">
        <motion.div 
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-electric/30 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-electric border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-gray-400">Loading markets...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-space" data-testid="dashboard">
      <Navbar />
      
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-electric/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-vibrant/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-neon/3 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <main className="flex-grow p-2 md:p-4 max-w-[1700px] mx-auto w-full relative z-10">
        {/* Top Stats Bar */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="glass-panel rounded-xl p-3 border-l-4 border-l-electric">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-electric" />
              <span className="text-xs text-gray-400">Balance</span>
            </div>
            <div className="font-mono text-xl text-white">${(user?.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>
          
          <div className="glass-panel rounded-xl p-3 border-l-4 border-l-neon">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-neon" />
              <span className="text-xs text-gray-400">Active Trades</span>
            </div>
            <div className="font-mono text-xl text-white">{openTrades.length}</div>
          </div>
          
          <div className="glass-panel rounded-xl p-3 border-l-4 border-l-amber">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-amber" />
              <span className="text-xs text-gray-400">Today's P&L</span>
            </div>
            <div className="font-mono text-xl text-neon">+$0.00</div>
          </div>
          
          <div className="glass-panel rounded-xl p-3 border-l-4 border-l-vibrant">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-vibrant" />
              <span className="text-xs text-gray-400">Win Rate</span>
            </div>
            <div className="font-mono text-xl text-white">--</div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Left Panel: Assets */}
          <motion.div 
            className="lg:col-span-3 glass-panel rounded-2xl flex flex-col h-[450px] lg:h-[520px] overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-4 border-b border-white/5 bg-gradient-to-r from-electric/10 to-transparent">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-electric" /> Live Markets
              </h2>
            </div>
            
            {/* Category Tabs - Pill Style */}
            <div className="flex p-3 gap-2">
              {['forex', 'crypto', 'metals'].map(cat => (
                <button 
                  key={cat}
                  className={`flex-1 px-3 py-2 rounded-full text-xs font-semibold capitalize transition-all ${
                    selectedCategory === cat 
                      ? 'bg-gradient-to-r from-electric to-neon text-space shadow-lg shadow-electric/25' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    const categoryAssets = assets.filter(a => a.asset_type === cat);
                    if (categoryAssets.length > 0) {
                      setSelectedAsset(categoryAssets[0]);
                    }
                  }}
                  data-testid={`category-${cat}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Asset List */}
            <div className="overflow-y-auto flex-grow px-3 pb-3 space-y-2 custom-scrollbar">
              {filteredAssets.map((asset, index) => {
                const price = getCurrentPrice(asset.symbol, asset.asset_type);
                const change = getChange24h(asset.symbol, asset.asset_type);
                const isPositive = change >= 0;
                const isSelected = selectedAsset?.symbol === asset.symbol;
                
                return (
                  <motion.div 
                    key={asset.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-electric/20 to-neon/10 border border-electric/40 shadow-lg shadow-electric/10' 
                        : 'bg-white/3 hover:bg-white/8 border border-transparent hover:border-white/10'
                    }`}
                    onClick={() => setSelectedAsset(asset)}
                    data-testid={`asset-${asset.symbol}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSelected 
                            ? 'bg-gradient-to-br from-electric to-neon shadow-lg' 
                            : 'bg-white/10'
                        }`}>
                          {asset.asset_type === 'crypto' && <span className={`font-bold ${isSelected ? 'text-space' : 'text-amber'}`}>₿</span>}
                          {asset.asset_type === 'forex' && <span className={`font-bold ${isSelected ? 'text-space' : 'text-electric'}`}>$</span>}
                          {asset.asset_type === 'metals' && <span className={`font-bold ${isSelected ? 'text-space' : 'text-amber'}`}>Au</span>}
                        </div>
                        <div>
                          <div className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                            {asset.symbol}
                          </div>
                          <div className="text-[10px] text-gray-500">{Math.round(asset.payout_rate * 100)}% payout</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-sm font-medium ${isPositive ? 'text-neon' : 'text-vibrant'}`}>
                          {formatPrice(price, asset.asset_type)}
                        </div>
                        <div className={`text-xs flex items-center justify-end gap-0.5 ${isPositive ? 'text-neon' : 'text-vibrant'}`}>
                          {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {Math.abs(change).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Center Panel: Chart */}
          <motion.div 
            className="lg:col-span-6 glass-panel rounded-2xl flex flex-col relative overflow-hidden h-[350px] lg:h-[520px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Chart Header */}
            <div className="p-4 border-b border-white/5 bg-gradient-to-r from-space-light to-transparent flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-white">
                    {selectedAsset?.symbol || 'Select Asset'}
                  </h2>
                  <div className="text-xs text-gray-500">{selectedAsset?.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono text-2xl font-bold ${getChange24h() >= 0 ? 'text-neon' : 'text-vibrant'}`}>
                  {formatPrice(getCurrentPrice(), selectedAsset?.asset_type)}
                </div>
                <div className={`text-sm flex items-center justify-end gap-1 ${getChange24h() >= 0 ? 'text-neon' : 'text-vibrant'}`}>
                  {getChange24h() >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {getChange24h() >= 0 ? '+' : ''}{getChange24h().toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="flex-grow relative">
              <TradingChart 
                asset={selectedAsset?.symbol}
                currentPrice={getCurrentPrice()}
                assetType={selectedAsset?.asset_type}
              />
            </div>
          </motion.div>

          {/* Right Panel: Trade Execution with AI Predictions */}
          <motion.div 
            className="lg:col-span-3 glass-panel rounded-2xl flex flex-col h-[450px] lg:h-[520px] overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="p-4 bg-gradient-to-r from-vibrant/10 to-electric/10 border-b border-white/5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-electric" /> Quick Trade
                </span>
                <span className="text-xs text-neon bg-neon/10 px-2 py-1 rounded-full border border-neon/20 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {Math.round((selectedAsset?.payout_rate || 0.85) * 100)}%
                </span>
              </div>
              
              {/* Amount with Quick Buttons */}
              <div className="space-y-2">
                <div className="bg-space-dark/50 rounded-xl p-3 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Investment</span>
                    <span className="text-xs text-gray-500">Max: ${(user?.balance || 0).toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <button 
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      onClick={() => setTradeAmount(Math.max(1, tradeAmount - 25))}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input 
                      type="number" 
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="bg-transparent text-center font-mono text-2xl text-white w-28 focus:outline-none"
                      data-testid="trade-amount"
                    />
                    <button 
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      onClick={() => setTradeAmount(tradeAmount + 25)}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Amount Pills */}
                <div className="flex gap-1">
                  {[25, 50, 100, 250, 500].map(amt => (
                    <button
                      key={amt}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        tradeAmount === amt
                          ? 'bg-electric text-space'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                      onClick={() => setTradeAmount(amt)}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry Time Pills */}
              <div className="mt-3">
                <span className="text-xs text-gray-400 mb-2 block">Duration</span>
                <div className="flex gap-1">
                  {expiryOptions.map(opt => (
                    <button
                      key={opt.value}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                        expiryTime === opt.value
                          ? 'bg-gradient-to-r from-electric to-neon text-space'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                      onClick={() => setExpiryTime(opt.value)}
                      data-testid={`expiry-${opt.value}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Potential Profit Display */}
            <div className="px-4 py-3 bg-gradient-to-r from-neon/5 to-transparent border-b border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Potential Profit</span>
                <span className="font-mono text-xl text-neon font-bold" data-testid="potential-payout">
                  +${(potentialPayout - tradeAmount).toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* AI Prediction Display */}
            <div className="px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber" />
                <span className="text-xs text-gray-400">AI Analysis</span>
                {predictionLoading && (
                  <div className="w-3 h-3 border border-amber border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              {prediction.reasoning && (
                <p className="text-[10px] text-gray-500 italic mb-2">{prediction.reasoning}</p>
              )}
            </div>

            {/* BUY/SELL Buttons with AI Percentages */}
            <div className="p-4 flex-grow flex flex-col justify-center gap-3">
              <motion.button 
                className="relative overflow-hidden group py-5 rounded-2xl bg-gradient-to-r from-neon/20 to-neon/5 border-2 border-neon/40 hover:border-neon transition-all disabled:opacity-50"
                onClick={() => placeTrade('buy')}
                disabled={submitting || !selectedAsset}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="buy-btn"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-neon/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon to-transparent opacity-50"></div>
                <div className="flex items-center justify-between px-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-neon/20 flex items-center justify-center">
                      <ArrowUp className="w-6 h-6 text-neon" />
                    </div>
                    <div className="text-left">
                      <div className="font-display font-bold text-neon text-xl">BUY</div>
                      <div className="text-[10px] text-neon/70">Price will rise</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-3xl font-bold text-neon">{prediction.buy_confidence}%</div>
                    <div className="text-[10px] text-neon/70">confidence</div>
                  </div>
                </div>
              </motion.button>
              
              <motion.button 
                className="relative overflow-hidden group py-5 rounded-2xl bg-gradient-to-r from-vibrant/20 to-vibrant/5 border-2 border-vibrant/40 hover:border-vibrant transition-all disabled:opacity-50"
                onClick={() => placeTrade('sell')}
                disabled={submitting || !selectedAsset}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="sell-btn"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-vibrant/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-vibrant to-transparent opacity-50"></div>
                <div className="flex items-center justify-between px-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-vibrant/20 flex items-center justify-center">
                      <ArrowDown className="w-6 h-6 text-vibrant" />
                    </div>
                    <div className="text-left">
                      <div className="font-display font-bold text-vibrant text-xl">SELL</div>
                      <div className="text-[10px] text-vibrant/70">Price will fall</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-3xl font-bold text-vibrant">{prediction.sell_confidence}%</div>
                    <div className="text-[10px] text-vibrant/70">confidence</div>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Bottom Panel: Open Positions & History */}
          <motion.div 
            className="lg:col-span-12 glass-panel rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex border-b border-white/5 bg-gradient-to-r from-space-light to-transparent px-4 pt-3">
              <button 
                className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                  !showHistory ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setShowHistory(false)}
                data-testid="open-trades-tab"
              >
                Active Trades
                {openTrades.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-neon/20 text-neon text-xs">
                    {openTrades.length}
                  </span>
                )}
                {!showHistory && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-electric to-neon"></div>}
              </button>
              <button 
                className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                  showHistory ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setShowHistory(true)}
                data-testid="history-tab"
              >
                History
                {showHistory && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-electric to-neon"></div>}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-white/5">
                    <th className="p-4 font-medium">Asset</th>
                    <th className="p-4 font-medium">Direction</th>
                    <th className="p-4 font-medium">Strike</th>
                    <th className="p-4 font-medium">Current</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">{showHistory ? 'Result' : 'Countdown'}</th>
                    <th className="p-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {(showHistory ? tradeHistory : openTrades).slice(0, 10).map((trade, index) => {
                      const timeLeftMs = getTimeLeft(trade.expiry_time);
                      const currentPrice = getCurrentPrice(trade.asset, trade.asset_type);
                      const isWinning = trade.direction === 'buy' || trade.direction === 'call' 
                        ? currentPrice > trade.strike_price 
                        : currentPrice < trade.strike_price;
                      const progress = Math.min(100, (timeLeftMs / (trade.expiry_seconds * 1000)) * 100);
                      
                      return (
                        <motion.tr 
                          key={trade.id} 
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-8 rounded-full ${
                                trade.direction === 'buy' || trade.direction === 'call' ? 'bg-neon' : 'bg-vibrant'
                              }`}></div>
                              <span className="font-semibold text-white">{trade.asset}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              trade.direction === 'buy' || trade.direction === 'call' 
                                ? 'bg-neon/20 text-neon' 
                                : 'bg-vibrant/20 text-vibrant'
                            }`}>
                              {trade.direction === 'call' ? 'BUY' : trade.direction === 'put' ? 'SELL' : trade.direction.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-gray-300">{formatPrice(trade.strike_price, trade.asset_type)}</td>
                          <td className={`p-4 font-mono font-semibold ${
                            trade.status === 'open' 
                              ? (isWinning ? 'text-neon' : 'text-vibrant') 
                              : 'text-gray-400'
                          }`}>
                            {trade.status === 'open' ? formatPrice(currentPrice, trade.asset_type) : formatPrice(trade.close_price, trade.asset_type)}
                          </td>
                          <td className="p-4 font-mono text-white font-semibold">${trade.amount.toFixed(2)}</td>
                          <td className="p-4">
                            {showHistory ? (
                              <span className={`font-mono font-bold ${trade.profit >= 0 ? 'text-neon' : 'text-vibrant'}`}>
                                {trade.profit >= 0 ? '+' : ''}${trade.profit?.toFixed(2)}
                              </span>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Clock className={`w-4 h-4 ${timeLeftMs > 10000 ? 'text-amber' : 'text-vibrant animate-pulse'}`} />
                                  <span className={`font-mono font-bold text-lg ${timeLeftMs > 10000 ? 'text-amber' : 'text-vibrant'}`}>
                                    {formatTimeLeft(timeLeftMs)}
                                  </span>
                                </div>
                                <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                                  <motion.div 
                                    className={`h-full rounded-full ${timeLeftMs > 10000 ? 'bg-gradient-to-r from-amber to-amber/50' : 'bg-gradient-to-r from-vibrant to-vibrant/50'}`}
                                    initial={{ width: '100%' }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.1 }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {trade.status === 'open' ? (
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                isWinning 
                                  ? 'bg-neon/20 text-neon border border-neon/30' 
                                  : 'bg-vibrant/20 text-vibrant border border-vibrant/30'
                              }`}>
                                {isWinning ? '▲ WINNING' : '▼ LOSING'}
                              </span>
                            ) : (
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                trade.status === 'won' 
                                  ? 'bg-neon/20 text-neon border border-neon/30' 
                                  : 'bg-vibrant/20 text-vibrant border border-vibrant/30'
                              }`}>
                                {trade.status === 'won' ? `✓ +$${(trade.amount * trade.payout_rate).toFixed(2)}` : `✗ -$${trade.amount.toFixed(2)}`}
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {(showHistory ? tradeHistory : openTrades).length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                          <Activity className="w-12 h-12 opacity-30" />
                          <p>{showHistory ? 'No trade history yet' : 'No active trades'}</p>
                          <p className="text-xs">Place your first trade to get started!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>

      {/* AI Chat Widget */}
      <div className="fixed bottom-4 right-4 z-50">
        <AnimatePresence>
          {chatOpen && (
            <motion.div 
              className="absolute bottom-16 right-0 w-80 h-[420px] glass-panel rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-electric/20"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-electric/20 to-vibrant/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric to-neon flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-space" />
                  </div>
                  <span className="text-sm font-semibold text-white">AI Assistant</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Ask me anything about trading!</p>
                    <p className="text-xs mt-1">Market analysis • Strategy tips • Platform help</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <motion.div 
                    key={i} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-electric to-neon text-space font-medium' 
                        : 'bg-white/10 text-gray-200'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-2xl px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-electric rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-neon rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-vibrant rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <form onSubmit={sendChatMessage} className="p-4 border-t border-white/10 bg-space-dark/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask anything..."
                    className="flex-grow input-field text-sm py-2.5 rounded-xl"
                    data-testid="chat-input"
                  />
                  <button 
                    type="submit" 
                    disabled={chatLoading || !chatInput.trim()}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-electric to-neon text-space disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-electric/30"
                    data-testid="chat-send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-electric via-neon to-vibrant flex items-center justify-center shadow-lg transition-all"
          whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(42,245,255,0.5)' }}
          whileTap={{ scale: 0.95 }}
          data-testid="chat-toggle"
        >
          {chatOpen ? <X className="w-6 h-6 text-space" /> : <MessageCircle className="w-6 h-6 text-space" />}
        </motion.button>
      </div>
    </div>
  );
};

export default Dashboard;
