import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Users, Clock, DollarSign, Crown, Flame, Target, ArrowRight, Check, Calendar, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Tournaments = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('active');
  const [joining, setJoining] = useState(false);

  useEffect(() => { fetchTournaments(); }, []);
  useEffect(() => { if (activeTournament) fetchLeaderboard(activeTournament.id); }, [activeTournament]);

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/api/tournaments');
      setTournaments(res.data || []);
      const active = res.data?.find(t => t.status === 'active');
      if (active) setActiveTournament(active);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchLeaderboard = async (tournamentId) => {
    try {
      const [lbRes, statsRes] = await Promise.all([
        api.get(`/api/tournaments/${tournamentId}/leaderboard`),
        api.get(`/api/tournaments/${tournamentId}/my-stats`)
      ]);
      setLeaderboard(lbRes.data || []);
      setMyStats(statsRes.data);
    } catch (e) { console.error(e); }
  };

  const joinTournament = async (tournamentId) => {
    setJoining(true);
    try {
      await api.post(`/api/tournaments/${tournamentId}/join`);
      toast.success('Joined tournament! Start trading to climb the leaderboard.');
      fetchTournaments();
      fetchLeaderboard(tournamentId);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to join tournament');
    } finally { setJoining(false); }
  };

  const getTimeRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14]" data-testid="tournaments-page">
      <Navbar />
      <main className="pt-16 pb-8 px-3 sm:px-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" /> Trading Tournaments
              </h1>
              <p className="text-sm text-gray-500">Compete for prizes and glory</p>
            </div>
          </div>

          {/* Active Tournament Banner */}
          {activeTournament && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-r from-electric/20 via-purple-500/20 to-pink-500/20 border border-electric/30 p-5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-electric/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Live Now
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{activeTournament.tournament_type}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">{activeTournament.name}</h2>
                    <p className="text-sm text-gray-400">{activeTournament.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{activeTournament.participants_count || 0} traders</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <Clock className="w-4 h-4" />
                        <span>{getTimeRemaining(activeTournament.end_date)} left</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Prize Pool</span>
                      <div className="font-mono text-3xl font-black text-emerald-400">${activeTournament.prize_pool?.toLocaleString()}</div>
                    </div>
                    {myStats?.is_participant ? (
                      <div className="flex items-center gap-2 text-sm text-electric">
                        <Check className="w-4 h-4" /> You're in! Rank #{myStats.rank || '-'}
                      </div>
                    ) : (
                      <button onClick={() => joinTournament(activeTournament.id)} disabled={joining}
                        className="px-6 py-2.5 rounded-xl bg-electric text-white font-semibold text-sm hover:shadow-lg hover:shadow-electric/30 transition-all disabled:opacity-50 flex items-center gap-2"
                        data-testid="join-tournament">
                        {joining ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Join Tournament<ArrowRight className="w-4 h-4" /></>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Leaderboard */}
            <div className="lg:col-span-2 bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" /> Leaderboard
                </h3>
                {activeTournament && (
                  <span className="text-[10px] text-gray-500">{activeTournament.name}</span>
                )}
              </div>
              {leaderboard.length === 0 ? (
                <div className="p-10 text-center text-gray-600 text-sm">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No participants yet. Be the first to join!</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {leaderboard.slice(0, 10).map((entry, idx) => (
                    <div key={idx} className={`px-4 py-3 flex items-center justify-between ${entry.user_id === user?.id ? 'bg-electric/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 flex justify-center">{getRankIcon(entry.rank)}</div>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? 'bg-yellow-400/20 text-yellow-400' :
                          idx === 1 ? 'bg-gray-300/20 text-gray-300' :
                          idx === 2 ? 'bg-amber-600/20 text-amber-500' :
                          'bg-white/5 text-gray-400'
                        }`}>
                          {(entry.user_name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {entry.user_name || 'Anonymous'}
                            {entry.user_id === user?.id && <span className="text-electric text-[10px] ml-1">(You)</span>}
                          </div>
                          <div className="text-[10px] text-gray-600">{entry.total_trades} trades • {entry.win_rate?.toFixed(1)}% win</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-sm font-bold ${entry.total_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {entry.total_profit >= 0 ? '+' : ''}${entry.total_profit?.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-gray-600">profit</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prize Distribution & Rules */}
            <div className="space-y-4">
              {/* Prize Distribution */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Prize Distribution
                </h3>
                {activeTournament?.prizes ? (
                  <div className="space-y-2">
                    {activeTournament.prizes.map((prize, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                        <div className="flex items-center gap-2">
                          {getRankIcon(idx + 1)}
                          <span className="text-xs text-gray-400">{idx === 0 ? '1st Place' : idx === 1 ? '2nd Place' : idx === 2 ? '3rd Place' : `${idx + 1}th Place`}</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-emerald-400">${prize.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                      <div className="flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" /><span className="text-xs text-gray-400">1st Place</span></div>
                      <span className="font-mono text-sm font-bold text-emerald-400">50%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                      <div className="flex items-center gap-2"><Medal className="w-5 h-5 text-gray-300" /><span className="text-xs text-gray-400">2nd Place</span></div>
                      <span className="font-mono text-sm font-bold text-emerald-400">30%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                      <div className="flex items-center gap-2"><Medal className="w-5 h-5 text-amber-600" /><span className="text-xs text-gray-400">3rd Place</span></div>
                      <span className="font-mono text-sm font-bold text-emerald-400">20%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rules */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-electric" /> How It Works
                </h3>
                <div className="space-y-3 text-xs text-gray-400">
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-electric/10 flex items-center justify-center text-[10px] font-bold text-electric shrink-0">1</div>
                    <p>Join the tournament (free entry)</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-electric/10 flex items-center justify-center text-[10px] font-bold text-electric shrink-0">2</div>
                    <p>Trade normally during tournament period</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-electric/10 flex items-center justify-center text-[10px] font-bold text-electric shrink-0">3</div>
                    <p>Ranked by total profit (not %)</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-400/10 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">$</div>
                    <p>Winners get prizes added to balance</p>
                  </div>
                </div>
              </div>

              {/* My Stats */}
              {myStats?.is_participant && (
                <div className="bg-electric/5 rounded-xl border border-electric/20 p-4">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-electric" /> Your Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-[10px] text-gray-500">Rank</div>
                      <div className="font-mono text-lg font-bold text-white">#{myStats.rank || '-'}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-[10px] text-gray-500">Profit</div>
                      <div className={`font-mono text-lg font-bold ${myStats.total_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${myStats.total_profit?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-[10px] text-gray-500">Trades</div>
                      <div className="font-mono text-lg font-bold text-white">{myStats.total_trades || 0}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-[10px] text-gray-500">Win Rate</div>
                      <div className="font-mono text-lg font-bold text-white">{myStats.win_rate?.toFixed(1) || 0}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Past Tournaments */}
          {tournaments.filter(t => t.status === 'completed').length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-white mb-3">Past Tournaments</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tournaments.filter(t => t.status === 'completed').slice(0, 6).map((t, idx) => (
                  <div key={idx} className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-semibold text-white">{t.name}</h4>
                      <span className="text-[9px] text-gray-500 uppercase">Completed</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{t.participants_count} traders</span>
                      <span className="text-emerald-400">${t.prize_pool?.toLocaleString()} pool</span>
                    </div>
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

export default Tournaments;
