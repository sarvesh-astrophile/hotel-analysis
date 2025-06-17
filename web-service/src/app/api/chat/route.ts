"use server";
import { type NextRequest } from "next/server";
import { env } from "@/env";


export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query) {
    return new Response("Query parameter is missing", { status: 400 });
  }

  const backendUrl = `${env.NEXT_PUBLIC_BACKEND_URL}/ask?query=${encodeURIComponent(
    query
  )}`;

  try {
    const response = await fetch(backendUrl);

    if (!response.body) {
      return new Response("The backend did not provide a response body.", {
        status: 500,
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              if (buffer.length > 0) {
                controller.enqueue(buffer);
              }
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            
            // The last item in lines will be a partial line, so we keep it in the buffer
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (line.trim()) {
                const cleanedLine = line.replace(/^data: /, "").trim();
                if (cleanedLine) {
                  controller.enqueue(cleanedLine + "\n");
                }
              }
            }
          }
        } catch (error) {
          console.error("Error while reading stream from backend:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error fetching from backend:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
} 