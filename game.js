console.log("🎮 Backyard BlackJack - Complete Power Card Rules Version");

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

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
  btnPlaySelected: document.getElementById('btn-play-selected'),
  btnClear: document.getElementById('btn-clear'),
  btnDraw: document.getElementById('btn-draw'),
  btnLastCard: document.getElementById('btn-last-card'),
  btnPlay: document.getElementById('btn-play')
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
  direction: 1, // 1 = clockwise, -1 = counterclockwise
  lastCardDeclared: false,
  gameOver: false,
  pendingPickup: 0, // Cards to pick up from 2s/Black Jacks
  pendingPickupType: null, // '2' or 'blackjack'
  skipNext: false, // For 8 cards
  waitingForRedJack: false // Waiting for Red Jack to cancel Black Jack
};

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
    waitingForRedJack: false
  });

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

  console.log("🎨 Rendering game...");
  renderAll();
  setStatus('Your turn! Match suit or rank, or play a power card.');
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
  UI.playerHand.innerHTML = '';
  game.player.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = 'card selectable';
    el.innerHTML = cardHTML(card);
    el.addEventListener('click', () => toggleSelect(idx));
    UI.playerHand.appendChild(el);
  });

  // Render AI hands (card backs)
  UI.aiTopHand.innerHTML = '';
  const angleStep = 10;
  const startAngle = -((game.aiTop.length - 1) * angleStep) / 2;
  game.aiTop.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card back';
    el.style.setProperty('--angle', `${startAngle + i * angleStep}deg`);
    el.textContent = '🂠';
    UI.aiTopHand.appendChild(el);
  });

  UI.aiLeftHand.innerHTML = '';
  game.aiLeft.forEach(() => {
    const el = document.createElement('div');
    el.className = 'card back';
    el.textContent = '🂠';
    UI.aiLeftHand.appendChild(el);
  });

  UI.aiRightHand.innerHTML = '';
  game.aiRight.forEach(() => {
    const el = document.createElement('div');
    el.className = 'card back';
    el.textContent = '🂠';
    UI.aiRightHand.appendChild(el);
  });
}

let selected = new Set();

function toggleSelect(idx) {
  if (game.current !== 'player' || game.gameOver) return;
  
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
    UI.btnPlaySelected.disabled = !hasSelection || !canStack;
  } else {
    UI.btnPlaySelected.disabled = !hasSelection;
  }
  
  const showLastCard = game.player.length === 1 && !game.lastCardDeclared;
  UI.btnLastCard.style.display = showLastCard ? 'inline-block' : 'none';
  
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
  return card.rank === topCard.rank || card.suit === topCard.suit;
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

function applyPowerCardEffect(card, playedBy) {
  console.log(`⚡ Applying power card effect: ${card.rank}${card.suit} played by ${playedBy}`);
  
  if (card.rank === '2') {
    // 2: Next player picks up 2 cards (stackable)
    game.pendingPickup += 2;
    game.pendingPickupType = '2';
    setStatus(`${playedBy === 'player' ? 'You' : 'AI'} played a 2! Next player must pick up ${game.pendingPickup} cards or stack another 2.`);
    
  } else if (isBlackJack(card)) {
    // Black Jack: Next player picks up 6 cards (stackable, Red Jack cancels)
    game.pendingPickup += 6;
    game.pendingPickupType = 'blackjack';
    game.waitingForRedJack = true;
    setStatus(`${playedBy === 'player' ? 'You' : 'AI'} played a Black Jack! Next player must pick up ${game.pendingPickup} cards, stack another Black Jack, or play a Red Jack to cancel.`);
    
  } else if (isRedJack(card)) {
    // Red Jack: Cancels Black Jack
    if (game.pendingPickupType === 'blackjack') {
      game.pendingPickup = 0;
      game.pendingPickupType = null;
      game.waitingForRedJack = false;
      setStatus(`${playedBy === 'player' ? 'You' : 'AI'} played a Red Jack! Black Jack penalty cancelled.`);
    } else {
      setStatus(`${playedBy === 'player' ? 'You' : 'AI'} played a Red Jack.`);
    }
    
  } else if (card.rank === 'K') {
    // King: Reverses direction
    game.direction *= -1;
    setStatus(`${playedBy === 'player' ? 'You' : 'AI'} played a King! Direction reversed.`);
    
  } else if (card.rank === '8') {
    // 8: Skips next player's turn
    game.skipNext = true;
    setStatus(`${playedBy === 'player' ? 'You' : 'AI'} played an 8! Next player's turn is skipped.`);
    
  } else if (card.rank === 'A') {
    // Ace: Changes suit (handled in play function)
    setStatus(`${playedBy === 'player' ? 'You' : 'AI'} played an Ace! Suit changed.`);
  }
}

