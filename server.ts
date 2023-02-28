const fs = require('fs');
const mqtt = require('mqtt');
const sqlite3 = require('better-sqlite3');

let dbDir: string = '';
let count: number = 1;

// Check if the user has specified a database file
if (process.argv[2]) {
  dbDir = process.argv[2];
} else {
  while (fs.existsSync(`./db/mqtt${count}.sqlite`)) {
    count++;
  }
  dbDir = `./db/mqtt${count}.sqlite`;
}

// Create a database connection
const db = sqlite3(dbDir);

// Create a table to store sensor data
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS sensorData (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER,
    clientID STRING,
    ipAddr STRING,
    humidity REAL,
    temperature REAL,
    thermalArray STRING
  );  
`
).run();

// Connect to the MQTT broker
const client = mqtt.connect('mqtt://localhost:1883');

// Listen for 'connect' events emitted by the client
client.on('connect', () => {
  console.log('Connected to MQTT server at localhost:1883 writing at ', dbDir);

  // Subscribe to the 'sensorData/final' topic
  client.subscribe('sensorData/final');

  // Listen for 'message' events emitted by the client
  client.on('message', (topic: string, message: Buffer) => {
    const data = JSON.parse(message.toString());
    console.log('Data from broker: ', data);

    // Insert the sensor data into the database
    db.prepare(
      `
        INSERT INTO sensorData (timestamp, clientID, ipAddr, humidity, temperature, thermalArray
        ) VALUES (?, ?, ?, ?, ?, ?)
      `
    ).run(
      Date.now(),
      //@ts-ignore
      data.clientID,
      data.ipAddr,
      data.humidity,
      data.temperature,
      JSON.stringify(data.thermalArray)
    );
    // Log the client ID of the sensor that sent the data
    console.log('Received sensor data from', data.clientID);
  });
});
