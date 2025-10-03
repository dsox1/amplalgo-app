console.log("🎮 Backyard BlackJack - Final Version with All Fixes");

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
  btnToggleRules: document.getElementById('btn-toggle-rules'),
  btnToggleLog: document.getElementById('btn-toggle-log'),
  rulesPanel: document.getElementById('rules-panel'),
  logPanel: document.getElementById('log-panel')
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
  aiTurnInProgress: false
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
  
  // Reset game state
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
    aiTurnInProgress: false
  });

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
  if (game.current !== 'player' || game.gameOver || game.aiTurnInProgress) return;
  
  console.log(`🎯 Toggling selection for card ${idx}`);
  const el = UI.playerHand.children[idx];
  if (selected.has(idx)) {
    selected.delete(idx);
    el.classList.remove('selected');
    console.log(`❌ Deselected card ${idx}`);
  } else {
    selected.add(idx);
    el.classList.add('selected');
    console.log(`✅ Selected card ${idx}: ${game.player[idx].rank}${game.player[idx].suit}`);
  }
  updateControls();
}

function clearSelection() {
  console.log("🧹 Clearing selection...");
  selected.clear();
  [...UI.playerHand.children].forEach(el => el.classList.remove('selected'));
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
    UI.btnPlaySelected.disabled = !hasSelection || !canStack || game.aiTurnInProgress;
  } else {
    UI.btnPlaySelected.disabled = !hasSelection || game.aiTurnInProgress;
  }
  
  // Last Card button is always visible as red knob
  const showLastCard = game.player.length === 1 && !game.lastCardDeclared;
  UI.btnLastCard.style.opacity = showLastCard ? '1' : '0.3';
  UI.btnLastCard.disabled = !showLastCard;
  
  console.log(`🎮 Controls updated - Play button: ${UI.btnPlaySelected.disabled ? 'disabled' : 'enabled'}`);
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
  
  // Fix for Queen/King matching - ensure proper suit and rank matching
  const rankMatch = card.rank === topCard.rank;
  const suitMatch = card.suit === topCard.suit;
  
  console.log(`Checking playability: ${card.rank}${card.suit} on ${topCard.rank}${topCard.suit} - Rank match: ${rankMatch}, Suit match: ${suitMatch}`);
  
  return rankMatch || suitMatch;
}

function setStatus(text) {
  UI.status.textContent = text;
  console.log(`📢 Status: ${text}`);
}

function getNextPlayer(current) {
  const players = ['player', 'aiTop', 'aiLeft', 'aiRight'];
  const currentIndex = players.indexOf(current);
  const nextIndex = (currentIndex + game.direction + players.length) % players.length;
  return players[nextIndex];
}

