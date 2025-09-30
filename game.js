const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const UI = {
  deckCard: document.getElementById('deck-card'),
  discardCard: document.getElementById('discard-card'),
  deckCount: document.getElementById('deck-count'),
  aiHand: document.getElementById('ai-hand'),
  playerHand: document.getElementById('player-hand'),
  aiCount: document.getElementById('ai-count'),
  playerCount: document.getElementById('player-count'),
  status: document.getElementById('status'),
  btnPlaySelected: document.getElementById('btn-play-selected'),
  btnClear: document.getElementById('btn-clear'),
  btnDraw: document.getElementById('btn-draw'),
  btnLastCard: document.getElementById('btn-last-card'),
  btnPlay: document.getElementById('btn-play')
};

const settings = {
  chaosMode: true,
  jokerEnabled: true,
  jokerCanMimicBlackJack: true,
  startingHand: 7,
  doubleDeck: false
};

const game = {
  deck: [],
  discard: [],
  player: [],
  ai: [],
  current: 'player',
  mustPickup: 0,
  penaltyType: '',
  lastCardDeclared: false,
  gameOver: false
};

function createDeck() {
  const deck = [];
  const copies = settings.doubleDeck ? 2 : 1;
  for (let c = 0; c < copies; c++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ rank, suit, joker: false });
      }
    }
    deck.push({ rank: 'JOKER', suit: '★', joker: true });
    deck.push({ rank: 'JOKER', suit: '☆', joker: true });
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
    ai: [],
    current: 'player',
    mustPickup: 0,
    penaltyType: '',
    lastCardDeclared: false,
    gameOver: false
  });

  for (let i = 0; i < settings.startingHand; i++) {
    game.player.push(game.deck.pop());
    game.ai.push(game.deck.pop());
  }

  let top;
  do {
    top = game.deck.pop();
  } while (top && ['JOKER', 'A', 'J', '2', '8', 'K'].includes(top.rank));
  game.discard.push(top || game.deck.pop());

  renderAll();
  setStatus('Your turn! Match suit or rank, or play a power card.');
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
  UI.aiCount.textContent = game.ai.length;
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

  UI.aiHand.innerHTML = '';
  game.ai.forEach(() => {
    const el = document.createElement('div');
    el.className = 'card back';
    el.textContent = '🂠';
    UI.aiHand.appendChild(el);
  });
}

let selected = new Set();

function toggleSelect(idx) {
  if (game.current !== 'player' || game.gameOver) return;
  const el = UI.playerHand.children[idx];
  if (selected.has(idx)) {
    selected.delete(idx);
    el.classList.remove('selected');
  } else {
    selected.add(idx);
    el.classList.add('selected');
  }
  updateControls();
}

function clearSelection() {
  selected.clear();
  [...UI.playerHand.children].forEach(el => el.classList.remove('selected'));
  updateControls();
}

function updateControls() {
  const canPlay = canPlaySelected();
  UI.btnPlaySelected.disabled = !canPlay;

  const showLastCard = game.current === 'player' &&
                       game.player.length === 1 &&
                       !game.lastCardDeclared;
  UI.btnLastCard.style.display = showLastCard ? 'inline-block' : 'none';
}

function canPlaySelected() {
  if (selected.size === 0) return false;
  const chosen = [...selected].map(i => game.player[i]);
  if (chosen.length === 1) return isPlayableSingle(chosen[0]);

  const r = chosen[0].rank;
  if (!chosen.every(c => c.rank === r)) return false;
  return isPlayableSingle(chosen[0]);
}

function isPlayableSingle(card) {
  const top = game.discard[game.discard.length - 1];
  if (card.joker) return true;
  if (card.rank === 'A') return true;
  if (card.suit === top.suit || card.rank === top.rank) return true;
  if (game.mustPickup > 0 && game.penaltyType === 'Black Jack' &&
      card.rank === 'J' && (card.suit === '♥' || card.suit === '♦')) return true;
  return false;
}

