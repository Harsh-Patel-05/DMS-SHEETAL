import { useMemo, useState } from "react";
import {
  BookmarkPlus,
  Download,
  Filter,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import type {
  ReportDefinition,
  ReportTypeId,
  SavedReport,
} from "@/types/report-builder";
import {
  REPORT_TYPE_OPTIONS,
  columnsForReportType,
  createDefaultDefinition,
  emptyFilter,
  filterFieldsForType,
  groupByOptionsForType,
} from "@/config/report-builder";
import {
  DatePresetToggle,
  type DatePresetOrCustom,
} from "@/components/shared/DatePresetToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useDmsStore } from "@/store/dms-store";
import { usePrefsStore } from "@/store/prefs-store";
import { useSavedReportsStore } from "@/store/saved-reports-store";
import { cn } from "@/utils/cn";
import { type DatePreset, rangeForPreset } from "@/utils/date-range";
import { downloadCsv } from "@/utils/bulk-export";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";
import { runReport } from "@/utils/report-builder-engine";

function formatCell(
  value: string | number | null | undefined,
  valueType: string,
) {
  if (value === null || value === undefined || value === "") return "—";
  if (valueType === "currency") return formatCurrency(Number(value) || 0);
  if (valueType === "number") return formatNumber(Number(value) || 0);
  if (valueType === "date") return formatDate(String(value));
  return String(value);
}

export default function ReportBuilderPage() {
  const sales = useDmsStore((s) => s.sales);
  const purchases = useDmsStore((s) => s.purchases);
  const payments = useDmsStore((s) => s.payments);
  const products = useDmsStore((s) => s.products);
  const expenses = useDmsStore((s) => s.expenses);
  const distributors = useDmsStore((s) => s.distributors);
  const categories = useDmsStore((s) => s.categories);
  const brands = useDmsStore((s) => s.brands);
  const settings = useDmsStore((s) => s.settings);
  const defaultDatePreset = usePrefsStore((s) => s.defaultDatePreset);

  const listAll = useSavedReportsStore((s) => s.listAll);
  const saveReport = useSavedReportsStore((s) => s.saveReport);
  const updateReport = useSavedReportsStore((s) => s.updateReport);
  const deleteReport = useSavedReportsStore((s) => s.deleteReport);
  const { toast } = useToast();

  const [definition, setDefinition] = useState<ReportDefinition>(() =>
    createDefaultDefinition("sales", defaultDatePreset),
  );
  const [activeSavedId, setActiveSavedId] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  const savedReports = useMemo(() => listAll(), [listAll]);

  const availableColumns = useMemo(
    () => columnsForReportType(definition.reportType),
    [definition.reportType],
  );
  const groupOptions = useMemo(
    () => groupByOptionsForType(definition.reportType),
    [definition.reportType],
  );
  const filterFields = useMemo(
    () => filterFieldsForType(definition.reportType),
    [definition.reportType],
  );

  const result = useMemo(
    () =>
      runReport(definition, {
        sales,
        purchases,
        payments,
        products,
        expenses,
        distributors,
        categories,
        brands,
      }),
    [
      definition,
      sales,
      purchases,
      payments,
      products,
      expenses,
      distributors,
      categories,
      brands,
    ],
  );

  const patch = (partial: Partial<ReportDefinition>) => {
    setDefinition((prev) => ({ ...prev, ...partial }));
    setActiveSavedId("");
  };

  const changeReportType = (type: ReportTypeId) => {
    const next = createDefaultDefinition(
      type,
      definition.datePreset === "custom" ? "this_month" : definition.datePreset,
    );
    if (definition.datePreset === "custom") {
      next.datePreset = "custom";
      next.dateFrom = definition.dateFrom;
      next.dateTo = definition.dateTo;
    }
    setDefinition(next);
    setActiveSavedId("");
  };

  const changePreset = (preset: DatePresetOrCustom) => {
    if (preset === "custom") {
      patch({ datePreset: "custom" });
      return;
    }
    const range = rangeForPreset(preset);
    patch({ datePreset: preset, dateFrom: range.from, dateTo: range.to });
  };

  const toggleColumn = (columnId: string, checked: boolean) => {
    setDefinition((prev) => {
      const columns = checked
        ? prev.columns.includes(columnId)
          ? prev.columns
          : [...prev.columns, columnId]
        : prev.columns.filter((id) => id !== columnId);
      return {
        ...prev,
        columns: columns.length
          ? columns
          : [availableColumns[0]?.id ?? columnId],
      };
    });
    setActiveSavedId("");
  };

  const loadSaved = (report: SavedReport) => {
    const { id: _id, name: _name, updatedAt: _u, ...def } = report;
    setDefinition({
      ...def,
      columns: [...def.columns],
      filters: def.filters.map((f) => ({ ...f })),
    });
    setActiveSavedId(report.id);
  };

  const handleSave = () => {
    if (activeSavedId && !activeSavedId.startsWith("preset_")) {
      updateReport(activeSavedId, definition, saveName || undefined);
      toast({ title: "Report updated", variant: "success" });
    } else {
      if (!saveName.trim()) return;
      const saved = saveReport(saveName, definition);
      setActiveSavedId(saved.id);
      toast({ title: "Report saved", variant: "success" });
    }
    setSaveOpen(false);
    setSaveName("");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = result.columns.map((c) => c.label);
    const rows = result.rows.map((row) =>
      result.columns.map((col) => {
        const v = row[col.id];
        if (col.valueType === "currency" || col.valueType === "number")
          return String(v ?? 0);
        return String(v ?? "");
      }),
    );
    downloadCsv(
      `report-${definition.reportType}-${definition.dateFrom}-${definition.dateTo}.csv`,
      headers,
      rows,
    );
    setExportOpen(false);
    toast({ title: "CSV exported", variant: "success" });
  };

  const typeLabel =
    REPORT_TYPE_OPTIONS.find((t) => t.id === definition.reportType)?.label ??
    "Report";

  return (
    <div className="print:bg-white">
      <PageHeader
        title="Report builder"
        description="Choose type, range, columns, filters, grouping, and sorting — then preview"
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const current = savedReports.find(
                  (r) => r.id === activeSavedId,
                );
                setSaveName(
                  current && !current.id.startsWith("preset_")
                    ? current.name
                    : "",
                );
                setSaveOpen(true);
              }}
            >
              <BookmarkPlus className="h-4 w-4" />
              Save report
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setExportOpen(true)}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,22rem)_1fr] print:block">
        <div className="space-y-3 print:hidden">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Report setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FormField label="Saved reports">
                <Select
                  value={activeSavedId}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) {
                      setActiveSavedId("");
                      return;
                    }
                    const match = savedReports.find((r) => r.id === id);
                    if (match) loadSaved(match);
                  }}
                >
                  <option value="">Custom / unsaved…</option>
                  {savedReports.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id.startsWith("preset_")
                        ? `${r.name} (example)`
                        : r.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              {activeSavedId && !activeSavedId.startsWith("preset_") ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-danger"
                  onClick={() => {
                    deleteReport(activeSavedId);
                    setActiveSavedId("");
                    toast({
                      title: "Saved report deleted",
                      variant: "success",
                    });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete saved
                </Button>
              ) : null}

              <FormField label="Report type">
                <Select
                  value={definition.reportType}
                  onChange={(e) =>
                    changeReportType(e.target.value as ReportTypeId)
                  }
                >
                  {REPORT_TYPE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <div>
                <p className="erp-label mb-1.5">Date range</p>
                <DatePresetToggle
                  value={definition.datePreset}
                  onChange={changePreset}
                  includeCustom
                  compact
                />
              </div>

              {definition.datePreset === "custom" ||
              definition.reportType !== "stock" ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <FormField label="From">
                    <Input
                      type="date"
                      value={definition.dateFrom}
                      disabled={definition.reportType === "stock"}
                      onChange={(e) =>
                        patch({
                          datePreset: "custom",
                          dateFrom: e.target.value,
                        })
                      }
                    />
                  </FormField>
                  <FormField label="To">
                    <Input
                      type="date"
                      value={definition.dateTo}
                      disabled={definition.reportType === "stock"}
                      onChange={(e) =>
                        patch({ datePreset: "custom", dateTo: e.target.value })
                      }
                    />
                  </FormField>
                </div>
              ) : null}

              {definition.reportType === "stock" ? (
                <p className="text-xs text-ink-muted">
                  Stock report uses current on-hand quantities (date range not
                  applied).
                </p>
              ) : null}

              <FormField label="Group by">
                <Select
                  value={definition.groupBy}
                  onChange={(e) =>
                    patch({
                      groupBy: e.target.value as ReportDefinition["groupBy"],
                    })
                  }
                >
                  {groupOptions.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <FormField label="Sort by">
                  <Select
                    value={definition.sortBy}
                    onChange={(e) => patch({ sortBy: e.target.value })}
                  >
                    {availableColumns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                    <option value="count">Docs / count</option>
                  </Select>
                </FormField>
                <FormField label="Direction">
                  <Select
                    value={definition.sortDir}
                    onChange={(e) =>
                      patch({ sortDir: e.target.value as "asc" | "desc" })
                    }
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </Select>
                </FormField>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Columns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {availableColumns
                .filter(
                  (c) => c.id !== "count" || definition.groupBy !== "none",
                )
                .map((col) => (
                  <Checkbox
                    key={col.id}
                    label={col.label}
                    checked={
                      definition.columns.includes(col.id) ||
                      (col.id === "count" && definition.groupBy !== "none")
                    }
                    onChange={(e) => toggleColumn(col.id, e.target.checked)}
                    disabled={
                      col.id === "count" && definition.groupBy !== "none"
                    }
                  />
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4 text-ink-muted" />
                Filters
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1"
                onClick={() =>
                  setDefinition((prev) => ({
                    ...prev,
                    filters: [...prev.filters, emptyFilter(prev.reportType)],
                  }))
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {definition.filters.length === 0 ? (
                <p className="text-xs text-ink-muted">
                  No filters — all rows in range are included.
                </p>
              ) : (
                definition.filters.map((filter) => (
                  <div
                    key={filter.id}
                    className="space-y-2 rounded-md border border-border p-2"
                  >
                    <Select
                      value={filter.fieldId}
                      onChange={(e) =>
                        setDefinition((prev) => ({
                          ...prev,
                          filters: prev.filters.map((f) =>
                            f.id === filter.id
                              ? { ...f, fieldId: e.target.value }
                              : f,
                          ),
                        }))
                      }
                    >
                      {filterFields.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={filter.operator}
                      onChange={(e) =>
                        setDefinition((prev) => ({
                          ...prev,
                          filters: prev.filters.map((f) =>
                            f.id === filter.id
                              ? {
                                  ...f,
                                  operator: e.target
                                    .value as typeof filter.operator,
                                }
                              : f,
                          ),
                        }))
                      }
                    >
                      <option value="contains">contains</option>
                      <option value="equals">equals</option>
                      <option value="greater_than">greater than</option>
                      <option value="less_than">less than</option>
                    </Select>
                    <div className="flex gap-1">
                      <Input
                        value={filter.value}
                        placeholder="Value"
                        onChange={(e) =>
                          setDefinition((prev) => ({
                            ...prev,
                            filters: prev.filters.map((f) =>
                              f.id === filter.id
                                ? { ...f, value: e.target.value }
                                : f,
                            ),
                          }))
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="shrink-0 px-2"
                        onClick={() =>
                          setDefinition((prev) => ({
                            ...prev,
                            filters: prev.filters.filter(
                              (f) => f.id !== filter.id,
                            ),
                          }))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="min-w-0 print:border-0 print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{typeLabel} preview</CardTitle>
            <p className="text-sm text-ink-muted">
              {settings.businessName} ·{" "}
              {formatDate(definition.dateFrom, "long")} –{" "}
              {formatDate(definition.dateTo, "long")} · {result.rowCount} row
              {result.rowCount === 1 ? "" : "s"}
              {definition.groupBy !== "none"
                ? ` · Grouped by ${groupOptions.find((g) => g.id === definition.groupBy)?.label ?? definition.groupBy}`
                : ""}
            </p>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs text-ink-muted md:hidden">
              Swipe horizontally to see all columns.
            </p>
            <div className="-mx-1 overflow-x-auto rounded-md border border-border sm:mx-0">
              <table className="erp-table w-full min-w-[40rem] text-sm">
                <caption className="sr-only">Report preview results</caption>
                <thead>
                  <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-ink-muted">
                    {result.columns.map((col) => (
                      <th
                        key={col.id}
                        scope="col"
                        className="px-3 py-2.5 font-semibold"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={Math.max(result.columns.length, 1)}
                        className="px-3 py-10 text-center text-ink-muted"
                      >
                        No rows match this configuration.
                      </td>
                    </tr>
                  ) : (
                    result.rows.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/70">
                        {result.columns.map((col) => (
                          <td
                            key={col.id}
                            className={cn(
                              "px-3 py-2",
                              (col.valueType === "currency" ||
                                col.valueType === "number") &&
                                "text-right tabular-nums",
                            )}
                          >
                            {formatCell(row[col.id], col.valueType)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
                {result.rows.length > 0 &&
                Object.keys(result.totals).length > 0 ? (
                  <tfoot>
                    <tr className="border-t border-border bg-surface font-semibold">
                      {result.columns.map((col, i) => (
                        <td
                          key={col.id}
                          className={cn(
                            "px-3 py-2.5",
                            (col.valueType === "currency" ||
                              col.valueType === "number") &&
                              "text-right tabular-nums",
                          )}
                        >
                          {i === 0
                            ? "Total"
                            : col.aggregatable
                              ? formatCell(result.totals[col.id], col.valueType)
                              : ""}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save report"
        description="Stores this builder configuration on this device."
        size="md"
      >
        <div className="space-y-4">
          <FormField label="Report name">
            <Input
              value={saveName}
              placeholder="e.g. Monthly sales by customer"
              onChange={(e) => setSaveName(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSaveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={
                !saveName.trim() &&
                !(activeSavedId && !activeSavedId.startsWith("preset_"))
              }
            >
              {activeSavedId && !activeSavedId.startsWith("preset_")
                ? "Update"
                : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export report"
        description="Download the current preview as CSV, or print to PDF."
        size="md"
      >
        <div className="space-y-3">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md border border-border px-3 py-3 text-left text-sm hover:bg-surface"
            onClick={handleExportCsv}
          >
            <span>
              <strong>CSV</strong>
              <span className="mt-0.5 block text-xs text-ink-muted">
                Spreadsheet-ready export of the preview
              </span>
            </span>
            <Download className="h-4 w-4 text-ink-muted" />
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md border border-border px-3 py-3 text-left text-sm hover:bg-surface"
            onClick={() => {
              setExportOpen(false);
              window.print();
            }}
          >
            <span>
              <strong>PDF</strong>
              <span className="mt-0.5 block text-xs text-ink-muted">
                Opens the print dialog — choose Save as PDF
              </span>
            </span>
            <Printer className="h-4 w-4 text-ink-muted" />
          </button>
        </div>
      </Modal>
    </div>
  );
}
