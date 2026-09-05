const express = require("express");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 10000;

const quotes = new Map();

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";

  for (const word of words) {
    const test = line ? line + " " + word : word;

    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);

  return lines;
}

// Página principal
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GhossBot Quote API</title>
</head>
<body style="font-family:Arial;text-align:center;padding:40px">
<h1>GhossBot Quote API ✅</h1>
<p>La API está funcionando.</p>
<p>Endpoint: <b>GET /quote</b></p>
</body>
</html>
`);
});

// GENERAR QUOTE POR GET
app.get("/quote", async (req, res) => {

  try {

    const text = req.query.text;
    const username = req.query.username;
    const avatar = req.query.avatar;

    if (!text || !username || !avatar) {
      return res.status(400).json({
        success: false,
        error: "Faltan datos"
      });
    }

    // Crear imagen
    const canvas = createCanvas(1600, 900);
    const ctx = canvas.getContext("2d");

    // Fondo blanco
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1600, 900);

    // Barra negra superior
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, 1600, 90);

    // AVATAR
    try {

      const image = await loadImage(avatar);

      ctx.save();

      ctx.beginPath();
      ctx.arc(210, 450, 145, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Blanco y negro
      ctx.filter = "grayscale(100%)";

      ctx.drawImage(
        image,
        65,
        305,
        290,
        290
      );

      ctx.restore();

      // Borde
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = 6;

      ctx.beginPath();
      ctx.arc(210, 450, 145, 0, Math.PI * 2);
      ctx.stroke();

    } catch (error) {

      console.log(
        "Error cargando avatar:",
        error.message
      );

    }

    // TEXTO
    ctx.fillStyle = "#111111";

    ctx.font = "bold 56px Arial";

    const lines = wrapText(
      ctx,
      text,
      950
    ).slice(0, 9);

    let y = 230;

    for (const line of lines) {

      ctx.fillText(
        line,
        450,
        y
      );

      y += 70;
    }

    // Línea
    ctx.fillStyle = "#111111";

    ctx.fillRect(
      450,
      y + 20,
      950,
      4
    );

    // Nombre
    ctx.font = "bold 36px Arial";

    ctx.fillText(
      "— " + username,
      450,
      y + 90
    );

    // Marca
    ctx.font = "24px Arial";

    ctx.fillStyle = "#777777";

    ctx.fillText(
      "GhossBot • Quote",
      450,
      820
    );

    // PNG
    const buffer =
      canvas.toBuffer("image/png");

    // ID
    const id =
      crypto.randomBytes(12).toString("hex");

    quotes.set(id, buffer);

    // Borrar después de 10 minutos
    setTimeout(() => {

      quotes.delete(id);

    }, 10 * 60 * 1000);

    const baseUrl =
      `${req.protocol}://${req.get("host")}`;

    res.json({

      success: true,

      url:
        `${baseUrl}/quote/${id}.png`

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});

// MOSTRAR IMAGEN
app.get("/quote/:id.png", (req, res) => {

  const image =
    quotes.get(req.params.id);

  if (!image) {

    return res
      .status(404)
      .send("Imagen no encontrada");

  }

  res.setHeader(
    "Content-Type",
    "image/png"
  );

  res.send(image);

});

// SERVIDOR
app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `GhossBot Quote API funcionando en puerto ${PORT}`
    );

  }
);
