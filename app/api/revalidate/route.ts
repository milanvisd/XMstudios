import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { CONTENT_TAG, createSupabaseWithToken } from "@/lib/supabase";

/**
 * Called by the editor after a save/delete so ISR pages update immediately
 * instead of waiting for the 60s revalidation window.
 */
export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseWithToken(token);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    revalidateTag(CONTENT_TAG, "max");
    revalidatePath("/", "layout");

    return NextResponse.json({ revalidated: true });
  } catch {
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }
}
