import { addDays, format, parseISO } from "date-fns";
import { ReportShell } from "@/components/shared/ReportShell";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { useDmsStore } from "@/store/dms-store";
import { roundMoney } from "@/utils/calculations";
import { formatCurrency, formatDate } from "@/utils/format";

type DailyRow = {
  id: string;
  date: string;
  sales: number;
  purchases: number;
  paymentsReceived: number;
  expenses: number;
};

function isActiveDoc(status: string) {
  return status !== "draft" && status !== "cancelled";
}

function datesInRange(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = parseISO(from);
  const end = parseISO(to);
  while (cur <= end) {
    out.push(format(cur, "yyyy-MM-dd"));
    cur = addDays(cur, 1);
  }
  return out;
}

export default function DailySummaryReportPage() {
  const sales = useDmsStore((s) => s.sales);
  const purchases = useDmsStore((s) => s.purchases);
  const payments = useDmsStore((s) => s.payments);
  const expenses = useDmsStore((s) => s.expenses);

  return (
    <ReportShell
      title="Daily Summary"
      description="Day-wise totals for the selected period"
    >
      {(range) => {
        const salesMap = new Map<string, number>();
        const purchaseMap = new Map<string, number>();
        const paymentMap = new Map<string, number>();
        const expenseMap = new Map<string, number>();

        for (const s of sales) {
          if (!isActiveDoc(s.status)) continue;
          if (s.date < range.from || s.date > range.to) continue;
          salesMap.set(
            s.date,
            roundMoney((salesMap.get(s.date) ?? 0) + s.grandTotal),
          );
        }
        for (const p of purchases) {
          if (!isActiveDoc(p.status)) continue;
          if (p.date < range.from || p.date > range.to) continue;
          purchaseMap.set(
            p.date,
            roundMoney((purchaseMap.get(p.date) ?? 0) + p.grandTotal),
          );
        }
        for (const p of payments) {
          if (p.type !== "received") continue;
          if (p.date < range.from || p.date > range.to) continue;
          paymentMap.set(
            p.date,
            roundMoney((paymentMap.get(p.date) ?? 0) + p.amount),
          );
        }
        for (const e of expenses) {
          if (e.date < range.from || e.date > range.to) continue;
          expenseMap.set(
            e.date,
            roundMoney((expenseMap.get(e.date) ?? 0) + e.amount),
          );
        }

        const totalSales = roundMoney(
          [...salesMap.values()].reduce((a, b) => a + b, 0),
        );
        const totalPurchases = roundMoney(
          [...purchaseMap.values()].reduce((a, b) => a + b, 0),
        );
        const totalPayments = roundMoney(
          [...paymentMap.values()].reduce((a, b) => a + b, 0),
        );
        const totalExpenses = roundMoney(
          [...expenseMap.values()].reduce((a, b) => a + b, 0),
        );

        const dailyRows: DailyRow[] = datesInRange(range.from, range.to)
          .map((date) => ({
            id: date,
            date,
            sales: salesMap.get(date) ?? 0,
            purchases: purchaseMap.get(date) ?? 0,
            paymentsReceived: paymentMap.get(date) ?? 0,
            expenses: expenseMap.get(date) ?? 0,
          }))
          .filter(
            (row) =>
              row.sales > 0 ||
              row.purchases > 0 ||
              row.paymentsReceived > 0 ||
              row.expenses > 0,
          )
          .reverse();

        return (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total sales"
                value={formatCurrency(totalSales)}
              />
              <StatCard
                label="Total purchases"
                value={formatCurrency(totalPurchases)}
              />
              <StatCard
                label="Payments received"
                value={formatCurrency(totalPayments)}
              />
              <StatCard
                label="Total expenses"
                value={formatCurrency(totalExpenses)}
              />
            </div>
            <DataTable
              data={dailyRows}
              getRowId={(r) => r.id}
              emptyModule="reports"
              columns={[
                { id: "date", header: "Date", cell: (r) => formatDate(r.date) },
                {
                  id: "sales",
                  header: "Sales",
                  cell: (r) => formatCurrency(r.sales),
                },
                {
                  id: "purchases",
                  header: "Purchases",
                  cell: (r) => formatCurrency(r.purchases),
                },
                {
                  id: "payments",
                  header: "Payments received",
                  cell: (r) => formatCurrency(r.paymentsReceived),
                },
                {
                  id: "expenses",
                  header: "Expenses",
                  cell: (r) => formatCurrency(r.expenses),
                },
              ]}
              emptyTitle="No activity in range"
            />
          </div>
        );
      }}
    </ReportShell>
  );
}
