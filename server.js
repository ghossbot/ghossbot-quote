const express = require("express");
const {
  createCanvas,
  loadImage,
  GlobalFonts
} = require("@napi-rs/canvas");

const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

const quotes = new Map();


// ========================================
// FUENTE DE EMOJIS
// ========================================

const emojiFont = path.join(
  __dirname,
  "fonts",
  "NotoEmoji-Regular.ttf"
);

try {
  const loaded = GlobalFonts.registerFromPath(
    emojiFont,
    "Noto Emoji"
  );

  console.log(
    loaded
      ? "Fuente Noto Emoji cargada correctamente."
      : "No se pudo cargar Noto Emoji."
  );

} catch (error) {

  console.log(
    "Error cargando Noto Emoji:",
    error.message
  );

}


// ========================================
// PAGINA PRINCIPAL
// ========================================

app.get("/", (req, res) => {

  res.send(`
    <!DOCTYPE html>

    <html lang="es">

    <head>
      <meta charset="UTF-8">

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      >

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

      <p>
        La API está funcionando correctamente.
      </p>

      <p>
        Endpoint: <b>GET /quote</b>
      </p>

    </body>

    </html>
  `);

});


// ========================================
// GENERAR QUOTE
// ========================================

app.get("/quote", async (req, res) => {

  try {

    const text =
      req.query.text || "";

    const nickname =
      req.query.nickname || "";

    const username =
      req.query.username || "";

    const avatar =
      req.query.avatar || "";


    if (
      !text ||
      !nickname ||
      !username ||
      !avatar
    ) {

      return res.status(400).json({
        error:
          "Faltan datos. Se requiere text, nickname, username y avatar."
      });

    }


    // ========================================
    // CANVAS
    // ========================================

    const width = 1600;
    const height = 900;

    const canvas =
      createCanvas(width, height);

    const ctx =
      canvas.getContext("2d");


    // ========================================
    // FONDO
    // ========================================

    ctx.fillStyle = "#8d8d8d";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );


    // ========================================
    // DISCO
    // ========================================

    const vinylX = 1290;
    const vinylY = 450;
    const vinylRadius = 410;


    // Sombra

    ctx.beginPath();

    ctx.arc(
      vinylX + 12,
      vinylY + 15,
      vinylRadius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(0,0,0,0.25)";

    ctx.fill();


    // Degradado

    const vinylGradient =
      ctx.createRadialGradient(
        vinylX,
        vinylY,
        20,
        vinylX,
        vinylY,
        vinylRadius
      );


    vinylGradient.addColorStop(
      0,
      "#303030"
    );

    vinylGradient.addColorStop(
      0.35,
      "#111111"
    );

    vinylGradient.addColorStop(
      0.7,
      "#050505"
    );

    vinylGradient.addColorStop(
      1,
      "#000000"
    );


    ctx.beginPath();

    ctx.arc(
      vinylX,
      vinylY,
      vinylRadius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      vinylGradient;

    ctx.fill();


    // Surcos del disco

    for (
      let r = 40;
      r < vinylRadius;
      r += 16
    ) {

      ctx.beginPath();

      ctx.arc(
        vinylX,
        vinylY,
        r,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        `rgba(255,255,255,${
          0.025 +
          (r % 32) / 3000
        })`;

      ctx.lineWidth = 2;

      ctx.stroke();

    }


    // Centro

    ctx.beginPath();

    ctx.arc(
      vinylX,
      vinylY,
      145,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "#303030";

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
      vinylX,
      vinylY,
      5,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "#999";

    ctx.fill();


    // ========================================
    // PAPEL
    // ========================================

    const paperX = 70;
    const paperY = 80;

    const paperWidth = 1030;
    const paperHeight = 700;


    // Sombra

    ctx.fillStyle =
      "rgba(0,0,0,0.25)";

    ctx.fillRect(
      paperX + 15,
      paperY + 18,
      paperWidth,
      paperHeight
    );


    // Papel

    const paperGradient =
      ctx.createLinearGradient(
        0,
        paperY,
        0,
        paperY + paperHeight
      );


    paperGradient.addColorStop(
      0,
      "#ffffff"
    );

    paperGradient.addColorStop(
      0.6,
      "#eeeeee"
    );

    paperGradient.addColorStop(
      1,
      "#d2d2d2"
    );


    ctx.fillStyle =
      paperGradient;

    ctx.fillRect(
      paperX,
      paperY,
      paperWidth,
      paperHeight
    );


    ctx.strokeStyle =
      "#bdbdbd";

    ctx.lineWidth = 3;

    ctx.strokeRect(
      paperX,
      paperY,
      paperWidth,
      paperHeight
    );


    // ========================================
    // NICKNAME
    // ========================================

    ctx.fillStyle =
      "#050505";

    ctx.textAlign =
      "left";

    ctx.textBaseline =
      "middle";


    ctx.font =
      '48px "DejaVu Sans", Arial, sans-serif';


    ctx.fillText(
      "—",
      paperX + 85,
      paperY + 75
    );


    let displayNickname =
      nickname;


    if (
      displayNickname.length > 22
    ) {

      displayNickname =
        displayNickname.substring(
          0,
          21
        ) + "…";

    }


    ctx.font =
      '54px "DejaVu Sans", Arial, sans-serif';


    ctx.fillText(
      displayNickname,
      paperX + 145,
      paperY + 72
    );


    // ========================================
    // USERNAME
    // ========================================

    ctx.font =
      '25px "DejaVu Sans", Arial, sans-serif';

    ctx.fillStyle =
      "#333333";


    ctx.fillText(
      "@" + username,
      paperX + 150,
      paperY + 112
    );


    // ========================================
    // AREA DEL QUOTE
    // ========================================

    const quoteAreaX =
      paperX + 75;

    const quoteAreaY =
      paperY + 170;

    const quoteAreaWidth =
      paperWidth - 150;

    const quoteAreaHeight =
      400;


    // ========================================
    // FUENTE DEL QUOTE
    // ========================================

    function setQuoteFont(size) {

      ctx.font =
        `bold ${size}px "DejaVu Sans", "Noto Emoji", Arial, sans-serif`;

    }


    // ========================================
    // AJUSTAR TEXTO
    // ========================================

    function wrapText(
      text,
      fontSize
    ) {

      setQuoteFont(
        fontSize
      );


      const words =
        text.split(/\s+/);

      const lines = [];

      let currentLine = "";


      for (
        const word of words
      ) {

       
