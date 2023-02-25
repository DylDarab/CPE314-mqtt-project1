import chalk from 'chalk'
import mqtt from 'mqtt'

const client = mqtt.connect('mqtt://localhost:1883')

const readTemperatureSensor = (): number => {
  return Math.random() * 100
}

const readHumiditySensor = (): number => {
  return Math.random() * 100
}

const readThermalArray = (): number[] => {
  return Array.from({ length: 728 }, () => Math.random() * 100)
}

const readSensors = () => {
  return {
    temperature: readTemperatureSensor(),
    humidity: readHumiditySensor(),
    thermalArray: readThermalArray(),
  }
}

const sendSensorsData = (): void => {
  let sensorsData = readSensors()
  let payload = JSON.stringify(sensorsData)

  const chunkSize = process.env.CHUNK_SIZE
    ? parseInt(process.env.CHUNK_SIZE)
    : 250

  client.publish('sensorData/start', '')

  for (let i = 0; i < payload.length; i += chunkSize) {
    let chunk = payload.slice(i, i + chunkSize)

    client.publish(`sensorData/${i / 250 + 1}`, chunk)
    if (i + chunkSize >= payload.length) {
      client.publish('sensorData/end', '')
    }
  }
}

setTimeout(() => {
  if (client.connected) {
    console.log(
      chalk.white.bgGreen('Connected to MQTT server at localhost:1883')
    )

    sendSensorsData()
    setInterval(() => {
      sendSensorsData()
    }, 20000)
  } else {
    console.log(
      chalk.white.bold.bgRed('Error:'),
      'Could not connect to MQTT server',
      chalk.white.bgRed('localhost:1883')
    )
    client.end()
  }
}, 1000)
