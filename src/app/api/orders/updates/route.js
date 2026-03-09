import { ordersEvents } from "@/lib/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  const encoder = new TextEncoder();
  let onUpdate;
  let onCreated;
  let keepalive;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));
      onUpdate = (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "updated", ...data })}\n\n`));
        } catch {}
      };
      onCreated = (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "created", ...data })}\n\n`));
        } catch {}
      };
      ordersEvents.on("update", onUpdate);
      ordersEvents.on("created", onCreated);
      keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {}
      }, 20000);
    },
    cancel() {
      ordersEvents.off("update", onUpdate);
      ordersEvents.off("created", onCreated);
      clearInterval(keepalive);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
