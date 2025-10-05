console.log("🎮 Backyard BlackJack - Final Fixed Version with Proper Turn Management");

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const rankValues = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };

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
  logPanel: document.getElementById('log-panel'),
  logContent: document.getElementById('log-content'),
  logHeader: document.getElementById('log-header')
};

const settings = {
  startingHand: 7,
  jokerEnabled: true,
  doubleDeck: false
};

const game = {
  deck: [],
  discard: [],
  player: [],
  aiTop: [],
  aiLeft: [],
  aiRight: [],
  current: 'player',
  direction: 1,
  lastCardDeclared: false,
  gameOver: false,
  pendingPickup: 0,
  pendingPickupType: null,
  skipNext: false,
  waitingForRedJack: false,
  eventCounter: 0,
  aiTurnInProgress: false,
  lastPlayedBy: null,
  turnTimeout: null
};

let selected = new Set();

function logEvent(message, type = 'info') {
  game.eventCounter++;
  const timestamp = new Date().toLocaleTimeString();
  
  // Remove face icons and replace with symbols
  const cleanMessage = message
    .replace(/🎮/g, '▶')
    .replace(/🤖/g, '⚙')
    .replace(/🎯/g, '●')
    .replace(/🎴/g, '♦')
    .replace(/🃏/g, '★')
    .replace(/🏆/g, '♔')
    .replace(/🗣️/g, '♪')
    .replace(/🧹/g, '✗');
  
  const logContainer = UI.eventLog;
  if (logContainer) {
    const logElement = document.createElement('div');
    logElement.className = `log-entry ${type}`;
    logElement.innerHTML = `
      <span class="log-id">#${game.eventCounter}</span>
      <span class="log-time">${timestamp}</span>
      <span class="log-message">${cleanMessage}</span>
    `;
    logContainer.insertBefore(logElement, logContainer.firstChild);
    
    // Keep only last 50 entries
    while (logContainer.children.length > 50) {
      logContainer.removeChild(logContainer.lastChild);
    }
  }
  
  console.log(`📝 Event #${game.eventCounter}: ${cleanMessage}`);
}

function createDeck() {
  console.log("🃏 Creating deck...");
  const deck = [];
  const copies = settings.doubleDeck ? 2 : 1;
  for (let c = 0; c < copies; c++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ rank, suit, joker: false });
      }
    }
    if (settings.jokerEnabled) {
      deck.push({ rank: 'JOKER', suit: '★', joker: true });
      deck.push({ rank: 'JOKER', suit: '☆', joker: true });
    }
  }
  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  console.log(`✅ Deck created with ${deck.length} cards`);
  return deck;
}

function startGame() {
  console.log("🎮 Starting new game...");
  
  // Clear any existing timeouts
  if (game.turnTimeout) {
    clearTimeout(game.turnTimeout);
    game.turnTimeout = null;
  }
  
  // Reset game state completely
  Object.assign(game, {
    deck: createDeck(),
    discard: [],
    player: [],
    aiTop: [],
    aiLeft: [],
    aiRight: [],
    current: 'player',
    direction: 1,
    lastCardDeclared: false,
    gameOver: false,
    pendingPickup: 0,
    pendingPickupType: null,
    skipNext: false,
    waitingForRedJack: false,
    eventCounter: 0,
    aiTurnInProgress: false,
    lastPlayedBy: null,
    turnTimeout: null
  });

  // Clear selection
  selected.clear();

  // Clear event log
  if (UI.eventLog) {
    UI.eventLog.innerHTML = '';
  }

  // Deal cards
  console.log("🎯 Dealing cards...");
  for (let i = 0; i < settings.startingHand; i++) {
    game.player.push(game.deck.pop());
    game.aiTop.push(game.deck.pop());
    game.aiLeft.push(game.deck.pop());
    game.aiRight.push(game.deck.pop());
  }

  // Set initial discard card (not a power card)
  let top;
  do {
    top = game.deck.pop();
  } while (top && (top.joker || isPowerCard(top)));
  game.discard.push(top || game.deck.pop());
  game.lastPlayedBy = 'system';

  logEvent(`▶ New game started! Starting card: ${top.rank}${top.suit}`, 'game');
  logEvent(`● Cards dealt: ${settings.startingHand} cards each`, 'game');

  console.log("🎨 Rendering game...");
  renderAll();
  setStatus('Your turn! Match suit or rank, play runs, or use power cards.');
  console.log("✅ Game started successfully!");
}

