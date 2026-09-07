/* ============================================
   PDF Service (stub)
   Generate a simple visa application PDF.
   In production use a library like pdf-lib.
   ============================================ */
export async function generateVisaPDF(app: any): Promise<Uint8Array> {
  // Minimal PDF (text). Replace with proper PDF lib.
  const content = `FlyTripVisa Application #${app.id}\nName: ${app.full_name}\nEmail: ${app.email}\nDestination: ${app.destination}`;
  return new TextEncoder().encode(content);
}