function playSelected() {
  if (!canPlaySelected() || game.current !== 'player' || game.gameOver) return;

  const indices = [...selected].sort((a, b) => b - a);
  const cards = indices.map(i => game.player[i]);
  let lastPlayed = null;

  indices.forEach(i => {
    const c = game.player[i];
    lastPlayed = c;
  });

  indices.forEach(i => game.player.splice(i, 1));
  cards.forEach(c => game.discard.push(c));

  applyCardEffects(lastPlayed, 'player');
  clearSelection();
  renderAll();

  if (game.player.length === 1 && !game.lastCardDeclared) {
    setStatus('Declare “Last Card!” now.');
    setTimeout(() => {
      if (!game.lastCardDeclared && game.player.length === 1) {
        setStatus('Penalty: you forgot “Last Card!” (+2 cards)');
        pickupCards('player', 2);
        renderAll();
      }
      if (!game.gameOver) setTimeout(aiTurn, 650);
    }, 1800);
    return;
  }

  if (game.player.length === 0) {
    setStatus('You win! 🎉');
    game.gameOver = true;
    return;
  }

  if (!game.gameOver) setTimeout(aiTurn, 650);
}

function applyCardEffects(card, actor) {
  if (!card) return;
  if (card.joker) {
    setStatus(`${actorText(actor)} played Joker (wild).`);
    return;
  }

  if (card.rank === 'A') {
    setStatus(`${actorText(actor)} played Ace — suit is now ${card.suit}.`);
    return;
  }

  if (card.rank === 'K') {
    setStatus(`${actorText(actor)} played King — reverse direction.`);
    return;
  }

  if (card.rank === '8') {
    setStatus(`${actorText(actor)} played 8 — next turn is skipped.`);
    skipNextTurn();
    return;
  }

  if (card.rank === '2') {
    game.mustPickup = 2;
    game.penaltyType = '2';
    setStatus(`${actorText(actor)} played 2 — next must pick up 2 or stack.`);
    return;
  }

  if (card.rank === 'J' && (card.suit === '♠' || card.suit === '♣')) {
    game.mustPickup = 6;
    game.penaltyType = 'Black Jack';
    setStatus(`${actorText(actor)} played Black Jack — next must pick up 6 or stack.`);
    return;
  }

  if (card.rank === 'J' && (card.suit === '♥' || card.suit === '♦')) {
    setStatus(`${actorText(actor)} played Red Jack.`);
    return;
  }

  setStatus(`${actorText(actor)} played ${card.rank}${card.suit}.`);
}

function actorText(actor) {
  return actor === 'player' ? 'You' : 'AI';
}

function drawCard() {
  if (game.current !== 'player' || game.gameOver) return;

  if (game.mustPickup > 0) {
    pickupCards('player', game.mustPickup);
    game.mustPickup = 0;
    game.penaltyType = '';
    setStatus(`You picked up penalty cards.`);
    renderAll();
    setTimeout(aiTurn, 650);
    return;
  }

  if (game.deck.length > 0) {
    game.player.push(game.deck.pop());
    setStatus('You drew a card.');
    renderAll();
  } else {
    setStatus('Deck empty.');
  }
}

function pickupCards(who, count) {
  for (let i = 0; i < count; i++) {
    const drawFrom = game.deck.length ? game.deck : recycleDiscardIntoDeck();
    if (!drawFrom.length) break;
    const card = drawFrom.pop();
    if (who === 'player') game.player.push(card);
    else game.ai.push(card);
  }
}

function recycleDiscardIntoDeck() {
  const keep = game.discard.pop();
  const pool = game.discard;
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  game.discard = [keep];
  game.deck = pool;
  return game.deck;
}

function declareLastCard() {
  if (game.player.length === 1) {
    game.lastCardDeclared = true;
    setStatus('You declared “Last Card!”.');
    UI.btnLastCard.style.display = 'none';
  }
}

function skipNextTurn() {
  if (game.current === 'player') {
    setTimeout(() => {
      setStatus('AI skipped. Your turn again.');
      game.current = 'player';
      renderAll();
    }, 500);
  } else {
    setStatus('Your turn was skipped.');
  }
}

function aiTurn() {
  if (game.gameOver) return;
  game.current = 'ai';
  setStatus('AI is thinking...');
  renderAll();

  setTimeout(() => {
    if (game.mustPickup > 0) {
      const move = aiFindPenaltyMove();
      if (move) {
        const idx = move.idx;
        const card = game.ai.splice(idx, 1)[0];
        resolvePenaltyPlay(card, 'ai');
        game.discard.push(card);
        renderAll();
      } else {
        pickupCards('ai', game.mustPickup);
        setStatus(`AI picked up ${game.mustPickup} penalty cards.`);
        game.mustPickup = 0;
        game.penaltyType = '';
        renderAll();
      }
      game.current = 'player';
      endChecks();
      return;
    }

    const top = game.discard[game.discard.length - 1];
    const choice = aiFindPlayable(top);
    if (choice !== null) {
      const card = game.ai.splice(choice, 1)[0];
      game.discard.push(card);
      applyCardEffects(card, 'ai');
      renderAll();

      if (game.ai.length === 1) {
        // AI internally declares Last Card
      }
      if (game.ai.length === 0) {
        setStatus('AI wins! ⚡');
        game.gameOver = true;
        return;
      }
    } else {
      if (game.deck.length > 0) {
        game.ai.push(game.deck.pop());
        setStatus('AI drew a card.');
        renderAll();
      } else {
        setStatus('AI passes (deck empty).');
      }
    }

    game.current = 'player';
    endChecks();
  }, 600);
}

