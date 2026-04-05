# ORBITAL Trading Platform - PRD

## Overview
Binary Options Trading Platform supporting Forex, Crypto, and Precious Metals with AI-powered predictions.

## Tech Stack
- **Backend**: Python FastAPI + Socket.IO + MongoDB
- **Frontend**: React 18 + TailwindCSS + Framer Motion
- **Charts**: TradingView Lightweight Charts
- **AI**: OpenAI GPT-5.2 (via Emergent LLM)
- **Real-time**: WebSocket for price feeds

## Core Features (Implemented)

### Trading System
- [x] Binary Options trading (BUY/SELL High/Low)
- [x] Touch/No Touch trading options (NEW)
- [x] 5-60 second expiry timeframes
- [x] Trade settlement with ACTUAL market close prices
- [x] Real-time price feeds (Forex, Crypto, Metals)
- [x] AI trading predictions

### Payment System
- [x] Manual Crypto Deposit with blockchain confirmation animation
- [x] Cryptocurrency options: USDT TRC20/ERC20, BTC, ETH, LTC
- [x] Transaction hash + Screenshot upload
- [x] "Waiting for blockchain confirmation" status (admin approved)
- [x] Withdrawal requests with wallet address

### Affiliate System
- [x] Direct Commission (Level 1) - 5% on deposits
- [x] Indirect Commission (Level 2+) - 2% on downline deposits
- [x] Revenue Share - 10% on trading profits
- [x] Multi-level deep (3 levels default)
- [x] Admin-controlled commission structure

### Authentication
- [x] JWT-based authentication
- [x] Password Reset flow (forgot password + reset code)
- [x] 2FA support (TOTP)
- [x] Referral code on registration

### Admin Panel
- [x] User management (suspend, activate, adjust balance)
- [x] KYC Document viewer
- [x] Deposit management (approve/reject)
- [x] Withdrawal management
- [x] Commission structure editor
- [x] Broadcast notifications
- [x] Promotions management

## Test Accounts
| Account | Email | Password |
|---------|-------|----------|
| Admin | admin@orbitrade.live | password |
| User | masteruser@orbitrade.live | password |

## What's Working
- All trading functionality
- Manual crypto deposits with blockchain animation
- Full affiliate system with 3-tier commissions
- Touch/No Touch trading
- Password reset flow
- Admin commission structure management
- KYC document upload and admin viewing
- Real-time prices and trade settlement

## Date: 2026-04-05
