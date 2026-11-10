"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { swipeBrief } from "@/app/actions/swipes";
import { EmptyState } from "@/components/empty-state";
import { buttonClass, secondaryButtonClass } from "@/components/field";
import { formatCzk, formatDate } from "@/lib/format";

export type SwipeBrief = {
  id: string;
  imageUrl?: string;
  deadline: string;
  budget: number;
  description: string;
};

const THRESHOLD = 100;

function Card({ brief, dir, onDecide }: { brief: SwipeBrief; dir: number; onDecide: (liked: boolean) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const likeOpacity = useTransform(x, [20, THRESHOLD], [0, 1]);
  const skipOpacity = useTransform(x, [-THRESHOLD, -20], [1, 0]);

  return (
    <motion.div
      drag="x"
      dragSnapToOrigin
      style={{ x, rotate, touchAction: "pan-y" }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > THRESHOLD) onDecide(info.offset.x > 0);
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      custom={dir}
      variants={{ exit: (d: number) => ({ x: d * 400, opacity: 0, transition: { duration: 0.25 } }) }}
      exit="exit"
      className="relative flex cursor-grab flex-col overflow-hidden rounded-3xl bg-surface shadow-lg active:cursor-grabbing"
    >
      {brief.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- signed Storage URL, already resized in the browser
        <img src={brief.imageUrl} alt="" draggable={false} className="aspect-[4/3] w-full object-cover" />
      )}
      <div className="flex flex-col gap-2 p-5">
        <p className="text-3xl font-bold text-primary">{formatCzk(brief.budget)}</p>
        <p className="text-sm font-semibold text-muted">Termín do {formatDate(brief.deadline)}</p>
        <p className={`break-words ${brief.imageUrl ? "line-clamp-4" : "text-lg"}`}>{brief.description}</p>
      </div>
      <motion.span
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-sm font-bold text-background"
      >
        Mám zájem
      </motion.span>
      <motion.span
        style={{ opacity: skipOpacity }}
        className="pointer-events-none absolute right-4 top-4 rounded-full bg-secondary px-3 py-1 text-sm font-bold text-foreground"
      >
        Přeskočit
      </motion.span>
    </motion.div>
  );
}

export function SwipeDeck({ briefs }: { briefs: SwipeBrief[] }) {
  const [queue, setQueue] = useState(briefs);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const top = queue[0];

  async function decide(liked: boolean) {
    if (!top || busy) return;
    setBusy(true);
    setError(undefined);
    const result = await swipeBrief(top.id, liked);
    if (result.error) {
      setError(result.error);
      // The brief was probably taken meanwhile; drop it so the deck does not get stuck.
      setQueue((q) => q.slice(1));
    } else {
      setDir(liked ? 1 : -1);
      setQueue((q) => q.slice(1));
    }
    setBusy(false);
  }

  if (!top) {
    return <EmptyState>Žádné další zakázky. Zkuste to později.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="overflow-x-clip">
        <AnimatePresence mode="popLayout" custom={dir}>
          <Card key={top.id} brief={top} dir={dir} onDecide={decide} />
        </AnimatePresence>
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-accent">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(false)}
          className={`flex-1 ${secondaryButtonClass}`}
        >
          Přeskočit
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(true)}
          className={`flex-1 ${buttonClass}`}
        >
          Mám zájem
        </button>
      </div>
    </div>
  );
}