function isPowerCard(card) {
  if (!card) return false;
  return card.rank === '2' || card.rank === 'J' || card.rank === 'K' || 
         card.rank === '8' || card.rank === 'A' || card.joker;
}

function isBlackJack(card) {
  return card.rank === 'J' && (card.suit === '♠' || card.suit === '♣');
}

function isRedJack(card) {
  return card.rank === 'J' && (card.suit === '♥' || card.suit === '♦');
}

function isValidRun(cards) {
  if (cards.length < 2) return false;
  
  // Sort cards by rank value
  const sortedCards = [...cards].sort((a, b) => rankValues[a.rank] - rankValues[b.rank]);
  
  // Check if ranks are consecutive
  for (let i = 1; i < sortedCards.length; i++) {
    const prevValue = rankValues[sortedCards[i-1].rank];
    const currValue = rankValues[sortedCards[i].rank];
    if (currValue !== prevValue + 1) {
      return false;
    }
  }
  
  return true;
}

function calculateCardScale(handSize) {
  if (handSize <= 7) return 1.0;
  if (handSize <= 10) return 0.85;
  if (handSize <= 13) return 0.7;
  return 0.6;
}

function calculateCardSpacing(handSize) {
  if (handSize <= 7) return 0;
  if (handSize <= 10) return -10;
  if (handSize <= 13) return -20;
  return -30;
}

function renderAll() {
  renderCenterStacks();
  renderHands();
  renderCounts();
  updateControls();
}

function renderCenterStacks() {
  UI.deckCount.textContent = game.deck.length;
  UI.deckCard.textContent = '🂠';
  const top = game.discard[game.discard.length - 1];
  UI.discardCard.innerHTML = cardHTML(top);
}

function renderCounts() {
  UI.playerCount.textContent = game.player.length;
  UI.aiTopCount.textContent = game.aiTop.length;
  UI.aiLeftCount.textContent = game.aiLeft.length;
  UI.aiRightCount.textContent = game.aiRight.length;
}

function renderHands() {
  // Player hand with neat layout
  UI.playerHand.innerHTML = '';
  const playerScale = calculateCardScale(game.player.length);
  const playerSpacing = calculateCardSpacing(game.player.length);
  
  game.player.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = 'card selectable';
    if (selected.has(idx)) {
      el.classList.add('selected');
    }
    el.innerHTML = cardHTML(card);
    el.style.transform = `scale(${playerScale})`;
    el.style.marginLeft = idx > 0 ? `${playerSpacing}px` : '0';
    el.addEventListener('click', () => toggleSelect(idx));
    UI.playerHand.appendChild(el);
  });

  // AI hands with neat layout
  UI.aiTopHand.innerHTML = '';
  const aiScale = calculateCardScale(game.aiTop.length);
  const angleStep = Math.min(10, 60 / Math.max(1, game.aiTop.length - 1));
  const startAngle = -((game.aiTop.length - 1) * angleStep) / 2;
  
  game.aiTop.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card back';
    el.style.setProperty('--angle', `${startAngle + i * angleStep}deg`);
    el.style.transform = `scale(${aiScale})`;
    el.textContent = '🂠';
    UI.aiTopHand.appendChild(el);
  });

  UI.aiLeftHand.innerHTML = '';
  const leftScale = calculateCardScale(game.aiLeft.length);
  game.aiLeft.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card back';
    el.style.transform = `scale(${leftScale})`;
    el.style.marginTop = i > 0 ? `${calculateCardSpacing(game.aiLeft.length)}px` : '0';
    el.textContent = '🂠';
    UI.aiLeftHand.appendChild(el);
  });

  UI.aiRightHand.innerHTML = '';
  const rightScale = calculateCardScale(game.aiRight.length);
  game.aiRight.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card back';
    el.style.transform = `scale(${rightScale})`;
    el.style.marginTop = i > 0 ? `${calculateCardSpacing(game.aiRight.length)}px` : '0';
    el.textContent = '🂠';
    UI.aiRightHand.appendChild(el);
  });
}

