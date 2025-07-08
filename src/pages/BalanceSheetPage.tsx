

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Minus, Equal } from "lucide-react"


import React from "react"
import { toast } from "sonner"
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
  assetsWorth: number;
  liabilities: {
    creditCards: AccountWithBalance[];
    ledgers?: AccountWithBalance[];
  };
  liabilitiesWorth: number;
}

export default function BalanceSheetPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [balanceSheet, setBalanceSheet] = React.useState<BalanceSheetData | null>(null)
  const [netWorth, setNetWorth] = React.useState<number | null>(null)

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
        const { fetchWithAuth } = await import("@/lib/fetchWithAuth");
        const res = await fetchWithAuth(`${baseUrl}/transactions/balance-sheet?asOnDate=${asOnDate}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setBalanceSheet(data.balanceSheetData);
        if (typeof data.netWorth === 'number') {
          setNetWorth(data.netWorth);
        } else {
          setNetWorth(null);
        }
      } catch (err) {
        let message = "Failed to fetch balance sheet";
        if (err instanceof Error) {
          message = err.message || message;
        }
        toast.error(message);
        setBalanceSheet(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBalanceSheet();
  }, [date]);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold">Balance Sheet</h1>
          <div>
            <Calendar22 date={date} onDateChange={setDate} />
          </div>
        </div>

        {loading && <div className="text-muted-foreground">Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}

        {balanceSheet && (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex flex-col md:flex-row md:gap-2 gap-1 w-full items-center">
                <div className="flex-1 flex flex-col items-center justify-center bg-green-100 rounded-lg p-4">
                  <div className="text-xs text-green-500 font-medium">Assets Worth</div>
                  <div className="text-xl font-bold font-mono text-green-500">₹ {balanceSheet.assetsWorth?.toLocaleString('en-IN') ?? '-'}</div>
                </div>
                <div className="hidden md:flex items-center justify-center mx-1">
                  <Minus className="w-6 h-6 text-muted-foreground" aria-label="minus" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center bg-red-100 rounded-lg p-4">
                  <div className="text-xs text-red-500 font-medium">Liabilities Worth</div>
                  <div className="text-xl font-bold font-mono text-red-500">₹ {balanceSheet.liabilitiesWorth?.toLocaleString('en-IN') ?? '-'}</div>
                </div>
                <div className="hidden md:flex items-center justify-center mx-1">
                  <Equal className="w-6 h-6 text-muted-foreground" aria-label="equals" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center bg-blue-100 rounded-lg p-4">
                  <div className="text-xs text-blue-500 font-medium">Net Worth</div>
                  <div className="text-xl font-bold font-mono text-blue-500">₹ {netWorth?.toLocaleString('en-IN') ?? '-'}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assets Card */}
              <Card className="shadow-lg border-2 border-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-center items-center text-base font-bold text-gray-600 dark:text-gray-300 tracking-wide font-sans">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                    Assets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="font-semibold font-sans text-gray-600 mb-1">Savings</div>
                      <ul className="space-y-1">
                        {balanceSheet.assets.savings.length === 0 && <li className="flex justify-between items-center rounded px-2 py-1 hover:bg-gray-100 transition">-</li>}
                        {balanceSheet.assets.savings.map(acc => (
                          <li key={acc.accountId} className="flex justify-between items-center rounded px-2 py-1 hover:bg-green-100 transition">
                            <span className="font-mono" title={acc.accountName}>
                              {acc.accountName}
                              {acc.productName ? ` (${acc.productName})` : ''}
                            </span>
                            <span className="font-mono">₹ {acc.balanceAmount.toLocaleString('en-IN')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold font-sans text-gray-600 mb-1">Investments</div>
                      <ul className="space-y-1">
                        {balanceSheet.assets.investments.length === 0 && <li className="flex justify-between items-center rounded px-2 py-1 hover:bg-gray-100 transition">-</li>}
                        {balanceSheet.assets.investments.map(acc => (
                          <li key={acc.accountId} className="flex justify-between items-center rounded px-2 py-1 hover:bg-green-100 transition">
                            <span className="font-mono" title={acc.accountName}>
                              {acc.accountName}
                              {acc.productName ? ` (${acc.productName})` : ''}
                            </span>
                            <span className="font-mono">₹ {acc.balanceAmount.toLocaleString('en-IN')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold font-sans text-gray-600 mb-1">Ledgers</div>
                      <ul className="space-y-1">
                        {balanceSheet.assets.ledgers.length === 0 && <li className="flex justify-between items-center rounded px-2 py-1 hover:bg-gray-100 transition">-</li>}
                        {balanceSheet.assets.ledgers.map(acc => (
                          <li key={acc.accountId} className="flex justify-between items-center rounded px-2 py-1 hover:bg-green-100 transition">
                            <span className="font-mono" title={acc.accountName}>
                              {acc.accountName}
                              {acc.productName ? ` (${acc.productName})` : ''}
                            </span>
                            <span className="font-mono">₹ {acc.balanceAmount.toLocaleString('en-IN')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liabilities Card */}
              <Card className="shadow-lg border-2 border-red-100">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-center items-center text-base font-bold text-gray-600 dark:text-gray-300 tracking-wide font-sans">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-2"></span>
                    Liabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="font-semibold font-sans text-gray-600 mb-1">Credit Cards</div>
                      <ul className="space-y-1">
                        {balanceSheet.liabilities.creditCards.length === 0 && <li className="flex justify-between items-center rounded px-2 py-1 hover:bg-gray-100 transition">-</li>}
                        {balanceSheet.liabilities.creditCards.map(acc => (
                          <li key={acc.accountId} className="flex justify-between items-center rounded px-2 py-1 hover:bg-red-100 transition">
                            <span className="font-mono" title={acc.accountName}>
                              {acc.accountName}
                              {acc.productName ? ` (${acc.productName})` : ''}
                            </span>
                            <span className="font-mono">₹ {acc.balanceAmount.toLocaleString('en-IN')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {Array.isArray(balanceSheet.liabilities.ledgers) && (
                      <div>
                        <div className="font-semibold font-sans text-gray-600 mb-1">Ledgers</div>
                        <ul className="space-y-1">
                          {balanceSheet.liabilities.ledgers.length === 0 && <li className="flex justify-between items-center rounded px-2 py-1 hover:bg-gray-100 transition">-</li>}
                          {balanceSheet.liabilities.ledgers.map(acc => (
                            <li key={acc.accountId} className="flex justify-between items-center rounded px-2 py-1 hover:bg-red-100 transition">
                            <span className="font-mono" title={acc.accountName}>
                              {acc.accountName}
                              {acc.productName ? ` (${acc.productName})` : ''}
                            </span>
                              <span className="font-mono">₹ {acc.balanceAmount.toLocaleString('en-IN')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
