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

export type Issue = { block: boolean; msg: string };

export type Kind = "spot" | "ec" | "perp";

export type Strategy = {
  kind: Kind;
  id: string; // workspace name, used in `npm run dev -w <id>`
  name: string;
  blurb: string;
  symbolEnv: string;
  params: Param[];
  envDefaults?: EnvDefault[]; // emitted in .env but not shown in the tune UI
  // Problems with a config, checked as you tune. `block` is reserved for what
  // the kit itself refuses at startup, with the same condition, so the builder
  // never blocks a file the kit would run. Everything else is a warning.
  check?: (v: Record<string, string>) => Issue | null;
};

// Markets. USDC.e:USDso is mainnet-only; the rest exist on both networks.
export const MARKETS = ["SOMI:USDso", "WETH:USDso", "WBTC:USDso", "USDC.e:USDso"];

// Which underlying to follow. Empty means "whatever the venue is running".
const UNDERLYINGS = ["", "BTC", "ETH"];

// Perp markets, in the app-canonical BASE-PERP form a trader reads off the
// market header. Every one is live on testnet today; the testnet-only SW*
// markets are left out because the app does not offer them. Perps exist on
// testnet only, so there is no mainnet list.
export const PERP_MARKETS = [
  "BTC-PERP", "ETH-PERP", "SOL-PERP", "HYPE-PERP", "XRP-PERP", "BNB-PERP", "DOGE-PERP", "ADA-PERP",
  "SUI-PERP", "LINK-PERP", "AVAX-PERP", "XLM-PERP", "NEAR-PERP", "WLD-PERP", "TAO-PERP",
];

const num = (v: Record<string, string>, k: string) => Number(v[k]);

// The DreamDEX account a perp bot trades through a linked trading key. Blank
// means the bot trades its own key's perps account instead.
const OWNER: Param = {
  env: "OWNER_ADDRESS",
  label: "DreamDEX account wallet address",
  def: "",
  type: "text",
  help: "The account you link the bot to in the app. Leave blank to trade the bot key's own account.",
};

