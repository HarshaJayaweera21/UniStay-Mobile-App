import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View, Modal } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { deleteRoomRequest, getRoomRequests, RoomRequest, updateRoomRequest } from "@/lib/roomRequestsApi";

const API_BASE = Platform.select({ android: "http://10.0.2.2:3000", default: "http://localhost:3000" });

const C = {
  bg:"#f0f4ff", card:"#fff", border:"#e2e8f0",
  primary:"#4f46e5", primaryDark:"#3730a3", primaryLight:"#eef2ff",
  blue:"#3b82f6", blueBg:"#eff6ff",
  pink:"#ec4899", pinkBg:"#fdf2f8",
  green:"#10b981", greenBg:"#ecfdf5",
  red:"#ef4444", redBg:"#fef2f2",
  amber:"#f59e0b", amberBg:"#fffbeb",
  purple:"#8b5cf6", purpleBg:"#f5f3ff",
  text:"#0f172a", muted:"#64748b", white:"#fff",
} as const;

const HOSTEL = { male:{total:500,single:150,double:350}, female:{total:500,single:150,double:350} };

const getName = (r:RoomRequest) => r.studentName || "—";
const getRoomLbl = (r:RoomRequest) => {
  const t = r.roomType ? r.roomType[0].toUpperCase()+r.roomType.slice(1)+" Room" : "—";
  return t;
};
const getPmLbl = (m?:string) => m==="bank-transfer"?"Bank Transfer":m==="cash"?"Cash":m||"—";
const getProof = (r:RoomRequest) => {
  if(!r.paymentProof) return null;
  return r.paymentProof.startsWith("http")?r.paymentProof:`${API_BASE}/${r.paymentProof.replace(/^\//,"")}`;
};
const fmtDate = (d:string) => new Date(d).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});
const norm = (p:any):RoomRequest[] => Array.isArray(p)?p:p?.requests||[];

/* ── Donut Chart (pure RN, no SVG lib) ── */
function DonutChart({single,double,total,accent}:{single:number;double:number;total:number;accent:string}) {
  const sp = single/total; // single percent
  const dp = double/total; // double percent
  const SIZE = 130, THICK = 18, R = (SIZE-THICK)/2;
  // We use a stacked-arc visual: two colored rings layered
  // Using border trick: inner circle + two overlapping arcs via clip+rotate
  return (
    <View style={{alignItems:"center",gap:12}}>
      <View style={{width:SIZE,height:SIZE,position:"relative",alignItems:"center",justifyContent:"center"}}>
        {/* Track */}
        <View style={{position:"absolute",width:SIZE,height:SIZE,borderRadius:SIZE/2,borderWidth:THICK,borderColor:C.border}} />
        {/* Single segment - left half visual */}
        <View style={{
          position:"absolute",width:SIZE,height:SIZE,borderRadius:SIZE/2,
          borderWidth:THICK,
          borderTopColor: sp>=0.5?accent:"transparent",
          borderRightColor: sp>=0.25?accent:"transparent",
          borderBottomColor:"transparent",
          borderLeftColor: sp>=0.75?accent:"transparent",
          transform:[{rotate:`${sp*360-90}deg`}],
        }} />
        {/* Simple approach: show as thick bordered ring with text */}
        <View style={{position:"absolute",width:SIZE,height:SIZE,borderRadius:SIZE/2,
          borderWidth:THICK,borderColor:"transparent",
          borderTopColor:accent,borderRightColor:sp>0.5?accent:C.border,
        }}/>
        {/* Center text */}
        <View style={{alignItems:"center",gap:2}}>
          <ThemedText style={{fontSize:22,fontWeight:"800",color:C.text}}>{total}</ThemedText>
          <ThemedText style={{fontSize:9,color:C.muted,fontWeight:"600"}}>TOTAL</ThemedText>
        </View>
      </View>
      {/* Legend */}
      <View style={{flexDirection:"row",gap:16}}>
        <View style={{flexDirection:"row",alignItems:"center",gap:5}}>
          <View style={{width:10,height:10,borderRadius:5,backgroundColor:accent}}/>
          <ThemedText style={{fontSize:11,color:C.muted,fontWeight:"600"}}>Single ({single})</ThemedText>
        </View>
        <View style={{flexDirection:"row",alignItems:"center",gap:5}}>
          <View style={{width:10,height:10,borderRadius:5,backgroundColor:C.border}}/>
          <ThemedText style={{fontSize:11,color:C.muted,fontWeight:"600"}}>Double ({double})</ThemedText>
        </View>
      </View>
    </View>
  );
}

