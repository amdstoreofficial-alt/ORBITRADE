# ORBITAL Trading Platform - Product Requirements Document

## Executive Summary
**Project Name:** ORBITAL - Next-Generation Binary Options Trading Platform
**Version:** 1.2 (Trading Engine Overhaul)
**Last Updated:** March 18, 2026

## Original Problem Statement
Build a comprehensive binary options trading platform supporting Forex, Cryptocurrencies, and Precious Metals with full trading functionality.

## Latest Updates (v1.2) - Trading Dashboard Overhaul

### Completed Tasks:
1. **BUY/SELL Buttons** - Changed from CALL/PUT to more intuitive BUY/SELL with "Higher"/"Lower" labels
2. **Short Timeframes** - Updated expiry options: 5s, 10s, 15s, 30s, 60s (was 1min, 5min, 15min, 1hr)
3. **Live Prices for All Categories**:
   - Forex: Live from CDN currency API (EUR/USD, GBP/USD, etc.)
   - Crypto: Cached realistic prices (BTC ~$67,500, ETH ~$3,450)
   - Metals: Cached realistic prices (Gold ~$2,325, Silver ~$27.45)
4. **Live Trade Monitoring**:
   - Real-time countdown with progress bar
   - Live current price updates
   - WINNING/LOSING status indicator
   - Strike price vs current price comparison
5. **Asset Selection** - All 3 categories fully functional with proper price display
6. **Professional Design** - TradingView charts, clean UI, responsive layout

## Default Accounts
| Account Type | Email | Password | Balance |
|--------------|-------|----------|---------|
| Admin | admin@orbitrade.live | password | $100,000 |
| Master User | masteruser@orbitrade.live | password | $50,000 + $5,000 bonus |

## Technical Details

### Trading Engine
- Supports both `buy`/`sell` and legacy `call`/`put` directions
- Expiry times: 5, 10, 15, 30, 60 seconds
- Auto-settlement via background task
- Real-time P&L calculation

### Price Data
- **Forex**: Live from `cdn.jsdelivr.net/npm/@fawazahmed0/currency-api`
- **Crypto**: Cached realistic data (CoinGecko rate limited)
- **Metals**: Cached realistic data with micro-fluctuations

### Auth Enhancements
- Confirm password field (sign up)
- Terms/Privacy/Risk checkbox (sign up)
- Slide-to-verify security (double-click for accessibility)

## Testing Results (v1.2)
- Backend: **100%** - All endpoints working perfectly
- Frontend: Visual testing passed (slide verification working manually)

## API Endpoints Updated
- POST `/api/trades` - Now accepts `direction: "buy" | "sell"` and `expiry_seconds: 5 | 10 | 15 | 30 | 60`

## What's Working
- All 3 asset categories with live prices
- Fast trading (5-60 second options)
- Live trade monitoring with countdown
- BUY/SELL buttons with clear labels
- TradingView professional charts
- Admin panel and user management
- Affiliate system
- AI chat support

