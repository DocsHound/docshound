var https = require('https');
var fs = require('fs');
const next = require('next');

const port = 3001;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

var options = {
  key: fs.readFileSync('dev_certs/privkey.pem'),
  cert: fs.readFileSync('dev_certs/fullchain.pem'),
};

app.prepare().then(() => {
  https
    .createServer(options, (req, res) => {
      handle(req, res);
    })
    .listen(port, () => {
      console.log(`> Ready on localhost:${port}`);
    });
});
