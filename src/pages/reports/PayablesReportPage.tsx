import { ReportShell } from "@/components/shared/ReportShell";
import { DataTable } from "@/components/ui/data-table";
import { useDmsStore } from "@/store/dms-store";
import { formatCurrency } from "@/utils/format";

export default function PayablesReportPage() {
  const suppliers = useDmsStore((s) => s.suppliers);

  return (
    <ReportShell
      title="Outstanding Payables"
      description="Suppliers with outstanding balance"
    >
      {() => {
        const filtered = suppliers.filter((s) => s.currentBalance > 0);
        return (
          <DataTable
            data={filtered}
            getRowId={(r) => r.id}
            emptyModule="reports"
            columns={[
              { id: "name", header: "Supplier", accessor: "name" },
              { id: "mobile", header: "Mobile", accessor: "mobile" },
              {
                id: "balance",
                header: "Outstanding",
                cell: (r) => formatCurrency(r.currentBalance),
              },
            ]}
            emptyTitle="No outstanding payables"
          />
        );
      }}
    </ReportShell>
  );
}
