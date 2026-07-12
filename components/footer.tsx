import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FOOTER_LINKS = {
  Categories: ["Miniatures", "Board Games", "Card Games", "Supplies"],
  Support: ["Help Center", "Contact Us", "FAQ"],
  Community: ["Discord", "Events"],
  Company: ["About Us"],
};

const SOCIAL_LINKS = ["discord", "twitter", "instagram", "youtube"];

export function Footer() {
  return (
    <footer className="w-full bg-neutral-900">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 pt-12 pb-6 md:gap-16 md:px-8 lg:gap-20 lg:px-20 lg:pt-[100px] lg:pb-10">
        {/* Top section */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2 flex flex-col gap-8">
            {/* Brand name */}
            <div className="flex items-center gap-2">
              <span className="text-[22px] font-black text-white">Zeeks Comics and Games</span>
            </div>

            {/* Newsletter */}
            <div className="flex max-w-[400px] flex-col gap-3">
              <h5 className="text-lg font-bold text-white">The Insider List</h5>
              <p className="text-sm leading-relaxed text-white/50">
                New releases, exclusive deals, and hobby tips delivered to your inbox.
              </p>
              <div className="flex h-[49px] w-full">
                <div className="flex flex-1 items-center rounded-l-lg bg-[#F5F5F8]">
                  <Input
                    placeholder="Your email address"
                    className="h-full border-0 rounded-r-none text-sm"
                  />
                </div>
                <Button variant="tertiary" size="lg" className="h-full w-[79px] shrink-0 rounded-l-none rounded-r-lg text-sm font-bold">
                  Join
                </Button>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 text-sm font-semibold text-white">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/40 md:flex-row">
          <p>© 2026 Zeeks. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {/* Social icons */}
            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map((social) => (
                <Link
                  key={social}
                  href="#"
                  className="flex h-5 w-5 items-center justify-center opacity-60 transition-opacity hover:opacity-100"
                  aria-label={social}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </Link>
              ))}
            </div>
            <Link href="#" className="transition-colors hover:text-white/60">
              Privacy Policy
            </Link>
            <Link href="#" className="transition-colors hover:text-white/60">
              Terms of Service
            </Link>
            <Link href="#" className="transition-colors hover:text-white/60">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
