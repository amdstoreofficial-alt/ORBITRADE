import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, Bitcoin, ArrowRight, AlertCircle, ShieldAlert, ChevronDown, Check, Minus, Plus, DollarSign, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

const CRYPTO_OPTIONS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', color: '#f7931a', network: 'Bitcoin (BTC)' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', color: '#627eea', network: 'Ethereum (ERC-20)' },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', color: '#26a17b', network: 'Tron (TRC-20)' },
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC', color: '#bfbbbb', network: 'Litecoin (LTC)' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', color: '#9945FF', network: 'Solana (SOL)' },
];

const Withdraw = () => {
  const { user, refreshUser, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState(100);
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_OPTIONS[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => { fetchWithdrawals(); }, []);

  const fetchWithdrawals = async () => {
    try {
      const res = await api.get('/api/withdrawals');
      setWithdrawals(res.data || []);
    } catch (e) {}
  };

  const handleWithdraw = async () => {
    if (!walletAddress.trim()) { toast.error('Enter your wallet address'); return; }
    if (amount < 10) { toast.error('Minimum withdrawal: $10'); return; }
    if (amount > (user?.balance || 0)) { toast.error('Insufficient balance'); return; }

    setLoading(true);
    try {
      await api.post('/api/withdrawals', {
        amount, currency: selectedCrypto.symbol, method: 'crypto', wallet_address: walletAddress
      });
      toast.success('Withdrawal request submitted');
      await refreshUser();
      await fetchWithdrawals();
      setWalletAddress('');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Withdrawal failed');
    } finally { setLoading(false); }
  };

  if (isDemoMode) {
    return (
      <div className="min-h-screen bg-[#080c14]" data-testid="withdraw-page">
        <Navbar />
        <main className="pt-16 pb-8 px-3 sm:px-6 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Demo Account</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">Withdrawals are only available for real accounts.</p>
            <button onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 rounded-xl bg-electric text-white text-sm font-medium"
              data-testid="back-to-dashboard">Back to Dashboard</button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14]" data-testid="withdraw-page">
      <Navbar />
      <main className="pt-16 pb-8 px-3 sm:px-6 max-w-2xl mx-auto">
        <motion.div className="mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Withdraw Funds</h1>
          <p className="text-sm text-gray-500 mb-6">Withdraw to your crypto wallet</p>

          {/* Balance */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 mb-4">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-[10px] text-gray-500">Available Balance</div>
              <div className="font-mono text-lg font-bold text-emerald-400">${(user?.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>
          </div>

          {/* Crypto Selector */}
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 sm:p-5 mb-4">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Withdrawal Method</label>
            <div className="relative mb-4">
              <button onClick={() => setShowDropdown(!showDropdown)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/10 hover:border-white/20 transition-all"
                data-testid="crypto-selector">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white" style={{ backgroundColor: selectedCrypto.color }}>
                    {selectedCrypto.symbol[0]}
                  </div>
                  <span className="text-sm font-semibold text-white">{selectedCrypto.name} ({selectedCrypto.symbol})</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div className="absolute z-20 top-full mt-1 w-full bg-[#111827] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                  {CRYPTO_OPTIONS.map(c => (
                    <button key={c.id}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${selectedCrypto.id === c.id ? 'bg-white/[0.04]' : ''}`}
                      onClick={() => { setSelectedCrypto(c); setShowDropdown(false); }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] text-white" style={{ backgroundColor: c.color }}>{c.symbol[0]}</div>
                      <div className="text-left">
                        <div className="text-xs font-semibold text-white">{c.name}</div>
                        <div className="text-[10px] text-gray-600">{c.network}</div>
                      </div>
                      {selectedCrypto.id === c.id && <Check className="w-4 h-4 text-electric ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Amount */}
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Amount</label>
            <div className="flex items-center gap-2 bg-black/30 rounded-xl p-3 border border-white/10 mb-3">
              <DollarSign className="w-4 h-4 text-gray-600" />
              <input type="number" value={amount}
                onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="flex-1 bg-transparent font-mono text-white text-lg focus:outline-none"
                placeholder="0.00" data-testid="withdraw-amount" />
            </div>
            <div className="flex gap-1.5 mb-4">
              {[50, 100, 250, 500].map(a => (
                <button key={a}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
                    amount === a ? 'bg-electric text-white' : 'bg-white/[0.03] text-gray-500 hover:bg-white/[0.06]'
                  }`}
                  onClick={() => setAmount(a)}>${a}</button>
              ))}
              <button
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-white/[0.03] text-gray-500 hover:bg-white/[0.06]`}
                onClick={() => setAmount(user?.balance || 0)}>MAX</button>
            </div>

            {/* Wallet Address */}
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">{selectedCrypto.symbol} Wallet Address</label>
            <input type="text" value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder={`Enter your ${selectedCrypto.symbol} address`}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 text-sm text-white font-mono placeholder:text-gray-700 focus:outline-none focus:border-electric/50"
              data-testid="wallet-address-input" />
          </div>

          {/* Info */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <ul className="text-[10px] text-gray-500 space-y-0.5">
                <li>Minimum withdrawal: $10</li>
                <li>Processing time: 1-24 hours</li>
                <li>Network fee deducted from amount</li>
              </ul>
            </div>
          </div>

          <button onClick={handleWithdraw} disabled={loading || !walletAddress.trim() || amount < 10}
            className="w-full py-3.5 rounded-xl bg-electric text-white font-semibold text-sm hover:shadow-lg hover:shadow-electric/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            data-testid="submit-withdraw">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Withdraw ${amount} in {selectedCrypto.symbol}<ArrowRight className="w-4 h-4" /></>}
          </button>

          {/* Withdrawal History */}
          {withdrawals.length > 0 && (
            <div className="mt-6 bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.04]">
                <span className="text-xs font-bold text-white">Recent Withdrawals</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {withdrawals.slice(0, 5).map((w, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-white font-mono">${w.amount?.toFixed(2)}</div>
                      <div className="text-[10px] text-gray-600">{w.currency || 'BTC'} - {new Date(w.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                      w.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>{(w.status || 'pending').toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Withdraw;
