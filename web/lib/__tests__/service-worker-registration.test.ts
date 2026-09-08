import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubGlobal("window", {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function browser() {
  const register = vi.fn().mockResolvedValue({});
  const getRegistration = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { serviceWorker: { getRegistration, register } });
  return { register, getRegistration };
}

describe("service worker registration", () => {
  it("registers once without the browser script cache, including concurrent intent", async () => {
    const { register, getRegistration } = browser();
    const { requestServiceWorkerCache: request } = await import("../service-worker-cache");
    await Promise.all([request(), request(), request()]);
    await request();
    expect(getRegistration).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledExactlyOnceWith("/sw.js", { updateViaCache: "none" });
  });

  it.each(["lookup", "register", "update"])("retries a failed %s only on the next explicit intent", async (stage) => {
    const { register, getRegistration } = browser();
    const update = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    if (stage === "lookup") getRegistration.mockRejectedValueOnce(new Error("lookup failed"));
    if (stage === "register") register.mockRejectedValueOnce(new Error("registration failed"));
    if (stage === "update") getRegistration.mockResolvedValue({ update });
    const { requestServiceWorkerCache: request } = await import("../service-worker-cache");
    await expect(request()).resolves.toBeUndefined();
    expect(getRegistration).toHaveBeenCalledTimes(1);
    await request();
    expect(getRegistration).toHaveBeenCalledTimes(2);
    if (stage === "update") {
      expect(update).toHaveBeenCalledTimes(2);
      expect(register).not.toHaveBeenCalled();
    } else expect(register).toHaveBeenCalledWith("/sw.js", { updateViaCache: "none" });
  });

  it("contains synchronous browser exceptions and permits a later retry", async () => {
    const { getRegistration, register } = browser();
    getRegistration.mockImplementationOnce(() => { throw new Error("storage denied"); });
    const { requestServiceWorkerCache: request } = await import("../service-worker-cache");
    await expect(request()).resolves.toBeUndefined();
    await request();
    expect(register).toHaveBeenCalledTimes(1);
  });

  it.each(["server", "development", "unsupported"])("does no work in %s context", async (context) => {
    const { getRegistration, register } = browser();
    if (context === "server") vi.stubGlobal("window", undefined);
    if (context === "development") vi.stubEnv("NODE_ENV", "development");
    if (context === "unsupported") vi.stubGlobal("navigator", {});
    const { requestServiceWorkerCache: request } = await import("../service-worker-cache");
    await request();
    expect(getRegistration).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  });
});
