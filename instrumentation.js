const { IncomingMessage } = require("http");
const zlib = require("zlib");
const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");

function stringifyChunks(responseChunks) {
  return responseChunks.length > 1
    ? zlib.gunzipSync(Buffer.concat(responseChunks)).toString("utf8")
    : Buffer.concat(responseChunks).toString("utf8");
}

function responseHook(span, res) {
  if (!(res instanceof IncomingMessage)) return;

  const responseChunks = [];

  res.on("data", data => {
    responseChunks.push(data);
  });

  res.on("end", async () => {
    const body = stringifyChunks(responseChunks);
    span.setAttribute("http.response.body", body);
    // ❌ bug or feature ?
    // whenever the single chunked streamed response is intercepted and the result is missing from the app.js reqAxiosStreamWithSingleChunk()
    // it is still present and successfully collected here
    // observe the span `http.response.body` attribute
    console.log("debug span attributes", span.attributes);
  });
}

// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
const sdk = new NodeSDK({
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-http": {
        responseHook,
      },
    }),
  ],
});

sdk.start();