/* ── Vertical Bar Chart for requests ── */
function BarChart({pending,approved,rejected}:{pending:number;approved:number;rejected:number}) {
  const max = Math.max(pending,approved,rejected,1);
  const bars = [
    {label:"Pending",val:pending,color:C.amber},
    {label:"Approved",val:approved,color:C.green},
    {label:"Rejected",val:rejected,color:C.red},
  ];
  return (
    <View style={{flexDirection:"row",alignItems:"flex-end",gap:12,height:100,paddingTop:8}}>
      {bars.map(b=>(
        <View key={b.label} style={{flex:1,alignItems:"center",gap:6}}>
          <ThemedText style={{fontSize:11,fontWeight:"700",color:b.color}}>{b.val}</ThemedText>
          <View style={{width:"100%",backgroundColor:C.border,borderRadius:8,height:70,justifyContent:"flex-end",overflow:"hidden"}}>
            <View style={{
              width:"100%",
              height:`${(b.val/max)*100}%` as any,
              backgroundColor:b.color,borderRadius:8,
            }}/>
          </View>
          <ThemedText style={{fontSize:9,color:C.muted,fontWeight:"600",textAlign:"center"}}>{b.label}</ThemedText>
        </View>
      ))}
    </View>
  );
}

/* ── Horizontal stacked bar ── */
function StackedBar({single,double,total,color}:{single:number;double:number;total:number;color:string}) {
  return (
    <View style={{gap:6}}>
      <View style={{flexDirection:"row",gap:8,alignItems:"center"}}>
        <View style={{flex:1,height:14,backgroundColor:C.border,borderRadius:999,overflow:"hidden",flexDirection:"row"}}>
          <View style={{width:`${(single/total)*100}%` as any,backgroundColor:color,borderRadius:999}}/>
          <View style={{width:`${(double/total)*100}%` as any,backgroundColor:color,opacity:0.35}}/>
        </View>
      </View>
      <View style={{flexDirection:"row",justifyContent:"space-between"}}>
        <ThemedText style={{fontSize:10,color:C.muted}}>Single: <ThemedText style={{color,fontWeight:"700"}}>{single}</ThemedText></ThemedText>
        <ThemedText style={{fontSize:10,color:C.muted}}>Double: <ThemedText style={{color,fontWeight:"700",opacity:.6}}>{double}</ThemedText></ThemedText>
      </View>
    </View>
  );
}

function StatusBadge({status}:{status:string}) {
  const bg = status==="approved"?C.greenBg:status==="rejected"?C.redBg:C.amberBg;
  const tc = status==="approved"?C.green:status==="rejected"?C.red:C.amber;
  return <View style={[s.badge,{backgroundColor:bg}]}><ThemedText style={[s.badgeTxt,{color:tc}]}>{status.toUpperCase()}</ThemedText></View>;
}

function Pill({label,value}:{label:string;value:string}) {
  return (
    <View style={s.pill}>
      <ThemedText style={s.pillLbl}>{label}</ThemedText>
      <ThemedText style={s.pillVal} numberOfLines={2}>{value||"—"}</ThemedText>
    </View>
  );
}

