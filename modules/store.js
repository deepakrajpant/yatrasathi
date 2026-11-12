import {blankProgress,DEFAULT_SETTINGS,validateQuestion,normalizeQuestion,fingerprint,id,nepalDay} from "./domain.js";

const CONFIG={apiKey:"AIzaSyDK1wwahwoJxNAH_Iats2wrSMUA42jVhSI",authDomain:"loksewa-2083.firebaseapp.com",projectId:"loksewa-2083",storageBucket:"loksewa-2083.firebasestorage.app",messagingSenderId:"484441818228",appId:"1:484441818228:web:fb43d456131cd40ec1fd21",measurementId:"G-D5RTD5R7B4"};
const event=(name,detail)=>window.dispatchEvent(new CustomEvent(name,{detail}));
const empty=()=>({progress:{},attempts:[],sessions:[],profile:{name:"",exam:"General Loksewa",goal:10},pending:{}});
let database;
async function cacheDB(){if(!database)database=new Promise((resolve,reject)=>{const request=indexedDB.open("sajilo-gk",1);request.onupgradeneeded=()=>request.result.createObjectStore("cache");request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});return database;}
export const cache={
 async get(key){try{const db=await cacheDB();return await new Promise((resolve,reject)=>{const req=db.transaction("cache").objectStore("cache").get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}catch{return null;}},
 async set(key,value){try{const db=await cacheDB();await new Promise((resolve,reject)=>{const tx=db.transaction("cache","readwrite");tx.objectStore("cache").put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}catch{/* User progress also has a localStorage journal. */}}
};
export const store={
 sdk:null,db:null,auth:null,user:null,admin:false,access:{},settings:{...DEFAULT_SETTINGS},questions:[],total:null,cursor:null,hasMore:false,local:empty(),ready:false,generation:0,queue:Promise.resolve(),
 key(){return "sajilo-gk:student:"+(this.user?.uid||"guest");},
 readLocal(){try{const raw=JSON.parse(localStorage.getItem(this.key())||"null");this.local=raw&&raw.progress&&Array.isArray(raw.attempts)&&Array.isArray(raw.sessions)?{...empty(),...raw}:empty();}catch{this.local=empty();}},
 persist(){try{localStorage.setItem(this.key(),JSON.stringify(this.local));}catch{event("app:message","Device storage is full or blocked. Export your progress from Profile.");}},
 progress(qid){return {...blankProgress(),...this.local.progress[qid]};},
 async initialize(){
   this.readLocal();
   const cached=await cache.get("public-questions");
   const response=await fetch("./data/sample-questions.json");const sample=await response.json();
   this.samples=sample.questions.map(q=>({...q,sample:true}));
   this.questions=cached?.length?cached:this.samples;
   event("app:data");
   try{
     const [app,auth,fire]=await Promise.all([import("https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js"),import("https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"),import("https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js")]);
     this.sdk={...auth,...fire};const application=app.initializeApp(CONFIG);this.auth=auth.getAuth(application);this.db=fire.getFirestore(application);this.ready=true;
     auth.onAuthStateChanged(this.auth,user=>this.changeUser(user).catch(error=>event("app:error",error)));
     this.get("appSettings","public").then(s=>{if(s)this.settings={...DEFAULT_SETTINGS,...s};event("app:data");}).catch(error=>event("app:cloud-error",error));
   }catch(error){event("app:message","Firebase could not connect. Cached/sample study remains available; sign-in requires internet.");event("app:cloud-error",error);}
 },
 async changeUser(user){
   const previous=this.user?.uid||null;
   const generation=++this.generation;this.user=user;this.admin=false;this.access={};this.readLocal();
   this.cursor=null;this.total=null;this.hasMore=false;
   this.questions=(await cache.get("public-questions"))||this.samples||[];
   event("app:auth",{changed:previous!==(user?.uid||null)});
   if(user){
     const values=await Promise.allSettled([this.get("admins",user.uid),this.get("access",user.uid),this.get("users",user.uid)]);
     if(generation!==this.generation)return;
     this.admin=values[0].status==="fulfilled"&&!!values[0].value&&user.emailVerified;
     this.access=values[1].status==="fulfilled"?values[1].value||{}:{};
     if(this.access.disabled){event("app:message","Your application account is disabled. Contact the administrator.");event("app:auth",{changed:false});return;}
     if(values[2].status==="fulfilled"&&values[2].value)this.local.profile={...this.local.profile,...values[2].value};
     if(values[2].status==="fulfilled"&&!values[2].value)await this.setProfile({name:user.displayName||user.email?.split("@")[0]||"Learner",email:user.email,exam:"General Loksewa",goal:10});
     try{
       const [progress,attempts,sessions]=await Promise.all([this.all("users/"+user.uid+"/questionProgress"),this.all("users/"+user.uid+"/testAttempts"),this.all("users/"+user.uid+"/studySessions")]);
       if(generation!==this.generation)return;
       for(const p of progress)if(!this.local.pending["progress:"+p.id])this.local.progress[p.id]=p;
       const attemptMap=new Map([...attempts,...this.local.attempts].map(a=>[a.id,a]));this.local.attempts=[...attemptMap.values()].sort((a,b)=>b.finished-a.finished);
       const sessionMap=new Map([...sessions,...this.local.sessions].map(s=>[s.id,s]));this.local.sessions=[...sessionMap.values()].sort((a,b)=>b.started-a.started).slice(0,1000);
       this.persist();await this.flush();
     }catch(error){event("app:cloud-error",error);}
   }
   if(generation!==this.generation)return;
   await this.loadQuestions(true);event("app:auth",{changed:false});event("app:data");
 },
 requireCloud(){if(!this.sdk||!this.db)throw Error("Firebase is unavailable. Connect to the internet and reload.");},
 requireAdmin(){this.requireCloud();if(!this.admin)throw Error("A verified, console-provisioned administrator account is required.");},
 async get(collection,key){this.requireCloud();const s=await this.sdk.getDoc(this.sdk.doc(this.db,collection,key));return s.exists()?{...s.data(),id:s.id}:null;},
 async list(collection,{pageSize=100,cursor=null,filters=[]}={}){
   this.requireCloud();const s=this.sdk;
   const clauses=filters.map(([field,op,value])=>s.where(field,op,value));clauses.push(s.orderBy(s.documentId()));if(cursor)clauses.push(s.startAfter(cursor));clauses.push(s.limit(pageSize));
   const snap=await s.getDocs(s.query(s.collection(this.db,collection),...clauses));
   return {items:snap.docs.map(d=>({...d.data(),id:d.id})),cursor:snap.docs.at(-1)||null,hasMore:snap.size===pageSize};
 },
 async all(collection,filters=[]){const output=[];let cursor=null;for(;;){const page=await this.list(collection,{filters,cursor});output.push(...page.items);if(!page.hasMore)break;cursor=page.cursor;}return output;},
 async count(collection,filters=[]){this.requireCloud();const s=this.sdk;return (await s.getCountFromServer(s.query(s.collection(this.db,collection),...filters.map(f=>s.where(...f))))).data().count;},
 async loadQuestions(reset=false){
   this.requireCloud();const generation=this.generation,admin=this.admin;
   const filters=admin?[]:[["status","==","published"]];
   try{
     const page=await this.list("questions",{filters,cursor:reset?null:this.cursor});
     if(generation!==this.generation)return;
     const valid=page.items.filter(q=>!validateQuestion(q).length);
     if(reset)this.questions=valid.length?valid:!page.hasMore?this.samples:[];
     else this.questions=[...new Map([...this.questions.filter(q=>!q.sample),...valid].map(q=>[q.id,q])).values()];
     this.cursor=page.cursor;this.hasMore=page.hasMore;
     this.total=await this.count("questions",filters);
     if(!admin)await cache.set("public-questions",this.questions.filter(q=>!q.sample));
     event("app:data");
   }catch(error){event("app:cloud-error",error);throw error;}
 },
 async question(qid){const cached=this.questions.find(q=>q.id===qid);if(cached)return cached;return await this.get("questions",qid);},
 updateProgress(qid,patch){
   const value={...this.progress(qid),...patch,id:qid,updated:Date.now()};
   this.local.progress[qid]=value;this.local.pending["progress:"+qid]={collection:"questionProgress",id:qid,data:value};this.persist();this.flush();event("app:progress");
 },
 addSession(kind,questionId,seconds=0){
   const value={id:id(),kind,questionId:questionId||"",started:Date.now(),day:nepalDay(),seconds:Math.max(0,Math.min(3600,Math.round(seconds)))};
   this.local.sessions.unshift(value);this.local.sessions=this.local.sessions.slice(0,1000);this.local.pending["session:"+value.id]={collection:"studySessions",id:value.id,data:value};this.persist();this.flush();
 },
 saveAttempt(attempt){
   this.local.attempts=[attempt,...this.local.attempts.filter(a=>a.id!==attempt.id)].slice(0,100);
   this.local.pending["attempt:"+attempt.id]={collection:"testAttempts",id:attempt.id,data:attempt};this.persist();this.flush();
 },
 async flush(){
   if(!this.user||!this.ready||this.access.disabled)return;
   const uid=this.user.uid,generation=this.generation;
   this.queue=this.queue.catch(()=>{}).then(async()=>{
     if(generation!==this.generation)return;
     for(const [key,entry] of Object.entries(this.local.pending)){
       try{
         if(generation!==this.generation)return;
         const ref=this.sdk.doc(this.db,"users",uid,entry.collection,entry.id);
         if(entry.collection==="testAttempts")await this.sdk.runTransaction(this.db,async tx=>{const existing=await tx.get(ref);if(!existing.exists())tx.set(ref,entry.data);});
         else await this.sdk.setDoc(ref,entry.data);
         if(generation!==this.generation)return;
         if(JSON.stringify(this.local.pending[key])===JSON.stringify(entry))delete this.local.pending[key];this.persist();
       }catch(error){event("app:cloud-error",error);break;}
     }
     if(generation===this.generation)event("app:sync",Object.keys(this.local.pending).length===0);
   });
   return this.queue;
 },
 async setProfile(patch){
   this.requireCloud();if(!this.user)throw Error("Sign in first.");
   const current=this.local.profile;
   const data={name:String(patch.name??current.name??"").slice(0,100),email:this.user.email||"",exam:String(patch.exam??current.exam??"General Loksewa").slice(0,150),goal:Math.min(500,Math.max(1,Number(patch.goal??current.goal??10))),lastActive:Date.now()};
   await this.sdk.setDoc(this.sdk.doc(this.db,"users",this.user.uid),data);
   this.local.profile=data;this.persist();event("app:data");
 },
 async questionHash(q){const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(fingerprint(q)));return [...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,"0")).join("");},
 async writeQuestion(input,mode="upsert"){
   this.requireAdmin();const q=normalizeQuestion(input),errors=validateQuestion(q);if(errors.length)throw Error(errors.join("\n"));
   const s=this.sdk,ref=s.doc(this.db,"questions",q.id),uid=this.user.uid,hash=await this.questionHash(q);
   const outcome=await s.runTransaction(this.db,async tx=>{
     const old=await tx.get(ref);
     if(mode==="new"&&old.exists())return "skipped";
     if(mode==="update"&&!old.exists())return "missing";
     if(old.exists())tx.set(s.doc(this.db,"questionVersions",id()),{questionId:q.id,previous:old.data(),created:Date.now(),actor:uid});
     tx.set(ref,{...q,fingerprintHash:hash,updated:Date.now(),updatedBy:uid});
     tx.set(s.doc(this.db,"adminAuditLogs",id()),{actor:uid,action:old.exists()?"question.update":"question.create",target:q.id,created:Date.now()});
     return old.exists()?"updated":"created";
   });
   return outcome;
 },
 async saveAdmin(collection,key,data){
   this.requireAdmin();const s=this.sdk,b=s.writeBatch(this.db);
   b.set(s.doc(this.db,collection,key),{...data,updated:Date.now(),updatedBy:this.user.uid});
   b.set(s.doc(this.db,"adminAuditLogs",id()),{actor:this.user.uid,action:collection+".save",target:key,created:Date.now()});await b.commit();
 },
 async report(data){
   this.requireCloud();if(!this.user)throw Error("Sign in to submit a question report.");
   await this.sdk.setDoc(this.sdk.doc(this.db,"questionReports",id()),{...data,uid:this.user.uid,status:"pending",resolution:"",created:Date.now()});
 },
 async curriculum(){if(!this.ready)return [];return this.all("curriculum");},
 async tests(){if(!this.ready)return [];return this.all("mockTests",this.admin?[]:[["status","==","published"],...(!this.premium()?[["premium","==",false]]:[])]);},
 async announcements(){if(!this.ready)return [];return this.all("announcements",this.admin?[]:[["published","==",true]]);},
 premium(){return this.admin||Number(this.access.premiumUntil)>Date.now();}
};
window.addEventListener("online",()=>store.flush());
