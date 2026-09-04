import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

export function testroute(APP, db, io) 
{
  const usersCollection = db.collection("users");
  const groupsCollection = db.collection("groups");
  const roomsCollection = db.collection("rooms");
  const groupRequestsCollection = db.collection("groupRequests");
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

      // determine the role of the user for super admin bootstrapping
      const userCount = await usersCollection.countDocuments();
      const role = userCount === 0 ? "super-admin" : "user";

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = 
      {
        username,
        email,
        password: hashedPassword,
        dob,
        age,
        role,
        valid: true,
        isDarkMode: false,
        profilePictureUrl: '/pfp.png',
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

  APP.post("/api/group-requests", async (req, res) =>
  {
  try
  {
    const 
    {
      groupName,
      groupDescription,
      minAge,
      themeColor,
      creatorUserName,
      creatorEmail,
    } = req.body;

    if(!groupName || !groupDescription || !minAge || !themeColor || !creatorUserName || !creatorEmail)
    {
      return res.send({ ok: false, valid: false, message: "All fields are required" });
    }

    const exists = await groupRequestsCollection.findOne({ groupName });

    if(exists)
    {
      return res.send({ ok: false, valid: false, message: "Group request already exists" });
    }

    const pendingRequests = await groupRequestsCollection.findOne({ groupName, status: "pending" });
    if(pendingRequests)
    {
      return res.send({ ok: false, valid: false, message: "Group request already exists" });
    }

    const newRequest = {
      groupName,
      groupDescription,
      minAge,
      themeColor,
      creatorUserName,
      creatorEmail,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await groupRequestsCollection.insertOne(newRequest);
    io.emit("group-request-created", {
      _id: result.insertedId,
      ...newRequest,
    });

    res.send({ ok: true, valid: true, message: "Group request submitted successfully" });
  }
  catch (err)
  {
    res.status(500).send({ ok: false, message: err.message });
  }
  });

  APP.get("/api/group-requests", async (req, res) =>
  {
    try
    {
      const filter = req.query.status ? { status: req.query.status } : {};
      const requests = await groupRequestsCollection.find(filter).toArray();
      res.send(requests);
    }
    catch (err)
    {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  APP.patch("/api/group-requests/:id/approve", async (req, res) =>
  {
    try
    {
      const request = await groupRequestsCollection.findOne({ _id: new ObjectId(req.params.id), status: "pending" });
      if(!request)
      {
        return res.send({ ok: false, valid: false, message: "Request not found" });
      }

      const groupExists = await groupsCollection.findOne({ groupName: request.groupName });
      if(groupExists)
      {
        return res.send({ ok: false, valid: false, message: "Group already exists" });
      }

      await groupsCollection.insertOne({
        groupName: request.groupName,
        groupDescription: request.groupDescription,
        minAge: request.minAge,
        themeColor: request.themeColor,
        admins: [request.creatorUserName],
        members: [request.creatorUserName],
        rooms: ["Main Room"],
      });

      await groupRequestsCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: "approved", reviewedAt: new Date() } });

      io.emit("group-request-resolved", {
        requestId: req.params.id,
        status: "approved",
      });

      res.send({ ok: true, valid: true, message: "Group request approved successfully" });
    }
    catch (err)
    {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  APP.patch("/api/group-requests/:id/reject", async (req, res) => {
    try {
      const reason = req.body.reason?.trim();

      if (!reason) {
        return res.status(400).send({
          ok: false,
          message: "A rejection reason is required"
        });
      }

      const result = await groupRequestsCollection.updateOne(
        {
          _id: new ObjectId(req.params.id),
          status: "pending"
        },
        {
          $set: {
            status: "rejected",
            rejectionReason: reason,
            reviewedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).send({
          ok: false,
          message: "Pending proposal not found"
        });
      }

      io.emit("group-request-resolved", {
        requestId: req.params.id,
        status: "rejected",
      });

      res.send({ ok: true, message: "Proposal rejected" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });
}
