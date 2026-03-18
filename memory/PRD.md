# ORBITAL Trading Platform - Product Requirements Document

## Executive Summary
**Project Name:** ORBITAL - Next-Generation Binary Options Trading Platform
**Version:** 2.0 (AI Dashboard Overhaul)
**Last Updated:** March 18, 2026

## Original Problem Statement
Build a comprehensive binary options trading platform supporting Forex, Cryptocurrencies, and Precious Metals with full trading functionality, AI-powered predictions, and professional-grade charts.

## Latest Updates (v2.0) - AI Dashboard Overhaul

### Completed Tasks:
1. **AI-Powered BUY/SELL Predictions** - Emergent LLM (GPT-5.2) analyzes market data and shows live prediction percentages on BUY/SELL buttons (refreshes every 8s)
2. **Live Metal Prices** - Integrated fawazahmed0 currency API for real-time XAU/USD and XAG/USD prices
3. **Interactive Chart Timeframes** - 6 clickable timeframes: 1s, 5s, 1m, 5m, 15m, 1H with proper candle interval generation
4. **Technical Indicators** - SMA 20, EMA 9, Bollinger Bands overlays with dropdown menu
5. **Dashboard Redesign** - Clean, dark, professional design with:
   - Scrolling price ticker at top
   - Compact stats row (Balance, Active, P&L, Win Rate)
   - Side-by-side BUY/SELL buttons with AI percentages
   - Green/Red candlestick colors (industry standard)
   - Live indicator dot
6. **BUY/SELL Buttons** - Show AI prediction confidence percentages
7. **Short Timeframes** - 5s, 10s, 15s, 30s, 60s expiry options
8. **All Asset Categories** - Forex (live API), Crypto (CoinGecko), Metals (live API + cache)

## Default Accounts
| Account Type | Email | Password | Balance |
|--------------|-------|----------|---------|
| Admin | admin@orbitrade.live | password | $100,000 |
| Master User | masteruser@orbitrade.live | password | ~$49,630 |

## Technical Details

### Trading Engine
- BUY/SELL directions (with legacy CALL/PUT support)
- Expiry times: 5, 10, 15, 30, 60 seconds
- Auto-settlement via background task
- Real-time P&L calculation

### Price Data
- **Forex**: Live from `cdn.jsdelivr.net/npm/@fawazahmed0/currency-api`
- **Crypto**: CoinGecko API with rate-limit fallback to cached data
- **Metals**: Live from fawazahmed0 currency API (XAU, XAG rates) + cached Platinum/Palladium

### AI Integration
- **Prediction Engine**: POST /api/predict using Emergent LLM (GPT-5.2)
- **Chat Assistant**: POST /api/chat for trading advice
- Predictions refresh every 8 seconds on the dashboard

### Chart Features
- TradingView Lightweight Charts
- 6 Timeframes: 1s, 5s, 1m, 5m, 15m, 1H
- 3 Indicators: SMA 20, EMA 9, Bollinger Bands
- Real-time candle updates
- Volume bars

### Auth
- JWT authentication
- Slide-to-verify (double-click bypass for accessibility)
- Confirm password, Terms checkbox

## Testing Results (v2.0)
- Backend: **100%** (14/14 tests passed)
- Frontend: **100%** (18/18 features verified)

## API Endpoints
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - Login
- GET `/api/user/me` - Current user
- GET `/api/assets` - All tradeable assets
- GET `/api/prices` - Live prices (forex, crypto, metals)
- POST `/api/trades` - Place trade (direction: buy/sell, expiry_seconds: 5-60)
- GET `/api/trades` - Trade history
- POST `/api/predict` - AI prediction (buy_confidence, sell_confidence)
- POST `/api/chat` - AI chat

## What's Working
- All 3 asset categories with live/cached prices
- AI-powered BUY/SELL prediction percentages
- Interactive chart with timeframes and indicators
- Fast trading (5-60 second options)
- Live trade monitoring with countdown
- Professional dark dashboard design
- TradingView charts with technical indicators
- Admin panel and user management
- Affiliate system
- AI chat support
- Scrolling price ticker

## Upcoming Tasks
- P0: KYC Document Upload System
- P1: Email Notifications (SendGrid)
- P1: Touch/No Touch option types
- P2: PayPal payment integration
- P2: Backend refactoring (split server.py monolith)

## Known Limitations
- Metal prices from fawazahmed0 API may differ from TradingView spot prices (different data sources)
- CoinGecko crypto API is rate-limited; falls back to cached data
- Payment gateways are placeholders (Stripe, PayPal, Crypto)
- Slide-to-verify component requires double-click for automated testing
