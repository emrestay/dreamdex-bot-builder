// Strategy + parameter definitions, mirroring the DreamDEX bot kit's strategy
// configs (strategies/*/src/config.ts). Env var names + defaults match the kit
// exactly so the generated .env drops straight in.

export type Param = {
  env: string;
  label: string;
  def: number | string;
  type: "number" | "text" | "select";
  options?: string[];
  help?: string;
  advanced?: boolean;
};

export type EnvDefault = { env: string; def: string; after?: string };

export type Kind = "spot" | "ec";

export type Strategy = {
  kind: Kind;
  id: string; // workspace name, used in `npm run dev -w <id>`
  name: string;
  blurb: string;
  symbolEnv: string;
  params: Param[];
  envDefaults?: EnvDefault[]; // emitted in .env but not shown in the tune UI
};

// Markets. USDC.e:USDso is mainnet-only; the rest exist on both networks.
export const MARKETS = ["SOMI:USDso", "WETH:USDso", "WBTC:USDso", "USDC.e:USDso"];

// Event contracts are scoped to a VENUE, not a trading pair. One deployment
// hosts several and the bots refuse to guess, so the generated .env carries the
// id for the network you picked. These have moved before: if a bot reports no
// markets, read venueId off a live market row.
export const EC_VENUE: Record<"testnet" | "mainnet", string> = {
  testnet: "0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c",
  mainnet: "0x458b30c2d72bfd2c6317304a4594ecbafe5f729d3111b65fdc3a33bd48e5432d",
};

// Which underlying to follow. Empty means "whatever the venue is running".
const UNDERLYINGS = ["", "BTC", "ETH"];

