# Frontend Integration Guide for MCP Weather Chatbot

This guide outlines how to connect to and interact with the NestJS WebSocket backend for the MCP Weather Chatbot.

## 1. Connecting to the WebSocket Server

- **Library Recommendation:** `socket.io-client` is recommended as the backend uses `socket.io`.
- **Server URL:** `ws://localhost:3001` (or simply `http://localhost:3001` if using `socket.io-client`, as it handles the upgrade).

**Example Connection (using `socket.io-client`):**
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3001"); // Or ws://localhost:3001

socket.on("connect", () => {
  console.log("Connected to WebSocket server with ID:", socket.id);
  // You are now connected and can start emitting messages.
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected from WebSocket server:", reason);
});

socket.on("connect_error", (error) => {
  console.error("WebSocket connection error:", error);
});
```

## 2. Events to Emit (Client to Server)

These are the messages your frontend will send to the backend.

### a. Test Message

- **Event Name:** `test_message`
- **Payload:** Any JavaScript object.
- **Purpose:** Basic connectivity test.
- **Example:**
  ```javascript
  socket.emit("test_message", { greeting: "Hello from frontend!" });
  ```

### b. Get Weather Forecast

- **Event Name:** `get_weather_forecast`
- **Payload:** An object with `latitude` and `longitude` (both strings).
  ```javascript
  {
    latitude: "YOUR_LATITUDE_STRING",
    longitude: "YOUR_LONGITUDE_STRING"
  }
  ```
- **Purpose:** Request weather information for the given coordinates.
- **Example:**
  ```javascript
  socket.emit("get_weather_forecast", {
    latitude: "40.7128",
    longitude: "-74.0060"
  });
  ```

### c. Send Chat Message

- **Event Name:** `send_chat_message`
- **Payload:** An object with `message` (string) and optionally `history` (array).
  ```javascript
  {
    message: "Your chat message to the bot",
    history: [] // Optional: an array of previous chat turns if managed by client
               // e.g., [{ role: "user", parts: [{ text: "..." }] }, { role: "model", parts: [{ text: "..." }] }]
  }
  ```
- **Purpose:** Send a message to the Gemini chatbot.
- **Example:**
  ```javascript
  socket.emit("send_chat_message", {
    message: "What is the capital of France?"
  });
  ```

## 3. Events to Listen For (Server to Client)

These are messages your frontend will receive from the backend.

### a. Test Response

- **Event Name:** `test_response`
- **Payload:** An object containing your original message and a reply.
  ```javascript
  {
    original_message: { greeting: "Hello from frontend!" }, // Your sent payload
    reply: "Test message received successfully!"
  }
  ```
- **Example:**
  ```javascript
  socket.on("test_response", (data) => {
    console.log("Received 'test_response':", data);
  });
  ```

### b. Weather Forecast Data

- **Event Name:** `weather_forecast` (This is based on the gateway returning `{ event: 'weather_forecast', data: ... }`)
- **Payload:** The forecast data array (periods) from the weather service.
  ```javascript
  // Example structure (data received will be the periods array itself):
  [
    {
      "number": 1,
      "name": "Tonight",
      "startTime": "...",
      "endTime": "...",
      "isDaytime": false,
      "temperature": 50,
      "temperatureUnit": "F",
      // ... other forecast details
    },
    // ... more periods
  ]
  ```
- **Note:** The backend's `handleGetWeatherForecast` returns `{ event: 'weather_forecast', data: forecast }`. The `socket.io` client typically handles this such that if the server method returns a value for an `emit` that has an acknowledgement callback, the returned value is passed to that callback. If the server explicitly emits, you listen for that event name. The current gateway setup primarily uses `return { event: '...', data: ...}` for the weather forecast. If your client is set up to handle acknowledgements for `emit`, the entire returned object will be in the acknowledgement. If not, the server might need to explicitly `client.emit('weather_forecast_data', forecast)` and you'd listen for `weather_forecast_data`.
  A simpler approach might be for the server to directly `client.emit('weather_data', forecast);` and the client to listen for `weather_data`.
  **The current backend McpGateway.ts in `handleGetWeatherForecast` does `return { event: 'weather_forecast', data: forecast };`. This structure is often used when the client expects a response as an acknowledgement. If the client just listens for an event, the server should use `client.emit('actual_event_name', actual_data);`** For simplicity, let's assume client listens for `'weather_forecast'` directly and the data part of the returned object is the payload.
- **Example (assuming the event name `weather_forecast` carries the data directly):**
  ```javascript
  socket.on("weather_forecast", (data) => {
    console.log("Received 'weather_forecast' data:", data); 
    // The 'data' here will be the periods array based on the return { event: 'weather_forecast', data: forecast } from gateway.
  });
  ```

### c. Weather Error

- **Event Name:** `weather_error`
- **Payload:** An object describing the error.
  ```javascript
  {
    error: "Error message summary",
    details: "Optional further details"
  }
  ```
- **Example:**
  ```javascript
  socket.on("weather_error", (errorData) => {
    console.error("Received 'weather_error':", errorData);
  });
  ```

### d. Chat Response

- **Event Name:** `chat_response`
- **Payload:** An object containing the bot's message.
  ```javascript
  {
    sender: "bot",
    message: "The bot's textual response."
  }
  ```
- **Example:**
  ```javascript
  socket.on("chat_response", (data) => {
    console.log("Received 'chat_response':", data.message);
    // Add to chat UI
  });
  ```

### e. Chat Error

- **Event Name:** `chat_error`
- **Payload:** An object describing the error.
  ```javascript
  {
    error: "Error message summary",
    details: "Optional further details"
  }
  ```
- **Example:**
  ```javascript
  socket.on("chat_error", (errorData) => {
    console.error("Received 'chat_error':", errorData);
  });
  ```

## 4. General Error Handling

Always listen for general connection errors:

```javascript
socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});
```

This guide should help your frontend team get started. Remember to adapt based on the exact client-side implementation choices. 