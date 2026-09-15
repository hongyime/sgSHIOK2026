import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ReportComposer } from "/@fs/C:/sgSHIOK2026/web/components/report-composer.tsx";

const requests: { body: string; secret: string }[] = [];
// Synthetic transport only: real preparation, envelope, validation and response parsing.
window.fetch = async (url, init) => {
  if (url !== "/api/reports") throw Error("Unexpected fixture request");
  requests.push({ body: String(init?.body), secret: new Headers(init?.headers).get("x-shiok-retry-secret") ?? "" });
  if (requests.length === 1) throw Error("Synthetic disconnect after possible commit");
  return new Response(JSON.stringify({ ok: true, replayed: true, receipt: {
    receipt_id: "11111111-1111-4111-8111-111111111111", received_at: "2026-09-15T00:00:00.000Z",
  } }), { status: 200, headers: { "content-type": "application/json" } });
};
(window as any).fixture = { requests };
function Fixture() {
  const [closed, setClosed] = useState(false);
  return closed ? <h2>Closed</h2> : <ReportComposer geometry={{ type: "Point", coordinates: [103.85, 1.35] }}
    context={{ postal_code: "123456" }} bundleVersion="qa-synthetic-bundle" enabled
    onClose={() => setClosed(true)} onUnsavedChange={value => { (window as any).fixture.unsaved = value; }} />;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
