# dreamBot Builder — flow & logic map

How the wizard turns clicks into a runnable bot config. For anyone integrating
this into a page. **There is no backend:** it's a pure front-end that assembles a
`.env` + run command from the user's choices. The private key is never entered
on the site.

## The wizard in one picture

```mermaid
flowchart TD
  A([Open Bot Builder]) --> B[1 · Choose strategy]

  B --> S1[Starter]
  B --> S2[Market Maker]
  B --> S3[Grid]
  B --> S4[Momentum]
  B --> S5[Mean Reversion]
  B --> S6[TWAP]
  B --> S7[Ensemble]

  S1 & S2 & S3 & S4 & S5 & S6 & S7 --> N[2 · Network & safety]
  N --> N1{Network}
  N1 -->|testnet| N2{Mode}
  N1 -->|mainnet - warning| N2
  N2 -->|dry-run - logs only| T[3 · Tune]
  N2 -->|live - warning| T

  T --> T1[Basic params - shown]
  T --> T2[Advanced params - behind a toggle]
  T1 & T2 --> D[4 · Deploy]

  D --> O1[Generated .env<br/>NETWORK + DRY_RUN + PRIVATE_KEY blank + all params]
  D --> O2[Run locally: git clone -> npm install -> npm run dev -w STRATEGY]
  D --> O3[Run 24/7 in the cloud: same env vars on a host you control]
  D --> O4[Reminder: register + Link Algo Wallet on the leaderboard]
```

## The four steps

| Step | What the user does | What it sets |
| --- | --- | --- |
| **1 · Strategy** | Picks one of 7 strategies | Chooses the whole parameter set + the `npm run dev -w <id>` target |
| **2 · Network & safety** | testnet/mainnet, dry-run/live | `NETWORK`, `DRY_RUN` (defaults: `testnet`, `true`) |
| **3 · Tune** | Adjusts values (basic always shown, advanced behind a toggle) | Every parameter's value |
| **4 · Deploy** | Copies the config + run steps | The final `.env` and the run command |

**Key rule:** the generated `.env` always contains **every** parameter (basic
**and** advanced), at its default unless the user changed it. "Advanced" only
hides fields in the UI — it does not remove them from the output. Some strategies
also emit fixed `envDefaults` (e.g. Ensemble always writes `FEATURES_AI=false`)
that never appear in Tune.

## Output contract (what the site produces)

Deterministic. For a chosen strategy `X` with params `p = value`:

```
# .env
NETWORK=<testnet|mainnet>
DRY_RUN=<true|false>
PRIVATE_KEY=            # user adds their own, must start with 0x

<X_SYMBOL>=<market>
<...every other param>=<value>
```

Plus the run command, where `<id>` is the strategy id below:

```
git clone https://github.com/somnia-chain/dreamdex-bot-kit
cd dreamdex-bot-kit
npm install
# save the .env above here, then:
npm run dev -w <id>        # dry-run: logs orders, sends nothing
```

Markets offered: `SOMI:USDso`, `WETH:USDso`, `WBTC:USDso`, `USDC.e:USDso`
(`USDC.e:USDso` is mainnet-only).

## Per-strategy reference

Defaults and env-var names match the bot kit's `strategies/*/src/config.ts`
exactly, so the generated `.env` drops straight in.

### Starter · `npm run dev -w starter`
Quotes both sides; one editable function.

| Param (env) | Label | Default | Tier |
| --- | --- | --- | --- |
| `SYMBOL` | Market | `SOMI:USDso` | basic |
| `STARTER_SPREAD_BPS` | Spread (bps) | `10` | basic |
| `STARTER_SIZE_USDSO` | Order size (USDso) | `20` | basic |
| `STARTER_TICK_MS` | Re-check every (ms) | `5000` | advanced |

### Market Maker · `npm run dev -w market-making`
Rest quotes both sides, earn the spread.

