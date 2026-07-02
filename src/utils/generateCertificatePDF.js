// ==========================================
// KNOWVA PROFESSIONAL CERTIFICATE GENERATOR
// Generates a beautiful PDF-quality certificate
// using Canvas API and downloads it as PNG.
// No external dependencies required.
// ==========================================

export const generateCertificatePDF = ({
  learnerName,
  skillName,
  teacherName,
  completionDate,
  certificateId,
}) => {
  return new Promise((resolve) => {
    const W = 1056; // A4 landscape at 96dpi
    const H = 748;

    const canvas = document.createElement("canvas");
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // ──────────────────────────────────────────
    // BACKGROUND GRADIENT
    // ──────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   "#0f172a");
    bg.addColorStop(0.5, "#1e3a5f");
    bg.addColorStop(1,   "#0f172a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ──────────────────────────────────────────
    // GOLD OUTER BORDER
    // ──────────────────────────────────────────
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth   = 6;
    roundRect(ctx, 24, 24, W - 48, H - 48, 16, false, true);

    // ──────────────────────────────────────────
    // INNER BORDER (thinner)
    // ──────────────────────────────────────────
    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth   = 1.5;
    roundRect(ctx, 40, 40, W - 80, H - 80, 12, false, true);

    // ──────────────────────────────────────────
    // CORNER ORNAMENTS
    // ──────────────────────────────────────────
    drawCornerOrnaments(ctx, W, H);

    // ──────────────────────────────────────────
    // TOP GOLD BANNER STRIPE
    // ──────────────────────────────────────────
    const banner = ctx.createLinearGradient(0, 70, W, 120);
    banner.addColorStop(0,   "transparent");
    banner.addColorStop(0.2, "rgba(212,175,55,0.15)");
    banner.addColorStop(0.8, "rgba(212,175,55,0.15)");
    banner.addColorStop(1,   "transparent");
    ctx.fillStyle = banner;
    ctx.fillRect(0, 72, W, 48);

    // ──────────────────────────────────────────
    // KNOWVA LOGO AREA
    // ──────────────────────────────────────────
    // Hexagon icon
    drawHexLogo(ctx, W / 2, 100);

    // KNOWVA wordmark
    ctx.fillStyle   = "#d4af37";
    ctx.font        = "bold 22px Georgia, serif";
    ctx.textAlign   = "center";
    ctx.letterSpacing = "0.3em";
    ctx.fillText("KNOWVA", W / 2, 148);

    // ──────────────────────────────────────────
    // DIVIDER LINE
    // ──────────────────────────────────────────
    drawGoldDivider(ctx, W / 2, 165, 220);

    // ──────────────────────────────────────────
    // CERTIFICATE TITLE
    // ──────────────────────────────────────────
    ctx.fillStyle = "#f8fafc";
    ctx.font      = "bold 13px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("CERTIFICATE OF SKILL COMPLETION", W / 2, 198);

    // ──────────────────────────────────────────
    // "This certifies that"
    // ──────────────────────────────────────────
    ctx.fillStyle = "rgba(248,250,252,0.6)";
    ctx.font      = "italic 15px Georgia, serif";
    ctx.fillText("This certifies that", W / 2, 240);

    // ──────────────────────────────────────────
    // LEARNER NAME — hero element
    // ──────────────────────────────────────────
    ctx.fillStyle = "#d4af37";
    ctx.font      = `bold ${nameSize(learnerName)}px Georgia, serif`;
    ctx.fillText(learnerName, W / 2, 298);

    // Underline beneath name
    const nameW = ctx.measureText(learnerName).width;
    ctx.strokeStyle = "rgba(212,175,55,0.5)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - nameW / 2, 308);
    ctx.lineTo(W / 2 + nameW / 2, 308);
    ctx.stroke();

    // ──────────────────────────────────────────
    // "has successfully completed"
    // ──────────────────────────────────────────
    ctx.fillStyle = "rgba(248,250,252,0.6)";
    ctx.font      = "italic 15px Georgia, serif";
    ctx.fillText("has successfully completed", W / 2, 342);

    // ──────────────────────────────────────────
    // SKILL NAME
    // ──────────────────────────────────────────
    ctx.fillStyle = "#f8fafc";
    ctx.font      = `bold ${skillSize(skillName)}px Georgia, serif`;
    ctx.fillText(skillName, W / 2, 386);

    // ──────────────────────────────────────────
    // "under the guidance of"
    // ──────────────────────────────────────────
    ctx.fillStyle = "rgba(248,250,252,0.6)";
    ctx.font      = "italic 15px Georgia, serif";
    ctx.fillText("under the guidance of", W / 2, 422);

    // TEACHER NAME
    ctx.fillStyle = "#f8fafc";
    ctx.font      = "bold 20px Georgia, serif";
    ctx.fillText(teacherName || "Knowva Instructor", W / 2, 452);

    // ──────────────────────────────────────────
    // "through the Knowva Platform"
    // ──────────────────────────────────────────
    ctx.fillStyle = "rgba(248,250,252,0.5)";
    ctx.font      = "14px Georgia, serif";
    ctx.fillText("through the Knowva Platform", W / 2, 480);

    // ──────────────────────────────────────────
    // GOLD DIVIDER
    // ──────────────────────────────────────────
    drawGoldDivider(ctx, W / 2, 510, 340);

    // ──────────────────────────────────────────
    // BOTTOM ROW: Date | Signature | Cert ID
    // ──────────────────────────────────────────
    const colL = W / 2 - 280;
    const colC = W / 2;
    const colR = W / 2 + 280;
    const rowY = 565;

    // LEFT — Completion Date
    ctx.fillStyle = "rgba(248,250,252,0.5)";
    ctx.font      = "11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("COMPLETION DATE", colL, rowY - 22);

    ctx.fillStyle = "#d4af37";
    ctx.font      = "bold 14px Georgia, serif";
    ctx.fillText(completionDate, colL, rowY);

    // CENTER — Signature block
    ctx.fillStyle = "#d4af37";
    ctx.font      = "italic bold 22px Georgia, serif";
    ctx.fillText("Knowva", colC, rowY - 8);

    ctx.strokeStyle = "rgba(212,175,55,0.6)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(colC - 60, rowY + 4);
    ctx.lineTo(colC + 60, rowY + 4);
    ctx.stroke();

    ctx.fillStyle = "rgba(248,250,252,0.5)";
    ctx.font      = "11px Georgia, serif";
    ctx.fillText("AUTHORIZED SIGNATURE", colC, rowY + 18);

    // RIGHT — Certificate ID
    ctx.fillStyle = "rgba(248,250,252,0.5)";
    ctx.font      = "11px Georgia, serif";
    ctx.fillText("CERTIFICATE ID", colR, rowY - 22);

    ctx.fillStyle = "#94a3b8";
    ctx.font      = "bold 11px 'Courier New', monospace";
    ctx.fillText(certificateId, colR, rowY);

    // ──────────────────────────────────────────
    // WATERMARK TEXT (very subtle)
    // ──────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle   = "#ffffff";
    ctx.font        = "bold 120px Georgia, serif";
    ctx.textAlign   = "center";
    ctx.translate(W / 2, H / 2 + 20);
    ctx.rotate(-Math.PI / 8);
    ctx.fillText("KNOWVA", 0, 0);
    ctx.restore();

    // ──────────────────────────────────────────
    // STAR DECORATIONS (subtle top-left / right)
    // ──────────────────────────────────────────
    drawStar(ctx,  80, 80,  8, "#d4af37", 0.4);
    drawStar(ctx, W - 80, 80,  8, "#d4af37", 0.4);
    drawStar(ctx,  80, H - 80, 8, "#d4af37", 0.4);
    drawStar(ctx, W - 80, H - 80, 8, "#d4af37", 0.4);

    // ──────────────────────────────────────────
    // DOWNLOAD
    // ──────────────────────────────────────────
    canvas.toBlob((blob) => {
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `Knowva_Certificate_${skillName.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      resolve(url);
    }, "image/png");
  });
};


// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawGoldDivider(ctx, cx, y, halfLen) {
  const grad = ctx.createLinearGradient(cx - halfLen, y, cx + halfLen, y);
  grad.addColorStop(0,   "transparent");
  grad.addColorStop(0.4, "rgba(212,175,55,0.8)");
  grad.addColorStop(0.6, "rgba(212,175,55,0.8)");
  grad.addColorStop(1,   "transparent");

  ctx.strokeStyle = grad;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(cx - halfLen, y);
  ctx.lineTo(cx + halfLen, y);
  ctx.stroke();

  // Diamond in center
  ctx.fillStyle = "#d4af37";
  ctx.save();
  ctx.translate(cx, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
}

function drawHexLogo(ctx, cx, cy) {
  const r = 22;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();

  const hexGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  hexGrad.addColorStop(0, "#d4af37");
  hexGrad.addColorStop(1, "#b8860b");
  ctx.fillStyle = hexGrad;
  ctx.fill();

  // "K" inside hex
  ctx.fillStyle = "#0f172a";
  ctx.font      = "bold 20px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("K", cx, cy + 7);
}

function drawCornerOrnaments(ctx, W, H) {
  const corners = [
    { x: 52,     y: 52,     r: 0 },
    { x: W - 52, y: 52,     r: Math.PI / 2 },
    { x: W - 52, y: H - 52, r: Math.PI },
    { x: 52,     y: H - 52, r: Math.PI * 1.5 },
  ];

  corners.forEach(({ x, y, r }) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r);
    ctx.strokeStyle = "rgba(212,175,55,0.7)";
    ctx.lineWidth   = 1.5;

    // L-bracket ornament
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();

    // Small dot
    ctx.fillStyle = "#d4af37";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

function drawStar(ctx, cx, cy, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outer = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const inner = outer + Math.PI / 5;
    const ox = cx + r * Math.cos(outer);
    const oy = cy + r * Math.sin(outer);
    const ix = cx + (r * 0.4) * Math.cos(inner);
    const iy = cy + (r * 0.4) * Math.sin(inner);
    i === 0 ? ctx.moveTo(ox, oy) : ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function nameSize(name) {
  if (!name) return 36;
  if (name.length < 15) return 42;
  if (name.length < 25) return 36;
  return 28;
}

function skillSize(skill) {
  if (!skill) return 28;
  if (skill.length < 20) return 30;
  if (skill.length < 35) return 24;
  return 20;
}
