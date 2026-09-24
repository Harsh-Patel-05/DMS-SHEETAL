import { ReportShell } from "@/components/shared/ReportShell";
import { DataTable } from "@/components/ui/data-table";
import { useDmsStore } from "@/store/dms-store";
import { formatCurrency } from "@/utils/format";

export default function ReceivablesReportPage() {
  const customers = useDmsStore((s) => s.customers);

  return (
    <ReportShell
      title="Outstanding Receivables"
      description="Customers with outstanding balance"
    >
      {() => {
        const filtered = customers.filter((c) => c.currentBalance > 0);
        return (
          <DataTable
            data={filtered}
            getRowId={(r) => r.id}
            emptyModule="reports"
            columns={[
              { id: "name", header: "Customer", accessor: "name" },
              { id: "mobile", header: "Mobile", accessor: "mobile" },
              {
                id: "balance",
                header: "Outstanding",
                cell: (r) => formatCurrency(r.currentBalance),
              },
              {
                id: "creditLimit",
                header: "Credit limit",
                cell: (r) => formatCurrency(r.creditLimit),
              },
            ]}
            emptyTitle="No outstanding receivables"
          />
        );
      }}
    </ReportShell>
  );
}
