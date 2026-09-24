import { ReportShell } from "@/components/shared/ReportShell";
import { DataTable } from "@/components/ui/data-table";
import type { PaymentMethod, PaymentType } from "@/types";
import { useDmsStore } from "@/store/dms-store";
import { formatCurrency, formatDate } from "@/utils/format";

function labelPaymentType(type: PaymentType) {
  return type === "received" ? "Received" : "Paid";
}

function labelPaymentMethod(method: PaymentMethod) {
  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PaymentsReportPage() {
  const payments = useDmsStore((s) => s.payments);

  return (
    <ReportShell
      title="Payment Report"
      description="Payments in the selected period"
    >
      {(range) => {
        const filtered = payments.filter(
          (p) => p.date >= range.from && p.date <= range.to,
        );
        return (
          <DataTable
            data={filtered}
            getRowId={(r) => r.id}
            emptyModule="reports"
            columns={[
              { id: "no", header: "Payment #", accessor: "paymentNo" },
              { id: "date", header: "Date", cell: (r) => formatDate(r.date) },
              {
                id: "type",
                header: "Type",
                cell: (r) => labelPaymentType(r.type),
              },
              { id: "party", header: "Party", accessor: "partyName" },
              {
                id: "method",
                header: "Method",
                cell: (r) => labelPaymentMethod(r.method),
              },
              {
                id: "amount",
                header: "Amount",
                cell: (r) => formatCurrency(r.amount),
              },
            ]}
            emptyTitle="No records in range"
          />
        );
      }}
    </ReportShell>
  );
}
