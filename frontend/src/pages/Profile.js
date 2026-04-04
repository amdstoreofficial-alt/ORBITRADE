import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Calendar, Shield, Upload, Check, 
  AlertCircle, FileText, Camera, CreditCard, ChevronRight, Edit3, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

const STATUS_COLORS = {
  pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  documents_uploaded: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  under_review: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const KYC_DOC_TYPES = [
  { key: 'id_front', label: 'ID Card (Front)', icon: CreditCard, desc: 'Government-issued photo ID' },
  { key: 'id_back', label: 'ID Card (Back)', icon: CreditCard, desc: 'Back side of your ID' },
  { key: 'selfie', label: 'Selfie with ID', icon: Camera, desc: 'Hold your ID next to your face' },
  { key: 'proof_of_address', label: 'Proof of Address', icon: FileText, desc: 'Utility bill or bank statement' },
];

const Profile = () => {
  const { user, refreshUser, isDemoMode, accountMode } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', country: '', date_of_birth: '' });
  const [saving, setSaving] = useState(false);
  const [kycDocs, setKycDocs] = useState([]);
  const [uploading, setUploading] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/user/profile');
      setProfile(res.data);
      setForm({
        full_name: res.data.full_name || '',
        phone: res.data.phone || '',
        country: res.data.country || '',
        date_of_birth: res.data.date_of_birth || ''
      });
      const kycRes = await api.get('/api/user/kyc/status');
      setKycDocs(kycRes.data.documents || []);
    } catch (e) { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.patch('/api/user/profile', form);
      toast.success('Profile updated');
      setEditing(false);
      await refreshUser();
      await fetchProfile();
    } catch (e) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleFileUpload = async (docType, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return; }
    
    setUploading(docType);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await api.post('/api/user/kyc/upload', {
          document_type: docType, file_data: reader.result, file_name: file.name
        });
        toast.success('Document uploaded');
        await fetchProfile();
      } catch (e) { toast.error('Upload failed'); }
      finally { setUploading(null); }
    };
    reader.readAsDataURL(file);
  };

  const getDocStatus = (docType) => kycDocs.find(d => d.document_type === docType);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-electric border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14]" data-testid="profile-page">
      <Navbar />
      <main className="pt-16 pb-8 px-3 sm:px-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div className="mt-4 sm:mt-6 mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-electric/5 to-transparent rounded-2xl p-5 border border-electric/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-electric to-cyan-400 flex items-center justify-center text-2xl font-bold text-[#080c14] shrink-0">
                {(profile?.full_name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{profile?.full_name || 'User'}</h1>
                <p className="text-sm text-gray-500">{profile?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[profile?.kyc_status || 'pending']}`}>
                    KYC: {(profile?.kyc_status || 'pending').replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    accountMode === 'demo' ? 'bg-amber-400/10 text-amber-400' : 'bg-emerald-400/10 text-emerald-400'
                  }`}>{(accountMode || 'demo').toUpperCase()}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setEditing(!editing)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2 transition-all"
              data-testid="edit-profile-btn">
              {editing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit3 className="w-4 h-4" /> Edit Profile</>}
            </button>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Personal Info */}
          <motion.div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-electric" /> Personal Information
            </h2>
            <div className="space-y-3">
              {[
                { icon: User, label: 'Full Name', key: 'full_name', type: 'text' },
                { icon: Phone, label: 'Phone', key: 'phone', type: 'tel' },
                { icon: MapPin, label: 'Country', key: 'country', type: 'text' },
                { icon: Calendar, label: 'Date of Birth', key: 'date_of_birth', type: 'date' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[10px] text-gray-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <field.icon className="w-3 h-3" /> {field.label}
                  </label>
                  {editing ? (
                    <input type={field.type} value={form[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-electric/50"
                      data-testid={`input-${field.key}`} />
                  ) : (
                    <p className="text-sm text-gray-300 pl-1">{form[field.key] || '-'}</p>
                  )}
                </div>
              ))}
              {editing && (
                <button onClick={saveProfile} disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-electric text-white text-sm font-medium hover:shadow-lg hover:shadow-electric/20 transition-all disabled:opacity-50"
                  data-testid="save-profile-btn">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </motion.div>

          {/* Account Info */}
          <motion.div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-electric" /> Account Details
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Email', value: profile?.email },
                { label: 'Account ID', value: profile?.id },
                { label: 'Tier', value: (profile?.tier || 'basic').toUpperCase() },
                { label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-' },
                { label: 'Status', value: (profile?.status || 'active').toUpperCase() },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/[0.04]">
                  <span className="text-[11px] text-gray-500">{item.label}</span>
                  <span className="text-xs font-mono text-gray-300">{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[11px] text-gray-500">Demo Balance</span>
                <span className="text-xs font-mono text-amber-400">${(profile?.demo_balance || 10000).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[11px] text-gray-500">Real Balance</span>
                <span className="text-xs font-mono text-emerald-400">${(profile?.real_balance || 0).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>

          {/* KYC Verification */}
          <motion.div className="sm:col-span-2 bg-white/[0.02] rounded-xl border border-white/[0.06] p-5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-electric" /> KYC Verification
              </h2>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[profile?.kyc_status || 'pending']}`}>
                {(profile?.kyc_status || 'pending').replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            
            {profile?.kyc_status === 'verified' ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <Check className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Identity Verified</p>
                  <p className="text-xs text-gray-500">Your account has been fully verified</p>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {KYC_DOC_TYPES.map(doc => {
                  const status = getDocStatus(doc.key);
                  const isUploaded = !!status;
                  const isUploading = uploading === doc.key;
                  return (
                    <div key={doc.key}
                      className={`relative p-4 rounded-xl border transition-all ${
                        isUploaded ? 'bg-emerald-500/[0.03] border-emerald-500/20' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                      }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isUploaded ? 'bg-emerald-500/10' : 'bg-white/5'
                        }`}>
                          {isUploaded ? <Check className="w-4 h-4 text-emerald-400" /> : <doc.icon className="w-4 h-4 text-gray-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white">{doc.label}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">{doc.desc}</p>
                          {isUploaded && (
                            <span className="text-[9px] text-emerald-400 mt-1 inline-block">{status.status === 'approved' ? 'Approved' : 'Pending Review'}</span>
                          )}
                        </div>
                        {!isUploaded && (
                          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-electric/10 text-electric text-[10px] font-bold hover:bg-electric/20 transition-all shrink-0">
                            {isUploading ? <div className="w-3 h-3 border border-electric border-t-transparent rounded-full animate-spin" /> : 'Upload'}
                            <input type="file" accept="image/*,.pdf" className="hidden"
                              onChange={(e) => handleFileUpload(doc.key, e.target.files[0])}
                              data-testid={`upload-${doc.key}`} />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
