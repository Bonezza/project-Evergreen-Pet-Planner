const STORE="petPlannerProfilesV3",ACTIVE="petPlannerActiveProfileV3";
const relationData={
"Pet":{icon:"🐾",desc:"Lives with you or is part of your family.",animals:["Dog","Cat","Turtle","Fish","Bird","Snake","Lizard","Rabbit","Small animal","Horse","Spider","Other"]},
"Wild Friend":{icon:"🐦",desc:"A wild animal you recognise or regularly interact with.",animals:["Crow","Magpie","Cockatoo","Kookaburra","Possum","Kangaroo","Wallaby","Blue-tongue Lizard","Goanna","Snake","Duck","Swan","Owl","Bat","Frog","Turtle","Wild Bird","Other"]},
"Rescue":{icon:"🆘",desc:"An animal you rescued, rehabilitated or helped.",animals:["Dog","Cat","Turtle","Bird","Crow","Magpie","Possum","Kangaroo","Wallaby","Lizard","Snake","Rabbit","Bat","Frog","Other"]},
"Foster":{icon:"🏡",desc:"An animal staying with you until their next home.",animals:["Dog","Cat","Rabbit","Bird","Small animal","Horse","Reptile","Fish","Other"]},
"Memorial":{icon:"🌈",desc:"A place for photos, memories and stories.",animals:["Dog","Cat","Turtle","Fish","Bird","Snake","Lizard","Rabbit","Small animal","Horse","Wild Animal","Other"]}};
const emoji={Dog:"🐶",Cat:"🐱",Turtle:"🐢",Fish:"🐠",Bird:"🦜",Crow:"🐦",Magpie:"🐦",Cockatoo:"🦜",Kookaburra:"🐦",Possum:"🐾",Kangaroo:"🦘",Wallaby:"🦘","Blue-tongue Lizard":"🦎",Goanna:"🦎",Snake:"🐍",Duck:"🦆",Swan:"🦢",Owl:"🦉",Bat:"🦇",Frog:"🐸",Rabbit:"🐇","Small animal":"🐹",Horse:"🐴",Spider:"🕷️",Lizard:"🦎","Wild Bird":"🐦",Reptile:"🦎","Wild Animal":"🐾",Other:"🐾"};
const colours=[["Original Purple","#7c3aed","124,58,237"],["Heliotrope","#DF73FF","223,115,255"],["Pink","#ff5ca8","255,92,168"],["Red","#ef4444","239,68,68"],["Orange","#f97316","249,115,22"],["Yellow","#eab308","234,179,8"],["Green","#22c55e","34,197,94"],["Cyan","#06b6d4","6,182,212"],["Blue","#3b82f6","59,130,246"],["Grey","#71717a","113,113,122"],["Black","#242028","36,32,40"],["Brown","#8b5e3c","139,94,60"]].map(([name,hex,rgb])=>({name,hex,rgb}));
const features={
"Pet":[["🍽️","Feeding","Meals and food"],["❤️","Health","Care and vet notes"],["📸","Gallery","Photos and memories"],["📝","Notes","Anything important"],["📈","Growth","Weight and size"],["🪵🌱","Habitat Build Mode","Plan their space"]],
"Wild Friend":[["👀","Sightings","When they visit"],["🤝","Trust","Track your bond"],["🍎","Favourite Foods","What they enjoy"],["📸","Gallery","Photos and moments"],["📍","Favourite Spots","Where they appear"],["📝","Notes","Behaviour and calls"]],
"Rescue":[["🩹","Recovery","Injuries and progress"],["🍽️","Feeding","Meals and appetite"],["💊","Treatment","Medication and care"],["📸","Gallery","Progress photos"],["📅","Timeline","Rescue milestones"],["📝","Notes","Anything important"]],
"Foster":[["🍽️","Feeding","Meals and routine"],["❤️","Health","Vet and medication"],["🏡","Adoption","Readiness and details"],["📸","Gallery","Photos"],["📅","Timeline","Time in your care"],["📝","Notes","Behaviour and needs"]],
"Memorial":[["📸","Photos","Favourite pictures"],["❤️","Memories","Stories you love"],["⭐","Favourite Things","Food, toys and places"],["📅","Timeline","Life moments"],["🕯️","Tribute","A special message"],["📝","Stories","Things worth remembering"]]};
const $=s=>document.querySelector(s);let editing=null,pendingPhoto="",selectedRelation="",selectedColour=colours[0];

