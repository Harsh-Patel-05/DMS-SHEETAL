import { StatusBadge } from "@/components/shared/StatusBadge";
import { ReportShell } from "@/components/shared/ReportShell";
import { DataTable } from "@/components/ui/data-table";
import { useDmsStore } from "@/store/dms-store";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

export default function SalesReturnsReportPage() {
  const salesReturns = useDmsStore((s) => s.salesReturns);

  return (
    <ReportShell
      title="Sales Returns"
      description="Sales returns in the selected period"
    >
      {(range) => {
        const filtered = salesReturns.filter(
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
              { id: "invoice", header: "Invoice", accessor: "invoiceNo" },
              { id: "customer", header: "Customer", accessor: "customerName" },
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
