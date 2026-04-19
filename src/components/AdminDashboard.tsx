import React, { useState } from 'react';
import { 
  Megaphone, LayoutDashboard, Map as MapIcon, PlusSquare, 
  AlertTriangle, BarChart2, 
  Radio, Send, Users, LogOut, Activity, Wand2
} from 'lucide-react';
import StadiumMap from './StadiumMap';
import { generateEmergencyBroadcast } from '../services/aiService';

interface AdminDashboardProps {
  user: any;
  zones: any[];
  queues: any[];
  alerts: any[];
  handleZoneUpdate: (id: string, current: number, change: number) => void;
  handleQueueUpdate: (id: string, current: number, change: number) => void;
  handleSendAlert: (msg: string, severity: string) => void;
  logoutUser: () => void;
}

export default function AdminDashboard({
  user,
  zones,
  queues,
  alerts,
  handleZoneUpdate,
  handleQueueUpdate,
  handleSendAlert,
  logoutUser
}: AdminDashboardProps) {

  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiScenario, setAiScenario] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = async () => {
    if (!aiScenario.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateEmergencyBroadcast(aiScenario);
      setBroadcastMsg(result);
    } catch (err) {
      alert("AI Generation failed. Check console for details (make sure VITE_GEMINI_API_KEY is set).");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSend = () => {
    if (broadcastMsg.trim()) {
      handleSendAlert(broadcastMsg, "warning");
      setBroadcastMsg('');
    }
  };

  // Calculate aggregate metrics
  const totalOccupancy = zones.reduce((acc, z) => acc + (z.crowd * 243), 0) + 40000; 
  const sumWaits = queues.reduce((acc, q) => acc + Math.ceil(q.people / (q.service_rate || 1)), 0);
  const avgWaitMin = queues.length > 0 ? Math.floor(sumWaits / queues.length) : 0;
  const avgWaitSec = queues.length > 0 ? Math.floor(((sumWaits / queues.length) % 1) * 60) : 0;
  
  const activeIncidents = alerts.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#F1F5F9] border-r border-slate-200 flex flex-col fixed left-0 top-0 h-screen z-30">
         <div className="p-6">
            <h1 className="text-lg font-black text-[#1E3A8A] tracking-wider uppercase">SMARTCROWD LITE</h1>
         </div>
         
         <div className="px-6 pb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white overflow-hidden shadow-sm shrink-0 border-2 border-white">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=admin_avatar&backgroundColor=0d9488`} alt="Admin" className="w-full h-full object-cover"/>
            </div>
            <div className="flex flex-col">
               <div className="text-sm font-bold text-[#1E3A8A] leading-tight truncate">Command Center</div>
               <div className="text-xs text-slate-500 mt-0.5 truncate">Sector A-1 North</div>
            </div>
         </div>

         <div className="px-4 mb-6">
            <button className="w-full bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-xl p-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]">
               <Megaphone size={16} className="fill-white"/> Emergency Broadcast
            </button>
         </div>
         
         <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`w-full text-left rounded-xl px-4 py-3 text-sm flex items-center gap-3 transition-colors ${activeTab === 'dashboard' ? 'bg-white text-[#1E3A8A] font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-200/60 font-medium'}`}
            >
              <LayoutDashboard size={18}/> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('sectormap')} 
              className={`w-full text-left rounded-xl px-4 py-3 text-sm flex items-center gap-3 transition-colors ${activeTab === 'sectormap' ? 'bg-white text-[#1E3A8A] font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-200/60 font-medium'}`}
            >
              <MapIcon size={18}/> Sector Map
            </button>
            <button 
              onClick={() => setActiveTab('queuecontrol')} 
              className={`w-full text-left rounded-xl px-4 py-3 text-sm flex items-center gap-3 transition-colors ${activeTab === 'queuecontrol' ? 'bg-white text-[#1E3A8A] font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-200/60 font-medium'}`}
            >
              <PlusSquare size={18}/> Queue Control
            </button>
            <button 
              onClick={() => setActiveTab('crowdalerts')} 
              className={`w-full text-left rounded-xl px-4 py-3 text-sm flex items-center gap-3 transition-colors ${activeTab === 'crowdalerts' ? 'bg-white text-[#1E3A8A] font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-200/60 font-medium'}`}
            >
              <AlertTriangle size={18}/> Crowd Alerts
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`w-full text-left rounded-xl px-4 py-3 text-sm flex items-center gap-3 transition-colors ${activeTab === 'analytics' ? 'bg-white text-[#1E3A8A] font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-200/60 font-medium'}`}
            >
              <BarChart2 size={18}/> Analytics
            </button>
         </nav>

         <div className="p-4 space-y-1 mb-2">
            <button onClick={logoutUser} className="w-full text-left text-slate-600 hover:bg-red-50 hover:text-red-700 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-3 transition-colors mt-2 border border-transparent hover:border-red-100">
              <LogOut size={18}/> Exit Command
            </button>
         </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen bg-white">
         
         {/* Top Header */}
         <header className="h-[72px] bg-white border-b border-slate-100 flex items-center justify-end px-8 sticky top-0 z-20">
            <div className="flex items-center gap-5">
               <div className="w-10 h-10 rounded-full bg-teal-600 overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:ring-2 hover:ring-slate-100 transition">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=admin_avatar&backgroundColor=0d9488`} alt="User" />
               </div>
            </div>
         </header>

         <div className="p-10 max-w-[1500px] w-full mx-auto pb-24">
            
            {/* Page Header conditionally rendered entirely based on active tab below */}
            {activeTab === 'dashboard' && (
              <>
                <div className="flex justify-between items-end mb-10">
                   <div>
                      <h1 className="text-[40px] font-bold text-[#0F172A] tracking-tight leading-none mb-3">System Overview</h1>
                      <p className="text-slate-500 text-[15px]">Real-time stadium metrics and active command control.</p>
                   </div>
                   <div className="bg-white text-emerald-600 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm border border-slate-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> LIVE FEED ACTIVE
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   
                   {/* Global Venue Pulse (Col Span 2) */}
                   <section className="lg:col-span-2 bg-[#F4F7F9] rounded-[24px] p-8 flex flex-col relative">
                      <div className="flex justify-between items-center mb-8">
                         <h2 className="text-[22px] font-semibold text-slate-900 tracking-tight">Global Venue Pulse</h2>
                      </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 h-full">
                     {/* Metric Card 1 */}
                     <div className="bg-white rounded-[20px] p-7 shadow-sm border-l-4 border-l-[#1E3A8A] flex flex-col justify-between hover:shadow-md transition duration-300">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Total Occupancy</div>
                        <div className="text-[48px] font-bold text-[#1E3A8A] tracking-tighter leading-none mb-6">{totalOccupancy.toLocaleString()}</div>
                        <div className="text-[13px] font-medium text-emerald-600 flex items-center gap-1.5">
                           <Activity size={14}/> +12% vs expected
                        </div>
                     </div>

                     {/* Metric Card 2 */}
                     <div className="bg-white rounded-[20px] p-7 shadow-sm border-l-4 border-l-slate-400 flex flex-col justify-between hover:shadow-md transition duration-300">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Avg Gate Wait</div>
                        <div className="text-[48px] font-bold text-[#0F172A] tracking-tighter leading-none mb-6">{avgWaitMin}m {avgWaitSec}s</div>
                        <div className="text-[13px] font-medium text-slate-500 flex items-center gap-2">
                           <span className="w-3 h-[2px] bg-slate-400"></span> Stable throughput
                        </div>
                     </div>

                     {/* Metric Card 3 */}
                     <div className="bg-white rounded-[20px] p-7 shadow-sm border-l-4 border-l-[#B91C1C] flex flex-col justify-between hover:shadow-md transition duration-300">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Active Incidents</div>
                        <div className="text-[48px] font-bold text-[#B91C1C] tracking-tighter leading-none mb-6">{activeIncidents}</div>
                        <div className="text-[13px] font-medium text-[#B91C1C] flex items-center gap-1.5 leading-snug">
                           <AlertTriangle size={14} className="fill-red-100"/> 
                           {alerts.length > 0 ? alerts[0].message.substring(0, 18) + "..." : "No active alerts"}
                        </div>
                     </div>
                  </div>
               </section>

               {/* Broadcast Component (Col Span 1) */}
               <section className="bg-[#F4F7F9] rounded-[24px] p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                     <h2 className="text-[22px] font-semibold text-slate-900 tracking-tight">Broadcast</h2>
                     <div className="w-10 h-10 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#1E3A8A]">
                        <Radio size={20} />
                     </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col flex-1 border border-slate-100">
                     <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex justify-between items-center">
                        Message Payload
                        <button 
                           onClick={handleGenerateAI}
                           disabled={isGenerating || !aiScenario.trim()}
                           className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 disabled:opacity-50 transition"
                        >
                           {isGenerating ? <Activity size={14} className="animate-spin" /> : <Wand2 size={14} />}
                           <span className="capitalize">Auto-Draft</span>
                        </button>
                     </div>
                     <textarea 
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                        placeholder="Enter emergency or general broadcast message to all digital signage systems..."
                        className="w-full text-[15px] font-medium text-slate-700 resize-none outline-none flex-1 placeholder:text-slate-400 placeholder:font-normal bg-transparent min-h-[100px]"
                     />
                  </div>

                  <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col gap-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-blue-800">AI Safety Assistant</label>
                     <input 
                        type="text"
                        value={aiScenario}
                        onChange={e => setAiScenario(e.target.value)}
                        placeholder="e.g. Fire in North Stand"
                        className="w-full text-sm bg-white border border-blue-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                        onKeyDown={e => e.key === 'Enter' && handleGenerateAI()}
                     />
                  </div>

                  <div className="flex gap-2.5 mt-6 mb-8">
                     <span className="bg-[#FEE2E2] text-[#B91C1C] text-[10px] font-bold uppercase tracking-widest px-3.5 py-2 rounded-full">Severity: High</span>
                     <span className="bg-[#DBEAFE] text-[#1E3A8A] text-[10px] font-bold uppercase tracking-widest px-3.5 py-2 rounded-full">Target: All Sectors</span>
                  </div>

                  <button 
                     onClick={onSend}
                     className="w-full bg-[#030712] hover:bg-slate-800 text-white pt-4 pb-4 rounded-full text-[15px] font-bold flex items-center justify-center gap-3 transition-colors shadow-xl shadow-slate-900/20 active:scale-[0.98]"
                  >
                     <Send size={18} className="fill-white"/> Transmit Alert
                  </button>
               </section>

            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
               
               {/* Sector Density Control */}
               <section className="lg:col-span-2 bg-[#F4F7F9] rounded-[24px] p-8">
                  <div className="flex justify-between items-center mb-8">
                     <h2 className="text-[22px] font-semibold text-slate-900 tracking-tight">Sector Density Control</h2>
                  </div>
                  
                  <div className="space-y-4">
                     {zones.map((z, idx) => {
                        const isCritical = z.crowd > 80;
                        const iconBg = isCritical ? 'bg-[#FEE2E2] text-red-600' : 'bg-[#DBEAFE] text-blue-600';
                        return (
                           <div key={z.id} className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition duration-300 relative overflow-hidden">
                              <div className="flex items-center gap-5 flex-1 pl-1">
                                 <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
                                    <Users size={22} className={isCritical ? "fill-red-600" : "fill-[#1E3A8A]"}/>
                                 </div>
                                 <div className="flex-1 pr-10">
                                    <div className="flex items-center gap-4 mb-3">
                                       <span className="font-bold text-slate-900 text-[17px] tracking-tight">{z.name}</span>
                                       <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-[6px] ${isCritical ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#F1F5F9] text-slate-500'}`}>
                                          {z.crowd}% Capacity
                                       </span>
                                    </div>
                                    {/* Progress Bar Container */}
                                    <div className="h-2.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                                       <div 
                                          className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-[#B91C1C]' : 'bg-[#1E3A8A]'}`} 
                                          style={{ width: `${Math.min(z.crowd, 100)}%` }}
                                       ></div>
                                    </div>
                                 </div>
                              </div>
                              <button className={`shrink-0 ml-4 px-6 py-3 rounded-[12px] text-[14px] font-bold transition-colors shadow-sm ${isCritical ? 'bg-[#E0E7FF] text-[#1E3A8A] hover:bg-[#C7D2FE]' : 'bg-[#F1F5F9] text-slate-700 hover:bg-[#E2E8F0]'}`}>
                                 {isCritical ? 'Divert Flow' : 'Adjust Gates'}
                              </button>
                                 
                              {/* Admin quick add overlay */}
                              <div className="absolute inset-0 bg-[#1E3A8A]/95 text-white font-bold flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm backdrop-blur-sm gap-2">
                                <div className="text-xs uppercase tracking-widest text-[#93C5FD]">Manual Capacity Adjust</div>
                                <div className="flex gap-4">
                                  <button onClick={() => handleZoneUpdate(z.id, z.crowd, -10)} className="bg-[#B91C1C] hover:bg-red-600 px-4 py-2 rounded-lg transition">-10%</button>
                                  <button onClick={() => handleZoneUpdate(z.id, z.crowd, 10)} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition">+10%</button>
                                </div>
                              </div>
                           </div>
                        );
                     })}
                     {zones.length === 0 && <div className="text-slate-400 py-4 text-center">No zones available.</div>}
                  </div>
               </section>

               {/* Queue Dynamics */}
               <section className="bg-[#F4F7F9] rounded-[24px] p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                     <h2 className="text-[22px] font-semibold text-slate-900 tracking-tight">Queue Dynamics</h2>
                  </div>
                  
                  <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[500px]">
                     {queues.map((q, idx) => {
                        const isHighLoad = q.people > 20;
                        return (
                           <div key={q.id} className="bg-white rounded-[20px] p-6 shadow-sm border border-transparent hover:border-slate-200 transition duration-300">
                              <div className="flex justify-between items-start mb-6">
                                 <h3 className="font-bold text-slate-900 text-[16px] pr-2 tracking-tight leading-snug">{q.name}</h3>
                                 {isHighLoad && (
                                    <span className="bg-[#FEE2E2] text-[#B91C1C] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-[6px] shrink-0">High Load</span>
                                 )}
                              </div>
                              <div className="flex gap-4">
                                 <div className="bg-[#F4F7F9] rounded-2xl p-4.5 flex-1 px-5 py-4 relative overflow-hidden group">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Headcount</div>
                                    <div className="text-[28px] font-bold text-[#0F172A] leading-none">{q.people}</div>
                                    
                                    {/* Admin quick add overlay */}
                                    <div className="absolute inset-0 bg-[#1E3A8A]/95 text-white font-bold flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm backdrop-blur-sm gap-2">
                                      <div className="text-[10px] uppercase tracking-widest text-[#93C5FD]">Manual Adjust</div>
                                      <div className="flex gap-2">
                                        <button onClick={() => handleQueueUpdate(q.id, q.people, -5)} className="bg-[#B91C1C] hover:bg-red-600 px-3 py-1.5 rounded-md transition">-5</button>
                                        <button onClick={() => handleQueueUpdate(q.id, q.people, 5)} className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-md transition">+5</button>
                                      </div>
                                    </div>
                                 </div>
                                 <div className="bg-[#F4F7F9] rounded-2xl px-5 py-4 flex-1">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 text-center">Rate / Min</div>
                                    <div className="text-[28px] font-bold text-[#0F172A] leading-none text-center">{Math.ceil(q.people / (q.service_rate||1))}</div>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                     {queues.length === 0 && <div className="text-slate-400 py-4 text-center">No queue data available.</div>}
                  </div>
               </section>

            </div>
            </>
            )}

            {/* Queue Control Detailed View */}
            {activeTab === 'queuecontrol' && (
              <div className="flex flex-col gap-10">
                {/* Header */}
                <div className="flex justify-between items-end">
                   <div>
                      <h1 className="text-[48px] font-black text-[#0F172A] tracking-tighter leading-none mb-2">Queue Control</h1>
                      <p className="text-slate-600 font-medium text-lg">Real-time gate and concession throughput</p>
                   </div>
                   <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 flex items-center gap-12">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Total Ingress</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-[#1E3A8A]">12,450</span>
                          <span className="text-sm font-medium text-slate-400">/ 55k</span>
                        </div>
                      </div>
                      <div className="w-[1px] h-12 bg-slate-200"></div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Avg Wait</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-emerald-600">{avgWaitMin}</span>
                          <span className="text-sm font-medium text-slate-500">min</span>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Queue Cards */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[24px] font-bold text-[#1E3A8A]">Entrance Gates</h2>
                    <button 
                      onClick={() => {
                        queues.forEach(q => handleQueueUpdate(q.id, q.people, -20));
                        handleSendAlert('All reserve lanes have been opened to maximize ingress throughput.', 'info');
                      }}
                      className="bg-[#030712] hover:bg-slate-800 text-white rounded-full px-6 py-2.5 text-sm font-bold shadow-lg transition active:scale-95"
                    >
                      Open All Lanes
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     {queues.map((q, idx) => {
                        const waitTime = Math.ceil(q.people / (q.service_rate||1));
                        const isHighLoad = waitTime > 15;
                        const isBuilding = waitTime > 10 && waitTime <= 15;
                        const isFlowing = waitTime <= 10;
                        
                        let badgeBg, badgeText, badgeLabel, barColor;
                        if (isHighLoad) {
                           badgeBg = 'bg-[#FEE2E2]'; badgeText = 'text-[#B91C1C]'; badgeLabel = 'HIGH VOLUME'; barColor = 'bg-[#B91C1C]';
                        } else if (isBuilding) {
                           badgeBg = 'bg-[#FEF3C7]'; badgeText = 'text-[#D97706]'; badgeLabel = 'BUILDING'; barColor = 'bg-[#F59E0B]';
                        } else {
                           badgeBg = 'bg-[#D1FAE5]'; badgeText = 'text-[#059669]'; badgeLabel = 'FLOWING'; barColor = 'bg-[#10B981]';
                        }

                        // Just some mock variations for names
                        const subTitle = idx === 0 ? "Main Transit Hub" : idx === 1 ? "VIP & Press" : idx === 2 ? "General Admission" : "Family Entrance";
                        const lanes = idx === 0 ? "6/8" : idx === 1 ? "4/4" : idx === 2 ? "8/10" : "5/6";

                        return (
                           <div key={q.id} className="bg-white rounded-[24px] p-7 shadow-sm border-l-4 border-l-[6px] border-solid relative" style={{borderLeftColor: isHighLoad ? '#B91C1C' : isBuilding ? '#F59E0B' : '#10B981'}}>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="text-2xl font-bold text-[#0F172A] leading-tight w-20">{q.name}</h3>
                                <div className={`${badgeBg} ${badgeText} px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0`}>
                                  {isHighLoad && <AlertTriangle size={12} className="fill-red-100"/>}
                                  {badgeLabel}
                                </div>
                              </div>
                              <p className="text-slate-500 text-sm font-medium mb-8 leading-tight min-h-[40px] pr-8">{subTitle}</p>
                              
                              <div className="flex justify-between items-end mb-2">
                                <div className="text-xs font-semibold text-slate-600">Wait Time</div>
                                <div className={`text-sm font-bold ${badgeText}`}>{waitTime} min</div>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full mb-8 overflow-hidden">
                                <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{width: `${Math.min(100, waitTime * 5)}%`}}></div>
                              </div>

                              <div className="flex justify-between items-end mb-6">
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Throughput</div>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-[#0F172A] leading-none">{q.people * 15}</span>
                                    <span className="text-xs font-semibold text-slate-500">/hr</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Lanes</div>
                                  <div className="flex items-center gap-2">
                                     <span className="text-base font-bold text-[#0F172A]">{lanes}</span>
                                     <span className="text-xs font-semibold text-[#D97706]">Open</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                {idx === 0 ? (
                                  <>
                                  <button 
                                    onClick={() => {
                                       handleQueueUpdate(q.id, q.people, -15);
                                       handleSendAlert(`Traffic from ${q.name} is being redirected.`, 'warning');
                                    }} 
                                    className={`flex-1 rounded-xl py-3 text-sm font-bold transition-colors ${badgeBg} ${badgeText} bg-opacity-50 hover:bg-opacity-80 active:scale-95`}
                                  >
                                    Redirect Flow
                                  </button>
                                  <button 
                                    onClick={() => handleQueueUpdate(q.id, q.people, 5)} 
                                    className="w-12 flex items-center justify-center rounded-xl py-3 text-sm font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95"
                                    title="Add 5 Pax"
                                  >
                                    <PlusSquare size={16} className="text-slate-500" />
                                  </button>
                                  </>
                                ) : idx === 1 ? (
                                  <button 
                                    onClick={() => handleQueueUpdate(q.id, q.people, -5)}
                                    className={`w-full rounded-xl py-3 text-sm font-bold transition-colors bg-[#EFF6FF] text-[#1E3A8A] hover:bg-[#DBEAFE] active:scale-95`}
                                  >
                                    Adjust Staff
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleQueueUpdate(q.id, q.people, -10)}
                                    className={`w-full rounded-xl py-3 text-sm font-bold transition-colors bg-[#EFF6FF] text-[#1E3A8A] hover:bg-[#DBEAFE] active:scale-95`}
                                  >
                                    Open Lane
                                  </button>
                                )}
                              </div>
                           </div>
                        );
                     })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Sector Map Detailed View */}
            {activeTab === 'sectormap' && (
              <div className="flex flex-col gap-10">
                <div className="flex justify-between items-end">
                   <div>
                      <h1 className="text-[48px] font-black text-[#0F172A] tracking-tighter leading-none mb-2">Live Sector Map</h1>
                      <p className="text-slate-600 font-medium text-lg">Geospatial overview of venue density and flow</p>
                   </div>
                </div>
                
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 min-h-[600px] flex items-center justify-center">
                   <div className="w-full max-w-4xl">
                     <StadiumMap zones={zones} />
                   </div>
                </div>
              </div>
            )}
            
            {/* Fallback for other tabs */}
            {activeTab !== 'dashboard' && activeTab !== 'queuecontrol' && activeTab !== 'sectormap' && (
               <div className="flex flex-col items-center justify-center h-[50vh]">
                  <div className="w-24 h-24 mb-6 text-slate-300">
                    <Activity className="w-full h-full" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 capitalize">{activeTab} Integration</h2>
                  <p className="text-slate-500 text-center max-w-sm">This module dashboard is connected and actively tracking events. Specific views for this section are under construction.</p>
               </div>
            )}
         </div>
      </main>
    </div>
  );
}
