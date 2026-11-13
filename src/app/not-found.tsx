import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E6E2D8] p-8 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#007749]/10 text-[#007749] flex items-center justify-center font-display text-2xl font-extrabold">
            404
          </div>
          <h1 className="font-display text-2xl font-extrabold text-[#0F172A] mb-2">
            Nobody pulled through here
          </h1>
          <p className="text-sm text-[#475569] mb-6 leading-relaxed">
            This event link doesn&apos;t exist or may have been mistyped. Check the link in your WhatsApp group or start a new event below.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-5 py-3 rounded-xl bg-[#007749] text-white font-semibold text-sm hover:bg-[#00633D] transition-colors tap-tactile"
            >
              Back to Home
            </Link>
            <Link
              href="/create"
              className="px-5 py-3 rounded-xl bg-[#FAF8F5] border border-[#E6E2D8] text-[#0F172A] font-semibold text-sm hover:bg-[#F1EDE4] transition-colors tap-tactile"
            >
              Create an Event
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
