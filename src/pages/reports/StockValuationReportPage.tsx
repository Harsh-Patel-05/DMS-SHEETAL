import { ReportShell } from "@/components/shared/ReportShell";
import { DataTable } from "@/components/ui/data-table";
import { useDmsStore } from "@/store/dms-store";
import { roundMoney } from "@/utils/calculations";
import { formatCurrency, formatNumber } from "@/utils/format";

export default function StockValuationReportPage() {
  const products = useDmsStore((s) => s.products);

  return (
    <ReportShell
      title="Stock Valuation"
      description="Inventory valued at purchase cost"
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
              id: "qty",
              header: "Qty",
              cell: (r) => formatNumber(r.currentStock),
            },
            {
              id: "purchasePrice",
              header: "Purchase price",
              cell: (r) => formatCurrency(r.purchasePrice),
            },
            {
              id: "sellingPrice",
              header: "Selling price",
              cell: (r) => formatCurrency(r.sellingPrice),
            },
            {
              id: "value",
              header: "Value",
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
