const PROFILE_STORE="petPlannerProfilesV4";
const ACTIVE_STORE="petPlannerActiveProfileV4";
const REMINDER_STORE="petPlannerRemindersV2";
const LAYOUT_STORE="petPlannerLayoutsV2";
const ACTIVITY_STORE="petPlannerActivityV1";

const relationData={
  "Pet":{icon:"🐾",desc:"Lives with you or is part of your family.",animals:["Dog","Cat","Turtle","Fish","Bird","Snake","Lizard","Rabbit","Small animal","Horse","Spider","Other"]},
  "Wild Friend":{icon:"🐦",desc:"A wild animal you recognise or regularly interact with.",animals:["Crow","Magpie","Cockatoo","Kookaburra","Possum","Kangaroo","Wallaby","Blue-tongue Lizard","Goanna","Snake","Duck","Swan","Owl","Bat","Frog","Turtle","Wild Bird","Other"]},
  "Rescue":{icon:"🆘",desc:"An animal you rescued, rehabilitated or helped.",animals:["Dog","Cat","Turtle","Bird","Crow","Magpie","Possum","Kangaroo","Wallaby","Lizard","Snake","Rabbit","Bat","Frog","Other"]},
  "Foster":{icon:"🏡",desc:"An animal staying with you until their next home.",animals:["Dog","Cat","Rabbit","Bird","Small animal","Horse","Reptile","Fish","Other"]},
  "Memorial":{icon:"🌈",desc:"A place for photos, memories and stories.",animals:["Dog","Cat","Turtle","Fish","Bird","Snake","Lizard","Rabbit","Small animal","Horse","Wild Animal","Other"]}
};
const emoji={Dog:"🐶",Cat:"🐱",Turtle:"🐢",Fish:"🐠",Bird:"🦜",Crow:"🐦",Magpie:"🐦",Cockatoo:"🦜",Kookaburra:"🐦",Possum:"🐾",Kangaroo:"🦘",Wallaby:"🦘","Blue-tongue Lizard":"🦎",Goanna:"🦎",Snake:"🐍",Duck:"🦆",Swan:"🦢",Owl:"🦉",Bat:"🦇",Frog:"🐸",Rabbit:"🐇","Small animal":"🐹",Horse:"🐴",Spider:"🕷️",Lizard:"🦎","Wild Bird":"🐦",Reptile:"🦎","Wild Animal":"🐾",Other:"🐾"};
const colours=[["Original Purple","#7c3aed","124,58,237"],["Heliotrope","#DF73FF","223,115,255"],["Pink","#ff5ca8","255,92,168"],["Red","#ef4444","239,68,68"],["Orange","#f97316","249,115,22"],["Yellow","#eab308","234,179,8"],["Green","#22c55e","34,197,94"],["Cyan","#06b6d4","6,182,212"],["Blue","#3b82f6","59,130,246"],["Grey","#71717a","113,113,122"],["Black","#242028","36,32,40"],["Brown","#8b5e3c","139,94,60"]].map(([name,hex,rgb])=>({name,hex,rgb}));
const features={
  "Pet":[["🍽️","Feeding","Meals and food"],["❤️","Health","Care and vet notes"],["📸","Gallery","Photos and memories"],["📝","Notes","Journal and care logs"],["📈","Growth","Weight and size"],["🪵🌱","Habitat Build Mode","Plan their space"]],
  "Wild Friend":[["👀","Sightings","When they visit"],["🤝","Trust","Track your bond"],["🍎","Favourite Foods","What they enjoy"],["📸","Gallery","Photos and moments"],["📍","Favourite Spots","Where they appear"],["📝","Notes","Behaviour and calls"]],
  "Rescue":[["🩹","Recovery","Injuries and progress"],["🍽️","Feeding","Meals and appetite"],["💊","Treatment","Medication and care"],["📸","Gallery","Progress photos"],["📅","Timeline","Rescue milestones"],["📝","Notes","Anything important"]],
  "Foster":[["🍽️","Feeding","Meals and routine"],["❤️","Health","Vet and medication"],["🏡","Adoption","Readiness and details"],["📸","Gallery","Photos"],["📅","Timeline","Time in your care"],["📝","Notes","Behaviour and needs"]],
  "Memorial":[["📸","Photos","Favourite pictures"],["❤️","Memories","Stories you love"],["⭐","Favourite Things","Food, toys and places"],["📅","Timeline","Life moments"],["🕯️","Tribute","A special message"],["📝","Stories","Things worth remembering"]]
};

const $=selector=>document.querySelector(selector);
let editingId=null,pendingPhoto="",selectedRelation="",selectedColour=colours[0];
let animalFilter="All",plannerFilter="upcoming",selectedBuilderItem=null,toastTimer;

