import { checkEvent, summarize, fmt } from "./check.js";
import { events as sampleEvents } from "./samples.js";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const icon = (name) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#i-${name}`);
  svg.append(use);
  return svg;
};
const wide = window.matchMedia("(min-width: 960px)");
let open = null;

/** Text with amounts underlined: green where a journal line uses them, red where they disagree. */
function marked(tag, cls, text, marks) {
  const p = el(tag, cls);
  const sorted = [...marks].sort((a, b) => a.index - b.index);
  let at = 0;
  for (const m of sorted) {
    if (m.index < at) continue;
    p.append(text.slice(at, m.index), el("span", `u ${m.kind}`, text.slice(m.index, m.index + m.text.length)));
    at = m.index + m.text.length;
  }
  p.append(text.slice(at));
  return p;
}

function evidenceMarks(r, where) {
  const used = new Set(r.lines.filter((l) => l.traced && l.traced.where === where).map((l) => l.traced.index));
  const marks = [];
  for (const e of r.evidence.filter((x) => x.where === where)) {
    if (r.conflict && (r.conflict.message === e || r.conflict.document === e)) marks.push({ ...e, kind: "fail" });
    else if (used.has(e.index) || r.lines.some((l) => l.traced === e)) marks.push({ ...e, kind: "pass" });
  }
  return marks;
}

function detail(ev, r) {
  const box = el("div", "evidence");
  box.append(el("p", "side-h", ev.title));
  box.append(el("p", `side-title st-${r.status === "ready" ? "pass" : "fail"}`, r.status === "ready" ? "Ready for review" : "Held back"));

  const bubble = el("div", "bubble");
  bubble.append(el("p", "who", `${ev.from}, ${ev.channel}, ${ev.time}`));
  bubble.append(marked("p", "msg", String(ev.message || ""), evidenceMarks(r, "message")));
  if (ev.document) {
    const d = el("div", "doc");
    d.append(el("p", "doc-name", `${ev.document.kind}: ${ev.document.name}`));
    d.append(marked("p", "doc-text", String(ev.document.text || ""), evidenceMarks(r, "document")));
    bubble.append(d);
  } else {
    const d = el("div", "doc");
    d.append(el("p", "doc-name", "No document attached"));
    bubble.append(d);
  }
  box.append(el("p", "ev-h", "Evidence"), bubble);

  box.append(el("p", "ev-h", `Suggested journal, ${ev.journal?.currency || ""}`));
  const t = el("table", "jtable");
  const thead = el("thead");
  const hr = el("tr");
  hr.append(el("th", null, "Account"), el("th", "num", "Debit"), el("th", "num", "Credit"));
  thead.append(hr);
  const tb = el("tbody");
  for (const l of r.lines) {
    const tr = el("tr");
    tr.append(el("td", "acct", l.account));
    for (const side of ["debitCents", "creditCents"]) {
      const td = el("td", "num");
      if (l[side]) {
        td.append(fmt(l[side]));
        const mk = el("span", `mk ${l.traced ? "st-pass" : "st-fail"}`);
        mk.append(icon(l.traced ? "check" : "cross"));
        mk.setAttribute("title", l.traced ? `In the ${l.traced.where}: ${l.traced.line}` : "Not in the evidence");
        td.append(mk);
        td.setAttribute("aria-label", `${fmt(l[side])}, ${l.traced ? `found in the ${l.traced.where}` : "not in the evidence"}`);
      } else td.append("");
      tr.append(td);
    }
    tb.append(tr);
  }
  const tf = el("tfoot");
  const fr = el("tr");
  fr.append(el("td", "acct", "Total"), el("td", "num", fmt(r.debit)), el("td", "num", fmt(r.credit)));
  tf.append(fr);
  t.append(thead, tb, tf);
  box.append(t);

  const bal = el("p", `bal ${r.balanced ? "st-pass" : "st-fail"}`);
  bal.append(icon(r.balanced ? "check" : "cross"), r.balanced ? "Balanced" : `Off by ${fmt(Math.abs(r.debit - r.credit))}`);
  box.append(bal);

  if (r.reasons.length) {
    box.append(el("p", "ev-h", "Why it is held back"));
    const ul = el("ul", "reasons");
    for (const reason of r.reasons) {
      const li = el("li");
      li.append(icon("cross"), el("span", null, reason));
      ul.append(li);
    }
    box.append(ul);
  } else {
    const ok = el("p", "ok-line st-pass");
    ok.append(icon("check"), el("span", null, "Every amount is in the message or the document, in the same currency, and they agree. A person still reviews and books it."));
    box.append(ok);
  }
  return box;
}

