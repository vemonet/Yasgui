// @ts-ignore
import init, { init_language_server, listen } from "qlue-ls?init";

// Ensure proper handling of the WebAssembly initialization
const initializeLanguageServer = async () => {
  try {
    await init();

    // Connection Worker <-> Language Server(WASM)
    const wasmInputStream = new TransformStream();
    const wasmOutputStream = new TransformStream();
    const wasmReader = wasmOutputStream.readable.getReader();
    const wasmWriter = wasmInputStream.writable.getWriter();

    // Initialize & start language server
    const server = init_language_server(wasmOutputStream.writable.getWriter());
    listen(server, wasmInputStream.readable.getReader());

    // Language Client -> Language Server
    self.onmessage = function (message) {
      // console.log(data);
      wasmWriter.write(JSON.stringify(message.data));
    };
    // Language Server -> Language Client
    (async () => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await wasmReader.read();
        if (done) break;
        // console.log(JSON.parse(value));
        self.postMessage(JSON.parse(value));
      }
    })();

    self.postMessage({ type: "ready" });
  } catch (error) {
    console.error("Failed to initialize language server:", error);
    self.postMessage({ type: "error", error: error instanceof Error ? error.message : String(error) });
  }
};

initializeLanguageServer();
export {};
