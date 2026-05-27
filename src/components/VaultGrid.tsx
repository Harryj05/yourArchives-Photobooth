"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTheme, type ThemeId } from "@/lib/themes";
import { getFilter, type FilterId } from "@/lib/filters";
import QRShareModal from "@/components/QRShareModal";

export interface VaultSession {
  id: number;
  layout: string;
  title: string | null;
  event_date: string | null;
  created_at: string;
  theme: ThemeId | null;
  photos: { url: string; filter: FilterId | null }[];
}

export interface VaultAlbum {
  id: string;
  name: string;
  created_at: string;
  sessionIds: number[];
}

type VaultTab = "all" | "date" | "album";

interface VaultGridProps {
  sessions: VaultSession[];
  albums: VaultAlbum[];
}

function formatMonthYear(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

function getDateKey(s: VaultSession): string {
  // User-set event_date wins. Otherwise convert created_at (UTC ISO from
  // Supabase) into the viewer's LOCAL YYYY-MM-DD so a strip captured late
  // at night doesn't get filed under the previous UTC day.
  if (s.event_date) return s.event_date;
  const d = new Date(s.created_at);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function downloadStrip(session: VaultSession) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const theme = getTheme(session.theme);

  const CANVAS_WIDTH = 600;
  const PADDING = 12;
  const INNER_WIDTH = CANVAS_WIDTH - PADDING * 2;
  const PHOTO_HEIGHT = INNER_WIDTH;
  const GAP = 4;
  const FOOTER_HEIGHT = 140;

  const photoCount = session.photos.length;
  const CANVAS_HEIGHT =
    PADDING + photoCount * PHOTO_HEIGHT + (photoCount - 1) * GAP + FOOTER_HEIGHT;

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // Themed background
  ctx.fillStyle = theme.backgroundColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  // `object-fit: cover` for canvas — preserves aspect ratio by
  // center-cropping the source image to fill the (square) slot.
  const drawCover = (
    image: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ) => {
    const imgRatio = image.naturalWidth / image.naturalHeight;
    const slotRatio = dw / dh;
    let sx: number, sy: number, sw: number, sh: number;
    if (imgRatio > slotRatio) {
      sh = image.naturalHeight;
      sw = sh * slotRatio;
      sx = (image.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = image.naturalWidth;
      sh = sw / slotRatio;
      sx = 0;
      sy = (image.naturalHeight - sh) / 2;
    }
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
  };

  for (let i = 0; i < photoCount; i++) {
    const yPos = PADDING + i * (PHOTO_HEIGHT + GAP);
    try {
      const img = await loadImage(session.photos[i].url);
      drawCover(img, PADDING, yPos, INNER_WIDTH, PHOTO_HEIGHT);
    } catch (e) {
      console.error("Failed to load image", session.photos[i].url, e);
    }
    if (theme.borderWidth > 0) {
      ctx.lineWidth = theme.borderWidth;
      ctx.strokeStyle = theme.borderColor;
      ctx.strokeRect(
        PADDING + theme.borderWidth / 2,
        yPos + theme.borderWidth / 2,
        INNER_WIDTH - theme.borderWidth,
        PHOTO_HEIGHT - theme.borderWidth,
      );
    }
  }

  // Overlay effects
  if (theme.overlayEffect === "vignette") {
    const grad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.3,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.75,
    );
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else if (theme.overlayEffect === "grain") {
    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let n = 0; n < 1800; n++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
      ctx.fillRect(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, 1, 1);
    }
    ctx.restore();
  } else if (theme.overlayEffect === "glow") {
    ctx.save();
    ctx.shadowColor = theme.accentColor;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2;
    ctx.strokeStyle = theme.accentColor;
    ctx.strokeRect(3, 3, CANVAS_WIDTH - 6, CANVAS_HEIGHT - 6);
    ctx.restore();
  }

  const footerY = CANVAS_HEIGHT - FOOTER_HEIGHT / 2 + 12;

  const label = session.title ?? formatDate(getDateKey(session));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = theme.fontColor;
  ctx.font = `italic 22px ${theme.fontFamily}`;
  ctx.fillText(label, CANVAS_WIDTH / 2, footerY - 22);

  // Brand mark with themed typography
  const text1 = "your";
  const text2 = "Archives";
  ctx.font = `bold 28px ${theme.fontFamily}`;
  const width1 = ctx.measureText(text1).width;
  ctx.font = `italic 300 28px ${theme.fontFamily}`;
  const width2 = ctx.measureText(text2).width;
  const totalWidth = width1 + width2;
  const startX = (CANVAS_WIDTH - totalWidth) / 2;

  ctx.fillStyle = theme.fontColor;
  ctx.font = `bold 28px ${theme.fontFamily}`;
  ctx.fillText(text1, startX + width1 / 2, footerY + 18);
  ctx.fillStyle = theme.accentColor;
  ctx.font = `italic 300 28px ${theme.fontFamily}`;
  ctx.fillText(text2, startX + width1 + width2 / 2, footerY + 18);

  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  const safeName = (session.title ?? `strip-${session.id}`).replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
  link.download = `yourArchives-${safeName}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function EditModal({
  session,
  onClose,
  onSaved,
}: {
  session: VaultSession;
  onClose: () => void;
  onSaved: (updated: Pick<VaultSession, "title" | "event_date">) => void;
}) {
  const [title, setTitle] = useState(session.title ?? "");
  const [date, setDate] = useState(getDateKey(session));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          event_date: date,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to save");
        return;
      }
      onSaved({ title: title.trim() || null, event_date: date });
      onClose();
    } catch (e) {
      console.error(e);
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold text-zinc-900 mb-6">Edit Strip</h3>

        <label className="block font-sans text-[12px] uppercase tracking-[0.22em] text-zinc-500 mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Raksha Bandhan, Café Mocha"
          className="w-full px-4 py-3 mb-5 bg-white border border-zinc-200 rounded-lg font-sans text-sm text-zinc-900 focus:outline-none focus:border-[#8C1D24] transition-colors"
        />

        <label className="block font-sans text-[12px] uppercase tracking-[0.22em] text-zinc-500 mb-2">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 mb-5 bg-white border border-zinc-200 rounded-lg font-sans text-sm text-zinc-900 focus:outline-none focus:border-[#8C1D24] transition-colors"
        />

        {error && (
          <p className="font-sans text-xs text-[#8C1D24] bg-[#8C1D24]/5 border border-[#8C1D24]/20 px-3 py-2 rounded-md mb-4">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-700 font-sans text-[13px] uppercase tracking-widest rounded-lg hover:border-zinc-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={busy}
            className="flex-1 py-3 bg-zinc-950 text-white font-sans text-[13px] uppercase tracking-widest rounded-lg hover:bg-[#8C1D24] transition-colors disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  onClose,
  onConfirm,
  busy,
}: {
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold text-zinc-900 mb-3">Delete this strip?</h3>
        <p className="font-sans text-sm text-zinc-600 mb-6 leading-relaxed">
          This will permanently remove the strip and all its photos. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-700 font-sans text-[13px] uppercase tracking-widest rounded-lg hover:border-zinc-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 py-3 bg-[#8C1D24] text-white font-sans text-[13px] uppercase tracking-widest rounded-lg hover:bg-[#6e161b] transition-colors disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StripCard({
  session,
  onUpdate,
  onDelete,
  onToast,
  selectable,
  selected,
  onToggleSelect,
}: {
  session: VaultSession;
  onUpdate: (s: VaultSession) => void;
  onDelete: (id: number) => void;
  onToast: (msg: string) => void;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const photos = session.photos ?? [];
  const label = session.title ?? formatDate(getDateKey(session));
  const theme = getTheme(session.theme);

  const doDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        onToast(body.error ?? "Failed to delete");
        return;
      }
      onDelete(session.id);
      onToast("Strip deleted");
    } catch (e) {
      console.error(e);
      onToast("Network error");
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const fetchShareUrl = async (): Promise<string | null> => {
    const res = await fetch(`/api/sessions/${session.id}/share`, { method: "POST" });
    if (!res.ok) {
      const body = await res.json();
      onToast(body.error ?? "Failed to create share link");
      return null;
    }
    const { token } = (await res.json()) as { token: string };
    return `${window.location.origin}/share/${token}`;
  };

  const doShare = async () => {
    setSharing(true);
    try {
      const url = await fetchShareUrl();
      if (!url) return;
      await navigator.clipboard.writeText(url);
      onToast("Share link copied to clipboard");
    } catch (e) {
      console.error(e);
      onToast("Failed to copy link");
    } finally {
      setSharing(false);
    }
  };

  const doShareQR = async () => {
    setSharing(true);
    try {
      const url = await fetchShareUrl();
      if (!url) return;
      setQrUrl(url);
    } catch (e) {
      console.error(e);
      onToast("Failed to open QR");
    } finally {
      setSharing(false);
    }
  };

  const stripBox = (
    <div
      className={`relative aspect-[2/7] p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-all duration-500 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] group-hover:-translate-y-1 ${theme.livePreviewClass} ${
        selectable && selected ? "ring-2 ring-[#8C1D24] ring-offset-2 ring-offset-transparent" : ""
      }`}
      style={
        theme.borderWidth > 0
          ? { border: `${Math.max(1, theme.borderWidth / 4)}px solid ${theme.borderColor}` }
          : undefined
      }
    >
      {selectable && (
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              selected
                ? "bg-[#8C1D24] border-[#8C1D24]"
                : "bg-white/80 border-white shadow"
            }`}
          >
            {selected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            )}
          </div>
        </div>
      )}
      <div className="w-full h-full flex flex-col gap-0.5">
        {photos.slice(0, 4).map((photo, i) => (
          <div key={i} className="relative w-full flex-1 overflow-hidden bg-zinc-900">
            <Image
              src={photo.url}
              alt={`Strip ${session.id} shot ${i + 1}`}
              fill
              className="object-cover"
              sizes="200px"
            />
          </div>
        ))}
        <div
          className="pt-1 text-center text-[6px] font-bold tracking-tight"
          style={{ fontFamily: theme.fontFamily, color: theme.fontColor }}
        >
          your
          <span className="italic ml-0.5" style={{ color: theme.accentColor }}>
            Archives
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="group flex flex-col">
        {/* Mini photostrip — themed background, border, brand mark */}
        {selectable ? (
          <button
            type="button"
            onClick={() => onToggleSelect(session.id)}
            className="block w-full text-left"
            aria-pressed={selected}
          >
            {stripBox}
          </button>
        ) : (
          <Link href={`/archive/${session.id}`} className="block">
            {stripBox}
          </Link>
        )}

        {/* Caption */}
        <div className="mt-3 text-center px-1">
          <p className="font-serif text-[15px] text-zinc-800 italic truncate group-hover:text-[#8C1D24] transition-colors" title={label}>
            {label}
          </p>
          {session.title && (
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-zinc-400 mt-1">
              {formatDate(getDateKey(session))}
            </p>
          )}
          <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-zinc-400 mt-1">
            {theme.name}
            {photos[0]?.filter && photos[0].filter !== "color" && (
              <span className="ml-1 text-zinc-300">
                · {getFilter(photos[0].filter).label}
              </span>
            )}
          </p>
        </div>

        {/* Actions — hidden in selection mode */}
        {!selectable && (
        <div className="mt-3 flex items-center justify-center">

          {/* ── Mobile: three-dot menu ── */}
          <div className="relative md:hidden">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
              aria-label="More actions"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
              </svg>
            </button>

            {menuOpen && (
              <>
                {/* backdrop to close on outside tap */}
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 bg-white border border-zinc-100 rounded-xl shadow-xl overflow-hidden w-44">
                  <button
                    onClick={() => { setEditing(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left font-sans text-[12px] text-zinc-700 hover:bg-zinc-50 transition-colors border-b border-zinc-100"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                    Edit
                  </button>
                  <button
                    onClick={() => { downloadStrip(session); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left font-sans text-[12px] text-zinc-700 hover:bg-zinc-50 transition-colors border-b border-zinc-100"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download
                  </button>
                  <button
                    onClick={() => { doShare(); setMenuOpen(false); }}
                    disabled={sharing}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left font-sans text-[12px] text-zinc-700 hover:bg-zinc-50 transition-colors border-b border-zinc-100 disabled:opacity-50"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    Copy Link
                  </button>
                  <button
                    onClick={() => { doShareQR(); setMenuOpen(false); }}
                    disabled={sharing}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left font-sans text-[12px] text-zinc-700 hover:bg-zinc-50 transition-colors border-b border-zinc-100 disabled:opacity-50"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="17" y1="17" x2="17" y2="21"/><line x1="20" y1="14" x2="20" y2="17"/></svg>
                    Show QR
                  </button>
                  <button
                    onClick={() => { setConfirmingDelete(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left font-sans text-[12px] text-[#8C1D24] hover:bg-red-50 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Desktop: five individual buttons ── */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
              aria-label="Edit" title="Edit"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            </button>
            <button
              onClick={() => downloadStrip(session)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
              aria-label="Download" title="Download"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button
              onClick={doShare}
              disabled={sharing}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors disabled:opacity-50"
              aria-label="Share — copy link" title="Copy public share link"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
            <button
              onClick={doShareQR}
              disabled={sharing}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors disabled:opacity-50"
              aria-label="Share — show QR code" title="Show QR code"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="17"/><line x1="17" y1="14" x2="17" y2="14"/><line x1="14" y1="20" x2="14" y2="20"/><line x1="17" y1="17" x2="17" y2="21"/><line x1="20" y1="14" x2="20" y2="17"/><line x1="20" y1="20" x2="21" y2="20"/></svg>
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:border-[#8C1D24] hover:text-[#8C1D24] transition-colors"
              aria-label="Delete" title="Delete strip"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>

        </div>
        )}
      </div>

      {editing && (
        <EditModal
          session={session}
          onClose={() => setEditing(false)}
          onSaved={({ title, event_date }) => onUpdate({ ...session, title, event_date })}
        />
      )}
      {confirmingDelete && (
        <ConfirmDeleteModal
          onClose={() => setConfirmingDelete(false)}
          onConfirm={doDelete}
          busy={deleting}
        />
      )}
      {qrUrl && (
        <QRShareModal
          shareUrl={qrUrl}
          caption={session.title ?? label}
          onClose={() => setQrUrl(null)}
        />
      )}
    </>
  );
}

// ───────────────────────────────────────────────────────────────────
// New-album modal
// ───────────────────────────────────────────────────────────────────
function NewAlbumModal({
  onClose,
  onCreated,
  onToast,
}: {
  onClose: () => void;
  onCreated: (album: VaultAlbum) => void;
  onToast: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json();
        onToast(body.error ?? "Failed to create album");
        return;
      }
      const { album } = (await res.json()) as { album: VaultAlbum };
      onCreated(album);
      onClose();
      onToast(`Album "${album.name}" created`);
    } catch (e) {
      console.error(e);
      onToast("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold text-zinc-900 mb-6">New Album</h3>
        <label className="block font-sans text-[12px] uppercase tracking-[0.22em] text-zinc-500 mb-2">
          Name
        </label>
        <input
          type="text"
          autoFocus
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Diwali 2026, Tokyo Trip"
          className="w-full px-4 py-3 mb-5 bg-white border border-zinc-200 rounded-lg font-sans text-sm text-zinc-900 focus:outline-none focus:border-[#8C1D24] transition-colors"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-700 font-sans text-[13px] uppercase tracking-widest rounded-lg hover:border-zinc-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={busy || !name.trim()}
            className="flex-1 py-3 bg-zinc-950 text-white font-sans text-[13px] uppercase tracking-widest rounded-lg hover:bg-[#8C1D24] transition-colors disabled:opacity-50"
          >
            {busy ? "Saving…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Album-picker modal — choose an existing album to add the selected
// strips to. Lets the user create a new album inline.
// ───────────────────────────────────────────────────────────────────
function AlbumPickerModal({
  albums,
  onClose,
  onPick,
  onCreate,
}: {
  albums: VaultAlbum[];
  onClose: () => void;
  onPick: (albumId: string) => void;
  onCreate: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold text-zinc-900 mb-6">Add to Album</h3>
        {albums.length === 0 ? (
          <p className="font-sans text-sm text-zinc-500 mb-6">
            You haven&apos;t created any albums yet.
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto -mx-2 mb-4">
            {albums.map((a) => (
              <button
                key={a.id}
                onClick={() => onPick(a.id)}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-zinc-50 transition-colors flex items-center justify-between gap-3"
              >
                <span className="font-serif text-sm text-zinc-800 truncate">{a.name}</span>
                <span className="font-sans text-[12px] uppercase tracking-[0.2em] text-zinc-400 flex-shrink-0">
                  {a.sessionIds.length} {a.sessionIds.length === 1 ? "strip" : "strips"}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-700 font-sans text-[13px] uppercase tracking-widest rounded-lg hover:border-zinc-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            className="flex-1 py-3 bg-zinc-950 text-white font-sans text-[13px] uppercase tracking-widest rounded-lg hover:bg-[#8C1D24] transition-colors"
          >
            + New Album
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Rename album modal
// ───────────────────────────────────────────────────────────────────
function RenameAlbumModal({
  album,
  onClose,
  onRenamed,
  onToast,
}: {
  album: VaultAlbum;
  onClose: () => void;
  onRenamed: (id: string, name: string) => void;
  onToast: (msg: string) => void;
}) {
  const [name, setName] = useState(album.name);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === album.name) {
      onClose();
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/albums/${album.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json();
        onToast(body.error ?? "Rename failed");
        return;
      }
      onRenamed(album.id, trimmed);
      onClose();
    } catch (e) {
      console.error(e);
      onToast("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold text-zinc-900 mb-6">Rename Album</h3>
        <input
          type="text"
          autoFocus
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 mb-5 bg-white border border-zinc-200 rounded-lg font-sans text-sm text-zinc-900 focus:outline-none focus:border-[#8C1D24] transition-colors"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-700 font-sans text-[13px] uppercase tracking-widest rounded-lg hover:border-zinc-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={busy}
            className="flex-1 py-3 bg-zinc-950 text-white font-sans text-[13px] uppercase tracking-widest rounded-lg hover:bg-[#8C1D24] transition-colors disabled:opacity-50"
          >
            {busy ? "Saving…" : "Rename"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Main grid — three tabs (All, By Date, By Album), selection mode,
// album CRUD.
// ───────────────────────────────────────────────────────────────────
export default function VaultGrid({ sessions: initialSessions, albums: initialAlbums }: VaultGridProps) {
  const [sessions, setSessions] = useState<VaultSession[]>(initialSessions);
  const [albums, setAlbums] = useState<VaultAlbum[]>(initialAlbums);
  const [tab, setTab] = useState<VaultTab>("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [renamingAlbum, setRenamingAlbum] = useState<VaultAlbum | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const updateSession = (updated: VaultSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const deleteSession = (id: number) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    // Also drop it from any albums client-side.
    setAlbums((prev) =>
      prev.map((a) => ({ ...a, sessionIds: a.sessionIds.filter((sid) => sid !== id) })),
    );
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const addSelectedToAlbum = async (albumId: string) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      const res = await fetch(`/api/albums/${albumId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionIds: ids }),
      });
      if (!res.ok) {
        const body = await res.json();
        showToast(body.error ?? "Failed to add to album");
        return;
      }
      setAlbums((prev) =>
        prev.map((a) =>
          a.id === albumId
            ? { ...a, sessionIds: Array.from(new Set([...a.sessionIds, ...ids])) }
            : a,
        ),
      );
      showToast(`Added ${ids.length} ${ids.length === 1 ? "strip" : "strips"} to album`);
      setShowAlbumPicker(false);
      exitSelectMode();
    } catch (e) {
      console.error(e);
      showToast("Network error");
    }
  };

  const deleteAlbum = async (albumId: string) => {
    if (!confirm("Delete this album? The strips inside it will stay in your vault.")) return;
    try {
      const res = await fetch(`/api/albums/${albumId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        showToast(body.error ?? "Failed to delete album");
        return;
      }
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
      showToast("Album deleted");
    } catch (e) {
      console.error(e);
      showToast("Network error");
    }
  };

  // Group sessions by month/year — used by "By Date" tab.
  const groupedByMonth = useMemo(() => {
    const map = new Map<string, VaultSession[]>();
    for (const s of sessions) {
      const key = getDateKey(s).slice(0, 7) + "-01"; // YYYY-MM-01
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sessions]);

  const sessionsById = useMemo(() => {
    const m = new Map<number, VaultSession>();
    for (const s of sessions) m.set(s.id, s);
    return m;
  }, [sessions]);

  const renderStripCard = (s: VaultSession) => (
    <StripCard
      key={s.id}
      session={s}
      onUpdate={updateSession}
      onDelete={deleteSession}
      onToast={showToast}
      selectable={selectMode}
      selected={selected.has(s.id)}
      onToggleSelect={toggleSelect}
    />
  );

  return (
    <>
      {/* Tabs + actions toolbar */}
      <div className="mb-12 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 bg-zinc-100 rounded-lg p-1 self-start">
          {(["all", "date", "album"] as const).map((id) => (
            <button
              key={id}
              onClick={() => { setTab(id); exitSelectMode(); }}
              className={`px-4 py-2 rounded-md font-sans text-[13px] uppercase tracking-widest transition-all ${
                tab === id ? "bg-white text-zinc-900 shadow-sm font-bold" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {id === "all" ? "All" : id === "date" ? "By Date" : "By Album"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => setShowNewAlbum(true)}
            className="font-sans text-[13px] uppercase tracking-widest text-zinc-700 hover:text-[#8C1D24] transition-colors px-3 py-2"
          >
            + New Album
          </button>
          {selectMode ? (
            <button
              onClick={exitSelectMode}
              className="font-sans text-[13px] uppercase tracking-widest bg-zinc-100 text-zinc-700 rounded-lg px-4 py-2 hover:bg-zinc-200 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              className="font-sans text-[13px] uppercase tracking-widest bg-zinc-950 text-white rounded-lg px-4 py-2 hover:bg-[#8C1D24] transition-colors"
            >
              Select
            </button>
          )}
        </div>
      </div>

      {/* Active-selection toolbar */}
      {selectMode && (
        <div className="mb-8 px-4 py-3 bg-white border border-zinc-200/60 rounded-xl flex items-center justify-between gap-4">
          <span className="font-sans text-xs text-zinc-700">
            <strong className="font-bold text-zinc-900">{selected.size}</strong>{" "}
            {selected.size === 1 ? "strip" : "strips"} selected
          </span>
          <button
            onClick={() => setShowAlbumPicker(true)}
            disabled={selected.size === 0}
            className="font-sans text-[13px] uppercase tracking-widest bg-[#8C1D24] text-white rounded-lg px-4 py-2 hover:bg-[#6e161b] transition-colors disabled:opacity-30"
          >
            Add to Album
          </button>
        </div>
      )}

      {/* Tab content */}
      <div className="space-y-16">
        {tab === "all" && (
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-6">
              {sessions.map(renderStripCard)}
            </div>
          </section>
        )}

        {tab === "date" &&
          groupedByMonth.map(([monthKey, items]) => (
            <section key={monthKey}>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="font-display text-lg font-bold text-zinc-900 tracking-tight">
                  {formatMonthYear(monthKey)}
                </h2>
                <div className="flex-1 h-px bg-zinc-200" />
                <span className="font-sans text-[12px] uppercase tracking-[0.22em] text-zinc-400">
                  {items.length} {items.length === 1 ? "strip" : "strips"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-6">
                {items.map(renderStripCard)}
              </div>
            </section>
          ))}

        {tab === "album" && (
          <>
            {albums.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-serif text-zinc-500 italic mb-6">
                  No albums yet. Group strips into collections like Diwali 2026 or Tokyo Trip.
                </p>
                <button
                  onClick={() => setShowNewAlbum(true)}
                  className="px-6 py-3 bg-zinc-950 text-white font-sans text-[13px] uppercase tracking-widest rounded-lg hover:bg-[#8C1D24] transition-colors"
                >
                  + Create Your First Album
                </button>
              </div>
            ) : (
              albums.map((album) => {
                const items = album.sessionIds
                  .map((id) => sessionsById.get(id))
                  .filter((s): s is VaultSession => !!s);
                return (
                  <section key={album.id}>
                    <div className="flex items-center gap-4 mb-6">
                      <h2 className="font-display text-lg font-bold text-zinc-900 tracking-tight">
                        {album.name}
                      </h2>
                      <div className="flex-1 h-px bg-zinc-200" />
                      <span className="font-sans text-[12px] uppercase tracking-[0.22em] text-zinc-400">
                        {items.length} {items.length === 1 ? "strip" : "strips"}
                      </span>
                      <button
                        onClick={() => setRenamingAlbum(album)}
                        className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 transition-colors"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => deleteAlbum(album.id)}
                        className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-400 hover:text-[#8C1D24] transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                    {items.length === 0 ? (
                      <p className="font-sans text-sm text-zinc-400 italic mb-4">
                        No strips in this album yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-6">
                        {items.map(renderStripCard)}
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showNewAlbum && (
        <NewAlbumModal
          onClose={() => setShowNewAlbum(false)}
          onCreated={(album) => setAlbums((prev) => [album, ...prev])}
          onToast={showToast}
        />
      )}
      {showAlbumPicker && (
        <AlbumPickerModal
          albums={albums}
          onClose={() => setShowAlbumPicker(false)}
          onPick={addSelectedToAlbum}
          onCreate={() => {
            setShowAlbumPicker(false);
            setShowNewAlbum(true);
          }}
        />
      )}
      {renamingAlbum && (
        <RenameAlbumModal
          album={renamingAlbum}
          onClose={() => setRenamingAlbum(null)}
          onRenamed={(id, name) =>
            setAlbums((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)))
          }
          onToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 bg-zinc-950 text-white font-sans text-[11px] uppercase tracking-widest rounded-lg shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
