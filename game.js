console.log("🎮 Backyard BlackJack - Fixed Build v2.0");

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const rankValues = {A:1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,J:11,Q:12,K:13};

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
  logContent: document.getElementById('log-content'),
  directionArrow: document.getElementById('direction-arrow')
};

const settings = { startingHand:7, jokerEnabled:true, doubleDeck:false };

const game = {
  deck:[], discard:[],
  player:[], aiTop:[], aiLeft:[], aiRight:[],
  current:'player', direction:1, gameOver:false,
  lastPlayedCard:null, lastPlayedBy:null,
  mustCoverQueen:null, mustCoverKing:null,
  waitingForCover: false, // NEW: tracks if we're waiting for immediate cover
  eventCounter:0,
  skipTurns: {},
  pendingPenalty: {},
  penaltyTarget: null
};

let selected = new Set();

// ------------------ STATUS & LOG ------------------
function setStatus(text) {
  if (!UI.status) return;
  const entry = document.createElement('div');
  entry.className = 'status-entry';
  entry.textContent = text;
  UI.status.insertBefore(entry, UI.status.firstChild);
  while (UI.status.children.length > 2) {
    UI.status.removeChild(UI.status.lastChild);
  }
}

function updateDirectionArrow() {
  if (!UI.directionArrow) return;
  if (game.direction === 1) {
    UI.directionArrow.innerHTML = '➡️ Clockwise';
    UI.directionArrow.style.color = '#4ade80';
  } else {
    UI.directionArrow.innerHTML = '⬅️ Counter-Clockwise';
    UI.directionArrow.style.color = '#fb923c';
  }
}

function startPlayerTurn() {
  // Check if player is waiting to cover their own Queen/King
  if (game.waitingForCover && (game.mustCoverQueen === 'player' || game.mustCoverKing === 'player')) {
    setStatus("You MUST cover your " + (game.mustCoverQueen === 'player' ? "Queen" : "King") + " now!");
    updateControls();
    return;
  }

  if (game.skipTurns['player'] > 0) {
    const skips = game.skipTurns['player'];
    game.skipTurns['player'] = 0;
    setStatus(`You skip ${skips} turn(s).`);
    logEvent(`Player skipped ${skips} turn(s).`, "power");
    game.current = getNextPlayer('player');
    setTimeout(aiTakeTurn, 1000);
    return;
  }

  setStatus("Your turn! Match suit or rank, play runs, or use power cards.");
  updateControls();
}

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
  console.log("📋 Log:", message);
}

function toggleRulesPanel(){
  UI.rulesPanel.style.display = UI.rulesPanel.style.display==='block'?'none':'block';
}
function toggleLogPanel(){
  UI.logContent.style.display = UI.logContent.style.display==='block'?'none':'block';
}

// ------------------ HELPERS ------------------
function countActivePlayers(){
  let c=0;
  if(game.player.length>0)c++;
  if(game.aiTop.length>0)c++;
  if(game.aiLeft.length>0)c++;
  if(game.aiRight.length>0)c++;
  return c;
}

