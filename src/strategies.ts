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

export type Strategy = {
  id: string; // workspace name, used in `npm run dev -w <id>`
  name: string;
  blurb: string;
  symbolEnv: string;
  params: Param[];
};

// Markets. USDC.e:USDso is mainnet-only; the rest exist on both networks.
export const MARKETS = ["SOMI:USDso", "WETH:USDso", "WBTC:USDso", "USDC.e:USDso"];

export const STRATEGIES: Strategy[] = [
  {
    id: "starter",
    name: "Starter",
    blurb: "The simplest bot. A two-sided quote you can grow into your own strategy. Best first pick.",
    symbolEnv: "SYMBOL",
    params: [
      { env: "SYMBOL", label: "Market", def: "SOMI:USDso", type: "select", options: MARKETS },
      { env: "STARTER_SPREAD_BPS", label: "Spread (bps)", def: 10, type: "number", help: "Total distance between your buy and sell." },
      { env: "STARTER_SIZE_USDSO", label: "Order size (USDso)", def: 20, type: "number", help: "Notional per side." },
      { env: "STARTER_TICK_MS", label: "Re-check every (ms)", def: 5000, type: "number", advanced: true },
    ],
  },
  {
    id: "market-making",
    name: "Market Maker",
    blurb: "Rest buy and sell quotes and earn the spread. The classic low-risk way to generate volume.",
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
    id: "grid",
    name: "Grid",
    blurb: "A ladder of orders that profits from the market bouncing inside a range.",
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
    id: "momentum",
    name: "Momentum",
    blurb: "Follow the trend: buy strength, sell weakness, with take-profit and stop-loss.",
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
    id: "mean-reversion",
    name: "Mean Reversion",
    blurb: "Bet the price snaps back to average, using RSI and Bollinger Bands.",
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
    id: "twap",
    name: "TWAP",
    blurb: "Execution algo: spread one big order into slices over time to reduce impact.",
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
];
