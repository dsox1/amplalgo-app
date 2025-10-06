console.log("🎮 Backyard BlackJack - Corrected Build");

// ------------------ CONSTANTS ------------------
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const rankValues = {A:1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,J:11,Q:12,K:13};

// ------------------ UI HOOKS ------------------
const UI = {
  deckCard: document.getElementById('deck-card'),
  discardCard: document.getElementById('discard-card'),
  deckCount: document.getElementById('deck-count'),
  playerHand: document.getElementById('player-hand'),
  aiTopHand: document.getElementById('ai-hand-top'),
  aiLeftHand: document.getElementById('ai-hand-left'),
  aiRightHand: document.getElementById('ai-hand-right'),
  aiTopCount: document.getElementById('ai-top-count'),
  aiLeftCount: document.getElementById('ai-left-count'),
  aiRightCount: document.getElementById('ai-right-count'),
  playerCount: document.getElementById('player-count'),
  status: document.getElementById('status'),
  eventLog: document.getElementById('event-log'),
  btnPlaySelected: document.getElementById('btn-play-selected'),
  btnClear: document.getElementById('btn-clear'),
  btnDraw: document.getElementById('btn-draw'),
  btnLastCard: document.getElementById('btn-last-card'),
  btnPlay: document.getElementById('btn-play'),
  btnRules: document.getElementById('btn-rules'),
  rulesPanel: document.getElementById('rules-panel'),
  logHeader: document.getElementById('log-header'),
  logContent: document.getElementById('log-content')
};

// ------------------ GAME STATE ------------------
const settings = { startingHand:7, jokerEnabled:true, doubleDeck:false };

const game = {
  deck:[], discard:[],
  player:[], aiTop:[], aiLeft:[], aiRight:[],
  current:'player', direction:1, gameOver:false,
  lastPlayedCard:null, lastPlayedBy:null,
  mustCoverQueen:false, mustCoverKing:false,
  eventCounter:0
};

let selected = new Set();

// ------------------ UTILITIES ------------------
function setStatus(text){ if(UI.status) UI.status.textContent=text; }

function logEvent(message,type='info'){
  game.eventCounter++;
  const timestamp=new Date().toLocaleTimeString();
  const logElement=document.createElement('div');
  logElement.className=`log-entry ${type}`;
  logElement.innerHTML=`
    <span class="log-id">#${game.eventCounter}</span>
    <span class="log-time">${timestamp}</span>
    <span class="log-message">${message}</span>`;
  UI.eventLog.insertBefore(logElement,UI.eventLog.firstChild);
  while(UI.eventLog.children.length>50) UI.eventLog.removeChild(UI.eventLog.lastChild);
}

function countActivePlayers(){
  let c=0;
  if(game.player.length>0)c++;
  if(game.aiTop.length>0)c++;
  if(game.aiLeft.length>0)c++;
  if(game.aiRight.length>0)c++;
  return c;
}

function isPlayable(card,top){
  if(!card||!top)return false;
  if(card.joker)return true;
  if(top.joker)return card.suit===top.suit;
  return card.rank===top.rank||card.suit===top.suit;
}

function isValidRun(cards){
  if(cards.length<2)return false;
  const allSameSuit=cards.every(c=>c.suit===cards[0].suit);
  const allSameRank=cards.every(c=>c.rank===cards[0].rank);
  if(allSameSuit){
    const sorted=[...cards].sort((a,b)=>rankValues[a.rank]-rankValues[b.rank]);
    for(let i=1;i<sorted.length;i++){
      if(rankValues[sorted[i].rank]!==rankValues[sorted[i-1].rank]+1) return false;
    }
    return true;
  }
  if(allSameRank)return true;
  const grouped={};
  for(const c of cards){ if(!grouped[c.rank]) grouped[c.rank]=[]; grouped[c.rank].push(c);}
  const ranksInOrder=Object.keys(grouped).map(r=>rankValues[r]).sort((a,b)=>a-b);
  for(let i=1;i<ranksInOrder.length;i++){
    if(ranksInOrder[i]!==ranksInOrder[i-1]+1)return false;
  }
  return true;
}

