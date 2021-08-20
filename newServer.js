"use strict";

const express = require("express");
const app = express();

const http = require("http");
const ws = require("ws");
const server = http.createServer(app);

const webSocket = new ws.Server({
  server: server,
  clientTracking: false,
});
//make websocket server

app.use(express.static("public"));
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(port + " running");
});

//heroku stuff

let users = [];

webSocket.on("connection", (connection) => {
  // const connection = ws; //unique connection
  console.log("+");
  console.log(connection.on);

  connection.on("message", (msg) => {
    let pre = msg.toString();
    const data = JSON.parse(pre);
    console.log(data);
    // const data =  //4 parse

    const user = findUser(data.username); //5 get the username, user is now set to users[i]
    console.log(user + " OVER HERE");

    switch (data.type) {
      case "store_user": //6 goes here
        console.log("store_user");
        if (user) {
          console.log(data.username + " Already Exists");
          return;
        }
        const newUser = {
          //6.1 add user to array
          conn: connection, //6.2with their connection id
          username: data.username,
        };
        users.push(newUser);
        console.log(newUser.username + " stored");
        break;
      case "store_offer": //
        console.log("store_offer");
        if (!user) {
          return;
        }
        user.offer = data.offer; //12 put the offer data in the user object
        break;
      case "store_candidate": //14
        console.log("store_candidate");
        if (!user) {
          console.log("user is null");
          return;
        }
        if (!user.candidates) {
          user.candidates = []; //14.1 creates candidates key
        }
        user.candidates.push(data.candidate); //14.2 pushes candidates: {candidates stuff} to user object
        break;
      case "send_answer": //
        console.log("send_answer");
        if (!user) {
          console.log("user is null");
          return;
        }
        sendData(
          {
            type: "answer",
            answer: data.answer,
          },
          user.conn
        );
        break;
      case "send_candidate": //
        console.log("send_candidate");
        if (user === null) {
          console.log("user is null");
          return;
        }
        sendData(
          {
            type: "candidate",
            answer: data.candidate,
          },
          user.conn
        );
        break;
      case "join_call": //
        console.log("join_call");
        if (!user) {
          console.log("user is null");
          return;
        }
        sendData(
          {
            type: "offer",
            offer: user.offer,
          },
          connection
        );
        user.candidates.forEach((candidate) => {
          sendData(
            {
              type: "candidate",
              candidate: candidate,
            },
            connection
          );
        });
        break;
    }
  });
  connection.on("close", (reason, description) => {
    console.log("-");
    users.forEach((user) => {
      if (user.conn === connection) {
        users.splice(users.indexOf(user), 1);
        return;
      }
    });
  });
});

function sendData(data, conn) {
  conn.send(JSON.stringify(data));
}

function findUser(username) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].username === username) {
      return users[i];
    }
  }
}
