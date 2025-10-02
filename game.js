console.log("🎮 Backyard BlackJack - Loading JavaScript...");

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
  lastCardDeclared: false,
  gameOver: false
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
    lastCardDeclared: false,
    gameOver: false
  });

  // Deal cards
  console.log("🎯 Dealing cards...");
  for (let i = 0; i < settings.startingHand; i++) {
    game.player.push(game.deck.pop());
    game.aiTop.push(game.deck.pop());
    game.aiLeft.push(game.deck.pop());
    game.aiRight.push(game.deck.pop());
  }

  // Set initial discard card (not a joker)
  let top;
  do {
    top = game.deck.pop();
  } while (top && top.joker);
  game.discard.push(top || game.deck.pop());

  console.log("🎨 Rendering game...");
  renderAll();
  setStatus('Your turn! Match suit or rank, or play a power card.');
  console.log("✅ Game started successfully!");
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
  UI.btnPlaySelected.disabled = !hasSelection;
  
  const showLastCard = game.player.length === 1 && !game.lastCardDeclared;
  UI.btnLastCard.style.display = showLastCard ? 'inline-block' : 'none';
  
  console.log(`🎮 Controls updated - Play button: ${hasSelection ? 'enabled' : 'disabled'}`);
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
  if (topCard.joker) return card.suit === topCard.suit;
  return card.rank === topCard.rank || card.suit === topCard.suit;
}

function setStatus(text) {
  UI.status.textContent = text;
  console.log(`📢 Status: ${text}`);
}

function aiTakeTurn() {
  console.log("🤖 AI taking turn...");
  const topCard = game.discard[game.discard.length - 1];
  const aiHand = game.aiTop;
  const playable = aiHand.find(card => isPlayable(card, topCard));

  if (playable) {
    aiHand.splice(aiHand.indexOf(playable), 1);
    if (playable.joker) {
      const chosenSuit = suits[Math.floor(Math.random() * suits.length)];
      game.discard.push({ rank: 'JOKER', suit: chosenSuit, joker: true });
      setStatus(`AI played a Joker. Suit is now ${chosenSuit}`);
    } else {
      game.discard.push(playable);
      setStatus(`AI played ${playable.rank}${playable.suit}`);
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

  game.current = 'player';
  setStatus("Your turn!");
}

function promptSuitSelection() {
  console.log("🃏 Prompting for joker suit selection...");
  const suitOptions = [
    { suit: '♠', name: 'Spades' },
    { suit: '♥', name: 'Hearts' },
    { suit: '♦', name: 'Diamonds' },
    { suit: '♣', name: 'Clubs' }
  ];
  
  let selectedSuit = null;
  
  try {
    const suitText = suitOptions.map((s, i) => `${i + 1}. ${s.suit} ${s.name}`).join('\n');
    const choice = prompt(`Choose a suit for your Joker:\n${suitText}\n\nEnter 1-4 or the suit symbol:`);
    
    if (!choice) {
      setStatus("Joker play cancelled.");
      return false;
    }
    
    // Parse the choice
    if (choice === '1' || choice.includes('♠') || choice.toLowerCase().includes('spade')) {
      selectedSuit = '♠';
    } else if (choice === '2' || choice.includes('♥') || choice.toLowerCase().includes('heart')) {
      selectedSuit = '♥';
    } else if (choice === '3' || choice.includes('♦') || choice.toLowerCase().includes('diamond')) {
      selectedSuit = '♦';
    } else if (choice === '4' || choice.includes('♣') || choice.toLowerCase().includes('club')) {
      selectedSuit = '♣';
    } else {
      setStatus("Invalid choice. Joker play cancelled.");
      return false;
    }
  } catch (error) {
    // Fallback: automatically choose a random suit if prompt fails
    selectedSuit = suits[Math.floor(Math.random() * suits.length)];
    setStatus(`Joker played automatically. Suit chosen: ${selectedSuit}`);
  }
  
  game.discard.push({ rank: 'JOKER', suit: selectedSuit, joker: true });
  setStatus(`You played a Joker. Suit is now ${selectedSuit}`);
  return true;
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
  
  // Check if any selected cards are playable
  const playableCards = selectedCards.filter(card => isPlayable(card, topCard));

  if (playableCards.length === 0) {
    const topCardDisplay = topCard.joker ? `Joker (${topCard.suit})` : `${topCard.rank}${topCard.suit}`;
    setStatus(`Selected cards can't be played on ${topCardDisplay}`);
    console.log("❌ No playable cards in selection");
    return;
  }

  // Handle joker cards
  const jokerCard = playableCards.find(card => card.joker);
  if (jokerCard) {
    console.log("🃏 Playing joker card...");
    // Remove joker from hand first
    const jokerIndex = game.player.indexOf(jokerCard);
    game.player.splice(jokerIndex, 1);
    
    // Clear selection
    selected.clear();
    
    // Prompt for suit selection
    if (promptSuitSelection()) {
      renderAll();
      
      // Check for win
      if (game.player.length === 0) {
        setStatus("You win!");
        game.gameOver = true;
        return;
      }
      
      // Check last card rule
      if (game.player.length === 1 && !game.lastCardDeclared) {
        setStatus('You have one card left! Don\'t forget to declare "Last Card!"');
      }
      
      // Switch to AI turn
      game.current = 'aiTop';
      setTimeout(aiTakeTurn, 1000);
    } else {
      // If suit selection was cancelled, put the joker back
      game.player.splice(jokerIndex, 0, jokerCard);
      renderAll();
    }
    return;
  }

  // Handle regular cards
  console.log("🎴 Playing regular cards...");
  
  // Sort indices in descending order to remove from end first
  selectedIndices.sort((a, b) => b - a);
  
  // Play all selected playable cards
  playableCards.forEach(card => {
    game.discard.push(card);
    const cardIndex = game.player.indexOf(card);
    if (cardIndex !== -1) {
      game.player.splice(cardIndex, 1);
      console.log(`✅ Played: ${card.rank}${card.suit}`);
    }
  });

  // Clear selection
  selected.clear();
  
  // Update display
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
  }

  // Switch to AI turn
  game.current = 'aiTop';
  setStatus("AI's turn...");
  setTimeout(aiTakeTurn, 1000);
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
    if (game.deck.length === 0 || game.current !== 'player' || game.gameOver) return;
    const card = game.deck.pop();
    game.player.push(card);
    renderAll();
    setStatus("You drew a card.");
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
    if (game.deck.length === 0 || game.current !== 'player' || game.gameOver) return;
    const card = game.deck.pop();
    game.player.push(card);
    renderAll();
    setStatus("You drew a card.");
  });
  
  console.log("✅ All event listeners set up successfully!");
  console.log("🎮 Game ready to play!");
});