function toggleSelect(idx) {
  if (game.current !== 'player' || game.gameOver || game.aiTurnInProgress) {
    console.log(`❌ Cannot select - Current: ${game.current}, GameOver: ${game.gameOver}, AI in progress: ${game.aiTurnInProgress}`);
    return;
  }
  
  console.log(`🎯 Toggling selection for card ${idx}`);
  
  if (selected.has(idx)) {
    selected.delete(idx);
    console.log(`❌ Deselected card ${idx}`);
  } else {
    selected.add(idx);
    console.log(`✅ Selected card ${idx}: ${game.player[idx].rank}${game.player[idx].suit}`);
  }
  
  // Re-render to update visual selection
  renderHands();
  updateControls();
}

function clearSelection() {
  console.log("🧹 Clearing selection...");
  selected.clear();
  renderHands();
  updateControls();
  setStatus('Selection cleared.');
  logEvent('✗ Selection cleared', 'action');
}

function updateControls() {
  const hasSelection = selected.size > 0;
  
  // If there's a pending pickup, only allow stacking cards or Red Jack cancellation
  if (game.pendingPickup > 0) {
    const selectedCards = [...selected].map(i => game.player[i]);
    const canStack = selectedCards.some(card => 
      (game.pendingPickupType === '2' && card.rank === '2') ||
      (game.pendingPickupType === 'blackjack' && (isBlackJack(card) || isRedJack(card)))
    );
    UI.btnPlaySelected.disabled = !hasSelection || !canStack || game.aiTurnInProgress || game.current !== 'player';
  } else {
    UI.btnPlaySelected.disabled = !hasSelection || game.aiTurnInProgress || game.current !== 'player';
  }
  
  // Last Card button is always available
  UI.btnLastCard.disabled = game.gameOver;
  
  console.log(`🎮 Controls updated - Play button: ${UI.btnPlaySelected.disabled ? 'disabled' : 'enabled'}, Selection size: ${selected.size}`);
}

function cardHTML(card) {
  if (!card || card.joker) {
    return `
      <div class="card-face">
        <div class="card-corners"><span>JOKER</span><span>${card ? card.suit : '★'}</span></div>
        <div class="card-icon"><span class="black">${card ? card.suit : '★'}</span></div>
        <div class="card-corners"><span>${card ? card.suit : '★'}</span><span>JOKER</span></div>
      </div>
    `;
  }
  const isRed = card.suit === '♥' || card.suit === '♦';
  const suitClass = isRed ? 'red' : 'black';
  let centerIcon = card.suit;
  if (card.rank === 'K') centerIcon = '♛';
  if (card.rank === 'Q') centerIcon = '♕';
  if (card.rank === 'J') centerIcon = '🛡';
  
  return `
    <div class="card-face">
      <div class="card-corners ${suitClass}">
        <span>${card.rank}</span><span>${card.suit}</span>
      </div>
      <div class="card-icon ${suitClass}">
        <span>${centerIcon}</span>
      </div>
      <div class="card-corners ${suitClass}">
        <span>${card.suit}</span><span>${card.rank}</span>
      </div>
    </div>
  `;
}

function isPlayable(card, topCard) {
  if (!card || !topCard) return false;
  if (card.joker) return true;
  if (card.rank === 'A') return true; // Aces can be played anytime
  if (topCard.joker) return card.suit === topCard.suit;
  
  const rankMatch = card.rank === topCard.rank;
  const suitMatch = card.suit === topCard.suit;
  
  console.log(`Checking playability: ${card.rank}${card.suit} on ${topCard.rank}${topCard.suit} - Rank match: ${rankMatch}, Suit match: ${suitMatch}`);
  
  return rankMatch || suitMatch;
}

function setStatus(text) {
  if (UI.status) {
    UI.status.textContent = text;
    console.log(`📢 Status: ${text}`);
  } else {
    console.error("❌ Status element not found!");
  }
}

function getNextPlayer(current) {
  const players = ['player', 'aiTop', 'aiLeft', 'aiRight'];
  const currentIndex = players.indexOf(current);
  const nextIndex = (currentIndex + game.direction + players.length) % players.length;
  return players[nextIndex];
}

