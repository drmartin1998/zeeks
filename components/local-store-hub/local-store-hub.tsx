import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { events } from "./events-data";
import { EventCard } from "./event-card";

export function LocalStoreHub() {
  return (
    <section id="local-store-hub" className="w-full bg-secondary">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-4 py-12 md:px-8 lg:px-20 lg:py-20">
        <div className="flex items-end justify-between gap-6">
          <div className="flex max-w-[800px] flex-col gap-2">
            <h2 className="font-heading text-[40px] font-extrabold leading-tight">
              <span className="text-action-secondary">Local</span>{" "}
              <span className="text-neutral-900">Store Hub</span>
            </h2>
            <p className="text-base text-neutral-900/60">
              Upcoming events, tournaments, and community nights at your local
              Zeeks store.
            </p>
          </div>
          <Link
            href="/events"
            className="flex shrink-0 items-center gap-2 text-sm font-bold uppercase text-[#E89516] transition-colors hover:opacity-80"
          >
            View All Events
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {events.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((event) => (
              <EventCard key={event.id} {...event} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}