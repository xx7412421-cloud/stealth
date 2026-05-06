import { motion } from "framer-motion";
import { Star, Paperclip } from "lucide-react";
import type { Email } from "./data";
import { cn } from "@/lib/utils";

export function EmailList({
  emails, selectedId, onSelect, folder,
}: {
  emails: Email[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  folder: string;
}) {
  const filtered = emails.filter((e) => folder === "starred" ? e.starred : e.folder === folder || folder === "inbox");

  return (
    <section className="glass relative m-3 flex h-[calc(100vh-1.5rem-3.5rem-0.75rem)] w-full flex-col overflow-hidden rounded-2xl md:w-[420px] md:shrink-0">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold capitalize tracking-tight text-foreground">{folder}</h2>
          <p className="text-[11px] text-muted-foreground">{filtered.length} conversations</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/5 bg-white/[0.03] p-0.5 text-[11px]">
          {["All", "Unread", "Flagged"].map((t, i) => (
            <button
              key={t}
              className={cn(
                "rounded-md px-2.5 py-1 transition",
                i === 0 ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <ul className="scrollbar-thin flex-1 overflow-y-auto p-2">
        {filtered.map((e, idx) => {
          const active = selectedId === e.id;
          return (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02, duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <motion.button
                onClick={() => onSelect(e.id)}
                whileTap={{ scale: 0.995 }}
                className={cn(
                  "group relative mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition",
                  "hover:bg-white/[0.04]",
                  active && "bg-white/[0.06]"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="email-active"
                    className="absolute inset-0 rounded-xl ring-1 ring-white/10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white/90"
                     style={{ background: `linear-gradient(135deg, ${e.avatarColor}, #1a1a1d)` }}>
                  {e.from.split(" ").map(n => n[0]).slice(0,2).join("")}
                  {e.unread && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[oklch(0.9_0.005_270)] ring-2 ring-[oklch(0.18_0.005_270)]" />}
                </div>
                <div className="relative min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn("truncate text-sm", e.unread ? "font-semibold text-foreground" : "text-foreground/85")}>
                      {e.from}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{e.time}</span>
                  </div>
                  <div className={cn("truncate text-[13px]", e.unread ? "text-foreground/95" : "text-foreground/75")}>
                    {e.subject}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="truncate text-[11.5px] text-muted-foreground">{e.preview}</p>
                  </div>
                  {(e.labels?.length || e.attachments?.length || e.starred) && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {e.starred && <Star className="h-3 w-3 fill-[oklch(0.85_0.005_270)] text-[oklch(0.85_0.005_270)]" />}
                      {e.attachments?.length ? <Paperclip className="h-3 w-3 text-muted-foreground" /> : null}
                      {e.labels?.map((l) => (
                        <span key={l} className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.button>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
