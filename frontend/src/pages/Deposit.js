import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bitcoin, Copy, Check, ArrowRight, QrCode, Wallet, ChevronDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const CRYPTO_OPTIONS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', color: '#f7931a', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', network: 'Bitcoin (BTC)' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', color: '#627eea', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', network: 'Ethereum (ERC-20)' },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', color: '#26a17b', address: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9', network: 'Tron (TRC-20)' },
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC', color: '#bfbbbb', address: 'ltc1qg42tkwuuxefutzxezdkdp39qqww6crkkk2fmh3', network: 'Litecoin (LTC)' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', color: '#9945FF', address: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV', network: 'Solana (SOL)' },
];

const Deposit = () => {
  const { user, isDemoMode, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_OPTIONS[0]);
  const [amount, setAmount] = useState(100);
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(selectedCrypto.address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedCrypto.address)}&bgcolor=0d1220&color=ffffff`;

  return (
    <div className="min-h-screen bg-[#080c14]" data-testid="deposit-page">
      <Navbar />
      <main className="pt-16 pb-8 px-3 sm:px-6 max-w-2xl mx-auto">
        <motion.div className="mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Deposit Funds</h1>
          <p className="text-sm text-gray-500 mb-6">Send crypto to the address below to fund your account</p>

          {isDemoMode && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-400/5 border border-amber-400/20 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">You're on a demo account. Deposits will apply to your real account balance.</p>
            </div>
          )}

          {/* Crypto Selector */}
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 sm:p-5 mb-4">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Select Cryptocurrency</label>
            <div className="relative">
              <button onClick={() => setShowDropdown(!showDropdown)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/10 hover:border-white/20 transition-all"
                data-testid="crypto-selector">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white" style={{ backgroundColor: selectedCrypto.color }}>
                    {selectedCrypto.symbol[0]}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold text-white">{selectedCrypto.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{selectedCrypto.symbol}</span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div className="absolute z-20 top-full mt-1 w-full bg-[#111827] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {CRYPTO_OPTIONS.map(c => (
                      <button key={c.id}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${selectedCrypto.id === c.id ? 'bg-white/[0.04]' : ''}`}
                        onClick={() => { setSelectedCrypto(c); setShowDropdown(false); }}
                        data-testid={`crypto-${c.id}`}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white" style={{ backgroundColor: c.color }}>
                          {c.symbol[0]}
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-semibold text-white">{c.name}</div>
                          <div className="text-[10px] text-gray-600">{c.network}</div>
                        </div>
                        {selectedCrypto.id === c.id && <Check className="w-4 h-4 text-electric ml-auto" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* QR Code & Address */}
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 sm:p-5">
            <div className="flex flex-col items-center">
              {/* QR Code */}
              <div className="p-3 rounded-2xl bg-white mb-4" data-testid="qr-code">
                <img src={qrUrl} alt="QR Code" className="w-[160px] h-[160px] sm:w-[180px] sm:h-[180px]" />
              </div>

              <div className="text-center mb-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Send {selectedCrypto.symbol} to this address</p>
                <p className="text-[10px] text-gray-600">{selectedCrypto.network}</p>
              </div>

              {/* Address */}
              <div className="w-full flex items-center gap-2 bg-black/30 rounded-xl p-3 border border-white/10">
                <code className="flex-1 text-xs font-mono text-gray-300 break-all select-all" data-testid="wallet-address">
                  {selectedCrypto.address}
                </code>
                <button onClick={copyAddress}
                  className={`shrink-0 p-2 rounded-lg transition-all ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  data-testid="copy-address">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Amount reference */}
              <div className="w-full mt-4">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Deposit Amount (for reference)</label>
                <div className="flex gap-1.5 mb-3">
                  {[50, 100, 250, 500, 1000].map(a => (
                    <button key={a}
                      className={`flex-1 py-2 rounded-lg text-[11px] font-mono font-bold transition-all ${
                        amount === a ? 'bg-electric text-white' : 'bg-white/[0.03] text-gray-500 hover:bg-white/[0.06]'
                      }`}
                      onClick={() => setAmount(a)}>${a}</button>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="w-full p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 mt-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-amber-400 font-semibold">Important</p>
                    <ul className="text-[10px] text-gray-500 mt-1 space-y-0.5">
                      <li>Only send {selectedCrypto.symbol} on the {selectedCrypto.network} network</li>
                      <li>Deposits are credited after network confirmation</li>
                      <li>Minimum deposit: $10 equivalent</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => navigate('/dashboard')}
            className="w-full mt-4 py-3 rounded-xl bg-white/5 text-gray-400 text-sm hover:bg-white/10 transition-all"
            data-testid="back-to-dashboard">Back to Dashboard</button>
        </motion.div>
      </main>
    </div>
  );
};

export default Deposit;
