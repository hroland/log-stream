const fs = require('fs')
const https = require('https')
const WebSocket = require('ws');
const spawn = require('child_process').spawn
const config = require('./config.json')

const privateKey = fs.readFileSync(config.privateKey, 'utf8')
const certificate = fs.readFileSync(config.certificate, 'utf8')

const credentials = { key: privateKey, cert: certificate }

const server = https.createServer(credentials, function(req, res){
	res.writeHead(200, {'Content-Type': 'text/html'})
	res.write('Working', 'utf8');
  res.end();
})
server.listen(config.port)

const ws = new WebSocket.Server({ server });

ws.on('connection', (conn) => {

	console.log('client connected')

	config.files.forEach(file => {

		let tail = spawn('tail', ['-f', '-n', config.lines || 50, file.path])
		
		tail.stdout.on('data', function (data) {

			let payload = { file: file.name, text: data.toString('utf-8') }
			
			if (conn.readyState === WebSocket.OPEN) {
				conn.send(JSON.stringify(payload))
			}
		})

		tail.stderr.on('data', (data) => {
			console.log(`stderr: ${data}`);
		});
		
		tail.on('close', (code) => {
			console.log(`process exited with code ${code}`);
		});
	})

	conn.on('message', (message) => {
		console.log('received: %s', message);
	})
})

console.log('Log stream running on *:' + config.port);