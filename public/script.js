const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const chatType = urlParams.get("type");

const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessage");
const disconnectChatBtn = document.getElementById("disconnectChat");
const messagesDiv = document.getElementById("messages");

let partnerId = null;

socket.emit("find_partner", { chatType });

socket.on("partner_found", ({ partnerId: id }) => {
    partnerId = id;
    alert("Partner found! You can start chatting.");
    disconnectChatBtn.disabled = false;
});

sendMessageBtn.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message && partnerId) {
        socket.emit("send_message", { message, partnerId });
        messagesDiv.innerHTML += `<p>You: ${message}</p>`;
        messageInput.value = "";
    }
});

disconnectChatBtn.addEventListener("click", () => {
    socket.emit("disconnect_partner");
    alert("You disconnected from the chat. Finding a new partner...");
    socket.emit("find_partner", { chatType });
});

socket.on("receive_message", ({ message }) => {
    messagesDiv.innerHTML += `<p>Partner: ${message}</p>`;
});

socket.on("partner_disconnected", () => {
    alert("Your partner has disconnected. Finding a new partner...");
    socket.emit("find_partner", { chatType });
});






