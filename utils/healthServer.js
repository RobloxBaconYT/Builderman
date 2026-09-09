const http = require('http');

function startHealthServer(client) {
  const port = process.env.PORT || 3000;
  const server = http.createServer((req, res) => {
    const isReady = client.isReady();
    res.writeHead(isReady ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: isReady ? 'ok' : 'starting', bot: client.user?.tag || null }));
  });
  server.listen(port, () => {
    console.log(`Health check server listening on port ${port}`);
  });
}

module.exports = { startHealthServer };
