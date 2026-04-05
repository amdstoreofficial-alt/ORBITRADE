import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, DollarSign, ArrowRight, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const AccountSetup = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    if (!selected) { toast.error('Please select an account type'); return; }
    setLoading(true);
    try {
      await api.post('/api/user/setup-account', { account_mode: selected });
      await refreshUser();
      if (selected === 'real') navigate('/deposit');
      else navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Setup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4" data-testid="account-setup">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-electric/[0.04] rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-emerald-500/[0.04] rounded-full blur-[100px]"></div>
      </div>

      <motion.div className="relative z-10 w-full max-w-2xl"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        
        <div className="text-center mb-8">
          <motion.div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-electric to-cyan-400 flex items-center justify-center mx-auto mb-4"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
            <TrendingUp className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome, {user?.full_name?.split(' ')[0] || 'Trader'}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">Choose your trading account to get started</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          {/* Demo Account */}
          <motion.button
            className={`relative text-left p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 ${
              selected === 'demo'
                ? 'border-amber-400 bg-amber-400/[0.06]'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
            }`}
            onClick={() => setSelected('demo')}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            data-testid="select-demo"
          >
            {selected === 'demo' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Demo Account</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">Practice risk-free with virtual funds. Perfect for learning and testing strategies.</p>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-400/[0.06] border border-amber-400/10">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-lg font-bold text-amber-400">$10,000</span>
              <span className="text-[10px] text-gray-600 uppercase">Virtual Funds</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {['Instant access, no deposit needed', 'Real market conditions', 'Reset balance anytime'].map((t, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] text-gray-500">
                  <div className="w-1 h-1 rounded-full bg-amber-400/60"></div>{t}
                </li>
              ))}
            </ul>
          </motion.button>

          {/* Real Account */}
          <motion.button
            className={`relative text-left p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 ${
              selected === 'real'
                ? 'border-emerald-400 bg-emerald-400/[0.06]'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
            }`}
            onClick={() => setSelected('real')}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            data-testid="select-real"
          >
            {selected === 'real' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
                <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Recommended</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center mb-3 mt-4 sm:mt-3">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Real Account</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">Trade with real money and withdraw your profits. Full access to all platform features.</p>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-400/[0.06] border border-emerald-400/10">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-semibold">Deposit to Start Trading</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {['Real profits & withdrawals', 'Affiliate program access', 'Priority support'].map((t, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] text-gray-500">
                  <div className="w-1 h-1 rounded-full bg-emerald-400/60"></div>{t}
                </li>
              ))}
            </ul>
          </motion.button>
        </div>

        <motion.button
          className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            selected
              ? 'bg-electric text-white hover:shadow-lg hover:shadow-electric/20'
              : 'bg-white/5 text-gray-600 cursor-not-allowed'
          }`}
          onClick={handleSetup}
          disabled={!selected || loading}
          whileHover={selected ? { scale: 1.01 } : {}}
          whileTap={selected ? { scale: 0.98 } : {}}
          data-testid="setup-continue"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              {selected === 'demo' ? 'Start Demo Trading' : selected === 'real' ? 'Continue to Deposit' : 'Select Account Type'}
              {selected && <ArrowRight className="w-4 h-4" />}
            </>
          )}
        </motion.button>

        <p className="text-center text-[11px] text-gray-600 mt-4">
          You can switch between Demo and Real accounts anytime from your dashboard
        </p>
      </motion.div>
    </div>
  );
};

export default AccountSetup;