function getProfiles(){try{let p=JSON.parse(localStorage.getItem(STORE));if(Array.isArray(p))return p;let old=JSON.parse(localStorage.getItem("petPlannerPetsV2"));if(Array.isArray(old)){p=old.map(x=>({...x,relationship:x.relationship||"Pet"}));save(p);return p}return[]}catch{return[]}}
function save(p){localStorage.setItem(STORE,JSON.stringify(p))}
function activeId(){return localStorage.getItem(ACTIVE)||localStorage.getItem("petPlannerActivePetV2")}
function setActive(id){localStorage.setItem(ACTIVE,id)}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function img(p){return p.photo?`<img src="${p.photo}" alt="${esc(p.name)}">`:(emoji[p.species]||relationData[p.relationship]?.icon||"🐾")}
function theme(p){let c=p?.colour?.hex?p.colour:colours[0];document.documentElement.style.setProperty("--accent",c.hex);document.documentElement.style.setProperty("--rgb",c.rgb)}
function date(v){return v?new Intl.DateTimeFormat("en-AU",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v)):"Not logged yet"}

let toastTimer;
function showToast(text){
  const toast=$("#toast");
  toast.textContent=text;
  toast.hidden=false;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.hidden=true,1800);
}
function render(){let p=getProfiles();if(!p.length){$("#profiles").innerHTML="";$("#animalGrid").innerHTML="";$("#empty").hidden=false;$("#dashboard").hidden=true;theme();return}
$("#empty").hidden=true;$("#dashboard").hidden=false;let a=p.find(x=>x.id===activeId())||p[0];setActive(a.id);theme(a);
$("#profiles").innerHTML=p.map(x=>`<button class="chip ${x.id===a.id?"active":""}" data-id="${x.id}"><div class="thumb">${img(x)}</div><strong>${esc(x.name)}</strong><small>${esc(x.relationship||"Pet")}</small></button>`).join("");
document.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{setActive(b.dataset.id);render()});
$("#animalGrid").innerHTML=p.map(x=>`<button class="grid-card" data-id="${x.id}"><div class="grid-photo">${img(x)}</div><strong>${esc(x.name)}</strong><div class="grid-meta"><span class="grid-badge">${relationData[x.relationship||"Pet"]?.icon||"🐾"} ${esc(x.relationship||"Pet")}</span><span class="grid-species">${esc(x.species)}</span></div></button>`).join("");
document.querySelectorAll(".grid-card").forEach(b=>b.onclick=()=>{setActive(b.dataset.id);switchView("home");render()});
$("#avatar").innerHTML=img(a);$("#relationBadge").textContent=(a.relationship||"Pet").toUpperCase();$("#name").textContent=a.name;$("#meta").textContent=[a.species,a.breed].filter(Boolean).join(" • ")||"Profile ready";
let relation=a.relationship||"Pet",memorial=relation==="Memorial",wild=relation==="Wild Friend";
$("#memorialNote").hidden=!memorial;
$("#quick").hidden=memorial;
if(wild){
  $("#quickLabel").textContent="LAST SEEN";
  $("#feed").textContent="Log sighting";
  let h=a.sightingHistory||[];
  $("#lastFed").textContent=date(h.at(-1));
}else{
  $("#quickLabel").textContent="LAST FED";
  $("#feed").textContent="Feed now";
  let h=a.feedHistory||[];
  $("#lastFed").textContent=date(h.at(-1));
}
$("#features").innerHTML=(features[relation]||features.Pet).map(f=>`<button class="feature" data-title="${esc(f[1])}"><span class="emoji">${f[0]}</span><strong>${esc(f[1])}</strong><small>${esc(f[2])}</small></button>`).join("");
document.querySelectorAll(".feature").forEach(b=>b.onclick=()=>openFeature(b.dataset.title));renderPlanner()}

