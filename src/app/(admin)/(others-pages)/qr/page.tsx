"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";

type Table = { id: number; name?: string; is_active?: number; qr_code_slug?: string };

export default function QRCodesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/dining-tables", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success) setTables(json.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function getUrl(slug?: string) {
    if (!slug) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/order-table/${slug}`;
  }

  function downloadQr(slug: string, tableName: string) {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(getUrl(slug))}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableName.replace(/\s+/g, "_")}_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function copyLink(slug: string) {
    navigator.clipboard?.writeText(getUrl(slug)).then(() => alert("Link copied to clipboard"));
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold dark:text-gray-100">QR Codes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Scan to open the order menu for each table</p>
        </div>
        <Button size="sm" variant="outline" onClick={load}>Refresh</Button>
      </div>
      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      ) : tables.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">No tables found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map((t) => {
            const hasSlug = !!t.qr_code_slug;
            const link = getUrl(t.qr_code_slug);
            const qrImg = hasSlug
              ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`
              : null;

            return (
              <div key={t.id} className={`rounded-xl border p-4 flex flex-col items-center text-center dark:border-gray-800 bg-white dark:bg-white/[0.03] ${!t.is_active ? 'opacity-60 grayscale' : ''}`}>
                <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{t.name || `Table ${t.id}`}</div>
                <div className={`text-xs mb-3 px-2 py-0.5 rounded-full ${t.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                  {t.is_active ? 'Active' : 'Inactive'}
                </div>

                {hasSlug && qrImg ? (
                  <>
                    <div className="bg-white p-2 rounded-lg border dark:border-gray-700 mb-3">
                      <img src={qrImg} alt={`QR for ${t.name}`} className="w-40 h-40 object-contain" />
                    </div>

                    <div className="w-full grid grid-cols-2 gap-2 mt-auto">
                      <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => copyLink(t.qr_code_slug!)}>
                        Copy Link
                      </Button>
                      <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => downloadQr(t.qr_code_slug!, t.name || `table_${t.id}`)}>
                        Download
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed rounded-lg mb-3 dark:border-gray-700">
                    No QR Slug
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

