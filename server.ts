import { createServer } from "http";
import next from "next";
import { initIO } from "./src/lib/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  // Attach Socket.io to the HTTP server
  initIO(server);
  console.log("[Socket.io] Initialized on /api/socketio");

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
