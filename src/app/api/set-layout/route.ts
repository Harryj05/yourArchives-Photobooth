import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const ALLOWED_LAYOUTS = ["3-shots", "4-shots"] as const;
type AllowedLayout = (typeof ALLOWED_LAYOUTS)[number];

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("layouts")
      .select("name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Not finding rows is not a failure
      return NextResponse.json({ success: true, layout: null });
    }

    return NextResponse.json({ success: true, layout: data?.name ?? null });
  } catch (error) {
    console.error("Error reading layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to read layout" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json() as { layout?: unknown };
    const { layout } = body;

    if (!ALLOWED_LAYOUTS.includes(layout as AllowedLayout)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid layout. Must be one of: ${ALLOWED_LAYOUTS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("layouts")
      .insert({ name: layout as AllowedLayout, user_id: user.id });

    if (error) {
      console.error("Supabase layout insert error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to save layout" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, layout });
  } catch (error) {
    console.error("Error setting layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to set layout" },
      { status: 500 },
    );
  }
}
