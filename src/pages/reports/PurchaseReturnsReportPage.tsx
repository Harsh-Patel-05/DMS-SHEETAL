import { StatusBadge } from "@/components/shared/StatusBadge";
import { ReportShell } from "@/components/shared/ReportShell";
import { DataTable } from "@/components/ui/data-table";
import { useDmsStore } from "@/store/dms-store";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

export default function PurchaseReturnsReportPage() {
  const purchaseReturns = useDmsStore((s) => s.purchaseReturns);

  return (
    <ReportShell
      title="Purchase Returns"
      description="Purchase returns in the selected period"
    >
      {(range) => {
        const filtered = purchaseReturns.filter(
          (r) => r.date >= range.from && r.date <= range.to,
        );
        return (
          <DataTable
            data={filtered}
            getRowId={(r) => r.id}
            emptyModule="reports"
            columns={[
              { id: "no", header: "Return #", accessor: "returnNo" },
              { id: "date", header: "Date", cell: (r) => formatDate(r.date) },
              { id: "purchase", header: "Purchase", accessor: "purchaseNo" },
              { id: "supplier", header: "Supplier", accessor: "supplierName" },
              { id: "product", header: "Product", accessor: "productName" },
              {
                id: "qty",
                header: "Qty",
                cell: (r) => formatNumber(r.returnQuantity),
              },
              {
                id: "amount",
                header: "Amount",
                cell: (r) => formatCurrency(r.amount),
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
