import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Copy, Check, ArrowRight, ChevronDown, Shield, AlertTriangle,
  Upload, Camera, QrCode, Clock, Loader, CheckCircle2, Link2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

const CRYPTO_OPTIONS = [
  { id: 'USDT_TRC20', name: 'USDT (TRC20)', symbol: 'USDT', network: 'Tron TRC20', icon: '₮', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
  { id: 'USDT_ERC20', name: 'USDT (ERC20)', symbol: 'USDT', network: 'Ethereum ERC20', icon: '₮', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', network: 'Bitcoin', icon: '₿', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', network: 'Ethereum', icon: 'Ξ', color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  { id: 'LTC', name: 'Litecoin', symbol: 'LTC', network: 'Litecoin', icon: 'Ł', color: 'text-gray-300', bgColor: 'bg-gray-400/10' },
];

const WALLET_ADDRESSES = {
  'USDT_TRC20': 'TYDFxsWc4PqqpxQG9gXXqXNhxUhHYJCHxg',
  'USDT_ERC20': '0x742d35Cc6634C0532925a3b844Bc9e7595f5A1E8',
  'BTC': 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  'ETH': '0x742d35Cc6634C0532925a3b844Bc9e7595f5A1E8',
  'LTC': 'ltc1qh5xj5j8qr5y5z4v7k9v0a6n3w2r8y5t7e4r3w',
};

const Deposit = () => {
  const { user, refreshUser, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_OPTIONS[0]);
  const [showCryptoSelect, setShowCryptoSelect] = useState(false);
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [depositSubmitted, setDepositSubmitted] = useState(false);
  const [confirmationProgress, setConfirmationProgress] = useState(0);
  const [myDeposits, setMyDeposits] = useState([]);
  const fileInputRef = useRef(null);
  
  useEffect(() => { 
    fetchMyDeposits(); 
  }, []);
  
  const fetchMyDeposits = async () => {
    try {
      const res = await api.get('/api/deposits/my');
      setMyDeposits(res.data || []);
    } catch (e) { console.error(e); }
  };
  
  const copyAddress = () => {
    navigator.clipboard.writeText(WALLET_ADDRESSES[selectedCrypto.id]);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large. Max 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
        toast.success('Screenshot uploaded');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const submitDeposit = async () => {
    if (!amount || parseFloat(amount) < 10) {
      toast.error('Minimum deposit is $10');
      return;
    }
    if (!txHash.trim()) {
      toast.error('Please enter transaction hash/ID');
      return;
    }
    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/api/deposits', {
        amount: parseFloat(amount),
        currency: selectedCrypto.id,
        tx_hash: txHash.trim(),
        screenshot: screenshot
      });
      
      setDepositSubmitted(true);
      
      // Simulate blockchain confirmation animation
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        setConfirmationProgress(progress);
      }, 500);
      
      toast.success('Deposit submitted! Waiting for blockchain confirmation...');
      fetchMyDeposits();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Deposit submission failed');
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setAmount('');
    setTxHash('');
    setScreenshot(null);
    setDepositSubmitted(false);
    setConfirmationProgress(0);
    fetchMyDeposits();
  };

  if (isDemoMode) {
    return (
      <div className="min-h-screen bg-[#080c14]" data-testid="deposit-page">
        <Navbar />
        <main className="pt-16 pb-8 px-3 sm:px-6 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Demo Account</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">Deposits are only available for real accounts. Switch to real mode to deposit funds.</p>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 rounded-xl bg-electric text-white text-sm font-medium" data-testid="back-to-dashboard">Back to Dashboard</button>
          </motion.div>
        </main>
      </div>
    );
  }

  // Submitted state - Blockchain confirmation animation
  if (depositSubmitted) {
    return (
      <div className="min-h-screen bg-[#080c14]" data-testid="deposit-page">
        <Navbar />
        <main className="pt-16 pb-8 px-3 sm:px-6 max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-10">
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6 sm:p-8 text-center">
              {/* Blockchain Animation */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                {/* Outer ring */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
                  <circle cx="64" cy="64" r="58" stroke="url(#gradient)" strokeWidth="4" fill="none" strokeLinecap="round"
                    strokeDasharray={`${confirmationProgress * 3.64} 364`}
                    className="transition-all duration-500" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2af5ff" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Inner content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {confirmationProgress < 100 ? (
                    <>
                      <Loader className="w-8 h-8 text-electric animate-spin mb-1" />
                      <span className="text-xs text-gray-500">{Math.round(confirmationProgress)}%</span>
                    </>
                  ) : (
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  )}
                </div>
                {/* Orbiting dots */}
                {confirmationProgress < 100 && (
                  <>
                    <motion.div className="absolute w-3 h-3 bg-electric rounded-full shadow-lg shadow-electric/50"
                      animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      style={{ top: '8px', left: '50%', marginLeft: '-6px', transformOrigin: '6px 56px' }} />
                    <motion.div className="absolute w-2 h-2 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"
                      animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      style={{ top: '4px', left: '50%', marginLeft: '-4px', transformOrigin: '4px 60px' }} />
                  </>
                )}
              </div>
              
              <h2 className="text-lg font-bold text-white mb-2">
                {confirmationProgress < 100 ? 'Waiting for Blockchain Confirmation' : 'Deposit Submitted'}
              </h2>
              <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                {confirmationProgress < 100 
                  ? 'Your transaction is being verified on the blockchain. This may take a few minutes.'
                  : 'Your deposit has been submitted for review. You will be credited once confirmed by our team.'}
              </p>
              
              <div className="bg-black/30 rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Amount</span>
                  <span className="font-mono text-sm text-emerald-400">${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Currency</span>
                  <span className="text-sm text-white">{selectedCrypto.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Transaction Hash</span>
                  <code className="text-[10px] font-mono text-gray-400 break-all">{txHash}</code>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-xs text-amber-400 bg-amber-400/5 rounded-lg py-2 px-3 mb-4">
                <Clock className="w-4 h-4" />
                <span>Status: Waiting for blockchain confirmation</span>
              </div>
              
              <button onClick={resetForm} className="w-full py-3 rounded-xl bg-electric text-white font-semibold text-sm" data-testid="new-deposit">
                Make Another Deposit
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14]" data-testid="deposit-page">
      <Navbar />
      <main className="pt-16 pb-8 px-3 sm:px-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Deposit Funds</h1>
          <p className="text-sm text-gray-500 mb-6">Add funds to your trading account via cryptocurrency</p>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Left: Deposit Form */}
            <div className="space-y-4">
              {/* Crypto Selection */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Select Cryptocurrency</label>
                <div className="relative">
                  <button onClick={() => setShowCryptoSelect(!showCryptoSelect)}
                    className="w-full flex items-center justify-between bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-left"
                    data-testid="crypto-selector">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${selectedCrypto.bgColor} flex items-center justify-center text-lg font-bold ${selectedCrypto.color}`}>
                        {selectedCrypto.icon}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{selectedCrypto.name}</div>
                        <div className="text-[10px] text-gray-500">{selectedCrypto.network}</div>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCryptoSelect ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showCryptoSelect && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 w-full mt-2 bg-[#111827] border border-white/10 rounded-xl overflow-hidden shadow-xl">
                        {CRYPTO_OPTIONS.map(c => (
                          <button key={c.id} onClick={() => { setSelectedCrypto(c); setShowCryptoSelect(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${selectedCrypto.id === c.id ? 'bg-electric/10' : ''}`}>
                            <div className={`w-8 h-8 rounded-lg ${c.bgColor} flex items-center justify-center text-sm font-bold ${c.color}`}>{c.icon}</div>
                            <div className="text-left">
                              <div className="text-sm text-white">{c.name}</div>
                              <div className="text-[10px] text-gray-500">{c.network}</div>
                            </div>
                            {selectedCrypto.id === c.id && <Check className="w-4 h-4 text-electric ml-auto" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Wallet Address */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Send {selectedCrypto.symbol} to this address</label>
                <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-xs font-mono text-white break-all pr-2" data-testid="wallet-address">
                      {WALLET_ADDRESSES[selectedCrypto.id]}
                    </code>
                    <button onClick={copyAddress}
                      className={`shrink-0 p-2 rounded-lg transition-all ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                      data-testid="copy-address">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400 text-[10px]">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Only send {selectedCrypto.symbol} on {selectedCrypto.network} network</span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Deposit Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-lg font-mono text-white focus:outline-none focus:border-electric"
                    placeholder="0.00" min="10" data-testid="deposit-amount" />
                </div>
                <div className="flex gap-2 mt-2">
                  {[50, 100, 250, 500, 1000].map(a => (
                    <button key={a} onClick={() => setAmount(a.toString())}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${amount === a.toString() ? 'bg-electric text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>
                      ${a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Hash */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Transaction Hash / ID</label>
                <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-electric"
                  placeholder="Enter your transaction hash..." data-testid="tx-hash" />
              </div>

              {/* Screenshot Upload */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Payment Screenshot</label>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                {screenshot ? (
                  <div className="relative">
                    <img src={screenshot} alt="Payment proof" className="w-full h-40 object-cover rounded-xl border border-white/10" />
                    <button onClick={() => setScreenshot(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-electric/50 hover:bg-electric/5 transition-all"
                    data-testid="upload-screenshot">
                    <Upload className="w-8 h-8 text-gray-600" />
                    <span className="text-xs text-gray-500">Click to upload screenshot</span>
                  </button>
                )}
              </div>

              {/* Submit */}
              <button onClick={submitDeposit} disabled={submitting || !amount || !txHash || !screenshot}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-electric to-neon text-space font-bold text-sm hover:shadow-lg hover:shadow-electric/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="submit-deposit">
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-space border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Submit Deposit<ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {/* Right: Info & History */}
            <div className="space-y-4">
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-electric" /> How It Works
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-electric/10 flex items-center justify-center text-[10px] font-bold text-electric shrink-0">1</div>
                    <p className="text-xs text-gray-400">Send crypto to the wallet address shown</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-electric/10 flex items-center justify-center text-[10px] font-bold text-electric shrink-0">2</div>
                    <p className="text-xs text-gray-400">Enter the transaction hash and upload screenshot</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-electric/10 flex items-center justify-center text-[10px] font-bold text-electric shrink-0">3</div>
                    <p className="text-xs text-gray-400">Wait for blockchain confirmation (usually 5-30 mins)</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-400/10 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">✓</div>
                    <p className="text-xs text-gray-400">Funds will be credited to your account automatically</p>
                  </div>
                </div>
              </div>

              {/* My Deposits */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.04]">
                  <h3 className="text-sm font-bold text-white">My Deposits</h3>
                </div>
                {myDeposits.length === 0 ? (
                  <div className="p-6 text-center text-gray-600 text-xs">No deposits yet</div>
                ) : (
                  <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
                    {myDeposits.map((d, i) => (
                      <div key={i} className="px-4 py-3 flex justify-between items-center">
                        <div>
                          <div className="font-mono text-sm text-emerald-400">${d.amount?.toFixed(2)}</div>
                          <div className="text-[10px] text-gray-600">{d.currency} • {new Date(d.created_at).toLocaleDateString()}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' :
                          d.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {d.status === 'blockchain_confirming' ? 'CONFIRMING...' : d.status?.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Deposit;
