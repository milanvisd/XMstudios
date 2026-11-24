import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-accent font-semibold mb-2">404</p>
      <h1 className="text-3xl font-bold mb-3">Page not found</h1>
      <p className="text-muted mb-8">
        That page doesn&apos;t exist — it may have been moved or removed.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back home
      </Link>
    </div>
  );
}
