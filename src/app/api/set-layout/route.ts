import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { layout } = body;

    console.log("Layout selected:", layout);

    // In a real application, you might save this to a database or session.
    // For now, we just return a success response.
    return NextResponse.json({ success: true, layout });
    
  } catch (error) {
    console.error("Error setting layout:", error);
    return NextResponse.json({ success: false, error: "Failed to set layout" }, { status: 500 });
  }
}
