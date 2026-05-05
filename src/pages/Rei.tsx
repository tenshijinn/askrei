import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import reiLogo from '@/assets/rei-logo-new.png';
import reiSplit from '@/assets/rei-split.png';
import xVerifiedBadge from '@/assets/x-verified-badge.png';
import { AudioRecorder } from '@/components/AudioRecorder';
import ReiChatbot from '@/components/ReiChatbot';
import { PostToRei } from '@/components/PostToRei';
import { useToast } from '@/hooks/use-toast';
import { Check, Twitter, Shield, AlertCircle, Info, Sparkles, Briefcase, CheckCircle2, Edit2, LogOut, UserCircle, Loader2, X as XIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReiEarningsHub } from '@/components/ReiEarningsHub';
import { Progress } from '@/components/ui/progress';
import { ReiAnalysisOverlay, type AnalysisStage } from '@/components/ReiAnalysisOverlay';

interface TwitterUser { x_user_id: string; handle: string; display_name: string; profile_image_url?: string; verified: boolean; }
interface VerificationStatus { bluechip_verified: boolean; verification_type: string | null; }
type RoleTag = 'dev' | 'product' | 'research' | 'community' | 'design' | 'ops';

const ROLE_OPTIONS: { value: RoleTag; label: string }[] = [
  { value: 'dev', label: 'Developer' }, { value: 'product', label: 'Product' }, { value: 'research', label: 'Research' },
  { value: 'community', label: 'Community' }, { value: 'design', label: 'Design' }, { value: 'ops', label: 'Operations' },
];

