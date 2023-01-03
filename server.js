const express = require("express");
const { request } = require("https");

const app = express();
const PORT = 3030;
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const url = require("url");
const peerServer = ExpressPeerServer(server, { debug: true });

const path = require("path");

//middleware
app.set("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "static")));
app.use("/peerjs", peerServer);

app.use("/", (req, res) => {
  res.sendFile(path.join(__dirname, "static", "index.html"));
});
app.use("/join", (req, res) => {
  res.redirect(
    url.format({
      pathname: `/join/${uuidv4()}`,
      query: req.query,
    })
  );
});

app.use("/joinold/:meetingId", (req, res) => {
  url.format({
    pathname: `/join/${req.params.meetingId}`,
    query: req.query,
  });
});

app.use("/join/:rooms", (req, res) => {
  res.render("room", { roomid: req.params.rooms, Myname: req.query.name });
});

io.on("connections", (socket) => {
  socket.on("join-room", (roomid, id, myname) => {
    socket.join(roomid);
    socket.to(roomid).broadcast.emit("user-connected", id, myname);

    socket.on("tellName", (myname) => {
      socket.to(roomid).broadcast.emit("AddName", myname);
    });

    socket.on("disconnect", () => {
      socket.to(roomid).broadcast.emit("user-disconnected", myname);
    });
  });
});
server.listen(PORT);