function safeParse(value,fallback){try{return JSON.parse(value)??fallback}catch{return fallback}}
function normaliseProfile(profile){
  const gallery=(profile.gallery||[]).map(item=>typeof item==="string"?{id:cryptoId(),src:item,caption:"",favourite:false,date:new Date().toISOString()}:item);
  return {
    id:profile.id||cryptoId(),relationship:profile.relationship||"Pet",name:profile.name||"Unnamed",
    species:profile.species||"Other",breed:profile.breed||"",birthday:profile.birthday||"",
    sex:profile.sex||"",weight:profile.weight||"",photo:profile.photo||"",
    colour:profile.colour?.hex?profile.colour:colours[0],health:profile.health||"Doing well",
    favourite:Boolean(profile.favourite),feedHistory:profile.feedHistory||[],sightingHistory:profile.sightingHistory||[],
    logs:profile.logs||{},gallery,trust:Number(profile.trust||0)
  };
}
function getProfiles(){
  const current=safeParse(localStorage.getItem(PROFILE_STORE),null);
  if(Array.isArray(current))return current.map(normaliseProfile);
  const keys=["petPlannerProfilesV3","petPlannerPetsV2","petPlannerPetsV1"];
  for(const key of keys){
    const old=safeParse(localStorage.getItem(key),null);
    if(Array.isArray(old)){const migrated=old.map(normaliseProfile);saveProfiles(migrated);return migrated}
  }
  return [];
}
function saveProfiles(profiles){localStorage.setItem(PROFILE_STORE,JSON.stringify(profiles))}
function getReminders(){
  const current=safeParse(localStorage.getItem(REMINDER_STORE),null);
  if(Array.isArray(current))return current;
  const old=safeParse(localStorage.getItem("petPlannerRemindersV1"),[]);
  const migrated=old.map(x=>({...x,repeat:x.repeat||"none",completed:Boolean(x.completed)}));
  if(migrated.length)localStorage.setItem(REMINDER_STORE,JSON.stringify(migrated));
  return migrated;
}
function saveReminders(items){localStorage.setItem(REMINDER_STORE,JSON.stringify(items))}
function getActivities(){return safeParse(localStorage.getItem(ACTIVITY_STORE),[])}
function addActivity(profileId,icon,text){
  const activities=getActivities();
  activities.unshift({id:cryptoId(),profileId,icon,text,date:new Date().toISOString()});
  localStorage.setItem(ACTIVITY_STORE,JSON.stringify(activities.slice(0,50)));
}
function activeId(){return localStorage.getItem(ACTIVE_STORE)||localStorage.getItem("petPlannerActiveProfileV3")||localStorage.getItem("petPlannerActivePetV2")}
function setActive(id){localStorage.setItem(ACTIVE_STORE,id)}
function activeProfile(){return getProfiles().find(x=>x.id===activeId())}
function cryptoId(){return crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`}
function esc(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function profileVisual(profile){return profile.photo?`<img src="${profile.photo}" alt="${esc(profile.name)}">`:(emoji[profile.species]||relationData[profile.relationship]?.icon||"🐾")}
function formatDate(value,includeTime=true){
  if(!value)return "Not logged yet";
  return new Intl.DateTimeFormat("en-AU",includeTime?{dateStyle:"medium",timeStyle:"short"}:{dateStyle:"medium"}).format(new Date(value));
}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function applyTheme(profile){
  const colour=profile?.colour?.hex?profile.colour:colours[0];
  document.documentElement.style.setProperty("--accent",colour.hex);
  document.documentElement.style.setProperty("--rgb",colour.rgb);
}
function showToast(text){
  $("#toast").textContent=text;$("#toast").hidden=false;clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$("#toast").hidden=true,1900);
}
function healthClass(status){return status==="Needs attention"?"warning":status==="Monitoring"?"monitor":""}
function healthEmoji(status){return status==="Needs attention"?"🧡":status==="Monitoring"?"💜":status==="Unknown"?"🤍":"💚"}
function greeting(){
  const hour=new Date().getHours();
  return hour<12?"Good morning 🌿":hour<18?"Good afternoon 🌿":"Good evening 🌿";
}
function nextDate(date,repeat){
  const d=new Date(`${date}T12:00:00`);
  if(repeat==="daily")d.setDate(d.getDate()+1);
  if(repeat==="weekly")d.setDate(d.getDate()+7);
  if(repeat==="monthly")d.setMonth(d.getMonth()+1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function render(){
  const profiles=getProfiles();
  $("#greeting").textContent=greeting();

  if(!profiles.length){
    $("#empty").hidden=false;$("#dashboard").hidden=true;$("#profiles").innerHTML="";
    applyTheme(null);
  }else{
    $("#empty").hidden=true;$("#dashboard").hidden=false;
    let active=profiles.find(x=>x.id===activeId())||profiles.find(x=>x.favourite)||profiles[0];
    setActive(active.id);applyTheme(active);
    renderProfileChips(profiles,active);
    renderDashboard(active);
  }
  renderSummary(profiles);
  renderAnimals(profiles);
  renderPlanner();
  renderHomeTasks();
  renderRecentActivity();
  renderHabitatPetOptions(profiles);
}

function renderSummary(profiles){
  const pets=profiles.filter(x=>x.relationship==="Pet").length;
  const wild=profiles.filter(x=>x.relationship==="Wild Friend").length;
  const due=getReminders().filter(x=>!x.completed&&x.date<=todayISO()).length;
  $("#homeSummary").innerHTML=`
    <div class="summary-stat"><strong>${profiles.length}</strong><small>Profiles</small></div>
    <div class="summary-stat"><strong>${pets+wild}</strong><small>Companions</small></div>
    <div class="summary-stat"><strong>${due}</strong><small>Due tasks</small></div>`;
  $("#todayHeading").textContent=due?`${due} task${due===1?"":"s"} need attention`:"Everything looks calm";
  $("#todayText").textContent=profiles.length?due?"Open Planner to see what is due today.":"No overdue reminders. Enjoy your animals 💜":"Add your first profile to begin.";
}

function renderProfileChips(profiles,active){
  $("#profiles").innerHTML=profiles.map(profile=>`
    <button class="chip ${profile.id===active.id?"active":""}" data-profile="${profile.id}">
      <div class="thumb">${profileVisual(profile)}</div>
      <strong>${esc(profile.name)}${profile.favourite?" ⭐":""}</strong>
      <small>${esc(profile.relationship)}</small>
    </button>`).join("");
  document.querySelectorAll("[data-profile]").forEach(button=>button.onclick=()=>{setActive(button.dataset.profile);render()});
}

function renderDashboard(profile){
  const relation=profile.relationship||"Pet";
  const memorial=relation==="Memorial",wild=relation==="Wild Friend";
  $("#heroImage").innerHTML=profileVisual(profile);
  $("#relationBadge").textContent=relation.toUpperCase();
  $("#healthBadge").textContent=`${healthEmoji(profile.health)} ${profile.health}`;
  $("#healthBadge").className=`health-badge ${healthClass(profile.health)}`;
  $("#name").textContent=profile.name;
  $("#meta").textContent=[profile.species,profile.breed,profile.weight].filter(Boolean).join(" • ")||"Profile ready";
  $("#favouriteButton").textContent=profile.favourite?"★":"☆";
  $("#memorialNote").hidden=!memorial;
  $("#quick").hidden=memorial;
  if(wild){
    $("#quickLabel").textContent="LAST SEEN";$("#quickAction").textContent="Log sighting";
    $("#lastAction").textContent=formatDate(profile.sightingHistory.at(-1));
  }else{
    $("#quickLabel").textContent="LAST FED";$("#quickAction").textContent="Feed now";
    $("#lastAction").textContent=formatDate(profile.feedHistory.at(-1));
  }
  $("#features").innerHTML=(features[relation]||features.Pet).map(([icon,title,subtitle])=>`
    <button class="feature" data-feature="${esc(title)}"><span class="emoji">${icon}</span><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></button>`).join("");
  document.querySelectorAll("[data-feature]").forEach(button=>button.onclick=()=>openFeature(button.dataset.feature));
}

function renderAnimals(profiles){
  const filtered=animalFilter==="All"?profiles:profiles.filter(x=>x.relationship===animalFilter);
  $("#animalGrid").innerHTML=filtered.length?filtered.map(profile=>`
    <button class="grid-card" data-animal="${profile.id}">
      ${profile.favourite?'<span class="fav-mark">⭐</span>':""}
      <div class="grid-photo">${profileVisual(profile)}</div>
      <strong>${esc(profile.name)}</strong>
      <div class="grid-meta"><span class="grid-badge">${relationData[profile.relationship]?.icon||"🐾"} ${esc(profile.relationship)}</span><span class="grid-species">${esc(profile.species)}</span></div>
    </button>`).join(""):'<div class="panel muted">No profiles in this category.</div>';
  document.querySelectorAll("[data-animal]").forEach(button=>button.onclick=()=>{setActive(button.dataset.animal);switchView("home");render()});
}

function renderPlanner(){
  const profiles=getProfiles(),reminders=getReminders();
  $("#reminderPet").innerHTML='<option value="">Choose animal</option>'+profiles.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");
  const shown=reminders
    .filter(x=>plannerFilter==="all"||plannerFilter==="completed"?x.completed:!x.completed)
    .sort((a,b)=>a.date.localeCompare(b.date));
  $("#reminderList").innerHTML=shown.length?shown.map(reminder=>{
    const profile=profiles.find(x=>x.id===reminder.petId);
    return `<div class="list-item">
      <div class="list-top"><div><strong>${reminder.completed?"✅ ":""}${esc(reminder.title)}</strong><small>${esc(profile?.name||"Unknown")} • ${formatDate(`${reminder.date}T12:00:00`,false)}${reminder.repeat!=="none"?` • ${esc(reminder.repeat)}`:""}</small></div></div>
      <div class="list-actions">
        <button class="mini-action" data-complete="${reminder.id}">${reminder.completed?"Undo":"Complete"}</button>
        <button class="mini-action" data-delete-reminder="${reminder.id}">Delete</button>
      </div>
    </div>`;
  }).join(""):'<div class="panel muted">Nothing here yet.</div>';
  document.querySelectorAll("[data-complete]").forEach(button=>button.onclick=()=>toggleReminder(button.dataset.complete));
  document.querySelectorAll("[data-delete-reminder]").forEach(button=>button.onclick=()=>{saveReminders(reminders.filter(x=>x.id!==button.dataset.deleteReminder));render()});
}

function toggleReminder(id){
  const reminders=getReminders(),item=reminders.find(x=>x.id===id);if(!item)return;
  if(!item.completed&&item.repeat!=="none"){
    reminders.push({...item,id:cryptoId(),date:nextDate(item.date,item.repeat),completed:false});
  }
  item.completed=!item.completed;saveReminders(reminders);render();showToast(item.completed?"Task completed ✅":"Task reopened");
}

function renderHomeTasks(){
  const profiles=getProfiles();
  const tasks=getReminders().filter(x=>!x.completed).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
  $("#homeTasks").innerHTML=tasks.length?tasks.map(task=>{
    const p=profiles.find(x=>x.id===task.petId);
    return `<div class="task-item"><span class="task-icon">📅</span><div class="task-copy"><strong>${esc(task.title)}</strong><small>${esc(p?.name||"Unknown")} • ${formatDate(`${task.date}T12:00:00`,false)}</small></div></div>`;
  }).join(""):'<p class="muted">No upcoming reminders.</p>';
}

function renderRecentActivity(){
  const profiles=getProfiles(),items=getActivities().slice(0,5);
  $("#recentActivity").innerHTML=items.length?items.map(item=>{
    const p=profiles.find(x=>x.id===item.profileId);
    return `<div class="activity-item"><span class="activity-icon">${item.icon}</span><div class="activity-copy"><strong>${esc(item.text)}</strong><small>${esc(p?.name||"Project Evergreen")} • ${formatDate(item.date)}</small></div></div>`;
  }).join(""):'<p class="muted">Your activity timeline will appear here.</p>';
}

function renderHabitatPetOptions(profiles){
  const options='<option value="">Choose animal</option>'+profiles.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");
  $("#habitatPet").innerHTML=options;
  if(activeId())$("#habitatPet").value=activeId();
}

function renderRelations(){
  $("#relationChoices").innerHTML=Object.entries(relationData).map(([name,data])=>`
    <button type="button" class="relation" data-relation="${name}"><span class="icon">${data.icon}</span><span><strong>${name}</strong><small>${data.desc}</small></span></button>`).join("");
  document.querySelectorAll("[data-relation]").forEach(button=>button.onclick=()=>chooseRelation(button.dataset.relation));
}
function chooseRelation(name){
  selectedRelation=name;$("#stepOne").hidden=true;$("#stepTwo").hidden=false;
  $("#profileTitle").textContent=editingId?"Edit profile":`Add ${name.toLowerCase()}`;
  $("#inputSpecies").innerHTML='<option value="">Choose one</option>'+relationData[name].animals.map(x=>`<option>${x}</option>`).join("");
  $("#detailLabel").firstChild.textContent=name==="Wild Friend"?"Size / identifying detail ":name==="Memorial"?"Favourite detail ":"Weight / identifying detail ";
  updatePhotoPreview();
}
function renderColours(){
  $("#colours").innerHTML=colours.map(c=>`<button type="button" class="colour ${c.hex===selectedColour.hex?"selected":""}" style="--swatch:${c.hex}" data-colour="${c.hex}" aria-label="${c.name}"></button>`).join("");
  document.querySelectorAll("[data-colour]").forEach(button=>button.onclick=()=>{selectedColour=colours.find(c=>c.hex===button.dataset.colour)||colours[0];renderColours();applyTheme({colour:selectedColour})});
}
function updatePhotoPreview(){
  if(pendingPhoto)$("#photoPreview").innerHTML=`<img src="${pendingPhoto}" alt="Preview">`;
  else $("#photoPreview").textContent=emoji[$("#inputSpecies").value]||relationData[selectedRelation]?.icon||"🐾";
}
function compressImage(file,maxSize=720,quality=.72){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onerror=()=>reject(new Error("Could not read photo"));
    reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error("Could not open photo"));
      image.onload=()=>{const scale=Math.min(1,maxSize/Math.max(image.width,image.height));const canvas=document.createElement("canvas");
        canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
        canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL("image/jpeg",quality));};
      image.src=reader.result;};
    reader.readAsDataURL(file);
  });
}
function openProfileDialog(profile=null){
  $("#profileForm").reset();editingId=profile?.id||null;pendingPhoto=profile?.photo||"";
  selectedColour=profile?.colour?.hex?profile.colour:colours[0];selectedRelation=profile?.relationship||"";
  $("#deleteProfile").hidden=!profile;
  if(profile){
    $("#stepOne").hidden=true;$("#stepTwo").hidden=false;chooseRelation(selectedRelation);
    $("#profileTitle").textContent=`Edit ${profile.name}`;$("#inputName").value=profile.name||"";
    $("#inputSpecies").value=profile.species||"";$("#inputBreed").value=profile.breed||"";
    $("#inputDate").value=profile.birthday||"";$("#inputSex").value=profile.sex||"";
    $("#inputDetail").value=profile.weight||"";$("#inputHealth").value=profile.health||"Doing well";
  }else{
    $("#stepOne").hidden=false;$("#stepTwo").hidden=true;$("#profileTitle").textContent="Who are you adding?";
  }
  updatePhotoPreview();renderColours();$("#profileDialog").showModal();
}

function logList(logs=[]){
  return `<div class="log-list">${logs.length?logs.slice().reverse().map(log=>`<div class="log-entry"><strong>${esc(log.title)}</strong><small>${esc(log.notes||"")} • ${formatDate(log.date)}</small></div>`).join(""):'<p class="muted">Nothing logged yet.</p>'}</div>`;
}
function openFeature(title){
  const profile=activeProfile();if(!profile)return;
  if(title==="Habitat Build Mode"){switchView("build");$("#habitatPet").value=profile.id;return}
  $("#featureTitle").textContent=title;$("#featureEyebrow").textContent=profile.relationship.toUpperCase();
  let html="";
  if(title==="Gallery"||title==="Photos")html=galleryHTML(profile);
  else if(title==="Notes"||title==="Stories"||title==="Memories")html=notesHTML(profile,title);
  else if(title==="Trust")html=trustHTML(profile);
  else html=genericLogHTML(profile,title);
  $("#featureContent").innerHTML=html;$("#featureDialog").showModal();wireFeature(profile,title);
}
function genericLogHTML(profile,title){
  const logs=profile.logs?.[title]||[];
  return `<form id="featureForm" class="stack">
    <input id="featureEntryTitle" placeholder="${esc(title)} title" required>
    <textarea id="featureEntryNotes" placeholder="Add details or observations"></textarea>
    <button class="primary">Save entry</button>
  </form>${logList(logs)}`;
}
function notesHTML(profile,title){
  const categories=["General","Feeding","Medical","Behaviour","Custom"];
  return `<div class="note-tabs">${categories.map((x,i)=>`<button class="note-tab ${i===0?"active":""}" data-note-category="${x}">${x}</button>`).join("")}</div>
    <form id="featureForm" class="stack"><input id="featureEntryTitle" placeholder="Note title" required><textarea id="featureEntryNotes" placeholder="Write your note..."></textarea><button class="primary">Save note</button></form>
    <div id="noteLog">${logList((profile.logs?.Notes||[]).filter(x=>(x.category||"General")==="General"))}</div>`;
}
function trustHTML(profile){
  const labels=["Stranger","Curious","Recognises you","Comfortable","Trusted friend"];
  return `<p class="trust-label">${labels[Math.max(0,(profile.trust||1)-1)]||"Stranger"}</p>
    <input id="trustRange" type="range" min="1" max="5" value="${Math.max(1,profile.trust||1)}">
    <div class="trust-meter">${[1,2,3,4,5].map(n=>`<div class="trust-step ${n<=Math.max(1,profile.trust||1)?"active":""}"></div>`).join("")}</div>
    <button id="saveTrust" class="primary">Save friendship level</button>`;
}
function galleryHTML(profile){
  return `<form id="galleryForm" class="stack">
    <label class="file-button">Choose photo<input id="galleryInput" type="file" accept="image/*" hidden></label>
    <input id="galleryCaption" placeholder="Caption or memory (optional)">
  </form>
  <div class="gallery-grid">${(profile.gallery||[]).map(item=>`
    <article class="gallery-card">
      <button class="gallery-photo" data-open-photo="${item.id}" style="padding:0;border:0;background:none"><img src="${item.src}" alt="${esc(item.caption||"Gallery photo")}"></button>
      <div class="gallery-actions"><button data-fav-photo="${item.id}">${item.favourite?"★":"☆"}</button><button data-delete-photo="${item.id}">🗑</button></div>
      <div class="gallery-caption">${esc(item.caption||"No caption")}</div>
    </article>`).join("")}</div>`;
}
function wireFeature(profile,title){
  let selectedNoteCategory="General";
  document.querySelectorAll("[data-note-category]").forEach(button=>button.onclick=()=>{
    selectedNoteCategory=button.dataset.noteCategory;
    document.querySelectorAll("[data-note-category]").forEach(x=>x.classList.toggle("active",x===button));
    const latest=activeProfile();$("#noteLog").innerHTML=logList((latest.logs?.Notes||[]).filter(x=>(x.category||"General")===selectedNoteCategory));
  });
  if($("#featureForm"))$("#featureForm").onsubmit=event=>{
    event.preventDefault();const profiles=getProfiles(),item=profiles.find(x=>x.id===profile.id);
    const key=["Notes","Stories","Memories"].includes(title)?"Notes":title;
    item.logs=item.logs||{};item.logs[key]=item.logs[key]||[];
    item.logs[key].push({id:cryptoId(),title:$("#featureEntryTitle").value.trim(),notes:$("#featureEntryNotes").value.trim(),category:selectedNoteCategory,date:new Date().toISOString()});
    saveProfiles(profiles);addActivity(item.id,title==="Feeding"?"🍽️":"📝",`Added ${title.toLowerCase()} entry`);
    $("#featureDialog").close();render();showToast("Saved ✨");
  };
  if($("#galleryInput"))$("#galleryInput").onchange=async event=>{
    const file=event.target.files?.[0];if(!file)return;showToast("Adding photo…");
    try{
      const src=await compressImage(file,520,.58);const profiles=getProfiles(),item=profiles.find(x=>x.id===profile.id);
      item.gallery=item.gallery||[];item.gallery.push({id:cryptoId(),src,caption:$("#galleryCaption").value.trim(),favourite:false,date:new Date().toISOString()});
      saveProfiles(profiles);addActivity(item.id,"📸","Added a gallery photo");$("#featureDialog").close();render();showToast("Photo added 📸");
    }catch(error){alert("That photo could not be added. Try a different image or export a backup if storage is full.");}
  };
  document.querySelectorAll("[data-open-photo]").forEach(button=>button.onclick=()=>openGalleryPhoto(profile.id,button.dataset.openPhoto));
  document.querySelectorAll("[data-fav-photo]").forEach(button=>button.onclick=()=>updateGalleryPhoto(profile.id,button.dataset.favPhoto,"favourite"));
  document.querySelectorAll("[data-delete-photo]").forEach(button=>button.onclick=()=>updateGalleryPhoto(profile.id,button.dataset.deletePhoto,"delete"));
  if($("#saveTrust"))$("#saveTrust").onclick=()=>{const profiles=getProfiles(),item=profiles.find(x=>x.id===profile.id);item.trust=Number($("#trustRange").value);saveProfiles(profiles);addActivity(item.id,"🤝","Updated friendship level");$("#featureDialog").close();render();showToast("Friendship level saved 🤝")};
}
function openGalleryPhoto(profileId,photoId){
  const profile=getProfiles().find(x=>x.id===profileId),photo=profile?.gallery.find(x=>x.id===photoId);if(!photo)return;
  $("#largePhoto").src=photo.src;$("#largePhotoCaption").textContent=photo.caption||"";$("#photoDialog").showModal();
}
function updateGalleryPhoto(profileId,photoId,action){
  const profiles=getProfiles(),profile=profiles.find(x=>x.id===profileId);if(!profile)return;
  if(action==="delete"){if(!confirm("Delete this photo?"))return;profile.gallery=profile.gallery.filter(x=>x.id!==photoId)}
  else{const photo=profile.gallery.find(x=>x.id===photoId);if(photo)photo.favourite=!photo.favourite}
  saveProfiles(profiles);$("#featureDialog").close();render();showToast(action==="delete"?"Photo deleted":"Favourite updated ⭐");
}

function switchView(id){
  document.querySelectorAll(".view").forEach(view=>view.classList.toggle("active",view.id===id));
  document.querySelectorAll(".nav").forEach(button=>button.classList.toggle("active",button.dataset.view===id));
  window.scrollTo({top:0,behavior:"smooth"});
}
function layoutKey(){return `${$("#habitatPet").value||"general"}:${$("#habitatType").value}:${$("#habitatSize").value}`}
function getLayouts(){return safeParse(localStorage.getItem(LAYOUT_STORE),{})}
function saveLayouts(layouts){localStorage.setItem(LAYOUT_STORE,JSON.stringify(layouts))}
function addBuilderItem(symbol,state=null){
  const el=document.createElement("div");el.className="placed-item";el.textContent=symbol;
  el.dataset.scale=String(state?.scale||1);el.dataset.rotation=String(state?.rotation||0);
  el.style.left=state?.left||`${20+Math.random()*55}%`;el.style.top=state?.top||`${28+Math.random()*42}%`;
  updateItemTransform(el);makeDraggable(el);el.onclick=event=>{event.stopPropagation();selectBuilderItem(el)};
  $("#habitatCanvas").appendChild(el);return el;
}
function selectBuilderItem(el){
  document.querySelectorAll(".placed-item").forEach(x=>x.classList.remove("selected"));
  selectedBuilderItem=el;el?.classList.add("selected");
}
function updateItemTransform(el){el.style.transform=`scale(${el.dataset.scale}) rotate(${el.dataset.rotation}deg)`}
function makeDraggable(el){
  let drag=false,ox=0,oy=0;
  el.onpointerdown=event=>{drag=true;selectBuilderItem(el);el.setPointerCapture(event.pointerId);const r=el.getBoundingClientRect();ox=event.clientX-r.left;oy=event.clientY-r.top};
  el.onpointermove=event=>{if(!drag)return;const c=$("#habitatCanvas").getBoundingClientRect();const x=Math.max(0,Math.min(c.width-el.offsetWidth,event.clientX-c.left-ox)),y=Math.max(0,Math.min(c.height-el.offsetHeight,event.clientY-c.top-oy));el.style.left=`${x}px`;el.style.top=`${y}px`};
  el.onpointerup=()=>drag=false;
}
function serializeLayout(){
  return [...document.querySelectorAll(".placed-item")].map(el=>({symbol:el.textContent,left:el.style.left,top:el.style.top,scale:Number(el.dataset.scale),rotation:Number(el.dataset.rotation)}));
}
function loadLayout(){
  document.querySelectorAll(".placed-item").forEach(x=>x.remove());selectedBuilderItem=null;
  const layout=getLayouts()[layoutKey()]||[];layout.forEach(item=>addBuilderItem(item.symbol,item));
  const type=$("#habitatType").value;$("#habitatCanvas").className=`habitat-canvas ${["Terrarium","Vivarium","Yard"].includes(type)?"terrarium":type==="Room"?"room":""}`;
}

function createBackupData(){
  const backup={version:8,exportedAt:new Date().toISOString(),data:{}};
  for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith("petPlanner"))backup.data[key]=localStorage.getItem(key)}
  return backup;
}

renderRelations();
["#addTop","#addEmpty","#addAnimals"].forEach(selector=>$(selector).onclick=()=>openProfileDialog());
$("#closeProfile").onclick=()=>{$("#profileDialog").close();render()};
$("#back").onclick=()=>{$("#stepTwo").hidden=true;$("#stepOne").hidden=false;$("#profileTitle").textContent="Who are you adding?"};
$("#inputSpecies").onchange=updatePhotoPreview;
$("#removePhoto").onclick=()=>{pendingPhoto="";$("#photo").value="";updatePhotoPreview()};
$("#photo").onchange=async event=>{const file=event.target.files?.[0];if(file){pendingPhoto=await compressImage(file);updatePhotoPreview()}};
$("#edit").onclick=()=>{const p=activeProfile();if(p)openProfileDialog(p)};
$("#favouriteButton").onclick=()=>{const profiles=getProfiles(),p=profiles.find(x=>x.id===activeId());p.favourite=!p.favourite;saveProfiles(profiles);addActivity(p.id,"⭐",p.favourite?"Marked as favourite":"Removed favourite");render()};
$("#quickAction").onclick=()=>{const profiles=getProfiles(),p=profiles.find(x=>x.id===activeId());if(!p)return;const now=new Date().toISOString();if(p.relationship==="Wild Friend"){p.sightingHistory.push(now);addActivity(p.id,"👀","Logged a sighting")}else{p.feedHistory.push(now);addActivity(p.id,"🍽️","Logged a feeding")}saveProfiles(profiles);render();showToast("Logged ✨")};
$("#profileForm").onsubmit=event=>{
  event.preventDefault();if(!selectedRelation)return;
  const data={relationship:selectedRelation,name:$("#inputName").value.trim(),species:$("#inputSpecies").value,breed:$("#inputBreed").value.trim(),birthday:$("#inputDate").value,sex:$("#inputSex").value,weight:$("#inputDetail").value.trim(),health:$("#inputHealth").value,photo:pendingPhoto,colour:selectedColour};
  if(!data.name||!data.species)return;
  const profiles=getProfiles();
  if(editingId){const i=profiles.findIndex(x=>x.id===editingId);profiles[i]=normaliseProfile({...profiles[i],...data});setActive(editingId)}
  else{const p=normaliseProfile({id:cryptoId(),...data});profiles.push(p);setActive(p.id);addActivity(p.id,"🐾","Created profile")}
  saveProfiles(profiles);$("#profileDialog").close();render();
};
$("#deleteProfile").onclick=()=>{if(!editingId)return;const profiles=getProfiles(),p=profiles.find(x=>x.id===editingId);if(!confirm(`Delete ${p.name}'s profile?`))return;const remaining=profiles.filter(x=>x.id!==editingId);saveProfiles(remaining);if(remaining.length)setActive(remaining[0].id);$("#profileDialog").close();render()};
$("#closeFeature").onclick=()=>$("#featureDialog").close();
$("#closePhoto").onclick=()=>$("#photoDialog").close();

document.querySelectorAll(".nav").forEach(button=>button.onclick=()=>switchView(button.dataset.view));
document.querySelectorAll("[data-go]").forEach(button=>button.onclick=()=>switchView(button.dataset.go));
document.querySelectorAll("[data-filter]").forEach(button=>button.onclick=()=>{animalFilter=button.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===button));renderAnimals(getProfiles())});
document.querySelectorAll("[data-planner-filter]").forEach(button=>button.onclick=()=>{plannerFilter=button.dataset.plannerFilter;document.querySelectorAll("[data-planner-filter]").forEach(x=>x.classList.toggle("active",x===button));renderPlanner()});

