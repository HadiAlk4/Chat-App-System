import fs from "fs";

export function testroute(app) 
{
  app.post("/api/auth", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    fs.readFile("./fakeData.json", "utf8", (err, data) => {
      if (err) throw err;

      let database = JSON.parse(data);
      let user = database.users.find(
        (u) => u.email == email && u.password == password
      );

    if (!user) 
    {
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
}