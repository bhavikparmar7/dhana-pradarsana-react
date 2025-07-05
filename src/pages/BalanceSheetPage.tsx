
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


import React from "react"
import Calendar22 from "@/components/calendar-22"

type AccountWithBalance = {
  accountId: string
  accountName: string
  accountNumber?: string | null
  balanceAmount: number
  productName?: string
}

type BalanceSheetData = {
  assets: {
    savings: AccountWithBalance[];
    investments: AccountWithBalance[];
    ledgers: AccountWithBalance[];
  };
  liabilities: {
    creditCards: AccountWithBalance[];
    ledgers?: AccountWithBalance[];
  };
}

export default function BalanceSheetPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [balanceSheet, setBalanceSheet] = React.useState<BalanceSheetData | null>(null)

  React.useEffect(() => {
    if (!date) return;
    const fetchBalanceSheet = async () => {
      setLoading(true);
      setError(null);
      try {
        const jwt = localStorage.getItem("firebase_jwt");
        if (!jwt) throw new Error("Not authenticated");
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        // Format date as YYYY-MM-DD in local time (IST safe)
        const asOnDate = [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, '0'),
          String(date.getDate()).padStart(2, '0')
        ].join('-');
        const res = await fetch(`${baseUrl}/transactions/balance-sheet?asOnDate=${asOnDate}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setBalanceSheet(data.balanceSheetData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || "Failed to fetch balance sheet");
        } else {
          setError("Failed to fetch balance sheet");
        }
        setBalanceSheet(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBalanceSheet();
  }, [date]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Balance Sheet</h1>
        <div>
          <Calendar22 date={date} onDateChange={setDate} />
        </div>
      </div>

      {loading && <div className="text-muted-foreground">Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {balanceSheet && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-center items-center text-xl font-bold">Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="font-semibold mb-1">Savings</div>
                  <ul className="space-y-1 text-muted-foreground">
                    {balanceSheet.assets.savings.length === 0 && <li className="italic">None</li>}
                    {balanceSheet.assets.savings.map(acc => (
                      <li key={acc.accountId} className="flex justify-between">
                        <span>{acc.accountName}</span>
                        <span>₹ {acc.balanceAmount.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold mb-1">Investments</div>
                  <ul className="space-y-1 text-muted-foreground">
                    {balanceSheet.assets.investments.length === 0 && <li className="italic">None</li>}
                    {balanceSheet.assets.investments.map(acc => (
                      <li key={acc.accountId} className="flex justify-between">
                        <span>{acc.accountName}</span>
                        <span>₹ {acc.balanceAmount.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold mb-1">Ledgers</div>
                  <ul className="space-y-1 text-muted-foreground">
                    {balanceSheet.assets.ledgers.length === 0 && <li className="italic">None</li>}
                    {balanceSheet.assets.ledgers.map(acc => (
                      <li key={acc.accountId} className="flex justify-between">
                        <span>{acc.accountName}</span>
                        <span>₹ {acc.balanceAmount.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-center items-center text-xl font-bold">Liabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="font-semibold mb-1">Credit Cards</div>
                  <ul className="space-y-1 text-muted-foreground">
                    {balanceSheet.liabilities.creditCards.length === 0 && <li className="italic">None</li>}
                    {balanceSheet.liabilities.creditCards.map(acc => (
                      <li key={acc.accountId} className="flex justify-between">
                        <span>{acc.accountName}</span>
                        <span>₹ {acc.balanceAmount.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {Array.isArray(balanceSheet.liabilities.ledgers) && (
                  <div>
                    <div className="font-semibold mb-1">Ledgers</div>
                    <ul className="space-y-1 text-muted-foreground">
                      {balanceSheet.liabilities.ledgers.length === 0 && <li className="italic">None</li>}
                      {balanceSheet.liabilities.ledgers.map(acc => (
                        <li key={acc.accountId} className="flex justify-between">
                          <span>{acc.accountName}</span>
                          <span>₹ {acc.balanceAmount.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
