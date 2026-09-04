const express = require("express");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

function wrapText(ctx, text, maxWidth, maxLines = 8) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);

  if (words.length > 0 && lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + "…").width > maxWidth && last.length > 1) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = last + "…";
  }
  return lines;
}

app.get("/", (_req, res) => {
  res.send("GhossBot Quote API funcionando ✅");
});

app.post("/quote", async (req, res) => {
  try {
    const { text, username, avatar } = req.body;

    if (!text || !username || !avatar) {
      return res.status(400).json({
        error: "Faltan datos. Se requiere text, username y avatar."
      });
    }

    const width = 1600;
    const padding = 110;
    const avatarSize = 250;

    const canvas = createCanvas(width, 900);
    const ctx = canvas.getContext("2d");

    // Fondo blanco
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, 900);

    // Línea/acento superior
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, width, 14);

    // Texto principal
    ctx.fillStyle = "#111111";
    ctx.font = "bold 64px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const textMaxWidth = width - padding * 2 - 40;
    const lines = wrapText(ctx, text, textMaxWidth, 7);
    const lineHeight = 82;
    const totalTextHeight = lines.length * lineHeight;

    let y = 130;
    for (const line of lines) {
      ctx.fillText(`“${line}${line === lines[lines.length - 1] ? "”" : ""}`, padding, y);
      y += lineHeight;
    }

    // Separador
    const separatorY = Math.max(620, y + 35);
    ctx.fillStyle = "#d8d8d8";
    ctx.fillRect(padding, separatorY, width - padding * 2, 2);

    // Avatar circular y blanco/negro
    const avatarX = padding;
    const avatarY = separatorY + 55;

    const image = await loadImage(avatar);
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.clip();

    // Escala de grises usando filtro Canvas
    ctx.filter = "grayscale(100%)";
    ctx.drawImage(image, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Borde del avatar
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // Nombre
    ctx.fillStyle = "#111111";
    ctx.font = "bold 48px Arial";
    ctx.fillText(username, avatarX + avatarSize + 45, avatarY + 55);

    ctx.fillStyle = "#777777";
    ctx.font = "30px Arial";
    ctx.fillText("GhossBot • Quote", avatarX + avatarSize + 45, avatarY + 120);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.send(canvas.toBuffer("image/png"));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "No se pudo generar la quote."
    });
  }
});

app.listen(PORT, () => {
  console.log(`GhossBot Quote API escuchando en el puerto ${PORT}`);
});
