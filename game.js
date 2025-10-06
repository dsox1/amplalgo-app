console.log("🎮 Backyard BlackJack - Updated with Run Detection and Cover Rules");

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const rankValues = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13 };



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
  direction: 1,
  gameOver: false,
  lastPlayedCard: null,
  lastPlayedBy: null,
  mustCoverQueen: false,
  mustCoverKing: false
};

function setStatus(text) {
  if (UI.status) UI.status.textContent = text;
}

function countActivePlayers() {
  let count = 0;
  if (game.player.length > 0) count++;
  if (game.aiTop.length > 0) count++;
  if (game.aiLeft.length > 0) count++;
  if (game.aiRight.length > 0) count++;
  return count;
}

function isPlayable(card, topCard) {
  if (!card || !topCard) return false;
  if (card.joker) return true;
  if (topCard.joker) return card.suit === topCard.suit;
  return card.rank === topCard.rank || card.suit === topCard.suit;
}

function isValidRun(cards) {
  if (cards.length < 2) return false;

  const allSameSuit = cards.every(card => card.suit === cards[0].suit);
  const allSameRank = cards.every(card => card.rank === cards[0].rank);

  if (allSameSuit) {
    const sorted = [...cards].sort((a, b) => rankValues[a.rank] - rankValues[b.rank]);
    for (let i = 1; i < sorted.length; i++) {
      if (rankValues[sorted[i].rank] !== rankValues[sorted[i - 1].rank] + 1) return false;
    }
    return true;
  }

  if (allSameRank) return true;

  const grouped = {};
  for (const card of cards) {
    if (!grouped[card.rank]) grouped[card.rank] = [];
    grouped[card.rank].push(card);
  }

  const ranksInOrder = Object.keys(grouped)
    .map(r => rankValues[r])
    .sort((a, b) => a - b);

  for (let i = 1; i < ranksInOrder.length; i++) {
    if (ranksInOrder[i] !== ranksInOrder[i - 1] + 1) return false;
  }

  return true;
}

function applyCoverRules(card) {
  if (card.rank === 'Q') {
    game.mustCoverQueen = true;
    setStatus("You must cover your Queen with a compatible card.");
  }

  if (card.rank === 'K' && countActivePlayers() === 2) {
    game.mustCoverKing = true;
    game.current = game.lastPlayedBy;
    setStatus("You must cover your King with a compatible card.");
  }
}


let selected = new Set();

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

function renderHands() {
  UI.playerHand.innerHTML = '';
  const scale = calculateCardScale(game.player.length);
  const spacing = calculateCardSpacing(game.player.length);

  game.player.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = 'card selectable';
    if (selected.has(idx)) el.classList.add('selected');
    el.innerHTML = cardHTML(card);
    el.style.transform = `scale(${scale})`;
    el.style.marginLeft = idx > 0 ? `${spacing}px` : '0';
    el.addEventListener('click', () => toggleSelect(idx));
    UI.playerHand.appendChild(el);
  });

  // AI hands
  renderAIHand(UI.aiTopHand, game.aiTop);
  renderAIHand(UI.aiLeftHand, game.aiLeft, 'vertical');
  renderAIHand(UI.aiRightHand, game.aiRight, 'vertical');
}

function renderAIHand(container, hand, orientation = 'horizontal') {
  container.innerHTML = '';
  const scale = calculateCardScale(hand.length);
  const spacing = calculateCardSpacing(hand.length);

  hand.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card back';
    el.textContent = '🂠';
    el.style.transform = `scale(${scale})`;
    if (orientation === 'vertical') {
      el.style.marginTop = i > 0 ? `${spacing}px` : '0';
    } else {
      el.style.marginLeft = i > 0 ? `${spacing}px` : '0';
    }
    container.appendChild(el);
  });
}

function toggleSelect(idx) {
  if (game.current !== 'player' || game.gameOver) return;
  if (selected.has(idx)) {
    selected.delete(idx);
  } else {
    selected.add(idx);
  }
  renderHands();
  updateControls();
}

function clearSelection() {
  selected.clear();
  renderHands();
  updateControls();
}

function updateControls() {
  UI.btnPlaySelected.disabled = selected.size === 0 || game.current !== 'player';
  UI.btnLastCard.disabled = game.gameOver;
}

