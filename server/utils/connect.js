var skt = require('../workers/bcSocket.js');
var server = require('../workers/serverSocket.js');
var geo = require('geo-from-ip');

// create a new blockchain websocket
var ws = new skt.ws(skt.url);

// transform data from blockchain
var clean = function(transaction) {

  var sum = 0;
  var loc = geo.allData(transaction.relayed_by).location;
  var coords = [];

  if (loc !== undefined) {
    coords = [loc.latitude, loc.longitude];
  }

  transaction.out.forEach(function(sent) {
    sum += sent.value;
  });

  return {
    bc: sum / 100000000,
    time: transaction.time * 1000,
    ip: transaction.relayed_by,
    coords: coords
  };

};

// subscribe to new transactions
ws.open(ws.options.newTransactions, function() {
  console.log(ws.state() + ' to blockchain socket and subscribing to new transactions');
});

ws.getData(function(data, flags) {

  var dat = JSON.parse(data);
  console.log(data);

  var transaction = clean(JSON.parse(data).x);

  server.broadcast(JSON.stringify(transaction));
});

ws.onClose(function() {
  console.log(ws.state());
});

server.newConnection(function(ws) {
  console.log('New Connection');

  var tenMinutesAgo = Date.now() - 60 * 10 * 1000;

  db.readHistoricalData('bitcoinData', tenMinutesAgo, function(err, results) {
    if (err) {
      console.log(err);
    } else if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(results));
    }
    console.log(ws.readyState);
  });

});

