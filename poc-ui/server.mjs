import { createReadStream, readFileSync } from "node:fs";
import { createServer, request } from "node:https";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const port = 8445;
const directory = fileURLToPath(new URL(".", import.meta.url));
const certificateDirectory = join(directory, "..", "example", "main", "src", "main", "resources", "certs");
const contentTypes = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript" };

function proxyAuthentication(clientRequest, clientResponse) {
  const upstreamRequest = request({ hostname: "localhost", port: 8444, path: "/api/authn", method: "POST", rejectUnauthorized: false, headers: { "content-type": "application/json", "content-length": clientRequest.headers["content-length"] ?? "0" } }, (upstreamResponse) => {
    const token = upstreamResponse.headers["vuu-auth-token"];
    if (token) clientResponse.setHeader("vuu-auth-token", token);
    clientResponse.writeHead(upstreamResponse.statusCode ?? 502);
    upstreamResponse.pipe(clientResponse);
  });
  upstreamRequest.on("error", (error) => {
    clientResponse.writeHead(502, { "content-type": "application/json" });
    clientResponse.end(JSON.stringify({ error: `Vuu authentication proxy failed: ${error.message}` }));
  });
  clientRequest.pipe(upstreamRequest);
}

function serveFile(url, response) {
  const requestedPath = url === "/" ? "index.html" : normalize(url).replace(/^[/\\]+/, "");
  const filePath = join(directory, requestedPath);
  if (!filePath.startsWith(directory)) return response.writeHead(403).end();
  try {
    response.writeHead(200, { "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream" });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
}

const server = createServer({ cert: readFileSync(join(certificateDirectory, "cert.pem")), key: readFileSync(join(certificateDirectory, "key.pem")) }, (request, response) => {
  if (request.method === "POST" && request.url === "/api/authn") return proxyAuthentication(request, response);
  serveFile(request.url ?? "/", response);
});

server.listen(port, "0.0.0.0", () => console.log(`PoC UI available at https://localhost:${port}/`));
