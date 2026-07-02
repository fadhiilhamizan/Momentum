/* Temporary helper: receives a base64 PNG (rendered from logo.svg by the
   browser canvas) and writes assets/icon.png + assets/icon.ico. Pure JS. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const pngToIcoM = require('png-to-ico');
const pngToIco = pngToIcoM.default || pngToIcoM;

const ASSETS = path.join(__dirname, '..', 'assets');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    res.writeHead(200);
    res.end('icon-server up');
    return;
  }
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', async () => {
    try {
      const b64 = body.replace(/^data:image\/png;base64,/, '');
      const buf = Buffer.from(b64, 'base64');
      fs.writeFileSync(path.join(ASSETS, 'icon.png'), buf);
      const ico = await pngToIco([path.join(ASSETS, 'icon.png')]);
      fs.writeFileSync(path.join(ASSETS, 'icon.ico'), ico);
      console.log('ICON WRITTEN png=%d ico=%d', buf.length, ico.length);
      res.writeHead(200);
      res.end(JSON.stringify({ png: buf.length, ico: ico.length }));
    } catch (e) {
      console.error('ICON ERR', e);
      res.writeHead(500);
      res.end(String(e));
    }
  });
});

server.listen(4599, () => console.log('icon-server listening on 4599'));
