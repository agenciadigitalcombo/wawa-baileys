const { WAConnection } = require("@adiwajshing/baileys")
const fs = require("fs")
const http = require("http")
const qrcode = require("qrcode")
const express = require("express")
const socketIO = require("socket.io")
const port = 8000 || process.env.PORT
const conn = new WAConnection()
const app = express()
const server = http.createServer(app)
const io = socketIO(server)

conn.connectOptions.alwaysUseTakeover = true

app.use("/", express.static(__dirname + "/"))

app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))

app.get('/', (req, res) => {
    res.sendFile('index.html', {
      root: __dirname
    });
  });

io.on("connection", async socket => {
    socket.emit('message', 'Connecting...');

	conn.on("qr", qr => {
        console.log('QR RECEIVED', qr);
		qrcode.toDataURL(qr, (err, url) => {
			socket.emit("qr", url)
			socket.emit("log", "QR Code received, please scan!")
		})
	})

	conn.on("open", async res => {
        const authInfo = conn.base64EncodedAuthInfo()
        fs.writeFileSync('./auth.json', JSON.stringify(authInfo, null, '\t'))
        socket.emit('message', 'Whatsapp is ready!');
        socket.emit("qr", "./check.svg")
		socket.emit("log", res)
	})

	conn.on("close", res => {
        if (fs.existsSync('./auth.json')) {
            fs.unlinkSync('./auth.json');
        }
        conn.clearAuthInfo();
        socket.emit('message', 'Whatsapp is disconnected!');
		socket.emit("log", res)
	})

    if (fs.existsSync('./auth.json')) {
        conn.loadAuthInfo('./auth.json')
    }

	switch (conn.state) {
		case "close":
			await conn.connect()
			break
		case "open":
			socket.emit("qr", "./check.svg")
            socket.emit('open', 'Whatsapp is ready!');
            socket.emit('log', 'Whatsapp is ready!');
			break
		default:
			socket.emit("log", conn.state)
	}
})

server.listen(port, () => {
    console.log(`http://localhost:${port}`)
})

// ESTRATÉGIA ZAP DAS GALÁXIAS
// ZDG © 2020
// www.zapdasgalaxias.com.br   