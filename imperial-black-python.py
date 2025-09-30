#!/usr/bin/env python3
"""
Imperial Black Card Game - Python Translation
A complete implementation of the Imperial Black card game in Python using Pygame.
"""

import pygame
import random
import sys
from enum import Enum
from typing import List, Optional, Tuple
from dataclasses import dataclass

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 1200
SCREEN_HEIGHT = 800
FPS = 60

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 128, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
GOLD = (255, 215, 0)
BROWN = (139, 69, 19)
SKY_BLUE = (135, 206, 235)
GRASS_GREEN = (34, 139, 34)
DARK_GREEN = (13, 80, 22)

# Fonts
font_large = pygame.font.Font(None, 48)
font_medium = pygame.font.Font(None, 32)
font_small = pygame.font.Font(None, 24)

class Suit(Enum):
    SPADES = "♠"
    CLUBS = "♣"
    HEARTS = "♥"
    DIAMONDS = "♦"

class Rank(Enum):
    TWO = "2"
    THREE = "3"
    FOUR = "4"
    FIVE = "5"
    SIX = "6"
    SEVEN = "7"
    EIGHT = "8"
    NINE = "9"
    TEN = "10"
    JACK = "J"
    QUEEN = "Q"
    KING = "K"
    ACE = "A"

@dataclass
class Card:
    suit: Suit
    rank: Rank
    
    @property
    def id(self) -> str:
        return f"{self.suit.value}-{self.rank.value}"
    
    @property
    def is_red(self) -> bool:
        return self.suit in [Suit.HEARTS, Suit.DIAMONDS]
    
    @property
    def is_black_jack(self) -> bool:
        return self.rank == Rank.JACK and self.suit in [Suit.SPADES, Suit.CLUBS]
    
    @property
    def is_power_card(self) -> bool:
        return (self.rank == Rank.TWO or 
                self.is_black_jack or 
                self.rank == Rank.EIGHT or 
                self.rank == Rank.ACE)

class GameState(Enum):
    HOME = "home"
    RULES = "rules"
    GAME = "game"

class Player(Enum):
    HUMAN = "human"
    AI = "ai"

