#!/usr/bin/env node
/**
 * CRX3 packer for KuraCode self-hosted distribution.
 *
 * Produces a signed CRX3 file (the format Chrome ≥ 85 loads outside the
 * Web Store). Signature is RSA-SHA256 over serialized SignedData
 * (crx_id + version) concatenated with the ZIP archive, per Chromium
 * crx_file.cc.
 *
 * NOTE: a CRX is only needed for self-hosted distribution. The official
 * publish path is .zip (Chrome Web Store / Edge) and .xpi (Firefox AMO).
 * See docs/agent/RELEASE.md for the update-channel design.
 */
import {
  createHash,
  createSign,
  createVerify,
  generateKeyPairSync,
  createPrivateKey,
  createPublicKey,
} from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import os from "node:os";

// ---- minimal protobuf (length-delimited / varint) ----
function varint(n) {
  const out = [];
  while (n >= 0x80) {
    out.push((n & 0x7f) | 0x80);
    n = Math.floor(n / 128);
  }
  out.push(n);
  return Buffer.from(out);
}
function lenDelimited(field, bytes) {
  const tag = (field << 3) | 2;
  return Buffer.concat([varint(tag), varint(bytes.length), Buffer.from(bytes)]);
}
function encodeAsymmetricKeyProof(publicKeyDer, signature) {
  return Buffer.concat([
    lenDelimited(1, publicKeyDer),
    lenDelimited(2, signature),
  ]);
}
function encodeSignedData(crxIdHex, version) {
  return Buffer.concat([
    lenDelimited(1, Buffer.from(crxIdHex, "ascii")),
    lenDelimited(2, Buffer.from(version, "ascii")),
  ]);
}
function encodeCrxFileHeader(proofBytes) {
  return lenDelimited(2, proofBytes);
}

function crxIdFromPublicKey(publicKeyDer) {
  return createHash("sha256").update(publicKeyDer).digest("hex").slice(0, 32);
}

function zipDir(dir) {
  const tmpZip = path.join(os.tmpdir(), `kuracode-${Date.now()}.zip`);
  execFileSync("zip", ["-r", tmpZip, "."], { cwd: dir, stdio: "ignore" });
  const archive = readFileSync(tmpZip);
  rmSync(tmpZip, { force: true });
  return archive;
}

/** Load or create an RSA key pair. Returns { pubDer, privDer, pemPath }. */
export async function loadOrCreateKey(keyPath) {
  if (keyPath && existsSync(keyPath)) {
    const pem = await readFile(keyPath, "utf8");
    const keyObj = createPrivateKey(pem);
    const privDer = keyObj.export({ type: "pkcs8", format: "der" });
    const pubDer = createPublicKey(keyObj).export({
      type: "spki",
      format: "der",
    });
    return { pubDer, privDer, pemPath: keyPath };
  }
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const pubDer = publicKey.export({ type: "spki", format: "der" });
  const privDer = privateKey.export({ type: "pkcs8", format: "der" });
  if (keyPath) {
    await mkdir(path.dirname(keyPath), { recursive: true });
    await writeFile(
      keyPath,
      privateKey.export({ type: "pkcs8", format: "pem" }),
      {
        mode: 0o600,
      },
    );
    await writeFile(
      keyPath + ".pub",
      publicKey.export({ type: "spki", format: "pem" }),
    );
  }
  return { pubDer, privDer, pemPath: keyPath };
}

/** Build a signed CRX3 from a build directory. */
export async function buildCrx3({ dir, keyPath, version }) {
  if (!existsSync(dir)) throw new Error(`CRX source dir missing: ${dir}`);
  const archive = zipDir(dir);
  const { pubDer, privDer } = await loadOrCreateKey(keyPath);
  const id = crxIdFromPublicKey(pubDer);
  const signedData = encodeSignedData(id, version);
  const signable = Buffer.concat([signedData, archive]);
  const privateKey = createPrivateKey({
    key: privDer,
    format: "der",
    type: "pkcs8",
  });
  const sign = createSign("RSA-SHA256");
  sign.update(signable);
  sign.end();
  const signature = sign.sign({ key: privateKey, padding: 1 });
  const proof = encodeAsymmetricKeyProof(pubDer, signature);
  const header = encodeCrxFileHeader(proof);
  const magic = Buffer.from("Cr24", "ascii");
  const ver = Buffer.alloc(4);
  ver.writeUInt32LE(3, 0);
  const hdrSize = Buffer.alloc(4);
  hdrSize.writeUInt32LE(header.length, 0);
  const crx = Buffer.concat([magic, ver, hdrSize, header, archive]);
  return { crx, id };
}

/** Verify a CRX3 signature given the expected version. */
export function verifyCrx3(crxBuffer, expectVersion) {
  const magic = crxBuffer.subarray(0, 4).toString("ascii");
  if (magic !== "Cr24") return { ok: false, reason: "bad magic" };
  const version = crxBuffer.readUInt32LE(4);
  if (version !== 3) return { ok: false, reason: `bad version ${version}` };
  const headerSize = crxBuffer.readUInt32LE(8);
  const header = crxBuffer.subarray(12, 12 + headerSize);
  const archive = crxBuffer.subarray(12 + headerSize);

  const parseLenField = (buf, start) => {
    let p = start;
    let tag = 0;
    let shift = 0;
    let b;
    do {
      b = buf[p++];
      tag |= (b & 0x7f) << shift;
      shift += 7;
    } while (b & 0x80);
    let len = 0;
    shift = 0;
    do {
      b = buf[p++];
      len |= (b & 0x7f) << shift;
      shift += 7;
    } while (b & 0x80);
    return { field: tag >> 3, start: p, value: buf.subarray(p, p + len) };
  };

  const outer = parseLenField(header, 0);
  if (outer.field !== 2)
    return { ok: false, reason: `header field ${outer.field}` };
  const first = parseLenField(header, outer.start);
  let pubDer = null;
  let signature = null;
  if (first.field === 1) pubDer = first.value;
  const second = parseLenField(header, first.start + first.value.length);
  if (second.field === 2) signature = second.value;
  if (!pubDer || !signature) return { ok: false, reason: "missing key/sig" };

  const id = crxIdFromPublicKey(pubDer);
  if (!expectVersion)
    return { ok: true, id, headerSize, signatureVerified: null };

  const signedData = encodeSignedData(id, expectVersion);
  const signable = Buffer.concat([signedData, archive]);
  const publicKey = createPublicKey({
    key: pubDer,
    format: "der",
    type: "spki",
  });
  const verify = createVerify("RSA-SHA256");
  verify.update(signable);
  verify.end();
  const ok = verify.verify({ key: publicKey, padding: 1 }, signature);
  return { ok, id, version: expectVersion, headerSize };
}

// CLI
if (
  process.argv[1] &&
  import.meta.url.endsWith(path.basename(process.argv[1]))
) {
  const [dir, keyPath, version] = process.argv.slice(2);
  if (!dir) {
    console.error(
      "usage: node scripts/crx3.mjs <buildDir> [keyPath] [version]",
    );
    process.exit(1);
  }
  const v = version || "0.1.0";
  const { crx, id } = await buildCrx3({ dir, keyPath, version: v });
  const out = path.join(process.cwd(), `kuracode-${v}.crx`);
  writeFileSync(out, crx);
  const check = verifyCrx3(crx, v);
  console.log(`✔ CRX3 written → ${out}`);
  console.log(`  extension id: ${id}`);
  console.log(
    `  signature verify: ${check.ok ? "PASS" : "FAIL (" + check.reason + ")"}`,
  );
}