function endChecks() {
  const top = game.discard[game.discard.length - 1];
  if (top && top.rank === '8' && game.current === 'player') {
    setStatus('Your turn was skipped by 8.');
    setTimeout(aiTurn, 600);
    return;
  }
  updateControls();
}

function aiFindPenaltyMove() {
  for (let i = 0; i < game.ai.length; i++) {
    const c = game.ai[i];
    if (canStackPenalty(c)) return { idx: i };
    if (settings.jokerEnabled && c.joker) return { idx: i };
  }
  return null;
}

function aiFindPlayable(top) {
  for (let i = 0; i < game.ai.length; i++) {
    const c = game.ai[i];
    if (c.rank === 'A' || (settings.jokerEnabled && c.joker)) return i;
  }
  for (let i = 0; i < game.ai.length; i++) {
    const c = game.ai[i];
    if (!c.joker && c.suit === top.suit) return i;
  }
  for (let i = 0; i < game.ai.length; i++) {
    const c = game.ai[i];
    if (!c.joker && c.rank === top.rank) return i;
  }
  for (let i = 0; i < game.ai.length; i++) {
    const c = game.ai[i];
    if (!c.joker && c.rank === 'J' && (c.suit === '♠' || c.suit === '♣')) {
      if (isPlayableSingle(c)) return i;
    }
  }
  return null;
}

function resolvePenaltyPlay(card, actor) {
  if (settings.jokerEnabled && card.joker) {
    if (game.penaltyType === 'Black Jack' && !settings.jokerCanMimicBlackJack) {
      game.mustPickup = 0; game.penaltyType = '';
      setStatus(`${actorText(actor)} played Joker (cancel Black Jack).`);
      return;
    }
    if (game.penaltyType === '2') {
      game.mustPickup += 2;
      setStatus(`${actorText(actor)} played Joker (stack +2). Total ${game.mustPickup}.`);
      return;
    }
    if (game.penaltyType === 'Black Jack') {
      game.mustPickup += 6;
      setStatus(`${actorText(actor)} played Joker (stack +6). Total ${game.mustPickup}.`);
      return;
    }
  }

  if (game.penaltyType === '2' && card.rank === '2') {
    game.mustPickup += 2;
    setStatus(`${actorText(actor)} stacked 2. Total pickup ${game.mustPickup}.`);
    return;
  }
  if (game.penaltyType === 'Black Jack') {
    if (card.rank === 'J' && (card.suit === '♠' || card.suit === '♣')) {
      game.mustPickup += 6;
      setStatus(`${actorText(actor)} stacked Black Jack. Total pickup ${game.mustPickup}.`);
      return;
    }
    if (card.rank === 'J' && (card.suit === '♥' || card.suit === '♦')) {
      game.mustPickup = 0; game.penaltyType = '';
      setStatus(`${actorText(actor)} played Red Jack — penalty cancelled.`);
      return;
    }
  }
}

function cardHTML(card) {
  if (!card) return '--';
  if (card.joker) {
    return `
      <div class="card-face">
        <div class="card-corners"><span>JOKER</span><span>★</span></div>
        <div class="card-icon"><span class="black">?</span></div>
        <div class="card-corners"><span>☆</span><span>JOKER</span></div>
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

function setStatus(text) {
  UI.status.textContent = text;
}

document.addEventListener('DOMContentLoaded', () => {
  setStatus('Welcome! Tap Play to start.');
  UI.btnPlay.addEventListener('click', startGame);
  UI.btnClear.addEventListener('click', clearSelection);
  UI.btnPlaySelected.addEventListener('click', playSelected);
  UI.btnDraw.addEventListener('click', drawCard);
  UI.btnLastCard.addEventListener('click', declareLastCard);
  UI.deckCard.addEventListener('click', drawCard);
});