function getAIHand(aiPlayer) {
  if (aiPlayer === 'aiTop') return game.aiTop;
  if (aiPlayer === 'aiLeft') return game.aiLeft;
  if (aiPlayer === 'aiRight') return game.aiRight;
  return game.aiTop; // fallback
}

function highlightAIPlay(aiPlayer, card) {
  let handElement;
  if (aiPlayer === 'aiTop') handElement = UI.aiTopHand;
  else if (aiPlayer === 'aiLeft') handElement = UI.aiLeftHand;
  else if (aiPlayer === 'aiRight') handElement = UI.aiRightHand;
  
  if (handElement && handElement.children.length > 0) {
    const cardElement = handElement.children[0];
    cardElement.style.transform += ' scale(1.2) translateY(-10px)';
    cardElement.style.boxShadow = '0 0 20px #4CAF50';
    cardElement.style.zIndex = '1000';
    
    setTimeout(() => {
      cardElement.style.transform = cardElement.style.transform.replace(' scale(1.2) translateY(-10px)', '');
      cardElement.style.boxShadow = '';
      cardElement.style.zIndex = '';
    }, 1500);
  }
}

function applyPowerCardEffect(card, playedBy) {
  console.log(`⚡ Applying power card effect: ${card.rank}${card.suit} played by ${playedBy}`);
  
  if (card.rank === '2') {
    game.pendingPickup += 2;
    game.pendingPickupType = '2';
    const message = `⚡ ${playedBy === 'player' ? 'You' : 'AI'} played a 2! Next player must pick up ${game.pendingPickup} cards or stack another 2.`;
    setStatus(message);
    logEvent(message, 'power');
    
  } else if (isBlackJack(card)) {
    game.pendingPickup += 6;
    game.pendingPickupType = 'blackjack';
    game.waitingForRedJack = true;
    const message = `⚡ ${playedBy === 'player' ? 'You' : 'AI'} played a Black Jack! Next player must pick up ${game.pendingPickup} cards, stack another Black Jack, or play a Red Jack to cancel.`;
    setStatus(message);
    logEvent(message, 'power');
    
  } else if (isRedJack(card)) {
    if (game.pendingPickupType === 'blackjack') {
      game.pendingPickup = 0;
      game.pendingPickupType = null;
      game.waitingForRedJack = false;
      const message = `⚡ ${playedBy === 'player' ? 'You' : 'AI'} played a Red Jack! Black Jack penalty cancelled.`;
      setStatus(message);
      logEvent(message, 'power');
    } else {
      const message = `${playedBy === 'player' ? 'You' : 'AI'} played a Red Jack.`;
      setStatus(message);
      logEvent(message, 'play');
    }
    
  } else if (card.rank === 'K') {
    game.direction *= -1;
    const message = `⚡ ${playedBy === 'player' ? 'You' : 'AI'} played a King! Direction reversed.`;
    setStatus(message);
    logEvent(message, 'power');
    
  } else if (card.rank === '8') {
    game.skipNext = true;
    const message = `⚡ ${playedBy === 'player' ? 'You' : 'AI'} played an 8! Next player's turn is skipped.`;
    setStatus(message);
    logEvent(message, 'power');
    
  } else if (card.rank === 'A') {
    const message = `⚡ ${playedBy === 'player' ? 'You' : 'AI'} played an Ace! Suit is now ${card.suit}.`;
    setStatus(message);
    logEvent(message, 'power');
  }
}

