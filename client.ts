import fs from "fs";
import readline from "readline";
import mqtt from "mqtt";
import chalk from "chalk";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Connect to local MQTT broker
const client = mqtt.connect("mqtt://localhost:1883");

// Get the path to the CSV file to process from command line arguments
const filePath = process.argv[2] || "path/to/csv/file";

// Define interface for sensor data object
interface SensorData {
  temperature: number;
  humidity: number;
  thermalArray: number[];
  timestamp: number;
}

// Function to split a CSV line into fields
const splitFields = (line: string): string[] => {
  const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  return line.split(regex).map((field) => field.trim());
};

let sentCount = 0;

// Function to process data from CSV file
const processData = (): void => {
  let lineCount = 0;

  // Create a read interface for the CSV file
  const readInterface = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });
  const now = new Date();
  const startSendTime = now.toLocaleTimeString();
  console.log(chalk.magenta("\n---------------------------------\n"));
  console.log(
    chalk.white.bgBlack.bold("[" + startSendTime + "] ") +
      chalk.magenta.bold("Start sending data...")
  );
  console.log(chalk.magenta("\n---------------------------------\n"));

  // Read each line from the CSV file
  readInterface.on("line", (line: string) => {
    let delay = 0;

    if (lineCount > 1) {
      delay = (lineCount - 1) * 1000;
    }

    // send sensor data
    setTimeout(() => {
      const [Humidity, Temperature, ThermalArray] = splitFields(line);
      const temperature = parseFloat(Temperature);
      const humidity = parseFloat(Humidity);

      const thermalArray = ThermalArray.split(",")
        .map(parseFloat)
        .filter((value) => !isNaN(value));

      const sensorData: SensorData = {
        humidity,
        temperature,
        thermalArray,
        timestamp: Date.now(),
      };

      // Check if the data is valid
      if (
        sensorData.temperature &&
        sensorData.humidity &&
        sensorData.thermalArray.length
      ) {
        sendSensorsData(sensorData);
      }
    }, delay);

    lineCount++;

    // Log when all data has been sent
    setTimeout(() => {
      if (lineCount - 1 === sentCount) {
        const now = new Date();
        const doneSendTime = now.toLocaleTimeString();
        console.log(chalk.cyan("\n---------------------------------\n"));
        console.log(
          chalk.white.bgBlack.bold("[" + doneSendTime + "] ") +
            chalk.cyan.bold("Done sending data...")
        );
        console.log(chalk.cyan("\n---------------------------------\n"));
      }
    }, delay);
  });
};

// Function to send sensor data to the MQTT broker
const sendSensorsData = (sensorsData: SensorData): void => {
  let payload = JSON.stringify(sensorsData);

  // Determine the maximum size of each MQTT message
  const chunkSize = process.env.CHUNK_SIZE
    ? parseInt(process.env.CHUNK_SIZE)
    : 250;

  // Start a new sensor data transmission
  client.publish("sensorData/start", "");

  // Send the data in chunks of up to chunkSize bytes
  for (let i = 0; i < payload.length; i += chunkSize) {
    let chunk = payload.slice(i, i + chunkSize);

    // Send the chunk of data
    client.publish(`sensorData/${i / 250 + 1}`, chunk);

    // Send an end message to indicate the end of a sensor data transmission
    if (i + chunkSize >= payload.length) {
      client.publish("sensorData/end", "");
      sentCount++;
    }
  }
};

// Log when the client connects to the MQTT broker
setTimeout(() => {
  if (client.connected) {
    console.log(chalk.green("Connected to MQTT server at localhost:1883"));
    console.log(
      chalk(
        "\nPlease start the server with the command: " +
          chalk.dim("pnpm start-server\n")
      )
    );
    console.log(
      chalk.yellow("Data sending every 3 minutes after start server...")
    );
    processData();
  } else {
    console.log(
      chalk.red("Error:"),
      chalk.red("Could not connect to MQTT server"),
      chalk.red("localhost:1883")
    );
    client.end();
  }
}, 1000);
