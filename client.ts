const fs = require('fs');
const readline = require('readline');
const mqtt = require('mqtt');
const chalk = require('chalk');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Connect to local MQTT broker
const client = mqtt.connect('mqtt://localhost:1883');

// Get the path to the CSV file to process from command line arguments
const filePath = './csv/' + process.argv[2] && 'csv file path on your computer';

// Define interface for sensor data object
interface SensorData {
  temperature: number;
  humidity: number;
  thermalArray: number[];
}

// Function to split a CSV line into fields
const splitFields = (line: string): string[] => {
  // Regular expression to match commas that are not inside double-quotes
  const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  return line.split(regex).map((field) => field.trim());
};

// Function to process data from CSV file
const processData = (): void => {
  // Create a read interface for the CSV file
  const readInterface = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });
  let lineCount = 0;
  let sendingCount = 0;
  // Listen for 'line' events emitted by the read interface
  readInterface.on('line', (line: any) => {
    let delay = sendingCount * 20000;

    if (lineCount === 0) {
      delay = 0;
    }

    setTimeout(() => {
      // Process the line after the delay
      // Split the line into fields and parse them as numbers
      const [Temperature, Humidity, ThermalArray] = splitFields(line);
      const temperature = parseFloat(Temperature);
      const humidity = parseFloat(Humidity);
      // Split the thermal array field into numbers
      const thermalArray = ThermalArray.split(',')
        .map(parseFloat)
        .filter((value) => !isNaN(value));

      // Create a sensor data object from the parsed fields
      const sensorData: SensorData = { temperature, humidity, thermalArray };

      // Check if the data is valid
      if (
        sensorData.temperature &&
        sensorData.humidity &&
        sensorData.thermalArray.length
      ) {
        // If the data is valid, send it to the MQTT broker
        sendSensorsData(sensorData);
      }
    }, delay);

    if (lineCount !== 0) {
      lineCount++;
      sendingCount++;
    }
    lineCount++;
  });
};

// Function to send sensor data to the MQTT broker
const sendSensorsData = (sensorsData: SensorData): void => {
  let payload = JSON.stringify(sensorsData);

  // Determine the maximum size of each MQTT message (default is 250 bytes)
  const chunkSize = process.env.CHUNK_SIZE
    ? parseInt(process.env.CHUNK_SIZE)
    : 250;

  // Send a start message to indicate the start of a sensor data transmission
  client.publish('sensorData/start', '');

  // Send the data in chunks of up to chunkSize bytes
  for (let i = 0; i < payload.length; i += chunkSize) {
    let chunk = payload.slice(i, i + chunkSize);
    // Send each chunk as a separate MQTT message
    client.publish(`sensorData/${i / 250 + 1}`, chunk);
    // Send an end message to indicate the end of a sensor data transmission
    if (i + chunkSize >= payload.length) {
      client.publish('sensorData/end', '');
    }
  }
};

// Wait for the MQTT client to connect to the broker
setTimeout(() => {
  // Check if the client is connected
  if (client.connected) {
    console.log(
      chalk.white.bgGreen('Connected to MQTT server at localhost:1883')
    );
    // Process the data from the CSV file
    processData();
  } else {
    console.log(
      chalk.white.bold.bgRed('Error:'),
      'Could not connect to MQTT server',
      chalk.white.bgRed('localhost:1883')
    );
    client.end();
  }
}, 1000);