function aiTakeTurn() {
  // CRITICAL: Prevent AI from taking turn if it's not AI's turn or if already in progress
  if (game.current === 'player' || game.gameOver || game.aiTurnInProgress) {
    console.log(`❌ AI turn blocked - Current: ${game.current}, GameOver: ${game.gameOver}, InProgress: ${game.aiTurnInProgress}`);
    return;
  }
  
  console.log(`🤖 AI (${game.current}) taking turn... Last played by: ${game.lastPlayedBy}`);
  game.aiTurnInProgress = true;
  
  const topCard = game.discard[game.discard.length - 1];
  const aiHand = getAIHand(game.current);
  
  // Show AI thinking
  setStatus("⚙ AI is thinking...");
  
  // Clear any existing timeout
  if (game.turnTimeout) {
    clearTimeout(game.turnTimeout);
  }
  
  game.turnTimeout = setTimeout(() => {
    // Double-check we're still in the right state
    if (game.current === 'player' || game.gameOver) {
      game.aiTurnInProgress = false;
      return;
    }
    
    // Check if AI needs to handle pending pickup
    if (game.pendingPickup > 0) {
      console.log(`🤖 AI handling pending pickup: ${game.pendingPickup} cards (type: ${game.pendingPickupType})`);
      
      let stackCard = null;
      if (game.pendingPickupType === '2') {
        stackCard = aiHand.find(card => card.rank === '2');
      } else if (game.pendingPickupType === 'blackjack') {
        stackCard = aiHand.find(card => isBlackJack(card) || isRedJack(card));
      }
      
      if (stackCard) {
        aiHand.splice(aiHand.indexOf(stackCard), 1);
        game.discard.push(stackCard);
        game.lastPlayedBy = 'ai';
        highlightAIPlay(game.current, stackCard);
        logEvent(`⚙ AI played ${stackCard.rank}${stackCard.suit}`, 'ai-play');
        
        setTimeout(() => {
          applyPowerCardEffect(stackCard, 'AI');
          
          if (aiHand.length === 0) {
            setStatus("♔ AI wins!");
            logEvent("♔ AI wins the game!", 'game');
            game.gameOver = true;
            game.aiTurnInProgress = false;
            return;
          }
          
          game.current = getNextPlayer(game.current);
          renderAll();
          game.aiTurnInProgress = false;
          
          // Only continue if next player is AI
          if (game.current !== 'player') {
            setTimeout(() => aiTakeTurn(), 2000);
          } else {
            setStatus("Your turn!");
          }
        }, 2000);
      } else {
        // AI picks up penalty cards
        for (let i = 0; i < game.pendingPickup && game.deck.length > 0; i++) {
          aiHand.push(game.deck.pop());
        }
        const message = `⚙ AI picked up ${game.pendingPickup} cards!`;
        setStatus(message);
        logEvent(message, 'ai-action');
        game.pendingPickup = 0;
        game.pendingPickupType = null;
        game.waitingForRedJack = false;
        
        game.current = getNextPlayer(game.current);
        renderAll();
        game.aiTurnInProgress = false;
        
        if (game.current !== 'player') {
          setTimeout(() => aiTakeTurn(), 3000);
        } else {
          setStatus("Your turn!");
        }
      }
      return;
    }
    
    // Check if AI's turn should be skipped
    if (game.skipNext) {
      game.skipNext = false;
      const message = "⚙ AI's turn was skipped!";
      setStatus(message);
      logEvent(message, 'skip');
      
      game.current = getNextPlayer(game.current);
      game.aiTurnInProgress = false;
      
      if (game.current !== 'player') {
        setTimeout(() => aiTakeTurn(), 3000);
      } else {
        setStatus("Your turn!");
      }
      return;
    }
    
    // Normal AI play
    const playable = aiHand.find(card => isPlayable(card, topCard));

    if (playable) {
      aiHand.splice(aiHand.indexOf(playable), 1);
      game.lastPlayedBy = 'ai';
      highlightAIPlay(game.current, playable);
      
      setTimeout(() => {
        if (playable.joker) {
          const chosenSuit = suits[Math.floor(Math.random() * suits.length)];
          const chosenRank = ranks[Math.floor(Math.random() * ranks.length)];
          game.discard.push({ rank: chosenRank, suit: chosenSuit, joker: true });
          const message = `⚙ AI played a Joker as ${chosenRank}${chosenSuit}`;
          setStatus(message);
          logEvent(message, 'ai-play');
        } else {
          game.discard.push(playable);
          const message = `⚙ AI played ${playable.rank}${playable.suit}`;
          setStatus(message);
          logEvent(message, 'ai-play');
          
          if (isPowerCard(playable)) {
            setTimeout(() => {
              applyPowerCardEffect(playable, 'AI');
            }, 1000);
          }
        }
        
        if (aiHand.length === 0) {
          setTimeout(() => {
            setStatus("♔ AI wins!");
            logEvent("♔ AI wins the game!", 'game');
            game.gameOver = true;
            game.aiTurnInProgress = false;
          }, 2000);
          return;
        }

        game.current = getNextPlayer(game.current);
        renderAll();
        game.aiTurnInProgress = false;
        
        // CRITICAL: Only continue if next player is AI
        if (game.current !== 'player') {
          setTimeout(() => aiTakeTurn(), 5000);
        } else {
          setStatus("Your turn!");
        }
      }, 2000);
      
    } else if (game.deck.length > 0) {
      // AI draws a card
      const drawn = game.deck.pop();
      aiHand.push(drawn);
      const message = "⚙ AI drew a card.";
      setStatus(message);
      logEvent(message, 'ai-action');
      
      game.current = getNextPlayer(game.current);
      renderAll();
      game.aiTurnInProgress = false;
      
      if (game.current !== 'player') {
        setTimeout(() => aiTakeTurn(), 3000);
      } else {
        setStatus("Your turn!");
      }
    } else {
      // AI skips turn
      const message = "⚙ AI skipped turn.";
      setStatus(message);
      logEvent(message, 'ai-action');
      
      game.current = getNextPlayer(game.current);
      game.aiTurnInProgress = false;
      
      if (game.current !== 'player') {
        setTimeout(() => aiTakeTurn(), 3000);
      } else {
        setStatus("Your turn!");
      }
    }
  }, 1500); // AI thinking delay
}

