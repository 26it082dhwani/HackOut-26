let state={selected:null, urgent:false, phone:"", plate:"", current:32,target:80,departure:"18:00"};
const windows=[
 {start:"11:30",end:"13:00",renew:58,price:8.1,grid:"High",score:62},
 {start:"13:00",end:"14:30",renew:82,price:6.4,grid:"Moderate",score:83},
 {start:"14:30",end:"16:00",renew:94,price:5.2,grid:"Low",score:94},
 {start:"16:00",end:"17:30",renew:88,price:5.8,grid:"Low",score:91},
 {start:"18:00",end:"19:30",renew:24,price:11.8,grid:"High",score:48}
];
function go(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');window.scrollTo(0,0)}
function normalizePhone(v){return v.replace(/\\D/g,'')}
function getUsers(){try{return JSON.parse(localStorage.getItem('greencharge_users')||'{}')}catch(e){return {}}}
function registerUser(){
 const phone=document.getElementById('regPhone').value.trim(), pass=document.getElementById('regPassword').value, confirm=document.getElementById('regConfirm').value;
 const key=normalizePhone(phone), users=getUsers();
 if(key.length<10){alert("Please enter a valid contact number.");return}
 if(pass.length<4){alert("Password must be at least 4 characters.");return}
 if(pass!==confirm){alert("Passwords do not match.");return}
 if(users[key]){alert("This number is already registered. Please log in.");go('login');return}
 users[key]={phone:phone,password:pass};localStorage.setItem('greencharge_users',JSON.stringify(users));
 document.getElementById('phone').value=phone;document.getElementById('password').value=pass;
 alert("Account created successfully! You can now log in.");
 go('login');
}
function login(){
 const phone=document.getElementById('phone').value.trim(), pass=document.getElementById('password').value, key=normalizePhone(phone), users=getUsers();
 if(key.length<10||pass.length<4){alert("Please enter a valid contact number and password.");return}
 if(!users[key]){
   const create=confirm("This number is not registered yet. Would you like to create an account?");
   if(create){document.getElementById('regPhone').value=phone;go('register');}
   return;
 }
 if(users[key].password!==pass){alert("Incorrect password. Please try again.");return}
 state.phone=users[key].phone;go('details');
}
function mins(t){let [h,m]=t.split(':').map(Number);return h*60+m}
function formatTime(t){let [h,m]=t.split(':').map(Number), ap=h>=12?'PM':'AM';h=h%12||12;return `${h}:${String(m).padStart(2,'0')} ${ap}`}
function diff(a,b){return mins(b)-mins(a)}
function calcCost(w){
 const needed=Math.max(0,state.target-state.current)*.6;
 return Math.round(needed*w.price);
}
function calcCO2(w){return Math.round(Math.max(0,state.target-state.current)*.6*(1-w.renew/100)*.42)}
function optimize(){
 state.plate=document.getElementById('plate').value.trim().toUpperCase()||"DL 01 AB 1234";
 state.current=+document.getElementById('current').value;state.target=+document.getElementById('target').value;state.departure=document.getElementById('departure').value;
 if(state.current>=state.target){alert("Target battery must be higher than current battery.");return}
 if(state.current<1||state.target>100){alert("Enter battery values between 1% and 100%.");return}
 const dep=mins(state.departure), need=Math.max(0,state.target-state.current)*.6;
 const chargeMins=Math.max(45,Math.ceil(need/0.35*60));
 let feasible=windows.filter(w=>mins(w.end)<=dep && diff(w.start,w.end)>=chargeMins);
 state.urgent=false;
 // If departure is near, prioritize only feasible slots. If none, expose the latest
 // feasible emergency slot before departure, otherwise use an immediate fallback.
 if(feasible.length===0){
   state.urgent=true;
   feasible=windows.filter(w=>mins(w.start)<dep && mins(w.end)>mins(state.departure)-240).slice(-2);
   if(!feasible.length) feasible=[windows[0]];
 }
 feasible.sort((a,b)=>b.score-a.score);
 const best=feasible[0];
 state.selected=best;
 document.getElementById('optionIntro').textContent=`We compared renewable energy, price, grid load and your ${formatTime(state.departure)} departure deadline.`;
 let urgentHTML="";
 if(state.urgent){
   const better=windows.find(w=>w.score>=88 && mins(w.end)>dep);
   urgentHTML=`<div class="urgent"><strong>⚠ Your departure time is limiting optimization.</strong><p>We’re only showing charging windows that can realistically meet your deadline. ${better?`If you can depart around <b>${formatTime(better.end)}</b>, you could use a cleaner, cheaper window.`:"A later departure would create more room for optimization."}</p>${better?`<div class="grid2"><div><span class="small">Potential charging cost</span><h3>₹${calcCost(better)}</h3></div><div><span class="small">Potential CO₂</span><h3>${calcCO2(better)} g/session</h3></div></div><button class="btn secondary" onclick="selectWindow(${windows.indexOf(better)})">See cleaner option</button>`:""}</div>`;
 }
 document.getElementById('urgentBox').innerHTML=urgentHTML;
 document.getElementById('optionsList').innerHTML=feasible.map((w,i)=>optionHTML(w,w===best,i===0)).join('');
 go('options');
}
function optionHTML(w,best,i){
 return `<div class="card option ${best?'best':''}" style="margin-bottom:14px">
 ${best?'<div class="ribbon">BEST MATCH</div>':''}
 <div class="option-top"><div><div class="small">${w.grid} grid load</div><h3>${formatTime(w.start)} — ${formatTime(w.end)}</h3></div><div class="score">${w.score}<span class="small">/100</span></div></div>
 <div class="metrics">
  <div class="metric"><span>Renewable</span><b>${w.renew}%</b></div>
  <div class="metric"><span>Estimated cost</span><b>₹${calcCost(w)}</b></div>
  <div class="metric"><span>Grid load</span><b>${w.grid}</b></div>
  <div class="metric"><span>CO₂ estimate</span><b>${calcCO2(w)} g</b></div>
 </div>
 <div class="meter"><i style="width:${w.renew}%"></i></div>
 <div class="small">${best?'Recommended because it offers the strongest balance of renewable availability, cost and grid conditions while meeting your deadline.':'Valid alternative based on your charging requirement and departure time.'}</div>
 <button class="btn ${best?'primary':'secondary'} full" onclick="selectWindow(${windows.indexOf(w)})">${best?'Choose this slot':'Book this option'} →</button>
 </div>`;
}
function selectWindow(index){
 state.selected=windows[index];document.getElementById('bookTime').textContent=`${formatTime(state.selected.start)} — ${formatTime(state.selected.end)}`;
 document.getElementById('bookStation').textContent=`${document.getElementById('station').value} • Charger assigned after booking`;
 document.getElementById('bookMetrics').innerHTML=`<div class="metric"><span>Renewable</span><b>${state.selected.renew}%</b></div><div class="metric"><span>Cost</span><b>₹${calcCost(state.selected)}</b></div><div class="metric"><span>Grid</span><b>${state.selected.grid}</b></div><div class="metric"><span>CO₂</span><b>${calcCO2(state.selected)} g</b></div>`;
 go('booking');
}
function confirmBooking(){
 const code="GC-"+Math.floor(1000+Math.random()*9000);
 document.getElementById('passPlate').textContent=state.plate;
 document.getElementById('passInfo').innerHTML=`${document.getElementById('station').value}<br>Charger #${Math.floor(3+Math.random()*8)} • ${formatTime(state.selected.start)}–${formatTime(state.selected.end)}<br>Target charge: ${state.target}%`;
 document.getElementById('accessCode').textContent=code;go('access');
}
function unlock(){
 document.getElementById('charging').style.display='block';
 let p=0;document.getElementById('chargeStatus').textContent="✓ Charger unlocked • Charging started";
 const timer=setInterval(()=>{p+=10;document.getElementById('chargeProgress').style.width=p+"%";document.getElementById('chargePercent').textContent=p+"%";if(p>=100){clearInterval(timer);document.getElementById('chargeStatus').textContent="✓ Charging target reached";setTimeout(()=>go('thankyou'),900);}},800);
}

/* Local prototype data storage.
   This is intentionally browser-local until the real backend/database is attached. */
function saveSessionRecord(){
  const records = JSON.parse(localStorage.getItem("greencharge_sessions") || "[]");
  records.push({
    phone: state.phone,
    plate: state.plate,
    currentBattery: state.current,
    targetBattery: state.target,
    departure: state.departure,
    station: document.getElementById("station")?.value || "",
    selectedStart: state.selected?.start || "",
    selectedEnd: state.selected?.end || "",
    renewable: state.selected?.renew || null,
    estimatedCost: state.selected ? calcCost(state.selected) : null,
    estimatedCO2: state.selected ? calcCO2(state.selected) : null,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem("greencharge_sessions", JSON.stringify(records));
}

function downloadLocalData(){
  saveSessionRecord();
  const data = {
    users: getUsers(),
    sessions: JSON.parse(localStorage.getItem("greencharge_sessions") || "[]")
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "greencharge-demo-data.json";
  a.click();
  URL.revokeObjectURL(url);
  alert("Your current demo data has been saved as a JSON notes file.");
}
