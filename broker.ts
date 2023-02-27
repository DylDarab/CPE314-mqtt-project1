const aedes = require('aedes');
const { createServer } = require('aedes-server-factory');
const chalk = require('chalk');
const ipaddr = require('ipaddr.js');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 1883;

const app = new aedes();
const server = createServer(app);

let chunk: any = {};

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}\n`);

  app.on('client', (client) => {
    //@ts-ignore
    let clientIp = ipaddr.parse(client.conn._sockname.address);

    console.log(
      chalk.bgGreen.bold('Client connected:'),
      `${client.id} from ${clientIp.toString()} ${clientIp.kind()}`
    );
  });

  app.on('clientDisconnect', (client) => {
    //@ts-ignore
    let clientIp = ipaddr.parse(client.conn._sockname.address);

    console.log(
      chalk.bgRed.bold('Client disconnected:'),
      `${client.id} from ${clientIp.toString()} ${clientIp.kind()}`
    );
  });

  app.on('publish', (packet, client) => {
    if (!client?.id) {
      return;
    }
    if (!chunk[client.id]) chunk[client.id] = [];
    if (packet.topic === 'sensorData/end') {
      console.log('Received sensor data from', client?.id);

      const allData = chunk[client.id].join('');

      app.publish(
        {
          topic: 'sensorData/final',
          payload: JSON.stringify({
            ...JSON.parse(allData),
            clientID: client?.id,
            // @ts-ignore
            ipAddr: client?.conn._sockname.address,
            timestamp: Date.now(),
          }),
          qos: 0,
          retain: false,
          dup: false,
          cmd: 'publish',
        },
        () => {
          console.log('Send sensor data to server');
        }
      );
    } else if (packet.topic === 'sensorData/start') {
      chunk[client.id] = [];
    } else if (packet.topic.startsWith('sensorData')) {
      const part = packet.topic.split('/')[1];
      chunk[client.id][part] = packet.payload;
    }
  });
});
