// CÓPIA gerada por scripts/copiar-admin-site.py — NÃO edite aqui: altere em packages/nucleo/src/compartilhado/senhas.ts e copie de novo.
// Senha dos logins próprios do ecossistema hc (painel e apps): a
// autenticação é no banco, SEM Firebase Authentication, mas a senha nunca é
// gravada nem comparada em texto — só PBKDF2-HMAC-SHA256 com salt por
// usuário.
//
// PBKDF2 em TypeScript puro: o React Native (app) não tem crypto.subtle, e o
// resultado precisa ser idêntico nos dois lados. Onde crypto.subtle existe
// (navegador do painel, Node) ela é usada por ser muito mais rápida — mesmo
// algoritmo, mesmo resultado (conferido nos testes).
//
// Bytes aleatórios (salt, código do convite) são gerados por quem chama:
// painel/Node com crypto.getRandomValues, app com expo-crypto.

// Iterações do PBKDF2. Gravado junto do hash (senha_iteracoes) para poder
// subir no futuro sem invalidar senhas antigas.
export const ITERACOES_SENHA = 50000;
export const BYTES_SALT = 16;
export const BYTES_CONVITE = 16; // 1 byte por caractere (256 % 32 = 0, sem viés) → ~80 bits

// ── utilitários ──────────────────────────────────────────────────────────
export function utf8(texto: string): Uint8Array {
  const saida: number[] = [];
  for (let i = 0; i < texto.length; i++) {
    let c = texto.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < texto.length) {
      const d = texto.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) { c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00); i++; }
    }
    if (c < 0x80) saida.push(c);
    else if (c < 0x800) saida.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) saida.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else saida.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return new Uint8Array(saida);
}
export const paraHex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
export function deHex(h: string): Uint8Array {
  const b = new Uint8Array(h.length / 2);
  for (let i = 0; i < b.length; i++) b[i] = parseInt(h.substr(i * 2, 2), 16);
  return b;
}
// Comparação em tempo constante (não vaza pelo tempo quantos caracteres batem).
export function iguaisTempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

// ── SHA-256 / HMAC / PBKDF2 (puro) ───────────────────────────────────────
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
const W = new Uint32Array(64);

function blocos(h: Uint32Array, dados: Uint8Array) {
  for (let p = 0; p < dados.length; p += 64) {
    for (let i = 0; i < 16; i++) W[i] = (dados[p + 4 * i] << 24) | (dados[p + 4 * i + 1] << 16) | (dados[p + 4 * i + 2] << 8) | dados[p + 4 * i + 3];
    for (let i = 16; i < 64; i++) {
      const a = W[i - 15], b = W[i - 2];
      const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
      const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }
    let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const t1 = (hh + S1 + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
  }
}

export function sha256(msg: Uint8Array): Uint8Array {
  const tam = msg.length;
  const total = ((tam + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(total);
  buf.set(msg);
  buf[tam] = 0x80;
  const bits = tam * 8;
  buf[total - 4] = (bits >>> 24) & 255; buf[total - 3] = (bits >>> 16) & 255; buf[total - 2] = (bits >>> 8) & 255; buf[total - 1] = bits & 255;
  buf[total - 5] = Math.floor(bits / 2 ** 32) & 255;
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  blocos(h, buf);
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) { out[4 * i] = h[i] >>> 24; out[4 * i + 1] = (h[i] >>> 16) & 255; out[4 * i + 2] = (h[i] >>> 8) & 255; out[4 * i + 3] = h[i] & 255; }
  return out;
}

function hmacSha256(chave: Uint8Array, msg: Uint8Array): Uint8Array {
  let k = chave.length > 64 ? sha256(chave) : chave;
  const kp = new Uint8Array(64); kp.set(k);
  const ipad = new Uint8Array(64 + msg.length), opad = new Uint8Array(64 + 32);
  for (let i = 0; i < 64; i++) { ipad[i] = kp[i] ^ 0x36; opad[i] = kp[i] ^ 0x5c; }
  ipad.set(msg, 64);
  opad.set(sha256(ipad), 64);
  return sha256(opad);
}

export function pbkdf2Sha256Puro(senha: Uint8Array, salt: Uint8Array, iteracoes: number, bytes = 32): Uint8Array {
  const saida = new Uint8Array(bytes);
  const blocosN = Math.ceil(bytes / 32);
  for (let bl = 1; bl <= blocosN; bl++) {
    const s = new Uint8Array(salt.length + 4); s.set(salt);
    s[salt.length] = bl >>> 24; s[salt.length + 1] = (bl >>> 16) & 255; s[salt.length + 2] = (bl >>> 8) & 255; s[salt.length + 3] = bl & 255;
    let u = hmacSha256(senha, s);
    const t = u.slice();
    for (let i = 1; i < iteracoes; i++) { u = hmacSha256(senha, u); for (let j = 0; j < 32; j++) t[j] ^= u[j]; }
    saida.set(t.subarray(0, Math.min(32, bytes - (bl - 1) * 32)), (bl - 1) * 32);
  }
  return saida;
}

export async function pbkdf2Sha256(senha: string, salt: Uint8Array, iteracoes: number, bytes = 32): Promise<Uint8Array> {
  const subtle = (globalThis as any).crypto?.subtle;
  const s = utf8(senha);
  if (subtle?.importKey && subtle?.deriveBits) {
    try {
      const chave = await subtle.importKey("raw", s, "PBKDF2", false, ["deriveBits"]);
      return new Uint8Array(await subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iteracoes }, chave, bytes * 8));
    } catch { /* cai no puro */ }
  }
  return pbkdf2Sha256Puro(s, salt, iteracoes, bytes);
}

