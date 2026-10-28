// Builds the .html of the #4471 page, as the desk sees it: the page's .svx text, the runbook frame,
// and the CauseTable / RenderStamp output, all computed with the kb's own logic in src/lib.
// Run: node --experimental-strip-types --no-warnings build-page.mjs
import fs from 'node:fs';
import path from 'node:path';

const lib = path.resolve('src/lib');
const pageDir = path.resolve('src/routes/kb/incidents/4471-causes');
const { groupByCause, uniqueById, readAs, ticketCause } = await import(lib + '/kb/causes.ts');
const { deskRef } = await import(lib + '/kb/desk-ref.ts');
const { daysSince, isoDay, STALE_AFTER_DAYS } = await import(lib + '/kb/staleness.ts');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// frontmatter of the .svx
const svx = fs.readFileSync(path.join(pageDir, '+page.svx'), 'utf8');
const fm = Object.fromEntries(
  svx.match(/^---\n([\s\S]*?)\n---/)[1].split('\n').map((l) => {
    const i = l.indexOf(':');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^'(.*)'$/, '$1')];
  }),
);

// data, exactly as CauseTable reads it
const reports = JSON.parse(fs.readFileSync(lib + '/data/reports-4471.json', 'utf8'));
const notes = JSON.parse(fs.readFileSync(lib + '/data/desk-notes.json', 'utf8'));
const tdir = lib + '/data/tenants';
const tenants = new Map(fs.readdirSync(tdir).map((f) => { const t = JSON.parse(fs.readFileSync(path.join(tdir, f), 'utf8')); return [t.handle, t]; }));
const ticket = 4471;
const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
const groups = groupByCause(merged, (r) => tenants.get(r.tenant));
const owner = ticketCause(groups, ticket);
const tags = (g) => Object.entries(g.taggedAs).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ×${n}`).join(' · ');

const rows = groups.map((g) => `      <tr class="${g.cause !== owner ? 'wrong' : ''}">
        <td><code>${g.cause}</code></td>
        <td>${g.reports.length}</td>
        <td class="tags">${esc(tags(g))}</td>
        <td>${g.tenants}</td>
        <td>${g.firstSeen} → ${g.lastSeen}</td>
        <td>${g.cause === owner ? `#${ticket}` : 'not this ticket — no ticket of its own'}</td>
      </tr>`).join('\n');
const footnotes = groups.map((g) => { const m = readAs(g, notes.oneDayMove); return m ? `<p class="note">${m} reports read as a one-day move; filed under <code>${g.cause}</code> by tenant.</p>` : ''; }).join('\n');
const causeTable = `<p class="sum"><strong>${merged.length}</strong> reports merged into #${ticket} · <strong>${groups.length}</strong> ${groups.length === 1 ? 'cause' : 'causes'}</p>
<table>
  <thead><tr><th>cause</th><th>reports</th><th>tagged as</th><th>tenants</th><th>seen</th><th></th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>
