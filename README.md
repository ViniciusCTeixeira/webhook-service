# Webhook Service

## Overview

Webhook Service is a lightweight Node.js application designed to capture and display incoming HTTP requests (webhooks) in real-time. This service can be useful for debugging and monitoring webhooks from various sources. It offers a web interface where you can view the details of each received request, including method, headers, body, and timestamp.

## Features

- **Real-time Monitoring**: The web interface updates automatically when a new request is received.
- **Request Details**: Displays detailed information about each received request, including headers, body, method, and timestamp.
- **In-Memory Storage**: Stores received requests in memory for real-time visualization.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (version 12.x or higher)
- yarn (version 1.x or higher)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ViniciusCTeixeira/webhook-service.git
   cd webhook-service
   ```

2. Install the dependencies:

   ```bash
   yarn install
   ```

## Usage

1. Start the application:

   ```bash
   yarn start
   ```

2. Open your browser and navigate to:

   ```
   http://localhost:3000
   ```

   Here, you can view all the incoming requests.

3. Send a webhook request to the application:

   You can use `curl`, `Postman`, or any other tool to send a POST, GET, or any HTTP request to:

   ```
   http://localhost:3000/webhook
   ```

   Example using `curl`:

   ```bash
   curl -X POST http://localhost:3000/webhook -d '{"key":"value"}' -H "Content-Type: application/json"
   ```

4. Watch the request appear in the web interface. The page will update automatically with the new request data.

## WebSocket Integration

This service uses WebSocket to provide real-time updates on the web interface. When a new request is received, all connected clients will see the new request added to the list without needing to refresh the page.

## Customization

You can customize the following aspects of the service:

- **Port Number**: Change the port number by modifying the `port` variable in `server.js`.
- **Request Storage Behavior**: Adjust how requests are stored in the `/webhook` route (for example, if you want to reintroduce a cap).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue if you encounter any problems or have suggestions for improvements.

## License

This project is licensed under the MIT License.

---

This README provides an overview of the project, instructions for setting up and running the service, and guidance on how to use it effectively. Let me know if you need further adjustments or additional information!
