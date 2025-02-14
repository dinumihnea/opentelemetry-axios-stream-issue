// Comment and uncomment the `require("./instrumentation");` line to observe that
// the stream from `reqAxiosStreamWithSingleChunk` function behaves differently when the request is intercepted by the instrumentation-http
require("./instrumentation");

const axios = require("axios");
const fs = require("fs");

async function reqAxiosStreamWithSingleChunk() {
  const response = await axios.request({
    url: "https://www.githubstatus.com/api/v2/status.json", // <==== this streams the response in a single chunk
    responseType: "stream",
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });
  // ❌ ISSUE appears here
  // the file is empty when telemetry is enabled, but present when disabled
  // somehow http interceptor from ./instrumentation.js prevents the stream to be piped further
  // the issue replicates as well if I use the stream directly `response.on('data', ...);response.on('end', ...);`
  const fileStream = fs.createWriteStream("./single-chunk-output.json");
  response.data.pipe(fileStream);

  return new Promise((resolve, reject) => {
    fileStream.on("finish", () => {
      resolve();
    });
    fileStream.on("error", e => {
      reject(e);
    });
  });
}

async function reqAxiosStreamMultipleChunks() {
  const response = await axios.request({
    url: "https://api.github.com/meta", // <==== this streams the response in multiple chunks
    responseType: "stream",
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  // ✅ When server streams in multiple chunks everything is fine, observe the file is correctly populated with telemetry on and off
  const fileStream = fs.createWriteStream("./multiple-chunks-output.json");
  response.data.pipe(fileStream);

  return new Promise((resolve, reject) => {
    fileStream.on("finish", () => {
      resolve();
    });
    fileStream.on("error", e => {
      reject(e);
    });
  });
}

(async () => {
  await reqAxiosStreamMultipleChunks();
  await reqAxiosStreamWithSingleChunk();
})()
  .then(() => console.log("done ✅"))
  .catch(console.error);