function applyCoverRules(card){
  if(card.rank==='Q'){ game.mustCoverQueen=true; setStatus("You must cover your Queen."); }
  if(card.rank==='K' && countActivePlayers()===2){
    game.mustCoverKing=true;
    game.current=game.lastPlayedBy;
    setStatus("You must cover your King.");
  }
}

// ------------------ RENDERING ------------------
function renderAll(){ renderCenterStacks(); renderHands(); renderCounts(); updateControls(); }

function renderCenterStacks(){
  UI.deckCount.textContent=game.deck.length;
  UI.deckCard.textContent='🂠';
  const top=game.discard[game.discard.length-1];
  UI.discardCard.innerHTML=cardHTML(top);
}

function renderCounts(){
  UI.playerCount.textContent=game.player.length;
  UI.aiTopCount.textContent=game.aiTop.length;
  UI.aiLeftCount.textContent=game.aiLeft.length;
  UI.aiRightCount.textContent=game.aiRight.length;
}

function calculateCardScale(n){ if(n<=7)return 1; if(n<=10)return .85; if(n<=13)return .7; return .6; }
function calculateCardSpacing(n){ if(n<=7)return 0; if(n<=10)return -10; if(n<=13)return -20; return -30; }

function renderHands(){
  // Player
  UI.playerHand.innerHTML='';
  const scale=calculateCardScale(game.player.length);
  const spacing=calculateCardSpacing(game.player.length);
  game.player.forEach((card,idx)=>{
    const el=document.createElement('div');
    el.className='card selectable';
    if(selected.has(idx)) el.classList.add('selected');
    el.innerHTML=cardHTML(card);
    el.style.transform=`scale(${scale})`;
    el.style.marginLeft=idx>0?`${spacing}px`:'0';
    el.addEventListener('click',()=>toggleSelect(idx));
    UI.playerHand.appendChild(el);
  });

  // AI Top (fanned)
  UI.aiTopHand.innerHTML='';
  const aiScale=calculateCardScale(game.aiTop.length);
  const angleStep=Math.min(10,60/Math.max(1,game.aiTop.length-1));
  const startAngle=-((game.aiTop.length-1)*angleStep)/2;
  game.aiTop.forEach((c,i)=>{
    const el=document.createElement('div');
    el.className='card back';
    el.textContent='🂠';
    const angle=startAngle+i*angleStep;
    el.style.transform=`rotate(${angle}deg) scale(${aiScale})`;
    UI.aiTopHand.appendChild(el);
  });

  // AI Left
  UI.aiLeftHand.innerHTML='';
  const leftScale=calculateCardScale(game.aiLeft.length);
  game.aiLeft.forEach((c,i)=>{
    const el=document.createElement('div');
    el.className='card back'; el.textContent='🂠';
    el.style.transform=`scale(${leftScale})`;
    el.style.marginTop=i>0?`${calculateCardSpacing(game.aiLeft.length)}px`:'0';
    UI.aiLeftHand.appendChild(el);
  });

  // AI Right
  UI.aiRightHand.innerHTML='';
  const rightScale=calculateCardScale(game.aiRight.length);
  game.aiRight.forEach((c,i)=>{
    const el=document.createElement('div');
    el.className='card back'; el.textContent='🂠';
    el.style.transform=`scale(${rightScale})`;
    el.style.marginTop=i>0?`${calculateCardSpacing(game.aiRight.length)}px`:'0';
    UI.aiRightHand.appendChild(el);
  });
}

function cardHTML(card){
  if(!card||card.joker){
    return `<div class="card-face">
      <div class="card-corners"><span>JOKER</span><span>${card?.suit||'★'}</span></div>
      <div class="card-icon"><span class="black">${card?.suit||'★'}</span></div>
      <div class="card-corners"><span>${card?.suit||