$("#reminderForm").onsubmit=event=>{event.preventDefault();const reminders=getReminders();reminders.push({id:cryptoId(),petId:$("#reminderPet").value,title:$("#reminderTitle").value.trim(),date:$("#reminderDate").value,repeat:$("#reminderRepeat").value,completed:false});saveReminders(reminders);addActivity($("#reminderPet").value,"📅","Added a reminder");event.target.reset();render();showToast("Reminder saved 📅")};

$("#createHabitat").onclick=()=>{$("#builderWorkspace").hidden=false;loadLayout();showToast("Habitat ready 🪵")};
document.querySelectorAll(".builder-toolbar button").forEach(button=>button.onclick=()=>addBuilderItem(button.dataset.item));
$("#habitatCanvas").onclick=()=>selectBuilderItem(null);
$("#growItem").onclick=()=>{if(!selectedBuilderItem)return;selectedBuilderItem.dataset.scale=String(Math.min(2.5,Number(selectedBuilderItem.dataset.scale)+.15));updateItemTransform(selectedBuilderItem)};
$("#shrinkItem").onclick=()=>{if(!selectedBuilderItem)return;selectedBuilderItem.dataset.scale=String(Math.max(.4,Number(selectedBuilderItem.dataset.scale)-.15));updateItemTransform(selectedBuilderItem)};
$("#rotateItem").onclick=()=>{if(!selectedBuilderItem)return;selectedBuilderItem.dataset.rotation=String(Number(selectedBuilderItem.dataset.rotation)+15);updateItemTransform(selectedBuilderItem)};
$("#duplicateItem").onclick=()=>{if(!selectedBuilderItem)return;addBuilderItem(selectedBuilderItem.textContent,{left:`${selectedBuilderItem.offsetLeft+18}px`,top:`${selectedBuilderItem.offsetTop+18}px`,scale:Number(selectedBuilderItem.dataset.scale),rotation:Number(selectedBuilderItem.dataset.rotation)})};
$("#deleteItem").onclick=()=>{selectedBuilderItem?.remove();selectedBuilderItem=null};
$("#clearHabitat").onclick=()=>{if(confirm("Clear this layout?")){document.querySelectorAll(".placed-item").forEach(x=>x.remove());selectedBuilderItem=null}};
$("#saveHabitat").onclick=()=>{const layouts=getLayouts();layouts[layoutKey()]=serializeLayout();saveLayouts(layouts);addActivity($("#habitatPet").value,"🪵","Saved a habitat layout");showToast("Layout saved 💾")};

$("#exportData").onclick=()=>{
  const json=JSON.stringify(createBackupData(),null,2),blob=new Blob([json],{type:"application/json"}),url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=`Project-Evergreen-Backup-${todayISO()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast("Backup exported 💾");
};
$("#importData").onchange=async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    const parsed=JSON.parse(await file.text()),data=parsed.data||parsed;
    if(!confirm("Importing will replace Project Evergreen data in this browser. Continue?"))return;
    Object.entries(data).forEach(([key,value])=>{if(key.startsWith("petPlanner"))localStorage.setItem(key,value)});
    showToast("Backup imported ✨");setTimeout(()=>location.reload(),700);
  }catch{alert("That backup file could not be imported.");}
};

render();
