const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 52341;
const ROOT = process.argv[2] || ".";

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json"
};

const server = http.createServer((req, res) => {
  let urlPath = req.url === "/" ? "/index.html" : req.url;
  let fp = path.join(ROOT, urlPath);

  if (!fs.existsSync(fp)) {
    fp = path.join(ROOT, "content", path.basename(urlPath));
  }

  const ext = path.extname(fp);
  res.setHeader("Content-Type", MIME[ext] || "text/plain");

  if (fs.existsSync(fp)) {
    fs.createReadStream(fp).pipe(res);
  } else {
    res.statusCode = 404;
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(JSON.stringify({ port: PORT, url: "http://localhost:" + PORT }));
});

setTimeout(() => {}, 60000);