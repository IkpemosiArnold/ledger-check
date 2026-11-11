// Six events for a made-up design studio, and the journals an AI suggested
// for them. Written for this demo: the studio, people, shops and amounts are
// not real. Four problems were planted on purpose.
export const events = [
  {
    id: "stationery",
    title: "Printer paper and toner",
    from: "Mei Chan", channel: "WhatsApp", time: "Mon 09:12",
    message: "Picked up printer paper and toner for the studio. Paid HK$612 on the company card.",
    document: {
      name: "receipt-kwun-tong-stationers.pdf", kind: "Receipt",
      text: "Kwun Tong Stationers\nA4 printer paper, 5 reams  HK$215.00\nToner cartridge  HK$397.00\nTotal  HK$612.00\nCard ending 4421, 9 Nov 2026",
    },
    journal: { currency: "HKD", lines: [{ account: "Office supplies", debit: "612.00" }, { account: "Company card", credit: "612.00" }] },
  },
  {
    id: "payout",
    title: "Card payout with fees",
    from: "Card processor", channel: "Email", time: "Mon 11:40",
    message: "Your payout of HK$2,341.00 is on its way to your bank account.",
    document: {
      name: "payout-statement-1109.pdf", kind: "Payout statement",
      text: "Payout statement, 9 Nov 2026\nGross sales  HK$2,400.00\nProcessing fees  HK$59.00\nNet payout  HK$2,341.00",
    },
    journal: { currency: "HKD", lines: [{ account: "Bank", debit: "2,341.00" }, { account: "Processing fees", debit: "59.00" }, { account: "Card sales receivable", credit: "2,400.00" }] },
  },
  {
    id: "customer",
    title: "Customer payment, INV-0042",
    from: "Tom Wu", channel: "WhatsApp", time: "Tue 10:05",
    message: "Bloom Cafe paid invoice INV-0042 today, HK$3,850.",
    document: {
      name: "bank-advice-1110.pdf", kind: "Bank advice",
      text: "Incoming transfer, 10 Nov 2026\nFrom BLOOM CAFE LTD\nReference INV-0042\nAmount  HK$3,580.00",
    },
    journal: { currency: "HKD", lines: [{ account: "Bank", debit: "3,850.00" }, { account: "Accounts receivable", credit: "3,850.00" }] },
  },
  {
    id: "lunch",
    title: "Team lunch",
    from: "Mei Chan", channel: "WhatsApp", time: "Tue 14:22",
    message: "Team lunch with the Bloom Cafe people, on the company card. Receipt attached.",
    document: {
      name: "receipt-harbour-noodle.jpg", kind: "Receipt",
      text: "Harbour Noodle House\n6 lunch sets\nTotal  HK$1,420.00\nCard ending 4421, 10 Nov 2026",
    },
    journal: { currency: "HKD", lines: [{ account: "Meals and entertainment", debit: "1,240.00" }, { account: "Company card", credit: "1,240.00" }] },
  },
  {
    id: "software",
    title: "Design software subscription",
    from: "Design tool billing", channel: "Email", time: "Wed 08:01",
    message: "Thanks for your payment. Your monthly plan is renewed.",
    document: {
      name: "invoice-design-tool.pdf", kind: "Invoice",
      text: "Monthly plan, 1 seat\nAmount paid  US$20.00\nCard ending 4421, 11 Nov 2026",
    },
    journal: { currency: "HKD", lines: [{ account: "Software", debit: "156.00" }, { account: "Company card", credit: "165.00" }] },
  },
  {
    id: "contractor",
    title: "Shelving contractor",
    from: "Tom Wu", channel: "WhatsApp", time: "Wed 17:48",
    message: "Paid the contractor for the shelving. Will send the invoice later.",
    document: null,
    journal: { currency: "HKD", lines: [{ account: "Contractor costs", debit: "5,000.00" }, { account: "Bank", credit: "5,000.00" }] },
  },
];
