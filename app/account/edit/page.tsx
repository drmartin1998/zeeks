import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { headers } from "next/headers";
import { NavBarServer } from "@/components/nav-bar-server";
import { Footer } from "@/components/footer";
import { EditProfileForm } from "./edit-profile-form";

export const dynamic = "force-dynamic";

async function fetchProfile(baseUrl: string) {
  try {
    const res = await fetch(`${baseUrl}/api/account/profile`, {
      headers: {
        cookie: (await headers()).get("cookie") ?? "",
      },
    });

    if (!res.ok) {
      return { error: true, message: "Unable to load profile" };
    }

    return await res.json();
  } catch {
    return { error: true, message: "Unable to load profile" };
  }
}

export default async function EditProfilePage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const headersList = await headers();
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const host = headersList.get("host") ?? "localhost:3000";
  const baseUrl = `${proto}://${host}`;

  const data = await fetchProfile(baseUrl);

  if (data.error) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden">
        <NavBarServer />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-[1440px] px-20 py-16 text-center">
            <h1 className="font-heading text-2xl font-semibold mb-4">
              Unable to load profile
            </h1>
            <p className="text-muted-foreground mb-6">
              {data.message}. Please try refreshing the page.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <NavBarServer />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-[1440px] px-20 py-12">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1 text-sm">
              <li>
                <Link href="/account" className="text-[#9090A8] hover:text-[#7B4FA2] transition-colors">
                  Account
                </Link>
              </li>
              <li aria-hidden="true" className="text-[#9090A8] select-none">/</li>
              <li className="font-medium text-[#7B4FA2]">Edit Profile</li>
            </ol>
          </nav>

          <div className="mb-8">
            <h1 className="font-heading text-[36px] font-black leading-tight text-[#0E0E2C]">
              Edit Profile
            </h1>
            <p className="font-ui text-[15px] text-[#9090A8] mt-2">
              Update your personal details, shipping address, and password.
            </p>
          </div>

          <EditProfileForm profileData={data} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