export default function Rei() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [twitterUser, setTwitterUser] = useState<TwitterUser | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);
  const [noAccountFound, setNoAccountFound] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<RoleTag[]>([]);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmittingWhitelist, setIsSubmittingWhitelist] = useState(false);
  const [whitelistSubmitted, setWhitelistSubmitted] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingRegistration, setIsLoadingRegistration] = useState(false);
  const [useExistingTranscript, setUseExistingTranscript] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'askrei' | 'post'>('askrei');
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState(0);

  useEffect(() => {
    const restoreTwitterState = async () => {
      try {
        const storedTwitterUser = localStorage.getItem('rei_twitter_user');
        const storedVerification = localStorage.getItem('rei_verification_status');
        if (storedTwitterUser) { setTwitterUser(JSON.parse(storedTwitterUser)); if (storedVerification) setVerificationStatus(JSON.parse(storedVerification)); }
      } catch (error) { console.error('Error restoring Twitter state:', error); }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); setUser(session?.user ?? null); });
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setUser(session?.user ?? null); });
    restoreTwitterState();
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code'); const state = params.get('state');
    const storedVerifier = sessionStorage.getItem('twitter_code_verifier_rei');
    if (code && state && storedVerifier && !twitterUser && !isProcessingCallback) { window.history.replaceState({}, '', '/rei'); handleTwitterCallback(code); }
  }, [twitterUser, isProcessingCallback]);

  useEffect(() => { if (twitterUser && step === 1) setStep(2); }, [twitterUser]);
  useEffect(() => { if (connected && twitterUser && step === 2) setStep(3); }, [connected, twitterUser]);

  useEffect(() => {
    const checkExistingRegistration = async () => {
      if (!twitterUser || checkedUserId === twitterUser.x_user_id || isLoadingRegistration) return;
      setIsLoadingRegistration(true);
      const storedMode = sessionStorage.getItem('rei_auth_mode') as 'signin' | 'signup' | null;
      try {
        const { data: response, error } = await supabase.functions.invoke('check-rei-registration', { body: { x_user_id: twitterUser.x_user_id } });
        const data = response?.data;
        if (error) { console.error('Error fetching registration:', error); }
        else if (data) { setRegistrationData(data); setIsSuccess(true); setPortfolioUrl(data.portfolio_url || ''); setSelectedRoles(data.role_tags || []); setConsent(true); setNoAccountFound(false); }
        else { if (storedMode === 'signin') { setNoAccountFound(true); setTwitterUser(null); localStorage.removeItem('rei_twitter_user'); localStorage.removeItem('rei_verification_status'); toast({ title: 'No Account Found', description: 'No existing account found with this X account. Please sign up to create one.', variant: 'destructive' }); } }
        setCheckedUserId(twitterUser.x_user_id);
      } catch (error) { console.error('Error checking registration:', error); }
      finally { setIsLoadingRegistration(false); sessionStorage.removeItem('rei_auth_mode'); }
    };
    checkExistingRegistration();
  }, [twitterUser, checkedUserId, isLoadingRegistration]);

  const handleTwitterLogin = async (mode: 'signin' | 'signup') => {
    try {
      setAuthMode(mode); setNoAccountFound(false); sessionStorage.setItem('rei_auth_mode', mode);
      const redirectUri = `${window.location.origin}/rei`;
      const { data, error } = await supabase.functions.invoke('twitter-oauth', { body: { action: 'getAuthUrl', redirectUri } });
      if (error) throw error;
      sessionStorage.setItem('twitter_code_verifier_rei', data.codeVerifier);
      window.location.href = data.authUrl;
    } catch (error) { toast({ title: 'Error', description: 'Failed to initiate Twitter login', variant: 'destructive' }); }
  };

  const handleTwitterCallback = async (code: string) => {
    setIsProcessingCallback(true);
    try {
      const storedVerifier = sessionStorage.getItem('twitter_code_verifier_rei'); sessionStorage.removeItem('twitter_code_verifier_rei');
      const redirectUri = `${window.location.origin}/rei`;
      const { data, error } = await supabase.functions.invoke('twitter-oauth', { body: { action: 'exchangeToken', code, codeVerifier: storedVerifier, redirectUri } });
      if (error || data?.error === 'must_follow_askrei') {
        const isFollowError = data?.error === 'must_follow_askrei' || (error?.message ?? '').includes('must_follow_askrei');
        if (isFollowError) {
          toast({ title: 'Follow @askrei_ to continue', description: 'You must follow @askrei_ on X (Twitter) before signing in.', variant: 'destructive' });
          setIsProcessingCallback(false);
          return;
        }
        if (error) throw error;
      }
      const storedMode = sessionStorage.getItem('rei_auth_mode') as 'signin' | 'signup' | null;
      if (storedMode === 'signup' && !data.user.verified) { toast({ title: 'Verified Account Required', description: 'Only verified X (Twitter) accounts with a checkmark can register with Rei.', variant: 'destructive' }); setIsProcessingCallback(false); return; }
      setTwitterUser(data.user);
      setVerificationStatus({ bluechip_verified: data.bluechip_verified, verification_type: data.verification_type });
      localStorage.setItem('rei_twitter_user', JSON.stringify(data.user));
      localStorage.setItem('rei_verification_status', JSON.stringify({ bluechip_verified: data.bluechip_verified, verification_type: data.verification_type }));
      window.history.replaceState({}, '', '/rei');
      toast({ title: 'Identity Verified!', description: `Welcome, @${data.user.handle}!` });
    } catch (error) { toast({ title: 'Error', description: 'Failed to complete Twitter login', variant: 'destructive' }); }
    finally { setIsProcessingCallback(false); }
  };

  const handleAudioReady = (blob: Blob) => { setAudioBlob(blob); toast({ title: 'Audio Ready', description: 'Your audio introduction is ready to submit' }); };
  const toggleRole = (role: RoleTag) => { setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]); };

  const handleSubmit = async () => {
    const hasValidAudio = audioBlob || (useExistingTranscript && registrationData?.file_path);
    if (!hasValidAudio || !publicKey || !consent || !twitterUser) return;
    setIsSubmitting(true);
    setAnalysisError(null);
    setUploadPercent(0);

    // Time-based stage advancement (real completion always wins)
    const stageTimers: ReturnType<typeof setTimeout>[] = [];
    const scheduleStages = () => {
      stageTimers.push(setTimeout(() => setAnalysisStage((s) => (s === 'transcribing' ? 'analyzing' : s)), 6000));
      stageTimers.push(setTimeout(() => setAnalysisStage((s) => (s === 'analyzing' ? 'categorizing' : s)), 16000));
    };
    const clearStageTimers = () => stageTimers.forEach(clearTimeout);

    try {
      let filePath: string;
      if (useExistingTranscript && registrationData?.file_path) {
        filePath = registrationData.file_path;
        // Skip upload stage for re-analyze
        setAnalysisStage('transcribing');
        scheduleStages();
      } else if (audioBlob) {
        setAnalysisStage('uploading');
        const fileName = `${twitterUser.x_user_id}_${Date.now()}_audio.webm`;
        filePath = fileName;
        // Simulate upload progress (Supabase JS doesn't expose progress events)
        const uploadInterval = setInterval(() => {
          setUploadPercent((p) => (p < 90 ? p + 8 : p));
        }, 200);
        const { error: uploadError } = await supabase.storage.from('rei-contributor-files').upload(filePath, audioBlob);
        clearInterval(uploadInterval);
        if (uploadError) throw uploadError;
        setUploadPercent(100);
        setAnalysisStage('transcribing');
        scheduleStages();
      } else {
        throw new Error('No audio available');
      }

      const { data, error } = await supabase.functions.invoke('submit-rei-registration', { body: { x_user_id: twitterUser.x_user_id, handle: twitterUser.handle, display_name: twitterUser.display_name, profile_image_url: twitterUser.profile_image_url, verified: twitterUser.verified, wallet_address: publicKey.toString(), file_path: filePath, portfolio_url: portfolioUrl || null, role_tags: selectedRoles, consent: true, reanalyze: useExistingTranscript } });
      clearStageTimers();
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data && data.registration) {
        setAnalysisStage('done');
        setTimeout(() => {
          setRegistrationData(data.registration);
          setIsSuccess(true);
          setIsEditMode(false);
          setUseExistingTranscript(false);
          setAnalysisStage(null);
        }, 900);
        toast({ title: 'Success!', description: useExistingTranscript ? 'Profile re-analyzed!' : (isEditMode ? 'Profile updated!' : (data.message || 'Registration successful!')) });
      } else {
        throw new Error('Registration succeeded but no data returned');
      }
    } catch (error: any) {
      clearStageTimers();
      const message = error?.message || error?.error?.message || 'Failed to submit registration';
      setAnalysisError(message);
      setAnalysisStage('error');
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeAnalysisOverlay = () => {
    setAnalysisStage(null);
    setAnalysisError(null);
    setUploadPercent(0);
  };

  const handleWhitelistRequest = async () => {
    if (!twitterUser) return;
    setIsSubmittingWhitelist(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-whitelist-request', { body: { twitter_handle: twitterUser.handle, x_user_id: twitterUser.x_user_id, display_name: twitterUser.display_name, profile_image_url: twitterUser.profile_image_url } });
      if (error) throw error;
      setWhitelistSubmitted(true); toast({ title: data.success ? 'Request Submitted!' : 'Already Submitted', description: data.message });
    } catch (error) { toast({ title: 'Error', description: 'Failed to submit whitelist request', variant: 'destructive' }); }
    finally { setIsSubmittingWhitelist(false); }
  };

  const hasValidAudio = audioBlob || (useExistingTranscript && registrationData?.file_path);
  const canSubmit = hasValidAudio && publicKey && consent && selectedRoles.length > 0 && twitterUser;

  const handleLogout = () => {
    setTwitterUser(null); setRegistrationData(null); setIsSuccess(false); setStep(1); setAuthMode(null); setNoAccountFound(false); setActiveTab('profile');
    localStorage.removeItem('rei_twitter_user'); localStorage.removeItem('rei_verification_status');
    sessionStorage.removeItem('twitter_code_verifier_rei'); sessionStorage.removeItem('rei_auth_mode');
  };

  // ==================== LOGGED IN VIEW ====================
  if (isSuccess && registrationData && !isEditMode) {
    const analysis = registrationData.profile_analysis as any;
    return (
      <div className="rei-theme flex flex-col h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
        {(registrationData?.wallet_address || publicKey) && <ReiEarningsHub registrationWallet={registrationData?.wallet_address} connectedWallet={publicKey?.toString()} xUserId={twitterUser?.x_user_id} />}
        <div className="fixed top-0 left-0 right-0 z-50" style={{ background: '#0a0a0a', borderBottom: '0.5px solid hsla(0,0%,100%,0.08)' }}>
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <img src={reiLogo} alt="REI" className="h-10 w-auto" style={{ opacity: 0.95 }} />
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'btn-manga btn-manga-primary' : 'rei-chip'} style={{ padding: twitterUser?.profile_image_url ? '3px' : '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', ...(activeTab === 'profile' ? { borderRadius: '28px', background: '#f0ede8', color: '#0a0a0a', border: 'none' } : {}) }} title="Profile">
                {twitterUser?.profile_image_url ? (
                  <img src={twitterUser.profile_image_url} alt={twitterUser.handle || 'Profile'} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', display: 'block', boxShadow: activeTab === 'profile' ? '0 0 0 1.5px #0a0a0a' : 'none' }} />
                ) : (
                  <UserCircle style={{ width: '14px', height: '14px' }} />
                )}
              </button>
              <button onClick={handleLogout} className="rei-chip" style={{ padding: '5px 12px', fontSize: '11px' }}><LogOut style={{ width: '12px', height: '12px', color: '#a09e9a' }} />Logout</button>
            </div>
          </div>
        </div>
        <div className="pt-16 px-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 mt-4 mb-4">
              {[{ key: 'askrei' as const, label: 'AskRei' }, { key: 'post' as const, label: 'Promote' }].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={activeTab === tab.key ? 'btn-manga btn-manga-primary' : 'rei-chip'} style={{ padding: '7px 18px', fontSize: '12px', fontFamily: "'SF Mono', 'Consolas', monospace", ...(activeTab === tab.key ? { borderRadius: '28px', background: '#f0ede8', color: '#0a0a0a', border: 'none', fontWeight: 500 } : {}) }}>{tab.label}</button>
              ))}
              {['Post Tasks', 'Post Gigs'].map(label => (<button key={label} disabled className="rei-chip" style={{ padding: '7px 18px', fontSize: '12px', fontFamily: "'SF Mono', 'Consolas', monospace", opacity: 0.35, cursor: 'not-allowed' }} title="Coming soon">{label}</button>))}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {activeTab === 'profile' && (
            <div className="overflow-y-auto h-full scrollbar-hide">
              <div className="max-w-4xl mx-auto px-4 pb-20 space-y-4" style={{ marginTop: '8px' }}>
                <div className="rei-surface" style={{ padding: '24px' }}>
                  <div className="flex items-start gap-4">
                    {twitterUser?.profile_image_url && <img src={twitterUser.profile_image_url} alt={twitterUser.handle} className="h-14 w-14 rounded-full flex-shrink-0" />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#f0ede8', letterSpacing: '-0.02em', margin: 0 }}>{registrationData.display_name}</h2>
                        {registrationData.verified && <span className="rei-chip" style={{ padding: '2px 8px', fontSize: '9px' }}>Verified</span>}
                      </div>
                      <p style={{ fontSize: '13px', color: '#5c5a57', marginTop: '2px' }}>@{registrationData.handle}</p>
                      {registrationData.role_tags?.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{registrationData.role_tags.map((role: string) => <span key={role} className="rei-chip" style={{ padding: '4px 10px', fontSize: '10px' }}><span className="rei-chip-dot" />{ROLE_OPTIONS.find(r => r.value === role)?.label || role}</span>)}</div>}
                    </div>
                    {registrationData.profile_score && <div className="flex-shrink-0 text-right"><div style={{ fontSize: '36px', fontWeight: 300, color: '#e8c4b8', lineHeight: 1 }}>{Math.round(registrationData.profile_score)}</div><div style={{ fontSize: '11px', color: '#5c5a57', marginTop: '2px' }}>/100</div></div>}
                  </div>
                  {analysis?.wallet_verification?.verified && <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '0.5px solid hsla(0,0%,100%,0.06)' }}><Shield className="h-3.5 w-3.5" style={{ color: '#e8c4b8' }} /><span style={{ fontSize: '11px', color: '#a09e9a' }}>Wallet verified · {analysis.wallet_verification.chain} · {analysis.wallet_verification.account_age_days}d old · {analysis.wallet_verification.transaction_count} txns</span></div>}
                </div>
                {analysis && <div className="rei-surface" style={{ padding: '24px' }}>
                  <span className="rei-section-label">Capabilities</span>
                  {analysis.category_scores && <div className="grid grid-cols-2 gap-3 mb-5">{Object.entries(analysis.category_scores).map(([category, score]: [string, any]) => <div key={category} className="rei-stat-card" style={{ padding: '12px' }}><div className="flex justify-between items-center mb-2"><span style={{ fontSize: '11px', textTransform: 'capitalize', color: '#5c5a57', letterSpacing: '0.04em' }}>{category.replace('_', ' ')}</span><span style={{ fontSize: '13px', fontWeight: 500, color: '#f0ede8' }}>{score}/25</span></div><Progress value={(score / 25) * 100} className="h-1.5" /></div>)}</div>}
                  {analysis.key_strengths?.length > 0 && <div><div className="rei-section-label">Key Strengths</div><div className="space-y-1.5">{analysis.key_strengths.map((strength: string, idx: number) => <div key={idx} className="flex items-start gap-2" style={{ fontSize: '13px', color: '#a09e9a' }}><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: '#e8c4b8' }} /><span>{strength}</span></div>)}</div></div>}
                </div>}
                <button onClick={() => setIsEditMode(true)} className="btn-manga btn-manga-outline w-full" style={{ borderRadius: '28px', padding: '11px 22px', fontSize: '13px', cursor: 'pointer' }}>Edit Profile</button>
              </div>
            </div>
          )}
          {activeTab === 'askrei' && <div className="overflow-y-auto h-full scrollbar-hide"><div className="max-w-4xl mx-auto px-4 pb-20" style={{ borderLeft: '0.5px solid hsla(0,0%,100%,0.08)', borderRight: '0.5px solid hsla(0,0%,100%,0.08)', minHeight: '100%' }}><ReiChatbot walletAddress={registrationData.wallet_address} userMode="talent" twitterHandle={twitterUser?.handle} /></div></div>}
          {activeTab === 'post' && <div className="overflow-y-auto h-full scrollbar-hide"><div className="max-w-4xl mx-auto px-4 pb-20"><PostToRei /></div></div>}
        </div>
      </div>
    );
  }

  // ==================== LOGIN / REGISTRATION VIEW ====================
  return (
    <div className="rei-theme min-h-screen flex flex-col md:flex-row" style={{ background: '#0a0a0a' }}>
      <div className="w-full md:w-1/2 min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-6 py-10 md:p-[100px]">
          <div className="w-full max-w-2xl mb-8">
            <h1 style={{ fontSize: '30px', fontWeight: 300, color: '#f0ede8', letterSpacing: '-0.025em', marginBottom: '8px' }}>Rei Proof-Of-Talent Portal</h1>
            <div className="flex items-center gap-2">{[1, 2, 3].map((s) => <div key={s} className="flex-1"><div style={{ height: '3px', borderRadius: '2px', background: s <= step ? '#e8c4b8' : '#1e1e1e', transition: 'background 0.3s' }} /></div>)}</div>
          </div>
          <div className="w-full max-w-2xl rei-surface">
            <div className="space-y-6">
              <div className={step !== 1 && twitterUser ? 'opacity-40' : ''}>
                {!twitterUser ? (
                  showSignUp ? (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h4 style={{ fontSize: '24px', fontWeight: 300, color: '#f0ede8', letterSpacing: '-0.025em' }}>Sign Up</h4>
                        <p style={{ fontSize: '13px', color: '#5c5a57' }}>Create a new talent profile</p>
                        <button onClick={() => handleTwitterLogin('signup')} className="btn-manga btn-manga-primary w-full flex items-center justify-center gap-2" style={{ borderRadius: '28px', padding: '11px 22px', cursor: 'pointer' }}><Twitter style={{ width: '16px', height: '16px' }} />Verify with @askrei_<img src={xVerifiedBadge} alt="verified" style={{ width: '16px', height: '16px' }} /></button>
                        <p style={{ fontSize: '11px', color: '#5c5a57', lineHeight: 1.5 }}>By signing up you confirm you are following <strong style={{ color: '#f0ede8' }}>@askrei_</strong> on X and agree to our terms. Only verified X accounts can register.</p>
                      </div>
                      <p className="text-center" style={{ fontSize: '13px', color: '#5c5a57' }}>Already have an account?{' '}<button onClick={() => setShowSignUp(false)} style={{ fontWeight: 500, color: '#f0ede8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Sign in</button></p>
                      {noAccountFound && <div className="rei-surface-2 flex items-center gap-3" style={{ padding: '14px', borderColor: 'hsla(0,63%,55%,0.3)' }}><AlertCircle className="h-4 w-4" style={{ color: '#ef4444' }} /><span style={{ fontSize: '13px', color: '#ef4444' }}>No existing account found. Please sign up.</span></div>}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h4 style={{ fontSize: '24px', fontWeight: 300, color: '#f0ede8', letterSpacing: '-0.025em' }}>Sign In</h4>
                        <p style={{ fontSize: '13px', color: '#5c5a57' }}>Access your existing talent profile</p>
                        <button onClick={() => handleTwitterLogin('signin')} className="btn-manga btn-manga-outline w-full flex items-center justify-center gap-2" style={{ borderRadius: '28px', padding: '11px 22px', cursor: 'pointer' }}><Twitter style={{ width: '16px', height: '16px' }} />Sign in with @askrei_<img src={xVerifiedBadge} alt="verified" style={{ width: '16px', height: '16px' }} /></button>
                        <p style={{ fontSize: '11px', color: '#5c5a57', lineHeight: 1.5 }}>You must be following <strong style={{ color: '#f0ede8' }}>@askrei_</strong> on X to sign in.</p>
                      </div>
                      <p className="text-center" style={{ fontSize: '13px', color: '#5c5a57' }}>Don't have an account?{' '}<button onClick={() => setShowSignUp(true)} style={{ fontWeight: 500, color: '#f0ede8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Sign up</button></p>
                      {noAccountFound && <div className="rei-surface-2 flex items-center gap-3" style={{ padding: '14px', borderColor: 'hsla(0,63%,55%,0.3)' }}><AlertCircle className="h-4 w-4" style={{ color: '#ef4444' }} /><span style={{ fontSize: '13px', color: '#ef4444' }}>No existing account found. Please sign up.</span></div>}
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <div className="rei-surface-2 flex items-center gap-3" style={{ padding: '14px' }}>
                      {twitterUser.profile_image_url && <img src={twitterUser.profile_image_url} alt={twitterUser.handle} className="h-10 w-10 rounded-full" />}
                      <div style={{ flex: 1 }}><p style={{ fontWeight: 500, color: '#f0ede8', fontSize: '14px' }}>{twitterUser.display_name}</p><p style={{ fontSize: '12px', color: '#5c5a57' }}>@{twitterUser.handle}</p></div>
                      {twitterUser.verified && <span className="rei-chip" style={{ padding: '3px 10px', fontSize: '10px' }}>Verified</span>}
                    </div>
                    <div className="rei-surface-2 flex items-center gap-2" style={{ padding: '10px 14px', borderColor: 'hsla(18,52%,82%,0.22)' }}><Check className="h-4 w-4" style={{ color: '#e8c4b8' }} /><span style={{ fontSize: '13px', fontWeight: 500, color: '#e8c4b8' }}>Identity Verified</span></div>
                  </div>
                )}
              </div>
              {twitterUser && (
                <div className={step !== 2 && connected ? 'opacity-40' : ''}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: connected ? 'hsla(18,52%,82%,0.12)' : '#1e1e1e', fontSize: '12px', color: connected ? '#e8c4b8' : '#5c5a57', border: '0.5px solid hsla(0,0%,100%,0.08)' }}>{connected ? <Check className="h-3.5 w-3.5" /> : '2'}</div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#f0ede8' }}>Connect Solana Wallet</span>
                  </div>
                  <WalletMultiButton className="!w-full !h-11 !bg-[#f0ede8] !text-[#0a0a0a] hover:!opacity-80 !rounded-[28px] !font-sans !text-sm !font-medium" />
                  {connected && publicKey && <div className="rei-surface-2 mt-3" style={{ padding: '14px' }}><p style={{ fontSize: '11px', color: '#5c5a57', marginBottom: '4px' }}>Connected Wallet</p><p style={{ fontSize: '11px', fontFamily: "'SF Mono', 'Consolas', monospace", color: '#a09e9a', wordBreak: 'break-all' }}>{publicKey.toString()}</p></div>}
                </div>
              )}
              {twitterUser && connected && (!isSuccess || isEditMode) && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: '#1e1e1e', fontSize: '12px', color: '#5c5a57', border: '0.5px solid hsla(0,0%,100%,0.08)' }}>3</div>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#f0ede8' }}>{isEditMode ? 'Edit My Details' : 'Submit My Details'}</span>
                  </div>
                  <div className="space-y-4">
                    {isEditMode && registrationData?.file_path && (
                      <div className="rei-surface-2 space-y-3" style={{ padding: '14px', borderColor: 'hsla(18,52%,82%,0.22)' }}>
                        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" style={{ color: '#e8c4b8' }} /><span style={{ fontSize: '13px', fontWeight: 500, color: '#f0ede8' }}>Re-analyze Profile</span></div>
                        <p style={{ fontSize: '12px', color: '#5c5a57', lineHeight: '1.65' }}>Re-run AI analysis with updated wallet data. No need to record again!</p>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={useExistingTranscript} onChange={(e) => { setUseExistingTranscript(e.target.checked); if (e.target.checked) setAudioBlob(null); }} style={{ accentColor: '#e8c4b8' }} /><span style={{ fontSize: '13px', color: '#a09e9a' }}>Use existing introduction</span></label>
                      </div>
                    )}
                    {!useExistingTranscript && <div><div className="rei-section-label">{isEditMode ? 'Record New Introduction' : 'Record Your Introduction'}</div><AudioRecorder onAudioReady={handleAudioReady} maxDurationSeconds={60} /></div>}
                    <div><div className="rei-section-label">Portfolio URL (Optional)</div><input type="url" placeholder="https://..." value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className="rei-field" /></div>
                    <div><div className="rei-section-label">Role Tags *</div><div className="flex flex-wrap gap-2">{ROLE_OPTIONS.map((role) => <button key={role.value} onClick={() => toggleRole(role.value)} className="rei-chip" style={{ background: selectedRoles.includes(role.value) ? 'hsla(18,52%,82%,0.12)' : '#1e1e1e', borderColor: selectedRoles.includes(role.value) ? 'hsla(18,52%,82%,0.22)' : 'hsla(0,0%,100%,0.18)', color: selectedRoles.includes(role.value) ? '#e8c4b8' : '#a09e9a' }}>{selectedRoles.includes(role.value) && <span className="rei-chip-dot" />}{role.label}</button>)}</div></div>
                    <div className="rei-surface-2" style={{ padding: '14px' }}><label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ accentColor: '#e8c4b8', marginTop: '2px' }} /><span style={{ fontSize: '13px', color: '#a09e9a' }}>I consent to data storage *</span></label></div>
                    <div className="flex gap-2">
                      {isEditMode && <button onClick={() => { setIsEditMode(false); setAudioBlob(null); setUseExistingTranscript(false); }} className="btn-manga btn-manga-outline flex-1" style={{ borderRadius: '28px', padding: '11px 22px', cursor: 'pointer' }}>Cancel</button>}
                      <button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} className="btn-manga btn-manga-primary flex-1" style={{ borderRadius: '28px', padding: '11px 22px', cursor: canSubmit && !isSubmitting ? 'pointer' : 'not-allowed', opacity: canSubmit && !isSubmitting ? 1 : 0.4 }}>
                        {isSubmitting ? (useExistingTranscript ? 'Re-analyzing...' : 'Submitting...') : useExistingTranscript ? 'Re-analyze Profile' : (isEditMode ? 'Update Profile' : 'Register')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="hidden md:block w-1/2 min-h-screen relative"><img src={reiSplit} alt="Rei" className="absolute inset-0 w-full h-full object-cover" /></div>
      <ReiAnalysisOverlay stage={analysisStage} uploadPercent={uploadPercent} errorMessage={analysisError} onClose={closeAnalysisOverlay} />
    </div>
  );
}