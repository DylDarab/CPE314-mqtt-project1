const aedes = require('aedes');
const { createServer } = require('aedes-server-factory');
const chalk = require('chalk');
const ipaddr = require('ipaddr.js');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Define port to listen on
const PORT = process.env.PORT || 1883;

// Create an Aedes instance
const app = new aedes();
// Create an MQTT server
const server = createServer(app);

let chunk: any = {};

// Listen for 'client' and 'clientDisconnect' events emitted by the server
server.listen(PORT, () => {
  // Log the port the server is listening on
  console.log(`Server listening on port ${PORT}\n`);

  // Listen for 'client' events emitted by the server
  app.on('client', (client: any) => {
    //@ts-ignore
    let clientIp = ipaddr.parse(client.conn._sockname.address);

    // Log the client ID and IP address
    console.log(
      chalk.bgGreen.bold('Client connected:'),
      `${client.id} from ${clientIp.toString()} ${clientIp.kind()}`
    );
  });

  // Listen for 'clientDisconnect' events emitted by the server
  app.on('clientDisconnect', (client: any) => {
    //@ts-ignore
    let clientIp = ipaddr.parse(client.conn._sockname.address);

    // Log the client ID and IP address
    console.log(
      chalk.bgRed.bold('Client disconnected:'),
      `${client.id} from ${clientIp.toString()} ${clientIp.kind()}`
    );
  });

  // Listen for 'publish' events emitted by the server
  app.on('publish', (packet: any, client: any) => {
    // If the client ID is not defined, return
    if (!client?.id) {
      return;
    }
    // If the chunk is not defined, define it
    if (!chunk[client.id]) chunk[client.id] = [];

    // If the packet topic is 'sensorData/end', publish the sensor data to the 'sensorData/final' topic
    if (packet.topic === 'sensorData/end') {
      console.log('Received sensor data from', client?.id);

      const allData = chunk[client.id].join('');
      console.log('All data: ', allData);

      // Publish the sensor data to the 'sensorData/final' topic
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
      // If the packet topic is 'sensorData/start', define the chunk
    } else if (packet.topic === 'sensorData/start') {
      chunk[client.id] = [];

      // If the packet topic starts with 'sensorData', add the payload to the chunk
    } else if (packet.topic.startsWith('sensorData')) {
      const part = packet.topic.split('/')[1];
      chunk[client.id][part] = packet.payload;
    }
  });
});
