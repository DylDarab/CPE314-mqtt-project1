import aedes from 'aedes';
import { createServer } from 'aedes-server-factory';
import chalk from 'chalk';
import ipaddr from 'ipaddr.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define port to listen on
const PORT = process.env.PORT || 1883;

// Create an Aedes instance
const app = new aedes();

// Create an MQTT server
const server = createServer(app);

let chunk: any = {};

// Listen for 'client' and 'clientDisconnect'
server.listen(PORT, () => {
  console.log(chalk.cyan(`Server listening on port ${PORT}\n`));

  console.log(
    chalk(
      'Please start the client with the command: ' +
        chalk.dim('pnpm start-client ./csv/MQTT_MockNoi.csv \n')
    )
  );

  // Listen for 'client' events emitted by the server
  app.on('client', (client: any) => {
    //@ts-ignore
    let clientIp = ipaddr.parse(client.conn._sockname.address);

    console.log(
      chalk.green.bold('Client connected:'),
      `${client.id} from ${clientIp.toString()} ${clientIp.kind()}` + '\n'
    );
  });

  // Listen for 'clientDisconnect' events emitted by the server
  app.on('clientDisconnect', (client: any) => {
    //@ts-ignore
    let clientIp = ipaddr.parse(client.conn._sockname.address);

    console.log(
      chalk.red.bold('Client disconnected:'),
      `${client.id} from ${clientIp.toString()} ${clientIp.kind()}` + '\n'
    );
  });

  // Listen for 'publish' events emitted by the server
  app.on('publish', (packet: any, client: any) => {
    if (!client?.id) {
      return;
    }

    if (!chunk[client.id]) chunk[client.id] = [];

    // If the packet topic is 'sensorData/end', publish the sensor data to the 'sensorData/final' topic
    if (packet.topic === 'sensorData/end') {
      console.log(chalk.yellow('Received sensor data from'), client?.id);

      // Join the chunk
      const allData = chunk[client.id].join('');
      console.log(
        chalk.magenta(
          '----------------------------------------------------------------------------------------------------------------------------------------'
        )
      );
      console.log(chalk.magenta.bold('Received data: '), allData);
      console.log(
        chalk.magenta(
          '----------------------------------------------------------------------------------------------------------------------------------------'
        )
      );
      // Publish the sensor data to the 'sensorData/final' topic
      app.publish(
        {
          topic: 'sensorData/final',
          payload: JSON.stringify({
            ...JSON.parse(allData),
            clientID: client?.id,
            ipAddr: client?.conn._sockname.address,
          }),
          qos: 0,
          retain: false,
          dup: false,
          cmd: 'publish',
        },
        () => {
          console.log(
            chalk.yellowBright('*** Send sensor data to server ***\n')
          );
        }
      );
      // If the packet topic is 'sensorData/start', define the chunk
    } else if (packet.topic === 'sensorData/start') {
      chunk[client.id] = [];
      console.log(chalk.yellow('Start sensor data from'), client?.id);

      // If the packet topic starts with 'sensorData', add the payload to the chunk
    } else if (packet.topic.startsWith('sensorData')) {
      const part = packet.topic.split('/')[1];
      chunk[client.id][part] = packet.payload;
    }
  });
});
