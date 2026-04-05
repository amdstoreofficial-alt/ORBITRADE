import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, ArrowRight, ChevronDown, Check, AlertTriangle, Clock, Loader, CheckCircle2, Shield, DollarSign
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

const Withdraw = () => {
  const { user, refreshUser, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_OPTIONS[0]);
  const [showCryptoSelect, setShowCryptoSelect] = useState(false);
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationProgress, setConfirmationProgress] = useState(0);
  const [myWithdrawals, setMyWithdrawals] = useState([]);

  useEffect(() => { fetchMyWithdrawals(); }, []);
  
  const fetchMyWithdrawals = async () => {
    try {
      const res = await api.get('/api/withdrawals/my');
      setMyWithdrawals(res.data || []);
    } catch (e) { console.error(e); }
  };

  const submitWithdrawal = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 10) { toast.error('Minimum withdrawal is $10'); return; }
    if (amt > (user?.balance || 0)) { toast.error('Insufficient balance'); return; }
    if (!walletAddress.trim()) { toast.error('Enter your wallet address'); return; }
    
    setSubmitting(true);
    try {
      await api.post('/api/withdrawals', {
        amount: amt,
        method: selectedCrypto.id,
        wallet_address: walletAddress.trim()
      });
      
      setSubmitted(true);
      
      // Simulate blockchain processing animation
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 12;
        if (progress >= 100) { progress = 100; clearInterval(interval); }
        setConfirmationProgress(progress);
      }, 600);
      
      toast.success('Withdrawal submitted! Waiting for processing...');
      await refreshUser();
      fetchMyWithdrawals();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setAmount('');
    setWalletAddress('');
    setSubmitted(false);
    setConfirmationProgress(0);
    fetchMyWithdrawals();
  };

  if (isDemoMode) {
    return (
      <div className="min-h-screen bg-app" data-testid="withdraw-page">
        <Navbar />
        <main className="pt-16 pb-8 px-3 sm:px-6 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Demo Account</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">Withdrawals are only available for real accounts.</p>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 rounded-xl bg-electric text-white text-sm font-medium" data-testid="back-to-dashboard">Back to Dashboard</button>
          </motion.div>
        </main>
      </div>
    );
  }

  // Submitted state
  if (submitted) {
    return (
      <div className="min-h-screen bg-app" data-testid="withdraw-page">
        <Navbar />
        <main className="pt-16 pb-8 px-3 sm:px-6 max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-10">
            <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] p-6 sm:p-8 text-center">
              {/* Blockchain Animation */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
                  <circle cx="64" cy="64" r="58" stroke="url(#withdrawGradient)" strokeWidth="4" fill="none" strokeLinecap="round"
                    strokeDasharray={`${confirmationProgress * 3.64} 364`} className="transition-all duration-500" />
                  <defs>
                    <linearGradient id="withdrawGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {confirmationProgress < 100 ? (
                    <><Loader className="w-8 h-8 text-amber-400 animate-spin mb-1" /><span className="text-xs text-gray-500">{Math.round(confirmationProgress)}%</span></>
                  ) : (
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  )}
                </div>
                {confirmationProgress < 100 && (
                  <motion.div className="absolute w-3 h-3 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50"
                    animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ top: '8px', left: '50%', marginLeft: '-6px', transformOrigin: '6px 56px' }} />
                )}
              </div>
              
              <h2 className="text-lg font-bold text-white mb-2">
                {confirmationProgress < 100 ? 'Processing Withdrawal' : 'Withdrawal Submitted'}
              </h2>
              <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                {confirmationProgress < 100 
                  ? 'Your withdrawal is being processed. Please wait...'
                  : 'Your withdrawal request has been submitted. Funds will be sent within 24 hours after admin approval.'}
              </p>
              
              <div className="bg-black/30 rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Amount</span>
                  <span className="font-mono text-sm text-emerald-400">${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Method</span>
                  <span className="text-sm text-white">{selectedCrypto.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Wallet Address</span>
                  <code className="text-[10px] font-mono text-gray-400 break-all">{walletAddress}</code>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-xs text-amber-400 bg-amber-400/5 rounded-lg py-2 px-3 mb-4">
                <Clock className="w-4 h-4" />
                <span>Status: Waiting for blockchain confirmation</span>
              </div>
              
              <button onClick={resetForm} className="w-full py-3 rounded-xl bg-electric text-white font-semibold text-sm" data-testid="new-withdrawal">
                Make Another Withdrawal
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app" data-testid="withdraw-page">
      <Navbar />
      <main className="pt-16 pb-8 px-3 sm:px-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Withdraw Funds</h1>
          <p className="text-sm text-gray-500 mb-6">Withdraw your earnings to your crypto wallet</p>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Left: Form */}
            <div className="space-y-4">
              {/* Available Balance */}
              <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Available Balance</span>
                  </div>
                  <span className="font-mono text-xl text-emerald-400 font-bold">${(user?.balance || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Crypto Selection */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Withdrawal Method</label>
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
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Your {selectedCrypto.symbol} Wallet Address</label>
                <input type="text" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-electric"
                  placeholder={`Enter your ${selectedCrypto.network} address`} data-testid="wallet-address" />
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] mt-2">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Double-check your address. Transactions cannot be reversed!</span>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Withdrawal Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-lg font-mono text-white focus:outline-none focus:border-electric"
                    placeholder="0.00" min="10" max={user?.balance || 0} data-testid="withdraw-amount" />
                </div>
                <div className="flex gap-2 mt-2">
                  {[25, 50, 100].map(p => (
                    <button key={p} onClick={() => setAmount(Math.floor((user?.balance || 0) * p / 100).toString())}
                      className="flex-1 py-1.5 rounded-lg text-xs font-mono font-bold bg-white/5 text-gray-500 hover:bg-white/10 transition-all">
                      {p}%
                    </button>
                  ))}
                  <button onClick={() => setAmount(Math.floor(user?.balance || 0).toString())}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-electric/10 text-electric hover:bg-electric/20 transition-all">
                    MAX
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button onClick={submitWithdrawal} disabled={submitting || !amount || !walletAddress}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-electric to-neon text-space font-bold text-sm hover:shadow-lg hover:shadow-electric/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="submit-withdrawal">
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-space border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Request Withdrawal<ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {/* Right: Info & History */}
            <div className="space-y-4">
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-electric" /> Withdrawal Info
                </h3>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex justify-between"><span>Minimum withdrawal</span><span className="text-white">$10</span></div>
                  <div className="flex justify-between"><span>Processing time</span><span className="text-white">Up to 24 hours</span></div>
                  <div className="flex justify-between"><span>Network fee</span><span className="text-emerald-400">FREE</span></div>
                </div>
              </div>

              {/* History */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.04]">
                  <h3 className="text-sm font-bold text-white">Recent Withdrawals</h3>
                </div>
                {myWithdrawals.length === 0 ? (
                  <div className="p-6 text-center text-gray-600 text-xs">No withdrawals yet</div>
                ) : (
                  <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
                    {myWithdrawals.map((w, i) => (
                      <div key={i} className="px-4 py-3 flex justify-between items-center">
                        <div>
                          <div className="font-mono text-sm text-emerald-400">${w.amount?.toFixed(2)}</div>
                          <div className="text-[10px] text-gray-600">{w.method} • {new Date(w.created_at).toLocaleDateString()}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                          w.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {w.status === 'pending' ? 'PROCESSING...' : w.status?.toUpperCase()}
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

export default Withdraw;
