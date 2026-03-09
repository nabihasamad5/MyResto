"use client";
import React, { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";

type TableRow = { table_name: string };
type ColumnRow = {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: "YES" | "NO";
  column_default: any;
  column_key: string;
  extra: string;
};
type FKRow = {
  table_name: string;
  column_name: string;
  constraint_name: string;
  referenced_table: string;
  referenced_column: string;
};
type ConstraintRow = {
  table_name: string;
  constraint_name: string;
  constraint_type: string;
};

export default function SchemaPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<ColumnRow[]>([]);
  const [fks, setFks] = useState<FKRow[]>([]);
  const [constraints, setConstraints] = useState<ConstraintRow[]>([]);
  const [activeTable, setActiveTable] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/db/schema", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          if (res.ok && json?.success) {
            setTables(json.data.tables || []);
            setColumns(json.data.columns || []);
            setFks(json.data.foreign_keys || []);
            setConstraints(json.data.constraints || []);
            setActiveTable((json.data.tables || [])[0]?.table_name || null);
            setError(null);
          } else {
            setError(String(json?.error || "Failed to load schema"));
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || "Failed to load schema"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const columnsByTable = useMemo(() => {
    const map: Record<string, ColumnRow[]> = {};
    columns.forEach((c) => {
      map[c.table_name] = map[c.table_name] || [];
      map[c.table_name].push(c);
    });
    return map;
  }, [columns]);

  const fksByTable = useMemo(() => {
    const map: Record<string, FKRow[]> = {};
    fks.forEach((fk) => {
      map[fk.table_name] = map[fk.table_name] || [];
      map[fk.table_name].push(fk);
    });
    return map;
  }, [fks]);

  const constraintsByTable = useMemo(() => {
    const map: Record<string, ConstraintRow[]> = {};
    constraints.forEach((ct) => {
      map[ct.table_name] = map[ct.table_name] || [];
      map[ct.table_name].push(ct);
    });
    return map;
  }, [constraints]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-error-600 dark:text-error-400">{error}</div>;
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Database Schema</h2>
        <Button size="sm" variant="outline" onClick={() => location.reload()}>Refresh</Button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="p-3 border-b dark:border-gray-800">
              <div className="text-sm font-medium dark:text-gray-100">Tables</div>
            </div>
            <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {tables.map((t) => (
                <button
                  key={t.table_name}
                  onClick={() => setActiveTable(t.table_name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${activeTable === t.table_name ? "bg-brand-50 text-brand-700 dark:bg-white/[0.04]" : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"} dark:text-gray-200`}
                >
                  {t.table_name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="xl:col-span-2 space-y-6">
          {activeTable && (
            <>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="p-3 border-b dark:border-gray-800">
                  <div className="text-sm font-medium dark:text-gray-100">Columns · {activeTable}</div>
                </div>
                <div className="p-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left dark:text-gray-200">
                        <th className="px-2 py-2">Name</th>
                        <th className="px-2 py-2">Type</th>
                        <th className="px-2 py-2">Nullable</th>
                        <th className="px-2 py-2">Default</th>
                        <th className="px-2 py-2">Key</th>
                        <th className="px-2 py-2">Extra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(columnsByTable[activeTable] || []).map((c) => (
                        <tr key={`${c.table_name}-${c.column_name}`} className="border-t dark:border-gray-800">
                          <td className="px-2 py-2 dark:text-gray-100">{c.column_name}</td>
                          <td className="px-2 py-2 dark:text-gray-100">{c.data_type}</td>
                          <td className="px-2 py-2 dark:text-gray-100">{c.is_nullable}</td>
                          <td className="px-2 py-2 dark:text-gray-100">{String(c.column_default ?? "")}</td>
                          <td className="px-2 py-2 dark:text-gray-100">{c.column_key}</td>
                          <td className="px-2 py-2 dark:text-gray-100">{c.extra}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="p-3 border-b dark:border-gray-800">
                  <div className="text-sm font-medium dark:text-gray-100">Relations</div>
                </div>
                <div className="p-3">
                  {(fksByTable[activeTable] || []).length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No foreign keys</div>
                  ) : (
                    <div className="space-y-2">
                      {(fksByTable[activeTable] || []).map((f) => (
                        <div key={`${f.table_name}-${f.column_name}-${f.constraint_name}`} className="text-sm dark:text-gray-100">
                          {f.column_name} → {f.referenced_table}.{f.referenced_column} ({f.constraint_name})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="p-3 border-b dark:border-gray-800">
                  <div className="text-sm font-medium dark:text-gray-100">Constraints</div>
                </div>
                <div className="p-3">
                  {(constraintsByTable[activeTable] || []).length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No constraints</div>
                  ) : (
                    <div className="space-y-2">
                      {(constraintsByTable[activeTable] || []).map((ct) => (
                        <div key={`${ct.table_name}-${ct.constraint_name}`} className="text-sm dark:text-gray-100">
                          {ct.constraint_name} · {ct.constraint_type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