function aiTakeTurn() {
  console.log("🤖 AI taking turn...");
  const topCard = game.discard[game.discard.length - 1];
  const aiHand = game.aiTop;
  
  // Check if AI needs to handle pending pickup
  if (game.pendingPickup > 0) {
    console.log(`🤖 AI handling pending pickup: ${game.pendingPickup} cards (type: ${game.pendingPickupType})`);
    
    // Look for stacking cards or Red Jack
    let stackCard = null;
    if (game.pendingPickupType === '2') {
      stackCard = aiHand.find(card => card.rank === '2');
    } else if (game.pendingPickupType === 'blackjack') {
      stackCard = aiHand.find(card => isBlackJack(card) || isRedJack(card));
    }
    
    if (stackCard) {
      // AI can stack or cancel
      aiHand.splice(aiHand.indexOf(stackCard), 1);
      game.discard.push(stackCard);
      applyPowerCardEffect(stackCard, 'AI');
      
      if (isRedJack(stackCard) && game.pendingPickupType === 'blackjack') {
        // Red Jack cancelled the penalty, continue normal play
        game.current = getNextPlayer('aiTop');
      } else {
        // Stacked the penalty, pass to next player
        game.current = getNextPlayer('aiTop');
      }
    } else {
      // AI must pick up cards
      for (let i = 0; i < game.pendingPickup && game.deck.length > 0; i++) {
        aiHand.push(game.deck.pop());
      }
      setStatus(`AI picked up ${game.pendingPickup} cards!`);
      game.pendingPickup = 0;
      game.pendingPickupType = null;
      game.waitingForRedJack = false;
      game.current = getNextPlayer('aiTop');
    }
    
    renderAll();
    
    if (aiHand.length === 0) {
      setStatus("AI wins!");
      game.gameOver = true;
      return;
    }
    
    // Continue to next turn
    setTimeout(() => {
      if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
        aiTakeTurn();
      } else {
        setStatus("Your turn!");
      }
    }, 1000);
    return;
  }
  
  // Check if AI's turn should be skipped
  if (game.skipNext) {
    game.skipNext = false;
    setStatus("AI's turn was skipped!");
    game.current = getNextPlayer('aiTop');
    
    setTimeout(() => {
      if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
        aiTakeTurn();
      } else {
        setStatus("Your turn!");
      }
    }, 1000);
    return;
  }
  
  // Normal AI play
  const playable = aiHand.find(card => isPlayable(card, topCard));

  if (playable) {
    aiHand.splice(aiHand.indexOf(playable), 1);
    
    if (playable.joker) {
      const chosenSuit = suits[Math.floor(Math.random() * suits.length)];
      game.discard.push({ rank: 'JOKER', suit: chosenSuit, joker: true });
      setStatus(`AI played a Joker. Suit is now ${chosenSuit}`);
    } else if (playable.rank === 'A') {
      // AI chooses suit for Ace
      const chosenSuit = suits[Math.floor(Math.random() * suits.length)];
      game.discard.push({ rank: 'A', suit: chosenSuit, joker: false });
      setStatus(`AI played an Ace. Suit changed to ${chosenSuit}`);
    } else {
      game.discard.push(playable);
      setStatus(`AI played ${playable.rank}${playable.suit}`);
      
      // Apply power card effects
      if (isPowerCard(playable)) {
        applyPowerCardEffect(playable, 'AI');
      }
    }
  } else if (game.deck.length > 0) {
    const drawn = game.deck.pop();
    aiHand.push(drawn);
    setStatus("AI drew a card.");
  } else {
    setStatus("AI skipped turn.");
  }

  renderAll();

  if (aiHand.length === 0) {
    setStatus("AI wins!");
    game.gameOver = true;
    return;
  }

  // Move to next player
  game.current = getNextPlayer('aiTop');
  
  setTimeout(() => {
    if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
      aiTakeTurn();
    } else {
      setStatus("Your turn!");
    }
  }, 1000);
}