function highlightAIPlay(aiPlayer, card) {
  // Add visual feedback for AI play
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
  if (game.current !== 'aiTop' && game.current !== 'aiLeft' && game.current !== 'aiRight') {
    console.log("Not AI's turn, returning to player");
    game.aiTurnInProgress = false;
    setStatus("Your turn!");
    return;
  }
  
  console.log("🤖 AI taking turn...");
  game.aiTurnInProgress = true;
  const topCard = game.discard[game.discard.length - 1];
  const aiHand = game.aiTop;
  
  // Show AI thinking
  setStatus("⚙ AI is thinking...");
  
  setTimeout(() => {
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
        highlightAIPlay('aiTop', stackCard);
        logEvent(`⚙ AI played ${stackCard.rank}${stackCard.suit}`, 'ai-play');
        
        setTimeout(() => {
          applyPowerCardEffect(stackCard, 'AI');
          
          if (isRedJack(stackCard) && game.pendingPickupType === 'blackjack') {
            game.current = getNextPlayer('aiTop');
          } else {
            game.current = getNextPlayer('aiTop');
          }
          
          renderAll();
          
          if (aiHand.length === 0) {
            setStatus("♔ AI wins!");
            logEvent("♔ AI wins the game!", 'game');
            game.gameOver = true;
            game.aiTurnInProgress = false;
            return;
          }
          
          setTimeout(() => {
            game.aiTurnInProgress = false;
            if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
              aiTakeTurn();
            } else {
              setStatus("Your turn!");
            }
          }, 2000);
        }, 2000);
      } else {
        for (let i = 0; i < game.pendingPickup && game.deck.length > 0; i++) {
          aiHand.push(game.deck.pop());
        }
        const message = `⚙ AI picked up ${game.pendingPickup} cards!`;
        setStatus(message);
        logEvent(message, 'ai-action');
        game.pendingPickup = 0;
        game.pendingPickupType = null;
        game.waitingForRedJack = false;
        game.current = getNextPlayer('aiTop');
        
        renderAll();
        
        setTimeout(() => {
          game.aiTurnInProgress = false;
          if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
            aiTakeTurn();
          } else {
            setStatus("Your turn!");
          }
        }, 3000);
      }
      return;
    }
    
    // Check if AI's turn should be skipped
    if (game.skipNext) {
      game.skipNext = false;
      const message = "⚙ AI's turn was skipped!";
      setStatus(message);
      logEvent(message, 'skip');
      game.current = getNextPlayer('aiTop');
      
      setTimeout(() => {
        game.aiTurnInProgress = false;
        if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
          aiTakeTurn();
        } else {
          setStatus("Your turn!");
        }
      }, 3000);
      return;
    }
    
    // Normal AI play
    const playable = aiHand.find(card => isPlayable(card, topCard));

    if (playable) {
      aiHand.splice(aiHand.indexOf(playable), 1);
      highlightAIPlay('aiTop', playable);
      
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
        
        renderAll();

        if (aiHand.length === 0) {
          setTimeout(() => {
            setStatus("♔ AI wins!");
            logEvent("♔ AI wins the game!", 'game');
            game.gameOver = true;
            game.aiTurnInProgress = false;
          }, 2000);
          return;
        }

        game.current = getNextPlayer('aiTop');
        
        setTimeout(() => {
          game.aiTurnInProgress = false;
          if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
            aiTakeTurn();
          } else {
            setStatus("Your turn!");
          }
        }, 5000); // 5 second delay between AI messages
      }, 2000);
      
    } else if (game.deck.length > 0) {
      const drawn = game.deck.pop();
      aiHand.push(drawn);
      const message = "⚙ AI drew a card.";
      setStatus(message);
      logEvent(message, 'ai-action');
      
      renderAll();
      game.current = getNextPlayer('aiTop');
      
      setTimeout(() => {
        game.aiTurnInProgress = false;
        if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
          aiTakeTurn();
        } else {
          setStatus("Your turn!");
        }
      }, 3000);
    } else {
      const message = "⚙ AI skipped turn.";
      setStatus(message);
      logEvent(message, 'ai-action');
      game.current = getNextPlayer('aiTop');
      
      setTimeout(() => {
        game.aiTurnInProgress = false;
        if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
          aiTakeTurn();
        } else {
          setStatus("Your turn!");
        }
      }, 3000);
    }
  }, 1500); // Initial AI thinking delay
}