| Param (env) | Label | Default | Tier |
| --- | --- | --- | --- |
| `MM_SYMBOL` | Market | `SOMI:USDso` | basic |
| `MM_HALF_SPREAD_BPS` | Half-spread (bps) | `5` | basic |
| `MM_NOTIONAL_USDSO` | Order size (USDso) | `20` | basic |
| `MM_INVENTORY_SKEW_BPS` | Inventory skew (bps) | `4` | basic |
| `MM_REQUOTE_TRIGGER_BPS` | Re-quote when price moves (bps) | `3` | basic |
| `MM_MAX_BOOK_SPREAD_BPS` | Skip if book wider than (bps) | `50` | advanced |
| `MM_TARGET_INVENTORY_USDSO` | Target inventory (USDso) | `0` | advanced |
| `MM_REQUOTE_COOLDOWN_MS` | Min re-quote gap (ms) | `2000` | advanced |
| `MM_REFRESH_INTERVAL_MS` | Poll interval (ms) | `5000` | advanced |

### Grid · `npm run dev -w grid`
A ladder of orders for a ranging market.

| Param (env) | Label | Default | Tier |
| --- | --- | --- | --- |
| `GRID_SYMBOL` | Market | `SOMI:USDso` | basic |
| `GRID_STEP_BPS` | Grid step (bps) | `30` | basic |
| `GRID_LOT_USDSO` | Lot size (USDso) | `15` | basic |
| `GRID_MAX_INVENTORY_USDSO` | Max inventory (USDso) | `90` | basic |
| `GRID_MAX_SESSION_LOSS_USDSO` | Stop after loss (USDso) | `25` | basic |
| `GRID_MAX_SPREAD_BPS` | Skip if book wider than (bps) | `60` | advanced |
| `GRID_STUCK_TIMEOUT_MS` | Stuck-order timeout (ms) | `900000` | advanced |
| `GRID_INTERVAL_MS` | Poll interval (ms) | `8000` | advanced |

### Momentum · `npm run dev -w momentum`
Follow the trend, with take-profit and stop-loss.

| Param (env) | Label | Default | Tier |
| --- | --- | --- | --- |
| `MOM_SYMBOL` | Market | `WETH:USDso` | basic |
| `MOM_NOTIONAL_USDSO` | Position size (USDso) | `25` | basic |
| `MOM_ENTRY_MOMENTUM` | Entry momentum | `0.008` | basic |
| `MOM_TAKE_PROFIT_PCT` | Take profit | `0.01` | basic |
| `MOM_STOP_LOSS_PCT` | Stop loss | `0.006` | basic |
| `MOM_WINDOW_SIZE` | Lookback window | `20` | advanced |
| `MOM_EXIT_MOMENTUM` | Exit momentum | `0` | advanced |
| `MOM_CROSS_BPS` | Cross-through (bps) | `8` | advanced |
| `MOM_INTERVAL_MS` | Poll interval (ms) | `5000` | advanced |

### Mean Reversion · `npm run dev -w mean-reversion`
Bet the price snaps back to average (RSI + Bollinger).

| Param (env) | Label | Default | Tier |
| --- | --- | --- | --- |
| `MR_SYMBOL` | Market | `WETH:USDso` | basic |
| `MR_NOTIONAL_USDSO` | Position size (USDso) | `25` | basic |
| `MR_RSI_OVERSOLD` | RSI oversold (buy) | `30` | basic |
| `MR_TAKE_PROFIT_PCT` | Take profit | `0.012` | basic |
| `MR_STOP_LOSS_PCT` | Stop loss | `0.02` | basic |
| `MR_RSI_PERIOD` | RSI period | `14` | advanced |
| `MR_RSI_EXIT` | RSI exit | `52` | advanced |
| `MR_WINDOW_SIZE` | Lookback window | `40` | advanced |
| `MR_BB_PERIOD` | Bollinger period | `20` | advanced |
| `MR_BB_MULT` | Bollinger multiplier | `2` | advanced |
| `MR_CROSS_BPS` | Cross-through (bps) | `8` | advanced |
| `MR_INTERVAL_MS` | Poll interval (ms) | `5000` | advanced |

