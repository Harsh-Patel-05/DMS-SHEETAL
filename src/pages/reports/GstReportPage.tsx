import { ReportShell } from "@/components/shared/ReportShell";
import { DataTable } from "@/components/ui/data-table";
import { useDmsStore } from "@/store/dms-store";
import { roundMoney } from "@/utils/calculations";
import { formatCurrency, formatDate } from "@/utils/format";

type GstRow = {
  id: string;
  date: string;
  doc: string;
  type: "Sale" | "Purchase";
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
};

function isConfirmedDoc(status: string) {
  return status !== "draft" && status !== "cancelled";
}

export default function GstReportPage() {
  const sales = useDmsStore((s) => s.sales);
  const purchases = useDmsStore((s) => s.purchases);

  return (
    <ReportShell
      title="GST Summary"
      description="Taxable value and GST by document"
    >
      {(range) => {
        const saleRows: GstRow[] = sales
          .filter(
            (s) =>
              isConfirmedDoc(s.status) &&
              s.date >= range.from &&
              s.date <= range.to,
          )
          .map((s) => ({
            id: `sale-${s.id}`,
            date: s.date,
            doc: s.invoiceNo,
            type: "Sale" as const,
            taxable: roundMoney(s.subtotal - s.discount),
            cgst: s.cgst,
            sgst: s.sgst,
            igst: s.igst,
            totalTax: roundMoney(s.cgst + s.sgst + s.igst),
          }));

        const purchaseRows: GstRow[] = purchases
          .filter(
            (p) =>
              isConfirmedDoc(p.status) &&
              p.date >= range.from &&
              p.date <= range.to,
          )
          .map((p) => ({
            id: `purchase-${p.id}`,
            date: p.date,
            doc: p.purchaseNo,
            type: "Purchase" as const,
            taxable: roundMoney(p.subtotal - p.discount),
            cgst: p.cgst,
            sgst: p.sgst,
            igst: p.igst,
            totalTax: roundMoney(p.cgst + p.sgst + p.igst),
          }));

        const filtered = [...saleRows, ...purchaseRows].sort((a, b) =>
          b.date.localeCompare(a.date),
        );

        return (
          <DataTable
            data={filtered}
            getRowId={(r) => r.id}
            emptyModule="reports"
            columns={[
              { id: "date", header: "Date", cell: (r) => formatDate(r.date) },
              { id: "doc", header: "Document", accessor: "doc" },
              { id: "type", header: "Type", accessor: "type" },
              {
                id: "taxable",
                header: "Taxable",
                cell: (r) => formatCurrency(r.taxable),
              },
              {
                id: "cgst",
                header: "CGST",
                cell: (r) => formatCurrency(r.cgst),
              },
              {
                id: "sgst",
                header: "SGST",
                cell: (r) => formatCurrency(r.sgst),
              },
              {
                id: "igst",
                header: "IGST",
                cell: (r) => formatCurrency(r.igst),
              },
              {
                id: "totalTax",
                header: "Total tax",
                cell: (r) => formatCurrency(r.totalTax),
              },
            ]}
            emptyTitle="No records in range"
          />
        );
      }}
    </ReportShell>
  );
}
