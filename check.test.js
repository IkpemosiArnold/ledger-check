import { test } from "node:test";
import assert from "node:assert/strict";
import { checkEvent, amountsIn, summarize } from "./check.js";
import { events } from "./samples.js";

const res = Object.fromEntries(events.map((e) => [e.id, checkEvent(e)]));

test("the sample: two ready for review, four held back", () => {
  assert.deepEqual(events.map((e) => res[e.id].status), ["ready", "ready", "held", "held", "held", "held"]);
  assert.deepEqual(summarize(Object.values(res)), { total: 6, ready: 2, held: 4 });
});

test("every amount on a ready journal is traced to the message or the document", () => {
  for (const id of ["stationery", "payout"]) {
    for (const l of res[id].lines) assert.ok(l.traced, `${id} ${l.account}`);
  }
  const fees = res.payout.lines.find((l) => l.account === "Processing fees");
  assert.equal(fees.traced.where, "document");
  assert.equal(fees.traced.line, "Processing fees  HK$59.00");
});

test("message and document disagree: held, with both amounts named", () => {
  assert.ok(res.customer.conflict);
  assert.match(res.customer.reasons.join(" "), /HK\$3,850 .* HK\$3,580\.00/);
});

test("an amount on neither the message nor the receipt is held, with the receipt total as a hint", () => {
  assert.match(res.lunch.reasons[0], /1,240\.00 is not in the message or the document\. The receipt total is HK\$1,420\.00/);
});

test("an unbalanced journal in the wrong currency is held for both reasons", () => {
  const r = res.software.reasons.join(" ");
  assert.match(r, /Debits 156\.00 and credits 165\.00 do not balance\. Off by 9\.00/);
  assert.match(r, /evidence is in USD \(US\$20\.00\)/);
});

test("no amount anywhere: nothing to book from yet", () => {
  assert.match(res.contractor.reasons.join(" "), /No amount in the message, and no document attached\. 5,000\.00 has nothing behind it yet/);
});

test("amounts are read with their currency", () => {
  const a = amountsIn("Paid HK$2,341.00 and USD 20 and 15.50 HKD", "message");
  assert.deepEqual(a.map((x) => [x.cents, x.currency]), [[234100, "HKD"], [2000, "USD"], [1550, "HKD"]]);
});

test("a journal with no lines is held", () => {
  assert.equal(checkEvent({ message: "HK$10", journal: { currency: "HKD", lines: [] } }).status, "held");
});
