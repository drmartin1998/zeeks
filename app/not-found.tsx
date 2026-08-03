import { Footer } from "@/components/footer";
import { ErrorPage } from "@/components/error-page";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ErrorPage />
      <Footer />
    </div>
  );
}
