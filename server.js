const express = require("express");
const { createCanvas, loadImage } = require("@napi-rs/canvas");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 10000;

// Guardamos temporalmente las imágenes generadas
const quotes = new Map();


// ======================================================
// PÁGINA PRINCIPAL
// ======================================================

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GhossBot Quote</title>
    </head>
    <body style="
      background:#222;
      color:white;
      font-family:Arial,sans-serif;
      text-align:center;
      padding:40px;
    ">
      <h1>GhossBot Quote ✅</h1>
      <p>La API está funcionando correctamente.</p>
      <p>Endpoint: <b>GET /quote</b></p>
    </body>
    </html>
  `);
});


// ======================================================
// CREAR QUOTE
// ======================================================

app.get("/quote", async (req, res) => {

  try {

    const text = req.query.text || "";
    const nickname = req.query.nickname || "";
    const username = req.query.username || "";
    const avatar = req.query.avatar || "";

    if (!text || !nickname || !username || !avatar) {
      return res.status(400).json({
        error: "Faltan datos. Se requiere text, nickname, username y avatar."
      });
    }


    // ==================================================
    // DIMENSIONES
    // ==================================================

    const width = 1600;
    const height = 900;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");


    // ==================================================
    // FONDO
    // ==================================================

    ctx.fillStyle = "#8d8d8d";
    ctx.fillRect(0, 0, width, height);


    // ==================================================
    // DISCO DE VINILO
    // ==================================================

    const vinylX = 1290;
    const vinylY = 450;
    const vinylRadius = 410;

    // Sombra
    ctx.beginPath();
    ctx.arc(vinylX + 12, vinylY + 15, vinylRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();


    // Disco
    const vinylGradient = ctx.createRadialGradient(
      vinylX,
      vinylY,
      20,
      vinylX,
      vinylY,
      vinylRadius
    );

    vinylGradient.addColorStop(0, "#303030");
    vinylGradient.addColorStop(0.35, "#111111");
    vinylGradient.addColorStop(0.7, "#050505");
    vinylGradient.addColorStop(1, "#000000");

    ctx.beginPath();
    ctx.arc(vinylX, vinylY, vinylRadius, 0, Math.PI * 2);
    ctx.fillStyle = vinylGradient;
    ctx.fill();


    // Surcos del disco
    for (let r = 40; r < vinylRadius; r += 16) {

      ctx.beginPath();
      ctx.arc(vinylX, vinylY, r, 0, Math.PI * 2);

      ctx.strokeStyle = `rgba(255,255,255,${0.025 + (r % 32) / 3000})`;
      ctx.lineWidth = 2;

      ctx.stroke();
    }


    // Centro del disco
    ctx.beginPath();
    ctx.arc(vinylX, vinylY, 145, 0, Math.PI * 2);
    ctx.fillStyle = "#303030";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(vinylX, vinylY, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#999";
    ctx.fill();


    // ==================================================
    // HOJA
    // ==================================================

    const paperX = 70;
    const paperY = 80;
    const paperWidth = 1030;
    const paperHeight = 700;


    // Sombra
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(
      paperX + 15,
      paperY + 18,
      paperWidth,
      paperHeight
    );


    // Papel
    const paperGradient = ctx.createLinearGradient(
      0,
      paperY,
      0,
      paperY + paperHeight
    );

    paperGradient.addColorStop(0, "#ffffff");
    paperGradient.addColorStop(0.6, "#eeeeee");
    paperGradient.addColorStop(1, "#d2d2d2");

    ctx.fillStyle = paperGradient;

    ctx.fillRect(
      paperX,
      paperY,
      paperWidth,
      paperHeight
    );


    // Borde exterior
    ctx.strokeStyle = "#bdbdbd";
    ctx.lineWidth = 3;

    ctx.strokeRect(
      paperX,
      paperY,
      paperWidth,
      paperHeight
    );


    // ==================================================
    // NOMBRE / NICKNAME
    // ==================================================

    ctx.fillStyle = "#050505";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.font = '48px "DejaVu Sans", Arial, sans-serif';

    ctx.fillText(
      "—",
      paperX + 85,
      paperY + 75
    );

    // Limitar nickname
    let displayNickname = nickname;

    if (displayNickname.length > 22) {
      displayNickname = displayNickname.substring(0, 21) + "…";
    }

    ctx.font = '54px "DejaVu Sans", Arial, sans-serif';

    ctx.fillText(
      displayNickname,
      paperX + 145,
      paperY + 72
    );


    // ==================================================
    // @USERNAME
    // ==================================================

    ctx.font = '25px "DejaVu Sans", Arial, sans-serif';
    ctx.fillStyle = "#333333";

    ctx.fillText(
      "@" + username,
      paperX + 150,
      paperY + 112
    );


    // ==================================================
    // TEXTO DEL QUOTE
    // ==================================================

    const quoteAreaX = paperX + 75;
    const quoteAreaY = paperY + 170;
    const quoteAreaWidth = paperWidth - 150;
    const quoteAreaHeight = 400;


    // Función para dividir texto
    function wrapText(text, fontSize) {

      ctx.font = `bold ${fontSize}px "DejaVu Sans", Arial, sans-serif`;

      const words = text.split(/\s+/);
      const lines = [];

      let currentLine = "";

      for (const word of words) {

        const testLine = currentLine
          ? currentLine + " " + word
          : word;

        const testWidth = ctx.measureText(testLine).width;

        if (testWidth <= quoteAreaWidth) {
          currentLine = testLine;
        } else {

          if (currentLine) {
            lines.push(currentLine);
          }

          currentLine = word;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    }


    // ==================================================
    // TAMAÑO AUTOMÁTICO DEL TEXTO
    // ==================================================

    let fontSize = 90;
    let lines = [];

    while (fontSize >= 30) {

      lines = wrapText(text, fontSize);

      const lineHeight = fontSize * 1.25;
      const totalHeight = lines.length * lineHeight;

      if (
        totalHeight <= quoteAreaHeight &&
        lines.length <= 8
      ) {
        break;
      }

      fontSize -= 4;
    }


    // ==================================================
    // DIBUJAR TEXTO CENTRADO
    // ==================================================

    ctx.font =
      `bold ${fontSize}px "DejaVu Sans", Arial, sans-serif`;

    ctx.fillStyle = "#050505";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const lineHeight = fontSize * 1.25;

    const totalTextHeight =
      lines.length * lineHeight;

    let startY =
      quoteAreaY +
      (quoteAreaHeight - totalTextHeight) / 2 +
      lineHeight / 2;


    for (const line of lines) {

      ctx.fillText(
        line,
        quoteAreaX + quoteAreaWidth / 2,
        startY
      );

      startY += lineHeight;
    }


    // ==================================================
    // LÍNEA INFERIOR
    // ==================================================

    const lineY = paperY + paperHeight - 105;

    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
      paperX + 70,
      lineY
    );

    ctx.lineTo(
      paperX + paperWidth - 70,
      lineY
    );

    ctx.stroke();


    // ==================================================
    // GHOSSBOT - QUOTE
    // ==================================================

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.font =
      '28px "DejaVu Sans", Arial, sans-serif';

    ctx.fillStyle = "#111111";

    ctx.fillText(
      "GhossBot - Quote",
      paperX + 70,
      paperY + paperHeight - 58
    );


    // ==================================================
    // AVATAR
    // ==================================================

    try {

      const avatarImage = await loadImage(avatar);

      const avatarX = vinylX;
      const avatarY = vinylY;

      const avatarRadius = 205;

      // Aro blanco
      ctx.beginPath();

      ctx.arc(
        avatarX,
        avatarY,
        avatarRadius + 9,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = "#ffffff";
      ctx.fill();


      // Recortar avatar en círculo
      ctx.save();

      ctx.beginPath();

      ctx.arc(
        avatarX,
        avatarY,
        avatarRadius,
        0,
        Math.PI * 2
      );

      ctx.clip();


      // Mantener proporción tipo "cover"
      const imgWidth = avatarImage.width;
      const imgHeight = avatarImage.height;

      const scale = Math.max(
        (avatarRadius * 2) / imgWidth,
        (avatarRadius * 2) / imgHeight
      );

      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;

      const drawX =
        avatarX - drawWidth / 2;

      const drawY =
        avatarY - drawHeight / 2;


      // Imagen
      ctx.drawImage(
        avatarImage,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );


      // Convertir visualmente a blanco y negro
      const imageData = ctx.getImageData(
        avatarX - avatarRadius,
        avatarY - avatarRadius,
        avatarRadius * 2,
        avatarRadius * 2
      );

      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {

        const gray =
          0.299 * data[i] +
          0.587 * data[i + 1] +
          0.114 * data[i + 2];

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      ctx.putImageData(
        imageData,
        avatarX - avatarRadius,
        avatarY - avatarRadius
      );

      ctx.restore();


      // Aro blanco encima del avatar
      ctx.beginPath();

      ctx.arc(
        avatarX,
        avatarY,
        avatarRadius + 9,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 9;

      ctx.stroke();


    } catch (error) {

      console.log(
        "No se pudo cargar el avatar:",
        error.message
      );

      // Si falla el avatar, mostramos círculo
      ctx.beginPath();

      ctx.arc(
        vinylX,
        vinylY,
        205,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = "#444444";
      ctx.fill();

      ctx.beginPath();

      ctx.arc(
        vinylX,
        vinylY,
        214,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 9;

      ctx.stroke();
    }


    // ==================================================
    // GUARDAR IMAGEN
    // ==================================================

    const id = crypto.randomBytes(12).toString("hex");

    const buffer = canvas.toBuffer("image/png");

    quotes.set(id, {
      buffer: buffer,
      created: Date.now()
    });


    // URL pública
    const baseUrl =
      `${req.protocol}://${req.get("host")}`;

    const imageUrl =
      `${baseUrl}/quote/${id}.png`;


    // Respuesta
    res.json({
      success: true,
      url: imageUrl
    });


  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error generando el Quote.",
      details: error.message
    });

  }

});


// ======================================================
// MOSTRAR IMAGEN
// ======================================================

app.get("/quote/:id.png", (req, res) => {

  const quote = quotes.get(req.params.id);

  if (!quote) {
    return res.status(404).send("Quote no encontrado o expirado.");
  }

  res.setHeader(
    "Content-Type",
    "image/png"
  );

  res.setHeader(
    "Cache-Control",
    "public, max-age=600"
  );

  res.send(quote.buffer);
});


// ======================================================
// LIMPIAR IMÁGENES CADA 10 MINUTOS
// ======================================================

setInterval(() => {

  const now = Date.now();

  for (const [id, quote] of quotes) {

    if (now - quote.created > 10 * 60 * 1000) {
      quotes.delete(id);
    }

  }

}, 60 * 1000);


// ======================================================
// INICIAR SERVIDOR
// ======================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `GhossBot Quote API funcionando en puerto ${PORT}`
    );

  }
);
