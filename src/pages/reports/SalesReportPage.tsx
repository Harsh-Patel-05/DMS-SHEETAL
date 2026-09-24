import { StatusBadge } from "@/components/shared/StatusBadge";
import { ReportShell } from "@/components/shared/ReportShell";
import { DataTable } from "@/components/ui/data-table";
import { useDmsStore } from "@/store/dms-store";
import { formatCurrency, formatDate } from "@/utils/format";

export default function SalesReportPage() {
  const rows = useDmsStore((s) => s.sales);

  return (
    <ReportShell
      title="Sales Report"
      description="Sales in the selected period"
    >
      {(range) => {
        const filtered = rows.filter(
          (r) =>
            r.status !== "draft" &&
            r.status !== "cancelled" &&
            r.date >= range.from &&
            r.date <= range.to,
        );
        return (
          <DataTable
            data={filtered}
            getRowId={(r) => r.id}
            emptyModule="reports"
            columns={[
              { id: "no", header: "Invoice", accessor: "invoiceNo" },
              { id: "date", header: "Date", cell: (r) => formatDate(r.date) },
              { id: "party", header: "Customer", accessor: "customerName" },
              {
                id: "total",
                header: "Total",
                cell: (r) => formatCurrency(r.grandTotal),
              },
              {
                id: "paid",
                header: "Paid",
                cell: (r) => formatCurrency(r.paid),
              },
              {
                id: "due",
                header: "Due",
                cell: (r) => formatCurrency(r.due),
              },
              {
                id: "status",
                header: "Status",
                cell: (r) => <StatusBadge kind="doc" status={r.status} />,
              },
            ]}
            emptyTitle="No records in range"
          />
        );
      }}
    </ReportShell>
  );
}
