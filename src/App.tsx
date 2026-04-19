import { useEffect, useState } from 'react';
import { getCrowdLevel, calculateWaitTime } from './utils/crowdUtils';
import { subscribeToZones, updateCrowd, simulateCrowdChanges } from './services/zoneService';
import { subscribeToQueues, updateQueue } from './services/queueService';
import { subscribeToAlerts, sendAlert } from './services/alertService';
import { seedInitialData } from './services/seedData';
import { Users, Timer, BellRing, Activity, AlertTriangle, Route as RouteIcon, LogIn, LogOut, Shield, Map, Zap, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { findBestRouteInfo } from './utils/routeUtils';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase/config';
import { loginOrRegister, logoutUser } from './services/authService';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import StadiumMap from './components/StadiumMap';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [zones, setZones] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Auth & Roles
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Routing State
  const [startPoint, setStartPoint] = useState('gateA');
  const [endPoint, setEndPoint] = useState('sector2');
  const routeInfo = findBestRouteInfo(startPoint, endPoint, zones);

  // Setup Auth Listener
  useEffect(() => {
    let unsubRole: (() => void) | null = null;
    
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Clear out the previous role listener if it exists to avoid memory leak or permission error on logout
      if (unsubRole) {
        unsubRole();
        unsubRole = null;
      }
      
      if (currentUser) {
        // Now listen to the user's role document in Firestore
        unsubRole = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
          if (docSnap.exists() && docSnap.data().role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        }, (err) => {
           console.error("Role fetch error:", err);
           setIsAdmin(false);
        });
      } else {
        setIsAdmin(false);
      }
    });

    // Seed Data once at boot (idempotent)
    seedInitialData();

    return () => {
      unsubAuth();
      if (unsubRole) unsubRole();
    };
  }, []);

  // Setup Data Listeners
  useEffect(() => {
      if (!user) {
         setZones([]);
         setQueues([]);
         setAlerts([]);
         setLoading(false);
         return; 
      }
      
      setLoading(true);

      const unsubZones = subscribeToZones((data) => {
          setZones(data);
          setLoading(false);
      });
      const unsubQueues = subscribeToQueues(setQueues);
      const unsubAlerts = subscribeToAlerts(setAlerts);

      return () => {
          unsubZones();
          unsubQueues();
          unsubAlerts();
      };
  }, [user]);

  const handleZoneUpdate = async (id: string, current: number, change: number) => {
      if (!isAdmin) return;
      const newValue = Math.max(0, Math.min(100, current + change));
      await updateCrowd(id, newValue);
  };

  const handleQueueUpdate = async (id: string, current: number, change: number) => {
      if (!isAdmin) return;
      const newValue = Math.max(0, current + change);
      await updateQueue(id, newValue);
  };

  const handleSendAlert = async (msg: string, severity: 'info' | 'warning' | 'critical') => {
      if (!isAdmin) return;
      await sendAlert(msg, severity);
  };

  const fillDemoCreds = (type: 'admin' | 'guest') => {
    if (type === 'admin') {
      setEmail('admin_v2@stadium.com');
      setPassword('admin123');
    } else {
      setEmail('visitor_v2@stadium.com');
      setPassword('guest123'); // Updated to 8 chars as well
    }
  };

  const handleLoginSubmit = async (e: any) => {
    e.preventDefault();
    setAuthError('');
    try {
      await loginOrRegister(email, password);
    } catch (err: any) {
      if (err.message.includes('auth/operation-not-allowed')) {
         setAuthError("Email/Password Sign-in is disabled! Please enable it in the Firebase Console -> Authentication settings.");
      } else if (err.message.includes('auth/email-already-in-use') || err.message.includes('auth/invalid-credential')) {
         setAuthError("Password incorrect for this account. If you just changed passwords, try using a new email address (e.g. admin_v3@stadium.com) to bypass Firebase Auth caching!");
      } else {
         setAuthError(err.message || 'Verification failed. Try again.');
      }
    }
  };

  if (!user) {
    // LOGIN SCREEN
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
         <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Image / Branding Side */}
            <div className="w-full md:w-5/12 bg-blue-900 p-8 flex flex-col justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
               
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="bg-white p-2 rounded-lg"><Activity size={24} className="text-blue-900" /></div>
                   <span className="text-white font-black tracking-tight text-xl">SmartCrowd_Lite</span>
                 </div>
                 <p className="text-blue-200 text-sm font-medium mt-6">Next generation queue and density management for massive scale venues.</p>
               </div>
               
               <div className="relative z-10 mt-12 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                 <div className="flex items-center gap-3 mb-2">
                   <Zap size={18} className="text-yellow-400 fill-yellow-400" />
                   <h3 className="text-white font-bold text-sm">Demo Credentials</h3>
                 </div>
                 <p className="text-blue-200 text-xs mb-4">Click below to instantly safely autofill your demo login credentials required to pass the Firebase Auth checks.</p>
                 
               <div className="flex gap-2">
                {/* Admin Autofill Card */}
                <div 
                  onClick={() => fillDemoCreds('admin')} 
                  className="flex-1 border-2 border-transparent bg-purple-50 p-4 rounded-xl text-left cursor-pointer hover:border-purple-300 hover:shadow-md transition group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={16} className="text-purple-600 group-hover:scale-110 transition-transform"/> 
                    <span className="font-bold text-slate-800 text-sm">Admin Role</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Email: <span className="font-mono text-purple-900 font-bold bg-purple-100 px-1 py-0.5 rounded">admin_v2@stadium.com</span></div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Pass: <span className="font-mono text-purple-900 font-bold bg-purple-100 px-1 py-0.5 rounded">admin123</span></div>
                </div>
                
                {/* Guest Autofill Card */}
                <div 
                  onClick={() => fillDemoCreds('guest')} 
                  className="flex-1 border-2 border-transparent bg-emerald-50 p-4 rounded-xl text-left cursor-pointer hover:border-emerald-300 hover:shadow-md transition group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-emerald-600 group-hover:scale-110 transition-transform"/> 
                    <span className="font-bold text-slate-800 text-sm">Guest Role</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Email: <span className="font-mono text-emerald-900 font-bold bg-emerald-100 px-1 py-0.5 rounded">visitor_v2@stadium.com</span></div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Pass: <span className="font-mono text-emerald-900 font-bold bg-emerald-100 px-1 py-0.5 rounded">guest123</span></div>
                </div>
              </div>
               </div>
            </div>

            {/* Right Form Side */}
            <div className="w-full md:w-7/12 p-8 md:p-12">
               <h2 className="text-2xl font-bold text-slate-800 mb-2">Account Portal</h2>
               <p className="text-sm text-slate-500 mb-8">Sign in or register an account automatically.</p>

               {authError && (
                 <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                   <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                   <p className="text-sm text-red-600 font-medium leading-relaxed">{authError}</p>
                 </div>
               )}

               <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input 
                       type="email" 
                       required
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium outline-none focus:border-blue-500 focus:bg-blue-50/50 transition-all"
                       placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                    <input 
                       type="password" 
                       required
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium outline-none focus:border-blue-500 focus:bg-blue-50/50 transition-all"
                       placeholder="Enter your password"
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] mt-6">
                    Authenticate Securely
                  </button>
               </form>
               
               <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
                 <CheckCircle2 size={16} className="text-emerald-500"/>
                 <span className="text-xs text-slate-500 font-medium">Secured by Google Firebase Auth</span>
               </div>
            </div>

         </div>
      </div>
    );
  }

  // --- NEW: Inject Admin Dashboard Layout if Admin ---
  if (isAdmin) {
    return (
      <AdminDashboard 
         user={user}
         zones={zones}
         queues={queues}
         alerts={alerts}
         handleZoneUpdate={handleZoneUpdate}
         handleQueueUpdate={handleQueueUpdate}
         handleSendAlert={handleSendAlert}
         logoutUser={logoutUser}
      />
    );
  }

  // --- EXISTING: User/Guest Dashboard ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Activity size={18} className="text-white" />
               </div>
               <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">SmartCrowd_Lite</h1>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Live</span>
              </div>
              
              <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
                <span className="text-sm font-medium text-slate-600 truncate max-w-[150px]">{user.email}</span>
                <button onClick={logoutUser} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50">
                   <LogOut size={18} />
                </button>
              </div>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 lg:px-6 py-8">
        
        {loading ? (
           <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium animate-pulse">Syncing live venue telemetry...</p>
           </div>
        ) : (
          <div className="flex flex-col gap-8">

               {/* Guest Callout */}
               <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                  <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 mt-1">
                     <Users size={24} />
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-emerald-900">Guest View Mode</h2>
                     <p className="text-emerald-700 mt-1 text-sm leading-relaxed">You are currently logged in as a normal visitor. You can view all real-time crowd metrics, estimates, and routing guides, but administrative simulated controls are hidden.</p>
                  </div>
               </div>

               {/* Active Alerts Banner */}
               {alerts.filter(a => !dismissedAlerts.has(a.id)).map(alert => (
                  <div key={alert.id} className={`p-4 rounded-xl border shadow-sm flex items-start justify-between gap-3 animate-fade-in ${alert.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-800' : alert.severity === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                    <div className="flex items-start gap-3">
                       <BellRing className="shrink-0 mt-0.5" size={20} />
                       <div>
                          <span className="font-bold block mb-0.5 text-sm uppercase tracking-wider">Venue Announcement</span>
                          <span className="text-sm font-medium opacity-90">{alert.message}</span>
                       </div>
                    </div>
                    <button 
                       onClick={() => setDismissedAlerts(prev => { const newSet = new Set(prev); newSet.add(alert.id); return newSet; })}
                       className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity hover:bg-black/5"
                       title="Dismiss Alert"
                    >
                       <X size={18} />
                    </button>
                  </div>
               ))}

               {/* Routing Demo & Map */}
               {zones.length > 0 && (
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                  {/* Map Visuals */}
                  <div className="w-full md:w-1/2 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col justify-center">
                     <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <Map size={20} className="text-blue-500"/> Live Venue Overview
                     </h3>
                     <StadiumMap zones={zones} activeRoute={routeInfo.primary?.path} />
                  </div>

                  {/* Routing Engine Interface */}
                  <div className="w-full md:w-1/2 p-6 flex flex-col bg-gradient-to-br from-blue-50/50 to-indigo-50/50 relative overflow-hidden">
                     <RouteIcon size={120} className="absolute -right-4 -bottom-8 text-blue-500/5 rotate-12 pointer-events-none" />
                     
                     <div className="text-[10px] text-blue-600 font-black mb-4 flex items-center gap-2 uppercase tracking-widest relative z-10">
                       <RouteIcon size={14}/> Dynamic Wayfinding
                     </div>

                     <div className="flex items-center gap-3 mb-6 relative z-10">
                        <select 
                           value={startPoint} 
                           onChange={(e) => setStartPoint(e.target.value)}
                           className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                           <option value="gateA">Gate A</option>
                           <option value="gateB">Gate B</option>
                           <option value="sector1">Sector 1</option>
                           <option value="sector2">Sector 2</option>
                        </select>
                        <ArrowRight size={16} className="text-slate-400 shrink-0" />
                        <select 
                           value={endPoint} 
                           onChange={(e) => setEndPoint(e.target.value)}
                           className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                           <option value="sector2">Sector 2</option>
                           <option value="sector1">Sector 1</option>
                           <option value="gateA">Gate A</option>
                           <option value="gateB">Gate B</option>
                        </select>
                     </div>

                     <div className="flex flex-col gap-3 relative z-10">
                        {startPoint === endPoint ? (
                            <div className="text-sm text-slate-500 p-4 border border-slate-200 rounded-xl bg-white/50 text-center font-medium">You are already at your destination.</div>
                        ) : (
                           <>
                             {routeInfo.primary && (
                                <div className={`p-4 rounded-xl border flex flex-col gap-2 relative overflow-hidden transition-all duration-300 ${routeInfo.primary.isCongested ? 'bg-red-50 border-red-300 shadow-md ring-1 ring-red-400' : 'bg-emerald-50 border-emerald-200'}`}>
                                   <div className="flex justify-between items-center mb-1">
                                      <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${routeInfo.primary.isCongested ? 'text-red-900' : 'text-emerald-900'}`}>
                                        {routeInfo.primary.isCongested && <AlertTriangle size={14} className="animate-pulse text-red-600" />}
                                        Primary Route
                                      </span>
                                      <span className={`text-sm font-black ${routeInfo.primary.isCongested ? 'text-red-700 animate-pulse' : 'text-emerald-700'}`}>~{routeInfo.primary.estimatedTime} min</span>
                                   </div>
                                   <div className="text-sm font-medium text-slate-700 flex flex-wrap items-center gap-2 relative z-10">
                                      {routeInfo.primary.pathNames.map((n, i) => (
                                         <span key={i} className="flex items-center gap-1">
                                            {n} {i < routeInfo.primary!.pathNames.length - 1 && <span className="text-slate-400">→</span>}
                                         </span>
                                      ))}
                                   </div>
                                   {routeInfo.primary.isCongested && (
                                     <div className="text-xs font-bold text-red-700 mt-2 flex items-start gap-1.5 bg-red-100 p-2.5 rounded-lg border border-red-200">
                                        <div className="shrink-0 mt-0.5"><AlertTriangle size={12}/></div>
                                        <span>{routeInfo.primary.congestionReason || 'Delays expected due to heavy crowds on this route.'}</span>
                                     </div>
                                   )}
                                </div>
                             )}

                             {routeInfo.alternative && (
                                <div className={`p-4 rounded-xl border flex flex-col gap-2 relative overflow-hidden group transition ${routeInfo.alternative.isCongested ? 'bg-red-50/50 border-red-200 hover:border-red-300' : 'bg-white/80 border-blue-200 hover:border-blue-300'}`}>
                                   <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${routeInfo.alternative.isCongested ? 'bg-red-500/50 group-hover:bg-red-500' : 'bg-blue-500/50 group-hover:bg-blue-500'}`}></div>
                                   <div className="flex justify-between items-center mb-1">
                                      <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${routeInfo.alternative.isCongested ? 'text-red-800' : 'text-slate-500'}`}>
                                        {routeInfo.alternative.isCongested && <AlertTriangle size={14} className="text-red-500" />}
                                        Alternative Options
                                      </span>
                                      <span className={`text-sm font-black ${routeInfo.alternative.isCongested ? 'text-red-600' : 'text-slate-400'}`}>~{routeInfo.alternative.estimatedTime} min</span>
                                   </div>
                                   <div className={`text-sm font-medium flex flex-wrap items-center gap-2 transition-opacity ${routeInfo.alternative.isCongested ? 'text-red-900 opacity-90' : 'text-slate-500 opacity-80 group-hover:opacity-100'}`}>
                                      {routeInfo.alternative.pathNames.map((n, i) => (
                                         <span key={i} className="flex items-center gap-1">
                                            {n} {i < routeInfo.alternative!.pathNames.length - 1 && <span className="opacity-50">→</span>}
                                         </span>
                                      ))}
                                   </div>
                                   {routeInfo.alternative.isCongested && (
                                       <div className="text-xs font-semibold text-red-600 mt-1">
                                          {routeInfo.alternative.congestionReason || 'This route is also experiencing delays.'}
                                       </div>
                                   )}
                                </div>
                             )}
                           </>
                        )}
                     </div>
                  </div>
                </section>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Zones Panel */}
                  <section>
                     <div className="flex items-center gap-2 mb-4">
                        <Users className="text-blue-600" size={20} />
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Zone Density</h2>
                     </div>
                     <div className="grid grid-cols-1 gap-4">
                        {zones.length === 0 ? (
                           <div className="p-6 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">No zones actively tracking.</div>
                        ) : (
                           zones.map(z => {
                              const level = getCrowdLevel(z.crowd);
                              const isCritical = z.crowd > 80;
                              let colorClasses = '';
                              let badgeColor = '';
                              let iconObj = null;

                              if (isCritical) {
                                 colorClasses = 'bg-red-50 border-red-300 shadow-red-100 shadow-lg ring-1 ring-red-400';
                                 badgeColor = 'bg-red-500 text-white animate-pulse shadow-md';
                                 iconObj = <AlertTriangle size={14} className="animate-bounce" />;
                              } else {
                                 switch(level) {
                                    case 'low': colorClasses = 'bg-white border-slate-200'; badgeColor = 'bg-emerald-100 text-emerald-700'; break;
                                    case 'medium': colorClasses = 'bg-white border-slate-200'; badgeColor = 'bg-yellow-100 text-yellow-700'; break;
                                    case 'high': colorClasses = 'bg-orange-50 border-orange-200'; badgeColor = 'bg-orange-100 text-orange-700'; break;
                                 }
                              }

                              return (
                              <div key={z.id} className={`rounded-3xl border ${colorClasses} relative overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col`}>
                                 {/* Image Banner */}
                                 <div className="h-28 w-full relative overflow-hidden bg-slate-200">
                                     <img 
                                        src={`https://image.pollinations.ai/prompt/A_realistic_cinematic_photo_of_a_sports_stadium_${encodeURIComponent(z.name)}_with_crowds_and_architectural_details?width=400&height=200&nologo=true`} 
                                        alt={z.name} 
                                        referrerPolicy="no-referrer" 
                                        className="object-cover w-full h-full opacity-90 transition duration-500 hover:scale-105" 
                                        onError={(e) => {
                                           // Fallback just in case generative AI times out
                                           (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${z.name.replace(/\s+/g, '')}/400/200`;
                                        }}
                                     />
                                     
                                     {/* Critical Overcrowding Overlay */}
                                     {isCritical && (
                                       <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center p-4">
                                          <div className="bg-red-600 text-white px-4 py-2 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-2 border-2 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.6)]">
                                             <AlertTriangle size={18} className="animate-pulse" />
                                             Critical Density
                                          </div>
                                       </div>
                                     )}
                                 </div>

                                 <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                       <h3 className={`font-bold text-lg tracking-tight ${isCritical ? 'text-red-900' : 'text-slate-800'}`}>{z.name}</h3>
                                       <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${badgeColor}`}>
                                          {iconObj} {level}
                                       </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <div className={`h-3 w-full rounded-full overflow-hidden ${isCritical ? 'bg-red-200' : 'bg-slate-100'}`}>
                                          <div 
                                             className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-600' : level === 'high' ? 'bg-orange-500' : level === 'medium' ? 'bg-yellow-400' : 'bg-emerald-500'}`}
                                             style={{ width: `${Math.min(z.crowd, 100)}%` }}
                                          ></div>
                                       </div>
                                       <span className={`text-sm font-black w-12 text-right ${isCritical ? 'text-red-700' : 'text-slate-600'}`}>{z.crowd}%</span>
                                    </div>
                                 </div>
                              </div>
                              )
                           })
                        )}
                     </div>
                  </section>

                  {/* Queues Panel */}
                  <section>
                     <div className="flex items-center gap-2 mb-4">
                        <Timer className="text-blue-600" size={20} />
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Queue Wait Times</h2>
                     </div>
                     <div className="grid grid-cols-1 gap-4">
                        {queues.length === 0 ? (
                           <div className="p-6 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">No queues actively tracking.</div>
                        ) : (
                           queues.map(q => {
                              const waitMinutes = calculateWaitTime(q.people, q.service_rate);
                              const isSlow = waitMinutes > 10;
                              return (
                              <div key={q.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                 {isSlow && <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>}
                                 <div className="flex justify-between items-start mb-6">
                                    <div>
                                       <h3 className="font-bold text-lg text-slate-800 tracking-tight">{q.name}</h3>
                                       <p className="text-slate-500 text-sm mt-0.5"><span className="font-semibold text-slate-700">{q.people}</span> people in line</p>
                                    </div>
                                    <div className={`flex flex-col items-end ${isSlow ? 'text-orange-600' : 'text-blue-600'}`}>
                                       <span className="text-3xl font-black leading-none">{Math.ceil(waitMinutes)}</span>
                                       <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Min Wait</span>
                                    </div>
                                 </div>
                              </div>
                              )
                           })
                        )}
                     </div>
                  </section>
               </div>
            </div>
        )}
      </main>
    </div>
  );
}