### TWAP · `npm run dev -w twap`
Split one big order into slices over time.

| Param (env) | Label | Default | Tier |
| --- | --- | --- | --- |
| `TWAP_SYMBOL` | Market | `SOMI:USDso` | basic |
| `TWAP_SIDE` | Side (`buy` / `sell`) | `buy` | basic |
| `TWAP_TOTAL_USDSO` | Total to trade (USDso) | `20` | basic |
| `TWAP_SLICES` | Number of slices | `5` | basic |
| `TWAP_INTERVAL_SEC` | Seconds between slices | `30` | basic |
| `TWAP_MAX_SLIPPAGE_BPS` | Max slippage (bps) | `15` | advanced |

### Ensemble · `npm run dev -w ensemble`
Three advisors vote on each trade (momentum, mean reversion, grid). Vote-only: the builder always emits `FEATURES_AI=false` (not shown in Tune). Optional LLM / `OPENAI_*` stay kit-repo-only.

| Param (env) | Label | Default | Tier |
| --- | --- | --- | --- |
| `SYMBOL` | Market | `WETH:USDso` | basic |
| `MSA_NOTIONAL_USDSO` | Position size (USDso) | `25` | basic |
| `MSA_TAKE_PROFIT_PCT` | Take profit | `0.012` | basic |
| `MSA_STOP_LOSS_PCT` | Stop loss | `0.01` | basic |
| `MSA_MAX_RISK_PERCENT` | Max risk per trade | `0.15` | basic |
| `MSA_MAX_LOSS_PERCENT` | Halt after loss | `0.5` | basic |
| `FEATURES_MOMENTUM` | Momentum advisor | `true` | basic |
| `FEATURES_MEAN_REVERSION` | Mean reversion advisor | `true` | basic |
| `FEATURES_GRID` | Grid advisor | `true` | basic |
| `FEATURES_AI` | *(fixed in `.env`)* | `false` | not shown |
| `MSA_LOOP_MS` | Cycle interval (ms) | `60000` | advanced |
| `MSA_CROSS_BPS` | Cross-through (bps) | `8` | advanced |
| `MSA_WINDOW_SIZE` | Lookback window | `40` | advanced |
| `MSA_MOM_ENTRY` | Momentum entry | `0.008` | advanced |
| `MSA_MOM_STRONG` | Strong momentum | `0.01` | advanced |
| `MSA_RSI_PERIOD` | RSI period | `14` | advanced |
| `MSA_BB_PERIOD` | Bollinger period | `20` | advanced |
| `MSA_BB_MULT` | Bollinger multiplier | `2` | advanced |
| `MSA_RSI_OVERSOLD` | RSI oversold | `30` | advanced |
| `MSA_RSI_OVERBOUGHT` | RSI overbought | `70` | advanced |

## Example: full input → output

**Input:** Market Maker · testnet · dry-run · defaults →

```
NETWORK=testnet
DRY_RUN=true
PRIVATE_KEY=

MM_SYMBOL=SOMI:USDso
MM_HALF_SPREAD_BPS=5
MM_NOTIONAL_USDSO=20
MM_INVENTORY_SKEW_BPS=4
MM_REQUOTE_TRIGGER_BPS=3
MM_MAX_BOOK_SPREAD_BPS=50
MM_TARGET_INVENTORY_USDSO=0
MM_REQUOTE_COOLDOWN_MS=2000
MM_REFRESH_INTERVAL_MS=5000
```

→ run with `npm run dev -w market-making`.

## Source of truth

The whole map is driven by one data file: [`src/strategies.ts`](src/strategies.ts).
Add or change a strategy/param there and the wizard and this map both follow.
