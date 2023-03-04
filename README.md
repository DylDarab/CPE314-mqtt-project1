# MQTT-based IoT Application for Sensor Readings

This is an MQTT-based IoT application that sends sensor readings from an IoT node to a remote database. The system consists of three entities - Client (IoT node), Broker, and Server - and follows the published-subscribed pattern.

## System Architecture

![mqtt-architect](https://user-images.githubusercontent.com/76202663/222755386-26d01b3f-07cc-43c7-b6ec-656115301b93.png)

- Client: The client reads sensor data from three sensors - Relative humidity, temperature, and thermal array. It sends the sensor data to the broker along with its node ID and the current time. The client can read sensor data stored in an Excel file and send it to the broker for every 3 minutes.

- Broker: The broker receives data from the client and forwards it to its subscribers. It prints out an IP address on the screen when a new subscriber or publisher connects or disconnects, and it prints out published messages on the screen.

- Server: The server subscribes to data from the client through the broker. It receives data from the client and writes it in a local database (SQLite) for later query or visualization. The server prints out received messages from the broker on the screen.

## Getting Started

### Prerequisites

To run the project, you will need the following:

- Node.js version 18.0.0 or higher
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

3. Start the server by running the following command:

```sh
pnpm start-server <db_file_path>
```

where <db_file_path> is the path to the SQLite database file. If you want to start the server without specifying a database file, you can run:

```sh
pnpm start-server
```

this will create a new SQLite database file automatically in the db directory.

## Running multiple clients and servers

To run multiple clients and servers, you can use the same commands as above. For example, to run two clients, you can run the following commands in two different terminals: pnpm start-client ./csv/MQTT_MockNoi.csv and pnpm start-client ./csv/MQTT_MockNoi.csv. To run two servers, you can run the following commands in two different terminals: pnpm start-server db.sqlite and pnpm start-server db2.sqlite.
