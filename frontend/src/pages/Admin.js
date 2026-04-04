import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, DollarSign, TrendingUp, Shield, BarChart3, Search, 
  ChevronDown, Check, X, Send, Megaphone, Eye, Edit3,
  UserCheck, UserX, Wallet, AlertCircle, Gift, Settings, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  
  // Promo state
  const [promoForm, setPromoForm] = useState({ name: '', bonus_percent: 50, min_deposit: 100, max_bonus: 500 });
  
  // User edit state
  const [editingUser, setEditingUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, withdrawRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/withdrawals')
      ]);
      setStats(statsRes.data);
      const usersData = usersRes.data?.users || usersRes.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
      const wData = withdrawRes.data?.withdrawals || withdrawRes.data || [];
      setWithdrawals(Array.isArray(wData) ? wData : []);
      try {
        const promoRes = await api.get('/api/admin/promotions');
        setPromotions(promoRes.data || []);
      } catch (e) {}
    } catch (e) { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  const updateUserStatus = async (userId, updates) => {
    try {
      await api.put(`/api/admin/users/${userId}`, updates);
      toast.success('User updated');
      fetchAll();
    } catch (e) { toast.error('Update failed'); }
  };

  const handleKycAction = async (userId, action) => {
    try {
      await api.post(`/api/admin/users/${userId}/kyc-action`, { action });
      toast.success(`KYC ${action}d`);
      fetchAll();
    } catch (e) { toast.error('KYC action failed'); }
  };

  const handleAdjustBalance = async (userId) => {
    if (!adjustAmount) return;
    try {
      await api.post(`/api/admin/users/${userId}/adjust-balance`, { amount: adjustAmount, reason: adjustReason });
      toast.success(`Balance adjusted by $${adjustAmount}`);
      setAdjustAmount(0);
      setAdjustReason('');
      setEditingUser(null);
      fetchAll();
    } catch (e) { toast.error('Adjustment failed'); }
  };

  const handleWithdrawalAction = async (wId, status) => {
    try {
      await api.put(`/api/admin/withdrawals/${wId}`, { status });
      toast.success(`Withdrawal ${status}`);
      fetchAll();
    } catch (e) { toast.error('Action failed'); }
  };

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) { toast.error('Title and message required'); return; }
    setBroadcasting(true);
    try {
      await api.post('/api/admin/broadcast', { title: broadcastTitle, message: broadcastMsg });
      toast.success('Broadcast sent to all users');
      setBroadcastTitle('');
      setBroadcastMsg('');
    } catch (e) { toast.error('Broadcast failed'); }
    finally { setBroadcasting(false); }
  };

  const createPromotion = async () => {
    if (!promoForm.name) { toast.error('Promotion name required'); return; }
    try {
      await api.post('/api/admin/promotions', promoForm);
      toast.success('Promotion created');
      setPromoForm({ name: '', bonus_percent: 50, min_deposit: 100, max_bonus: 500 });
      fetchAll();
    } catch (e) { toast.error('Failed to create promotion'); }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TABS = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'withdrawals', label: 'Withdrawals', icon: Wallet },
    { key: 'broadcast', label: 'Broadcast', icon: Megaphone },
    { key: 'promotions', label: 'Promos', icon: Gift },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-electric border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14]" data-testid="admin-page">
      <Navbar />
      <main className="pt-16 pb-8 px-3 sm:px-4 max-w-[1400px] mx-auto">
        <div className="mt-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Control Panel</h1>
            <p className="text-xs text-gray-500">Full platform management</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs text-gray-500">System Online</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1 custom-scrollbar">
          {TABS.map(tab => (
            <button key={tab.key}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-electric text-white' : 'bg-white/[0.03] text-gray-500 hover:text-white hover:bg-white/[0.06]'
              }`}
              onClick={() => setActiveTab(tab.key)}
              data-testid={`admin-tab-${tab.key}`}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
              {[
                { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'text-electric', border: 'border-electric/30' },
                { label: 'Active Trades', value: stats?.active_trades || 0, icon: Activity, color: 'text-amber-400', border: 'border-amber-400/30' },
                { label: 'Total Volume', value: `$${(stats?.total_volume || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400', border: 'border-emerald-500/30' },
                { label: 'Revenue', value: `$${(stats?.platform_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-cyan-400', border: 'border-cyan-500/30' },
              ].map((s, i) => (
                <div key={i} className={`bg-white/[0.02] rounded-xl border-l-2 ${s.border} p-3 sm:p-4`}>
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</span>
                  </div>
                  <div className={`font-mono text-lg sm:text-xl font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Recent Users */}
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.04] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.04]">
                <span className="text-xs font-bold text-white">Recent Users</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-gray-600 uppercase border-b border-white/[0.04]">
                      <th className="px-4 py-2">User</th><th className="px-4 py-2">Balance</th><th className="px-4 py-2">Mode</th><th className="px-4 py-2">KYC</th><th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 8).map((u, i) => (
                      <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] text-xs">
                        <td className="px-4 py-2">
                          <div className="font-semibold text-white">{u.full_name || u.email}</div>
                          <div className="text-[10px] text-gray-600">{u.email}</div>
                        </td>
                        <td className="px-4 py-2 font-mono text-emerald-400">${(u.balance || 0).toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            u.account_mode === 'demo' ? 'bg-amber-400/10 text-amber-400' : 'bg-emerald-400/10 text-emerald-400'
                          }`}>{(u.account_mode || '-').toUpperCase()}</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`text-[10px] font-bold ${
                            u.kyc_status === 'verified' ? 'text-emerald-400' : u.kyc_status === 'under_review' ? 'text-blue-400' : 'text-gray-500'
                          }`}>{(u.kyc_status || 'pending').toUpperCase()}</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`text-[10px] font-bold ${u.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>{(u.status || 'active').toUpperCase()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Search */}
            <div className="flex items-center gap-2 bg-white/[0.03] rounded-xl px-3 py-2 border border-white/[0.06] mb-4">
              <Search className="w-4 h-4 text-gray-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
                data-testid="admin-search" />
            </div>

            <div className="space-y-2">
              {filteredUsers.map((u, i) => (
                <div key={i} className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-electric/10 flex items-center justify-center text-sm font-bold text-electric shrink-0">
                        {(u.full_name || u.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{u.full_name || 'No Name'}</div>
                        <div className="text-[10px] text-gray-500">{u.email} | ID: {u.id}</div>
                        <div className="flex gap-1.5 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            u.account_mode === 'demo' ? 'bg-amber-400/10 text-amber-400' : 'bg-emerald-400/10 text-emerald-400'
                          }`}>{(u.account_mode || '-').toUpperCase()}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            u.kyc_status === 'verified' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'
                          }`}>KYC: {(u.kyc_status || 'pending').toUpperCase()}</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-white/5 text-gray-400">{(u.tier || 'basic').toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-sm text-emerald-400 mr-2">${(u.balance || 0).toFixed(2)}</span>
                      {/* KYC Actions */}
                      {u.kyc_status === 'under_review' && (
                        <>
                          <button onClick={() => handleKycAction(u.id, 'approve')}
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20"
                            data-testid={`kyc-approve-${u.id}`}>
                            <UserCheck className="w-3 h-3 inline mr-1" />Approve KYC
                          </button>
                          <button onClick={() => handleKycAction(u.id, 'reject')}
                            className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20">
                            <UserX className="w-3 h-3 inline mr-1" />Reject
                          </button>
                        </>
                      )}
                      {/* Status Toggle */}
                      <button onClick={() => updateUserStatus(u.id, { status: u.status === 'active' ? 'suspended' : 'active' })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          u.status === 'active' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}>
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      {/* Balance Adjust */}
                      <button onClick={() => setEditingUser(editingUser === u.id ? null : u.id)}
                        className="px-2 py-1 rounded-lg bg-electric/10 text-electric text-[10px] font-bold hover:bg-electric/20"
                        data-testid={`adjust-${u.id}`}>
                        <DollarSign className="w-3 h-3 inline mr-1" />Adjust
                      </button>
                    </div>
                  </div>

                  {/* Balance Adjustment Panel */}
                  <AnimatePresence>
                    {editingUser === u.id && (
                      <motion.div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row gap-2"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <input type="number" value={adjustAmount}
                          onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                          className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none w-full sm:w-32"
                          placeholder="Amount (+/-)" />
                        <input type="text" value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none flex-1"
                          placeholder="Reason..." />
                        <button onClick={() => handleAdjustBalance(u.id)}
                          className="px-4 py-2 rounded-lg bg-electric text-white text-xs font-bold hover:shadow-lg hover:shadow-electric/20 whitespace-nowrap">
                          Apply
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.04] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-gray-600 uppercase border-b border-white/[0.04]">
                      <th className="px-4 py-3">User</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Wallet</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-gray-600">No withdrawal requests</td></tr>
                    ) : withdrawals.map((w, i) => (
                      <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] text-xs">
                        <td className="px-4 py-3 text-white">{w.user_email || w.user_id}</td>
                        <td className="px-4 py-3 font-mono text-emerald-400">${w.amount?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-400">{w.method || 'crypto'}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-gray-500 max-w-[120px] truncate">{w.wallet_address || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                            w.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>{(w.status || 'pending').toUpperCase()}</span>
                        </td>
                        <td className="px-4 py-3">
                          {w.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => handleWithdrawalAction(w.id, 'approved')}
                                className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20">Approve</button>
                              <button onClick={() => handleWithdrawalAction(w.id, 'rejected')}
                                className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20">Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* BROADCAST TAB */}
        {activeTab === 'broadcast' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl">
            <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-electric" /> Send Broadcast to All Users
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Title</label>
                  <input type="text" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-electric/50"
                    placeholder="Notification title..." data-testid="broadcast-title" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Message</label>
                  <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-electric/50 resize-none"
                    rows={4} placeholder="Write your message..." data-testid="broadcast-message" />
                </div>
                <button onClick={sendBroadcast} disabled={broadcasting}
                  className="w-full py-3 rounded-xl bg-electric text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-electric/20 transition-all disabled:opacity-50"
                  data-testid="send-broadcast">
                  {broadcasting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Send to All Users</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* PROMOTIONS TAB */}
        {activeTab === 'promotions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Create Promo */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-electric" /> Create Promotion
                </h2>
                <div className="space-y-3">
                  <input type="text" value={promoForm.name} onChange={(e) => setPromoForm({...promoForm, name: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-electric/50"
                    placeholder="Promotion name..." data-testid="promo-name" />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-gray-600 block mb-1">Bonus %</label>
                      <input type="number" value={promoForm.bonus_percent} onChange={(e) => setPromoForm({...promoForm, bonus_percent: parseFloat(e.target.value) || 0})}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-xs text-white font-mono focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 block mb-1">Min Deposit</label>
                      <input type="number" value={promoForm.min_deposit} onChange={(e) => setPromoForm({...promoForm, min_deposit: parseFloat(e.target.value) || 0})}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-xs text-white font-mono focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 block mb-1">Max Bonus</label>
                      <input type="number" value={promoForm.max_bonus} onChange={(e) => setPromoForm({...promoForm, max_bonus: parseFloat(e.target.value) || 0})}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-xs text-white font-mono focus:outline-none" />
                    </div>
                  </div>
                  <button onClick={createPromotion}
                    className="w-full py-2.5 rounded-xl bg-electric text-white text-sm font-medium hover:shadow-lg hover:shadow-electric/20 transition-all"
                    data-testid="create-promo">Create Promotion</button>
                </div>
              </div>

              {/* Active Promos */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5">
                <h2 className="text-sm font-bold text-white mb-4">Active Promotions</h2>
                {promotions.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-8">No promotions yet</p>
                ) : (
                  <div className="space-y-2">
                    {promotions.map((p, i) => (
                      <div key={i} className="p-3 rounded-lg bg-black/20 border border-white/[0.04]">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-white">{p.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${p.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {p.active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <div className="flex gap-3 mt-1 text-[10px] text-gray-500">
                          <span>{p.bonus_percent}% bonus</span>
                          <span>Min: ${p.min_deposit}</span>
                          <span>Max: ${p.max_bonus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
