# ORBITAL Trading Platform - Product Requirements Document

## Executive Summary
**Project Name:** ORBITAL - Next-Generation Binary Options Trading Platform
**Version:** 1.1 (Updated)
**Last Updated:** March 18, 2026

## Original Problem Statement
Build a comprehensive binary options trading platform supporting Forex, Cryptocurrencies, and Precious Metals with:
- Full trading dashboard with real-time prices
- Admin dashboard for platform management
- Affiliate system for referral marketing
- Multi-payment support (Stripe, Crypto, Bank)
- AI-powered support chat

## User Choices & Decisions
- **Scope:** Full platform with Admin + Affiliate + Trading
- **Market Data:** Live APIs (Forex/Metals from CDN currency API, Crypto from CoinGecko)
- **Payments:** Stripe + Manual Crypto + Bank Transfer
- **Real-time:** WebSocket for live prices
- **Authentication:** JWT with 2FA support + Slide to Verify
- **AI Chat:** GPT-5.2 via Emergent LLM Key
- **Charts:** TradingView Lightweight Charts

## Technical Architecture

### Backend Stack
- **Framework:** FastAPI (Python)
- **Database:** MongoDB
- **WebSocket:** python-socketio
- **Authentication:** JWT + PyOTP (2FA)
- **Payments:** Stripe Checkout (emergentintegrations)
- **AI:** GPT-5.2 (emergentintegrations)

### Frontend Stack
- **Framework:** React 18
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Real-time:** Socket.io-client
- **Charts:** TradingView Lightweight Charts (professional candlestick + volume)

## Default Accounts
| Account Type | Email | Password | Balance |
|--------------|-------|----------|---------|
| Admin | admin@orbitrade.live | password | $100,000 |
| Master User | masteruser@orbitrade.live | password | $50,000 + $5,000 bonus |

## What's Been Implemented (v1.1)

### March 18, 2026 - Initial MVP + Updates

#### v1.0 Features
1. **Complete Backend API** (35+ endpoints)
2. **Full Frontend Application** (Landing, Auth, Dashboard, Admin, Deposit, Withdraw, Affiliate)
3. **Trading Engine** with auto-settlement
4. **AI Chat** with GPT-5.2

#### v1.1 Updates (Latest)
1. **Live Forex/Metals Data** - Integrated free currency API (cdn.jsdelivr.net/npm/@fawazahmed0/currency-api)
   - Real-time EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, USD/CHF, NZD/USD, EUR/GBP
   - Real-time XAU/USD (Gold), XAG/USD (Silver), XPT/USD (Platinum), XPD/USD (Palladium)
   
2. **TradingView Charts** - Professional trading interface
   - Candlestick chart with volume histogram
   - Timeframe buttons (1m, 5m, 15m, 1H, 4H, 1D)
   - Indicators and Draw tools (UI ready)
   - Real-time candle updates
   
3. **Enhanced Auth Page**
   - Confirm password field for sign up
   - Slide to verify component (anti-bot)
   - Terms & Privacy checkbox with Risk Disclosure
   - Password match validation
   
4. **Pre-seeded Accounts**
   - admin@orbitrade.live (Admin, $100K)
   - masteruser@orbitrade.live (Premium, $50K)

### Testing Results (v1.1)
- Backend: 94.7% (18/19 tests passed)
- Frontend: 100% (all new features working)

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/2fa/setup
- POST /api/auth/2fa/verify

### Trading
- GET /api/assets
- GET /api/prices (live data)
- GET /api/prices/forex (live)
- GET /api/prices/crypto (live from CoinGecko)
- GET /api/prices/metals (live)
- POST /api/trades
- GET /api/trades

### Financial
- GET /api/wallet
- GET /api/transactions
- POST /api/deposits/stripe/create-session
- POST /api/withdrawals

### Admin
- GET /api/admin/stats
- GET /api/admin/users
- PATCH /api/admin/users/{id}
- GET /api/admin/trades
- GET /api/admin/withdrawals

### AI Chat
- POST /api/chat
- GET /api/chat/history

## Prioritized Backlog

### P0 - Critical (Completed)
- [x] Live Forex/Metals API integration
- [x] TradingView charts
- [x] Pre-seeded admin/user accounts
- [x] Enhanced auth with slide verification

### P1 - High Priority (Next)
- [ ] KYC document upload & verification
- [ ] Email verification flow
- [ ] Production payment processing webhooks
- [ ] Email notifications (SendGrid)

### P2 - Medium Priority
- [ ] Social login (Google, Apple)
- [ ] PayPal integration
- [ ] Economic calendar
- [ ] Leaderboard page
- [ ] Advanced order types (Touch/No Touch)

### P3 - Nice to Have
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Advanced analytics
- [ ] API keys for users
- [ ] Mobile app preparation

## Data Sources
- **Forex:** cdn.jsdelivr.net/npm/@fawazahmed0/currency-api (FREE, no key)
- **Metals:** cdn.jsdelivr.net/npm/@fawazahmed0/currency-api (FREE, no key)
- **Crypto:** CoinGecko API (FREE tier, rate limited)

## Security Implementation
- [x] Password hashing (bcrypt)
- [x] JWT token auth
- [x] 2FA support (TOTP)
- [x] Slide to verify (anti-bot)
- [x] Terms acceptance requirement
- [x] CORS configuration

## Deployment Notes
- Backend: FastAPI on port 8001 (supervisor)
- Frontend: React on port 3000 (supervisor)
- Database: MongoDB (local)
- WebSocket: /api/socket.io

