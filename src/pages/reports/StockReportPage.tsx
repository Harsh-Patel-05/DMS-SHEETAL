import { ReportShell } from "@/components/shared/ReportShell";
import { DataTable } from "@/components/ui/data-table";
import { useDmsStore } from "@/store/dms-store";
import { roundMoney } from "@/utils/calculations";
import { formatCurrency, formatNumber } from "@/utils/format";

export default function StockReportPage() {
  const products = useDmsStore((s) => s.products);

  return (
    <ReportShell
      title="Stock Report"
      description="Current stock levels and value"
    >
      {() => (
        <DataTable
          data={products}
          getRowId={(r) => r.id}
          emptyModule="reports"
          columns={[
            { id: "sku", header: "SKU", accessor: "sku" },
            { id: "name", header: "Product", accessor: "name" },
            {
              id: "currentStock",
              header: "Qty",
              cell: (r) => formatNumber(r.currentStock),
            },
            {
              id: "minimumStock",
              header: "Min stock",
              cell: (r) => formatNumber(r.minimumStock),
            },
            {
              id: "purchasePrice",
              header: "Cost",
              cell: (r) => formatCurrency(r.purchasePrice),
            },
            {
              id: "value",
              header: "Stock value",
              cell: (r) =>
                formatCurrency(roundMoney(r.currentStock * r.purchasePrice)),
            },
          ]}
          emptyTitle="No products"
        />
      )}
    </ReportShell>
  );
}
