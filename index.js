const fs = require('fs')
const WebSocket = require('ws');
const spawn = require('child_process').spawn
const config = require('./config.json')
const ws = new WebSocket.Server({ port: config.port });

ws.on('connection', (conn) => {

	console.log('client connected')

	config.files.forEach(file => {

		let tail = spawn('tail', ['-f', file.path])
		
		tail.stdout.on('data', function (data) {

			let payload = { file: file.name, text: data.toString('utf-8') }
			
			if (conn.readyState == WebSocket.OPEN) {
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