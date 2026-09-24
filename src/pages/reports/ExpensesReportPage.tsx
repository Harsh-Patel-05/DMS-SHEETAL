import { ReportShell } from "@/components/shared/ReportShell";
import { DataTable } from "@/components/ui/data-table";
import type { ExpenseCategory, PaymentMethod } from "@/types";
import { useDmsStore } from "@/store/dms-store";
import { formatCurrency, formatDate } from "@/utils/format";

function labelCategory(category: ExpenseCategory) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function labelPaymentMethod(method: PaymentMethod) {
  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ExpensesReportPage() {
  const expenses = useDmsStore((s) => s.expenses);

  return (
    <ReportShell
      title="Expense Report"
      description="Expenses in the selected period"
    >
      {(range) => {
        const filtered = expenses.filter(
          (e) => e.date >= range.from && e.date <= range.to,
        );
        return (
          <DataTable
            data={filtered}
            getRowId={(r) => r.id}
            emptyModule="reports"
            columns={[
              { id: "date", header: "Date", cell: (r) => formatDate(r.date) },
              {
                id: "category",
                header: "Category",
                cell: (r) => labelCategory(r.category),
              },
              {
                id: "description",
                header: "Description",
                accessor: "description",
              },
              {
                id: "amount",
                header: "Amount",
                cell: (r) => formatCurrency(r.amount),
              },
              {
                id: "paymentMethod",
                header: "Payment",
                cell: (r) => labelPaymentMethod(r.paymentMethod),
              },
            ]}
            emptyTitle="No records in range"
          />
        );
      }}
    </ReportShell>
  );
}
