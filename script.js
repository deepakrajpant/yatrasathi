import {esc,dateText} from "./modules/domain.js";
import {store} from "./modules/store.js";
import {createStudent} from "./modules/student.js";

const $=selector=>document.querySelector(selector),actions=new Map();
let adminModule,student,renderToken=0,lastRoute="",toastTimer;
const c={
 store,main:$("#main"),
 heading(title,subtitle,eyebrow="SAJILO GK"){return `<div class="page-heading"><div><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1><p class="muted">${esc(subtitle)}</p></div><span class="date-label">${esc(new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",timeZone:"Asia/Kathmandu"}).format(new Date()))}</span></div>`;},
 stats(items){return `<div class="stats">${items.map((item,i)=>`<a class="stat" href="${item.href||"#progress"}"><span class="stat-icon">${item.icon||["&#9636;","&#9677;","&#8599;"][i%3]}</span><div><strong>${esc(item.value)}</strong><small>${esc(item.label)}</small></div></a>`).join("")}</div>`;},
 action(name,fn){actions.set(name,fn);},
 invoke(name,button){const fn=actions.get(name);if(fn)return c.run(()=>fn(button));},
 async run(fn){try{return await fn();}catch(error){c.toast(c.errorText(error));console.warn("Sajilo GK operation:",error?.code||error?.message);}},
 errorText(error){const map={"permission-denied":"Permission denied. Check your account access and deploy the supplied Firestore Rules.","unavailable":"Connection unavailable. Your local work is retained; reconnect and retry.","auth/invalid-credential":"Email or password did not match.","auth/email-already-in-use":"This email already has an account. Sign in instead.","auth/weak-password":"Choose a password with at least six characters.","auth/operation-not-allowed":"Enable Email/Password sign-in in Firebase Console.","auth/unauthorized-domain":"Add this hostname to Firebase Authentication authorized domains.","auth/network-request-failed":"Network request failed. Check your connection.","auth/too-many-requests":"Too many attempts. Please try again later."};if(/dynamically imported module|Failed to fetch/i.test(error?.message||""))return "Cloud connection unavailable. Local practice still works. Check your internet and reload to sign in.";return map[error?.code]||String(error?.message||"The operation could not finish. Please retry.").slice(0,400);},
 toast(message){$("#toast").textContent=message;$("#toast").classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("#toast").classList.remove("visible"),5000);},
 modal(html,extra=""){const node=$("#modal");node.className=extra;node.innerHTML=`<button class="close" aria-label="Close dialog" data-a="close-modal">&times;</button>${html}`;if(!node.open)node.showModal();},
 closeModal(){$("#modal").close();},
 applySettings(){document.title=store.settings.title+" | Smart preparation";if(/^#[0-9a-f]{6}$/i.test(store.settings.primaryColor))document.documentElement.style.setProperty("--green",store.settings.primaryColor);$("#notice").hidden=!store.settings.maintenance;$("#notice").textContent=store.settings.maintenance||"";}
};
const navItems=[["dashboard","&#8962;","Dashboard"],["library","&#9638;","Subjects"],["revision","&#8635;","Revision"],["mock","&#9677;","Mock tests"],["progress","&#8599;","Progress"]];
function shell(){
 $("#studentNav").innerHTML=navItems.map(([path,icon,label])=>`<a href="#${path}" data-nav="${path}"><span>${icon}</span>${label}</a>`).join("")+`<a class="extra-nav" href="#saved" data-nav="saved"><span>&#9734;</span>Bookmarks</a><a class="extra-nav" href="#exam-day" data-nav="exam-day"><span>&#9672;</span>Exam day</a><a class="extra-nav" href="#profile" data-nav="profile"><span>&#9673;</span>My profile</a>${store.admin?`<a class="extra-nav admin-link" href="#admin/overview" data-nav="admin"><span>&#9881;</span>Admin control</a>`:""}`;
 $("#loginBtn").textContent=store.user?"Sign out":"Sign in";
 if(!$("#menuBtn")){const button=document.createElement("button");button.id="menuBtn";button.className="icon-button menu-button";button.setAttribute("aria-label","More navigation");button.textContent="+";button.onclick=()=>c.modal('<h2>Your study space</h2><div class="mobile-menu-links">'+[["dashboard","Dashboard"],["library","Subjects"],["revision","Smart revision"],["exam-day","Exam day revision"],["mock","Mock tests"],["progress","My progress"],["saved","Bookmarks"],["profile","My profile"],["announcements","Announcements"],...(store.admin?[["admin/overview","Admin control"]]:[])].map(([path,label])=>'<a href="#'+path+'">'+label+'</a>').join("")+"</div>");$(".top-actions").prepend(button);}
 $("#avatar").textContent=(store.local.profile.name||store.user?.email||"G")[0].toUpperCase();
 $("#accountLabel").innerHTML=`${esc(store.local.profile.name||"Guest learner")}<small>${store.admin?"Administrator":store.user?esc(store.user.email):"Sign in to sync progress"}</small>`;
 c.applySettings();
}
async function route(){
 const raw=location.hash.slice(1)||"dashboard",[path,query=""]=raw.split("?"),[page,...parts]=path.split("/"),params=new URLSearchParams(query),token=++renderToken;
 if(student?.hasExam()&&page!=="exam"&&!confirm("Leave this test screen? The attempt remains recoverable in this tab.")){history.replaceState(null,"","#exam");return;}
 shell();
 document.querySelectorAll("[data-nav]").forEach(a=>a.classList.toggle("active",a.dataset.nav===(page==="study"?"library":page==="result"||page==="exam"?"mock":page)));
 c.main.setAttribute("aria-busy","true");
 try{
   if(store.access.disabled){c.main.innerHTML=c.heading("Application access disabled.","Contact the administrator to restore this account. You can sign out from the top bar.");return;}
   if(page==="admin"){adminModule??=(await import("./modules/admin.js")).createAdmin(c);if(token!==renderToken)return;await adminModule.page(parts.join("/"));}
   else if(student[page])await student[page](params);
   else{location.replace("#dashboard");return;}
   if(token!==renderToken)return;
   lastRoute=raw;
 }catch(error){if(token===renderToken)c.main.innerHTML=c.heading("This page could not load.",c.errorText(error))+`<div class="panel"><button class="button" data-a="retry-route">Try again</button><a class="button secondary" href="#dashboard">Dashboard</a></div>`;}
 finally{if(token===renderToken)c.main.removeAttribute("aria-busy");}
}
student=createStudent(c);
c.action("close-modal",()=>c.closeModal());c.action("retry-route",route);
document.addEventListener("click",event=>{
 if(event.target.closest("#modal a[href]"))c.closeModal();
 const button=event.target.closest("[data-a]");if(!button||button.disabled)return;
 const original=button.disabled;button.disabled=true;
 Promise.resolve(c.invoke(button.dataset.a,button)).finally(()=>{if(button.isConnected)button.disabled=original;});
});
function authDialog(){
 if(student.hasExam())return c.toast("Complete or abandon your active test before changing accounts.");
 c.modal(`<span class="eyebrow">WELCOME TO SAJILO GK</span><h2>Keep your preparation in one place.</h2><p class="muted">Sign in for private progress, revision schedules and test history.</p><form id="authForm"><label>Email<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label>Password<input name="password" type="password" autocomplete="current-password" minlength="6" maxlength="128" required></label><p class="form-message" id="authMessage" role="status"></p><button class="button wide">Sign in</button><button type="button" class="button secondary wide section-gap" id="signup">Create account</button><button type="button" class="text-button section-gap" id="resetPassword">Forgot password?</button></form>`);
 const form=$("#authForm"),message=$("#authMessage");
 const authRun=async mode=>{
   if(!store.ready){message.textContent="Firebase has not connected. Check internet access and reload.";return;}
   if(mode!=="reset"&&!form.reportValidity())return;if(mode==="reset"&&!form.elements.email.reportValidity())return;
   const buttons=[...form.querySelectorAll("button")];buttons.forEach(b=>b.disabled=true);message.textContent="Please wait...";
   try{
     const email=form.elements.email.value.trim(),password=form.elements.password.value;
     if(mode==="signup"){if(!store.settings.registrationEnabled)throw Error("New registration is currently disabled.");await store.sdk.createUserWithEmailAndPassword(store.auth,email,password);await store.sdk.sendEmailVerification(store.auth.currentUser);}
     else if(mode==="reset"){await store.sdk.sendPasswordResetEmail(store.auth,email);message.textContent="If an account exists, a reset email will arrive. Check spam too.";}
     else await store.sdk.signInWithEmailAndPassword(store.auth,email,password);
   }catch(error){message.textContent=c.errorText(error);}
   finally{buttons.forEach(b=>b.disabled=false);}
 };
 form.onsubmit=e=>{e.preventDefault();authRun("login");};$("#signup").onclick=()=>authRun("signup");$("#resetPassword").onclick=()=>authRun("reset");
}
$("#loginBtn").onclick=()=>c.run(async()=>{if(!store.user)return authDialog();if(student.hasExam())return c.toast("Finish or abandon your active test before signing out.");if(confirm("Sign out of "+store.user.email+"?")){await store.flush();await store.sdk.signOut(store.auth);}});
$("#accountBtn").onclick=()=>store.user?location.hash="profile":authDialog();
$("#themeBtn").onclick=()=>{document.documentElement.classList.toggle("dark");try{localStorage.setItem("sajilo-theme",document.documentElement.classList.contains("dark")?"dark":"light");}catch{}};
try{if(localStorage.getItem("sajilo-theme")==="dark")document.documentElement.classList.add("dark");}catch{}
window.addEventListener("hashchange",()=>{route();window.scrollTo({top:0});});
window.addEventListener("app:message",e=>c.toast(e.detail));
let lastErrorAt=0;
window.addEventListener("app:cloud-error",e=>{console.warn("Firebase:",e.detail?.code||e.detail?.message);$("#connection").textContent="Local work retained / cloud unavailable";if(Date.now()-lastErrorAt>15000){c.toast(c.errorText(e.detail));lastErrorAt=Date.now();}});
window.addEventListener("app:sync",e=>$("#connection").textContent=e.detail?"Progress synced":"Local changes pending sync");
window.addEventListener("app:auth",e=>{if(e.detail.changed&&student.hasExam())student.abandon();c.closeModal();shell();route();});
window.addEventListener("app:data",()=>{shell();if(!lastRoute||["dashboard","progress","library","saved","study"].includes(location.hash.slice(1).split("?")[0]||"dashboard"))route();});
store.readLocal();shell();route();store.initialize().catch(error=>c.toast(c.errorText(error)));
