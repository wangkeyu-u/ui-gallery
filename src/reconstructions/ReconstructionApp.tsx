import './reconstructions.css';

function Ledger() {
  const rows = [['Brand system', '$4,800'], ['Editorial design', '$2,400'], ['Motion studies', '$1,350']];
  return <main className="repro ledger" data-case="ledger">
    <header><a className="wordmark">NORTH/08</a><nav><span>Work</span><span>Studio</span><span>Contact</span></nav></header>
    <section className="ledger-hero"><div><p className="eyebrow">Independent creative studio</p><h1>Clarity,<br/><i>made visible.</i></h1></div><p className="intro">We turn complex ideas into precise identities, digital systems, and editorial experiences.</p></section>
    <section className="ledger-sheet"><div className="sheet-title"><span>Selected scope</span><span>Estimate 08/26</span></div>{rows.map(([a,b],i)=><div className="sheet-row" key={a}><b>0{i+1}</b><span>{a}</span><strong>{b}</strong></div>)}<div className="sheet-total"><span>Project total</span><strong>$8,550</strong></div></section>
  </main>;
}

function Orbit() {
  const stats = [['1,284','Signals'],['87.4%','Coverage'],['24ms','Latency']];
  return <main className="repro orbit" data-case="orbit">
    <aside><div className="orbit-mark">O</div><div className="orbit-nav"><span className="active">Overview</span><span>Observatory</span><span>Reports</span><span>Archive</span></div><div className="analyst"><span>RK</span><small>Lead analyst</small></div></aside>
    <section className="orbit-main"><header><div><p>Thursday, 13 August</p><h1>Good morning, Rowan.</h1></div><button>Export report</button></header><div className="stats">{stats.map(([v,l])=><article key={l}><span>{l}</span><strong>{v}</strong><small>↑ 4.8% this cycle</small></article>)}</div><section className="signal-card"><div className="card-head"><div><span>Live signal</span><h2>Regional activity</h2></div><b>Last 12 hours</b></div><div className="bars">{[34,48,43,66,57,78,71,88,64,82,76,93].map((v,i)=><i key={i} style={{height:`${v}%`}} />)}</div><div className="axis"><span>00</span><span>04</span><span>08</span><span>12</span></div></section></section>
  </main>;
}

function Fieldnotes() {
  return <main className="repro fieldnotes" data-case="fieldnotes">
    <header><div className="field-brand">FIELD<br/>NOTES</div><div className="issue">ISSUE 014<br/><span>Summer / 2026</span></div><div className="field-menu">Index&nbsp;&nbsp;&nbsp; About&nbsp;&nbsp;&nbsp; ↗</div></header>
    <section className="feature"><div className="feature-copy"><p>ARCHITECTURE / MATERIAL / PLACE</p><h1>A quiet study<br/>of <em>useful</em> space.</h1><div className="byline"><span>Words by Mina Zhou</span><span>12 min read</span></div></div><div className="feature-art"><div className="sun"></div><div className="building"><i></i><i></i><i></i></div><span>37° 48′ 32″ N</span></div></section>
    <footer><span>01</span><p>At the edge of the valley, a workshop makes room for light, weather and the patient work of hands.</p><b>Read story →</b></footer>
  </main>;
}

export function ReconstructionApp() {
  const id = window.location.pathname.split('/').filter(Boolean).at(-1);
  if (id === 'ledger') return <Ledger />;
  if (id === 'orbit') return <Orbit />;
  if (id === 'fieldnotes') return <Fieldnotes />;
  return <main>Unknown reconstruction case.</main>;
}
