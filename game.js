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
  current

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
  // Player hand (face-up)
  UI.playerHand.innerHTML = '';
  game.player.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = 'card selectable';
    el.innerHTML = cardHTML(card);
    el.addEventListener('click', () => toggleSelect(idx));
    UI.playerHand.appendChild(el);
  });

  // Top hand (fanned, face-down)
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

  // Left and right hands (stacked, face-down)
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
  UI.btnPlaySelected.disabled = selected.size === 0;
  const showLastCard = game.player.length === 1 && !game.lastCardDeclared;
  UI.btnLastCard.style.display = showLastCard ? 'inline-block' : 'none';
}

function cardHTML(card) {
  if (!card || card.joker) {
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
  UI.btnPlaySelected.addEventListener('click', () => {
    setStatus('Play logic not yet implemented.');
    clearSelection();
  });
  UI.btnDraw.addEventListener('click', () => {
    setStatus('Draw logic not yet implemented.');
  });
  UI.btnLastCard.addEventListener('click', () => {
    game.lastCardDeclared = true;
    setStatus('You declared “Last Card!”.');
    UI.btnLastCard.style.display = 'none';
  });
  UI.deckCard.addEventListener('click', () => {
    setStatus('Draw logic not yet implemented.');
  });
});
  
