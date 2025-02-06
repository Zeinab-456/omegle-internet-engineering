const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUsers = { text: [], audio: [], video: [] };
let activeConnections = new Map();

io.on("connection", (socket) => {
    console.log("New user connected: " + socket.id);

    socket.on("find_partner", ({ chatType }) => {
        if (waitingUsers[chatType].length > 0) {
            const partnerSocketId = waitingUsers[chatType].pop();
            activeConnections.set(socket.id, partnerSocketId);
            activeConnections.set(partnerSocketId, socket.id);

            io.to(socket.id).emit("partner_found", { partnerId: partnerSocketId, chatType });
            io.to(partnerSocketId).emit("partner_found", { partnerId: socket.id, chatType });
        } else {
            waitingUsers[chatType].push(socket.id);
        }
    });

    socket.on("send_message", ({ message, partnerId }) => {
        io.to(partnerId).emit("receive_message", { message });
    });

    socket.on("webrtc_offer", ({ offer, partnerId }) => {
        io.to(partnerId).emit("webrtc_offer", { offer, partnerId: socket.id });
    });

    socket.on("webrtc_answer", ({ answer, partnerId }) => {
        io.to(partnerId).emit("webrtc_answer", { answer });
    });

    socket.on("webrtc_ice_candidate", ({ candidate, partnerId }) => {
        io.to(partnerId).emit("webrtc_ice_candidate", { candidate });
    });

    socket.on("disconnect_partner", () => {
        const partnerSocketId = activeConnections.get(socket.id);
        if (partnerSocketId) {
            io.to(partnerSocketId).emit("partner_disconnected");
            activeConnections.delete(partnerSocketId);
        }
        activeConnections.delete(socket.id);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
        const partnerSocketId = activeConnections.get(socket.id);
        if (partnerSocketId) {
            io.to(partnerSocketId).emit("partner_disconnected");
            activeConnections.delete(partnerSocketId);
        }
        activeConnections.delete(socket.id);

        for (const type in waitingUsers) {
            waitingUsers[type] = waitingUsers[type].filter((id) => id !== socket.id);
        }
    });
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});