function isPlayable(card, top) {
  if (!card || !top) return false;
  if (card.rank === 'A') return true;
  if (card.joker) return true;
  if (top.jokerDeclared) {
    return card.rank === top.rank || card.suit === top.suit;
  }
  return card.rank === top.rank || card.suit === top.suit;
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

function applyCoverRules(card, playerName) {
  const next = getNextPlayer(playerName);
  
  // 🔄 King reverses direction IMMEDIATELY
  if (card.rank === 'K') {
    game.direction *= -1;
    updateDirectionArrow();
    setStatus(`${playerName} played King - direction reversed!`);
    logEvent(`${playerName} played King - direction reversed`, "power");
    
    // King must be covered immediately (heads-up only)
    if (countActivePlayers() === 2) {
      game.mustCoverKing = playerName;
      game.waitingForCover = true;
      setStatus(`${playerName} must cover their King NOW or draw 1 card.`);
      logEvent(`${playerName} must cover King immediately`, "power");
      return; // Don't process other rules yet
    }
  }

  // 👑 Queen cover obligation
  if (card.rank === 'Q') {
    game.mustCoverQueen = playerName;
    game.waitingForCover = true;
    setStatus(`${playerName} must cover their Queen NOW or draw 1 card.`);
    logEvent(`${playerName} must cover Queen immediately`, "power");
    return; // Don't apply penalties while waiting for cover
  }

  // 🃏 2 → stack penalty (only if NOT covering)
  if (card.rank === '2' && !game.waitingForCover) {
    const target = game.penaltyTarget || next;
    if (!game.pendingPenalty[target]) game.pendingPenalty[target] = 0;
    game.pendingPenalty[target] += 2;
    game.penaltyTarget = target;
    setStatus(`${target} must draw ${game.pendingPenalty[target]} cards or stack!`);
    logEvent(`${target} has ${game.pendingPenalty[target]} card penalty`, "penalty");
  }

  // 🃏 Black Jack → stack penalty (only if NOT covering)
  if (card.rank === 'J' && (card.suit === '♠' || card.suit === '♣') && !card.jokerDeclared && !game.waitingForCover) {
    const target = game.penaltyTarget || next;
    if (!game.pendingPenalty[target]) game.pendingPenalty[target] = 0;
    game.pendingPenalty[target] += 5;
    game.penaltyTarget = target;
    setStatus(`${target} must draw ${game.pendingPenalty[target]} cards (Black Jack)!`);
    logEvent(`${target} has ${game.pendingPenalty[target]} card penalty (Black Jack)`, "penalty");
  }

  // ⭐ 8 → skip turns
  if (card.rank === '8' && !game.waitingForCover) {
    const target = game.penaltyTarget || next;
    if (!game.skipTurns[target]) game.skipTurns[target] = 0;
    game.skipTurns[target] += 1;
    game.penaltyTarget = target;
    setStatus(`${target} will miss ${game.skipTurns[target]} turn(s).`);
    logEvent(`${target} must skip ${game.skipTurns[target]} turn(s)`, "power");
  }

  // 🃏 Joker declared as Jack
  if (card.rank === 'J' && card.jokerDeclared && !game.waitingForCover) {
    const target = game.penaltyTarget || next;
    if (card.suit === '♥' || card.suit === '♦') {
      game.pendingPenalty[target] = 0;
      game.penaltyTarget = null;
      setStatus(`Penalty cancelled by Red Jack Joker!`);
      logEvent(`Penalty cancelled by Red Jack Joker`, "power");
    }
    if (card.suit === '♠' || card.suit === '♣') {
      if (!game.pendingPenalty[target]) game.pendingPenalty[target] = 0;
      game.pendingPenalty[target] += 5;
      game.penaltyTarget = target;
      setStatus(`${target} must draw ${game.pendingPenalty[target]} cards (Black Jack Joker).`);
      logEvent(`${target} has ${game.pendingPenalty[target]} cards (Black Jack Joker)`, "penalty");
    }
  }
}

// ------------------ RENDERING ------------------
function renderAll(){
  renderCenterStacks();
  renderHands();
  renderCounts();
  updateControls();
  updateDirectionArrow();
}

function renderCenterStacks(){
  UI.deckCount.textContent = game.deck.length;
  UI.deckCard.textContent = '🂠';
  const top = game.discard[game.discard.length-1];
  UI.discardCard.innerHTML = cardHTML(top);
}

function renderCounts(){
  UI.playerCount.textContent = game.player.length;
  UI.aiTopCount.textContent = game.aiTop.length;
  UI.aiLeftCount.textContent = game.aiLeft.length;
  UI.aiRightCount.textContent = game.aiRight.length;
}

function calculateCardScale(n){
  if(n<=7) return 1;
  if(n<=10) return 0.85;
  if(n<=13) return 0.7;
  return 0.6;
}
function calculateCardSpacing(n){
  if(n<=7) return 0;
  if(n<=10) return -10;
  if(n<=13) return -20;
  return -30;
}

function renderHands(){
  UI.playerHand.innerHTML = '';
  const scale = calculateCardScale(game.player.length);
  const spacing = calculateCardSpacing(game.player.length);
  game.player.forEach((card, idx)=>{
    const el = document.createElement('div');
    el.className = 'card selectable';
    if(selected.has(idx)) el.classList.add('selected');
    el.innerHTML = cardHTML(card);
    el.style.transform = `scale(${scale})`;
    el.style.marginLeft = idx>0 ? `${spacing}px` : '0';
    el.addEventListener('click', ()=>toggleSelect(idx));
    UI.playerHand.appendChild(el);
  });

  UI.aiTopHand.innerHTML = '';
  const aiScale = calculateCardScale(game.aiTop.length);
  const angleStep = Math.min(10, 60/Math.max(1, game.aiTop.length-1));
  const startAngle = -((game.aiTop.length-1)*angleStep)/2;
  game.aiTop.forEach((c,i)=>{
    const el = document.createElement('div');
    el.className = 'card back';
    el.textContent = '🂠';
    const angle = startAngle + i*angleStep;
    el.style.transform = `rotate(${angle}deg) scale(${aiScale})`;
    UI.aiTopHand.appendChild(el);
  });

  UI.aiLeftHand.innerHTML = '';
  const leftScale = calculateCardScale(game.aiLeft.length);
  game.aiLeft.forEach((c,i)=>{
    const el = document.createElement('div');
    el.className = 'card back';
    el.textContent = '🂠';
    el.style.transform = `scale(${leftScale})`;
    el.style.marginTop = i>0 ? `${calculateCardSpacing(game.aiLeft.length)}px` : '0';
    UI.aiLeftHand.appendChild(el);
  });

  UI.aiRightHand.innerHTML = '';
  const rightScale = calculateCardScale(game.aiRight.length);
  game.aiRight.forEach((c,i)=>{
    const el = document.createElement('div');
    el.className = 'card back';
    el.textContent = '🂠';
    el.style.transform = `scale(${rightScale})`;
    el.style.marginTop = i>0 ? `${calculateCardSpacing(game.aiRight.length)}px` : '0';
    UI.aiRightHand.appendChild(el);
  });
}

function cardHTML(card){
  if(!card || card.joker){
    return `<div class="card-face">
      <div class="card-corners"><span>JOKER</span><span>${card?.suit||'★'}</span></div>
      <div class="card-icon"><span class="black">${card?.suit||'★'}</span></div>
      <div class="card-corners"><span>${card?.suit||'★'}</span><span>JOKER</span></div>
    </div>`;
  }
  const isRed = card.suit==='♥' || card.suit==='♦';
  const suitClass = isRed ? 'red' : 'black';
  let centerIcon = card.suit;
  if(card.rank==='K') centerIcon = '♛';
  if(card.rank==='Q') centerIcon = '♕';
  if(card.rank==='J') centerIcon = '🛡';
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
  if(game.current!=='player' || game.gameOver) return;
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
function playSelectedCards() {
  if (game.current !== 'player' || selected.size === 0 || game.gameOver) return;

  const top = game.discard[game.discard.length - 1];
  const indices = [...selected];
  const cards = indices.map(i => game.player[i]);

  // ✅ COVER ENFORCEMENT - Player must cover their own Queen/King first
  if (game.waitingForCover && (game.mustCoverQueen === 'player' || game.mustCoverKing === 'player')) {
    const canCover = cards.some(c => isPlayable(c, top));
    
    if (!canCover) {
      if (game.deck.length === 0) reshuffleFromDiscard();
      if (game.deck.length > 0) {
        const penalty = game.deck.pop();
        game.player.push(penalty);
        const cardType = game.mustCoverQueen === 'player' ? 'Queen' : 'King';
        setStatus(`You failed to cover your ${cardType}. Drew 1 penalty card.`);
        logEvent(`Player failed to cover ${cardType} → drew 1 card`, "penalty");
      }
      game.mustCoverQueen = null;
      game.mustCoverKing = null;
      game.waitingForCover = false;
      renderAll();
      
      // Move to next player
      game.current = getNextPlayer('player');
      setTimeout(aiTakeTurn, 1000);
      return;
    }
    
    // Successfully covering - play the card
    const coverCard = cards.find(c => isPlayable(c, top));
    const idx = game.player.indexOf(coverCard);
    game.player.splice(idx, 1);
    selected.clear();

    game.discard.push(coverCard);
    game.lastPlayedCard = coverCard;
    game.lastPlayedBy = 'player';
    
    const cardType = game.mustCoverQueen === 'player' ? 'Queen' : 'King';
    setStatus(`You covered your ${cardType} with ${coverCard.rank}${coverCard.suit}`);
    logEvent(`✓ Player covered ${cardType} with ${coverCard.rank}${coverCard.suit}`, 'player-play');
    
    game.mustCoverQueen = null;
    game.mustCoverKing = null;
    game.waitingForCover = false;
    
    renderAll();
    
    if (game.player.length === 0) {
      setStatus("♔ You win!");
      logEvent("♔ Player wins", "game");
      game.gameOver = true;
      return;
    }
    
    game.current = getNextPlayer('player');
    setTimeout(aiTakeTurn, 1000);
    return;
  }

  // ✅ SKIP TURN ENFORCEMENT
  if (game.skipTurns['player'] > 0) {
    const skips = game.skipTurns['player'];
    game.skipTurns['player'] = 0;
    setStatus(`You skip ${skips} turn(s).`);
    logEvent(`Player skipped ${skips} turn(s).`, "power");
    game.current = getNextPlayer('player');
    setTimeout(aiTakeTurn, 1000);
    return;
  }

  // ✅ PENALTY ENFORCEMENT - Check if player must draw or can stack
  if (game.pendingPenalty['player'] > 0) {
    const canStack = cards.some(c => 
      (c.rank === '2' && isPlayable(c, top)) ||
      (c.rank === 'J' && (c.suit === '♠' || c.suit === '♣') && isPlayable(c, top))
    );
    
    if (!canStack) {
      const count = game.pendingPenalty['player'];
      for (let i = 0; i < count; i++) {
        if (game.deck.length === 0) reshuffleFromDiscard();
        if (game.deck.length > 0) {
          game.player.push(game.deck.pop());
        }
      }
      setStatus(`You drew ${count} penalty card(s).`);
      logEvent(`Player drew ${count} penalty card(s).`, "penalty");
      game.pendingPenalty['player'] = 0;
      game.penaltyTarget = null;
      renderAll();
      
      game.current = getNextPlayer('player');
      setTimeout(aiTakeTurn, 1000);
      return;
    }
  }

  // ✅ RUNS
  if (cards.length > 1 && isValidRun(cards)) {
    indices.sort((a,b)=>b-a).forEach(i=>game.player.splice(i,1));
    cards.forEach(c=>game.discard.push(c));
    game.lastPlayedCard = cards[cards.length-1];
    game.lastPlayedBy = 'player';
    selected.clear();
    
    const runDesc = cards.map(c=>`${c.rank}${c.suit}`).join(', ');
    setStatus(`You played a run: ${runDesc}`);
    logEvent(`● Run played: ${runDesc}`, 'player-play');
    
    applyCoverRules(game.lastPlayedCard, 'player');
    renderAll();

    // Check if waiting for cover
    if (game.waitingForCover && (game.mustCoverQueen === 'player' || game.mustCoverKing === 'player')) {
      return; // Stay on player's turn to cover
    }

    if (game.player.length === 0) {
      setStatus("♔ You win!");
      logEvent("♔ Player wins", "game");
      game.gameOver = true;
      return;
    }
    
    game.current = getNextPlayer('player');
    setTimeout(aiTakeTurn, 1000);
    return;
  }

  // ✅ SINGLE CARD
  const playable = cards.find(c => isPlayable(c, top));
  if (!playable) {
    setStatus("Selected cards can't be played.");
    logEvent("Invalid play attempt", "penalty");
    return;
  }

  const idx = game.player.indexOf(playable);
  game.player.splice(idx,1);
  selected.clear();

  if (playable.joker) {
    const choice = promptJokerSelection();
    if (!choice) {
      game.player.splice(idx, 0, playable);
      renderAll();
      return;
    }

    const declared = { 
      rank: choice.rank, 
      suit: choice.suit, 
      joker: false, 
      jokerDeclared: true 
    };

    game.discard.push(declared);
    game.lastPlayedCard = declared;
    game.lastPlayedBy = 'player';

    setStatus(`You played a Joker as ${choice.rank}${choice.suit}`);
    logEvent(`● Joker declared as ${choice.rank}${choice.suit}`, 'player-play');

    applyCoverRules(declared, 'player');
  } else {
    game.discard.push(playable);
    game.lastPlayedCard = playable;
    game.lastPlayedBy = 'player';
    setStatus(`You played ${playable.rank}${playable.suit}`);
    logEvent(`● You played ${playable.rank}${playable.suit}`, 'player-play');
    applyCoverRules(playable, 'player');
  }

  renderAll();

  // Check if waiting for cover
  if (game.waitingForCover && (game.mustCoverQueen === 'player' || game.mustCoverKing === 'player')) {
    return; // Stay on player's turn to cover
  }

  if (game.player.length === 0) {
    setStatus("♔ You win!");
    logEvent("♔ Player wins", "game");
    game.gameOver = true;
    return;
  }

  game.current = getNextPlayer('player');
  setTimeout(aiTakeTurn, 1000);
}

// ------------------ TURN FLOW ------------------
function getNextPlayer(current){
  const order=['player','aiRight','aiTop','aiLeft'];
  const idx=order.indexOf(current);
  return order[(idx+game.direction+order.length)%order.length];
}

function reshuffleFromDiscard() {
  if (game.discard.length <= 1) return;
  const topCard = game.discard.pop();
  game.deck = game.discard;
  for (let i = game.deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [game.deck[i], game.deck[j]] = [game.deck[j], game.deck[i]];
  }
  game.discard = [topCard];
  logEvent("♻ Deck reshuffled from discard pile","game");
  setStatus("Deck reshuffled");
}

function drawCard() {
  if (game.current !== 'player' || game.gameOver) return;

  // ✅ Cannot draw if waiting to cover Queen/King
  if (game.waitingForCover && (game.mustCoverQueen === 'player' || game.mustCoverKing === 'player')) {
    const cardType = game.mustCoverQueen === 'player' ? 'Queen' : 'King';
    setStatus(`You must cover your ${cardType} first! Cannot draw.`);
    return;
  }

  // ✅ Enforce pending penalties first
  if (game.pendingPenalty['player'] > 0) {
    const count = game.pendingPenalty['player'];
    for (let i = 0; i < count; i++) {
      if (game.deck.length === 0) reshuffleFromDiscard();
      if (game.deck.length > 0) {
        game.player.push(game.deck.pop());
      }
    }
    setStatus(`You drew ${count} penalty card(s).`);
    logEvent(`Player drew ${count} penalty card(s).`, "penalty");
    game.pendingPenalty['player'] = 0;
    game.penaltyTarget = null;
    renderAll();

    game.current = getNextPlayer('player');
    if (game.current !== 'player') {
      setTimeout(aiTakeTurn, 1000);
    }
    return;
  }

  // Normal draw
  if (game.deck.length === 0) {
    reshuffleFromDiscard();
    if (game.deck.length === 0) {
      setStatus("No cards left to draw!");
      logEvent("⚠ Deck empty, cannot draw","game");
      return;
    }
  }

  const card = game.deck.pop();
  game.player.push(card);
  renderAll();

  const message = `♦ You drew ${card.rank}${card.suit}`;
  setStatus(message);
  logEvent(message, 'player-action');

  game.current = getNextPlayer('player');
  if (game.current !== 'player') {
    setTimeout(aiTakeTurn, 1000);
  } else {
    startPlayerTurn();
  }
}

// ------------------ AI TURN ------------------
function aiTakeTurn() {
  if (game.current === 'player' || game.gameOver) return;

  const hand = game[game.current];
  const top = game.discard[game.discard.length - 1];

  // ✅ COVER ENFORCEMENT - AI must cover their own Queen/King
  if (game.waitingForCover && (game.mustCoverQueen === game.current || game.mustCoverKing === game.current)) {
    const coverCard = hand.find(c => isPlayable(c, top));
    
    if (!coverCard) {
      if (game.deck.length === 0) reshuffleFromDiscard();
      if (game.deck.length > 0) {
        hand.push(game.deck.pop());
        const cardType = game.mustCoverQueen === game.current ? 'Queen' : 'King';
        setStatus(`${game.current} failed to cover ${cardType} → drew 1 card.`);
        logEvent(`${game.current} failed to cover ${cardType} → drew 1 card`, "penalty");
      }
      game.mustCoverQueen = null;
      game.mustCoverKing = null;
      game.waitingForCover = false;
      renderAll();
      
      game.current = getNextPlayer(game.current);
      setTimeout(aiTakeTurn, 1000);
      return;
    }
    
    // Cover successfully
    hand.splice(hand.indexOf(coverCard), 1);
    game.discard.push(coverCard);
    game.lastPlayedCard = coverCard;
    game.lastPlayedBy = game.current;
    
    const cardType = game.mustCoverQueen === game.current ? 'Queen' : 'King';
    setStatus(`${game.current} covered their ${cardType} with ${coverCard.rank}${coverCard.suit}`);
    logEvent(`⚙ ${game.current} covered ${cardType} with ${coverCard.rank}${coverCard.suit}`, 'ai-play');
    
    game.mustCoverQueen = null;
    game.mustCoverKing = null;
    game.waitingForCover = false;
    
    renderAll();
    
    if (hand.length === 0) {
      setStatus(`♔ ${game.current} wins!`);
      logEvent(`♔ ${game.current} wins the game`, "game");
      game.gameOver = true;
      return;
    }
    
    game.current = getNextPlayer(game.current);
    setTimeout(aiTakeTurn, 1000);
    return;
  }

  // ✅ SKIP TURN ENFORCEMENT
  if (game.skipTurns[game.current] > 0) {
    const skips = game.skipTurns[game.current];
    game.skipTurns[game.current] = 0;
    setStatus(`${game.current} skips ${skips} turn(s).`);
    logEvent(`${game.current} skipped ${skips} turn(s).`, "power");
    game.current = getNextPlayer(game.current);
    setTimeout(aiTakeTurn, 1000);
    return;
  }

  // ✅ PENALTY ENFORCEMENT - Check if AI must draw or can stack
  if (game.pendingPenalty[game.current] > 0) {
    const canStack = hand.find(c => 
      ((c.rank === '2' && isPlayable(c, top)) ||
      (c.rank === 'J' && (c.suit === '♠' || c.suit === '♣') && isPlayable(c, top)))
    );

    if (!canStack) {
      const count = game.pendingPenalty[game.current];
      for (let i = 0; i < count; i++) {
        if (game.deck.length === 0) reshuffleFromDiscard();
        if (game.deck.length > 0) {
          hand.push(game.deck.pop());
        }
      }
      setStatus(`${game.current} drew ${count} penalty card(s).`);
      logEvent(`${game.current} drew ${count} penalty card(s).`, "penalty");
      game.pendingPenalty[game.current] = 0;
      game.penaltyTarget = null;
      renderAll();

      game.current = getNextPlayer(game.current);
      setTimeout(aiTakeTurn, 1000);
      return;
    }
    
    // AI will stack - play the stackable card
    hand.splice(hand.indexOf(canStack), 1);
    game.discard.push(canStack);
    game.lastPlayedCard = canStack;
    game.lastPlayedBy = game.current;
    setStatus(`${game.current} stacked with ${canStack.rank}${canStack.suit}!`);
    logEvent(`⚙ ${game.current} stacked penalty with ${canStack.rank}${canStack.suit}`, 'ai-play');
    
    // Clear AI's penalty but apply it to next player
    game.pendingPenalty[game.current] = 0;
    applyCoverRules(canStack, game.current);
    
    renderAll();
    
    if (hand.length === 0) {
      setStatus(`♔ ${game.current} wins!`);
      logEvent(`♔ ${game.current} wins the game`, "game");
      game.gameOver = true;
      return;
    }
    
    game.current = getNextPlayer(game.current);
    setTimeout(aiTakeTurn, 1000);
    return;
  }

  // ✅ NORMAL PLAY
  let playable = hand.find(c => isPlayable(c, top));

  if (playable) {
    hand.splice(hand.indexOf(playable), 1);

    if (playable.joker) {
      const suitCounts = { '♠':0, '♥':0, '♦':0, '♣':0 };
      hand.forEach(c => { if (!c.joker) suitCounts[c.suit]++; });
      const bestSuit = Object.keys(suitCounts).reduce((a,b)=> suitCounts[a]>suitCounts[b]?a:b);
      const randRank = ranks[Math.floor(Math.random() * ranks.length)];
      const declared = { rank: randRank, suit: bestSuit, joker: false, jokerDeclared: true };

      game.discard.push(declared);
      game.lastPlayedCard = declared;
      game.lastPlayedBy = game.current;
      setStatus(`${game.current} played a Joker as ${randRank}${bestSuit}`);
      logEvent(`⚙ ${game.current} declared Joker as ${randRank}${bestSuit}`, 'ai-play');
      applyCoverRules(declared, game.current);
    } else {
      game.discard.push(playable);
      game.lastPlayedCard = playable;
      game.lastPlayedBy = game.current;
      setStatus(`${game.current} played ${playable.rank}${playable.suit}`);
      logEvent(`⚙ ${game.current} played ${playable.rank}${playable.suit}`, 'ai-play');
      applyCoverRules(playable, game.current);
    }
  } else {
    // AI draws a card
    if (game.deck.length === 0) reshuffleFromDiscard();
    if (game.deck.length > 0) {
      hand.push(game.deck.pop());
      setStatus(`${game.current} drew a card.`);
      logEvent(`⚙ ${game.current} drew a card`, 'ai-action');
    } else {
      setStatus(`${game.current} skipped (deck empty).`);
      logEvent(`⚙ ${game.current} skipped turn (deck empty)`, 'ai-action');
    }
  }

  renderAll();
  
  // Check if AI is waiting to cover their own card
  if (game.waitingForCover && (game.mustCoverQueen === game.current || game.mustCoverKing === game.current)) {
    setTimeout(aiTakeTurn, 1000); // AI takes another turn to cover
    return;
  }

  if (hand.length === 0) {
    setStatus(`♔ ${game.current} wins!`);
    logEvent(`♔ ${game.current} wins the game`, "game");
    game.gameOver = true;
    return;
  }

  game.current = getNextPlayer(game.current);
  if (game.current !== 'player') {
    setTimeout(aiTakeTurn, 1000);
  } else {
    startPlayerTurn();
  }
}

// ------------------ DECK & START ------------------
function createDeck(){
  const deck=[]; const copies=settings.doubleDeck?2:1;
  for(let c=0;c<copies;c++){
    for(const s of suits){ for(const r of ranks){ deck.push({rank:r,suit:s,joker:false}); } }
    if(settings.jokerEnabled){
      deck.push({rank:'JOKER',suit:'★',joker:true});
      deck.push({rank:'JOKER',suit:'☆',joker:true});
    }
  }
  for(let i=deck.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }
  return deck;
}

function startGame(){
  Object.assign(game, {
    deck: createDeck(),
    discard: [],
    player: [],
    aiTop: [],
    aiLeft: [],
    aiRight: [],
    current: 'player',
    direction: 1,
    gameOver: false,
    penaltyTarget: null,
    lastPlayedCard: null,
    lastPlayedBy: null,
    mustCoverQueen: null,
    mustCoverKing: null,
    waitingForCover: false,
    skipTurns: {
      player: 0,
      aiTop: 0,
      aiLeft: 0,
      aiRight: 0
    },
    pendingPenalty: {
      player: 0,
      aiTop: 0,
      aiLeft: 0,
      aiRight: 0
    },
    eventCounter: 0
  });

  selected.clear();
  UI.eventLog.innerHTML = '';

  // Deal starting hands
  for (let i = 0; i < settings.startingHand; i++) {
    game.player.push(game.deck.pop());
    game.aiTop.push(game.deck.pop());
    game.aiLeft.push(game.deck.pop());
    game.aiRight.push(game.deck.pop());
  }

  // Flip first non-joker card to discard
  let top;
  do { top = game.deck.pop(); } while (top && top.joker);
  game.discard.push(top || game.deck.pop());

  renderAll();
  startPlayerTurn();
  logEvent(`▶ New game started! Starting card: ${top.rank}${top.suit}`, 'game');
}

// ------------------ INIT ------------------
document.addEventListener('DOMContentLoaded',()=>{
  UI.btnPlay.addEventListener('click',startGame);
  UI.btnPlaySelected.addEventListener('click',playSelectedCards);
  UI.btnClear.addEventListener('click',clearSelection);
  UI.btnDraw.addEventListener('click',drawCard);
  UI.btnLastCard.addEventListener('click',()=>{
    setStatus("You declared Last Card!");
    logEvent("● Player declared Last Card",'player-play');
  });
  UI.deckCard.addEventListener('click',drawCard);
  UI.btnRules.addEventListener('click',toggleRulesPanel);
  UI.logHeader.addEventListener('click',toggleLogPanel);
});
