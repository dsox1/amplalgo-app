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
      <div class="card-corners"><span>${card?.suit || '★'}</span><span>JOKER</span></div>
    </div>`;
  }
  const isRed = card.suit === '♥' || card.suit === '♦';
  const suitClass = isRed ? 'red' : 'black';
  let centerIcon = card.suit;
  if (card.rank === 'K') centerIcon = '♛';
  if (card.rank === 'Q') centerIcon = '♕';
  if (card.rank === 'J') centerIcon = '🛡';
  return `<div class="card-face">
    <div class="card-corners ${suitClass}">
      <span>${card.rank}</span><span>${card.suit}</span>
    </div>
    <div class="card-icon ${suitClass}">
      <span>${centerIcon}</span>
    </div>
    <div class="card-corners ${suitClass}">
      <span>${card.suit}</span><span>${card.rank}</span>
    </div>
  </div>`;
}

// ------------------ SELECTION ------------------
function toggleSelect(idx){
  if(game.current!=='player'||game.gameOver)return;
  if(selected.has(idx)) selected.delete(idx); else selected.add(idx);
  renderHands(); updateControls();
}
function clearSelection(){ selected.clear(); renderHands(); updateControls(); }
function updateControls(){
  UI.btnPlaySelected.disabled = selected.size===0 || game.current!=='player';
  UI.btnLastCard.disabled = game.gameOver;
}

// ------------------ JOKER ------------------
function promptJokerSelection(){
  const input = prompt("Transform your Joker:\nFormat: [RANK][SUIT] e.g. AS, 10H, KC");
  if(!input) return null;
  const clean=input.trim().toUpperCase();
  let rank,suitChar;
  if(clean.length===2){ rank=clean[0]; suitChar=clean[1]; }
  else if(clean.length===3 && clean.startsWith('10')){ rank='10'; suitChar=clean[2]; }
  else { setStatus("Invalid format."); return null; }
  if(!ranks.includes(rank)){ setStatus("Invalid rank."); return null; }
  const suitMap={S:'♠',H:'♥',D:'♦',C:'♣'};
  const suit=suitMap[suitChar]; if(!suit){ setStatus("Invalid suit."); return null; }
  return {rank,suit};
}

// ------------------ PLAY LOGIC ------------------
function playSelectedCards(){
  if(game.current!=='player'||selected.size===0||game.gameOver)return;
  const top=game.discard[game.discard.length-1];
  const indices=[...selected]; const cards=indices.map(i=>game.player[i]);

  // Cover rules
  if(game.mustCoverQueen){
    if(!cards.some(c=>isPlayable(c,top))){ setStatus("You must cover your Queen."); return; }
    game.mustCoverQueen=false;
  }
  if(game.mustCoverKing){
    if(!cards.some(c=>isPlayable(c,top))){ setStatus("You must cover your King."); return; }
    game.mustCoverKing=false;
  }

  // Runs
  if(cards.length>1 && isValidRun(cards)){
    indices.sort((a,b)=>b-a).forEach(i=>game.player.splice(i,1));
    cards.forEach(c=>game.discard.push(c));
    game.lastPlayedCard=cards[cards.length-1]; game.lastPlayedBy='player';
    selected.clear(); setStatus("You played a run.");
    applyCoverRules(game.lastPlayedCard); renderAll();
    if(game.player.length===0){ setStatus("You win!"); game.gameOver=true; return; }
    game.current=getNextPlayer('player');
    setTimeout(()=>{ if(game.current!=='player') aiTakeTurn(); },1000);
    return;
  }

  // Single card
  const playable=cards.find(c=>isPlayable(c,top));
  if(!playable){ setStatus("Selected cards can't be played."); return; }
  const idx=game.player.indexOf(playable); game.player.splice(idx,1); selected.clear();
  if(playable.joker){
    const choice=promptJokerSelection();
    if(!choice){ game.player.splice(idx,0,playable); renderAll(); return; }
    game.discard.push({rank:choice.rank,suit:choice.suit,joker:true});
    game.lastPlayedCard={rank:choice.rank,suit:choice.suit,joker:true};
  } else {
    game.discard.push(playable); game.lastPlayedCard=playable;
  }
  game.lastPlayedBy='player'; applyCoverRules(game.lastPlayedCard); renderAll();
  if(game.player.length===0){ setStatus("You win!"); game.gameOver=true; return; }
  game.current=getNextPlayer('player');
  setTimeout(()=>{ if(game.current!=='player') aiTakeTurn(); },1000);
}

// ------------------ TURN FLOW ------------------
function getNextPlayer(current){
  const order=['player','aiRight','aiTop','aiLeft'];
  const idx=order.indexOf(current);
  return order[(idx+game.direction+order.length)%order.length];
}

function drawCard(){
  if(game.deck.length===0||game.current!=='player'||game.gameOver)return;
  const card=game.deck.pop(); game.player.push(card);
  renderAll(); setStatus(`You drew ${card.rank}${card.suit}`);
}

// ------------------ AI TURN (simplified placeholder) ------------------
function aiTakeTurn(){
  if(game.current==='player'||game.gameOver)return;
  const hand = game[game.current];
  const top=game.discard[game.discard.length-1];
  const playable=hand.find(c=>isPlayable(c,top));
  if(playable){
    hand.splice(hand.indexOf(playable),1);
    game.discard.push(playable); game.lastPlayedCard=playable; game.lastPlayedBy='ai';
    setStatus(`AI played ${playable.rank}${playable.suit}`);
    applyCoverRules(playable);
  } else if(game.deck.length>0){
    hand.push(game.deck.pop()); setStatus("AI drew a card.");
  } else { setStatus("AI skipped."); }
  renderAll();
  if(hand.length===0){ setStatus("AI wins!"); game.gameOver=true; return; }
  game.current=getNextPlayer(game.current);
  if(game.current!=='player') setTimeout(aiTakeTurn,1000);
  else setStatus("Your turn!");
}

// ------------------ DECK & START ------------------
function createDeck(){
  const deck=[]; const copies=settings.doubleDeck?2:1;
  for(let c=0;c<copies;c++){
    for(const s of suits){ for(const r of ranks){ deck.push({rank:r,suit:s,joker:false}); } }
    if(settings.jokerEnabled){ deck.push({rank:'JOKER',suit:'★',joker:true}); deck.push({rank:'JOKER',suit:'☆',joker:true}); }
  }
  for(let i=deck.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
  return deck;
}

function startGame(){
  Object.assign(game,{deck:createDeck(),discard:[],player:[],aiTop:[],aiLeft:[],aiRight:[],
    current:'player',direction:1,gameOver:false,lastPlayedCard:null,lastPlayedBy:null,
    mustCoverQueen:false,mustCoverKing:false});
  selected.clear(); UI.eventLog.innerHTML='';
  for(let i=0;i<settings.startingHand;i++){ game.player.push(game.deck.pop()); game.aiTop.push(game.deck.pop()); game.aiLeft.push(game.deck.pop()); game.aiRight.push(game.deck.pop()); }
  let top; do{ top=game.deck.pop(); }while(top&&top.joker); game.discard.push(top||game.deck.pop());
  renderAll(); setStatus("Your turn!");
}

// ------------------ RULES & LOG TOGGLE ------------------
function toggleRulesPanel(){ UI.rulesPanel.style.display = UI.rulesPanel.style.display==='block'?'none':'block'; }
function toggleLogPanel(){ UI.logContent.style.display = UI.logContent.style.display==='block'?'none':'block'; }

// ------------------ INIT ------------------
document.addEventListener('DOMContentLoaded',()=>{
  UI.btnPlay.addEventListener('click',startGame);
  UI.btnPlaySelected.addEventListener('click',playSelectedCards);
  UI.btnClear.addEventListener('click',clearSelection);
  UI.btnDraw.addEventListener('click',drawCard);
  UI.btnLastCard.addEventListener('click',()=>{ setStatus("You declared Last Card!"); });
  UI.deckCard.addEventListener('click',drawCard);
  UI.btnRules.addEventListener('click',toggleRulesPanel);
  UI.logHeader.addEventListener('click',toggleLogPanel);
});