function promptJokerSelection() {
  console.log("🃏 Prompting for simplified joker selection...");
  
  try {
    const input = prompt(`Transform your Joker into any card:

Enter: [RANK][SUIT]
Example: AS (Ace of Spades), 10H (10 of Hearts), KC (King of Clubs)

Ranks: A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
Suits: S (♠), H (♥), D (♦), C (♣)`);
    
    if (!input) {
      setStatus("Joker selection cancelled.");
      return null;
    }
    
    const cleanInput = input.trim().toUpperCase();
    
    // Parse input like "AS", "10H", "KC"
    let rank, suitChar;
    if (cleanInput.length === 2) {
      rank = cleanInput[0];
      suitChar = cleanInput[1];
    } else if (cleanInput.length === 3 && cleanInput.startsWith('10')) {
      rank = '10';
      suitChar = cleanInput[2];
    } else {
      setStatus("Invalid format. Use format like AS, 10H, KC");
      return null;
    }
    
    // Validate rank
    if (!ranks.includes(rank)) {
      setStatus("Invalid rank. Use A, 2-10, J, Q, K");
      return null;
    }
    
    // Convert suit character to symbol
    const suitMap = { 'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣' };
    const suit = suitMap[suitChar];
    
    if (!suit) {
      setStatus("Invalid suit. Use S, H, D, C");
      return null;
    }
    
    return { rank, suit };
    
  } catch (error) {
    // Fallback: automatically choose random rank and suit
    const selectedRank = ranks[Math.floor(Math.random() * ranks.length)];
    const selectedSuit = suits[Math.floor(Math.random() * suits.length)];
    setStatus(`Joker chosen automatically: ${selectedRank}${selectedSuit}`);
    return { rank: selectedRank, suit: selectedSuit };
  }
}

