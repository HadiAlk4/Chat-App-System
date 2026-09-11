import { ObjectId } from "mongodb";

export function testroute(APP, db, io) 
{
  const usersCollection = db.collection("users");
  const groupsCollection = db.collection("groups");
  const roomsCollection = db.collection("rooms");
  const groupRequestsCollection = db.collection("groupRequests");
  const joinRequestsCollection = db.collection("joinRequests");

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

  // create a new group -- may delete later
  // APP.post("/api/groups", async (req, res) => 
  // {
  // try 
  // {
  //   const newGroup =
  //   {
  //     groupName: req.body.groupName,
  //     groupDescription: req.body.groupDescription,
  //     minAge: req.body.minAge,
  //     themeColor: req.body.themeColor,
  //     admins: [req.body.creatorUserName],
  //     members: [req.body.creatorUserName],
  //     rooms: ["Main Room"],
  //   };
  //   const exists = await groupsCollection.findOne({ groupName: newGroup.groupName });
  //   if (exists)
  //   {
  //     return res.send({ ok: false, valid: false, message: "Group already exists" });
  //   }
  //   await groupsCollection.insertOne(newGroup);
  //   res.send({ ok: true, valid: true, message: "Group created successfully", group: newGroup });
  // }
  // catch (err)
  // {
  //   res.status(500).send({ ok: false, message: err.message });
  // }
  // });

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


  APP.post("/api/join-requests", async (req, res) => 
    {
    try
    {
      const { groupName, username } = req.body;
      if(!groupName || !username)
      {
        return res.send({ ok: false, valid: false, message: "All fields are required" });
      }

      const user = await usersCollection.findOne({ username });
      if(!user)
      {
        return res.send({ ok: false, valid: false, message: "User not found" });
      }

      const group = await groupsCollection.findOne({ groupName });
      if(!group)
      {
        return res.send({ ok: false, valid: false, message: "Group not found" });
      }
      
      if(Number(user.age) < Number(group.minAge))
      {
        return res.send({ ok: false, valid: false, message: "User is not old enough to join this group" });
      }

      const alreadyMember = group.members?.includes(username) || group.admins?.includes(username);
      if(alreadyMember)
      {
        return res.send({ ok: false, valid: false, message: "User is already a member of this group" });
      }

      const duplicateRequest = await joinRequestsCollection.findOne({ groupName, username, status: "pending" });
      if(duplicateRequest)
      {
        return res.send({ ok: false, valid: false, message: "Join request already exists" });
      }

      const newRequest = {
        groupName,
        username,
        status: "pending",
        createdAt: new Date(),
      };

      const result = await joinRequestsCollection.insertOne(newRequest);

      io.emit("join-request-created", { _id: result.insertedId, ...newRequest });

      res.send({ ok: true, message: "Join request submitted" });

    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  APP.get("/api/join-requests", async (req, res) => 
  {
    try
    {
      const filter = {};
      if(req.query.groupName) filter.groupName = req.query.groupName;
      if(req.query.username) filter.username = req.query.username;
      if(req.query.status) filter.status = req.query.status;
      const requests = await joinRequestsCollection.find(filter).toArray();
      res.send(requests);
    }
    catch (err)
    {
      res.status(500).send({ ok: false, message: err.message });
    }
  });  

  APP.patch("/api/join-requests/:id/approve", async (req, res) => {
    try {
      const request = await joinRequestsCollection.findOne({
        _id: new ObjectId(req.params.id),
        status: "pending"
      });

      if (!request) {
        return res.send({ ok: false, message: "Pending join request not found" });
      }

      await groupsCollection.updateOne(
        { groupName: request.groupName },
        { $addToSet: { members: request.username } }
      );

      await joinRequestsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "approved", reviewedAt: new Date() } }
      );

      io.emit("join-request-resolved", {
        requestId: req.params.id,
        status: "approved",
        groupName: request.groupName
      });

      res.send({ ok: true, message: "Join request approved" });

    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  APP.patch("/api/join-requests/:id/reject", async (req, res) => {
    try {
      const reason = req.body.reason?.trim();
      if (!reason) {
        return res.status(400).send({ ok: false, message: "A rejection reason is required" });
      }

      const request = await joinRequestsCollection.findOne({
        _id: new ObjectId(req.params.id),
        status: "pending"
      });
      if (!request) {
        return res.status(404).send({ ok: false, message: "Pending join request not found" });
      }

      await joinRequestsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "rejected", rejectionReason: reason, reviewedAt: new Date() } }
      );

      io.emit("join-request-resolved", {
        requestId: req.params.id,
        status: "rejected",
        groupName: request.groupName
      });

      res.send({ ok: true, message: "Join request rejected" });
    } catch (err) {
      res.status(500).send({ ok: false, message: err.message });
    }
  });

  
}