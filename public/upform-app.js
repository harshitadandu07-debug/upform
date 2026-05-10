import {PoseLandmarker,FilesetResolver,DrawingUtils} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';

const root=document.getElementById('root');
const app=document.getElementById('app');
const frame=document.getElementById('frame');
const topNav=document.getElementById('topNav');


/* ── Figma asset URLs (expire in 7 days) ─────────────────── */
const IMG_SPLASH='https://www.figma.com/api/mcp/asset/67451e88-3c39-42b2-9ccd-1b38fa989198';
const IMG_SIGNUP='https://www.figma.com/api/mcp/asset/c8c76b92-fe8b-4440-980a-204ea7da84d0';
const IMG_OB1='https://www.figma.com/api/mcp/asset/6790b10b-2c64-4d59-b487-76f6e1ceb041';

/* ── Exercise tutorials ─────────────────────────────────── */
const TUTORIALS={
  squat:{
    name:'Squat Pattern',
    icon:'🦵',
    steps:[
      'Stand with feet shoulder-width apart, toes angled 15–30° outward.',
      'Brace your core — breathe in and tighten your stomach before you move.',
      'Hinge at the hips first, then bend the knees. Think "sit back and down".',
      'Push your knees out in the direction your toes point throughout the descent.',
      'Lower until thighs are at least parallel to the floor. Chest stays tall.',
      'Drive through your whole foot to stand. Squeeze your glutes at the top.'
    ],
    mistakes:[
      'Knees caving inward — actively push them out over your little toe.',
      'Heels rising — keep them flat; if they lift, raise your heels on a plate.',
      'Chest falling forward — keep it tall, look slightly up.',
      'Not reaching depth — use less weight and sit deeper.'
    ],
    tip:'Imagine sitting back onto a low chair just behind you. The bar or your arms are just along for the ride — your hips lead the movement.',
    cues:['Chest tall','Knees out','Sit between feet','Drive through heels']
  },
  press:{
    name:'Press Pattern',
    icon:'💪',
    steps:[
      'Grip the bar or handles just outside shoulder width.',
      'Position your wrists directly above your elbows before pressing — this is your power line.',
      'Retract and depress your shoulder blades: pull them back and down.',
      'Press the weight upward smoothly. Do not shrug your shoulders toward your ears.',
      'Fully extend without locking hard. Keep tension in the pressing muscles.',
      'Lower slowly and under control — aim for 2–3 seconds on the way down.'
    ],
    mistakes:[
      'Shrugging shoulders up — keep them packed down throughout.',
      'Flaring elbows too wide — keep them at roughly 45° on bench press.',
      'Bouncing at the bottom — control the stretch, do not use momentum.',
      'Uneven press — focus on feeling both sides equally.'
    ],
    tip:'Think "push yourself away from the bar" on bench. On overhead press, imagine pushing the ceiling away while keeping your ribs down.',
    cues:['Shoulders down','Wrists over elbows','Controlled descent','No shrug']
  },
  raise:{
    name:'Raise / Isolation Pattern',
    icon:'🏋️',
    steps:[
      'Stand tall with a slight, soft bend in both elbows — never fully lock them.',
      'Brace your core and squeeze your glutes before lifting. Stay still.',
      'Raise the weight by initiating from the shoulder joint, not the wrist.',
      'Stop at shoulder height — going higher shifts the work off the target muscle.',
      'Pause briefly at the top to feel the contraction.',
      'Lower slowly — 3 seconds down is where most of the benefit happens.'
    ],
    mistakes:[
      'Using momentum and swinging — slow down and use less weight.',
      'Too much weight — you should feel it in the target muscle the whole time.',
      'Raising above shoulder height — stop right there.',
      'Bending elbows to compensate — reduce weight and keep a soft, fixed elbow.'
    ],
    tip:'Lead with your elbows, not your hands. Imagine pouring water out of a jug held at arm\'s length.',
    cues:['Soft elbows','Stop at shoulder height','Slow lower','No swing']
  },
  row:{
    name:'Row / Pull Pattern',
    icon:'🔙',
    steps:[
      'Hinge at the hips until your torso is near parallel — keep a neutral spine, not rounded.',
      'Let your arms hang straight before initiating the pull.',
      'Lead with your elbows, not your hands — pull them back past your torso.',
      'Squeeze your shoulder blades together hard at the top of each rep.',
      'Keep your torso angle consistent — do not rise with the pull.',
      'Lower with control, resisting the weight all the way back down.'
    ],
    mistakes:[
      'Rounding the lower back — hinge with a flat, neutral spine.',
      'Using too much bicep — the elbow should lead, bicep is secondary.',
      'Torso rising with the pull — stay locked in your hinge angle.',
      'Not squeezing at the top — that contraction is the muscle working.'
    ],
    tip:'Imagine you are trying to crack a walnut between your shoulder blades at the top of each rep. That squeeze is the goal.',
    cues:['Flat back','Elbows back','Squeeze blades','Stay hinged']
  }
};

const BASE_EX=[
  {id:'squat',name:'Bodyweight Squat',target:'Legs',sets:2,reps:8,weight:0,rest:75,cue:'Sit between your knees. Chest tall. Reach depth.',type:'squat',prev:'—'},
  {id:'press',name:'Shoulder Press',target:'Shoulders',sets:3,reps:8,weight:20,rest:90,cue:'Wrists above elbows. Press without shrugging.',type:'press',prev:'20 × 8'},
  {id:'raise',name:'Lateral Raise',target:'Shoulders',sets:2,reps:10,weight:8,rest:60,cue:'Stop around shoulder height. Do not shrug.',type:'raise',prev:'8 × 10'},
  {id:'chest',name:'Chest Press',target:'Chest',sets:3,reps:10,weight:35,rest:90,cue:'Handles at mid-chest. Smooth press. Shoulders down.',type:'press',prev:'30 × 10'},
  {id:'row',name:'Barbell Row',target:'Back',sets:3,reps:8,weight:45,rest:90,cue:'Hinge. Pull elbows back. Torso stays stable.',type:'row',prev:'—'},
  {id:'lat',name:'Lat Pulldown',target:'Back',sets:3,reps:10,weight:35,rest:90,cue:'Pull elbows down. Keep ribs quiet.',type:'row',prev:'35 × 10'},
  {id:'legpress',name:'Leg Press',target:'Legs',sets:3,reps:10,weight:70,rest:90,cue:'Lower slow. Knees track over toes.',type:'squat',prev:'70 × 10'},
  {id:'curl',name:'Dumbbell Curl',target:'Arms',sets:2,reps:12,weight:10,rest:60,cue:'No swing. Elbows stay quiet.',type:'raise',prev:'10 × 12'},
  {id:'tricep',name:'Rope Pushdown',target:'Arms',sets:2,reps:12,weight:20,rest:60,cue:'Elbows pinned. Finish with control.',type:'press',prev:'20 × 12'},
  {id:'plank',name:'Plank',target:'Core',sets:2,reps:30,weight:0,rest:60,cue:'Ribs down. Breathe. Do not sag.',type:'squat',prev:'30 sec'}
];

const ex=id=>structuredClone(BASE_EX.find(e=>e.id===id));

