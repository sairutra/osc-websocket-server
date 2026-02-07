//--------------------------------------------------
//  Bi-Directional OSC messaging Websocket <-> UDP
//--------------------------------------------------
var osc = require("osc"),
  WebSocket = require("ws");

var getIPAddresses = function () {
  var os = require("os"),
    interfaces = os.networkInterfaces(),
    ipAddresses = [];

  for (var deviceName in interfaces) {
    var addresses = interfaces[deviceName];

    for (var i = 0; i < addresses.length; i++) {
      var addressInfo = addresses[i];

      if (addressInfo.family === "IPv4" && !addressInfo.internal) {
        ipAddresses.push(addressInfo.address);
      }
    }
  }

  return ipAddresses;
};

var udp = new osc.UDPPort({
  localAddress: "127.0.0.1",
  localPort: 9001,
  remoteAddress: "127.0.0.1",
  remotePort: 9000,
});

udp.on("ready", function () {
  var ipAddresses = getIPAddresses();
  console.log("Listening for OSC over UDP.");
  ipAddresses.forEach(function (address) {
    console.log(" Host:", address + ", Port:", udp.options.localPort);
  });
  console.log(
    "Broadcasting OSC over UDP to",
    udp.options.remoteAddress + ", Port:",
    udp.options.remotePort,
  );
});

udp.on("message", function (oscMsg) {
  console.log("An OSC message just arrived!", oscMsg);
});

udp.open();

var wss = new WebSocket.Server({
  port: 8081,
});

let socketPort;
let url;

wss.on("connection", function (socket, req) {
  console.log("A Web Socket connection has been established!");

  if (url && url === req.url) {
    console.log("websocket already created for this url: " + url);
    return;
  }
  url = req.url;
  socketPort = new osc.WebSocketPort({
    socket: socket,
  });

  var relay = new osc.Relay(udp, socketPort, {
    raw: true,
  });
});