function renderRelations(){$("#relationChoices").innerHTML=Object.entries(relationData).map(([n,d])=>`<button type="button" class="relation" data-name="${n}"><span class="icon">${d.icon}</span><span><strong>${n}</strong><small>${d.desc}</small></span></button>`).join("");document.querySelectorAll(".relation").forEach(b=>b.onclick=()=>chooseRelation(b.dataset.name))}
function chooseRelation(n){selectedRelation=n;$("#stepOne").hidden=true;$("#stepTwo").hidden=false;$("#dialogTitle").textContent=editing?"Edit profile":`Add ${n.toLowerCase()}`;$("#inputSpecies").innerHTML='<option value="">Choose one</option>'+relationData[n].animals.map(x=>`<option>${x}</option>`).join("");$("#detailLabel").firstChild.textContent=n==="Wild Friend"?"Size / identifying detail ":n==="Memorial"?"Favourite detail ":"Weight / identifying detail ";preview()}
function renderColours(){$("#colours").innerHTML=colours.map(c=>`<button type="button" class="colour ${c.hex===selectedColour.hex?"selected":""}" style="--swatch:${c.hex}" data-hex="${c.hex}"></button>`).join("");document.querySelectorAll(".colour").forEach(b=>b.onclick=()=>{selectedColour=colours.find(c=>c.hex===b.dataset.hex);renderColours();theme({colour:selectedColour})})}
function preview(){if(pendingPhoto)$("#photoPreview").innerHTML=`<img src="${pendingPhoto}">`;else $("#photoPreview").textContent=emoji[$("#inputSpecies").value]||relationData[selectedRelation]?.icon||"🐾"}
function resize(file){return new Promise((res,rej)=>{let r=new FileReader;r.onerror=rej;r.onload=()=>{let i=new Image;i.onerror=rej;i.onload=()=>{let s=Math.min(1,700/Math.max(i.width,i.height)),c=document.createElement("canvas");c.width=i.width*s;c.height=i.height*s;c.getContext("2d").drawImage(i,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",.78))};i.src=r.result};r.readAsDataURL(file)})}
function resizeGalleryImage(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error("Could not read photo"));
    reader.onload=()=>{
      const image=new Image();
      image.onerror=()=>reject(new Error("Could not open photo"));
      image.onload=()=>{
        const maxSize=480;
        const scale=Math.min(1,maxSize/Math.max(image.width,image.height));
        const canvas=document.createElement("canvas");
        canvas.width=Math.max(1,Math.round(image.width*scale));
        canvas.height=Math.max(1,Math.round(image.height*scale));
        const context=canvas.getContext("2d");
        context.drawImage(image,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL("image/jpeg",.58));
      };
      image.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function openDialog(p=null){$("#form").reset();editing=p?.id||null;pendingPhoto=p?.photo||"";selectedColour=p?.colour?.hex?p.colour:colours[0];selectedRelation=p?.relationship||"";$("#delete").hidden=!p;if(p){$("#stepOne").hidden=true;$("#stepTwo").hidden=false;chooseRelation(selectedRelation);$("#dialogTitle").textContent=`Edit ${p.name}`;$("#inputName").value=p.name||"";$("#inputSpecies").value=p.species||"";$("#inputBreed").value=p.breed||"";$("#inputDate").value=p.birthday||"";$("#inputSex").value=p.sex||"";$("#inputDetail").value=p.weight||""}else{$("#stepOne").hidden=false;$("#stepTwo").hidden=true;$("#dialogTitle").textContent="Who are you adding?"}preview();renderColours();$("#dialog").showModal()}
function switchView(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.view===id));scrollTo({top:0,behavior:"smooth"})}


const REMINDERS="petPlannerRemindersV1";
function getReminders(){try{return JSON.parse(localStorage.getItem(REMINDERS))||[]}catch{return[]}}
function saveReminders(v){localStorage.setItem(REMINDERS,JSON.stringify(v))}
function activeProfile(){return getProfiles().find(x=>x.id===activeId())}
function renderPlanner(){
 const pets=getProfiles(),rs=getReminders();
 $("#reminderPet").innerHTML='<option value="">Choose animal</option>'+pets.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");
 $("#reminderList").innerHTML=rs.length?rs.map(x=>`<div class="list-item"><strong>${esc(x.title)}</strong><small>${esc(pets.find(p=>p.id===x.petId)?.name||"Unknown")} • ${esc(x.date)}</small></div>`).join(""):'<div class="panel">No reminders yet.</div>';
}
function logHtml(logs=[]){return `<div class="log-list">${logs.length?logs.slice().reverse().map(x=>`<div class="log-entry"><strong>${esc(x.title)}</strong><small>${esc(x.notes||"")} • ${date(x.date)}</small></div>`).join(""):'<p>No entries yet.</p>'}</div>`}
function openFeature(title){
 const a=activeProfile();if(!a)return;
 $("#featureTitle").textContent=title;
 let html="";
 if(title==="Gallery"||title==="Photos"){
   html=`<label class="photo-btn">Add photo<input id="galleryInput" type="file" accept="image/*" hidden></label><div class="gallery-grid">${(a.gallery||[]).map(x=>`<img src="${x}">`).join("")}</div>`;
 }else if(title==="Habitat Build Mode"){switchView("build");return}
 else{
   html=`<form id="featureForm" class="stack"><input id="featureEntryTitle" placeholder="${title} title" required><textarea id="featureEntryNotes" placeholder="Notes"></textarea><button class="primary">Save</button></form>${logHtml((a.logs||{})[title]||[])}`;
 }
 $("#featureContent").innerHTML=html;$("#featureDialog").showModal();
 if($("#featureForm"))$("#featureForm").onsubmit=e=>{e.preventDefault();let p=getProfiles(),x=p.find(v=>v.id===a.id);x.logs=x.logs||{};x.logs[title]=x.logs[title]||[];x.logs[title].push({title:$("#featureEntryTitle").value,notes:$("#featureEntryNotes").value,date:new Date().toISOString()});saveProfiles(p);$("#featureDialog").close();render();showToast("Saved ✨")};
 if($("#galleryInput"))$("#galleryInput").onchange=async e=>{
   const input=e.target;
   const file=input.files?.[0];
   if(!file)return;

   input.disabled=true;
   showToast("Adding photo…");

   try{
     const data=await resizeGalleryImage(file);
     const profiles=getProfiles();
     const profile=profiles.find(v=>v.id===a.id);
     if(!profile)throw new Error("Profile not found");

     profile.gallery=profile.gallery||[];
     profile.gallery.push(data);

     try{
       saveProfiles(profiles);
     }catch(error){
       profile.gallery.pop();
       throw new Error("Your browser storage is full");
     }

     const grid=document.querySelector(".gallery-grid");
     if(grid){
       const image=document.createElement("img");
       image.src=data;
       image.alt="Gallery photo";
       grid.appendChild(image);
     }

     input.value="";
     showToast("Photo added 📸");
   }catch(error){
     console.error(error);
     alert(error.message==="Your browser storage is full"
       ? "Your phone’s browser storage is full. We’ll move galleries to proper app storage in the next bigger update."
       : "That photo couldn’t be added. Try choosing a different photo.");
   }finally{
     input.disabled=false;
   }
};
}

renderRelations();
["#addTop","#addEmpty","#addAnimals"].forEach(s=>$(s).onclick=()=>openDialog());
$("#close").onclick=()=>{$("#dialog").close();render()};$("#back").onclick=()=>{$("#stepTwo").hidden=true;$("#stepOne").hidden=false;$("#dialogTitle").textContent="Who are you adding?"};
$("#inputSpecies").onchange=preview;$("#removePhoto").onclick=()=>{pendingPhoto="";$("#photo").value="";preview()};
$("#photo").onchange=async e=>{let f=e.target.files?.[0];if(f){pendingPhoto=await resize(f);preview()}};
$("#edit").onclick=()=>{let p=getProfiles().find(x=>x.id===activeId());if(p)openDialog(p)};
$("#feed").onclick=()=>{let p=getProfiles(),a=p.find(x=>x.id===activeId());if(!a)return;if((a.relationship||"Pet")==="Wild Friend"){a.sightingHistory=a.sightingHistory||[];a.sightingHistory.push(new Date().toISOString());save(p);render();showToast("Sighting logged 👀")}else{a.feedHistory=a.feedHistory||[];a.feedHistory.push(new Date().toISOString());save(p);render();showToast("Feeding logged 🍽️")}};
$("#form").onsubmit=e=>{e.preventDefault();if(!selectedRelation)return;let data={relationship:selectedRelation,name:$("#inputName").value.trim(),species:$("#inputSpecies").value,breed:$("#inputBreed").value.trim(),birthday:$("#inputDate").value,sex:$("#inputSex").value,weight:$("#inputDetail").value.trim(),photo:pendingPhoto,colour:selectedColour};if(!data.name||!data.species)return;let p=getProfiles();if(editing){let i=p.findIndex(x=>x.id===editing);p[i]={...p[i],...data,feedHistory:p[i].feedHistory||[],sightingHistory:p[i].sightingHistory||[]};setActive(editing)}else{let x={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),...data,feedHistory:[],sightingHistory:[]};p.push(x);setActive(x.id)}save(p);$("#dialog").close();render()};
$("#delete").onclick=()=>{if(!editing)return;let p=getProfiles(),x=p.find(v=>v.id===editing);if(!confirm(`Delete ${x.name}'s profile?`))return;p=p.filter(v=>v.id!==editing);save(p);if(p.length)setActive(p[0].id);$("#dialog").close();render()};
document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>switchView(n.dataset.view));render();
$("#closeFeature").onclick=()=>$("#featureDialog").close();
$("#reminderForm").onsubmit=e=>{e.preventDefault();let r=getReminders();r.push({id:String(Date.now()),petId:$("#reminderPet").value,title:$("#reminderTitle").value,date:$("#reminderDate").value});saveReminders(r);e.target.reset();renderPlanner();showToast("Reminder saved 📅")};
$("#createHabitat").onclick=()=>{$("#builderWorkspace").hidden=false;showToast("Layout created 🪵")};
document.querySelectorAll(".builder-toolbar button").forEach(b=>b.onclick=()=>{let el=document.createElement("div");el.className="placed-item";el.textContent=b.dataset.item;el.style.left=(20+Math.random()*60)+"%";el.style.top=(30+Math.random()*40)+"%";makeDraggable(el);$("#habitatCanvas").appendChild(el)});
$("#clearHabitat").onclick=()=>document.querySelectorAll(".placed-item").forEach(x=>x.remove());
$("#saveHabitat").onclick=()=>{localStorage.setItem("petPlannerLayoutV1",$("#habitatCanvas").innerHTML);showToast("Layout saved 💾")};
function makeDraggable(el){let drag=false,ox=0,oy=0;el.onpointerdown=e=>{drag=true;el.setPointerCapture(e.pointerId);let r=el.getBoundingClientRect();ox=e.clientX-r.left;oy=e.clientY-r.top};el.onpointermove=e=>{if(!drag)return;let c=$("#habitatCanvas").getBoundingClientRect(),x=Math.max(0,Math.min(c.width-el.offsetWidth,e.clientX-c.left-ox)),y=Math.max(0,Math.min(c.height-el.offsetHeight,e.clientY-c.top-oy));el.style.left=x+"px";el.style.top=y+"px"};el.onpointerup=()=>drag=false}
renderPlanner();
