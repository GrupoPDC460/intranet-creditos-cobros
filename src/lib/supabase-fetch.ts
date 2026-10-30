/**
 * fetch compartido por TODOS los clientes de Supabase del servidor.
 *
 * Por qué existe: de forma intermitente Supabase responde 401 con
 * { code: "PGRST303", message: "JWT issued at future" }. No es un error de la
 * app: el gateway de Supabase firma el token con su reloj y PostgREST lo
 * valida con el suyo; cuando los relojes se desfasan unos segundos, rechaza el
 * token. El rechazo ocurre ANTES de tocar la base, así que reintentar es
 * seguro incluso en escrituras.
 *
 * Antes solo la portada tenía un reintento corto (~1.5 s) y aun así caía a la
 * pantalla "Algo no cargó como esperábamos". Aquí el reintento cubre todas las
 * secciones y APIs, y espera lo suficiente para que el desfase pase.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Esperas entre intentos (ms). Total máx. ≈ 6.5 s antes de rendirse. */
const BACKOFF = [300, 700, 1500, 4000];

/** Errores de red / servidor que también vale la pena reintentar en lecturas. */
const TRANSIENT_STATUS = new Set([408, 429, 500, 502, 503, 504, 520, 522, 524]);

function isRetryableBody(body: BodyInit | null | undefined): boolean {
  // Un ReadableStream solo se puede enviar una vez; lo demás se puede reenviar.
  return !(typeof ReadableStream !== "undefined" && body instanceof ReadableStream);
}

async function isClockSkew(res: Response): Promise<boolean> {
  if (res.status !== 401) return false;
  try {
    const text = await res.clone().text();
    return text.includes("PGRST303");
  } catch {
    return false;
  }
}

export async function supabaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const opts: RequestInit = { ...init, cache: "no-store" };
  const method = (init?.method ?? "GET").toUpperCase();
  const idempotent = method === "GET" || method === "HEAD";
  const canResend = isRetryableBody(init?.body);

  for (let attempt = 0; ; attempt++) {
    const last = attempt >= BACKOFF.length;
    try {
      const res = await fetch(input, opts);
      if (!last && canResend) {
        if (await isClockSkew(res)) {
          console.warn(`[supabase] PGRST303 (desfase de reloj), reintento ${attempt + 1}`);
          await sleep(BACKOFF[attempt]);
          continue;
        }
        if (idempotent && TRANSIENT_STATUS.has(res.status)) {
          console.warn(`[supabase] HTTP ${res.status} transitorio, reintento ${attempt + 1}`);
          await sleep(BACKOFF[attempt]);
          continue;
        }
      }
      return res;
    } catch (err) {
      // Fallo de red: solo reintentamos lecturas para no duplicar escrituras.
      if (last || !idempotent || !canResend) throw err;
      console.warn(`[supabase] error de red, reintento ${attempt + 1}`);
      await sleep(BACKOFF[attempt]);
    }
  }
}