function playSelectedCards() {
  console.log("🎯 Playing selected cards...");
  
  if (game.current !== 'player' || selected.size === 0 || game.gameOver || game.aiTurnInProgress) {
    console.log(`❌ Cannot play - Current: ${game.current}, Selected: ${selected.size}, GameOver: ${game.gameOver}, AI in progress: ${game.aiTurnInProgress}`);
    return;
  }

  const topCard = game.discard[game.discard.length - 1];
  const selectedIndices = [...selected];
  const selectedCards = selectedIndices.map(i => game.player[i]);
  
  console.log(`🎴 Selected cards:`, selectedCards.map(c => `${c.rank}${c.suit}`));
  console.log(`🎯 Top card: ${topCard.rank}${topCard.suit}`);
  
  // Handle pending pickup situations
  if (game.pendingPickup > 0) {
    const stackingCard = selectedCards.find(card => 
      (game.pendingPickupType === '2' && card.rank === '2') ||
      (game.pendingPickupType === 'blackjack' && (isBlackJack(card) || isRedJack(card)))
    );
    
    if (!stackingCard) {
      setStatus(`You must play a ${game.pendingPickupType === '2' ? '2' : 'Black Jack or Red Jack'} or pick up ${game.pendingPickup} cards!`);
      return;
    }
    
    const cardIndex = game.player.indexOf(stackingCard);
    game.player.splice(cardIndex, 1);
    game.discard.push(stackingCard);
    game.lastPlayedBy = 'player';
    selected.clear();
    
    logEvent(`● You played ${stackingCard.rank}${stackingCard.suit}`, 'player-play');
    applyPowerCardEffect(stackingCard, 'player');
    
    renderAll();
    
    if (game.player.length === 0) {
      setStatus("♔ You win!");
      logEvent("♔ You win the game!", 'game');
      game.gameOver = true;
      return;
    }
    
    game.current = getNextPlayer('player');
    
    setTimeout(() => {
      if (game.current !== 'player') {
        aiTakeTurn();
      }
    }, 1000);
    return;
  }
  
  // Check for runs
  if (selectedCards.length > 1) {
    if (isValidRun(selectedCards)) {
      // Play the run
      selectedIndices.sort((a, b) => b - a); // Remove from end first
      selectedIndices.forEach(idx => {
        game.player.splice(idx, 1);
      });
      
      // Add all cards to discard (last card becomes top)
      const sortedRun = [...selectedCards].sort((a, b) => rankValues[a.rank] - rankValues[b.rank]);
      sortedRun.forEach(card => game.discard.push(card));
      game.lastPlayedBy = 'player';
      
      selected.clear();
      
      const runDescription = sortedRun.map(c => `${c.rank}${c.suit}`).join(', ');
      const message = `● You played a run: ${runDescription}`;
      setStatus(message);
      logEvent(message, 'player-play');
      
      renderAll();
      
      if (game.player.length === 0) {
        setStatus("♔ You win!");
        logEvent("♔ You win the game!", 'game');
        game.gameOver = true;
        return;
      }
      
      game.current = getNextPlayer('player');
      setTimeout(() => {
        if (game.current !== 'player') {
          aiTakeTurn();
        }
      }, 1000);
      return;
    } else {
      setStatus("Selected cards don't form a valid run. Cards must be consecutive ranks.");
      return;
    }
  }
  
  // Single card play
  const playableCards = selectedCards.filter(card => isPlayable(card, topCard));

  if (playableCards.length === 0) {
    const topCardDisplay = topCard.joker ? `Joker (${topCard.rank}${topCard.suit})` : `${topCard.rank}${topCard.suit}`;
    setStatus(`Selected cards can't be played on ${topCardDisplay}`);
    console.log("❌ No playable cards in selection");
    return;
  }

  const cardToPlay = playableCards[0];
  const cardIndex = game.player.indexOf(cardToPlay);
  game.player.splice(cardIndex, 1);
  game.lastPlayedBy = 'player';
  selected.clear();
  
  if (cardToPlay.joker) {
    console.log("🃏 Playing joker card...");
    const jokerChoice = promptJokerSelection();
    if (!jokerChoice) {
      game.player.splice(cardIndex, 0, cardToPlay);
      renderAll();
      return;
    }
    game.discard.push({ rank: jokerChoice.rank, suit: jokerChoice.suit, joker: true });
    const message = `● You played a Joker as ${jokerChoice.rank}${jokerChoice.suit}`;
    setStatus(message);
    logEvent(message, 'player-play');
    
  } else {
    game.discard.push(cardToPlay);
    const message = `● You played ${cardToPlay.rank}${cardToPlay.suit}`;
    setStatus(message);
    logEvent(message, 'player-play');
    
    if (isPowerCard(cardToPlay)) {
      setTimeout(() => {
        applyPowerCardEffect(cardToPlay, 'player');
      }, 500);
    }
  }
  
  renderAll();

  if (game.player.length === 0) {
    setStatus("♔ You win!");
    logEvent("♔ You win the game!", 'game');
    game.gameOver = true;
    console.log("🏆 Player wins!");
    return;
  }

  game.current = getNextPlayer('player');
  
  setTimeout(() => {
    if (game.current !== 'player') {
      aiTakeTurn();
    }
  }, 1000);
}

