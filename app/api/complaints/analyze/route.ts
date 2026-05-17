import { analyzeComplaint } from "@/lib/ai";
import type { AnalyzeComplaintRequest } from "@/types/complaint";

export async function POST(request: Request) {
  let payload: AnalyzeComplaintRequest;

  try {
    payload = (await request.json()) as AnalyzeComplaintRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = payload.text?.trim();
  if (!text) {
    return Response.json({ error: "Field `text` is required." }, { status: 400 });
  }

  const result = await analyzeComplaint({
    text,
    district: payload.district,
    addressText: payload.addressText
  });

  return Response.json(result, { status: 200 });
}
