import { complaintEvents } from "@/lib/events";

export async function GET() {
  const encoder = new TextEncoder();
  let onUpdate;
  let keepalive;

  const stream = new ReadableStream({
    start(controller) {
      // Initial comment to establish stream
      controller.enqueue(encoder.encode(": connected\n\n"));

      onUpdate = (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Ignore enqueue errors (client disconnected)
        }
      };

      complaintEvents.on("update", onUpdate);

      // Heartbeat to keep the connection alive through proxies/CDNs
      keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch (e) {}
      }, 20000);
    },
    cancel() {
      complaintEvents.off("update", onUpdate);
      clearInterval(keepalive);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Disable Nginx/Cloudflare buffering
      "X-Accel-Buffering": "no",
    },
  });
}