import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  showNav?: boolean;
}

export function ErrorPage({ showNav = true }: ErrorPageProps) {
  const content = (
    <main className="flex flex-1 flex-col items-center bg-white px-4 py-12">
      {/* Illustration */}
      <div className="relative mb-0 w-full max-w-[640px]">
        <Image
          src="/images/error-illustration.png"
          alt="Battlefield mishap illustration"
          width={640}
          height={380}
          className="h-auto w-full rounded-lg"
          priority
        />
        {/* Saving Throw Badge */}
        <div className="absolute left-4 top-4">
          <div className="flex items-center gap-1.5 rounded-full bg-[#7B4FA2] px-3 py-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#E89516]" />
            <span className="text-xs font-bold uppercase text-white">
              FAILED SAVING THROW
            </span>
          </div>
        </div>
      </div>

      {/* Text Stack */}
      <div className="mt-10 flex w-full max-w-[640px] flex-col items-center text-center">
        {/* Eyebrow */}
        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-[#E89516]">
          You Rolled a Natural 1
        </p>

        {/* Headline */}
        <h1
          className="mb-4 text-[56px] font-black leading-tight text-[#7B4FA2]"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          CRITICAL MISS!
        </h1>

        {/* Subheading */}
        <p
          className="mb-8 max-w-[640px] text-base leading-relaxed text-[#9090A8]"
          style={{ lineHeight: "1.6" }}
        >
          Your squad took a wrong turn at the sector coordinates and vanished
          entirely into the Warp. Or maybe this page just got blasted off the
          tabletop. Either way, we need to fall back!
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="primary" size="xl">
              Regroup at Homepage
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );

  if (!showNav) {
    return (
      <html>
        <body>
          <div className="flex min-h-screen flex-col bg-white">{content}</div>
        </body>
      </html>
    );
  }

  return content;
}
