import dns from "dns/promises";
import tls from "tls";

/**
 * COGNITIVE EDGE CLINIC — DNS HEALTH & PROPAGATION INSPECTOR
 * 
 * Verifies DNS routing records, Netlify load balancer mappings,
 * and SSL/TLS certificate validity prior to production domain cutover.
 * 
 * Usage:
 *   npx ts-node scripts/verify-dns.ts [DOMAIN]
 *   DOMAIN=arunheim.com npm run verify:dns
 */

const NETLIFY_IPV4_LB = "75.2.60.5";
const NETLIFY_TARGET_HOST = "cognitive-wellness.netlify.app";

const APEX_DOMAIN = (
  process.argv[2] ||
  process.env.DOMAIN ||
  "arunheim.com"
).replace(/^https?:\/\//, "").replace(/\/$/, "");

const SUBDOMAINS_TO_CHECK = [
  `www.${APEX_DOMAIN}`,
  `vault.${APEX_DOMAIN}`,
  `portal.${APEX_DOMAIN}`,
];

interface DnsCheckResult {
  host: string;
  type: "A" | "CNAME";
  expected: string;
  actual: string[];
  status: "MATCH" | "PROPAGATING" | "UNRESOLVED";
}

interface TlsCertInfo {
  host: string;
  valid: boolean;
  subjectCn?: string;
  issuer?: string;
  validTo?: string;
  daysRemaining?: number;
  error?: string;
}

async function checkDnsA(host: string, expectedIp: string): Promise<DnsCheckResult> {
  try {
    const addresses = await dns.resolve4(host);
    const matches = addresses.includes(expectedIp);
    return {
      host,
      type: "A",
      expected: expectedIp,
      actual: addresses,
      status: matches ? "MATCH" : "PROPAGATING",
    };
  } catch {
    return {
      host,
      type: "A",
      expected: expectedIp,
      actual: [],
      status: "UNRESOLVED",
    };
  }
}

async function checkDnsCname(host: string, expectedTarget: string): Promise<DnsCheckResult> {
  try {
    const cnames = await dns.resolveCname(host);
    const normalizedExpected = expectedTarget.toLowerCase().replace(/\.$/, "");
    const matches = cnames.some(
      (c) => c.toLowerCase().replace(/\.$/, "") === normalizedExpected
    );
    return {
      host,
      type: "CNAME",
      expected: expectedTarget,
      actual: cnames,
      status: matches ? "MATCH" : "PROPAGATING",
    };
  } catch {
    return {
      host,
      type: "CNAME",
      expected: expectedTarget,
      actual: [],
      status: "UNRESOLVED",
    };
  }
}

async function checkTlsCertificate(host: string): Promise<TlsCertInfo> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host,
        port: 443,
        servername: host,
        timeout: 5000,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          if (!cert || Object.keys(cert).length === 0) {
            socket.destroy();
            return resolve({
              host,
              valid: false,
              error: "No certificate presented by host",
            });
          }

          const validTo = cert.valid_to;
          const expiryMs = new Date(validTo).getTime();
          const daysRemaining = Math.round((expiryMs - Date.now()) / (1000 * 60 * 60 * 24));
          const rawCn = cert.subject?.CN;
          const subjectCn = Array.isArray(rawCn) ? rawCn.join(", ") : rawCn;
          const rawIssuer = typeof cert.issuer === "object" ? cert.issuer.O || cert.issuer.CN : String(cert.issuer);
          const issuer = Array.isArray(rawIssuer) ? rawIssuer.join(", ") : (rawIssuer ? String(rawIssuer) : undefined);

          socket.destroy();
          resolve({
            host,
            valid: socket.authorized,
            subjectCn,
            issuer,
            validTo,
            daysRemaining,
          });
        } catch (err) {
          socket.destroy();
          resolve({
            host,
            valid: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    );

    socket.on("error", (err) => {
      resolve({
        host,
        valid: false,
        error: err.message,
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        host,
        valid: false,
        error: "Connection timeout after 5000ms",
      });
    });
  });
}

