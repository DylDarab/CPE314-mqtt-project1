# MQTT-based IoT Application for Sensor Readings

This is an MQTT-based IoT application that sends sensor readings from an IoT node to a remote database. The system consists of three entities - Client (IoT node), Broker, and Server - and follows the published-subscribed pattern.

## System Architecture

![mqtt-architect](https://user-images.githubusercontent.com/76202663/222755386-26d01b3f-07cc-43c7-b6ec-656115301b93.png)

The Client has three types of sensors - Relative humidity, temperature, and thermal array. The Broker forwards any data it receives to its subscribers. The Server subscribes for data from Client, assembles the data as necessary, and writes it in a local database for later query or visualization.

## Getting Started

### Prerequisites

To run the project, you will need the following:

- Node.js
- PNPM (Node.js package manager)

### Installation

1. Clone this repository to your local machine:

```sh
git clone https://github.com/DylDarab/CPE314-mqtt-project1.git
```

2. Install the dependencies using in this project:

```sh
pnpm install
```

### Running the Project

1. Start the Broker by running the following command in the broker directory:

```sh
pnpm start-broker
```

2. Start the client by running the following command in the client directory:

```sh
pnpm start-client <csv_file_path>
```

where `<csv_file_path>` is the path to the CSV file containing the sensor data. For example, `pnpm start-client data.csv`.

3. Start the server by running the following command in the server directory:

```sh
pnpm start-server <db_file_path>
```

where `<db_file_path>` is the path to the SQLite database file. For example, `pnpm start-server db.sqlite`. And if the database file does not exist, it will be created new automatically in db directory.

## Running multiple clients and servers

To run multiple clients and servers, you can use the same commands as above. For example, to run two clients, you can run the following commands in two different terminals: pnpm start-client ./csv/MQTT_MockNoi.csv and pnpm start-client ./csv/MQTT_MockNoi.csv. To run two servers, you can run the following commands in two different terminals: pnpm start-server db.sqlite and pnpm start-server db2.sqlite.
