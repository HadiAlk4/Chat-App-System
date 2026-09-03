export function testroute(APP, db) 
{
  const usersCollection = db.collection("users");
  const groupsCollection = db.collection("groups");
  const roomsCollection = db.collection("rooms");

  // authenticate user
  APP.post("/api/auth", async (req, res) => 
  {
    const { email, password } = req.body;
    const user = await usersCollection.findOne({ email });

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


}