function promptJokerSelection() {
  console.log("🃏 Prompting for joker selection...");
  
  try {
    // First choose rank
    const rankText = ranks.map((r, i) => `${i + 1}. ${r}`).join('\n');
    const rankChoice = prompt(`Choose a rank for your Joker:\n${rankText}\n\nEnter 1-13:`);
    
    if (!rankChoice) {
      setStatus("Joker selection cancelled.");
      return null;
    }
    
    const rankNum = parseInt(rankChoice);
    if (rankNum < 1 || rankNum > 13) {
      setStatus("Invalid rank choice. Joker selection cancelled.");
      return null;
    }
    
    const selectedRank = ranks[rankNum - 1];
    
    // Then choose suit
    const suitOptions = [
      { suit: '♠', name: 'Spades' },
      { suit: '♥', name: 'Hearts' },
      { suit: '♦', name: 'Diamonds' },
      { suit: '♣', name: 'Clubs' }
    ];
    
    const suitText = suitOptions.map((s, i) => `${i + 1}. ${s.suit} ${s.name}`).join('\n');
    const suitChoice = prompt(`Choose a suit for your ${selectedRank} Joker:\n${suitText}\n\nEnter 1-4:`);
    
    if (!suitChoice) {
      setStatus("Joker suit selection cancelled.");
      return null;
    }
    
    const suitNum = parseInt(suitChoice);
    if (suitNum < 1 || suitNum > 4) {
      setStatus("Invalid suit choice. Joker selection cancelled.");
      return null;
    }
    
    const selectedSuit = suitOptions[suitNum - 1].suit;
    
    return { rank: selectedRank, suit: selectedSuit };
    
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
    console.log("❌ Cannot play - invalid state");
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
    
    if (game.player.length === 1 && !game.lastCardDeclared) {
      for (let i = 0; i < 2 && game.deck.length > 0; i++) {
        game.player.push(game.deck.pop());
      }
      setStatus('⚠ Penalty! You forgot to declare "Last Card!" - picked up 2 cards.');
      logEvent('⚠ Last Card penalty applied - picked up 2 cards', 'penalty');
      renderAll();
    }
    
    game.current = getNextPlayer('player');
    
    setTimeout(() => {
      if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
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
      
      if (game.player.length === 1 && !game.lastCardDeclared) {
        for (let i = 0; i < 2 && game.deck.length > 0; i++) {
          game.player.push(game.deck.pop());
        }
        setStatus('⚠ Penalty! You forgot to declare "Last Card!" - picked up 2 cards.');
        logEvent('⚠ Last Card penalty applied - picked up 2 cards', 'penalty');
        renderAll();
      }
      
      game.current = getNextPlayer('player');
      setTimeout(() => {
        if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
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

  if (game.player.length === 1 && !game.lastCardDeclared) {
    for (let i = 0; i < 2 && game.deck.length > 0; i++) {
      game.player.push(game.deck.pop());
    }
    setStatus('⚠ Penalty! You forgot to declare "Last Card!" - picked up 2 cards.');
    logEvent('⚠ Last Card penalty applied - picked up 2 cards', 'penalty');
    renderAll();
  }

  game.current = getNextPlayer('player');
  
  setTimeout(() => {
    if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
      aiTakeTurn();
    }
  }, 1000);
}

function drawCard() {
  if (game.aiTurnInProgress) return;
  
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
      if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
        aiTakeTurn();
      }
    }, 1000);
  } else {
    if (game.deck.length === 0 || game.current !== 'player' || game.gameOver) return;
    const card = game.deck.pop();
    game.player.push(card);
    renderAll();
    const message = "♦ You drew a card.";
    setStatus(message);
    logEvent(message, 'player-action');
    
    // Pass turn to opponent after drawing
    game.current = getNextPlayer('player');
    setTimeout(() => {
      if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
        aiTakeTurn();
      }
    }, 1000);
  }
}

function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 DOM loaded, setting up event listeners...");
  
  const missingElements = [];
  Object.entries(UI).forEach(([key, element]) => {
    if (!element && key !== 'btnToggleRules' && key !== 'btnToggleLog' && key !== 'rulesPanel' && key !== 'logPanel') {
      missingElements.push(key);
    }
  });
  
  if (missingElements.length > 0) {
    console.error("❌ Missing UI elements:", missingElements);
    return;
  }
  
  console.log("✅ All UI elements found");
  
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
  
  // Panel toggle buttons
  if (UI.btnToggleRules) {
    UI.btnToggleRules.addEventListener('click', () => togglePanel('rules-panel'));
  }
  
  if (UI.btnToggleLog) {
    UI.btnToggleLog.addEventListener('click', () => togglePanel('log-panel'));
  }
  
  console.log("✅ All event listeners set up successfully!");
  console.log("🎮 Final game ready with all fixes!");
}); // <-- PROPER CLOSING BRACKET AND BRACE
