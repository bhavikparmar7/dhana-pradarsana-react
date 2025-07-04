import Layout from "@/components/layout/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BalanceSheetPage() {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Balance Sheet</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>Savings: ₹50,000</li>
                <li>Investments: ₹1,20,000</li>
                <li>Ledgers: ₹20,000</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Liabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>Credit Cards: ₹10,000</li>
                <li>Ledgers: ₹5,000</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