function rowItem(key, cells, render) {
  const li = el("div", "row-item");
  const btn = el("button", "row verdict");
  btn.type = "button";
  btn.setAttribute("aria-expanded", "false");
  btn.append(...cells);
  const chev = icon("chev");
  chev.classList.add("chev");
  btn.append(chev);
  const entry = { key, li, btn, render };
  btn.addEventListener("click", () => toggle(entry));
  li.append(btn);
  li._entry = entry;
  return li;
}

function closeOpen() {
  if (!open) return;
  open.btn.setAttribute("aria-expanded", "false");
  open.li.querySelector(".evidence")?.remove();
  open = null;
  $("side").replaceChildren();
}

function show(entry, animate = true) {
  const box = entry.render();
  if (animate) box.classList.add("enter");
  entry.btn.setAttribute("aria-expanded", "true");
  if (wide.matches) $("side").replaceChildren(box);
  else entry.li.append(box);
  open = entry;
  requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add("drawn")));
}

function toggle(entry) {
  const same = open && open.key === entry.key;
  closeOpen();
  if (!same) show(entry);
}

wide.addEventListener("change", () => {
  if (!open) return;
  const entry = open;
  closeOpen();
  show(entry, false);
});

/** One line a reader gets without a tap. */
function shortReason(ev, r) {
  const kind = (ev.document?.kind || "document").toLowerCase();
  if (!r.evidence.length) return `Booked ${fmt(r.lines[0]?.cents || 0)} with no amount or ${ev.document ? kind : "invoice"} behind it.`;
  if (r.conflict) return `Message says ${r.conflict.message.text}, ${kind} says ${r.conflict.document.text}.`;
  const missing = r.lines.find((l) => !l.traced);
  const total = r.evidence.find((e) => e.isTotal);
  if (!r.balanced && missing && missing.otherCurrency === null && total && total.currency && total.currency !== ev.journal?.currency) {
    return `Off by ${fmt(Math.abs(r.debit - r.credit))}, and the ${kind} is in ${total.currency}.`;
  }
  if (!r.balanced) return `Off by ${fmt(Math.abs(r.debit - r.credit))}.`;
  if (missing) return `${fmt(missing.cents)} booked; the ${kind} says ${total ? total.text : "something else"}.`;
  return r.reasons[0] || "Held back.";
}

function render(events, { fresh = false } = {}) {
  closeOpen();
  const results = events.map((e) => checkEvent(e));
  const { total, ready, held } = summarize(results);
  const sum = $("summary");
  sum.replaceChildren(el("span", "sum-main", `${ready} of ${total} ready for review`));
  if (held) {
    const side = el("span", "sum-side fail");
    side.append(icon("cross"), `${held} held back`);
    sum.append(side);
  }
  $("chain").textContent = "Ready means debits equal credits, every amount is in the message or the document in the same currency, and the two agree.";

  const rows = el("div", "rows");
  rows.append(...events.map((ev, i) => {
    const r = results[i];
    const ok = r.status === "ready";
    const st = el("span", `status ${ok ? "st-pass" : "st-fail"}`);
    st.append(icon(ok ? "check" : "cross"), ok ? "Ready" : "Held");
    const val = el("span", "val");
    const first = r.lines[0];
    val.append(el("b", null, String(ev.title || "Event")), `${ev.from}, ${ev.channel}`);
    if (ok && first) val.append(el("span", "meta", `${first.account}, ${ev.journal?.currency || ""} ${fmt(first.cents)}`));
    if (!ok) val.append(el("span", "meta st-fail", shortReason(ev, r)));
    return rowItem(`e-${i}`, [st, val], () => detail(ev, r));
  }));
  if (fresh) rows.classList.add("fresh");
  const g = el("section", "group");
  g.append(el("h2", "group-h", "This week's messages"), rows);
  $("groups").replaceChildren(g);

  // Open the first held-back event, so the first thing seen is a catch with its evidence.
  const lead = results.findIndex((r) => r.status === "held");
  const li = rows.children[lead >= 0 ? lead : 0];
  if (li) show(li._entry, false);
}

const sampleJson = () => JSON.stringify(sampleEvents, null, 2);
$("events-in").value = sampleJson();
$("events-check").addEventListener("click", () => {
  const err = $("events-error");
  try {
    const evs = JSON.parse($("events-in").value);
    if (!Array.isArray(evs) || evs.some((e) => !e || typeof e !== "object" || !e.journal)) throw new Error("shape");
    err.hidden = true;
    render(evs, { fresh: true });
    $("summary").scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  } catch {
    err.textContent = "That isn't a JSON list of events with a message and a journal. Reset the sample to see the shape.";
    err.hidden = false;
  }
});
$("events-reset").addEventListener("click", () => {
  $("events-in").value = sampleJson();
  $("events-error").hidden = true;
  render(sampleEvents, { fresh: true });
});

render(sampleEvents);