export const STRATEGIES: Strategy[] = [
  {
    kind: "spot",
    id: "starter",
    name: "Starter",
    blurb: "Quotes both sides. Edit one function to make it yours.",
    symbolEnv: "SYMBOL",
    params: [
      { env: "SYMBOL", label: "Market", def: "SOMI:USDso", type: "select", options: MARKETS },
      { env: "STARTER_SPREAD_BPS", label: "Spread (bps)", def: 10, type: "number", help: "Total distance between your buy and sell." },
      { env: "STARTER_SIZE_USDSO", label: "Order size (USDso)", def: 20, type: "number", help: "Notional per side." },
      { env: "STARTER_TICK_MS", label: "Re-check every (ms)", def: 5000, type: "number", advanced: true },
    ],
  },
  {
    kind: "spot",
    id: "market-making",
    name: "Market Maker",
    blurb: "Rest quotes on both sides, earn the spread.",
    symbolEnv: "MM_SYMBOL",
    params: [
      { env: "MM_SYMBOL", label: "Market", def: "SOMI:USDso", type: "select", options: MARKETS },
      { env: "MM_HALF_SPREAD_BPS", label: "Half-spread (bps)", def: 5, type: "number", help: "Distance of each quote from mid." },
      { env: "MM_NOTIONAL_USDSO", label: "Order size (USDso)", def: 20, type: "number" },
      { env: "MM_INVENTORY_SKEW_BPS", label: "Inventory skew (bps)", def: 4, type: "number", help: "How hard to lean quotes to flatten inventory." },
      { env: "MM_REQUOTE_TRIGGER_BPS", label: "Re-quote when price moves (bps)", def: 3, type: "number", help: "Higher = fewer re-quotes = less gas." },
      { env: "MM_MAX_BOOK_SPREAD_BPS", label: "Skip if book wider than (bps)", def: 50, type: "number", advanced: true },
      { env: "MM_TARGET_INVENTORY_USDSO", label: "Target inventory (USDso)", def: 0, type: "number", advanced: true },
      { env: "MM_REQUOTE_COOLDOWN_MS", label: "Min re-quote gap (ms)", def: 2000, type: "number", advanced: true },
      { env: "MM_REFRESH_INTERVAL_MS", label: "Poll interval (ms)", def: 5000, type: "number", advanced: true },
    ],
  },
  {
    kind: "spot",
    id: "grid",
    name: "Grid",
    blurb: "A ladder of orders for a ranging market.",
    symbolEnv: "GRID_SYMBOL",
    params: [
      { env: "GRID_SYMBOL", label: "Market", def: "SOMI:USDso", type: "select", options: MARKETS },
      { env: "GRID_STEP_BPS", label: "Grid step (bps)", def: 30, type: "number", help: "Spacing between rungs." },
      { env: "GRID_LOT_USDSO", label: "Lot size (USDso)", def: 15, type: "number", help: "Size per rung." },
      { env: "GRID_MAX_INVENTORY_USDSO", label: "Max inventory (USDso)", def: 90, type: "number" },
      { env: "GRID_MAX_SESSION_LOSS_USDSO", label: "Stop after loss (USDso)", def: 25, type: "number", help: "Safety stop." },
      { env: "GRID_MAX_SPREAD_BPS", label: "Skip if book wider than (bps)", def: 60, type: "number", advanced: true },
      { env: "GRID_STUCK_TIMEOUT_MS", label: "Stuck-order timeout (ms)", def: 900000, type: "number", advanced: true },
      { env: "GRID_INTERVAL_MS", label: "Poll interval (ms)", def: 8000, type: "number", advanced: true },
    ],
  },
  {
    kind: "spot",
    id: "momentum",
    name: "Momentum",
    blurb: "Follow the trend, with take-profit and stop-loss.",
    symbolEnv: "MOM_SYMBOL",
    params: [
      { env: "MOM_SYMBOL", label: "Market", def: "WETH:USDso", type: "select", options: MARKETS },
      { env: "MOM_NOTIONAL_USDSO", label: "Position size (USDso)", def: 25, type: "number" },
      { env: "MOM_ENTRY_MOMENTUM", label: "Entry momentum", def: 0.008, type: "number", help: "Move needed to enter (0.008 = 0.8%)." },
      { env: "MOM_TAKE_PROFIT_PCT", label: "Take profit", def: 0.01, type: "number", help: "0.01 = 1%." },
      { env: "MOM_STOP_LOSS_PCT", label: "Stop loss", def: 0.006, type: "number", help: "0.006 = 0.6%." },
      { env: "MOM_WINDOW_SIZE", label: "Lookback window", def: 20, type: "number", advanced: true },
      { env: "MOM_EXIT_MOMENTUM", label: "Exit momentum", def: 0, type: "number", advanced: true },
      { env: "MOM_CROSS_BPS", label: "Cross-through (bps)", def: 8, type: "number", advanced: true },
      { env: "MOM_INTERVAL_MS", label: "Poll interval (ms)", def: 5000, type: "number", advanced: true },
    ],
  },
  {
    kind: "spot",
    id: "mean-reversion",
    name: "Mean Reversion",
    blurb: "Bet the price snaps back to average.",
    symbolEnv: "MR_SYMBOL",
    params: [
      { env: "MR_SYMBOL", label: "Market", def: "WETH:USDso", type: "select", options: MARKETS },
      { env: "MR_NOTIONAL_USDSO", label: "Position size (USDso)", def: 25, type: "number" },
      { env: "MR_RSI_OVERSOLD", label: "RSI oversold (buy)", def: 30, type: "number", help: "Enter when RSI drops below this." },
      { env: "MR_TAKE_PROFIT_PCT", label: "Take profit", def: 0.012, type: "number", help: "0.012 = 1.2%." },
      { env: "MR_STOP_LOSS_PCT", label: "Stop loss", def: 0.02, type: "number", help: "0.02 = 2%." },
      { env: "MR_RSI_PERIOD", label: "RSI period", def: 14, type: "number", advanced: true },
      { env: "MR_RSI_EXIT", label: "RSI exit", def: 52, type: "number", advanced: true },
      { env: "MR_WINDOW_SIZE", label: "Lookback window", def: 40, type: "number", advanced: true },
      { env: "MR_BB_PERIOD", label: "Bollinger period", def: 20, type: "number", advanced: true },
      { env: "MR_BB_MULT", label: "Bollinger multiplier", def: 2, type: "number", advanced: true },
      { env: "MR_CROSS_BPS", label: "Cross-through (bps)", def: 8, type: "number", advanced: true },
      { env: "MR_INTERVAL_MS", label: "Poll interval (ms)", def: 5000, type: "number", advanced: true },
    ],
  },
  {
    kind: "spot",
    id: "twap",
    name: "TWAP",
    blurb: "Split one big order into slices over time.",
    symbolEnv: "TWAP_SYMBOL",
    params: [
      { env: "TWAP_SYMBOL", label: "Market", def: "SOMI:USDso", type: "select", options: MARKETS },
      { env: "TWAP_SIDE", label: "Side", def: "buy", type: "select", options: ["buy", "sell"] },
      { env: "TWAP_TOTAL_USDSO", label: "Total to trade (USDso)", def: 20, type: "number" },
      { env: "TWAP_SLICES", label: "Number of slices", def: 5, type: "number" },
      { env: "TWAP_INTERVAL_SEC", label: "Seconds between slices", def: 30, type: "number" },
      { env: "TWAP_MAX_SLIPPAGE_BPS", label: "Max slippage (bps)", def: 15, type: "number", advanced: true },
    ],
  },
  {
    kind: "spot",
    id: "ensemble",
    name: "Ensemble",
    blurb: "Three advisors vote on each trade.",
    symbolEnv: "SYMBOL",
    params: [
      { env: "SYMBOL", label: "Market", def: "WETH:USDso", type: "select", options: MARKETS },
      { env: "MSA_NOTIONAL_USDSO", label: "Position size (USDso)", def: 25, type: "number", help: "Default order notional." },
      { env: "MSA_TAKE_PROFIT_PCT", label: "Take profit", def: 0.012, type: "number", help: "0.012 = 1.2%." },
      { env: "MSA_STOP_LOSS_PCT", label: "Stop loss", def: 0.01, type: "number", help: "0.01 = 1%." },
      { env: "MSA_MAX_RISK_PERCENT", label: "Max risk per trade", def: 0.15, type: "number", help: "Fraction of free balance." },
      { env: "MSA_MAX_LOSS_PERCENT", label: "Halt after loss", def: 0.5, type: "number", help: "Fraction of starting equity." },
      { env: "FEATURES_MOMENTUM", label: "Momentum advisor", def: "true", type: "select", options: ["true", "false"], help: "Enable momentum signal." },
      { env: "FEATURES_MEAN_REVERSION", label: "Mean reversion advisor", def: "true", type: "select", options: ["true", "false"], help: "Enable RSI+BB signal." },
      { env: "FEATURES_GRID", label: "Grid advisor", def: "true", type: "select", options: ["true", "false"], help: "Enable range-position signal." },
      { env: "MSA_LOOP_MS", label: "Cycle interval (ms)", def: 60000, type: "number", advanced: true },
      { env: "MSA_CROSS_BPS", label: "Cross-through (bps)", def: 8, type: "number", advanced: true },
      { env: "MSA_WINDOW_SIZE", label: "Lookback window", def: 40, type: "number", advanced: true },
      { env: "MSA_MOM_ENTRY", label: "Momentum entry", def: 0.008, type: "number", advanced: true },
      { env: "MSA_MOM_STRONG", label: "Strong momentum", def: 0.01, type: "number", advanced: true },
      { env: "MSA_RSI_PERIOD", label: "RSI period", def: 14, type: "number", advanced: true },
      { env: "MSA_BB_PERIOD", label: "Bollinger period", def: 20, type: "number", advanced: true },
      { env: "MSA_BB_MULT", label: "Bollinger multiplier", def: 2, type: "number", advanced: true },
      { env: "MSA_RSI_OVERSOLD", label: "RSI oversold", def: 30, type: "number", advanced: true },
      { env: "MSA_RSI_OVERBOUGHT", label: "RSI overbought", def: 70, type: "number", advanced: true },
    ],
    envDefaults: [{ env: "FEATURES_AI", def: "false", after: "FEATURES_GRID" }],
  },
  // ── Event contracts ────────────────────────────────────────────────────────
  // Binary Up/Down markets on BTC and ETH price. No trading pair to choose: a
  // market is an underlying plus a window, and the venue decides which windows
  // exist. Prices are probabilities in (0, 1), sizes are contracts.
  {
    kind: "ec",
    id: "ec-starter",
    name: "EC Starter",
    blurb: "Crosses the spread on a live window. The simplest one to read.",
    symbolEnv: "EC_UNDERLYING",
    params: [
      { env: "EC_UNDERLYING", label: "Underlying", def: "", type: "select", options: UNDERLYINGS, help: "Leave blank to trade whatever the venue is running." },
      { env: "TAKE_MAX_SHARES", label: "Contracts per trade", def: 5, type: "number" },
      { env: "TAKE_MAX_POSITION", label: "Max net position", def: 20, type: "number", help: "It stops leaning once it is this far one way." },
      { env: "TAKE_INTERVAL_MS", label: "Trade every (ms)", def: 8000, type: "number", advanced: true },
    ],
  },
  {
    kind: "ec",
    id: "ec-maker",
    name: "EC Market Maker",
    blurb: "Rests a bid and an ask around a fair probability.",
    symbolEnv: "EC_UNDERLYING",
    params: [
      { env: "EC_UNDERLYING", label: "Underlying", def: "", type: "select", options: UNDERLYINGS, help: "Leave blank to quote whatever the venue is running." },
      { env: "MM_SPREAD", label: "Half-spread", def: 0.02, type: "number", help: "In probability. 0.02 quotes 2 points either side of fair." },
      { env: "MM_QUOTE_SIZE", label: "Contracts per side", def: 5, type: "number" },
      { env: "MM_MAX_INVENTORY", label: "Max net position", def: 20, type: "number", help: "Past this it quotes only the side that unwinds." },
      { env: "MM_REFRESH_MS", label: "Re-quote every (ms)", def: 10000, type: "number", advanced: true },
    ],
  },
  {
    kind: "ec",
    id: "ec-passive",
    name: "EC Passive Bid",
    blurb: "One resting bid at your price. Never pays the spread.",
    symbolEnv: "EC_UNDERLYING",
    params: [
      { env: "EC_UNDERLYING", label: "Underlying", def: "", type: "select", options: UNDERLYINGS },
      { env: "EC_SIDE", label: "Side", def: "up", type: "select", options: ["up", "down"], help: "Which way you are betting." },
      { env: "EC_TARGET", label: "Most you will pay", def: 0.4, type: "number", help: "A probability. 0.4 means you buy at 40% or better." },
      { env: "EC_SIZE", label: "Contracts per order", def: 5, type: "number" },
      { env: "EC_MAX_POSITION", label: "Stop after (contracts)", def: 20, type: "number" },
      { env: "EC_REFRESH_MS", label: "Re-check every (ms)", def: 15000, type: "number", advanced: true },
    ],
  },
  {
    kind: "ec",
    id: "ec-laddering-bot",
    name: "EC Ladder",
    blurb: "A grid of resting orders each side of the mid, flattened before expiry.",
    symbolEnv: "EC_UNDERLYING",
    params: [
      { env: "EC_UNDERLYING", label: "Underlying", def: "", type: "select", options: UNDERLYINGS },
      { env: "GRID_LEVELS", label: "Rungs per side", def: 2, type: "number" },
      { env: "GRID_SPACING", label: "Gap between rungs", def: 0.05, type: "number", help: "In probability. 0.05 is 5 points." },
      { env: "GRID_SIZE", label: "Contracts per rung", def: 5, type: "number" },
      { env: "GRID_MAX_INVENTORY", label: "Max net position", def: 20, type: "number" },
      { env: "GRID_REFRESH_MS", label: "Refresh every (ms)", def: 10000, type: "number", advanced: true },
    ],
  },
  {
    kind: "ec",
    id: "ec-settlement",
    name: "EC Settlement",
    blurb: "Not a trader: collects winnings from markets that already settled.",
    symbolEnv: "EC_UNDERLYING",
    params: [
      { env: "CLAIM", label: "Sweep and exit", def: "1", type: "select", options: ["1", "0"], help: "1 sweeps every settled market and stops. 0 watches one to expiry instead." },
      { env: "CLAIM_SCAN", label: "Markets to check", def: 25, type: "number" },
      { env: "WATCH_POLL_MS", label: "Poll every (ms)", def: 15000, type: "number", advanced: true },
    ],
  },
];
