"use client";

import { useState } from "react";

interface Props {
  mcpToken: string | null;
}

export function ShareButton({ mcpToken }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!mcpToken) return null;

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/share?token=${mcpToken}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = async () => {
    const res = await fetch(shareUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stark-health-${new Date().toISOString().split("T")[0]}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 rounded-full border border-edge px-3 py-1.5 text-[10px] font-light tracking-wider text-t4 transition-all hover:border-edge-h hover:text-t2"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M4 8v5a1 1 0 001 1h6a1 1 0 001-1V8M11 4L8 1M8 1L5 4M8 1v9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Share
      </button>

      {/* Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-edge bg-page p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-light tracking-wider text-t1">Share Health Card</h3>
              <button onClick={() => setShowModal(false)} className="text-t4 hover:text-t2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>

            {/* Preview */}
            <div className="mt-4 overflow-hidden rounded-xl border border-edge">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shareUrl} alt="Health Card Preview" className="w-full" />
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-3">
              <button onClick={downloadImage}
                className="flex-1 rounded-xl bg-btn py-2.5 text-[12px] font-light tracking-wider text-t2 transition-all hover:bg-btn-h">
                Download Image
              </button>
              <button onClick={copyLink}
                className="flex-1 rounded-xl border border-edge py-2.5 text-[12px] font-light tracking-wider text-t3 transition-all hover:border-edge-h hover:text-t1">
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