// ── API usada pelos logins ───────────────────────────────────────────────
export type HashSenha = { senha_hash: string; senha_salt: string; senha_iteracoes: number };

export const normalizarEmail = (e: string) => (e || "").trim().toLowerCase();

// Regra mínima de senha (a mesma no primeiro acesso, no app e no painel).
// Usuários do painel: 6 + maiúscula, minúscula, número e símbolo (loginPainel.ts).
export const MINIMO_SENHA_PARCEIRO = 8;
export const MINIMO_SENHA_PLATAFORMA = 6;
export function problemaSenha(senha: string, minimo = MINIMO_SENHA_PARCEIRO): string | null {
  if ((senha || "").length < minimo) return `A senha precisa de pelo menos ${minimo} caracteres.`;
  if (!/[A-Za-z]/.test(senha) || !/\d/.test(senha)) return "Use letras e números na senha.";
  return null;
}

// Senha nova dos usuários (painel e app): mínimo
// MINIMO_SENHA_PLATAFORMA + maiúscula, minúscula, número e símbolo.
export function problemaSenhaUsuario(senha: string): string | null {
  const base = problemaSenha(senha, MINIMO_SENHA_PLATAFORMA);
  if (base) return base;
  if (!/[A-Z]/.test(senha) || !/[a-z]/.test(senha) || !/\d/.test(senha) || !/[^A-Za-z0-9]/.test(senha))
    return "A senha precisa ter letra maiúscula, minúscula, número e símbolo.";
  return null;
}

export async function gerarHashSenha(senha: string, saltBytes: Uint8Array, iteracoes = ITERACOES_SENHA): Promise<HashSenha> {
  const h = await pbkdf2Sha256(senha, saltBytes, iteracoes);
  return { senha_hash: paraHex(h), senha_salt: paraHex(saltBytes), senha_iteracoes: iteracoes };
}

export async function conferirSenha(senha: string, gravado: Partial<HashSenha> | null | undefined): Promise<boolean> {
  if (!gravado?.senha_hash || !gravado.senha_salt) return false;
  const h = await pbkdf2Sha256(senha, deHex(gravado.senha_salt), gravado.senha_iteracoes || ITERACOES_SENHA);
  return iguaisTempoConstante(paraHex(h), gravado.senha_hash);
}

// Código do convite / redefinição: legível para digitar (sem 0/O, 1/I),
// ex.: "K7QM-2XPA-R9TD-4HWB". Guardado só como SHA-256 (tem entropia alta,
// não precisa de salt); o código em si só aparece uma vez, para enviar.
const ALFABETO_CONVITE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function gerarCodigoConvite(bytes: Uint8Array): string {
  if (bytes.length < 16) throw new Error("Código de convite precisa de 16 bytes aleatórios.");
  let s = "";
  for (let i = 0; i < 16; i++) s += ALFABETO_CONVITE[bytes[i] % 32];
  return s.match(/.{1,4}/g)!.join("-");
}
export const normalizarCodigoConvite = (c: string) => (c || "").replace(/[\s-]/g, "").toUpperCase();
export const hashCodigoConvite = (codigo: string) => paraHex(sha256(utf8(normalizarCodigoConvite(codigo))));

// Campos que nunca podem ir para auditoria, log ou tela.
export const CAMPOS_SENSIVEIS = ["senha", "senha_hash", "senha_salt", "senha_iteracoes", "convite_token_hash", "senha_sip"] as const;
export const ehCampoSensivel = (campo: string) => (CAMPOS_SENSIVEIS as readonly string[]).includes(campo);