const PRESETS=[
  {id:'full',name:'Full Body Beginner',label:'Starter',desc:'Five simple movements. Built for a complete beginner walking in today.',days:'Day 1',exercises:['squat','press','raise','chest','row'].map(ex)},
  {id:'push',name:'Push Day A',label:'Push',desc:'Chest, shoulders, and triceps with AR support on presses and raises.',days:'PPL',exercises:['press','chest','raise','tricep'].map(ex)},
  {id:'pull',name:'Pull Day A',label:'Pull',desc:'Back and biceps. Beginner-safe pulling with simple cues.',days:'PPL',exercises:['lat','row','curl'].map(ex)},
  {id:'legs',name:'Leg Day A',label:'Legs',desc:'Stable lower-body work. Squat pattern, leg press, and core.',days:'PPL',exercises:['squat','legpress','plank'].map(ex)}
];

let state={
  screen:'splash',
  userName:'',
  userLevel:'',
  userAge:'',
  userHeight:'',
  userWeight:'',
  modal:null,
  learnExId:null,
  pendingWorkoutId:null,
  selectedWorkoutId:'full',
  workouts:structuredClone(PRESETS),
  history:[
    {name:'Full Body Primer',date:'Yesterday',sets:6,mode:'Manual log'},
    {name:'Machine Confidence',date:'Last week',sets:8,mode:'Phone AR'}
  ],
  activeWorkout:null,
  exIndex:0,
  setIndex:0,
  setDone:{},
  mode:'phone',
  stream:null,
  detector:null,
  anim:null,
  lastVideo:-1,
  repPhase:'down',
  repCount:0,
  debug:'',
  signalEMA:null,
  phaseFrames:0,
  lastRepTime:0,
  repArmed:false,
  totalARReps:0,
  cue:'Start camera. Keep your body visible.',
  status:'Waiting for camera',
  exerciseSummary:null,
  finished:false,
  filter:'All',
  learnFilter:'All',
  search:'',
  arPhase:'idle',    // 'idle' | 'counting' | 'resting' | 'done'
  restRemaining:0,
  restInterval:null,
  restOnDone:null
};

const cap=s=>s[0].toUpperCase()+s.slice(1);
const userName=()=>state.userName||'there';
const currentWorkout=()=>state.workouts.find(w=>w.id===state.selectedWorkoutId)||state.workouts[0];

function resetShell(){
  app.className='app';
  frame.className='mobile-frame';
}

function setNav(active){
  if(state.screen==='ar'){
    topNav.style.display='none';
    topNav.innerHTML='';
    return;
  }

  if(['splash','signup','onboard1','onboard2','onboard3','strategy'].includes(state.screen)){
    topNav.style.display='none';
    topNav.innerHTML='';
    return;
  }

  topNav.style.display='block';
  topNav.innerHTML=`
    <nav class="top-nav">
      <button class="nav ${active==='home'?'active':''}" onclick="go('home')">
        <b>⌂</b><span>Home</span>
      </button>
      <button class="nav ${active==='workouts'?'active':''}" onclick="go('workouts')">
        <b>▦</b><span>Workouts</span>
      </button>
      <button class="nav ${active==='learn'?'active':''}" onclick="go('learn')">
        <b>📖</b><span>Learn</span>
      </button>
      <button class="nav ${active==='coach'?'active':''}" onclick="go('coach')">
        <b>↗</b><span>Coach</span>
      </button>
    </nav>
  `;
}

function openCoachMode(workoutId){
  state.pendingWorkoutId=workoutId||state.selectedWorkoutId;
  state.modal='coachMode';
  render();
}

function openModal(type){
  state.modal=type;
  render();
}

function closeModal(){
  state.modal=null;
  state.pendingWorkoutId=null;
  state.learnExId=null;
  render();
}

window.openCoachMode=openCoachMode;
window.openModal=openModal;
window.closeModal=closeModal;

window.go=s=>{
  if(state.screen==='ar'&&s!=='ar')stopCamera();
  state.modal=null;
  state.screen=s;
  render();
};

window.openLearn=id=>{
  state.learnExId=id;
  state.modal='learn';
  render();
};

/* ── Screens ─────────────────────────────────────────────── */

function splash(){
  resetShell();
  root.innerHTML=`
    <div class="splash-screen screen">
      <div class="splash-illustration">
        <img src="${IMG_SPLASH}" alt="">
      </div>
      <div class="splash-text-group">
        <div class="splash-logo">UpForm</div>
        <div class="splash-tagline">Your journey to better fitness<br>starts here</div>
      </div>
      <div class="splash-bottom">
        <button class="splash-cta" onclick="go('signup')">Get Started</button>
      </div>
    </div>
  `;
  setTimeout(()=>{if(state.screen==='splash')go('signup');},3000);
}

function signup(){
  resetShell();
  root.innerHTML=`
    <div class="signup-screen screen">
      <div class="signup-title">Welcome! Let's get fit.</div>
      <img class="signup-illustration" src="${IMG_SIGNUP}" alt="">
      <div class="signup-buttons">
        <button class="signup-btn" onclick="go('onboard1')">📱 Continue with phone number</button>
        <button class="signup-btn" onclick="go('onboard1')">✉️ Continue with email address</button>
        <button class="signup-btn" onclick="go('onboard1')">🔍 Continue with Google</button>
        <button class="signup-btn" onclick="go('onboard1')">🍎 Continue with Apple</button>
      </div>
      <button class="signup-skip" onclick="go('home')">Skip for now</button>
    </div>
  `;
}

function onboard1(){
  resetShell();
  root.innerHTML=`
    <div class="ob-screen screen">
      <img class="ob-illustration" src="${IMG_OB1}" alt="">
      <div class="ob-heading">What should we call you?</div>
      <p class="ob-sub">Let's personalize your fitness journey</p>
      <input class="ob-input" id="nameInput" type="text" placeholder="Enter your name" value="${state.userName}" oninput="state.userName=this.value">
      <button class="ob-btn-primary" onclick="saveOnboard1()">Continue</button>
      <div class="ob-step">Step 1 of 3</div>
    </div>
  `;
}

window.saveOnboard1=()=>{
  const v=document.getElementById('nameInput')?.value||'';
  state.userName=v.trim()||'there';
  go('onboard2');
};

function onboard2(){
  resetShell();
  const levels=[
    {id:'beginner',title:'Beginner',sub:'New to working out'},
    {id:'intermediate',title:'Intermediate',sub:'Regular gym-goer'},
    {id:'advanced',title:'Advanced',sub:'Experienced athlete'}
  ];
  root.innerHTML=`
    <div class="ob-screen screen" style="padding-top:0">
      <div style="height:133px"></div>
      <div class="ob-heading" style="margin-top:0">What's your level, ${state.userName||'there'}?</div>
      <p class="ob-sub">This helps us create the perfect workout plan</p>
      <div style="display:flex;flex-direction:column;gap:14px;width:100%;max-width:345px;margin-top:28px">
        ${levels.map(l=>`
          <button class="ob-level-btn ${state.userLevel===l.id?'selected':''}" onclick="selectLevel('${l.id}')">
            <span class="ob-level-title">${l.title}</span>
            <span class="ob-level-sub">${l.sub}</span>
          </button>
        `).join('')}
      </div>
      <div class="ob-row-btns">
        <button class="ob-btn-outline" onclick="go('onboard1')">Back</button>
        <button class="ob-btn-primary" id="ob2-continue" style="margin-top:0;opacity:${state.userLevel?1:.45}" onclick="ob2Continue()">Continue</button>
      </div>
      <div class="ob-step">Step 2 of 3</div>
    </div>
  `;
}

