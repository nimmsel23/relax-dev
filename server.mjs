// The dedicated Relax HTTP service was retired. Relax routes are mounted in
// Coach's FastAPI process on :9150; this entrypoint intentionally binds no port.
console.error("Dedicated Relax API removed. Use the in-process Coach routes on :9150.");
process.exitCode = 1;
