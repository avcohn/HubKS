const fs = require("fs");
const path = require("path");

const BOI_API = "https://boi.org.il/PublicApi/GetExchangeRates";
const UNIT_FACTOR = { JPY: 100 };
const WANTED = new Set([
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "DKK", "NOK", "SEK",
  "CHF", "JOD", "CNY", "HKD", "NZD", "RUB", "SAR", "SGD"
]);

async function main() {
  const response = await fetch(BOI_API);
  if (!response.ok) throw new Error(`Bank of Israel API error: ${response.status}`);

  const json = await response.json();
  const rows = json.exchangeRates || json.ExchangeRates || json.data || json.Data || [];
  const ratesIlsPerUnit = {};

  for (const row of rows) {
    const key = String(row.key || row.Key || row.currency || row.Currency || "").toUpperCase();
    const rawValue = Number(row.currentExchangeRate || row.CurrentExchangeRate || row.rate || row.Rate);
    const factor = UNIT_FACTOR[key] || 1;

    if (WANTED.has(key) && rawValue) {
      ratesIlsPerUnit[key] = rawValue / factor;
    }
  }

  if (!ratesIlsPerUnit.USD) throw new Error("USD rate was not found in Bank of Israel response");

  const output = {
    updatedAt: new Date().toISOString(),
    source: "Bank of Israel API · GitHub Actions daily update",
    usdIlsRate: ratesIlsPerUnit.USD,
    ratesIlsPerUnit
  };

  fs.writeFileSync(
    path.join(process.cwd(), "rates.json"),
    JSON.stringify(output, null, 2),
    "utf8"
  );

  console.log("rates.json updated", output.updatedAt, "USD", output.usdIlsRate);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