async function runDnsInspector() {
  console.log("\n" + "=".repeat(80));
  console.log(" COGNITIVE EDGE CLINIC — DNS HEALTH & TLS INSPECTOR");
  console.log("=".repeat(80));
  console.log(` Target Apex Domain:      ${APEX_DOMAIN}`);
  console.log(` Netlify Load Balancer:  ${NETLIFY_IPV4_LB}`);
  console.log(` Netlify CNAME Target:   ${NETLIFY_TARGET_HOST}`);
  console.log(` Inspection Timestamp:    ${new Date().toISOString()}`);
  console.log("-".repeat(80) + "\n");

  // 1. APEX DOMAIN RESOLUTION
  console.log("[1/3] Resolving Apex Domain A Records...");
  const apexResult = await checkDnsA(APEX_DOMAIN, NETLIFY_IPV4_LB);
  const apexIcon = apexResult.status === "MATCH" ? "✓" : "⚠";
  console.log(
    `  ${apexIcon} [A RECORD] ${APEX_DOMAIN} -> ${
      apexResult.actual.length > 0 ? apexResult.actual.join(", ") : "UNRESOLVED"
    } (Expected: ${apexResult.expected}) [${apexResult.status}]`
  );

  // 2. SUBDOMAINS RESOLUTION
  console.log("\n[2/3] Resolving Subdomain CNAME Records...");
  const subResults: DnsCheckResult[] = [];
  for (const sub of SUBDOMAINS_TO_CHECK) {
    const isPortal = sub.startsWith("portal.");
    const expectedTarget = isPortal ? "mycwXX.eclinicalworks.com" : NETLIFY_TARGET_HOST;
    const res = await checkDnsCname(sub, expectedTarget);
    subResults.push(res);
    const subIcon = res.status === "MATCH" ? "✓" : "⚠";
    console.log(
      `  ${subIcon} [CNAME]    ${sub.padEnd(28)} -> ${
        res.actual.length > 0 ? res.actual.join(", ") : "UNRESOLVED"
      } (Expected: ${res.expected}) [${res.status}]`
    );
  }

  // 3. TLS CERTIFICATE PROBE
  console.log("\n[3/3] Inspecting TLS/SSL Certificates...");
  // Check netlify host first (baseline verified TLS)
  const netlifyTls = await checkTlsCertificate(NETLIFY_TARGET_HOST);
  console.log(`  ✓ [TLS BASELINE] ${NETLIFY_TARGET_HOST}`);
  console.log(`      Issuer:         ${netlifyTls.issuer || "N/A"}`);
  console.log(`      Valid To:       ${netlifyTls.validTo || "N/A"} (${netlifyTls.daysRemaining} days remaining)`);
  console.log(`      Status:         ${netlifyTls.valid ? "VALID & TRUSTED" : "UNTRUSTED"}`);

  // Check custom apex domain TLS
  const customTls = await checkTlsCertificate(APEX_DOMAIN);
  if (customTls.valid) {
    console.log(`  ✓ [CUSTOM TLS]  ${APEX_DOMAIN}`);
    console.log(`      Issuer:         ${customTls.issuer}`);
    console.log(`      Valid To:       ${customTls.validTo} (${customTls.daysRemaining} days remaining)`);
  } else {
    console.log(`  ⚠ [CUSTOM TLS]  ${APEX_DOMAIN}: ${customTls.error || "Awaiting DNS cutover & Let's Encrypt issuance"}`);
  }

  // 4. SUMMARY MATRIX & ACTIONABLE INSTRUCTIONS
  console.log("\n" + "=".repeat(80));
  console.log(" DNS & ROUTING STATUS SUMMARY");
  console.log("=".repeat(80));
  console.log(
    `| Host                         | Type  | Expected                     | Status       |`
  );
  console.log(
    `|------------------------------|-------|------------------------------|--------------|`
  );
  console.log(
    `| ${apexResult.host.padEnd(28)} | A     | ${apexResult.expected.padEnd(28)} | ${apexResult.status.padEnd(12)} |`
  );
  for (const s of subResults) {
    console.log(
      `| ${s.host.padEnd(28)} | CNAME | ${s.expected.padEnd(28)} | ${s.status.padEnd(12)} |`
    );
  }
  console.log("=".repeat(80));

  if (apexResult.status !== "MATCH" || subResults.some((s) => s.status !== "MATCH")) {
    console.log("\n[REGISTRAR CONFIGURATION GUIDE]");
    console.log("To complete domain cutover, add the following DNS records at your registrar:");
    console.log("  1. APEX DOMAIN:");
    console.log(`     Type: A | Host: @ | Value: 75.2.60.5 | TTL: 300`);
    console.log("  2. SUBDOMAINS:");
    console.log(`     Type: CNAME | Host: www    | Value: ${NETLIFY_TARGET_HOST}. | TTL: 300`);
    console.log(`     Type: CNAME | Host: vault  | Value: ${NETLIFY_TARGET_HOST}. | TTL: 300`);
    console.log(`     Type: CNAME | Host: portal | Value: mycwXX.eclinicalworks.com. | TTL: 300`);
    console.log("\nOnce DNS propagates (5–30 minutes), Netlify will issue Let's Encrypt SSL automatically.\n");
  } else {
    console.log("\n[SUCCESS] Domain is fully routed and propagated to Netlify Edge.\n");
  }
}

runDnsInspector().catch((err) => {
  console.error("Fatal DNS inspector error:", err);
  process.exit(1);
});
