import { io, type ManagerOptions, type Socket, type SocketOptions } from "socket.io-client";

type SocketClientOptions = Partial<ManagerOptions & SocketOptions>;

export function getSocketUrl(apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api") {
  const rawUrl = apiUrl.trim();

  try {
    const url = new URL(rawUrl);
    url.pathname = url.pathname.replace(/\/api\/?$/, "") || "/";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return rawUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }
}

export function createSocket(token?: string | null, options: SocketClientOptions = {}): Socket {
  return io(getSocketUrl(), {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    withCredentials: true,
    ...options,
  });
}
