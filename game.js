console.log("🎮 Backyard BlackJack - Clean Version with Dynamic Players");

// Card data
const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const rankValues = { "A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13 };

// AI name pool
const AI_NAMES = ["Trisha", "Mike", "Ahmed", "Aisha", "Carlos", "Yuki", "Sofia", "Raj", "Emma", "Omar"];

// Game state
const game = {
  players: [],
  currentPlayerIndex: 0,
  direction: 1, // 1 for clockwise, -1 for counter-clockwise
  deck: [],
  discard: [],
  selected: new Set(),
  gameOver: false,
  aiTurnInProgress: false,
  pendingPickup: 0,
  pendingPickupType: null,
  lastCardDeclared: false,
  eventCounter: 0
};

// UI elements
const UI = {
  setupPanel: document.getElementById("game-setup-panel"),
  playerCountSelect: document.getElementById("player-count-select"),
  startGameButton: document.getElementById("start-game-button"),
  gameArea: document.getElementById("game-area"),
  deckCard: document.getElementById("deck-card"),
  discardCard: document.getElementById("discard-card"),
  deckCount: document.getElementById("deck-count"),
  playerHand: document.getElementById("player-hand"),
  aiHandsContainer: document.getElementById("ai-hands-container"),
  avatarsContainer: document.getElementById("avatars-container"),
  status: document.getElementById("status"),
  eventLog: document.getElementById("event-log"),
  btnPlaySelected: document.getElementById("btn-play-selected"),
  btnClear: document.getElementById("btn-clear"),
  btnDraw: document.getElementById("btn-draw"),
  btnLastCard: document.getElementById("btn-last-card"),
  btnPlay: document.getElementById("btn-play"),
  btnRules: document.getElementById("btn-rules"),
  rulesPanel: document.getElementById("rules-panel"),
  logContent: document.getElementById("log-content"),
  logHeader: document.getElementById("log-header"),
};

// Create deck
function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Initialize players
function initializePlayers(playerCount) {
  game.players = [];
  
  // Add human player
  game.players.push({
    type: "human",
    name: "You",
    hand: [],
    position: "bottom"
  });
  
  // Add AI players with random names
  const aiNames = [...AI_NAMES].sort(() => Math.random() - 0.5);
  const positions = playerCount === 2 ? ["top"] : 
                    playerCount === 3 ? ["right", "top"] :
                    ["right", "top", "left"];
  
  for (let i = 0; i < playerCount - 1; i++) {
    game.players.push({
      type: "ai",
      name: aiNames[i],
      hand: [],
      position: positions[i]
    });
  }
}

// Start game
function startGame() {
  const playerCount = parseInt(UI.playerCountSelect.value);
  console.log(`🎮 Starting game with ${playerCount} players...`);
  
  // Hide setup panel, show game area
  UI.setupPanel.style.display = "none";
  UI.gameArea.style.display = "flex";
  
  // Initialize game state
  game.deck = createDeck();
  game.discard = [];
  game.currentPlayerIndex = 0;
  game.direction = 1;
  game.gameOver = false;
  game.aiTurnInProgress = false;
  game.pendingPickup = 0;
  game.pendingPickupType = null;
  game.lastCardDeclared = false;
  game.selected.clear();
  game.eventCounter = 0;
  
  // Initialize players
  initializePlayers(playerCount);
  
  // Deal cards
  for (let i = 0; i < 7; i++) {
    game.players.forEach(player => {
      player.hand.push(game.deck.pop());
    });
  }
  
  // Place first card on discard pile (avoid power cards)
  let firstCard;
  do {
    firstCard = game.deck.pop();
  } while (isPowerCard(firstCard));
  game.discard.push(firstCard);
  
  logEvent(`▶ New game started! Starting card: ${firstCard.rank}${firstCard.suit}`, "game");
  logEvent(`● ${playerCount} players: ${game.players.map(p => p.name).join(", ")}`, "game");
  
  renderAll();
  setStatus("Your turn! Match suit or rank, play runs, or use power cards.");
}

// Check if card is a power card
function isPowerCard(card) {
  return card.rank === "2" || card.rank === "J" || card.rank === "K" || 
         card.rank === "8" || card.rank === "A";
}

function isBlackJack(card) {
  return card.rank === "J" && (card.suit === "♠" || card.suit === "♣");
}

function isRedJack(card) {
  return card.rank === "J" && (card.suit === "♥" || card.suit === "♦");
}

// Check if card is playable
function isPlayable(card, topCard) {
  if (!card || !topCard) return false;
  if (card.rank === "A" || card.rank === "K") return true; // Aces and Kings can be played anytime
  return card.rank === topCard.rank || card.suit === topCard.suit;
}

// Check if cards form a valid run
function isValidRun(cards) {
  if (cards.length < 2) return false;
  const sorted = [...cards].sort((a, b) => rankValues[a.rank] - rankValues[b.rank]);
  for (let i = 1; i < sorted.length; i++) {
    if (rankValues[sorted[i].rank] !== rankValues[sorted[i-1].rank] + 1) {
      return false;
    }
  }
  return true;
}

// Render functions
function renderAll() {
  renderCenterStacks();
  renderPlayerHand();
  renderAIHands();
  renderAvatars();
  updateControls();
}

function renderCenterStacks() {
  UI.deckCount.textContent = game.deck.length;
  const topCard = game.discard[game.discard.length - 1];
  if (topCard) {
    UI.discardCard.innerHTML = cardHTML(topCard);
  }
}

function renderPlayerHand() {
  const player = game.players[0];
  UI.playerHand.innerHTML = "";
  
  player.hand.forEach((card, idx) => {
    const el = document.createElement("div");
    el.className = "card selectable";
    if (game.selected.has(idx)) {
      el.classList.add("selected");
    }
    el.innerHTML = cardHTML(card);
    el.addEventListener("click", () => toggleSelect(idx));
    UI.playerHand.appendChild(el);
  });
}

function renderAIHands() {
  UI.aiHandsContainer.innerHTML = "";
  
  game.players.slice(1).forEach((player, idx) => {
    const handDiv = document.createElement("div");
    handDiv.className = `ai-hand ai-${player.position}`;
    handDiv.style.position = "absolute";
    
    // Position based on player position
    if (player.position === "top") {
      handDiv.style.top = "20px";
      handDiv.style.left = "50%";
      handDiv.style.transform = "translateX(-50%)";
    } else if (player.position === "left") {
      handDiv.style.left = "20px";
      handDiv.style.top = "50%";
      handDiv.style.transform = "translateY(-50%) rotate(90deg)";
    } else if (player.position === "right") {
      handDiv.style.right = "20px";
      handDiv.style.top = "50%";
      handDiv.style.transform = "translateY(-50%) rotate(-90deg)";
    }
    
    // Render back of cards
    player.hand.forEach(() => {
      const cardEl = document.createElement("div");
      cardEl.className = "card back";
      cardEl.textContent = "🂠";
      cardEl.style.marginLeft = "-30px";
      handDiv.appendChild(cardEl);
    });
    
    UI.aiHandsContainer.appendChild(handDiv);
  });
}

function renderAvatars() {
  UI.avatarsContainer.innerHTML = "";
  
  game.players.forEach((player, idx) => {
    const avatar = document.createElement("div");
    avatar.className = `avatar pos-${player.position}`;
    if (idx === game.currentPlayerIndex) {
      avatar.classList.add("current-turn");
    }
    if (game.direction === -1) {
      avatar.classList.add("reverse");
    }
    
    const initial = player.name[0].toUpperCase();
    const cardCount = player.hand.length;
    
    avatar.innerHTML = `
      <div class="turn-arrow">➤</div>
      <div class="avatar-shape">${initial}</div>
      <div class="avatar-label">${player.name} • ${cardCount}</div>
    `;
    
    UI.avatarsContainer.appendChild(avatar);
  });
}

function cardHTML(card) {
  const isRed = card.suit === "♥" || card.suit === "♦";
  const suitClass = isRed ? "red" : "black";
  
  return `
    <div class="card-face">
      <div class="card-corners ${suitClass}">
        <span>${card.rank}</span><span>${card.suit}</span>
      </div>
      <div class="card-icon ${suitClass}">
        <span>${card.suit}</span>
      </div>
      <div class="card-corners ${suitClass}">
        <span>${card.suit}</span><span>${card.rank}</span>
      </div>
    </div>
  `;
}

// Toggle card selection
function toggleSelect(idx) {
  if (game.currentPlayerIndex !== 0 || game.gameOver || game.aiTurnInProgress) {
    return;
  }
  
  if (game.selected.has(idx)) {
    game.selected.delete(idx);
  } else {
    game.selected.add(idx);
  }
  
  renderPlayerHand();
  updateControls();
}

// Clear selection
function clearSelection() {
  game.selected.clear();
  renderPlayerHand();
  updateControls();
  setStatus("Selection cleared.");
}

// Update controls
function updateControls() {
  const hasSelection = game.selected.size > 0;
  const isPlayerTurn = game.currentPlayerIndex === 0;
  
  UI.btnPlaySelected.disabled = !hasSelection || !isPlayerTurn || game.aiTurnInProgress;
  UI.btnDraw.disabled = !isPlayerTurn || game.aiTurnInProgress;
  UI.btnClear.disabled = !hasSelection;
  UI.btnLastCard.disabled = game.gameOver;
}

// Get next player index
function getNextPlayerIndex() {
  const nextIndex = game.currentPlayerIndex + game.direction;
  if (nextIndex < 0) {
    return game.players.length - 1;
  } else if (nextIndex >= game.players.length) {
    return 0;
  }
  return nextIndex;
}

// Apply power card effects
function applyPowerCardEffect(card, playerName) {
  if (card.rank === "2") {
    game.pendingPickup += 2;
    game.pendingPickupType = "2";
    logEvent(`⚡ ${playerName} played a 2! Next player must pick up ${game.pendingPickup} cards or stack.`, "power");
  } else if (isBlackJack(card)) {
    game.pendingPickup += 6;
    game.pendingPickupType = "blackjack";
    logEvent(`⚡ ${playerName} played a Black Jack! Next player must pick up ${game.pendingPickup} cards or stack/cancel.`, "power");
  } else if (isRedJack(card)) {
    if (game.pendingPickupType === "blackjack") {
      game.pendingPickup = 0;
      game.pendingPickupType = null;
      logEvent(`⚡ ${playerName} played a Red Jack! Black Jack penalty cancelled.`, "power");
    }
  } else if (card.rank === "K") {
    game.direction *= -1;
    logEvent(`⚡ ${playerName} played a King! Direction reversed.`, "power");
  } else if (card.rank === "8") {
    // Skip will be handled in next turn
    logEvent(`⚡ ${playerName} played an 8! Next player's turn is skipped.`, "power");
  } else if (card.rank === "A") {
    logEvent(`⚡ ${playerName} played an Ace! Suit is now ${card.suit}.`, "power");
  }
}

// Play selected cards
function playSelectedCards() {
  if (game.currentPlayerIndex !== 0 || game.selected.size === 0 || game.gameOver) {
    return;
  }
  
  const player = game.players[0];
  const topCard = game.discard[game.discard.length - 1];
  const selectedIndices = [...game.selected].sort((a, b) => b - a);
  const selectedCards = selectedIndices.map(i => player.hand[i]);
  
  // Check if cards are playable
  if (selectedCards.length === 1) {
    const card = selectedCards[0];
    if (!isPlayable(card, topCard)) {
      setStatus(`Cannot play ${card.rank}${card.suit} on ${topCard.rank}${topCard.suit}`);
      return;
    }
    
    // Remove from hand and add to discard
    player.hand.splice(selectedIndices[0], 1);
    game.discard.push(card);
    game.selected.clear();
    
    logEvent(`● You played ${card.rank}${card.suit}`, "player-play");
    applyPowerCardEffect(card, "You");
    
  } else if (selectedCards.length > 1) {
    if (!isValidRun(selectedCards)) {
      setStatus("Selected cards don't form a valid run");
      return;
    }
    
    const sorted = [...selectedCards].sort((a, b) => rankValues[a.rank] - rankValues[b.rank]);
    if (!isPlayable(sorted[0], topCard)) {
      setStatus(`Cannot play run starting with ${sorted[0].rank}${sorted[0].suit}`);
      return;
    }
    
    // Remove cards and add to discard
    selectedIndices.forEach(idx => player.hand.splice(idx, 1));
    sorted.forEach(card => game.discard.push(card));
    game.selected.clear();
    
    logEvent(`● You played a run: ${sorted.map(c => c.rank + c.suit).join(", ")}`, "player-play");
  }
  
  // Check for win
  if (player.hand.length === 0) {
    setStatus("🏆 You win!");
    logEvent("🏆 You win the game!", "game");
    game.gameOver = true;
    renderAll();
    return;
  }
  
  // Move to next player
  game.currentPlayerIndex = getNextPlayerIndex();
  renderAll();
  
  // Start AI turn if next player is AI
  if (game.players[game.currentPlayerIndex].type === "ai") {
    setTimeout(() => aiTakeTurn(), 1500);
  } else {
    setStatus("Your turn!");
  }
}

// Draw card
function drawCard() {
  if (game.currentPlayerIndex !== 0 || game.gameOver || game.aiTurnInProgress) {
    return;
  }
  
  const player = game.players[0];
  
  if (game.pendingPickup > 0) {
    // Pick up penalty cards
    for (let i = 0; i < game.pendingPickup && game.deck.length > 0; i++) {
      player.hand.push(game.deck.pop());
    }
    logEvent(`● You picked up ${game.pendingPickup} penalty cards`, "penalty");
    game.pendingPickup = 0;
    game.pendingPickupType = null;
  } else {
    // Draw one card
    if (game.deck.length > 0) {
      player.hand.push(game.deck.pop());
      logEvent("● You drew a card", "player-play");
    }
  }
  
  // Move to next player
  game.currentPlayerIndex = getNextPlayerIndex();
  renderAll();
  
  if (game.players[game.currentPlayerIndex].type === "ai") {
    setTimeout(() => aiTakeTurn(), 1500);
  } else {
    setStatus("Your turn!");
  }
}

// AI take turn
function aiTakeTurn() {
  if (game.gameOver || game.aiTurnInProgress) {
    return;
  }
  
  game.aiTurnInProgress = true;
  const player = game.players[game.currentPlayerIndex];
  const topCard = game.discard[game.discard.length - 1];
  
  setStatus(`${player.name} is thinking...`);
  
  setTimeout(() => {
    // Find playable card
    const playableCard = player.hand.find(card => isPlayable(card, topCard));
    
    if (playableCard) {
      // Play the card
      const cardIndex = player.hand.indexOf(playableCard);
      player.hand.splice(cardIndex, 1);
      game.discard.push(playableCard);
      
      logEvent(`⚙ ${player.name} played ${playableCard.rank}${playableCard.suit}`, "ai-play");
      applyPowerCardEffect(playableCard, player.name);
      
      // Check for win
      if (player.hand.length === 0) {
        setStatus(`🏆 ${player.name} wins!`);
        logEvent(`🏆 ${player.name} wins the game!`, "game");
        game.gameOver = true;
        game.aiTurnInProgress = false;
        renderAll();
        return;
      }
    } else {
      // Draw a card
      if (game.deck.length > 0) {
        player.hand.push(game.deck.pop());
        logEvent(`⚙ ${player.name} drew a card`, "ai-play");
      }
    }
    
    // Move to next player
    game.currentPlayerIndex = getNextPlayerIndex();
    game.aiTurnInProgress = false;
    renderAll();
    
    if (game.players[game.currentPlayerIndex].type === "ai") {
      setTimeout(() => aiTakeTurn(), 1500);
    } else {
      setStatus("Your turn!");
    }
  }, 2000);
}

// Declare last card
function declareLastCard() {
  const player = game.players[0];
  if (player.hand.length === 1) {
    game.lastCardDeclared = true;
    logEvent("🗣️ You declared Last Card!", "player-play");
    setStatus("Last Card declared!");
  }
}

// Utility functions
function setStatus(text) {
  UI.status.textContent = text;
}

function logEvent(message, type = "info") {
  game.eventCounter++;
  const logEntry = document.createElement("div");
  logEntry.className = `log-entry ${type}`;
  logEntry.textContent = `#${game.eventCounter}: ${message}`;
  UI.eventLog.insertBefore(logEntry, UI.eventLog.firstChild);
  
  // Keep only last 50 entries
  while (UI.eventLog.children.length > 50) {
    UI.eventLog.removeChild(UI.eventLog.lastChild);
  }
}

// Event listeners
UI.startGameButton.addEventListener("click", startGame);
UI.btnPlay.addEventListener("click", () => {
  UI.setupPanel.style.display = "flex";
  UI.gameArea.style.display = "none";
});
UI.btnPlaySelected.addEventListener("click", playSelectedCards);
UI.btnClear.addEventListener("click", clearSelection);
UI.btnDraw.addEventListener("click", drawCard);
UI.btnLastCard.addEventListener("click", declareLastCard);
UI.btnRules.addEventListener("click", () => {
  UI.rulesPanel.style.display = UI.rulesPanel.style.display === "none" ? "block" : "none";
});
UI.logHeader.addEventListener("click", () => {
  UI.logContent.style.display = UI.logContent.style.display === "none" ? "block" : "none";
});

console.log("✅ Game initialized and ready!");
