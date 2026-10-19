const form = document.querySelector("#connection-form");
const status = document.querySelector("#status");
const messageLog = document.querySelector("#message-log");
const clearLogButton = document.querySelector("#clear-log");

let socket;
let sessionId = "";

function setStatus(text) {
  status.textContent = text;
}

function logMessage(direction, message) {
  const formattedMessage = typeof message === "string" ? message : JSON.stringify(message, null, 2);
  messageLog.textContent += `[${new Date().toLocaleTimeString()}] ${direction}\n${formattedMessage}\n\n`;
  messageLog.scrollTop = messageLog.scrollHeight;
}

function send(body, requestId) {
  const message = { requestId, sessionId, module: "CORE", body };
  socket.send(JSON.stringify(message));
  logMessage("SENT", message);
}

async function requestToken(username, password) {
  const response = await fetch("/api/authn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const token = response.headers.get("vuu-auth-token");
  if (!response.ok || !token) throw new Error(`Authentication failed (${response.status}).`);
  return token;
}

function subscribeToStudents() {
  send({ type: "GET_TABLE_LIST" }, "table-list");
  send({ type: "GET_TABLE_META", table: { module: "SCHOOL", table: "enrolledStudents" } }, "table-meta");
  send({
    type: "CREATE_VP",
    table: { module: "SCHOOL", table: "enrolledStudents" },
    range: { from: 0, to: 100 },
    columns: ["id", "name", "phoneNumber", "age"],
    sort: { sortDefs: [] },
    filterSpec: { filter: "" },
    groupBy: [],
    aggregations: []
  }, "students-viewport");
}

function handleServerMessage(event) {
  logMessage("RECEIVED", event.data);
  const message = JSON.parse(event.data);
  if (message.body?.type !== "LOGIN_SUCCESS") return;
  sessionId = message.sessionId;
  setStatus(`Connected. Session: ${sessionId}`);
  subscribeToStudents();
}

async function connect(event) {
  event.preventDefault();
  socket?.close();
  sessionId = "";
  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password").value;
  try {
    setStatus("Authenticating…");
    const token = await requestToken(username, password);
    socket = new WebSocket("wss://localhost:8091/websocket");
    socket.onopen = () => {
      setStatus("WebSocket open. Logging in…");
      send({ type: "LOGIN", token }, "login");
    };
    socket.onmessage = handleServerMessage;
    socket.onerror = () => setStatus("WebSocket error. Confirm that the Vuu server is running.");
    socket.onclose = () => setStatus("Disconnected");
  } catch (error) {
    setStatus(error.message);
  }
}

form.addEventListener("submit", connect);
clearLogButton.addEventListener("click", () => { messageLog.textContent = ""; });