/* ════════ PAGE 1 ════════ */
function Dashboard({requests,loading,onRefresh,onSelect}:{
  requests:RoomRequest[]; loading:boolean; onRefresh:()=>void; onSelect:(r:RoomRequest)=>void;
}) {
  const counts = useMemo(()=>({
    total:requests.length,
    pending:requests.filter(r=>r.status==="pending").length,
    approved:requests.filter(r=>r.status==="approved").length,
    rejected:requests.filter(r=>r.status==="rejected").length,
  }),[requests]);

  return (
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={s.hero}>
        <View style={{flex:1}}>
          <ThemedText style={s.heroTitle}>🏨 Manager Dashboard</ThemedText>
          <ThemedText style={s.heroSub}>Hostel Room Request Management System</ThemedText>
        </View>
        <Pressable onPress={onRefresh} style={s.heroBtn}>
          <ThemedText style={{color:C.white,fontWeight:"700",fontSize:13}}>⟳ Refresh</ThemedText>
        </Pressable>
      </View>

      {/* Stat cards */}
      <View style={s.statsRow}>
        {[
          {label:"Total Requests",val:counts.total,color:C.primary,bg:C.primaryLight,icon:"📋"},
          {label:"Pending",val:counts.pending,color:C.amber,bg:C.amberBg,icon:"⏳"},
          {label:"Approved",val:counts.approved,color:C.green,bg:C.greenBg,icon:"✅"},
          {label:"Rejected",val:counts.rejected,color:C.red,bg:C.redBg,icon:"❌"},
        ].map(st=>(
          <View key={st.label} style={[s.statCard,{backgroundColor:st.bg}]}>
            <ThemedText style={{fontSize:18}}>{st.icon}</ThemedText>
            <ThemedText style={[s.statNum,{color:st.color}]}>{st.val}</ThemedText>
            <ThemedText style={s.statLbl}>{st.label}</ThemedText>
          </View>
        ))}
      </View>

      {/* Request Status Bar Chart */}
      <View style={s.card}>
        <ThemedText style={s.cardTitle}>📊 Requests by Status</ThemedText>
        <BarChart pending={counts.pending} approved={counts.approved} rejected={counts.rejected}/>
      </View>

      {/* Wing Charts Row */}
      <ThemedText style={s.secTitle}>🏠 Room Availability</ThemedText>
      <View style={{flexDirection:"row",gap:10}}>
        {/* Male */}
        <View style={[s.card,{flex:1}]}>
          <View style={[s.wingBadge,{backgroundColor:C.blueBg}]}>
            <ThemedText style={{fontSize:11,fontWeight:"800",color:C.blue}}>🚹 MALE WING</ThemedText>
          </View>
          <DonutChart single={HOSTEL.male.single} double={HOSTEL.male.double} total={HOSTEL.male.total} accent={C.blue}/>
          <StackedBar single={HOSTEL.male.single} double={HOSTEL.male.double} total={HOSTEL.male.total} color={C.blue}/>
        </View>
        {/* Female */}
        <View style={[s.card,{flex:1}]}>
          <View style={[s.wingBadge,{backgroundColor:C.pinkBg}]}>
            <ThemedText style={{fontSize:11,fontWeight:"800",color:C.pink}}>🚺 FEMALE WING</ThemedText>
          </View>
          <DonutChart single={HOSTEL.female.single} double={HOSTEL.female.double} total={HOSTEL.female.total} accent={C.pink}/>
          <StackedBar single={HOSTEL.female.single} double={HOSTEL.female.double} total={HOSTEL.female.total} color={C.pink}/>
        </View>
      </View>

      {/* Requests list */}
      <ThemedText style={s.secTitle}>📋 Received Requests</ThemedText>
      {loading && <ActivityIndicator color={C.primary}/>}
      {!loading && requests.length===0 && (
        <View style={[s.card,{alignItems:"center",paddingVertical:32}]}>
          <ThemedText style={{color:C.muted,fontSize:14}}>No requests found.</ThemedText>
        </View>
      )}
      {requests.map((req,i)=>(
        <Pressable key={req._id} onPress={()=>onSelect(req)}
          style={({pressed})=>[s.reqRow,pressed&&{opacity:0.75}]}>
          <View style={[s.reqIdx,{backgroundColor:C.primaryLight}]}>
            <ThemedText style={{fontSize:12,fontWeight:"800",color:C.primary}}>{i+1}</ThemedText>
          </View>
          <View style={{flex:1,gap:3}}>
            <ThemedText style={s.reqName} numberOfLines={1}>{getName(req)}</ThemedText>
            <ThemedText style={s.reqMeta} numberOfLines={1}>
              {getRoomLbl(req)} · {req.studentItNumber||"—"} · {fmtDate(req.createdAt)}
            </ThemedText>
          </View>
          <View style={{alignItems:"flex-end",gap:4}}>
            <StatusBadge status={req.status}/>
            <ThemedText style={{fontSize:20,color:C.muted,fontWeight:"300"}}>›</ThemedText>
          </View>
        </Pressable>
      ))}
      <View style={{height:40}}/>
    </ScrollView>
  );
}

