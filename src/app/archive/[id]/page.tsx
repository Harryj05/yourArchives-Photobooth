import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import ScrollablePage from "@/components/ScrollablePage";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("sessions")
      .select("title, event_date, created_at, photos (url)")
      .eq("id", parseInt(params.id, 10))
      .single();

    const title = data?.title ?? "Photo Strip";
    const photos = (data?.photos as { url: string }[] | undefined) ?? [];
    const ogImage = photos[0]?.url ?? "/icons/og.png";
    const date = data?.event_date ?? data?.created_at?.slice(0, 10) ?? "";
    return {
      title: `${title} — yourArchives`,
      description: date ? `Photo strip captured on ${date}.` : "A preserved memory in your archive.",
      robots: { index: false, follow: false },
      openGraph: {
        title: `${title} — yourArchives`,
        description: date ? `Photo strip captured on ${date}.` : "A preserved memory in your archive.",
        images: [ogImage],
        type: "article",
      },
    };
  } catch {
    return { title: "Strip — yourArchives" };
  }
}

interface Photo {
  id: number;
  url: string;
}

interface Session {
  id: number;
  layout: string;
  created_at: string;
}

async function getSession(id: string): Promise<{ session: Session; photos: Photo[] } | null> {
  const sessionId = parseInt(id, 10);
  if (isNaN(sessionId)) return null;

  try {
    const supabase = createSupabaseServerClient();

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, layout, created_at")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) return null;

    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("id, url")
      .eq("session_id", sessionId)
      .order("id", { ascending: true });

    if (photosError) return null;

    return { session: session as Session, photos: (photos ?? []) as Photo[] };
  } catch {
    return null;
  }
}

export default async function ArchivePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/login?redirect=/archive/${params.id}`);
  }

  const data = await getSession(params.id);

  if (!data) {
    notFound();
  }

  const { session, photos } = data;
  const date = new Date(session.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-24 px-6 bg-transparent">
      <ScrollablePage />
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="font-sans text-[13px] uppercase tracking-[0.3em] text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            ← Back to Home
          </Link>
          <h1 className="font-serif text-4xl font-bold text-zinc-900 tracking-tight mt-6">
            Session Archive
          </h1>
          <p className="font-sans text-[15px] text-zinc-500 mt-2">
            {date} &middot; {session.layout} &middot; {photos.length} photos
          </p>
          <div className="w-12 h-px bg-zinc-300 mt-6" />
        </div>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          <p className="font-sans text-sm text-zinc-400 italic">
            No photos found for this session.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                className="aspect-square relative overflow-hidden bg-zinc-100 border border-zinc-200/60"
              >
                <Image
                  src={photo.url}
                  alt={`Photo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