class ImperialBlackGame:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Imperial Black - Backyard Edition")
        self.clock = pygame.time.Clock()
        
        # Game state
        self.state = GameState.HOME
        self.deck: List[Card] = []
        self.player_hand: List[Card] = []
        self.ai_hand: List[Card] = []
        self.discard_pile: List[Card] = []
        self.current_player = Player.HUMAN
        self.selected_cards: List[Card] = []
        self.last_card_declared = False
        self.must_pickup_cards = 0
        self.game_message = ""
        self.game_over = False
        self.winner: Optional[Player] = None
        
        # UI elements
        self.card_width = 70
        self.card_height = 98
        self.card_spacing = 6
        
    def create_deck(self) -> List[Card]:
        """Create and shuffle a standard 52-card deck."""
        deck = []
        for suit in Suit:
            for rank in Rank:
                deck.append(Card(suit, rank))
        
        random.shuffle(deck)
        return deck
    
    def start_new_game(self):
        """Initialize a new game."""
        self.deck = self.create_deck()
        self.player_hand = [self.deck.pop() for _ in range(7)]
        self.ai_hand = [self.deck.pop() for _ in range(7)]
        self.discard_pile = [self.deck.pop()]
        self.current_player = Player.HUMAN
        self.selected_cards = []
        self.last_card_declared = False
        self.must_pickup_cards = 0
        self.game_message = "Game Started! Match suit or rank, or play power cards!"
        self.game_over = False
        self.winner = None
        self.state = GameState.GAME
    
    def can_play_card(self, card: Card, top_card: Card, selected_cards: List[Card] = None) -> bool:
        """Check if a card can be played."""
        if selected_cards is None:
            selected_cards = []
        
        # Basic matching rules
        if (card.suit == top_card.suit or 
            card.rank == top_card.rank or 
            card.rank == Rank.ACE):
            return True
        
        # If cards are already selected, check for runs
        if selected_cards:
            first_selected = selected_cards[0]
            
            # Same rank run (traditional)
            if card.rank == first_selected.rank:
                return True
            
            # Suit following for face cards (K, Q can be followed by same suit)
            if (first_selected.rank in [Rank.KING, Rank.QUEEN] and 
                card.suit == first_selected.suit):
                return True
            
            # Continue suit sequence if already started
            if len(selected_cards) > 1:
                all_same_suit = all(c.suit == first_selected.suit for c in selected_cards)
                if all_same_suit and card.suit == first_selected.suit:
                    return True
        
        return False
    
    def contains_power_card(self, cards: List[Card]) -> bool:
        """Check if any card in the list is a power card that causes penalties."""
        return any(card.rank == Rank.TWO or card.is_black_jack for card in cards)
    
    def play_selected_cards(self):
        """Play the currently selected cards."""
        if (not self.selected_cards or 
            self.current_player != Player.HUMAN or 
            self.must_pickup_cards > 0):
            return
        
        top_card = self.discard_pile[-1]
        first_card = self.selected_cards[0]
        
        # Check if first card can be played
        if not self.can_play_card(first_card, top_card):
            self.game_message = f"Cannot play {first_card.rank.value}{first_card.suit.value} - doesn't match {top_card.rank.value}{top_card.suit.value}"
            self.selected_cards = []
            return
        
        # Remove selected cards from hand
        for card in self.selected_cards:
            if card in self.player_hand:
                self.player_hand.remove(card)
        
        # Add cards to discard pile
        self.discard_pile.extend(self.selected_cards)
        last_played_card = self.selected_cards[-1]
        
        # Check for win
        if len(self.player_hand) == 0:
            self.game_over = True
            self.winner = Player.HUMAN
            self.game_message = "⭐ CONGRATULATIONS! YOU WIN! ⭐"
            self.selected_cards = []
            return
        
        # Check last card rule
        if len(self.player_hand) == 1 and not self.last_card_declared:
            # Penalty for not declaring last card - pick up 2 cards
            penalty_cards = []
            for _ in range(min(2, len(self.deck))):
                if self.deck:
                    penalty_cards.append(self.deck.pop())
            
            self.player_hand.extend(penalty_cards)
            self.game_message = "⚠️ Penalty! You must declare 'Last Card!' - Picked up 2 cards!"
            self.selected_cards = []
            return
        
        # Handle power cards - only if not covered by run
        ai_penalty = 0
        if len(self.selected_cards) == 1:
            # Single card - normal power card rules apply
            if last_played_card.rank == Rank.TWO:
                ai_penalty = 2
            elif last_played_card.is_black_jack:
                ai_penalty = 5
        else:
            # Multiple cards (run) - power cards are covered, no penalty
            if self.contains_power_card(self.selected_cards):
                ai_penalty = 0  # Power cards in run are covered
        
        cards_played = len(self.selected_cards)
        self.game_message = (f"You played a run of {cards_played} cards!" if cards_played > 1 
                           else f"You played {last_played_card.rank.value}{last_played_card.suit.value}")
        
        if ai_penalty > 0:
            self.game_message += f" - AI must pick up {ai_penalty}!"
        elif cards_played > 1 and self.contains_power_card(self.selected_cards):
            self.game_message += " Power cards covered!"
        
        self.selected_cards = []
        self.last_card_declared = False
        self.current_player = Player.AI
        
        # Schedule AI turn
        pygame.time.set_timer(pygame.USEREVENT + 1, 1500)  # AI turn in 1.5 seconds
        
    def ai_turn(self, pickup_penalty: int = 0):
        """Execute AI turn."""
        if self.game_over:
            return
        
        # Handle pickup penalty first - AI MUST pick up cards
        if pickup_penalty > 0:
            penalty_cards = []
            for _ in range(min(pickup_penalty, len(self.deck))):
                if self.deck:
                    penalty_cards.append(self.deck.pop())
            
            self.ai_hand.extend(penalty_cards)
            self.current_player = Player.HUMAN
            self.game_message = f"AI picked up {pickup_penalty} cards! Your turn."
            return
        
        top_card = self.discard_pile[-1]
        playable_cards = [card for card in self.ai_hand 
                         if (card.suit == top_card.suit or 
                             card.rank == top_card.rank or 
                             card.rank == Rank.ACE)]
        
        if playable_cards:
            card_to_play = playable_cards[0]
            self.ai_hand.remove(card_to_play)
            self.discard_pile.append(card_to_play)
            
            # Check if AI played a power card that affects player
            player_penalty = 0
            if card_to_play.rank == Rank.TWO:
                player_penalty = 2
            elif card_to_play.is_black_jack:
                player_penalty = 5
            
            if len(self.ai_hand) == 0:
                self.game_over = True
                self.winner = Player.AI
                self.game_message = "⚡ AI WINS! Better luck next time!"
            else:
                self.game_message = f"AI played {card_to_play.rank.value}{card_to_play.suit.value}"
                if player_penalty > 0:
                    self.game_message += f" - You must pick up {player_penalty} cards!"
                    self.must_pickup_cards = player_penalty
            
            self.current_player = Player.HUMAN
        else:
            # AI draws a card
            if self.deck:
                drawn_card = self.deck.pop()
                self.ai_hand.append(drawn_card)
                self.game_message = "AI drew a card"
            else:
                self.game_message = "Deck empty! AI passes turn."
            
            self.current_player = Player.HUMAN
    
    def select_card(self, card_index: int):
        """Select or deselect a card."""
        if (self.current_player != Player.HUMAN or 
            self.game_over or 
            self.must_pickup_cards > 0 or
            card_index >= len(self.player_hand)):
            return
        
        card = self.player_hand[card_index]
        
        if card in self.selected_cards:
            # Deselect card
            self.selected_cards.remove(card)
        else:
            top_card = self.discard_pile[-1]
            
            # Check if card can be added to current selection
            if self.can_play_card(card, top_card, self.selected_cards):
                self.selected_cards.append(card)
            else:
                # Start new selection if card can be played alone
                if self.can_play_card(card, top_card, []):
                    self.selected_cards = [card]
                else:
                    self.game_message = f"Cannot play {card.rank.value}{card.suit.value} - doesn't match"
    
    def clear_selection(self):
        """Clear all selected cards."""
        self.selected_cards = []
        self.game_message = "Selection cleared"
    
    def draw_card(self):
        """Draw a card from the deck."""
        if (self.current_player != Player.HUMAN or 
            not self.deck or 
            self.game_over):
            return
        
        # If player must pick up penalty cards, force them to pick up the required amount
        if self.must_pickup_cards > 0:
            self.forced_pickup_cards()
            return
        
        drawn_card = self.deck.pop()
        self.player_hand.append(drawn_card)
        self.current_player = Player.AI
        self.game_message = f"You drew {drawn_card.rank.value}{drawn_card.suit.value}"
        
        # Schedule AI turn
        pygame.time.set_timer(pygame.USEREVENT + 1, 1500)
    
    def forced_pickup_cards(self):
        """Force player to pick up penalty cards."""
        if self.must_pickup_cards == 0:
            return
        
        penalty_cards = []
        cards_to_pickup = min(self.must_pickup_cards, len(self.deck))
        
        for _ in range(cards_to_pickup):
            if self.deck:
                penalty_cards.append(self.deck.pop())
        
        self.player_hand.extend(penalty_cards)
        self.game_message = f"You picked up {cards_to_pickup} penalty cards!"
        self.must_pickup_cards = 0
        self.current_player = Player.AI
        
        # Schedule AI turn
        pygame.time.set_timer(pygame.USEREVENT + 1, 1500)
    
    def declare_last_card(self):
        """Declare last card."""
        self.last_card_declared = True
        self.game_message = "📢 'LAST CARD!' declared!"
    
    def cancel_last_card(self):
        """Cancel last card declaration."""
        self.last_card_declared = False
        self.game_message = "Last card declaration cancelled"
    
    def draw_card_sprite(self, surface: pygame.Surface, card: Optional[Card], 
                        x: int, y: int, is_back: bool = False, 
                        is_selected: bool = False, is_playable: bool = False):
        """Draw a card sprite."""
        # Card background
        card_rect = pygame.Rect(x, y, self.card_width, self.card_height)
        
        if is_back:
            pygame.draw.rect(surface, (26, 54, 93), card_rect)
            pygame.draw.rect(surface, BLACK, card_rect, 2)
            # Draw card back symbol
            back_text = font_medium.render("🂠", True, GOLD)
            text_rect = back_text.get_rect(center=card_rect.center)
            surface.blit(back_text, text_rect)
        elif card:
            pygame.draw.rect(surface, WHITE, card_rect)
            
            # Card border
            border_color = GOLD if is_selected else (YELLOW if is_playable else BLACK)
            border_width = 3 if is_selected else (2 if is_playable else 2)
            pygame.draw.rect(surface, border_color, card_rect, border_width)
            
            # Card text
            color = RED if card.is_red else BLACK
            rank_text = font_small.render(card.rank.value, True, color)
            suit_text = font_medium.render(card.suit.value, True, color)
            
            # Position text
            rank_rect = rank_text.get_rect()
            rank_rect.topleft = (x + 5, y + 5)
            surface.blit(rank_text, rank_rect)
            
            suit_rect = suit_text.get_rect(center=(x + self.card_width // 2, y + self.card_height // 2))
            surface.blit(suit_text, suit_rect)
        else:
            # Empty card slot
            pygame.draw.rect(surface, (200, 200, 200), card_rect)
            pygame.draw.rect(surface, BLACK, card_rect, 2)
            empty_text = font_small.render("Empty", True, (100, 100, 100))
            text_rect = empty_text.get_rect(center=card_rect.center)
            surface.blit(empty_text, text_rect)
    
    def draw_button(self, surface: pygame.Surface, text: str, x: int, y: int, 
                   width: int, height: int, color: Tuple[int, int, int], 
                   text_color: Tuple[int, int, int] = WHITE) -> pygame.Rect:
        """Draw a button and return its rect."""
        button_rect = pygame.Rect(x, y, width, height)
        pygame.draw.rect(surface, color, button_rect)
        pygame.draw.rect(surface, BLACK, button_rect, 2)
        
        button_text = font_small.render(text, True, text_color)
        text_rect = button_text.get_rect(center=button_rect.center)
        surface.blit(button_text, text_rect)
        
        return button_rect
    
    def draw_home_screen(self):
        """Draw the home screen."""
        # Sky to grass gradient background
        for y in range(SCREEN_HEIGHT):
            if y < SCREEN_HEIGHT * 0.4:
                # Sky
                color = SKY_BLUE
            else:
                # Grass
                color = GRASS_GREEN
            pygame.draw.line(self.screen, color, (0, y), (SCREEN_WIDTH, y))
        
        # Clouds
        pygame.draw.ellipse(self.screen, WHITE, (100, 50, 80, 40))
        pygame.draw.ellipse(self.screen, WHITE, (SCREEN_WIDTH - 180, 80, 100, 50))
        
        # Houses silhouette (simplified)
        house_points = [(0, SCREEN_HEIGHT * 0.25), (50, SCREEN_HEIGHT * 0.2), 
                       (150, SCREEN_HEIGHT * 0.22), (250, SCREEN_HEIGHT * 0.18),
                       (350, SCREEN_HEIGHT * 0.2), (450, SCREEN_HEIGHT * 0.16),
                       (550, SCREEN_HEIGHT * 0.18), (650, SCREEN_HEIGHT * 0.14),
                       (750, SCREEN_HEIGHT * 0.16), (850, SCREEN_HEIGHT * 0.12),
                       (950, SCREEN_HEIGHT * 0.14), (SCREEN_WIDTH, SCREEN_HEIGHT * 0.16),
                       (SCREEN_WIDTH, SCREEN_HEIGHT * 0.4), (0, SCREEN_HEIGHT * 0.4)]
        pygame.draw.polygon(self.screen, (47, 79, 79), house_points)
        
        # Main title
        title1 = font_large.render("Backyard", True, GOLD)
        title2 = font_large.render("Black Jack", True, GOLD)
        chaos_mode = font_medium.render("CHAOS MODE", True, GOLD)
        
        title1_rect = title1.get_rect(center=(SCREEN_WIDTH // 2, 150))
        title2_rect = title2.get_rect(center=(SCREEN_WIDTH // 2, 200))
        chaos_rect = chaos_mode.get_rect(center=(SCREEN_WIDTH // 2, 250))
        
        self.screen.blit(title1, title1_rect)
        self.screen.blit(title2, title2_rect)
        
        # Chaos mode banner
        pygame.draw.rect(self.screen, BLACK, (chaos_rect.x - 20, chaos_rect.y - 10, 
                                            chaos_rect.width + 40, chaos_rect.height + 20))
        pygame.draw.rect(self.screen, GOLD, (chaos_rect.x - 20, chaos_rect.y - 10, 
                                           chaos_rect.width + 40, chaos_rect.height + 20), 3)
        self.screen.blit(chaos_mode, chaos_rect)
        
        # Billboards
        # Left billboard
        left_billboard = pygame.Rect(50, 180, 180, 120)
        pygame.draw.rect(self.screen, GOLD, left_billboard)
        pygame.draw.rect(self.screen, BROWN, left_billboard, 6)
        
        play_text = font_medium.render("PLAY NOW!", True, (139, 0, 0))
        win_text = font_small.render("Win Big! 🎰 Casino", True, BLACK)
        play_rect = play_text.get_rect(center=(left_billboard.centerx, left_billboard.centery - 20))
        win_rect = win_text.get_rect(center=(left_billboard.centerx, left_billboard.centery + 20))
        self.screen.blit(play_text, play_rect)
        self.screen.blit(win_text, win_rect)
        
        # Right billboard
        right_billboard = pygame.Rect(SCREEN_WIDTH - 230, 180, 180, 120)
        pygame.draw.rect(self.screen, (138, 43, 226), right_billboard)
        pygame.draw.rect(self.screen, BROWN, right_billboard, 6)
        
        upgrade_text = font_medium.render("UPGRADE NOW!", True, GOLD)
        premium_text = font_small.render("⭐ Premium BONUS", True, GOLD)
        upgrade_rect = upgrade_text.get_rect(center=(right_billboard.centerx, right_billboard.centery - 20))
        premium_rect = premium_text.get_rect(center=(right_billboard.centerx, right_billboard.centery + 20))
        self.screen.blit(upgrade_text, upgrade_rect)
        self.screen.blit(premium_text, premium_rect)
        
        # Buttons
        self.play_button = self.draw_button(self.screen, "💎 PLAY GAME", 
                                          SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT - 200,
                                          200, 50, GREEN)
        
        self.rules_button = self.draw_button(self.screen, "📖 HOW TO PLAY",
                                           SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT - 130,
                                           200, 40, BLUE)
    
    def draw_rules_screen(self):
        """Draw the rules screen."""
        self.screen.fill(WHITE)
        
        # Title
        title = font_large.render("How to Play Imperial Black", True, BLACK)
        title_rect = title.get_rect(center=(SCREEN_WIDTH // 2, 50))
        self.screen.blit(title, title_rect)
        
        # Rules text (simplified for space)
        rules = [
            "🎯 OBJECTIVE: Be the first to discard all your cards!",
            "",
            "💎 HOW TO PLAY:",
            "• Match suit or rank of the top card",
            "• Click cards to select (yellow glow), then play",
            "• Play runs - multiple cards of same rank",
            "• Play suit sequences - K♥ → 5♥ → 4♥ → 3♥",
            "• Declare 'Last Card!' when you have one card left",
            "",
            "💥 POWER CARDS:",
            "• Ace (A): Wild card - can be played on any card",
            "• 2: Next player picks up 2 cards",
            "• Black Jack (J♠/J♣): Next player picks up 5 cards",
            "• 8: Skip next player's turn",
            "",
            "🛡️ RUNS PROTECT POWER CARDS:",
            "If you play a power card as part of a run, it's covered!",
            "",
            "⚠️ LAST CARD RULE:",
            "Must declare 'Last Card!' or pick up 2 penalty cards!"
        ]
        
        y_offset = 120
        for rule in rules:
            if rule:  # Skip empty lines
                rule_text = font_small.render(rule, True, BLACK)
                self.screen.blit(rule_text, (50, y_offset))
            y_offset += 25
        
        # Back button
        self.back_button = self.draw_button(self.screen, "🏠 Back to Menu",
                                          SCREEN_WIDTH // 2 - 75, SCREEN_HEIGHT - 80,
                                          150, 40, (108, 117, 125))
    
    def draw_game_screen(self):
        """Draw the game screen."""
        # Sky to grass gradient background
        for y in range(SCREEN_HEIGHT):
            if y < SCREEN_HEIGHT * 0.35:
                color = SKY_BLUE
            else:
                color = GRASS_GREEN
            pygame.draw.line(self.screen, color, (0, y), (SCREEN_WIDTH, y))
        
        # Game title
        title = font_medium.render("Backyard Black Jack - CHAOS MODE", True, GOLD)
        title_rect = title.get_rect(center=(SCREEN_WIDTH // 2, 30))
        
        # Title background
        pygame.draw.rect(self.screen, BLACK, (title_rect.x - 10, title_rect.y - 5,
                                            title_rect.width + 20, title_rect.height + 10))
        pygame.draw.rect(self.screen, GOLD, (title_rect.x - 10, title_rect.y - 5,
                                           title_rect.width + 20, title_rect.height + 10), 2)
        self.screen.blit(title, title_rect)
        
        # Game message
        if self.game_message:
            message_text = font_small.render(self.game_message, True, WHITE)
            message_rect = pygame.Rect(SCREEN_WIDTH // 2 - 200, 70, 400, 30)
            pygame.draw.rect(self.screen, BLACK, message_rect)
            pygame.draw.rect(self.screen, GOLD, message_rect, 2)
            text_rect = message_text.get_rect(center=message_rect.center)
            self.screen.blit(message_text, text_rect)
        
        # Game table (oval)
        table_center = (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
        table_rect = pygame.Rect(table_center[0] - 200, table_center[1] - 125, 400, 250)
        pygame.draw.ellipse(self.screen, DARK_GREEN, table_rect)
        pygame.draw.ellipse(self.screen, BROWN, table_rect, 12)
        
        # Penalty counter
        if self.must_pickup_cards > 0:
            penalty_rect = pygame.Rect(table_center[0] - 300, table_center[1] - 50, 80, 100)
            pygame.draw.rect(self.screen, RED, penalty_rect)
            pygame.draw.rect(self.screen, GOLD, penalty_rect, 3)
            
            penalty_text1 = font_small.render("⚠️ PENALTY ⚠️", True, WHITE)
            penalty_text2 = font_small.render("Pick up", True, WHITE)
            penalty_text3 = font_large.render(str(self.must_pickup_cards), True, WHITE)
            penalty_text4 = font_small.render("cards", True, WHITE)
            
            self.screen.blit(penalty_text1, (penalty_rect.x + 5, penalty_rect.y + 5))
            self.screen.blit(penalty_text2, (penalty_rect.x + 15, penalty_rect.y + 25))
            self.screen.blit(penalty_text3, (penalty_rect.x + 30, penalty_rect.y + 45))
            self.screen.blit(penalty_text4, (penalty_rect.x + 20, penalty_rect.y + 75))
        
        # Deck and discard pile
        deck_x = table_center[0] - 80
        discard_x = table_center[0] + 20
        cards_y = table_center[1] - 50
        
        # Deck
        if self.deck:
            self.draw_card_sprite(self.screen, None, deck_x, cards_y, is_back=True)
        deck_label = font_small.render(f"Deck ({len(self.deck)})", True, WHITE)
        self.screen.blit(deck_label, (deck_x, cards_y + self.card_height + 5))
        
        # Discard pile
        if self.discard_pile:
            top_card = self.discard_pile[-1]
            self.draw_card_sprite(self.screen, top_card, discard_x, cards_y)
        discard_label = font_small.render("Discard", True, WHITE)
        self.screen.blit(discard_label, (discard_x, cards_y + self.card_height + 5))
        
        # AI hand info
        ai_info = font_small.render(f"⚡ AI Player - {len(self.ai_hand)} cards", True, WHITE)
        ai_rect = pygame.Rect(SCREEN_WIDTH // 2 - 100, 150, 200, 25)
        pygame.draw.rect(self.screen, BLACK, ai_rect)
        pygame.draw.rect(self.screen, BLUE, ai_rect, 2)
        ai_text_rect = ai_info.get_rect(center=ai_rect.center)
        self.screen.blit(ai_info, ai_text_rect)
        
        # AI cards (back view)
        ai_cards_start_x = SCREEN_WIDTH // 2 - (min(7, len(self.ai_hand)) * 25) // 2
        for i in range(min(7, len(self.ai_hand))):
            self.draw_card_sprite(self.screen, None, ai_cards_start_x + i * 25, 180, 
                                is_back=True)
        
        # Player hand
        player_info = font_small.render(f"💎 Your Hand - {len(self.player_hand)} cards", True, WHITE)
        player_rect = pygame.Rect(SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT - 200, 200, 25)
        pygame.draw.rect(self.screen, BLACK, player_rect)
        pygame.draw.rect(self.screen, GREEN, player_rect, 2)
        player_text_rect = player_info.get_rect(center=player_rect.center)
        self.screen.blit(player_info, player_text_rect)
        
        # Player cards
        cards_per_row = min(10, len(self.player_hand))
        if cards_per_row > 0:
            total_width = cards_per_row * (self.card_width + self.card_spacing) - self.card_spacing
            start_x = (SCREEN_WIDTH - total_width) // 2
            
            for i, card in enumerate(self.player_hand):
                if i < cards_per_row:
                    x = start_x + i * (self.card_width + self.card_spacing)
                    y = SCREEN_HEIGHT - 170
                    
                    is_selected = card in self.selected_cards
                    top_card = self.discard_pile[-1] if self.discard_pile else None
                    is_playable = (self.current_player == Player.HUMAN and 
                                 not self.game_over and 
                                 self.must_pickup_cards == 0 and
                                 top_card and
                                 self.can_play_card(card, top_card, self.selected_cards))
                    
                    self.draw_card_sprite(self.screen, card, x, y, 
                                        is_selected=is_selected, is_playable=is_playable)
                    
                    # Store card rect for click detection
                    if not hasattr(self, 'card_rects'):
                        self.card_rects = {}
                    self.card_rects[i] = pygame.Rect(x, y, self.card_width, self.card_height)
        
        # Game controls
        button_y = SCREEN_HEIGHT - 90
        button_spacing = 120
        
        # Play selected cards button
        if (self.selected_cards and 
            self.current_player == Player.HUMAN and 
            not self.game_over and 
            self.must_pickup_cards == 0):
            self.play_selected_button = self.draw_button(
                self.screen, f"🎯 Play Selected ({len(self.selected_cards)})",
                SCREEN_WIDTH // 2 - 200, button_y, 150, 30, GREEN)
            
            self.clear_selection_button = self.draw_button(
                self.screen, "❌ Clear Selection",
                SCREEN_WIDTH // 2 - 40, button_y, 120, 30, (108, 117, 125))
        
        # Draw card button
        if (self.current_player == Player.HUMAN and 
            not self.game_over):
            button_text = (f"⚠️ Pick Up {self.must_pickup_cards}" if self.must_pickup_cards > 0 
                          else ("🃏 Draw Card" if self.deck else "Deck Empty"))
            button_color = RED if self.must_pickup_cards > 0 else (YELLOW if self.deck else (108, 117, 125))
            text_color = WHITE if self.must_pickup_cards > 0 else BLACK
            
            self.draw_card_button = self.draw_button(
                self.screen, button_text,
                SCREEN_WIDTH // 2 + 90, button_y, 100, 30, button_color, text_color)
        
        # Last card button
        if (len(self.player_hand) == 1 and 
            self.current_player == Player.HUMAN and 
            not self.game_over and 
            self.must_pickup_cards == 0):
            if not self.last_card_declared:
                self.last_card_button = self.draw_button(
                    self.screen, "📢 Last Card!",
                    SCREEN_WIDTH // 2 - 200, button_y + 40, 100, 30, RED)
            else:
                self.cancel_last_card_button = self.draw_button(
                    self.screen, "❌ Cancel Last Card",
                    SCREEN_WIDTH // 2 - 200, button_y + 40, 140, 30, YELLOW, BLACK)
        
        # Play again button (if game over)
        if self.game_over:
            self.play_again_button = self.draw_button(
                self.screen, "💎 Play Again",
                SCREEN_WIDTH // 2 - 60, button_y + 40, 120, 40, GREEN)
        
        # Quit button
        self.quit_button = self.draw_button(
            self.screen, "🏠 Back to Menu",
            SCREEN_WIDTH // 2 - 60, SCREEN_HEIGHT - 40, 120, 30, (108, 117, 125))
        
        # Win/Lose message
        if self.game_over:
            win_text = "⭐ YOU WIN! ⭐" if self.winner == Player.HUMAN else "⚡ AI WINS! ⚡"
            win_color = GREEN if self.winner == Player.HUMAN else RED
            
            win_surface = font_large.render(win_text, True, WHITE)
            win_rect = pygame.Rect(SCREEN_WIDTH // 2 - 200, SCREEN_HEIGHT // 2 - 100, 400, 80)
            pygame.draw.rect(self.screen, win_color, win_rect)
            pygame.draw.rect(self.screen, GOLD, win_rect, 5)
            
            text_rect = win_surface.get_rect(center=win_rect.center)
            self.screen.blit(win_surface, text_rect)
    
    def handle_click(self, pos: Tuple[int, int]):
        """Handle mouse clicks."""
        if self.state == GameState.HOME:
            if hasattr(self, 'play_button') and self.play_button.collidepoint(pos):
                self.start_new_game()
            elif hasattr(self, 'rules_button') and self.rules_button.collidepoint(pos):
                self.state = GameState.RULES
        
        elif self.state == GameState.RULES:
            if hasattr(self, 'back_button') and self.back_button.collidepoint(pos):
                self.state = GameState.HOME
        
        elif self.state == GameState.GAME:
            # Card clicks
            if hasattr(self, 'card_rects'):
                for i, rect in self.card_rects.items():
                    if rect.collidepoint(pos):
                        self.select_card(i)
                        return
            
            # Button clicks
            if hasattr(self, 'play_selected_button') and self.play_selected_button.collidepoint(pos):
                self.play_selected_cards()
            elif hasattr(self, 'clear_selection_button') and self.clear_selection_button.collidepoint(pos):
                self.clear_selection()
            elif hasattr(self, 'draw_card_button') and self.draw_card_button.collidepoint(pos):
                if self.must_pickup_cards > 0:
                    self.forced_pickup_cards()
                else:
                    self.draw_card()
            elif hasattr(self, 'last_card_button') and self.last_card_button.collidepoint(pos):
                self.declare_last_card()
            elif hasattr(self, 'cancel_last_card_button') and self.cancel_last_card_button.collidepoint(pos):
                self.cancel_last_card()
            elif hasattr(self, 'play_again_button') and self.play_again_button.collidepoint(pos):
                self.start_new_game()
            elif hasattr(self, 'quit_button') and self.quit_button.collidepoint(pos):
                self.state = GameState.HOME
    
    def run(self):
        """Main game loop."""
        running = True
        
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 1:  # Left click
                        self.handle_click(event.pos)
                elif event.type == pygame.USEREVENT + 1:
                    # AI turn timer
                    self.ai_turn()
                    pygame.time.set_timer(pygame.USEREVENT + 1, 0)  # Cancel timer
            
            # Draw current screen
            if self.state == GameState.HOME:
                self.draw_home_screen()
            elif self.state == GameState.RULES:
                self.draw_rules_screen()
            elif self.state == GameState.GAME:
                self.draw_game_screen()
            
            pygame.display.flip()
            self.clock.tick(FPS)
        
        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game = ImperialBlackGame()
    game.run()