/* ════════ PAGE 2 ════════ */
function Detail({req,loading,onBack,onApprove,onReject,onDelete}:{
  req:RoomRequest; loading:boolean;
  onBack:()=>void; onApprove:()=>void; onReject:()=>void; onDelete:()=>void;
}) {
  const img = getProof(req);
  const [zoomImg, setZoomImg] = useState(false);
  return (
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      <Pressable onPress={(e) => { e.preventDefault(); e.stopPropagation(); onBack(); }} hitSlop={20} style={({pressed})=>[s.backBtn, pressed && {opacity: 0.6}]}>
        <ThemedText style={{color:C.primary,fontWeight:"700",fontSize:15}}>‹  Back to Dashboard</ThemedText>
      </Pressable>

      {/* Header card */}
      <View style={[s.card,{borderLeftWidth:4,borderLeftColor:C.primary}]}>
        <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start"}}>
          <View style={{flex:1,gap:4}}>
            <ThemedText style={{fontSize:20,fontWeight:"800",color:C.text}}>{getRoomLbl(req)}</ThemedText>
            <ThemedText style={{fontSize:12,color:C.muted}}>Submitted: {fmtDate(req.createdAt)}</ThemedText>
          </View>
          <StatusBadge status={req.status}/>
        </View>
      </View>

      {/* Student info */}
      <View style={s.card}>
        <ThemedText style={s.secLbl}>👤 STUDENT INFORMATION</ThemedText>
        <View style={s.pillGrid}>
          <Pill label="Full Name" value={getName(req)}/>
          <Pill label="IT Number" value={req.studentItNumber||"—"}/>
          <Pill label="Gender" value={req.gender?req.gender[0].toUpperCase()+req.gender.slice(1):"—"}/>
          <Pill label="Year of Study" value={req.yearOfStudy||"—"}/>
          <Pill label="Faculty" value={req.faculty||"—"}/>
          <Pill label="Payment Method" value={getPmLbl(req.paymentMethod)}/>
        </View>
      </View>

      {/* Guardian & Medical */}
      {(req.guardianName||req.emergencyName||req.medicalConditions) && (
        <View style={s.card}>
          <ThemedText style={s.secLbl}>🏥 GUARDIAN & MEDICAL</ThemedText>
          <View style={s.pillGrid}>
            {req.guardianName&&<Pill label="Guardian" value={`${req.guardianName} · ${req.guardianContact||"—"}`}/>}
            {req.emergencyName&&<Pill label="Emergency" value={`${req.emergencyName} · ${req.emergencyPhone||"—"}`}/>}
            {req.medicalConditions&&<Pill label="Conditions" value={req.medicalConditions}/>}
            {(req.allergies||req.medications)&&<Pill label="Allergies / Meds" value={`${req.allergies||"None"} / ${req.medications||"None"}`}/>}
          </View>
        </View>
      )}

      {/* Payment proof */}
      <View style={s.card}>
        <ThemedText style={s.secLbl}>💳 PAYMENT PROOF</ThemedText>
        {img?(
          <>
            <Pressable onPress={()=>setZoomImg(true)}>
              <Image source={{uri:img}} style={s.proofImg} contentFit="contain" cachePolicy="none"/>
            </Pressable>
            <Modal visible={zoomImg} transparent={true} animationType="fade" onRequestClose={()=>setZoomImg(false)}>
              <View style={{flex:1,backgroundColor:"rgba(0,0,0,0.9)",justifyContent:"center",alignItems:"center"}}>
                <Pressable onPress={()=>setZoomImg(false)} style={{position:"absolute",top:40,right:20,zIndex:10,padding:10}}>
                  <ThemedText style={{color:"white",fontSize:18,fontWeight:"bold"}}>✕ Close</ThemedText>
                </Pressable>
                <Image source={{uri:img}} style={{width:"100%",height:"80%"}} contentFit="contain" />
              </View>
            </Modal>
          </>
        ):(
          <View style={s.noProof}>
            <ThemedText style={{color:C.muted,fontSize:13,fontWeight:"600"}}>No payment proof uploaded.</ThemedText>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={s.actions}>
        {loading?<ActivityIndicator color={C.primary} style={{flex:1}}/>:<>
          <Pressable onPress={onApprove} style={[s.actBtn,{backgroundColor:req.status==="approved"?C.green:C.greenBg}]}>
            <ThemedText style={[s.actTxt,{color:req.status==="approved"?C.white:C.green}]}>✓  Approve</ThemedText>
          </Pressable>
          <Pressable onPress={onReject} style={[s.actBtn,{backgroundColor:req.status==="rejected"?C.red:C.redBg}]}>
            <ThemedText style={[s.actTxt,{color:req.status==="rejected"?C.white:C.red}]}>✕  Reject</ThemedText>
          </Pressable>
          <Pressable onPress={onDelete} style={[s.actBtn,{backgroundColor:"#f1f5f9",flex:0.6}]}>
            <ThemedText style={[s.actTxt,{color:C.muted}]}>Delete</ThemedText>
          </Pressable>
        </>}
      </View>
      <View style={{height:40}}/>
    </ScrollView>
  );
}

/* ════════ ROOT ════════ */
export default function ManagerApprovalScreen() {
  const token = process.env.EXPO_PUBLIC_MANAGER_JWT||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWQxMTM2YWUzZWU2MjRmYmYwMWRlZDciLCJpYXQiOjE3NzY2OTc5OTksImV4cCI6MTc3Njc4NDM5OX0.xSpe7m7eEUKbSxotFebqrog4v5ogdqR1f_7ByCe2snA";
  const [requests,setRequests] = useState<RoomRequest[]>([]);
  const [loading,setLoading]   = useState(false);
  const [selected,setSelected] = useState<RoomRequest|null>(null);

  const load = useCallback(async()=>{
    setLoading(true);
    try{ const d=await getRoomRequests(token||"DEV"); setRequests(norm(d)); }
    catch{}finally{setLoading(false);}
  },[token]);

  useEffect(()=>{load();},[load]);

  const updateStatus = useCallback(async(status:"approved"|"rejected")=>{
    if(!selected) return;
    setLoading(true);
    try{
      const res=await updateRoomRequest(token,selected._id,{status});
      const u={...selected,status:res.status||status};
      setRequests(p=>p.map(r=>r._id===selected._id?u:r));
      setSelected(u);
    }catch{}finally{setLoading(false);}
  },[selected,token]);

  const remove = useCallback(async()=>{
    if(!selected) return;
    try{
      await deleteRoomRequest(token,selected._id);
      setRequests(p=>p.filter(r=>r._id!==selected._id));
      setSelected(null);
    }catch{}
  },[selected,token]);

  return (
    <ThemedView style={s.screen}>
      <SafeAreaView style={{flex:1}}>
        {selected?(
          <Detail req={selected} loading={loading} onBack={() => { setLoading(false); setSelected(null); }}
            onApprove={()=>updateStatus("approved")} onReject={()=>updateStatus("rejected")} onDelete={remove}/>
        ):(
          <Dashboard requests={requests} loading={loading} onRefresh={load} onSelect={setSelected}/>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  screen:{flex:1,backgroundColor:C.bg},
  page:{padding:16,gap:14},

  hero:{
    backgroundColor:C.primary,borderRadius:18,padding:20,
    flexDirection:"row",alignItems:"center",gap:12,
  },
  heroTitle:{fontSize:20,fontWeight:"800",color:C.white},
  heroSub:{fontSize:11,color:"rgba(255,255,255,0.75)",marginTop:2},
  heroBtn:{backgroundColor:"rgba(255,255,255,0.2)",borderRadius:999,paddingHorizontal:14,paddingVertical:8},

  statsRow:{flexDirection:"row",gap:8},
  statCard:{flex:1,borderRadius:14,padding:10,alignItems:"center",gap:2,borderWidth:1,borderColor:C.border},
  statNum:{fontSize:20,fontWeight:"800"},
  statLbl:{fontSize:8,color:C.muted,fontWeight:"700",textAlign:"center"},

  secTitle:{fontSize:13,fontWeight:"800",color:C.text,letterSpacing:0.3},

  card:{backgroundColor:C.card,borderRadius:16,padding:14,borderWidth:1,borderColor:C.border,gap:12},
  cardTitle:{fontSize:13,fontWeight:"800",color:C.text},
  wingBadge:{borderRadius:8,paddingHorizontal:10,paddingVertical:5,alignSelf:"flex-start"},

  reqRow:{
    backgroundColor:C.card,borderRadius:14,borderWidth:1,borderColor:C.border,
    flexDirection:"row",alignItems:"center",padding:14,gap:10,
  },
  reqIdx:{width:28,height:28,borderRadius:14,alignItems:"center",justifyContent:"center"},
  reqName:{fontSize:14,fontWeight:"700",color:C.text},
  reqMeta:{fontSize:11,color:C.muted},

  badge:{borderRadius:6,paddingHorizontal:8,paddingVertical:4},
  badgeTxt:{fontSize:9,fontWeight:"800",letterSpacing:0.6},

  backBtn:{paddingVertical:12,paddingRight:20,marginBottom:4,alignSelf:"flex-start",cursor:"pointer" as any},
  secLbl:{fontSize:10,fontWeight:"800",color:C.primary,letterSpacing:1.2},
  pillGrid:{flexDirection:"row",flexWrap:"wrap",gap:8},
  pill:{backgroundColor:"#f8fafc",borderRadius:12,borderWidth:1,borderColor:C.border,
    paddingHorizontal:12,paddingVertical:10,minWidth:"47%",flex:1,gap:3},
  pillLbl:{fontSize:9,fontWeight:"700",color:C.muted,letterSpacing:0.8},
  pillVal:{fontSize:13,fontWeight:"600",color:C.text},

  proofImg:{width:"100%",height:200,borderRadius:14,backgroundColor:C.border,borderWidth:1,borderColor:C.border},
  noProof:{borderWidth:1,borderColor:C.border,borderStyle:"dashed",borderRadius:14,paddingVertical:24,alignItems:"center"},

  actions:{flexDirection:"row",gap:8},
  actBtn:{
    flex:1,
    borderRadius:14,
    minHeight:50,
    alignItems:"center",
    justifyContent:"center",
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actTxt:{fontSize:14,fontWeight:"700"},
});