window.selectLevel=l=>{state.userLevel=l;render();};
window.ob2Continue=()=>{if(state.userLevel)go('onboard3');};

function onboard3(){
  resetShell();
  root.innerHTML=`
    <div class="ob-screen screen" style="padding-top:0">
      <div style="height:162px"></div>
      <div class="ob-heading" style="margin-top:0;font-size:32px">Almost there, ${state.userName||'there'}!</div>
      <p class="ob-sub">A few more details for a personalized experience</p>

      <div class="ob-label">Age</div>
      <input class="ob-input" style="margin-top:8px" type="number" placeholder="Enter your age" value="${state.userAge}" oninput="state.userAge=this.value">

      <div class="ob-label">Height (cm)</div>
      <input class="ob-input" style="margin-top:8px" type="number" placeholder="Enter your height" value="${state.userHeight}" oninput="state.userHeight=this.value">

      <div class="ob-label">Weight (kg)</div>
      <input class="ob-input" style="margin-top:8px" type="number" placeholder="Enter your weight" value="${state.userWeight}" oninput="state.userWeight=this.value">

      <div class="ob-row-btns">
        <button class="ob-btn-outline" onclick="go('onboard2')">Back</button>
        <button class="ob-btn-primary" style="margin-top:0" onclick="go('home')">Get Started</button>
      </div>
      <div class="ob-step">Step 3 of 3</div>
    </div>
  `;
}

function home(){
  resetShell();
  let w=currentWorkout();
  const greet=state.userName?`Good to see you, ${state.userName}.`:'Good to see you.';

  root.innerHTML=`
    <section class="screen">
      <div class="top">
        <div>
          <div class="eyebrow" style="margin-bottom:6px">Home</div>
          <h2>Today is already planned.</h2>
        </div>
      </div>

      <div class="hero" style="padding:28px">
        <span class="badge" style="background:rgba(255,255,233,.15);border-color:rgba(255,255,233,.3);color:#ffffe9">Ready to train</span>
        <h2 style="margin-top:14px;font-size:28px">${greet}</h2>
        <p style="color:rgba(255,255,233,.7);margin-top:6px">Complete today's workout to build your streak.</p>
        <div class="xpbar" style="margin-top:18px"><span></span></div>
        <p style="font-size:11px;color:rgba(255,255,233,.5);margin-top:6px;font-weight:600;letter-spacing:.06em;text-transform:uppercase">720 XP · Level 4</p>
      </div>

      <div class="metric-row">
        <div class="metric"><strong>72%</strong><span>to lvl 5</span></div>
        <div class="metric"><strong>${state.workouts.length}</strong><span>saved plans</span></div>
        <div class="metric"><strong>${state.totalARReps}</strong><span>AR reps</span></div>
      </div>

      <div class="card routine" style="margin-top:16px">
        <div class="top" style="margin-bottom:12px">
          <div>
            <span class="badge amber">${w.label||'Today'}</span>
            <h2 style="font-size:28px;margin-top:10px">${w.name}</h2>
            <p class="lead" style="margin-top:7px">${w.desc}</p>
          </div>
          <span class="badge green">${w.exercises.length} moves</span>
        </div>

        <div style="display:grid;gap:8px;margin-top:14px">
          ${w.exercises.slice(0,5).map((e,i)=>`
            <div class="row" style="padding:11px 0">
              <div style="display:flex;gap:12px;align-items:flex-start">
                <span class="badge" style="min-width:34px;justify-content:center">${i+1}</span>
                <div>
                  <strong style="font-size:15px;font-weight:900">${e.name}</strong>
                  <p class="tiny" style="margin-top:3px">${e.target} · ${e.cue}</p>
                </div>
              </div>
              <button class="btn learn-btn" onclick="openLearn('${e.id}')">Learn</button>
            </div>
          `).join('')}
        </div>

        <button class="btn primary" style="width:100%;margin-top:16px" onclick="openCoachMode('${w.id}')">Start today's workout</button>
        <button class="btn ghost" style="width:100%;margin-top:10px" onclick="go('workouts')">Change workout</button>
      </div>

      <div class="card pad" style="margin-top:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3>New to the gym?</h3>
          <span class="badge blue">Guides</span>
        </div>
        <p class="tiny">Step-by-step instructions, common mistakes, and coaching tips for every movement pattern.</p>
        <button class="btn secondary" style="width:100%;margin-top:12px" onclick="go('learn')">Open exercise guides</button>
      </div>

      <div class="card pad" style="margin-top:14px">
        <h3>Quick actions</h3>
        <p class="tiny" style="margin-top:5px">Manage plans, review history, or import past workouts.</p>
        <div class="actions">
          <button class="btn secondary" onclick="go('workouts')">Manage workouts</button>
          <button class="btn secondary" onclick="go('coach')">View history</button>
        </div>
      </div>

      ${state.modal?modal():''}
    </section>
  `;
}

function workouts(){
  resetShell();
  let selected=currentWorkout();

  root.innerHTML=`
    <section class="screen">
      <div class="top">
        <div>
          <div class="eyebrow" style="margin-bottom:6px">My workouts</div>
          <h2>Saved routines.</h2>
          <p class="tiny" style="margin-top:6px">Tabs swap the routine below.</p>
        </div>
        <button class="btn primary small" onclick="openModal('add')">Add exercise</button>
      </div>

      <div class="actions">
        <button class="btn secondary" onclick="openModal('create')">Create custom</button>
        <button class="btn secondary" onclick="document.getElementById('csv').click()">Import CSV</button>
        <input id="csv" type="file" accept=".csv" style="display:none" onchange="importCSV(event)">
      </div>

      <div class="tabs" style="overflow-x:auto;padding-bottom:2px">
        ${state.workouts.map(w=>`
          <button class="tab ${state.selectedWorkoutId===w.id?'active':''}" onclick="selectWorkout('${w.id}')">${w.label||w.name}</button>
        `).join('')}
        <button class="tab" onclick="openModal('create')">＋</button>
      </div>

      <div class="card routine">
        <div class="top" style="margin-bottom:10px">
          <div>
            <span class="badge green">${selected.label||'Saved'}</span>
            <h3 style="font-size:23px;margin-top:10px">${selected.name}</h3>
            <p class="tiny" style="margin-top:5px">${selected.desc}</p>
          </div>
          <button class="btn ghost small" onclick="openCoachMode('${selected.id}')">Start</button>
        </div>

        ${selected.exercises.map((e,i)=>`
          <div class="row">
            <div style="display:flex;gap:12px;align-items:flex-start">
              <span class="badge" style="min-width:34px;justify-content:center">${i+1}</span>
              <div>
                <strong>${e.name}</strong>
                <p class="tiny">${e.target} · ${e.cue}</p>
              </div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              <button class="btn learn-btn" onclick="openLearn('${e.id}')">Learn</button>
              <button class="btn ghost small" onclick="startExercise('${selected.id}','${e.id}')">Start</button>
            </div>
          </div>
        `).join('')}

        <div class="actions">
          <button class="btn secondary" onclick="openModal('add')">Add exercise</button>
          <button class="btn primary" onclick="openCoachMode('${selected.id}')">Start workout</button>
        </div>
      </div>

      <div class="card pad" style="margin-top:14px">
        <h3>Add more workouts</h3>
        <p class="tiny" style="margin-top:5px">Create a custom routine or import a CSV.</p>
        <div class="actions">
          <button class="btn ghost" onclick="openModal('create')">New workout</button>
          <button class="btn ghost" onclick="document.getElementById('csv').click()">Import CSV</button>
        </div>
      </div>

      <div class="card pad" style="margin-top:14px">
        <h3>Exercise library</h3>
        <p class="tiny" style="margin-top:5px">Search, filter, and browse all beginner-safe exercises.</p>
        <button class="btn ghost" style="width:100%;margin-top:12px" onclick="openModal('add')">Open library</button>
      </div>

      ${state.modal?modal():''}
    </section>
  `;
}

