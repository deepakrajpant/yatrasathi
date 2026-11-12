export const SCHEMA_VERSION=1, DAY=86400000;
export const LEVELS={1:"Basic + very important",2:"Medium + very important",3:"Hard + important"};
export const REPORT_TYPES=["Wrong answer","Incorrect explanation","Duplicate","Typing error","Outdated information","Missing image","Other"];
export const DEFAULT_SETTINGS={title:"Sajilo GK",welcome:"Small steps. Stronger preparation.",primaryColor:"#176958",registrationEnabled:true,maintenance:"",masteryStreak:3};
export const EXAMS=["General Loksewa","Nepal Telecom (NTC)","Nepal Electricity Authority (NEA)"];
export function esc(value=""){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
export function id(){return crypto.randomUUID();}
export function nepalDay(time=Date.now()){return new Date(time+20700000).toISOString().slice(0,10);}
export function dateText(time){return new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kathmandu"}).format(new Date(time));}
export function duration(seconds){seconds=Math.max(0,Math.ceil(seconds));return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");}
export function shuffle(items){const list=[...items];for(let i=list.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;}
export function safeURL(value){if(!value)return "";try{const u=new URL(value);return u.protocol==="https:"?u.href:"";}catch{return "";}}
export function validateQuestion(q){
  const errors=[];
  if(!q||typeof q!=="object"||Array.isArray(q))return ["Question must be an object"];
  if(typeof q.id!=="string"||!/^[A-Za-z0-9_-]{1,100}$/.test(q.id))errors.push("ID: use 1-100 letters, digits, underscores or hyphens");
  for(const field of ["exam","subject","chapter","topic","question"])if(typeof q[field]!=="string"||!q[field].trim()||q[field].length>4000)errors.push(field+" is required (maximum 4000 characters)");
  if(![1,2,3].includes(q.level))errors.push("level must be 1, 2 or 3");
  if(![1,2,3].includes(q.importance))errors.push("importance must be 1, 2 or 3");
  if(!Array.isArray(q.options)||q.options.length<2||q.options.length>4||q.options.some(o=>typeof o!=="string"||!o.trim()||o.length>2000))errors.push("Provide 2-4 non-empty options");
  if(Array.isArray(q.options)&&new Set(q.options.map(o=>String(o).trim().toLowerCase())).size!==q.options.length)errors.push("Options must be distinct");
  if(!Number.isInteger(q.correct)||q.correct<0||q.correct>=(q.options?.length||0))errors.push("correct must be a zero-based option index");
  if(!["published","draft","archived"].includes(q.status))errors.push("Invalid status");
  if(!Number.isFinite(q.marks)||q.marks<=0||q.marks>100)errors.push("marks must be between 0 and 100");
  for(const key of ["explanation","trick","source"])if(q[key]!==undefined&&(typeof q[key]!=="string"||q[key].length>12000))errors.push(key+" must be text, maximum 12000 characters");
  if(q.tags!==undefined&&(!Array.isArray(q.tags)||q.tags.length>30||q.tags.some(x=>typeof x!=="string"||x.length>100)))errors.push("Invalid tags");
  if(q.image&&!safeURL(q.image))errors.push("Image must use a complete HTTPS URL");
  if(!["practice","verified","past-paper"].includes(q.verification))errors.push("Invalid verification status");
  if(["verified","past-paper"].includes(q.verification)&&!q.source?.trim())errors.push("Verified content requires a source");
  return errors;
}
export function normalizeQuestion(input){
  return {id:String(input.id||""),exam:String(input.exam||EXAMS[0]),subject:String(input.subject||""),chapter:String(input.chapter||""),topic:String(input.topic||""),level:Number(input.level||1),importance:Number(input.importance||2),question:String(input.question||""),options:Array.isArray(input.options)?input.options.map(String):[],correct:Number(input.correct??-1),marks:Number(input.marks??1),explanation:String(input.explanation||""),trick:String(input.trick||""),source:String(input.source||""),verification:input.verification||"practice",tags:Array.isArray(input.tags)?input.tags:[],image:String(input.image||""),status:input.status||"draft"};
}
export function fingerprint(q){return [q.question,...(q.options||[])].join("|").normalize("NFKC").replace(/\s+/g," ").trim().toLowerCase();}
export function blankProgress(){return {viewed:0,attempts:0,correct:0,wrong:0,streak:0,reviews:0,interval:0,lastReviewed:0,nextReview:0,status:"not-started",bookmark:false,difficult:false};}
export function reviewProgress(previous={},rating,now=Date.now(),mastery=3){
  if(!["again","hard","good","easy"].includes(rating))throw Error("Invalid recall rating");
  const p={...blankProgress(),...previous};
  const success=["good","easy"].includes(rating),scheduled=p.lastReviewed===0||now>=p.nextReview;
  const streak=rating==="again"||rating==="hard"?0:p.streak+(success&&scheduled?1:0);
  const interval=rating==="again"?10/1440:rating==="hard"?1:rating==="easy"?Math.max(4,Math.round(p.interval*2.5)):p.interval<1?1:Math.max(3,Math.round(p.interval*2));
  return {...p,attempts:p.attempts+1,correct:p.correct+(rating==="again"?0:1),wrong:p.wrong+(rating==="again"?1:0),reviews:p.reviews+1,streak,interval,lastReviewed:now,nextReview:now+interval*DAY,status:streak>=mastery?"mastered":rating==="again"||rating==="hard"?"needs-revision":"learning"};
}
export function scoreTest(questions,answers,negative=0){
  let correct=0,wrong=0,skipped=0,obtained=0,total=0;
  const groups={subject:{},topic:{},level:{}};
  questions.forEach((q,i)=>{
    const marks=Number(q.marks)||1,answered=Number.isInteger(answers[i])&&answers[i]>=0&&answers[i]<q.options.length,isCorrect=answered&&answers[i]===q.correct;
    total+=marks;if(!answered)skipped++;else if(isCorrect){correct++;obtained+=marks;}else{wrong++;obtained-=marks*negative;}
    for(const key of Object.keys(groups)){const name=String(q[key]);const g=groups[key][name]??={correct:0,total:0,marks:0,obtained:0};g.total++;g.marks+=marks;g.correct+=Number(isCorrect);g.obtained+=isCorrect?marks:answered?-marks*negative:0;}
  });
  return {correct,wrong,skipped,obtained:Math.round(obtained*100)/100,total,percentage:total?Math.round(obtained/total*10000)/100:0,accuracy:correct+wrong?Math.round(correct/(correct+wrong)*100):0,groups};
}
export function recommend(questions,progress,now=Date.now()){
  return [...questions].sort((a,b)=>priority(b)-priority(a));
  function priority(q){const p=progress[q.id]||blankProgress();return q.importance*5+(p.nextReview&&p.nextReview<=now?50:0)+Math.min(10,p.wrong)*4+(p.difficult?20:0)+(p.status==="not-started"?10:0)-(p.status==="mastered"?30:0);}
}
export function filterQuestions(questions,f={},progress={}){
  const query=(f.search||"").trim().toLowerCase();
  return questions.filter(q=>{
    const p=progress[q.id]||blankProgress();
    return ["exam","subject","chapter","topic","level","importance","status"].every(k=>!f[k]||f[k]==="all"||String(q[k])===String(f[k]))
    &&(!f.learning||f.learning==="all"||p.status===f.learning)
    &&(!query||[q.id,q.question,...q.options,q.explanation,q.source,...(q.tags||[])].join(" ").toLowerCase().includes(query));
  });
}
export function streak(sessions,now=Date.now()){
  const dates=new Set(sessions.map(s=>s.day));let count=0,cursor=now;
  if(!dates.has(nepalDay(cursor)))cursor-=DAY;
  while(dates.has(nepalDay(cursor))){count++;cursor-=DAY;}
  return count;
}
export function download(name,value,type="application/json"){
  const blob=new Blob([typeof value==="string"?value:JSON.stringify(value,null,2)],{type});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
