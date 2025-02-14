### Open telemetry axios issue

This repo is a showcase of an existing issue within the `@opentelemetry/instrumentation-http` package.

The conditions to replicate the issue are very specific:

- `@opentelemetry/instrumentation-http responseHook` intercept the `response.on("data")` event
- axios `responseType` is `stream`
- the server provides the response in a single chunk

When these 3 conditions are met the single response chunk is missing.

## How to run
1. Clone the repo
2. Install dependencies
   ```bash
    npm i
    ```
3. Run app.js (by default OpenTelemetry with http instrumentation is enabled)
    ```bash
    node app.js
    ```
4. Observe the generated file `single-chunk-output.json` is empty 😱
5. Disable OpenTelemetry by commenting out the line with `require("./instrumentation")` from `app.json`
6. Run again `node app.js`
7. Observe the `single-chunk-output.json` content is present