/* ── Learn screen ─────────────────────────────────────────── */
function learn(){
  resetShell();

  const groups={
    Legs:BASE_EX.filter(e=>e.target==='Legs'||(state.learnFilter!=='All'&&e.target===state.learnFilter)),
    Shoulders:BASE_EX.filter(e=>e.target==='Shoulders'),
    Chest:BASE_EX.filter(e=>e.target==='Chest'),
    Back:BASE_EX.filter(e=>e.target==='Back'),
    Arms:BASE_EX.filter(e=>e.target==='Arms'),
    Core:BASE_EX.filter(e=>e.target==='Core')
  };

  const filtered=state.learnFilter==='All'
    ?BASE_EX
    :BASE_EX.filter(e=>e.target===state.learnFilter);

  const byGroup={};
  filtered.forEach(e=>{
    if(!byGroup[e.target])byGroup[e.target]=[];
    byGroup[e.target].push(e);
  });

  root.innerHTML=`
    <section class="screen">
      <div class="top">
        <div>
          <div class="eyebrow" style="margin-bottom:6px">Exercise guides</div>
          <h2>Learn how to train.</h2>
          <p class="tiny" style="margin-top:6px">Step-by-step form, common mistakes, and coaching tips for every exercise.</p>
        </div>
      </div>

      <!-- Pattern cards -->
      <div style="display:grid;gap:10px;margin-bottom:20px">
        ${Object.entries(TUTORIALS).map(([type,t])=>`
          <div class="learn-card">
            <div class="learn-header">
              <div style="display:flex;gap:10px;align-items:center">
                <span style="font-size:22px">${t.icon}</span>
                <div>
                  <strong style="font-size:15px;font-weight:900">${t.name}</strong>
                  <p class="tiny" style="margin-top:2px">${t.steps.length} steps · ${t.mistakes.length} mistakes to avoid</p>
                </div>
              </div>
              <button class="btn learn-btn" onclick="openLearnType('${type}')">Guide</button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${t.cues.map(c=>`<span class="cue-pill">${c}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Filter by muscle -->
      <div class="chiprow" style="margin-bottom:14px">
        ${['All','Shoulders','Chest','Legs','Back','Arms','Core'].map(f=>`
          <button class="chip ${state.learnFilter===f?'active':''}" onclick="setLearnFilter('${f}')">${f}</button>
        `).join('')}
      </div>

      <!-- Exercise list -->
      ${Object.entries(byGroup).map(([group,exs])=>`
        <div class="muscle-section">
          <div class="muscle-label">${group}</div>
          ${exs.map(e=>`
            <div class="ex-card">
              <div>
                <strong style="font-size:14px;font-weight:900">${e.name}</strong>
                <p class="tiny" style="margin-top:3px">${e.cue}</p>
                <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px">
                  ${(TUTORIALS[e.type]?.cues||[]).map(c=>`<span class="cue-pill">${c}</span>`).join('')}
                </div>
              </div>
              <button class="btn learn-btn" style="flex-shrink:0" onclick="openLearn('${e.id}')">Learn</button>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </section>

    ${state.modal?modal():''}
  `;
}

window.setLearnFilter=f=>{
  state.learnFilter=f;
  render();
};

window.openLearnType=type=>{
  state.learnExId='__type__'+type;
  state.modal='learn';
  render();
};

/* ── Modal ───────────────────────────────────────────────── */
function modal(){
  let list=BASE_EX.filter(e=>
    (state.filter==='All'||e.target===state.filter)&&
    e.name.toLowerCase().includes(state.search.toLowerCase())
  );

  if(state.modal==='learn'){
    let tut,exName,exCue;

    if(state.learnExId&&state.learnExId.startsWith('__type__')){
      let type=state.learnExId.replace('__type__','');
      tut=TUTORIALS[type];
      exName=tut.name;
      exCue='Movement pattern guide';
    }else{
      let e=BASE_EX.find(x=>x.id===state.learnExId);
      tut=TUTORIALS[e?.type||'squat'];
      exName=e?.name||'Exercise';
      exCue=e?.cue||'';
    }

    return `
      <div class="modal" onclick="if(event.target===this)closeModal()">
        <div class="sheet">
          <div class="top" style="margin-bottom:14px">
            <div>
              <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
                <span style="font-size:20px">${tut.icon}</span>
                <span class="badge blue">${tut.name}</span>
              </div>
              <h2 style="font-size:22px">${exName}</h2>
              <p class="tiny" style="margin-top:4px">${exCue}</p>
            </div>
            <button class="btn ghost small" onclick="closeModal()">✕</button>
          </div>

          <!-- Quick cues -->
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
            ${tut.cues.map(c=>`<span class="cue-pill">${c}</span>`).join('')}
          </div>

          <!-- Steps -->
          <div class="eyebrow">Step by step</div>
          <div>
            ${tut.steps.map((s,i)=>`
              <div class="tutorial-step">
                <div class="step-num">${i+1}</div>
                <p style="color:var(--text);font-size:13px;line-height:1.55;margin:0">${s}</p>
              </div>
            `).join('')}
          </div>

          <!-- Mistakes -->
          <div class="eyebrow" style="margin-top:18px">Common mistakes</div>
          <div>
            ${tut.mistakes.map(m=>`
              <div class="mistake-row">
                <span class="badge red" style="flex-shrink:0;font-size:14px">✗</span>
                <p style="color:#c0392b;font-size:12px;line-height:1.5;margin:0">${m}</p>
              </div>
            `).join('')}
          </div>

          <!-- Coach tip -->
          <div class="tip-card">
            <div style="display:flex;gap:8px;align-items:flex-start">
              <span style="font-size:16px;flex-shrink:0">💡</span>
              <p style="color:var(--color-forest-canopy);font-size:13px;line-height:1.55;margin:0"><strong style="color:var(--color-forest-canopy)">Coach tip: </strong>${tut.tip}</p>
            </div>
          </div>

          <button class="btn primary" style="margin-top:18px" onclick="closeModal()">Got it</button>
        </div>
      </div>
    `;
  }

  if(state.modal==='coachMode'){
    let w=state.workouts.find(x=>x.id===state.pendingWorkoutId)||currentWorkout();
    return `
      <div class="modal" onclick="if(event.target===this)closeModal()">
        <div class="sheet">
          <div class="top">
            <div>
              <h2>Choose coaching mode</h2>
              <p class="tiny" style="margin-top:6px">${w.name} · You can switch modes during the workout.</p>
            </div>
            <button class="btn ghost small" onclick="closeModal()">✕</button>
          </div>

          <button class="mode-option" onclick="startWorkout('${w.id}','log')">
            <div><strong>Guided log</strong><span>Manual set logging with beginner cues, rest timer, and summaries.</span></div>
            <b>→</b>
          </button>
          <button class="mode-option" onclick="startWorkout('${w.id}','phone')">
            <div><strong>Phone camera</strong><span>Use your phone for rep counting and form feedback while you train.</span></div>
            <b>→</b>
          </button>
          <button class="mode-option" onclick="startWorkout('${w.id}','meta')">
            <div><strong>Meta glasses</strong><span>Hands-free coaching. Sets log automatically without touching your phone.</span></div>
            <b>→</b>
          </button>

          <p class="tiny" style="margin-top:14px">Recommendation for first-timers: start with Guided log, then switch to camera when form feels uncertain.</p>
        </div>
      </div>
    `;
  }

  if(state.modal==='create'){
    return `
      <div class="modal" onclick="if(event.target===this)closeModal()">
        <div class="sheet">
          <div class="top">
            <h2>Create workout</h2>
            <button class="btn ghost small" onclick="closeModal()">✕</button>
          </div>
          <p class="lead">Create a new saved workout from the beginner-safe exercise library.</p>
          <input class="search" id="customName" placeholder="Workout name" value="Custom Full Body">
          <div class="chiprow">
            <button class="chip active">Beginner</button>
            <button class="chip">Machine first</button>
            <button class="chip">AR enabled</button>
          </div>
          <button class="btn primary" style="margin-top:18px" onclick="saveCustomWorkout()">Save custom workout</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="modal" onclick="if(event.target===this)closeModal()">
      <div class="sheet">
        <div class="top">
          <h2>Add exercise</h2>
          <button class="btn ghost small" onclick="closeModal()">✕</button>
        </div>
        <input class="search" placeholder="Search exercises" value="${state.search}" oninput="setSearch(this.value)">
        <div class="chiprow">
          ${['All','Shoulders','Chest','Legs','Back','Arms','Core'].map(f=>`
            <button class="chip ${state.filter===f?'active':''}" onclick="setFilter('${f}')">${f}</button>
          `).join('')}
        </div>
        ${list.map(e=>`
          <div class="row">
            <div>
              <strong>${e.name}</strong>
              <p class="tiny">${e.target} · ${e.cue}</p>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn learn-btn" onclick="openLearn('${e.id}')">Learn</button>
              <button class="btn primary small" onclick="addExercise('${e.id}')">Add</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.setSearch=v=>{state.search=v;render();};
window.setFilter=f=>{state.filter=f;render();};
window.selectWorkout=id=>{state.selectedWorkoutId=id;render();};

window.addExercise=id=>{
  let e=BASE_EX.find(x=>x.id===id);
  currentWorkout().exercises.push(structuredClone(e));
  state.modal=null;
  render();
};

window.saveCustomWorkout=()=>{
  let name=document.getElementById('customName')?.value||'Custom Workout';
  let id='custom-'+Date.now();
  state.workouts.push({id,name,label:'Custom',desc:'Your saved custom beginner routine.',days:'Custom',exercises:['squat','chest','row'].map(ex)});
  state.selectedWorkoutId=id;
  state.modal=null;
  render();
};

window.importCSV=e=>{
  let f=e.target.files[0];
  if(!f)return;
  let r=new FileReader();
  r.onload=()=>{
    state.history.unshift({name:'Imported Hevy / EpicGains CSV',date:'Today',sets:12,mode:'CSV import'});
    alert('CSV imported into workout history prototype.');
    render();
  };
  r.readAsText(f);
};

function startExercise(workoutId,exId){
  state.selectedWorkoutId=workoutId;
  let w=currentWorkout();
  let idx=w.exercises.findIndex(e=>e.id===exId);
  initWorkout(workoutId);
  state.exIndex=Math.max(0,idx);
  state.screen='log';
  render();
}

window.startExercise=startExercise;

function initWorkout(workoutId=state.selectedWorkoutId){
  state.selectedWorkoutId=workoutId;
  state.activeWorkout=structuredClone(currentWorkout());
  state.exIndex=0;
  state.setIndex=0;
  state.repCount=0;
  state.repPhase='down';
  state.exerciseSummary=null;
  state.finished=false;
  state.arPhase='idle';
  state.restRemaining=0;
  state.restOnDone=null;
  if(state.restInterval){clearInterval(state.restInterval);state.restInterval=null;}
  state.status='Get into position.';
  state.cue='Tap Start set when ready.';
}

window.startWorkout=(workoutId,mode='log')=>{
  state.modal=null;
  state.pendingWorkoutId=null;
  initWorkout(workoutId);
  if(mode==='log'){state.screen='log';}
  else{state.mode=mode;state.screen='ar';}
  render();
};

window.startManual=()=>{initWorkout();state.screen='log';render();};

window.startAR=mode=>{
  if(!state.activeWorkout)initWorkout(state.selectedWorkoutId);
  state.mode=mode;
  state.screen='ar';
  state.exerciseSummary=null;
  state.repCount=0;
  state.repPhase='down';
  state.status='Ready';
  state.cue='Start camera once. Nudge will keep it running across exercises.';
  render();
};

/* ── Log screen ──────────────────────────────────────────── */
function log(){
  resetShell();
  let w=state.activeWorkout||state.workouts[0];

  root.innerHTML=`
    <section class="screen">
      <div class="top">
        <div>
          <div class="eyebrow" style="margin-bottom:6px">Workout log</div>
          <h2>${w.name}</h2>
        </div>
        <button class="btn ghost small" onclick="finishWorkout()">Finish</button>
      </div>

      <div class="card pad">
        <p>Guided log is active. Switch to camera when form feels uncertain.</p>
        <div class="actions">
          <button class="btn secondary" onclick="startAR('phone')">Coach my form</button>
          <button class="btn primary" onclick="startAR('meta')">Train hands-free</button>
        </div>
      </div>

      ${w.exercises.map((e,i)=>`
        <div class="card routine" style="margin-top:12px">
          <div class="top" style="margin-bottom:8px">
            <div>
              <h3>${e.name}</h3>
              <p class="tiny">${e.cue}</p>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn learn-btn" onclick="openLearn('${e.id}')">Learn</button>
              <button class="btn ghost small" onclick="jumpAR(${i})">AR</button>
            </div>
          </div>

          <!-- Quick cues bar -->
          <div class="form-cue-bar">
            <div class="icon">🎯</div>
            <div>
              <p style="font-size:11px;font-weight:700;color:var(--color-sunburst);margin:0 0 5px">Form reminders</p>
              <div style="display:flex;flex-wrap:wrap;gap:5px">
                ${(TUTORIALS[e.type]?.cues||[]).map(c=>`<span class="cue-pill" style="font-size:11px;padding:5px 9px">${c}</span>`).join('')}
              </div>
            </div>
          </div>

          <div class="set-table">
            <div class="set-row head">
              <div>Set</div><div>Prev</div><div>lb</div><div>Reps</div><div>✓</div>
            </div>
            ${Array.from({length:e.sets}).map((_,s)=>{
              let key=e.id+'-'+s;
              let done=state.setDone[key];
              return `
                <div class="set-row ${done?'done':''}">
                  <div><strong>${s+1}</strong></div>
                  <div>${e.prev}</div>
                  <input class="set-input" value="${e.weight}">
                  <input class="set-input" value="${e.reps}">
                  <button class="check ${done?'done':''}" onclick="toggleSet('${key}')">${done?'✓':'+'}</button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}

      <button class="btn primary" style="margin-top:16px" onclick="finishWorkout()">Finish workout</button>

      ${state.modal?modal():''}
    </section>
  `;
}

window.toggleSet=k=>{state.setDone[k]=!state.setDone[k];render();};
window.jumpAR=i=>{state.exIndex=i;state.setIndex=0;state.repCount=0;window.startAR('phone');};

/* ── AR screen ───────────────────────────────────────────── */
function arStatusText(e){
  if(state.arPhase==='idle')   return {s:'Get into position.',c:'Tap Start set when ready.'};
  if(state.arPhase==='counting') return {s:'Counting reps — go.',c:e.cue};
  if(state.arPhase==='resting')  return {s:'Rest',c:'Next set starts automatically.'};
  return {s:'Done.',c:''};
}

function restOverlay(e){
  const m=Math.floor(state.restRemaining/60),s=state.restRemaining%60;
  const timeStr=`${m}:${s.toString().padStart(2,'0')}`;
  const moreSetsSameEx=state.setIndex<e.sets-1;
  const moreExercises=state.exIndex<state.activeWorkout.exercises.length-1;
  let nextLabel;
  if(moreSetsSameEx)        nextLabel=`Next: Set ${state.setIndex+2} of ${e.sets}`;
  else if(moreExercises)    nextLabel=`Next exercise: ${state.activeWorkout.exercises[state.exIndex+1].name}`;
  else                      nextLabel='Last set — finishing up';
  return `
    <div class="rest-overlay">
      <div class="rest-card">
        <p class="rest-label">Rest</p>
        <div class="rest-timer" id="rest-timer">${timeStr}</div>
        <p class="rest-next">${nextLabel}</p>
        <button class="btn ghost" style="margin-top:24px;width:auto;padding:10px 28px" onclick="skipRest()">Skip rest</button>
      </div>
    </div>
  `;
}

function ar(){
  app.className='app camera';
  frame.className='mobile-frame';

  const e=state.activeWorkout.exercises[state.exIndex];
  const {s:statusTxt,c:cueTxt}=arStatusText(e);
  const isIdle=state.arPhase==='idle';

  root.innerHTML=`
    <section class="camera-stage ${state.mode==='meta'?'meta':''}">
      <video id="video" autoplay playsinline muted></video>
      <canvas id="canvas"></canvas>
      <div class="dim"></div>

      <div class="hud top-left">
        <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">
          <span class="badge green">Counting reps</span>
          <span class="badge">${state.mode==='meta'?'Meta':'Phone AR'}</span>
        </div>
        <h3 style="margin-top:8px">${e.name}</h3>
        <p class="tiny" style="margin-top:3px">Set ${state.setIndex+1} of ${e.sets}</p>
        <p class="tiny" style="margin-top:4px;opacity:.8">${e.cue}</p>
      </div>

      <div class="hud top-right" id="rep-hud"${isIdle?' style="display:none"':''}>
        <div class="repnum" id="rep">${state.repCount}</div>
        <p class="tiny" id="rep-label">/ ${e.reps}</p>
        <p class="tiny" id="rep-debug" style="margin-top:6px;font-family:ui-monospace,monospace;opacity:.75">${state.debug||''}</p>
      </div>

      <div class="poke-chip" style="font-size:28px;background:rgba(255,255,233,.9)">🏋️</div>

      <div class="hud ${state.mode==='meta'?'mid-left':'bottom'}">
        <strong id="status">${statusTxt}</strong>
        <p class="tiny" id="cue" style="margin-top:5px">${cueTxt}</p>
      </div>

      ${state.mode==='meta'?`
        <div class="hud mid-right">
          <strong>Hands-free log</strong>
          <p class="tiny">Sets and reps log automatically.</p>
        </div>
      `:''}

      <div class="camera-actions">
        <button class="btn ghost" onclick="backToLog()">Back</button>
        <button class="btn primary" id="ar-main-btn" onclick="${isIdle?'startCounting()':'manualCompleteSet()'}">${isIdle?'Start set':'Mark complete'}</button>
      </div>

      ${!state.stream?permission():''}
      ${state.arPhase==='resting'?restOverlay(e):''}
    </section>
  `;

  if(state.stream)attachExistingStream();
}

function permission(){
  return `
    <div class="permission" id="perm">
      <div class="sheet" style="text-align:center">
        <h2>Start camera once.</h2>
        <p class="lead">After permission, Nudge keeps the camera running as exercises switch. No repeated start-camera prompts.</p>
        <button class="btn primary" style="margin-top:18px" onclick="startCamera()">Start camera</button>
        <button class="btn ghost" style="width:100%;margin-top:10px" onclick="backToLog()">Use normal log</button>
      </div>
    </div>
  `;
}


window.backToLog=()=>{stopCamera();state.arPhase='idle';state.screen='log';render();};
window.manualCompleteSet=()=>completeSet();


function completeSet(){
  if(state.arPhase!=='counting')return;
  let e=state.activeWorkout.exercises[state.exIndex];
  state.setDone[e.id+'-'+state.setIndex]=true;
  state.totalARReps+=e.reps;
  state.arPhase='idle';

  const moreSetsSameEx=state.setIndex<e.sets-1;
  const moreExercises=state.exIndex<state.activeWorkout.exercises.length-1;

  if(moreSetsSameEx){
    startRest(()=>{
      state.setIndex++;
      resetDetection();
      state.arPhase='counting';
      state.status='Counting reps — go.';
      state.cue=state.activeWorkout.exercises[state.exIndex].cue;
      render();
    });
  }else if(moreExercises){
    startRest(()=>{
      state.exIndex++;
      state.setIndex=0;
      resetDetection();
      state.arPhase='counting';
      state.status='Counting reps — go.';
      state.cue=state.activeWorkout.exercises[state.exIndex].cue;
      render();
    });
  }else{
    finishWorkout();
  }
}

function startRest(onDone){
  let e=state.activeWorkout.exercises[state.exIndex];
  state.arPhase='resting';
  state.restRemaining=e.rest||60;
  state.restOnDone=onDone;
  render();
  state.restInterval=setInterval(()=>{
    state.restRemaining--;
    const el=document.getElementById('rest-timer');
    if(el){
      const m=Math.floor(state.restRemaining/60),s=state.restRemaining%60;
      el.textContent=`${m}:${s.toString().padStart(2,'0')}`;
    }
    if(state.restRemaining<=0){
      clearInterval(state.restInterval);
      state.restInterval=null;
      const fn=state.restOnDone;
      state.restOnDone=null;
      if(fn)fn();
    }
  },1000);
}

window.skipRest=()=>{
  if(state.restInterval){clearInterval(state.restInterval);state.restInterval=null;}
  const fn=state.restOnDone;
  state.restOnDone=null;
  if(fn)fn();
};

function resetDetection(){
  state.repCount=0;
  state.repPhase='down';
  state.signalEMA=null;
  state.phaseFrames=0;
  state.repArmed=false;
  state.lastRepTime=performance.now()+500;
  state.repMin=Infinity;
  state.repMax=-Infinity;
  state.debug='';
}

window.startCounting=()=>{
  state.arPhase='counting';
  resetDetection();
  const e=state.activeWorkout.exercises[state.exIndex];
  const repHud=document.getElementById('rep-hud');
  if(repHud)repHud.style.display='';
  const startBtn=document.getElementById('ar-main-btn');
  if(startBtn){startBtn.textContent='Mark complete';startBtn.onclick=()=>manualCompleteSet();}
  state.status='Counting reps — go.';
  state.cue=e.cue;
  updateHud();
};

async function startCamera(){
  try{
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
      state.status='Camera unavailable';
      state.cue='Your browser does not support camera access here. Use Chrome/Safari with HTTPS.';
      updateHud();
      return;
    }

    if(!state.stream){
      state.stream=await navigator.mediaDevices.getUserMedia({
        video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},
        audio:false
      });
    }

    if(!state.detector){
      let vision=await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      state.detector=await PoseLandmarker.createFromOptions(vision,{
        baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task'},
        runningMode:'VIDEO',
        numPoses:1
      });
    }

    const perm=document.querySelector('.permission');
    if(perm)perm.remove();
    attachExistingStream();
  }catch(err){
    console.error(err);
    state.status='Camera blocked';
    state.cue='Allow camera access in the browser, then reload.';
    updateHud();
  }
}

function attachExistingStream(){
  const v=document.getElementById('video');
  const c=document.getElementById('canvas');
  if(!v||!c||!state.stream)return;
  v.srcObject=state.stream;
  if(v.readyState>=2){
    c.width=v.videoWidth||1280;c.height=v.videoHeight||720;
    loop();
  }else{
    v.onloadedmetadata=()=>{c.width=v.videoWidth||1280;c.height=v.videoHeight||720;v.play();loop();};
  }
}

function stopCamera(){
  if(state.anim){cancelAnimationFrame(state.anim);state.anim=null;}
  if(state.stream){state.stream.getTracks().forEach(t=>t.stop());state.stream=null;}
  if(state.restInterval){clearInterval(state.restInterval);state.restInterval=null;}
  state.restOnDone=null;
  state.lastVideo=-1;
}

function loop(){
  if(state.anim){cancelAnimationFrame(state.anim);state.anim=null;}
  let v=document.getElementById('video');
  let c=document.getElementById('canvas');
  if(!v||!c||!state.detector||!state.stream)return;
  let ctx=c.getContext('2d');
  let du=new DrawingUtils(ctx);

  function pred(){
    if(!v||!c||!state.stream)return;
    if(v.readyState>=2&&v.currentTime!==state.lastVideo){
      state.lastVideo=v.currentTime;
      c.width=v.videoWidth||1280;
      c.height=v.videoHeight||720;
      let res=state.detector.detectForVideo(v,performance.now());
      ctx.clearRect(0,0,c.width,c.height);
      if(res.landmarks&&res.landmarks[0]){
        du.drawConnectors(res.landmarks[0],PoseLandmarker.POSE_CONNECTIONS,{color:'rgba(101,199,131,.85)',lineWidth:4});
        du.drawLandmarks(res.landmarks[0],{color:'#ffffe9',radius:4});
        if(state.arPhase==='counting')analyze(res.landmarks[0]);
      }else{
        state.status='Step into frame';
        state.cue='Keep the movement visible.';
        updateHud();
      }
    }
    state.anim=requestAnimationFrame(pred);
  }
  pred();
}

function analyze(lm){
  let e=state.activeWorkout.exercises[state.exIndex];
  let L={sh:lm[11],el:lm[13],wr:lm[15],hip:lm[23],kn:lm[25],ank:lm[27]};
  let R={sh:lm[12],el:lm[14],wr:lm[16],hip:lm[24],kn:lm[26],ank:lm[28]};

  let visible=[L.sh,R.sh,L.el,R.el,L.wr,R.wr].every(x=>x&&x.visibility>.35);
  if(!visible){state.status='Step into frame';state.cue='Keep shoulders, elbows and wrists visible.';updateHud();return;}

  let rep=false,stat='Good path',cue='Move smoothly.';

  if(e.type==='press'){
    let wy=(L.wr.y+R.wr.y)/2,sy=(L.sh.y+R.sh.y)/2;
    let ang=(angle(L.sh,L.el,L.wr)+angle(R.sh,R.el,R.wr))/2;
    if(state.repPhase==='down'&&wy<sy-.08&&ang>140)state.repPhase='up';
    if(state.repPhase==='up'&&wy>sy-.005&&ang<130){rep=true;state.repPhase='down';}
    cue=Math.abs(L.wr.y-R.wr.y)>.075?'Press both hands evenly.':'Lower under control. Shoulders down.';
    stat=Math.abs(L.wr.y-R.wr.y)>.075?'Uneven press':'Good press';
  }
  else if(e.type==='raise'){
    let wy=(L.wr.y+R.wr.y)/2,sy=(L.sh.y+R.sh.y)/2;
    if(state.repPhase==='down'&&wy<sy+.03)state.repPhase='up';
    if(state.repPhase==='up'&&wy>sy+.18){rep=true;state.repPhase='down';}
    cue=wy<sy-.06?'Stop at shoulder height.':'Soft elbows. Raise slowly, lower slower.';
    stat=wy<sy-.06?'Too high':'Controlled raise';
  }
  else if(e.type==='squat'){
    let full=[L.hip,R.hip,L.kn,R.kn,L.ank,R.ank].every(x=>x&&x.visibility>.25);
    if(!full){state.status='Need full body';state.cue='Squats need hips, knees and ankles visible.';updateHud();return;}
    let hip=(L.hip.y+R.hip.y)/2,kn=(L.kn.y+R.kn.y)/2;
    if(state.repPhase==='down'&&hip>kn-.02)state.repPhase='bottom';
    if(state.repPhase==='bottom'&&hip<kn-.16){rep=true;state.repPhase='down';}
    cue=state.repPhase==='bottom'?'Good depth — drive through your heels.':'Reach depth. Knees track forward.';
    stat=state.repPhase==='bottom'?'Depth reached':'Squat tracking';
  }
  else{
    let elbow=(angle(L.sh,L.el,L.wr)+angle(R.sh,R.el,R.wr))/2;
    if(state.repPhase==='down'&&elbow<95)state.repPhase='pull';
    if(state.repPhase==='pull'&&elbow>140){rep=true;state.repPhase='down';}
    cue=e.type==='row'?'Pull elbows back past your torso. Squeeze blades.':'Smooth press. Shoulders down.';
    stat=e.type==='row'?'Row path':'Chest press path';
  }

  if(rep){state.repCount++;if(state.repCount>=e.reps){completeSet();return;}}
  state.status=stat;
  state.cue=cue;
  updateHud();
}

function angle(a,b,c){
  let ab={x:a.x-b.x,y:a.y-b.y},cb={x:c.x-b.x,y:c.y-b.y};
  let dot=ab.x*cb.x+ab.y*cb.y;
  let mag=Math.hypot(ab.x,ab.y)*Math.hypot(cb.x,cb.y);
  return Math.acos(Math.max(-1,Math.min(1,dot/mag)))*180/Math.PI;
}

function updateHud(){
  const r=document.getElementById('rep');
  const s=document.getElementById('status');
  const c=document.getElementById('cue');
  const rl=document.getElementById('rep-label');
  const dbg=document.getElementById('rep-debug');
  const e=state.activeWorkout?.exercises[state.exIndex];
  if(r) r.textContent=state.repCount;
  if(rl) rl.textContent='/'+(e?.reps||'');
  if(s&&s.textContent!==state.status) s.textContent=state.status;
  if(c&&c.textContent!==state.cue)    c.textContent=state.cue;
  if(dbg&&dbg.textContent!==(state.debug||'')) dbg.textContent=state.debug||'';
}

window.startCamera=startCamera;

function finishWorkout(){
  stopCamera();
  let sets=Object.values(state.setDone).filter(Boolean).length;
  state.history.unshift({
    name:state.activeWorkout?.name||'Full Body Beginner',
    date:'Today',
    sets,
    mode:state.mode==='meta'?'Meta glasses':'Phone / manual'
  });
  state.screen='summary';
  render();
}

window.finishWorkout=finishWorkout;

/* ── Summary ─────────────────────────────────────────────── */
function summary(){
  resetShell();
  let sets=state.history[0]?.sets||0;

  root.innerHTML=`
    <section class="screen">
      <div class="hero" style="min-height:180px;justify-content:center;display:flex;flex-direction:column;gap:8px">
        <span style="font-size:40px">🎉</span>
        <h2 style="color:var(--color-parchment);font-size:28px;margin-top:4px">Workout complete${state.userName?', '+state.userName:''}!</h2>
        <p style="color:rgba(255,255,233,.7)">Great session. Your progress has been logged.</p>
      </div>

      <div class="metric-row">
        <div class="metric"><strong>${sets}</strong><span>sets</span></div>
        <div class="metric"><strong>${state.totalARReps}</strong><span>AR reps</span></div>
        <div class="metric"><strong>+28</strong><span>XP</span></div>
      </div>

      <div class="card pad" style="margin-top:14px">
        <h3>Session recap</h3>
        <p class="lead">Set summaries captured exercise by exercise. Next time, repeat the same routine and aim for better form consistency.</p>
        <button class="btn primary" style="margin-top:16px" onclick="go('home')">Return home</button>
        <button class="btn ghost" style="width:100%;margin-top:10px" onclick="go('learn')">Review exercise guides</button>
      </div>
    </section>
  `;
}

/* ── Coach ───────────────────────────────────────────────── */
function coach(){
  resetShell();
  let sets=state.history.reduce((a,h)=>a+h.sets,0);
  let history=state.history;

  root.innerHTML=`
    <section class="screen">
      <div class="top">
        <div>
          <div class="eyebrow" style="margin-bottom:6px">Coach</div>
          <h2>Beginner analytics.</h2>
        </div>
        <span class="badge green">90d</span>
      </div>

      <div class="coach-grid">
        <div class="metric"><strong>${sets}</strong><span>Total sets</span></div>
        <div class="metric"><strong>${state.totalARReps}</strong><span>AR reps</span></div>
        <div class="metric"><strong>${history.length}</strong><span>Active days</span></div>
      </div>

      <div class="card pad" style="margin-top:14px">
        <h3>Training signal</h3>
        <p class="lead">Nudge tracks what matters for a beginner: sessions completed, exercises learned, form cues corrected, and repeatable workouts saved.</p>
      </div>

      <div class="card pad" style="margin-top:14px">
        <div class="top" style="margin-bottom:8px">
          <div>
            <h3>Previous workouts</h3>
            <p class="tiny" style="margin-top:4px">Your saved session history.</p>
          </div>
          <span class="badge">${history.length} logs</span>
        </div>

        ${history.length?history.map(h=>`
          <div class="row">
            <div>
              <strong>${h.name}</strong>
              <p class="tiny">${h.date} · ${h.mode}</p>
            </div>
            <span class="badge">${h.sets} sets</span>
          </div>
        `).join(''):`
          <div class="row">
            <div>
              <strong>No workouts yet</strong>
              <p class="tiny">Finish your first session and it will appear here.</p>
            </div>
            <button class="btn ghost small" onclick="go('home')">Start</button>
          </div>
        `}
      </div>

      <div class="chart" style="margin-top:14px">
        <h3>Volume over time</h3>
        <p class="tiny">Sets per session.</p>
        <div class="bars">
          ${[35,60,42,72,56,85].map(h=>`<span class="bar" style="height:${h}px"></span>`).join('')}
        </div>
      </div>

      <div class="card pad" style="margin-top:14px">
        <h3>Activity</h3>
        <div class="heat">
          ${Array.from({length:28}).map((_,i)=>`<span class="day ${[1,4,8,10,14,17,21,24].includes(i)?'on':''}"></span>`).join('')}
        </div>
      </div>
    </section>
  `;
}

/* ── Strategy ────────────────────────────────────────────── */
function strategy(){
  resetShell();
  root.innerHTML=`
    <section class="screen">
      <button class="btn ghost small" onclick="go('home')">← Back</button>
      <div style="margin-top:18px">
        <div class="eyebrow">Strategy</div>
        <h1>Everything EpicGains does, rebuilt around beginners.</h1>
        <p class="lead">V1 shows the full loop: onboard, companion, saved workout, add exercises, CSV import, normal logging, AR phone/glasses mode, automatic set/exercise summaries, workout summary, and coach analytics.</p>
      </div>
      <div class="card pad" style="margin-top:16px">
        <h3>Backbone copied structurally, not visually</h3>
        <p class="lead">Routines, exercise library, favorites/custom workouts, set logging, automatic rest/set flow, summaries, analytics, social/comparison roadmap, and import are represented.</p>
      </div>
      <div class="card pad" style="margin-top:14px">
        <h3>What changes</h3>
        <p class="lead">EpicGains rewards after logging. Nudge coaches during the workout and logs automatically when Meta glasses are active.</p>
      </div>
    </section>
  `;
}

/* ── Router ──────────────────────────────────────────────── */
function render(){
  if(state.screen==='splash'){setNav('');splash();}
  else if(state.screen==='signup'){setNav('');signup();}
  else if(state.screen==='onboard1'){setNav('');onboard1();}
  else if(state.screen==='onboard2'){setNav('');onboard2();}
  else if(state.screen==='onboard3'){setNav('');onboard3();}
  else if(state.screen==='home'){setNav('home');home();}
  else if(state.screen==='workouts'){setNav('workouts');workouts();}
  else if(state.screen==='learn'){setNav('learn');learn();}
  else if(state.screen==='log'){setNav('workouts');log();}
  else if(state.screen==='ar'){setNav('');ar();}
  else if(state.screen==='summary'){setNav('home');summary();}
  else if(state.screen==='coach'){setNav('coach');coach();}
  else if(state.screen==='strategy'){setNav('');strategy();}
  else{setNav('home');home();}
}

render();