function promptSuitSelection() {
  console.log("🃏 Prompting for suit selection...");
  const suitOptions = [
    { suit: '♠', name: 'Spades' },
    { suit: '♥', name: 'Hearts' },
    { suit: '♦', name: 'Diamonds' },
    { suit: '♣', name: 'Clubs' }
  ];
  
  let selectedSuit = null;
  
  try {
    const suitText = suitOptions.map((s, i) => `${i + 1}. ${s.suit} ${s.name}`).join('\n');
    const choice = prompt(`Choose a suit:\n${suitText}\n\nEnter 1-4:`);
    
    if (!choice) {
      setStatus("Suit selection cancelled.");
      return null;
    }
    
    const choiceNum = parseInt(choice);
    if (choiceNum >= 1 && choiceNum <= 4) {
      selectedSuit = suitOptions[choiceNum - 1].suit;
    } else {
      setStatus("Invalid choice. Suit selection cancelled.");
      return null;
    }
  } catch (error) {
    // Fallback: automatically choose a random suit
    selectedSuit = suits[Math.floor(Math.random() * suits.length)];
    setStatus(`Suit chosen automatically: ${selectedSuit}`);
  }
  
  return selectedSuit;
}

function playSelectedCards() {
  console.log("🎯 Playing selected cards...");
  
  if (game.current !== 'player' || selected.size === 0 || game.gameOver) {
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
    
    // Play the stacking/cancelling card
    const cardIndex = game.player.indexOf(stackingCard);
    game.player.splice(cardIndex, 1);
    game.discard.push(stackingCard);
    selected.clear();
    
    applyPowerCardEffect(stackingCard, 'player');
    
    renderAll();
    
    if (game.player.length === 0) {
      setStatus("You win!");
      game.gameOver = true;
      return;
    }
    
    // Check last card rule
    if (game.player.length === 1 && !game.lastCardDeclared) {
      setStatus('You have one card left! Don\'t forget to declare "Last Card!"');
      // Apply penalty
      for (let i = 0; i < 2 && game.deck.length > 0; i++) {
        game.player.push(game.deck.pop());
      }
      setStatus('Penalty! You forgot to declare "Last Card!" - picked up 2 cards.');
      renderAll();
    }
    
    if (isRedJack(stackingCard) && game.pendingPickupType === 'blackjack') {
      // Red Jack cancelled penalty, continue normal play
      game.current = getNextPlayer('player');
    } else {
      // Stacked penalty, pass to next player
      game.current = getNextPlayer('player');
    }
    
    setTimeout(() => {
      if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
        aiTakeTurn();
      }
    }, 1000);
    return;
  }
  
  // Normal play - check if cards are playable
  const playableCards = selectedCards.filter(card => isPlayable(card, topCard));

  if (playableCards.length === 0) {
    const topCardDisplay = topCard.joker ? `Joker (${topCard.suit})` : `${topCard.rank}${topCard.suit}`;
    setStatus(`Selected cards can't be played on ${topCardDisplay}`);
    console.log("❌ No playable cards in selection");
    return;
  }

  // Play the first playable card (for simplicity, only play one at a time)
  const cardToPlay = playableCards[0];
  const cardIndex = game.player.indexOf(cardToPlay);
  game.player.splice(cardIndex, 1);
  selected.clear();
  
  if (cardToPlay.joker) {
    console.log("🃏 Playing joker card...");
    const chosenSuit = promptSuitSelection();
    if (!chosenSuit) {
      // Put card back if cancelled
      game.player.splice(cardIndex, 0, cardToPlay);
      renderAll();
      return;
    }
    game.discard.push({ rank: 'JOKER', suit: chosenSuit, joker: true });
    setStatus(`You played a Joker. Suit is now ${chosenSuit}`);
    
  } else if (cardToPlay.rank === 'A') {
    console.log("🃏 Playing Ace - choosing suit...");
    const chosenSuit = promptSuitSelection();
    if (!chosenSuit) {
      // Put card back if cancelled
      game.player.splice(cardIndex, 0, cardToPlay);
      renderAll();
      return;
    }
    game.discard.push({ rank: 'A', suit: chosenSuit, joker: false });
    setStatus(`You played an Ace. Suit changed to ${chosenSuit}`);
    
  } else {
    game.discard.push(cardToPlay);
    setStatus(`You played ${cardToPlay.rank}${cardToPlay.suit}`);
    
    // Apply power card effects
    if (isPowerCard(cardToPlay)) {
      applyPowerCardEffect(cardToPlay, 'player');
    }
  }
  
  renderAll();

  // Check for win
  if (game.player.length === 0) {
    setStatus("You win!");
    game.gameOver = true;
    console.log("🏆 Player wins!");
    return;
  }

  // Check last card rule
  if (game.player.length === 1 && !game.lastCardDeclared) {
    setStatus('You have one card left! Don\'t forget to declare "Last Card!"');
    // Apply penalty
    for (let i = 0; i < 2 && game.deck.length > 0; i++) {
      game.player.push(game.deck.pop());
    }
    setStatus('Penalty! You forgot to declare "Last Card!" - picked up 2 cards.');
    renderAll();
  }

  // Move to next player
  game.current = getNextPlayer('player');
  
  setTimeout(() => {
    if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
      aiTakeTurn();
    }
  }, 1000);
}

