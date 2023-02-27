const fs = require('fs');
const mqtt = require('mqtt');
const sqlite3 = require('better-sqlite3');

let dbDir: string = '';
let count: number = 1;

if (process.argv[2]) {
  dbDir = process.argv[2];
} else {
  while (fs.existsSync(`./db/mqtt${count}.sqlite`)) {
    count++;
  }
  dbDir = `./db/mqtt${count}.sqlite`;
}
const db = sqlite3(dbDir);

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

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Connected to MQTT server at localhost:1883 writing at ', dbDir);

  client.subscribe('sensorData/final');

  client.on('message', (topic, message) => {
    const data = JSON.parse(message.toString());
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

    console.log('Received sensor data from', data.clientID);
  });
});
