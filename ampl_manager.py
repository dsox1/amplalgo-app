"""
AMPL Buy Order Management System
Simple system for managing stagnated buy orders and AMPL rebase-safe selling
"""
import time
from typing import Dict, List, Optional, Any
from .kucoin_service import KuCoinService


class AMPLOrderManager:
    """Simple AMPL buy order management with rebase protection"""
    
    def __init__(self, kucoin_service: KuCoinService):
        """Initialize AMPL order manager"""
        self.kucoin = kucoin_service
        self.symbol = "AMPL-USDT"
        self.enabled = False
        
        # Fixed buy order levels (1.16 down to 0.85)
        self.buy_levels = [1.16, 1.12, 1.08, 1.04, 1.00, 0.96, 0.92, 0.85]
        self.order_size = "10"  # Default order size
        
        # Track orders and balances
        self.active_buy_orders = {}
        self.purchase_records = {}  # Track AMPL balance at time of purchase
    
    def toggle_system(self, enable: bool) -> Dict[str, Any]:
        """Toggle the buy order management system on/off"""
        try:
            if enable and not self.enabled:
                self.enabled = True
                return self.check_and_place_orders()
                
            elif not enable and self.enabled:
                self.enabled = False
                return self._cancel_all_buy_orders()
            
            return {
                'success': True,
                'enabled': self.enabled,
                'message': f"System already {'enabled' if enable else 'disabled'}"
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'enabled': self.enabled
            }
    
    def detect_existing_orders(self) -> Dict[str, Any]:
        """Auto-detect existing buy orders on page load"""
        try:
            active_orders = self.kucoin.get_active_orders(self.symbol)
            buy_orders_found = []
            
            for order in active_orders:
                if order['side'] == 'buy':
                    order_price = float(order['price'])
                    if any(abs(order_price - level) < 0.01 for level in self.buy_levels):
                        buy_orders_found.append(order)
                        self.active_buy_orders[order['order_id']] = {
                            'price': order_price,
                            'size': order['size'],
                            'level': self._find_buy_level(order_price)
                        }
            
            # System is active if we have at least 3 buy orders
            system_active = len(buy_orders_found) >= 3
            if system_active:
                self.enabled = True
            
            return {
                'system_detected': system_active,
                'buy_orders_count': len(buy_orders_found),
                'buy_orders': buy_orders_found,
                'missing_levels': self._find_missing_levels(buy_orders_found),
                'enabled': self.enabled
            }
            
        except Exception as e:
            return {
                'system_detected': False,
                'error': str(e),
                'enabled': False
            }
    
    def check_and_place_orders(self) -> Dict[str, Any]:
        """Check if buy orders exist, if not place all 8 orders"""
        if not self.enabled:
            return {'success': False, 'message': 'System is disabled'}
        
        try:
            active_orders = self.kucoin.get_active_orders(self.symbol)
            buy_orders = [order for order in active_orders if order['side'] == 'buy']
            
            if len(buy_orders) == 0:
                # No buy orders - place all 8
                return self._place_all_buy_orders()
            else:
                # Check for missing levels
                missing_levels = self._find_missing_levels(buy_orders)
                if missing_levels:
                    return self._place_missing_orders(missing_levels)
                else:
                    return {
                        'success': True,
                        'message': 'All buy orders already in place',
                        'buy_orders_count': len(buy_orders)
                    }
        
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _place_all_buy_orders(self) -> Dict[str, Any]:
        """Place all 8 buy orders"""
        results = {'success': True, 'orders_placed': [], 'errors': []}
        
        for i, price in enumerate(self.buy_levels):
            try:
                client_oid = f"ampl_buy_{i}_{int(time.time() * 1000)}"
                order_result = self.kucoin.place_limit_order(
                    symbol=self.symbol,
                    side='buy',
                    size=self.order_size,
                    price=str(price),
                    client_oid=client_oid
                )
                
                if order_result['success']:
                    self.active_buy_orders[order_result['order_id']] = {
                        'price': price, 'size': self.order_size, 'level': i
                    }
                    results['orders_placed'].append({
                        'level': i, 'price': price, 'order_id': order_result['order_id']
                    })
                else:
                    results['errors'].append(order_result)
                    results['success'] = False
                    
            except Exception as e:
                results['errors'].append({'level': i, 'price': price, 'error': str(e)})
                results['success'] = False
        
        return results
    
    def monitor_filled_orders(self) -> Dict[str, Any]:
        """Monitor for filled buy orders and handle selling with AMPL rebase protection"""
        if not self.enabled:
            return {'enabled': False, 'message': 'System is disabled'}
        
        results = {
            'orders_checked': 0, 'orders_filled': 0, 
            'sell_orders_placed': 0, 'rebase_protections': 0, 'errors': []
        }
        
        try:
            current_balance = self.kucoin.get_account_balance('AMPL')
            current_ampl_count = current_balance['available']
            
            for order_id, order_info in list(self.active_buy_orders.items()):
                try:
                    status = self.kucoin.get_order_status(order_id)
                    results['orders_checked'] += 1
                    
                    # If order is filled (not active)
                    if not status.get('status', True):
                        results['orders_filled'] += 1
                        
                        purchase_price = order_info['price']
                        purchase_size = float(order_info['size'])
                        sell_price = purchase_price * 1.03  # 3% profit
                        
                        # AMPL Rebase Protection Check
                        if current_ampl_count >= purchase_size:
                            # Safe to sell - we have enough AMPL
                            sell_result = self.kucoin.place_limit_order(
                                symbol=self.symbol,
                                side='sell',
                                size=str(purchase_size),
                                price=str(round(sell_price, 4)),
                                client_oid=f"ampl_sell_{int(time.time() * 1000)}"
                            )
                            
                            if sell_result['success']:
                                results['sell_orders_placed'] += 1
                            else:
                                results['errors'].append(sell_result)
                        else:
                            # AMPL rebase protection triggered
                            results['rebase_protections'] += 1
                            results['errors'].append({
                                'type': 'rebase_protection',
                                'message': f'Insufficient AMPL. Have: {current_ampl_count}, Need: {purchase_size}'
                            })
                        
                        # Remove from tracking
                        del self.active_buy_orders[order_id]
                        
                except Exception as e:
                    results['errors'].append({'order_id': order_id, 'error': str(e)})
            
            # Replace any filled orders
            if results['orders_filled'] > 0:
                replacement_result = self.check_and_place_orders()
                if 'orders_placed' in replacement_result:
                    results['replacement_orders'] = len(replacement_result['orders_placed'])
            
        except Exception as e:
            results['errors'].append({'type': 'monitoring_error', 'error': str(e)})
        
        return results
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get comprehensive system status for UI display"""
        try:
            current_price = self.kucoin.get_ticker_price(self.symbol)['price']
            balance = self.kucoin.get_account_balance('AMPL')
            active_orders = self.kucoin.get_active_orders(self.symbol)
            
            buy_orders = [order for order in active_orders if order['side'] == 'buy']
            sell_orders = [order for order in active_orders if order['side'] == 'sell']
            
            return {
                'enabled': self.enabled,
                'current_price': current_price,
                'ampl_balance': balance,
                'buy_levels': self.buy_levels,
                'active_buy_orders': len(buy_orders),
                'active_sell_orders': len(sell_orders),
                'buy_orders_detail': buy_orders,
                'system_health': 'healthy' if len(buy_orders) >= 6 else 'needs_attention'
            }
            
        except Exception as e:
            return {'enabled': self.enabled, 'error': str(e), 'system_health': 'error'}
    
    # Helper methods
    def _find_buy_level(self, price: float) -> int:
        for i, level in enumerate(self.buy_levels):
            if abs(price - level) < 0.01:
                return i
        return -1
    
    def _find_missing_levels(self, existing_orders: List[Dict]) -> List[float]:
        existing_prices = [float(order['price']) for order in existing_orders]
        missing = []
        for level in self.buy_levels:
            if not any(abs(price - level) < 0.01 for price in existing_prices):
                missing.append(level)
        return missing
    
    def _place_missing_orders(self, missing_levels: List[float]) -> Dict[str, Any]:
        results = {'success': True, 'orders_placed': [], 'errors': []}
        
        for price in missing_levels:
            try:
                level_index = self.buy_levels.index(price)
                client_oid = f"ampl_buy_{level_index}_{int(time.time() * 1000)}"
                
                order_result = self.kucoin.place_limit_order(
                    symbol=self.symbol, side='buy', size=self.order_size,
                    price=str(price), client_oid=client_oid
                )
                
                if order_result['success']:
                    self.active_buy_orders[order_result['order_id']] = {
                        'price': price, 'size': self.order_size, 'level': level_index
                    }
                    results['orders_placed'].append({
                        'level': level_index, 'price': price, 'order_id': order_result['order_id']
                    })
                else:
                    results['errors'].append(order_result)
                    results['success'] = False
                    
            except Exception as e:
                results['errors'].append({'price': price, 'error': str(e)})
                results['success'] = False
        
        return results
    
    def _cancel_all_buy_orders(self) -> Dict[str, Any]:
        results = {'success': True, 'cancelled_orders': [], 'errors': []}
        
        try:
            active_orders = self.kucoin.get_active_orders(self.symbol)
            buy_orders = [order for order in active_orders if order['side'] == 'buy']
            
            for order in buy_orders:
                try:
                    cancel_result = self.kucoin.cancel_order(order['order_id'])
                    if cancel_result['success']:
                        results['cancelled_orders'].append(order['order_id'])
                    else:
                        results['errors'].append(cancel_result)
                        results['success'] = False
                except Exception as e:
                    results['errors'].append({'order_id': order['order_id'], 'error': str(e)})
                    results['success'] = False
            
            self.active_buy_orders = {}
            
        except Exception as e:
            results['success'] = False
            results['error'] = str(e)
        
        return results
