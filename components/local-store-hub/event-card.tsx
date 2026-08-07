import type { Event } from "./events-data";

export function EventCard({ category, dateTime, title, description }: Event) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-[#CDCDD8] bg-surface-primary p-6 shadow-[0_10px_24px_-10px_rgba(14,14,44,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <span className="rounded bg-action-primary px-2.5 py-1.5 text-xs font-extrabold uppercase text-text-on-primary">
          {category}
        </span>
        <span className="text-[13px] font-bold text-[#E89516]">
          {dateTime}
        </span>
      </div>

      <h3 className="font-heading text-[22px] font-bold leading-snug text-neutral-900">
        {title}
      </h3>

      <p className="text-sm leading-[1.5] text-tertiary">{description}</p>
    </article>
  );
}