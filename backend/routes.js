import bcrypt from "bcrypt";

export function testroute(APP, db) 
{
  const usersCollection = db.collection("users");
  const groupsCollection = db.collection("groups");
  const roomsCollection = db.collection("rooms");

  // authenticate user
  APP.post("/api/auth", async (req, res) => 
  {
    try
    {
      const { email, password } = req.body;
      if(!email || !password)
      {
        return res.send({ ok: false, valid: false, message: "Email and password are required" });
      }
      const user = await usersCollection.findOne({ email });

      if (!user)
      {
        return res.send({ ok: false, valid: false, message: "Invalid Credentials" });
      }

      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches)
      {
        return res.send({ ok: false, valid: false, message: "Invalid Credentials" });
      }

      // strip res sensitive data from the response
      const userResponse = { ...user };
      delete userResponse.password;
      res.send({ ok: true, valid: true, message: "Login Successful", user: userResponse });
    }
    catch (err) 
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

      const { username, email, password, dob, age } = req.body;

      if(!username || !email || !password || !dob || !age)
      {
        return res.send({ ok: false, valid: false, message: "All fields are required" });
      }

      const passwordRegex = /^(?=.*[A-Z])[a-zA-Z0-9]{8,}$/;

      if(!passwordRegex.test(password))
      {
        return res.send({ ok: false, valid: false, message: "Password must be at least 8 characters long and contain at least one uppercase letter" });
      }      
      const exists = await usersCollection.findOne({ email });
      if (exists)
      {
        return res.send({ ok: false, valid: false, message: "Email already exists" });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = {
        username,
        email,
        password: hashedPassword,
        dob,
        age,
        role: "user",
        valid: true,
      }
      await usersCollection.insertOne(newUser);

      const userResponse = { ...newUser };
      delete userResponse.password;
      res.send({ ok: true, valid: true, message: "Signup Successful", user: userResponse });
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

    const result = await groupsCollection.updateOne({ groupName }, { $addToSet: { rooms: roomName } });
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
