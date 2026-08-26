import fs from "fs";

export function testroute(app) {
  app.post("/api/auth", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    fs.readFile("./fakeData.json", "utf8", (err, data) => {
      if (err) throw err;

      let database = JSON.parse(data);
      let user = database.users.find(
        (u) => u.email == email && u.password == password
      );

      if (!user) {
        res.send({ ok: false, valid: false, message: "Invalid credentials" });
      } else {
        res.send({
          ok: true,
          valid: true,
          message: "successful login",
          user: user,
        });
      }
    });
  });

  app.get("/api/groups", (req, res) => {
    fs.readFile("./fakeData.json", "utf8", (err, data) => {
      if (err) throw err;

      let database = JSON.parse(data);
      res.send(database.groups || []);
    });
  });

  app.post("/api/signup", (req, res) => {
    let newUser = {
      id: Date.now(),
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      birthdate: req.body.birthdate,
      age: Number(req.body.age) || 18,
      role: "user",
      valid: true,
    };

    fs.readFile("./fakeData.json", "utf8", (err, data) => {
      if (err) throw err;

      let database = JSON.parse(data);

      let existing = database.users.find((u) => u.email == newUser.email);
      if (existing) {
        return res.send({ ok: false, message: "Email already registered" });
      }

      database.users.push(newUser);

      fs.writeFile("./fakeData.json", JSON.stringify(database, null, 2), "utf8", (err) => {
        if (err) throw err;
        res.send({ ok: true, message: "User registered successfully", user: newUser });
      });
    });
  });

  app.post("/api/groups", (req, res) => {
    let newGroup = {
      id: "g_" + Date.now(),
      name: req.body.name,
      description: req.body.description || "",
      minAge: Number(req.body.minAge) || 0,
      themeColor: req.body.themeColor || "blue",
      admins: [req.body.creatorUsername],
      members: [req.body.creatorUsername],
      rooms: ["General"],
    };

    fs.readFile("./fakeData.json", "utf8", (err, data) => {
      if (err) throw err;

      let database = JSON.parse(data);
      database.groups.push(newGroup);

      fs.writeFile("./fakeData.json", JSON.stringify(database, null, 2), "utf8", (err) => {
        if (err) throw err;
        res.send({ ok: true, group: newGroup });
      });
    });
  });

  app.post("/api/rooms", (req, res) => {
    let groupName = req.body.groupName;
    let roomName = req.body.roomName;

    fs.readFile("./fakeData.json", "utf8", (err, data) => {
      if (err) throw err;

      let database = JSON.parse(data);
      let group = database.groups.find((g) => g.name == groupName);

      if (!group) {
        return res.send({ ok: false, message: "Group not found" });
      }

      if (!group.rooms) {
        group.rooms = [];
      }

      group.rooms.push(roomName);

      fs.writeFile("./fakeData.json", JSON.stringify(database, null, 2), "utf8", (err) => {
        if (err) throw err;
        res.send({ ok: true, rooms: group.rooms });
      });
    });
  });
}