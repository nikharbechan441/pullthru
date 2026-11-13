import { NextRequest, NextResponse } from "next/server";
import { enforceSameOrigin, enforceRateLimit } from "@/lib/security";
import {
  recordTelemetryError,
  listTelemetryErrors,
  listFunnelTelemetry,
} from "@/lib/store";
import { TelemetryErrorType } from "@/lib/telemetry";

export async function POST(req: NextRequest) {
  const csrfError = enforceSameOrigin(req);
  if (csrfError) return csrfError;

  const rateLimitError = enforceRateLimit(req, "telemetry:post", 15, 60_000);
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json();
    const rawMessage = typeof body?.message === "string" ? body.message.trim() : "";
    if (!rawMessage) {
      return NextResponse.json(
        { error: "Telemetry message is required." },
        { status: 400 }
      );
    }

    const record = await recordTelemetryError({
      type: body?.type as TelemetryErrorType | undefined,
      message: rawMessage,
      stack: typeof body?.stack === "string" ? body.stack : null,
      route: typeof body?.route === "string" ? body.route : "/",
      clientPlatform:
        typeof body?.clientPlatform === "string" ? body.clientPlatform : null,
      viewport: typeof body?.viewport === "string" ? body.viewport : null,
      connectionType:
        typeof body?.connectionType === "string" ? body.connectionType : null,
      recentLogs: Array.isArray(body?.recentLogs) ? body.recentLogs : [],
      notes: typeof body?.notes === "string" ? body.notes : null,
    });

    return NextResponse.json(
      {
        ok: true,
        id: record.id,
        reference: record.reference,
        sanitizedMessage: record.message,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid telemetry payload." },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const rateLimitError = enforceRateLimit(req, "telemetry:get", 20, 60_000);
  if (rateLimitError) return rateLimitError;

  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get("limit") || 25);
  const safeLimit = Number.isFinite(limitParam) ? limitParam : 25;
  const [errors, funnel] = await Promise.all([
    listTelemetryErrors(safeLimit),
    listFunnelTelemetry(safeLimit * 2),
  ]);

  return NextResponse.json({
    ok: true,
    count: errors.length,
    errors,
    funnelCount: funnel.steps.length,
    funnelCountsByStep: funnel.countsByStep,
    funnelSteps: funnel.steps,
  });
}