function cardHTML(card) {
  if (!card || card.joker) {
    return `
      <div class="card-face">
        <div class="card-corners"><span>JOKER</span><span>${card?.suit || '★'}</span></div>
        <div class="card-icon"><span class="black">${card?.suit || '★'}</span></div>
        <div class="card-corners"><span>${card?.suit || '★'}</span><span>JOKER</span></div>
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



function promptJokerSelection() {
  const input = prompt(`Transform your Joker into any card:\n\nEnter: [RANK][SUIT]\nExample: AS (Ace of Spades), 10H (10 of Hearts), KC (King of Clubs)\n\nRanks: A,2–10,J,Q,K\nSuits: S(♠), H(♥), D(♦), C(♣)`);
  if (!input) return null;

  const clean = input.trim().toUpperCase();
  let rank, suitChar;

  if (clean.length === 2) {
    rank = clean[0];
    suitChar = clean[1];
  } else if (clean.length === 3 && clean.startsWith('10')) {
    rank = '10';
    suitChar = clean[2];
  } else {
    setStatus("Invalid format. Use AS, 10H, KC etc.");
    return null;
  }

  if (!ranks.includes(rank)) {
    setStatus("Invalid rank.");
    return null;
  }

  const suitMap = { S: '♠', H: '♥', D: '♦', C: '♣' };
  const suit = suitMap[suitChar];
  if (!suit) {
    setStatus("Invalid suit.");
    return null;
  }

  return { rank, suit };
}

function playSelectedCards() {
  if (game.current !== 'player' || selected.size === 0 || game.gameOver) return;

  const topCard = game.discard[game.discard.length - 1];
  const selectedIndices = [...selected];
  const selectedCards = selectedIndices.map(i => game.player[i]);

  // Queen cover enforcement
  if (game.mustCoverQueen) {
    const canCover = selectedCards.some(card => isPlayable(card, topCard));
    if (!canCover) {
      setStatus("You must cover your Queen with a compatible card.");
      return;
    }
    game.mustCoverQueen = false;
  }

  // King cover enforcement
  if (game.mustCoverKing) {
    const canCover = selectedCards.some(card => isPlayable(card, topCard));
    if (!canCover) {
      setStatus("You must cover your King with a compatible card.");
      return;
    }
    game.mustCoverKing = false;
  }

  // Run detection
  if (selectedCards.length > 1 && isValidRun(selectedCards)) {
    selectedIndices.sort((a, b) => b - a);
    selectedIndices.forEach(idx => game.player.splice(idx, 1));
    selectedCards.forEach(card => game.discard.push(card));
    game.lastPlayedCard = selectedCards[selectedCards.length - 1];
    game.lastPlayedBy = 'player';
    selected.clear();
    setStatus(`You played a run: ${selectedCards.map(c => `${c.rank}${c.suit}`).join(', ')}`);
    applyCoverRules(game.lastPlayedCard);
    renderAll();
    if (game.player.length === 0) {
      setStatus("You win!");
      game.gameOver = true;
      return;
    }
    game.current = getNextPlayer('player');
    return;
  }

  // Single card play
  const playableCards = selectedCards.filter(card => isPlayable(card, topCard));
  if (playableCards.length === 0) {
    setStatus("Selected cards can't be played.");
    return;
  }

  const cardToPlay = playableCards[0];
  const cardIndex = game.player.indexOf(cardToPlay);
  game.player.splice(cardIndex, 1);
  selected.clear();

  if (cardToPlay.joker) {
    const choice = promptJokerSelection();
    if (!choice) {
      game.player.splice(cardIndex, 0, cardToPlay);
      renderAll();
      return;
    }
    game.discard.push({ rank: choice.rank, suit: choice.suit, joker: true });
    game.lastPlayedCard = { rank: choice.rank, suit: choice.suit, joker: true };
  } else {
    game.discard.push(cardToPlay);
    game.lastPlayedCard = cardToPlay;
  }

  game.lastPlayedBy = 'player';
  applyCoverRules(game.lastPlayedCard);
  renderAll();

  if (game.player.length === 0) {
    setStatus("You win!");
    game.gameOver = true;
    return;
  }

  game.current = getNextPlayer('player');
}

function getNextPlayer(current) {
  const order = ['player', 'aiRight', 'aiTop', 'aiLeft'];
  const index = order.indexOf(current);
  const nextIndex = (index + game.direction + order.length) % order.length;
  return order[nextIndex];
}

function drawCard() {
  if (game.deck.length === 0 || game.current !== 'player' || game.gameOver) return;
  const card = game.deck.pop();
  game.player.push(card);
  renderAll();
  setStatus(`You drew ${card.rank}${card.suit}`);
}

function createDeck() {
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
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function startGame() {
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
    lastPlayedCard: null,
    lastPlayedBy: null,
    mustCoverQueen: false,
    mustCoverKing: false
  });

  selected.clear();

  for (let i = 0; i < settings.startingHand; i++) {
    game.player.push(game.deck.pop());
    game.aiTop.push(game.deck.pop());
    game.aiLeft.push(game.deck.pop());
    game.aiRight.push(game.deck.pop());
  }

  let top;
  do {
    top = game.deck.pop();
  } while (top && top.joker);
  game.discard.push(top || game.deck.pop());

  renderAll();
  setStatus('Your turn! Match suit or rank, play runs, or use power cards.');
}

document.addEventListener('DOMContentLoaded', () => {
  UI.btnPlay.addEventListener('click', startGame);
  UI.btnPlaySelected.addEventListener('click', playSelectedCards);
  UI.btnClear.addEventListener('click', clearSelection);
  UI.btnDraw.addEventListener('click', drawCard);
  UI.btnLastCard.addEventListener('click', () => {
    setStatus("You declared 'Last Card!'");
    UI.btnLastCard.disabled = true;
  });
  UI.deckCard.addEventListener('click', drawCard);
});
