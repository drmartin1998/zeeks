export const metadata = {
  title: "Events - Zeeks",
  description:
    "Upcoming events, tournaments, and community nights at your local Zeeks store.",
};

export default function EventsPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-secondary px-4 py-20">
      <div className="flex max-w-xl flex-col items-center gap-4 text-center">
        <h1 className="font-heading text-4xl font-extrabold text-neutral-900">
          Events
        </h1>
        <p className="text-base leading-relaxed text-neutral-900/60">
          Our full event calendar is coming soon. Check back for tournaments,
          community nights, and more at your local Zeeks store.
        </p>
      </div>
    </main>
  );
}