function drawCard() {
  if (game.pendingPickup > 0) {
    // Player must pick up penalty cards
    for (let i = 0; i < game.pendingPickup && game.deck.length > 0; i++) {
      game.player.push(game.deck.pop());
    }
    setStatus(`You picked up ${game.pendingPickup} penalty cards!`);
    game.pendingPickup = 0;
    game.pendingPickupType = null;
    game.waitingForRedJack = false;
    
    renderAll();
    
    // Move to next player
    game.current = getNextPlayer('player');
    setTimeout(() => {
      if (game.current === 'aiTop' || game.current === 'aiLeft' || game.current === 'aiRight') {
        aiTakeTurn();
      }
    }, 1000);
  } else {
    // Normal draw
    if (game.deck.length === 0 || game.current !== 'player' || game.gameOver) return;
    const card = game.deck.pop();
    game.player.push(card);
    renderAll();
    setStatus("You drew a card.");
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 DOM loaded, setting up event listeners...");
  
  // Verify all UI elements exist
  const missingElements = [];
  Object.entries(UI).forEach(([key, element]) => {
    if (!element) {
      missingElements.push(key);
    }
  });
  
  if (missingElements.length > 0) {
    console.error("❌ Missing UI elements:", missingElements);
    return;
  }
  
  console.log("✅ All UI elements found");
  
  // Start game button
  UI.btnPlay.addEventListener('click', () => {
    console.log("🎮 Play button clicked!");
    startGame();
  });
  
  // Play selected cards button
  UI.btnPlaySelected.addEventListener('click', () => {
    console.log("🎯 Play Selected button clicked!");
    playSelectedCards();
  });

  // Clear selection button
  UI.btnClear.addEventListener('click', () => {
    console.log("🧹 Clear button clicked!");
    clearSelection();
  });
  
  // Draw card button
  UI.btnDraw.addEventListener('click', () => {
    console.log("🎴 Draw button clicked!");
    drawCard();
  });

  // Last card declaration button
  UI.btnLastCard.addEventListener('click', () => {
    console.log("🗣️ Last Card button clicked!");
    game.lastCardDeclared = true;
    setStatus('You declared "Last Card!"');
    UI.btnLastCard.style.display = 'none';
  });

  // Deck card click (alternative draw)
  UI.deckCard.addEventListener('click', () => {
    console.log("🎴 Deck clicked!");
    drawCard();
  });
  
  console.log("✅ All event listeners set up successfully!");
  console.log("🎮 Game ready to play with complete power card rules!");
}); // <-- FIXED: Closing bracket and brace for DOMContentLoaded
