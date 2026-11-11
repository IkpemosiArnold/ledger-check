# Ledger Check

A chat message and a receipt come in. An AI suggests a journal entry. Before a person reviews it, plain code checks it, and holds it back with a reason when something does not add up.

The sample is six messages from a made-up design studio in Hong Kong, with the journals an AI might suggest. Two are ready for review. Four are held back on purpose.

## The checks

A suggested journal is ready for review only when all of these hold:

1. **It balances.** Debits equal credits, to the cent.
2. **Every amount is in the evidence.** Each debit and credit appears in the message or the attached document, in the journal's currency. The page underlines where.
3. **The message and the document agree.** If the message says one total and the receipt or bank advice says another, a person should ask which is right.
4. **There is evidence at all.** No amount in the message and no document means nothing to book from yet.

The four held back in the sample:

- A customer payment where the message says HK$3,850 and the bank advice says HK$3,580.00.
- A team lunch booked at 1,240.00 when the receipt total is HK$1,420.00.
- A software invoice paid in US$20.00, booked in HKD at 156.00 against 165.00, so it neither balances nor has a rate behind it.
- A contractor payment booked at 5,000.00 from a message with no amount and no invoice.

Edit the JSON at the bottom of the page to try your own, or press "Fix the lunch for me" and watch it pass.

## Where a model would go

The model reads the chat and the receipt and suggests the accounts. This check sits between that suggestion and the "For review" queue, so a person only sees entries whose numbers already trace back to the evidence. It does not judge whether the account is the right one; the reviewer still does that.

## Run the tests

```
node --test
```

Needs Node 20 or later. No dependencies.

## Open the page locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. The page makes no network calls beyond its own files.

## Limits

- Amounts are matched exactly, so a journal that splits one receipt line into two is held back. A real version would allow sums of evidence amounts and show the arithmetic.
- It reads text. Photos of receipts would need OCR first, and OCR output would need its own check.
- Currency comes from symbols and codes in the text (HK$, HKD, US$, USD). A bare "$" takes the document's currency, or none.
- It checks amounts, balance and agreement, not dates, tax or which account is right.

## Design

It follows the shared direction for these demos: rows split by hairlines instead of cards, one result as the largest thing on the page, and an underline that draws under the amounts a journal line uses.

The look borrows from bookkeeping tools: Manrope for the headline and the result, Inter for the tool's words, Newsreader for text quoted from a receipt or bank advice, a blue accent (#2447ed), navy ink (#111a29) and slate greys (#566175). The detail view has the shape of the work itself: a chat message with its document attached, then a journal of account, debit and credit.

Fonts: Manrope, Inter and Newsreader (SIL Open Font License), latin subsets in `fonts/`, served from this folder.

## Provenance

Built on 11 Nov 2026 with AI coding agents, directed by Arnold Ikpemosi Adeyemi. Made-up data, not accounting advice.

## Licence

MIT. See `LICENSE`.
