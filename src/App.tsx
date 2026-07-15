import { useMemo, useState } from "react";
import { STRATEGIES, type Strategy, type Param } from "./strategies";

const KIT_REPO = "https://github.com/somnia-chain/dreamdex-bot-kit";
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
          <span className="logo">◆</span> DreamDEX <b>Bot Builder</b>
        </div>
        <div className="tag">Pick a strategy, tune it, deploy. No coding.</div>
      </header>

      <div className="safebar">
        🔒 Non-custodial: your private key <b>never touches this site</b>. You add it yourself, on your own machine or cloud.
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
        Built on the <a href={KIT_REPO} target="_blank" rel="noreferrer">DreamDEX Bot Kit</a>. Educational tooling, not financial advice.
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
      <p className="sub">New here? Start with <b>Starter</b> or <b>Market Maker</b>.</p>
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
      <p className="sub">Always start on testnet with dry-run on. Bugs are free on testnet, expensive on mainnet.</p>

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
          <div className="warn">⚠️ Live mode places real orders with real funds. Only after you've watched dry-run.</div>
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
      <p className="sub">Sensible defaults are filled in. Change what you like.</p>

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
    const lines = [
      "# DreamDEX bot config — generated by the Bot Builder",
      "# 1) Add your own funded key below. Never share it, never commit this file.",
      "# 2) Save this as `.env` in the dreamdex-bot-kit folder.",
      "",
      `NETWORK=${network}`,
      `DRY_RUN=${dryRun}`,
      "PRIVATE_KEY=",
      "",
      ...strat.params.map((p) => `${p.env}=${values[p.env]}`),
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
      <p className="sub">Two ways to run it. Either way, <b>your key stays with you</b>.</p>

      <div className="block">
        <div className="block-head">
          <span>1 · Your config <code>.env</code></span>
          <div>
            <CopyBtn text={envFile} />
            <button className="mini" onClick={() => download(".env", envFile)}>Download</button>
          </div>
        </div>
        <pre>{envFile}</pre>
        <div className="note">You add <code>PRIVATE_KEY</code> yourself. This site never sees it. Use a dedicated bot wallet.</div>
      </div>

      <div className="block">
        <div className="block-head">
          <span>2 · Run it — Option A: on your machine</span>
          <CopyBtn text={commands} />
        </div>
        <pre>{commands}</pre>
        <div className="note">An AI coding agent (Claude Code, Cursor) can run these steps for you.</div>
      </div>

      <div className="block">
        <div className="block-head"><span>2 · Run it — Option B: 24/7 in the cloud</span></div>
        <p className="note" style={{ marginTop: 0 }}>
          Keep it running around the clock without your laptop on, using any always-on host you control
          (a small VPS, or a platform like Railway or Render). It's still your box and your key.
        </p>
        <ol className="steps">
          <li>Create a project from the kit repo: <code>{KIT_REPO.replace("https://", "")}</code></li>
          <li>Set the start command to <code>npm install &amp;&amp; npm start -w {strat.id}</code></li>
          <li>Add the values from your <code>.env</code> above (including <code>PRIVATE_KEY</code>) as the host's environment variables.</li>
          <li>Deploy, and watch the logs the same way you would locally.</li>
        </ol>
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
