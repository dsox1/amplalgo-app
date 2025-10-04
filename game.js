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

const aiNames = {
  aiTop: 'Trisha',
  aiLeft: 'Ahmed',
  aiRight: 'Aisha'
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
  players: ['player', 'aiRight', 'aiTop', 'aiLeft'],
  currentIndex: 0,
  direction: 1,
  current: 'player',
  lastCardDeclared: false,
  gameOver: false
};

function getPlayerName(id) {
  return id === 'player' ? 'You' : aiNames[id];
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
    currentIndex: 0,
    direction: 1,
    current: 'player',
    lastCardDeclared: false,
    gameOver: false
  });

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
  highlightCurrentPlayer(game.current);
  setStatus('Your turn! Match suit or rank, or play a power card.');
}

function nextTurn() {
  if (game.gameOver) return;
  game.currentIndex = (game.currentIndex + game.direction + game.players.length) % game.players.length;
  game.current = game.players[game.currentIndex];
  highlightCurrentPlayer(game.current);

  if (game.current === 'player') {
    setStatus("Your turn!");
  } else {
    setStatus(`${getPlayerName(game.current)}'s turn...`);
    setTimeout(() => aiTakeTurn(game.current), 1000);
  }
}

function highlightCurrentPlayer(id) {
  document.querySelectorAll('.turn-arrow').forEach(el => el.classList.remove('active'));
  const arrowId = {
    player: 'arrow-bottom',
    aiTop: 'arrow-top',
    aiLeft: 'arrow-left',
    aiRight: 'arrow-right'
  }[id];
  const arrowEl = document.getElementById(arrowId);
  if (arrowEl) {
    arrowEl.classList.add('active');
    arrowEl.style.backgroundImage = game.direction === 1
      ? "url('arrow-clockwise.svg')"
      : "url('arrow-counter.svg')";
  }
}

function setStatus(text) {
  UI.status.textContent = text;
}

function isPlayable(card, topCard) {
  if (!card || !topCard) return false;
  if (card.joker) return true;
  if (topCard.joker) return card.suit === topCard.suit;
  return card.rank === topCard.rank || card.suit === topCard.suit;
}

function aiTakeTurn(id) {
  const hand = game[id];
  const topCard = game.discard[game.discard.length - 1];
  const playable = hand.find(card => isPlayable(card, topCard));

  if (playable) {
    hand.splice(hand.indexOf(playable), 1);
    if (playable.joker) {
      const chosenSuit = suits[Math.floor(Math.random() * suits.length)];
      game.discard.push({ rank: 'JOKER', suit: chosenSuit, joker: true });
      setStatus(`${getPlayerName(id)} played a Joker. Suit is now ${chosenSuit}`);
    } else {
      game.discard.push(playable);
      setStatus(`${getPlayerName(id)} played ${playable.rank} of ${playable.suit}`);
      if (playable.rank === 'K') {
        game.direction *= -1;
        setStatus("Direction reversed!");
      }
    }
  } else if (game.deck.length > 0) {
    const drawn = game.deck.pop();
    hand.push(drawn);
    setStatus(`${getPlayerName(id)} drew a card.`);
  } else {
    setStatus(`${getPlayerName(id)} skipped turn.`);
  }

  renderAll();

  if (hand.length === 0) {
    setStatus(`${getPlayerName(id)} wins!`);
    game.gameOver = true;
    return;
  }

  nextTurn();
}

document.addEventListener('DOMContentLoaded', () => {
  UI.btnPlay.addEventListener('click', startGame);
  UI.btnClear.addEventListener('click', clearSelection);
  UI.btnDraw.addEventListener('click', drawCard);
  UI.btnLastCard.addEventListener('click', () => {
    game.lastCardDeclared = true;
    setStatus('You declared “Last Card!”.');
    UI.btnLastCard.style.display = 'none';
  });
  UI.btnPlaySelected.addEventListener('click', playSelectedCards);
  UI.deckCard.addEventListener('click', drawCard);
});