${footnotes}`;

const ref = deskRef(fm.signature);
const stamp = `<p class="stamp">desk ref <b>${ref}</b></p>`;

const age = daysSince(fm.reviewed);
const stale = age > STALE_AFTER_DAYS;

const issues = 'https://github.com/DejwidD/mega-s01e03-what-it-shows/issues';
const n = Object.fromEntries(groups.map((g) => [g.cause, g.reports.length]));

const body = `
<h1 id="what-4471-contains">What #4471 contains</h1>
<p>Ticket #4471 holds <strong>${merged.length} unique reports</strong> about dates on the wrong day. They are not one bug. They are two problems, and each needs its own ticket.</p>
<table>
<thead><tr><th>problem</th><th>reports</th><th>ticket</th><th>outcome</th></tr></thead>
<tbody>
<tr><td>The shared parser flips day and month for day-first tenants</td><td>${n.parser}</td><td><a href="${issues}/1">#1</a></td><td>fixed: <code>fix(dates): parse dd/mm for eu locales</code></td></tr>
<tr><td><code>booking-v3</code> prints a month-first hint to day-first tenants</td><td>${n.hint}</td><td><a href="${issues}/2">#2</a></td><td>won't fix: the booking-v3 form is retired</td></tr>
</tbody>
</table>
<p>Engineering closed #4471 on 5 October with these two outcomes.</p>
<h2 id="1-parser-flips-day-and-month">1. Parser flips day and month (${n.parser})</h2>
<p>The shared parser reads every date month first. Day-first tenants see their dates flipped, for example 4 July going out as 7 April. This covers ${groups.find((g) => g.cause === 'parser').tenants} tenants and every channel.</p>
<p>Five of these reports read as a one-day move (${notes.oneDayMove.join(', ')}). The desk files them under their cause, so they stay in this count.</p>
<h2 id="2-the-booking-v3-hint-is-wrong">2. The booking-v3 hint is wrong (${n.hint})</h2>
<p><code>booking-v3</code> prints <code>MM/DD/YYYY</code> under the date field. People at day-first tenants type what the hint tells them, and the form reads it their way. All ${n.hint} reports are form reports from three tenants: <code>alder.physio</code>, <code>copper.studio</code> and <code>pale.harbour</code>.</p>
<h2 id="evidence">Evidence</h2>
${causeTable}
<p>The export has ${reports.length} rows and ${reports.length - uniqueById(reports).length} of them repeat a report id. All counts use one row per id.</p>
${stamp}`;

const css = `:root{--bg:#fbfaf7;--fg:#1d1d1b;--muted:#6b6a66;--line:#e3e0d8;--accent:#2f6f5e;--warn:#b4501f;--warn-bg:#fbeee6;--note-bg:#eef5f2;--mono:ui-monospace,'Cascadia Code',Menlo,monospace}
@media (prefers-color-scheme:dark){:root{--bg:#171716;--fg:#ecebe6;--muted:#9c9a93;--line:#34332f;--accent:#6fbfa6;--warn:#f0905d;--warn-bg:#3a2418;--note-bg:#1d2c27}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,sans-serif}
.kb table{border-collapse:collapse;width:100%;margin:1rem 0;font-size:.92rem}
.kb th,.kb td{border-bottom:1px solid var(--line);padding:.35rem .5rem;text-align:left}
.kb code{font-family:var(--mono);font-size:.88em}.kb a{color:var(--accent)}
.kb{max-width:760px;margin:0 auto;padding:2rem 16px 4rem}
.crumb{font:.8rem var(--mono);text-decoration:none;color:var(--muted)}
header h1{margin:.25rem 0 .5rem;line-height:1.2}
.meta{display:flex;flex-wrap:wrap;gap:.5rem 1rem;color:var(--muted);font-size:.85rem;margin:0}
.status{border:1px solid var(--line);border-radius:99px;padding:0 .6rem}
.stale{color:var(--warn);font-weight:600}.banner{background:var(--warn-bg);color:var(--warn);padding:.6rem 1rem;border-radius:6px}
footer{margin-top:3rem;color:var(--muted);font-size:.8rem;border-top:1px solid var(--line);padding-top:1rem}
.sum{font-size:1.1rem}.tags{color:var(--muted);font-size:.85em}.note{color:var(--muted);font-size:.85em}
.wrong td{background:var(--warn-bg)}.wrong td:last-child{color:var(--warn);font-weight:600}
.stamp{margin:2rem 0 0;font:.85rem var(--mono);color:var(--muted)}.stamp b{color:var(--accent);letter-spacing:.04em}`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fm.title)} · support kb</title>
<style>${css}</style>
</head>
<body>
<div class="kb">
  <header>
    <a class="crumb" href="/kb">support desk · kb</a>
    <h1>${esc(fm.title)}</h1>
    <p class="meta">
      <span>owner <b>${esc(fm.owner)}</b></span>
      <span class="status ${esc(fm.status)}">${esc(fm.status)}</span>
      <span class="${stale ? 'stale' : ''}">reviewed ${isoDay(fm.reviewed)} · ${age} days ago${stale ? ' · stale' : ''}</span>
    </p>
  </header>
  ${stale ? `<p class="banner">Nobody has re-read this page in ${age} days. Check it against the live views before you rely on it.</p>` : ''}
  <main>${body}
  </main>
  <footer>Pages are written by people. Tables and charts are built from data at render time.</footer>
</div>
</body>
</html>
`;
fs.writeFileSync(path.join(pageDir, 'index.html'), html);
console.log('wrote index.html · desk ref', ref, '· counts', JSON.stringify(n));
