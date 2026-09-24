import { StatusBadge } from "@/components/shared/StatusBadge";
import { ReportShell } from "@/components/shared/ReportShell";
import { DataTable } from "@/components/ui/data-table";
import { useDmsStore } from "@/store/dms-store";
import { formatCurrency, formatDate } from "@/utils/format";

export default function PurchasesReportPage() {
  const rows = useDmsStore((s) => s.purchases);

  return (
    <ReportShell
      title="Purchase Report"
      description="Purchases in the selected period"
    >
      {(range) => {
        const filtered = rows.filter(
          (r) => r.date >= range.from && r.date <= range.to,
        );
        return (
          <DataTable
            data={filtered}
            getRowId={(r) => r.id}
            emptyModule="reports"
            columns={[
              { id: "no", header: "Purchase #", accessor: "purchaseNo" },
              { id: "date", header: "Date", cell: (r) => formatDate(r.date) },
              { id: "supplier", header: "Supplier", accessor: "supplierName" },
              {
                id: "total",
                header: "Total",
                cell: (r) => formatCurrency(r.grandTotal),
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
