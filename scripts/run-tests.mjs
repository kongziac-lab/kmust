// Boots the app, runs the dashboard integration tests against it, tears it down.
//
// The tests assert on server-rendered HTML, so they need a live server. Without
// this runner they fail with ECONNREFUSED unless someone remembered to start
// `npm run dev` first, which means CI can never run them.
//
// Defaults to build + start: Next 16 refuses a second `next dev` for the same
// directory, so a dev-based runner breaks whenever the user already has one
// open. `next dev` writes to .next/dev and `next build` to .next, so the
// production path coexists with a running dev server and tests what ships.
//
//   npm test                       next build + next start (default)
//   npm test -- --dev              reuse the dev pipeline (needs no dev server running)
//   DASHBOARD_URL=... npm test     test an already-running server, start nothing
//   TEST_PORT=3200 npm test        different port
import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(projectRoot, "node_modules", ".bin", "next");
const testFile = path.join(projectRoot, "tests", "dashboard-page.test.mjs");

// Default off 3000 so a dev server the user already has open keeps working.
const port = Number(process.env.TEST_PORT || 3100);
const externalUrl = process.env.DASHBOARD_URL;
const baseUrl = externalUrl || `http://127.0.0.1:${port}`;
const useDev = process.argv.includes("--dev");

let server = null;

function stopServer() {
  if (!server || server.killed) {
    return;
  }

  // Next spawns workers, so signal the whole detached process group.
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    server.kill("SIGTERM");
  }

  server = null;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}

function probe() {
  return new Promise((resolve) => {
    const request = http.get(baseUrl, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });

    request.on("error", () => resolve(false));
    request.setTimeout(2000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (server?.exitCode !== null && server?.exitCode !== undefined) {
      throw new Error(`server exited early with code ${server.exitCode}`);
    }

    if (await probe()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`server did not respond at ${baseUrl} within ${timeoutMs}ms`);
}

async function runTests() {
  console.log(`→ tests against ${baseUrl}\n`);
  process.env.DASHBOARD_URL = baseUrl;

  return run(process.execPath, ["--test", testFile]);
}

async function main() {
  // Someone pointed us at a server they manage; don't start or stop anything.
  if (externalUrl) {
    return runTests();
  }

  if (!useDev) {
    console.log("→ next build");
    const buildCode = await run(nextBin, ["build"]);

    if (buildCode !== 0) {
      return buildCode;
    }
  }

  const serverArgs = useDev ? ["dev", "-p", String(port)] : ["start", "-p", String(port)];
  console.log(`→ next ${serverArgs.join(" ")}`);

  server = spawn(nextBin, serverArgs, {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
    env: { ...process.env, PORT: String(port) },
  });

  // Buffer server noise; only surface it when something actually went wrong.
  let serverLog = "";
  server.stdout.on("data", (chunk) => {
    serverLog += chunk;
  });
  server.stderr.on("data", (chunk) => {
    serverLog += chunk;
  });

  try {
    await waitForServer(useDev ? 120_000 : 60_000);
  } catch (error) {
    console.error(`\n${error.message}`);
    console.error(serverLog.trim() || "(server produced no output)");
    return 1;
  }

  return runTests();
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopServer();
    process.exit(130);
  });
}

main()
  .then((code) => {
    stopServer();
    process.exit(code);
  })
  .catch((error) => {
    console.error(error);
    stopServer();
    process.exit(1);
  });
