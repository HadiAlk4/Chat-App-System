export function testroute(APP, db) 
{
  const usersCollection = db.collection("users");
  const groupsCollection = db.collection("groups");
  const roomsCollection = db.collection("rooms");

  // authenticate user
  APP.post("/api/auth", async (req, res) => 
  {
    const { email, password } = req.body;
    const user = await usersCollection.findOne({ email, password });

    if (!user)
    {
      return res.send({ ok: false, valid: false, message: "Invalid Credentials" });
    }
    try 
    {
      res.send({ ok: true, valid: true, message: "Login Successful", user: user });
    } catch (err) 
    {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  // get all groups
  APP.get("/api/groups", async (req, res) => 
  {
    try
    {
      const groups = await groupsCollection.find({}).toArray();
      res.send(groups);
    }
    catch (err)
    {
      res.status(500).send({ ok: false, message: err.message });
    }
  });


  // sign up users
  APP.post("/api/signup", async (req, res) => {
    try{
      const newUser = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        dob: req.body.dob,
        age: req.body.age,
        role: "user",
        valid: true,
      }
      const exists = await usersCollection.findOne({ email: newUser.email });
      if (exists)
      {
        return res.send({ ok: false, valid: false, message: "Email already exists" });
      }

      await usersCollection.insertOne(newUser);
      res.send({ ok: true, valid: true, message: "Signup Successful", user: newUser });
    }
    catch (err)
    {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  // create a new group
  APP.post("/api/groups", async (req, res) => 
  {
  try 
  {
    const newGroup =
    {
      groupName: req.body.groupName,
      groupDescription: req.body.groupDescription,
      minAge: req.body.minAge,
      themeColor: req.body.themeColor,
      admins: [req.body.creatorUserName],
      members: [req.body.creatorUserName],
      rooms: ["Main Room"],
    };
    const exists = await groupsCollection.findOne({ groupName: newGroup.groupName });
    if (exists)
    {
      return res.send({ ok: false, valid: false, message: "Group already exists" });
    }
    await groupsCollection.insertOne(newGroup);
    res.send({ ok: true, valid: true, message: "Group created successfully", group: newGroup });
  }
  catch (err)
  {
    res.status(500).send({ ok: false, message: err.message });
  }
  });

  // create a new room
  APP.post("/api/rooms", async (req, res) => 
  {
  try 
  {
    const { groupName, roomName } = req.body;

    const result = await roomsCollection.updateOne({ name: groupName}, { $push: { rooms: roomName } });
    if (result.matchedCount === 0)
    {
      return res.send({ ok: false, valid: false, message: "Group not found" });
    }

    const updatedGroup = await groupsCollection.findOne({ groupName });
    res.send({ok: true, rooms: updatedGroup.rooms});
  }
  catch (err)
  {
    res.status(500).send({ ok: false, message: err.message });
  }
  });
}
