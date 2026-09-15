describe("Home route entry", () => {
  it("exports only the Home route component", async () => {
    const page = await import("../../app/page");
    expect(Object.keys(page)).toEqual(["default"]);
    expect(typeof page.default).toBe("function");
  });

  it("routes to the tested Home implementation", async () => {
    const page = await import("../../app/page");
    const home = await import("../../app/home");
    expect(page.default).toBe(home.default);
  });
});
