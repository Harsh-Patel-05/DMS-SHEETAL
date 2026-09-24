import { ReportShell } from "@/components/shared/ReportShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { useDmsStore } from "@/store/dms-store";
import { calculateProfit, roundMoney } from "@/utils/calculations";
import { formatCurrency } from "@/utils/format";

export default function ProfitLossReportPage() {
  const sales = useDmsStore((s) => s.sales);
  const purchases = useDmsStore((s) => s.purchases);
  const expenses = useDmsStore((s) => s.expenses);
  const products = useDmsStore((s) => s.products);
  const salesReturns = useDmsStore((s) => s.salesReturns);
  const purchaseReturns = useDmsStore((s) => s.purchaseReturns);

  return (
    <ReportShell
      title="Profit Report"
      description="Revenue, cost of goods, expenses and net profit"
    >
      {(range) => {
        const salesInRange = sales.filter(
          (s) =>
            s.status !== "draft" &&
            s.status !== "cancelled" &&
            s.date >= range.from &&
            s.date <= range.to,
        );
        const purchasesInRange = purchases.filter(
          (p) =>
            p.status !== "draft" &&
            p.status !== "cancelled" &&
            p.date >= range.from &&
            p.date <= range.to,
        );
        const expensesInRange = expenses.filter(
          (e) => e.date >= range.from && e.date <= range.to,
        );
        const salesReturnAmt = roundMoney(
          salesReturns
            .filter((r) => r.date >= range.from && r.date <= range.to)
            .reduce((sum, r) => sum + r.amount, 0),
        );
        const purchaseReturnAmt = roundMoney(
          purchaseReturns
            .filter((r) => r.date >= range.from && r.date <= range.to)
            .reduce((sum, r) => sum + r.amount, 0),
        );

        const revenue = roundMoney(
          salesInRange.reduce((sum, s) => sum + s.grandTotal, 0) -
            salesReturnAmt,
        );
        const discount = roundMoney(
          salesInRange.reduce((sum, s) => sum + s.discount, 0),
        );
        const gstCollected = roundMoney(
          salesInRange.reduce((sum, s) => sum + s.cgst + s.sgst + s.igst, 0),
        );
        const gstPaid = roundMoney(
          purchasesInRange.reduce(
            (sum, p) => sum + p.cgst + p.sgst + p.igst,
            0,
          ),
        );

        const cogs = roundMoney(
          salesInRange.reduce((sum, sale) => {
            const lineCogs = sale.items.reduce((lineSum, item) => {
              const product = products.find((p) => p.id === item.productId);
              const unitCost = product?.purchasePrice ?? item.rate * 0.7;
              return lineSum + unitCost * item.quantity;
            }, 0);
            return sum + lineCogs;
          }, 0) -
            purchaseReturnAmt * 0.85,
        );

        const expenseTotal = roundMoney(
          expensesInRange.reduce((sum, e) => sum + e.amount, 0),
        );
        const { grossProfit, netProfit, margin } = calculateProfit(
          revenue,
          cogs,
          expenseTotal,
        );

        return (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Sales revenue" value={formatCurrency(revenue)} />
              <StatCard label="COGS" value={formatCurrency(cogs)} />
              <StatCard
                label="Gross profit"
                value={formatCurrency(grossProfit)}
              />
              <StatCard
                label="Net profit"
                value={formatCurrency(netProfit)}
                trend={{ value: `Margin ${margin}%`, positive: netProfit >= 0 }}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row
                    label="Gross sales"
                    value={formatCurrency(revenue + salesReturnAmt)}
                  />
                  <Row
                    label="Sales returns"
                    value={`− ${formatCurrency(salesReturnAmt)}`}
                  />
                  <Row
                    label="Net revenue"
                    value={formatCurrency(revenue)}
                    bold
                  />
                  <Row
                    label="Total discount given"
                    value={formatCurrency(discount)}
                  />
                  <Row
                    label="GST collected"
                    value={formatCurrency(gstCollected)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cost & expenses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row
                    label="Cost of goods sold"
                    value={formatCurrency(cogs)}
                  />
                  <Row
                    label="Purchase returns (credit)"
                    value={formatCurrency(purchaseReturnAmt)}
                  />
                  <Row
                    label="GST paid on purchases"
                    value={formatCurrency(gstPaid)}
                  />
                  <Row
                    label="Operating expenses"
                    value={formatCurrency(expenseTotal)}
                  />
                  <Row
                    label="Gross profit"
                    value={formatCurrency(grossProfit)}
                    bold
                  />
                  <Row
                    label="Net profit"
                    value={formatCurrency(netProfit)}
                    bold
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }}
    </ReportShell>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between border-b border-border py-2 last:border-0 ${bold ? "font-semibold" : ""}`}
    >
      <span className="text-ink-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
