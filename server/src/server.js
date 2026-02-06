
import app from "./app.js";
import connect from "./connect.js";
import { initSocket } from "./lib/socket.js";

const PORT = process.env.PORT || 5000;

connect(process.env.MONGO_URI)
    .then(() => {
        console.log(`✅ MongoDB Connected`);

        const server = app.listen(PORT, '127.0.0.1', () => {
            console.log(`🎉 Server started successfully at http://localhost:${PORT}`);

            // Initialize Socket.IO on the same HTTP server
            initSocket(server);
        });

        server.on('error', (error) => {
            console.error('❌ Server error:', error);
        });
    })
    .catch((error) => {
        console.error("❌ MongoDB connection error:", error);
    });