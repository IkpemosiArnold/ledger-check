// Ledger Check core. Plain functions, no DOM, no model.
//
// An event is a message (and maybe an attached document) plus the journal an
// AI suggested for it. A journal is ready for a person to review only when:
// debits equal credits, every amount on it appears in the message or the
// document in the same currency, and the message and document agree.
// Anything else is held back with a reason, instead of guessed.

const CUR = "(HK\\$|HKD|US\\$|USD|\\$)";
const NUM = "(\\d{1,3}(?:,\\d{3})+(?:\\.\\d{1,2})?|\\d+(?:\\.\\d{1,2})?)";
const MONEY = new RegExp(`${CUR}\\s?${NUM}|${NUM}\\s?(HKD|USD)\\b`, "g");
const TOTAL_WORDS = /\b(total|amount|net payout|amount paid|amount received)\b/i;

const curCode = (c) => (!c ? null : /^HK|^HKD/.test(c) ? "HKD" : /^US|^USD/.test(c) ? "USD" : c === "$" ? null : c);
const toCents = (s) => Math.round(Number(String(s).replace(/,/g, "")) * 100);
export const fmt = (cents) => (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Money amounts in a text, with where they sit. A document line's currency carries to bare amounts on that document. */
export function amountsIn(text, where, fallbackCurrency = null) {
  const out = [];
  const src = String(text || "");
  for (const m of src.matchAll(MONEY)) {
    const cur = curCode(m[1] || m[4]) || fallbackCurrency;
    const num = m[2] || m[3];
    const lineStart = src.lastIndexOf("\n", m.index) + 1;
    const lineEnd = src.indexOf("\n", m.index);
    const line = src.slice(lineStart, lineEnd < 0 ? src.length : lineEnd);
    out.push({ cents: toCents(num), currency: cur, text: m[0], index: m.index, where, line, isTotal: TOTAL_WORDS.test(line) });
  }
  return out;
}

function docCurrency(text) {
  const m = String(text || "").match(/\b(HKD|USD)\b|HK\$|US\$/);
  return m ? curCode(m[0]) : null;
}

/**
 * Check one event.
 * @returns {{status:"ready"|"held", reasons:string[], lines:object[], debit:number, credit:number, balanced:boolean, evidence:object[], conflict:object|null}}
 */
export function checkEvent(ev) {
  const reasons = [];
  const jcur = String(ev?.journal?.currency || "").toUpperCase();
  const evidence = [
    ...amountsIn(ev?.message, "message"),
    ...(ev?.document ? amountsIn(ev.document.text, "document", docCurrency(ev.document.text)) : []),
  ];
  const lines = (ev?.journal?.lines || []).map((l) => {
    const debit = l.debit ? toCents(l.debit) : 0;
    const credit = l.credit ? toCents(l.credit) : 0;
    const cents = debit || credit;
    const same = evidence.filter((e) => e.cents === cents);
    const traced = same.find((e) => !e.currency || !jcur || e.currency === jcur) || null;
    const otherCurrency = !traced && same.find((e) => e.currency && jcur && e.currency !== jcur);
    return { ...l, debitCents: debit, creditCents: credit, cents, traced, otherCurrency: otherCurrency || null };
  });

  const debit = lines.reduce((s, l) => s + l.debitCents, 0);
  const credit = lines.reduce((s, l) => s + l.creditCents, 0);
  const balanced = lines.length > 0 && debit === credit;
  if (!lines.length) reasons.push("The suggestion has no journal lines.");
  else if (!balanced) reasons.push(`Debits ${fmt(debit)} and credits ${fmt(credit)} do not balance. Off by ${fmt(Math.abs(debit - credit))}.`);

  if (!evidence.length) {
    reasons.push(`No amount in the message${ev?.document ? " or the document" : ", and no document attached"}. ${lines.length ? `${fmt(lines[0].cents)} has nothing behind it yet.` : ""} Ask for the receipt or invoice before booking.`.replace(/\s+/g, " ").trim());
  } else {
    const missing = [...new Set(lines.filter((l) => !l.traced).map((l) => l.cents))];
    for (const c of missing) {
      const other = lines.find((l) => l.cents === c && l.otherCurrency);
      if (other) {
        reasons.push(`${fmt(c)} appears in the evidence in ${other.otherCurrency.currency}, but the journal is in ${jcur}.`);
        continue;
      }
      const totals = evidence.filter((e) => e.isTotal);
      const hint = totals.length ? ` The ${totals[0].where === "document" ? (ev.document.kind || "document").toLowerCase() : "message"} total is ${totals[0].text}.` : "";
      reasons.push(`${fmt(c)} is not in the message or the document.${hint}`);
    }
    const foreign = evidence.filter((e) => e.currency && jcur && e.currency !== jcur);
    if (foreign.length && !evidence.some((e) => e.currency === jcur)) {
      reasons.push(`The evidence is in ${foreign[0].currency} (${foreign[0].text}). Booking it in ${jcur} needs a rate and where the rate came from.`);
    }
  }

  // Do the message and the document agree on the total?
  let conflict = null;
  const msg = evidence.filter((e) => e.where === "message");
  const docTotals = evidence.filter((e) => e.where === "document" && e.isTotal);
  if (msg.length && docTotals.length) {
    const agree = msg.some((m) => docTotals.some((d) => d.cents === m.cents)) || msg.every((m) => evidence.some((d) => d.where === "document" && d.cents === m.cents));
    if (!agree) {
      conflict = { message: msg[0], document: docTotals[0] };
      reasons.push(`The message says ${msg[0].text} and the ${(ev.document.kind || "document").toLowerCase()} says ${docTotals[0].text}. A person should ask which is right.`);
    }
  }

  return { status: reasons.length ? "held" : "ready", reasons, lines, debit, credit, balanced, evidence, conflict };
}

export function summarize(results) {
  const ready = results.filter((r) => r.status === "ready").length;
  return { total: results.length, ready, held: results.length - ready };
}