// The kit refuses an OWNER_ADDRESS that is not an address, so this blocks the
// same way; the strategy's own check runs after it.
const withOwner = (check?: Strategy["check"]): Strategy["check"] => (v) => {
  const owner = (v.OWNER_ADDRESS ?? "").trim();
  if (owner && !/^0x[0-9a-fA-F]{40}$/.test(owner)) {
    return { block: true, msg: "The DreamDEX account wallet address has to be a full address: 0x and 40 characters. The kit refuses anything else." };
  }
  return check?.(v) ?? null;
};

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

  // ── Perps ─────────────────────────────────────────────────────────────────
  // Leveraged positions on a continuous book, margined from the MarginBank.
  // Hideki testnet only. The units are not uniform across the kit, so every help line
  // says which one a field uses: take-profit, stop-loss and reduce size are
  // PERCENT, funding thresholds are a FRACTION a year, and guard health is a
  // MULTIPLE of the maintenance requirement.
  {
    kind: "perp",
    id: "perp-starter",
    name: "Perp Starter",
    blurb: "One leveraged position with a take-profit and a stop-loss armed together.",
    symbolEnv: "PERP_SYMBOL",
    params: [
      OWNER,
      { env: "PERP_SYMBOL", label: "Market", def: "BTC-PERP", type: "select", options: PERP_MARKETS },
      { env: "PERP_SIDE", label: "Side", def: "long", type: "select", options: ["long", "short"] },
      { env: "PERP_NOTIONAL_USDSO", label: "Position size (USDso)", def: 50, type: "number", help: "The position's value, not the margin. At 2x, 50 needs about 25 deposited." },
      { env: "PERP_LEVERAGE", label: "Leverage", def: 2, type: "number", help: "Your own cap on this market. Each market has its own maximum on top. With a linked bot, set it in the app: the bot cannot change your account's leverage." },
      { env: "PERP_TAKE_PROFIT_PCT", label: "Take profit (%)", def: 2, type: "number", help: "In percent: 2 closes 2% away from the mark in your favour." },
      { env: "PERP_STOP_LOSS_PCT", label: "Stop loss (%)", def: 1, type: "number", help: "In percent: 1 closes 1% away from the mark against you." },
      { env: "PERP_TICK_MS", label: "Check position every (ms)", def: 10000, type: "number", advanced: true },
      { env: "PERP_FLATTEN_ON_EXIT", label: "Close position on stop", def: "false", type: "select", options: ["false", "true"], advanced: true, help: "true closes the position when you stop the bot. With a linked bot the take-profit and stop-loss only act while it runs, so a stopped bot leaves the position unguarded." },
    ],
    check: withOwner((v) =>
      num(v, "PERP_TAKE_PROFIT_PCT") > 0 && num(v, "PERP_STOP_LOSS_PCT") > 0
        ? null
        : { block: false, msg: "At zero a trigger sits on the mark itself and fires straight away." }),
  },
  {
    kind: "perp",
    id: "perp-maker",
    name: "Perp Market Maker",
    blurb: "Rests a bid and an ask around the mark, leaning them back to flat.",
    symbolEnv: "PERP_SYMBOL",
    params: [
      OWNER,
      { env: "PERP_SYMBOL", label: "Market", def: "BTC-PERP", type: "select", options: PERP_MARKETS },
      { env: "PERP_MM_HALF_SPREAD_BPS", label: "Half-spread (bps)", def: 15, type: "number", help: "Distance of each quote from the mark." },
      { env: "PERP_MM_NOTIONAL_USDSO", label: "Quote size (USDso)", def: 25, type: "number", help: "Position value per side, not margin." },
      { env: "PERP_MM_MAX_POSITION_USDSO", label: "Max position (USDso)", def: 100, type: "number", help: "Past this it quotes only the side that unwinds." },
      { env: "PERP_MM_INVENTORY_SKEW_BPS", label: "Inventory skew (bps)", def: 10, type: "number", help: "How hard to lean quotes to flatten inventory." },
      { env: "PERP_MM_REQUOTE_TRIGGER_BPS", label: "Re-quote when mark moves (bps)", def: 8, type: "number", help: "Higher = fewer re-quotes = less gas." },
      { env: "PERP_MM_LEVERAGE", label: "Leverage", def: 2, type: "number", advanced: true },
      { env: "PERP_MM_REFRESH_MS", label: "Poll interval (ms)", def: 15000, type: "number", advanced: true },
    ],
    check: withOwner((v) =>
      num(v, "PERP_MM_HALF_SPREAD_BPS") > 0
        ? null
        : { block: false, msg: "At zero or below the quotes cross the book, so every one is skipped and nothing rests." }),
  },
  {
    kind: "perp",
    id: "perp-funding",
    name: "Funding Carry",
    blurb: "Holds whichever side funding pays, and steps aside when it stops paying.",
    symbolEnv: "PERP_SYMBOL",
    params: [
      OWNER,
      { env: "PERP_SYMBOL", label: "Market", def: "BTC-PERP", type: "select", options: PERP_MARKETS },
      { env: "PERP_FUNDING_MIN_APR", label: "Enter above (APR)", def: 0.1, type: "number", help: "A fraction a year: 0.1 is 10%. Either sign counts, it takes the side being paid." },
      { env: "PERP_FUNDING_EXIT_APR", label: "Exit below (APR)", def: 0.03, type: "number", help: "A fraction a year: 0.03 is 3%. Has to sit below the entry." },
      { env: "PERP_FUNDING_NOTIONAL_USDSO", label: "Position size (USDso)", def: 50, type: "number", help: "Position value, not margin." },
      { env: "PERP_FUNDING_MAX_POSITION_USDSO", label: "Max position (USDso)", def: 200, type: "number", help: "Carry is fully exposed to price. This is what bounds it." },
      { env: "PERP_FUNDING_LEVERAGE", label: "Leverage", def: 2, type: "number", advanced: true },
      { env: "PERP_FUNDING_POLL_MS", label: "Check funding every (ms)", def: 60000, type: "number", advanced: true },
    ],
    check: withOwner((v) =>
      num(v, "PERP_FUNDING_EXIT_APR") > num(v, "PERP_FUNDING_MIN_APR")
        ? { block: true, msg: "The exit rate is above the entry rate, so the bot would open and close on alternate checks. The kit refuses to start like this." }
        : null),
  },
  {
    kind: "perp",
    id: "perp-guard",
    name: "Perp Risk Guard",
    blurb: "Not a trader: reduces a position before liquidation reaches it.",
    symbolEnv: "PERP_SYMBOL",
    params: [
      OWNER,
      { env: "PERP_SYMBOL", label: "Market", def: "", type: "select", options: ["", ...PERP_MARKETS], help: "Leave blank to guard every market you hold a position in. Margin is shared, so blank is the safer choice." },
      { env: "PERP_GUARD_REDUCE_BELOW", label: "Start reducing below", def: 1.5, type: "number", help: "Health as a multiple of maintenance margin. 1.0 is where liquidation starts, so 1.5 leaves half again as cushion." },
      { env: "PERP_GUARD_REDUCE_PCT", label: "Reduce by (%)", def: 25, type: "number", help: "In percent: 25 closes a quarter of the position each time it trips." },
      { env: "PERP_GUARD_FLATTEN_BELOW", label: "Close everything below", def: 1.15, type: "number", help: "Same health scale. Has to sit below the reduce level." },
      { env: "PERP_GUARD_POLL_MS", label: "Check health every (ms)", def: 30000, type: "number", advanced: true },
    ],
    check: withOwner((v) => {
      if (num(v, "PERP_GUARD_FLATTEN_BELOW") > num(v, "PERP_GUARD_REDUCE_BELOW")) {
        return { block: true, msg: "The close-everything level is above the reduce level, so it would close before it ever reduced. The kit refuses to start like this." };
      }
      if (num(v, "PERP_GUARD_FLATTEN_BELOW") <= 1) {
        return { block: false, msg: "Below 1.0 an account is already inside liquidation, so the guard would be acting at the same moment as the protocol. A level above 1 gives it room." };
      }
      return null;
    }),
  },
];
