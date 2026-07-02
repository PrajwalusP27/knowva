const express = require("express");

const mongoose = require("mongoose");

const cors = require("cors");

const http = require("http");

const path = require("path");

const { Server } =
  require("socket.io");

require("dotenv").config();


// ==========================================
// ROUTES
// ==========================================
const userRoutes =
  require("./routes/userRoutes");

const connectionRoutes =
  require("./routes/connectionRoutes");

const messageRoutes =
  require("./routes/messageRoutes");

const sessionRoutes =
  require("./routes/sessionRoutes");

const validationRoutes =
  require("./routes/validationRoutes");

const notificationRoutes =
  require("./routes/notificationRoutes");

const peerTestRoutes =
  require("./routes/peerTestRoutes");

const badgeRoutes =
  require("./routes/badgeRoutes");

const certificateRoutes =
  require("./routes/certificateRoutes");

const adminRoutes =
  require("./routes/adminRoutes");

const emailRoutes =
  require("./routes/emailRoutes");


// ==========================================
// APP
// ==========================================
const app = express();

const server =
  http.createServer(app);


// ==========================================
// SOCKET.IO
// ==========================================
const io = new Server(server, {
  cors: {
    origin:
      "http://localhost:5173",

    methods: [
      "GET",
      "POST",
    ],
  },
});


// ==========================================
// ONLINE USERS
// ==========================================
let onlineUsers = [];


// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());

app.use(express.json());


// ==========================================
// STATIC UPLOADS
// ==========================================
app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )
);


// ==========================================
// API ROUTES
// ==========================================
app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/connections",
  connectionRoutes
);

app.use(
  "/api/messages",
  messageRoutes
);

app.use(
  "/api/sessions",
  sessionRoutes
);

app.use(
  "/api/validations",
  validationRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/peer-tests",
  peerTestRoutes
);

app.use(
  "/api/badges",
  badgeRoutes
);

app.use(
  "/api/certificates",
  certificateRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/email",
  emailRoutes
);


// ==========================================
// SOCKET CONNECTION
// ==========================================
io.on("connection", (socket) => {

  console.log(
    "User Connected:",
    socket.id
  );

  // ======================================
  // USER ONLINE
  // ======================================
  socket.on(
    "user_online",
    (clerkId) => {

      const exists =
        onlineUsers.find(
          (user) =>
            user.clerkId ===
            clerkId
        );

      // Prevent duplicates
      if (!exists) {

        onlineUsers.push({
          clerkId,
          socketId:
            socket.id,
        });
      }

      // Broadcast online users
      io.emit(
        "online_users",
        onlineUsers
      );

      console.log(
        "Online Users:",
        onlineUsers
      );
    }
  );

  // ======================================
  // JOIN ROOM
  // ======================================
  socket.on(
    "join_room",
    (room) => {

      socket.join(room);

      console.log(
        `User joined room: ${room}`
      );
    }
  );

  // ======================================
  // SEND MESSAGE
  // ======================================
  socket.on(
    "send_message",
    (data) => {

      socket.to(data.room).emit(
        "receive_message",
        data
      );
    }
  );

  // ======================================
  // NEW MESSAGE NOTIFICATION
  // ======================================
  socket.on(
    "new_notification",
    (data) => {

      io.emit(
        "receive_notification",
        data
      );
    }
  );

  // ======================================
  // PERSIST + EMIT NOTIFICATION
  // Saves to DB and forwards to recipient.
  // Used by sessions, connections, etc.
  // ======================================
  socket.on(
    "send_notification",
    async (data) => {

      try {

        const Notification =
          require("./models/Notification");

        const saved =
          await Notification.create(data);

        // Frontend filters by recipientClerkId
        io.emit(
          "receive_db_notification",
          saved
        );

      } catch (err) {

        console.log(
          "Notification error:",
          err
        );
      }
    }
  );

  // ======================================
  // NEW SESSION NOTIFICATION
  // ======================================
  socket.on(
    "new_session_notification",
    (data) => {

      io.emit(
        "receive_session_notification",
        data
      );
    }
  );

  // ======================================
  // CONNECTION NOTIFICATION
  // ======================================
  socket.on(
    "connection_notification",
    (data) => {

      io.emit(
        "receive_connection_notification",
        data
      );
    }
  );

  // ======================================
  // MESSAGE SEEN
  // ======================================
  socket.on(
    "message_seen",
    (data) => {

      socket.to(data.room).emit(
        "messages_seen",
        data
      );
    }
  );

  // ======================================
  // TYPING
  // ======================================
  socket.on(
    "typing",
    (data) => {

      socket.to(data.room).emit(
        "user_typing",
        data
      );
    }
  );

  // ======================================
  // STOP TYPING
  // ======================================
  socket.on(
    "stop_typing",
    (data) => {

      socket.to(data.room).emit(
        "user_stop_typing"
      );
    }
  );

  // ======================================
  // DISCONNECT
  // ======================================
  socket.on("disconnect", () => {

    onlineUsers =
      onlineUsers.filter(
        (user) =>
          user.socketId !==
          socket.id
      );

    io.emit(
      "online_users",
      onlineUsers
    );

    console.log(
      "User Disconnected",
      socket.id
    );
  });
});


// ==========================================
// TEST ROUTE
// ==========================================
app.get("/", (req, res) => {

  res.send(
    "Knowva API Running..."
  );
});


// ==========================================
// MONGODB
// ==========================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>
    console.log(
      "MongoDB Connected"
    )
  )
  .catch((err) =>
    console.log(err)
  );


// ==========================================
// SERVER
// ==========================================
const PORT =
  process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );
});