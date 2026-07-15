# DreamDEX Bot Builder

A no-code web wizard that configures a DreamDEX trading bot for you: pick a
strategy, tune it with sliders, and get a ready-to-run config plus a one-click
cloud deploy. Built as a friendlier front door to the
[DreamDEX Bot Kit](https://github.com/somnia-chain/dreamdex-bot-kit).

**Non-custodial by design.** The site only *generates configuration*. It never
asks for, sees, or stores your private key — you add that yourself, on your own
machine or your own cloud. The bot runs on your infrastructure, not ours.

## What it does

1. **Strategy** — choose from the kit's strategies (Starter, Market Maker, Grid, Momentum, Mean Reversion, TWAP).
2. **Network & safety** — testnet/mainnet, dry-run/live, with the right warnings.
3. **Tune** — friendly labels over the strategy's real env parameters (defaults match the kit).
4. **Deploy** — a generated `.env` (copy/download), local run commands, and a "Deploy to your own cloud" option.

The generated `.env` drops straight into the bot kit — the parameter names and
defaults mirror `strategies/*/src/config.ts` exactly.

## Run locally

```bash
npm install
npm run dev
```

## Stack

Vite + React + TypeScript. No backend, no key handling — a static front-end over
the bot kit's strategy schema.

> Status: early MVP. Educational tooling, not financial advice.
