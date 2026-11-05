export function download(name, text, type = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export function toCSV(rows) {
  if (!rows?.length) return "";
  const keys = Object.keys(rows[0]);
  return [keys.join(","), ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
}
export async function downloadBlob(res, name) {
  const b = await res.blob();
  const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; a.click();
}
