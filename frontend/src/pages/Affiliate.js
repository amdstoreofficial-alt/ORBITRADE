import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link2, Copy, Users, DollarSign, TrendingUp, Check, ShieldAlert, Layers, PiggyBank, Share2, ArrowUpRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Affiliate = () => {
  const { user, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [commissionStructure, setCommissionStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    try {
      const [statsRes, structureRes] = await Promise.all([
        api.get('/api/affiliate/stats'),
        api.get('/api/affiliate/commission-structure')
      ]);
      setStats(statsRes.data);
      setCommissionStructure(structureRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  
  const copyLink = () => {
    const link = `${window.location.origin}/auth?ref=${stats?.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isDemoMode) {
    return (
      <div className="min-h-screen bg-app" data-testid="affiliate-page">
        <Navbar />
        <main className="pt-16 pb-8 px-3 sm:px-6 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Demo Account</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">The affiliate program is only available for real accounts.</p>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 rounded-xl bg-electric text-white text-sm font-medium" data-testid="back-to-dashboard">Back to Dashboard</button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app" data-testid="affiliate-page">
      <Navbar />
      <main className="pt-16 pb-8 px-3 sm:px-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Affiliate Program</h1>
          <p className="text-sm text-gray-500 mb-6">Earn commissions from deposits and trading profits of your referrals</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
            <div className="bg-white/[0.02] rounded-xl border-l-2 border-electric/50 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-electric" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total Referrals</span>
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-white">{stats?.total_referrals || 0}</div>
            </div>
            <div className="bg-white/[0.02] rounded-xl border-l-2 border-emerald-500/50 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total Earned</span>
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-400">${stats?.total_earned?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="bg-white/[0.02] rounded-xl border-l-2 border-amber-500/50 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <PiggyBank className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Direct Commission</span>
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-amber-400">${stats?.direct_earned?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="bg-white/[0.02] rounded-xl border-l-2 border-cyan-500/50 p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Revenue Share</span>
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-cyan-400">${stats?.revenue_share_earned?.toFixed(2) || '0.00'}</div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 sm:p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-4 h-4 text-electric" />
              <h3 className="text-sm font-bold text-white">Your Referral Link</h3>
            </div>
            <div className="flex gap-2">
              <input type="text" readOnly value={`${window.location.origin}/auth?ref=${stats?.referral_code}`}
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 font-mono focus:outline-none"
                data-testid="referral-link" />
              <button onClick={copyLink}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-electric text-white hover:shadow-lg hover:shadow-electric/20'}`}
                data-testid="copy-link">
                {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-2">Your code: <span className="font-mono text-electric">{stats?.referral_code}</span></p>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            {/* Commission Structure */}
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-electric" />
                <h3 className="text-sm font-bold text-white">Commission Structure</h3>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">Direct Commission (Level 1)</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">{commissionStructure?.direct_percent || 5}%</span>
                  </div>
                  <p className="text-[10px] text-gray-600">Earned on direct referral deposits</p>
                </div>
                
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">Indirect Commission (Level 2+)</span>
                    <span className="font-mono text-sm font-bold text-amber-400">{commissionStructure?.indirect_percent || 2}%</span>
                  </div>
                  <p className="text-[10px] text-gray-600">Earned on deposits from {commissionStructure?.levels || 3} levels deep</p>
                </div>
                
                <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">Revenue Share</span>
                    <span className="font-mono text-sm font-bold text-cyan-400">{commissionStructure?.revenue_share_percent || 10}%</span>
                  </div>
                  <p className="text-[10px] text-gray-600">Earned on trading profits of your referrals</p>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 sm:p-5">
              <h3 className="text-sm font-bold text-white mb-4">How It Works</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-electric">1</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white mb-0.5">Share Your Link</h4>
                    <p className="text-[10px] text-gray-500">Invite friends using your unique referral link</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-emerald-400">2</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white mb-0.5">They Deposit & Trade</h4>
                    <p className="text-[10px] text-gray-500">Earn commission on their deposits instantly</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-cyan-400">3</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white mb-0.5">Earn Revenue Share</h4>
                    <p className="text-[10px] text-gray-500">Get % of their trading profits automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Commissions */}
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-white/[0.04]">
              <h3 className="text-sm font-bold text-white">Recent Commissions</h3>
            </div>
            {!stats?.recent_commissions?.length ? (
              <div className="p-8 text-center text-gray-600 text-xs">
                <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No commissions yet. Start sharing your link!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {stats.recent_commissions.map((c, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        c.commission_type === 'direct' ? 'bg-emerald-500/10' : c.commission_type === 'indirect' ? 'bg-amber-500/10' : 'bg-cyan-500/10'
                      }`}>
                        {c.commission_type === 'direct' ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> :
                         c.commission_type === 'indirect' ? <Layers className="w-4 h-4 text-amber-400" /> :
                         <TrendingUp className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white capitalize">{c.commission_type?.replace('_', ' ')} Commission</div>
                        <div className="text-[10px] text-gray-600">From {c.source} of ${c.source_amount?.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-emerald-400">+${c.amount?.toFixed(2)}</div>
                      <div className="text-[9px] text-gray-600">{new Date(c.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Referrals List */}
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.04] flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">Your Referrals</h3>
              <span className="text-[10px] text-gray-600">{stats?.referrals?.length || 0} total</span>
            </div>
            {!stats?.referrals?.length ? (
              <div className="p-8 text-center text-gray-600 text-xs">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No referrals yet. Share your link to get started!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {stats.referrals.map((r, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-electric/10 flex items-center justify-center text-xs font-bold text-electric">
                        {(r.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{r.email?.split('@')[0]}***</div>
                        <div className="text-[10px] text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Joined {new Date(r.joined).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Affiliate;