function drawCard() {
  if (game.aiTurnInProgress || game.current !== 'player') {
    console.log(`❌ Cannot draw - AI in progress: ${game.aiTurnInProgress}, Current: ${game.current}`);
    return;
  }
  
  if (game.pendingPickup > 0) {
    for (let i = 0; i < game.pendingPickup && game.deck.length > 0; i++) {
      game.player.push(game.deck.pop());
    }
    const message = `♦ You picked up ${game.pendingPickup} penalty cards!`;
    setStatus(message);
    logEvent(message, 'player-action');
    game.pendingPickup = 0;
    game.pendingPickupType = null;
    game.waitingForRedJack = false;
    
    renderAll();
    
    game.current = getNextPlayer('player');
    setTimeout(() => {
      if (game.current !== 'player') {
        aiTakeTurn();
      }
    }, 1000);
  } else {
    if (game.deck.length === 0 || game.gameOver) return;
    const card = game.deck.pop();
    game.player.push(card);
    renderAll();
    const message = "♦ You drew a card.";
    setStatus(message);
    logEvent(message, 'player-action');
    
    // Pass turn to opponent after drawing
    game.current = getNextPlayer('player');
    setTimeout(() => {
      if (game.current !== 'player') {
        aiTakeTurn();
      }
    }, 1000);
  }
}

function toggleRulesPanel() {
  if (UI.rulesPanel) {
    const isVisible = UI.rulesPanel.style.display !== 'none';
    UI.rulesPanel.style.display = isVisible ? 'none' : 'block';
    console.log(`📋 Rules panel ${isVisible ? 'hidden' : 'shown'}`);
  }
}

function toggleLogPanel() {
  if (UI.logContent) {
    const isVisible = UI.logContent.style.display !== 'none';
    UI.logContent.style.display = isVisible ? 'none' : 'block';
    console.log(`📊 Log panel content ${isVisible ? 'hidden' : 'shown'}`);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 DOM loaded, setting up event listeners...");
  
  const missingElements = [];
  Object.entries(UI).forEach(([key, element]) => {
    if (!element && key !== 'logHeader' && key !== 'logContent') {
      missingElements.push(key);
    }
  });
  
  if (missingElements.length > 0) {
    console.error("❌ Missing UI elements:", missingElements);
  } else {
    console.log("✅ All UI elements found");
  }
  
  // Hide panels on load
  if (UI.rulesPanel) UI.rulesPanel.style.display = 'none';
  if (UI.logContent) UI.logContent.style.display = 'none';
  
  UI.btnPlay.addEventListener('click', () => {
    console.log("🎮 Play button clicked!");
    startGame();
  });
  
  UI.btnPlaySelected.addEventListener('click', () => {
    console.log("🎯 Play Selected button clicked!");
    playSelectedCards();
  });

  UI.btnClear.addEventListener('click', () => {
    console.log("🧹 Clear button clicked!");
    clearSelection();
  });
  
  UI.btnDraw.addEventListener('click', () => {
    console.log("🎴 Draw button clicked!");
    drawCard();
  });

  UI.btnLastCard.addEventListener('click', () => {
    console.log("🗣️ Last Card button clicked!");
    game.lastCardDeclared = true;
    setStatus('You declared "Last Card!"');
    logEvent('♪ You declared "Last Card!"', 'declaration');
    updateControls();
  });

  UI.deckCard.addEventListener('click', () => {
    console.log("🎴 Deck clicked!");
    drawCard();
  });
  
  // Rules button in nav toggles rules panel
  if (UI.btnRules) {
    UI.btnRules.addEventListener('click', () => {
      console.log("📋 Rules button clicked!");
      toggleRulesPanel();
    });
  }
  
  // Log header toggles log panel content only
  if (UI.logHeader) {
    UI.logHeader.addEventListener('click', () => {
      console.log("📊 Log header clicked!");
      toggleLogPanel();
    });
  }
  
  console.log("✅ All event listeners set up successfully!");
  console.log("🎮 Final fixed game ready with proper turn management!");
});
