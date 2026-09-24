import { ReportShell } from "@/components/shared/ReportShell";
import { DataTable } from "@/components/ui/data-table";
import { useDmsStore } from "@/store/dms-store";
import { formatCurrency, formatDate } from "@/utils/format";

export default function CustomerLedgerReportPage() {
  const ledger = useDmsStore((s) => s.ledger);

  return (
    <ReportShell
      title="Customer Ledger"
      description="Customer ledger for the selected period"
    >
      {(range) => {
        const filtered = ledger.filter(
          (e) =>
            e.partyType === "customer" &&
            e.date >= range.from &&
            e.date <= range.to,
        );
        return (
          <DataTable
            data={filtered}
            getRowId={(r) => r.id}
            emptyModule="reports"
            columns={[
              { id: "date", header: "Date", cell: (r) => formatDate(r.date) },
              { id: "party", header: "Party", accessor: "partyName" },
              { id: "ref", header: "Reference", accessor: "reference" },
              { id: "desc", header: "Description", accessor: "description" },
              {
                id: "debit",
                header: "Debit",
                cell: (r) => (r.debit ? formatCurrency(r.debit) : "—"),
              },
              {
                id: "credit",
                header: "Credit",
                cell: (r) => (r.credit ? formatCurrency(r.credit) : "—"),
              },
              {
                id: "balance",
                header: "Balance",
                cell: (r) => formatCurrency(r.balance),
              },
            ]}
            emptyTitle="No records in range"
          />
        );
      }}
    </ReportShell>
  );
}
