import { useMemo, useState } from "react";
import { STRATEGIES, type Strategy, type Param } from "./strategies";

const KIT_REPO = "https://github.com/somnia-chain/dreamdex-bot-kit";
const RAILWAY_TEMPLATE = "https://railway.com/deploy/pE6EIF";
const DISCLAIMER_URL = `${KIT_REPO}/blob/main/DISCLAIMER.md`;
const LEADERBOARD_URL = "https://leaderboard.dreamdex.io/";
const EXPORT_KEY_URL = "https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key/";
const STEPS = ["Strategy", "Network", "Tune", "Deploy"];

export function App() {
  const [step, setStep] = useState(0);
  const [stratId, setStratId] = useState<string | null>(null);
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [dryRun, setDryRun] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const strat = useMemo(() => STRATEGIES.find((s) => s.id === stratId) ?? null, [stratId]);

  function pickStrategy(s: Strategy) {
    setStratId(s.id);
    const init: Record<string, string> = {};
    for (const p of s.params) init[p.env] = String(p.def);
    setValues(init);
    setStep(1);
  }

  const setVal = (env: string, v: string) => setValues((prev) => ({ ...prev, [env]: v }));

  return (
    <div className="wrap">
      <header>
        <div className="brand">
          <span className="logo">◆</span> dreamBot <b>Builder</b>
        </div>
        <div className="tag">Pick a strategy, tune it, deploy. No coding.</div>
      </header>

      <a className="arena" href={LEADERBOARD_URL} target="_blank" rel="noreferrer">
        <span className="arena-l">
          🏟️ <b>Competing in Algo Arena?</b> Register your wallet on the leaderboard so your bot's volume counts.
        </span>
        <span className="arena-cta">Join Algo Arena →</span>
      </a>

      <div className="safebar">
        🔒 Your key <b>never touches this site</b>. Not financial advice, you trade at your own risk.{" "}
        <a href={DISCLAIMER_URL} target="_blank" rel="noreferrer">Disclaimer</a>
      </div>

      <Stepper step={step} />

      <main>
        {step === 0 && <StrategyStep onPick={pickStrategy} activeId={stratId} />}

        {step === 1 && strat && (
          <NetworkStep
            network={network}
            setNetwork={setNetwork}
            dryRun={dryRun}
            setDryRun={setDryRun}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && strat && (
          <TuneStep
            strat={strat}
            values={values}
            setVal={setVal}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && strat && (
          <DeployStep
            strat={strat}
            network={network}
            dryRun={dryRun}
            values={values}
            onBack={() => setStep(2)}
          />
        )}
      </main>

      <footer>
        Built on the <a href={KIT_REPO} target="_blank" rel="noreferrer">DreamDEX Bot Kit</a>. Educational tooling, not
        financial advice. <a href={DISCLAIMER_URL} target="_blank" rel="noreferrer">Legal disclaimer</a>.
      </footer>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="stepper">
      {STEPS.map((label, i) => (
        <div key={label} className={"pip " + (i === step ? "on" : i < step ? "done" : "")}>
          <span className="num">{i < step ? "✓" : i + 1}</span>
          {label}
        </div>
      ))}
    </div>
  );
}

function StrategyStep({ onPick, activeId }: { onPick: (s: Strategy) => void; activeId: string | null }) {
  return (
    <section>
      <h2>Choose a strategy</h2>
      <p className="sub">New here? Start with <b>Starter</b>.</p>
      <div className="cards">
        {STRATEGIES.map((s) => (
          <button key={s.id} className={"card " + (activeId === s.id ? "sel" : "")} onClick={() => onPick(s)}>
            <div className="card-name">{s.name}</div>
            <div className="card-blurb">{s.blurb}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

function NetworkStep(props: {
  network: "testnet" | "mainnet";
  setNetwork: (n: "testnet" | "mainnet") => void;
  dryRun: boolean;
  setDryRun: (b: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { network, setNetwork, dryRun, setDryRun, onBack, onNext } = props;
  return (
    <section>
      <h2>Network &amp; safety</h2>
      <p className="sub">Start on testnet with dry-run on.</p>

      <div className="field">
        <label>Network</label>
        <div className="toggle">
          <button className={network === "testnet" ? "on" : ""} onClick={() => setNetwork("testnet")}>Testnet (practice)</button>
          <button className={network === "mainnet" ? "on" : ""} onClick={() => setNetwork("mainnet")}>Mainnet (Algo Arena)</button>
        </div>
      </div>

      <div className="field">
        <label>Mode</label>
        <div className="toggle">
          <button className={dryRun ? "on" : ""} onClick={() => setDryRun(true)}>Dry-run (logs only)</button>
          <button className={!dryRun ? "on danger" : ""} onClick={() => setDryRun(false)}>Live (sends real orders)</button>
        </div>
        {!dryRun && (
          <div className="warn">
            ⚠️ Live mode places real orders with real funds, and you are solely responsible for any losses. Only go
            live after you've watched dry-run and understand what the bot does.
          </div>
        )}
        {network === "mainnet" && (
          <div className="warn">⚠️ Mainnet uses real value. Test on testnet first.</div>
        )}
      </div>

      <Nav onBack={onBack} onNext={onNext} />
    </section>
  );
}

function TuneStep(props: {
  strat: Strategy;
  values: Record<string, string>;
  setVal: (env: string, v: string) => void;
  showAdvanced: boolean;
  setShowAdvanced: (b: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { strat, values, setVal, showAdvanced, setShowAdvanced, onBack, onNext } = props;
  const basic = strat.params.filter((p) => !p.advanced);
  const advanced = strat.params.filter((p) => p.advanced);
  return (
    <section>
      <h2>Tune {strat.name}</h2>
      <p className="sub">Defaults are filled in. Change what you like.</p>

      <div className="grid">
        {basic.map((p) => <Field key={p.env} p={p} value={values[p.env]} onChange={(v) => setVal(p.env, v)} />)}
      </div>

      {advanced.length > 0 && (
        <>
          <button className="link" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? "Hide" : "Show"} advanced ({advanced.length})
          </button>
          {showAdvanced && (
            <div className="grid">
              {advanced.map((p) => <Field key={p.env} p={p} value={values[p.env]} onChange={(v) => setVal(p.env, v)} />)}
            </div>
          )}
        </>
      )}

      <Nav onBack={onBack} onNext={onNext} nextLabel="Get my bot →" />
    </section>
  );
}

function Field({ p, value, onChange }: { p: Param; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label>{p.label}</label>
      {p.type === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {p.options!.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={p.type} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {p.help && <div className="help">{p.help}</div>}
    </div>
  );
}

function DeployStep(props: {
  strat: Strategy;
  network: string;
  dryRun: boolean;
  values: Record<string, string>;
  onBack: () => void;
}) {
  const { strat, network, dryRun, values, onBack } = props;

  const envFile = useMemo(() => {
    const paramLines = strat.params.map((p) => `${p.env}=${values[p.env]}`);
    for (const d of strat.envDefaults ?? []) {
      const line = `${d.env}=${d.def}`;
      if (d.after) {
        const idx = paramLines.findIndex((l) => l.startsWith(`${d.after}=`));
        if (idx >= 0) paramLines.splice(idx + 1, 0, line);
        else paramLines.push(line);
      } else {
        paramLines.push(line);
      }
    }
    const lines = [
      "# DreamDEX bot config — generated by the Bot Builder",
      "# 1) Add your own funded key below. Never share it, never commit this file.",
      "# 2) Save this as `.env` in the dreamdex-bot-kit folder.",
      "",
      `NETWORK=${network}`,
      `DRY_RUN=${dryRun}`,
      `STRATEGY=${strat.id}`,
      "PRIVATE_KEY=0x...",
      "",
      ...paramLines,
      "",
    ];
    return lines.join("\n");
  }, [strat, network, dryRun, values]);

  const commands = [
    `git clone ${KIT_REPO}`,
    "cd dreamdex-bot-kit",
    "npm install",
    "# save the .env above into this folder, then:",
    `npm run dev -w ${strat.id}`,
  ].join("\n");

  return (
    <section>
      <h2>Your bot is ready</h2>
      <p className="sub">Two ways to run it. Your key stays with you.</p>

      <div className="block">
        <div className="block-head">
          <span>1 · Your config <code>.env</code></span>
          <div>
            <CopyBtn text={envFile} />
            <button className="mini" onClick={() => download(".env", envFile)}>Download</button>
          </div>
        </div>
        <pre>{envFile}</pre>
        <div className="note">
          Replace the <code>0x...</code> placeholder with your own key — it <b>must start with 0x</b>, like{" "}
          <code>PRIVATE_KEY=0xabc123...</code>. MetaMask gives you the key without the <code>0x</code>, so type it in
          front yourself. <a href={EXPORT_KEY_URL} target="_blank" rel="noreferrer">How to export your key →</a><br />
          This site never sees your key. Use a dedicated bot wallet.
        </div>
      </div>

      <div className="block">
        <div className="block-head"><span>2 · Run it — Option A: 24/7 on Railway (easiest)</span></div>
        <p className="note" style={{ marginTop: 0 }}>
          Keep it running around the clock without your laptop on. No server setup — deploy the kit's Railway
          template, paste your config, and add your key. Railway's free credit covers light use; a bot running
          24/7 may cost a few dollars after that.
        </p>
        <p style={{ margin: "8px 0" }}>
          <a href={RAILWAY_TEMPLATE} target="_blank" rel="noreferrer">
            <img src="https://railway.com/button.svg" alt="Deploy on Railway" height={32} />
          </a>
        </p>
        <ol className="steps">
          <li>Click <b>Deploy on Railway</b> above.</li>
          <li>In the Railway service, open <code>Variables → RAW Editor</code> and paste your <code>.env</code> block from above.</li>
          <li>On the <code>PRIVATE_KEY=0x...</code> line, replace <code>0x...</code> with your own key — keep the <code>0x</code> prefix — then deploy.</li>
        </ol>
        <div className="note">
          The service may show a <b>“crashed”</b> status until you paste your config — that's expected. It starts
          as soon as your variables are set.
        </div>
        <div className="note">
          Prefer another always-on host (a VPS, Render)? Point it at <code>{KIT_REPO.replace("https://", "")}</code>,
          set the start command to <code>npm install &amp;&amp; npm start -w {strat.id}</code>, and add the same
          <code>.env</code> values as environment variables.
        </div>
      </div>

      <div className="block">
        <div className="block-head">
          <span>2 · Run it — Option B: on your machine (free)</span>
          <CopyBtn text={commands} />
        </div>
        <pre>{commands}</pre>
        <div className="note">An AI coding agent (Claude Code, Cursor) can run these steps for you.</div>
      </div>

      <div className="block legal-block">
        <b>Before you go live.</b> This is educational tooling and a set of guidelines, <b>not financial advice</b> and
        not a recommendation of any strategy or parameters. The templates are provided as is and are not audited. Any
        strategy can lose money, including total loss. You are solely responsible for the strategy you deploy, the
        parameters you set, the security of your keys, and every order your bot places. Test on testnet first, and only
        trade what you can afford to lose.{" "}
        <a href={DISCLAIMER_URL} target="_blank" rel="noreferrer">Full legal disclaimer →</a>
      </div>

      <div className="block finish">
        <b>Then compete:</b> once you're live on mainnet, register at{" "}
        <a href="https://leaderboard.dreamdex.io" target="_blank" rel="noreferrer">leaderboard.dreamdex.io</a>{" "}
        and click <b>Link Algo Wallet</b> for your bot's address, or your volume won't count.
      </div>

      <Nav onBack={onBack} />
    </section>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="mini"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1200); } catch { /* ignore */ }
      }}
    >
      {done ? "Copied ✓" : "Copy"}
    </button>
  );
}

function download(name: string, text: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Nav({ onBack, onNext, nextLabel = "Next →" }: { onBack?: () => void; onNext?: () => void; nextLabel?: string }) {
  return (
    <div className="nav">
      {onBack ? <button className="ghost" onClick={onBack}>← Back</button> : <span />}
      {onNext && <button className="primary" onClick={onNext}>{nextLabel}</button>}
    </div>
  );
}
