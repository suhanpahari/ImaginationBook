const express = require('express')
const mongoose = require('mongoose')
const User = require('./model/user')
const cors = require('cors')
const DraftCanvas = require('./model/draftCanvas')


const app = express() ; 
const port = process.env.PORT || 3000;

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors({ origin: "https://imaginationbook-5d4r.onrender.com" }));

// app.use(cors({
//   origin: 'https://9461-35-240-135-136.ngrok-free.app',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true,
// }));



mongoose.connect("mongodb+srv://prantik:cgx97.-5mqNv9uW@cluster0.eyubvjw.mongodb.net/ImaginationBook")
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.log(err))



app.post("/signup",async (req,res)=>
{
    const {name , email, password, confirmPassword } = req.body ;
    console.log(name , email, password, confirmPassword) ; 
    console.log("Signup page") ; 
    if(password !== confirmPassword)
    {
        return res.status(400).json({error : "Password and Confirm Password do not match"})
    }
    else
    {
        const user = await new User({name, email, password})
        await user.save() ; 
        return res.status(200).json({message : "User created successfully"})
    }
}
)

app.post('/login' , async (req,res)=>
{
    console.log("Login page") ; 
    const {email, password} = req.body ; 
    const user = await User.findOne({email}) ;
    console.log(user) ; 
    if(!user)
    {
        return res.status(400).json({error : "User not found"})
    }
    else
    {
        if(user.password !== password)
        {
            return res.status(400).json({error : "Invalid password"})
        }
        else
        {
            return res.status(200).json({message : "Login successful"})
        }
    }
    
})

// Save Drawing (Create)
app.post("/api/drawings/:email", async (req, res) => {

  console.log(req.body) ;
  try {
    const drawing = new DraftCanvas({
      ...req.body,
      userEmail: req.params.email,
      board: req.body.board,
    });

    await drawing.save();
    res.status(201).json({ id: drawing._id });
  } catch (error) {
    res.status(500).json({ error: "Failed to save drawing" });
  }
});

// Update Drawing
app.put("/api/drawings/:id/:email", async (req, res) => {
  console.log(req.body)
  try {
    const drawing = await DraftCanvas.findOneAndUpdate(
      { _id: req.params.id, userEmail: req.params.email},
      { elements: req.body.elements, name: req.body.name, board: req.body.board  },

      { new: true }
    );
    if (!drawing) return res.status(404).json({ error: "Drawing not found" });
    res.json({ id: drawing._id });
  } catch (error) {
    res.status(500).json({ error: "Failed to update drawing" });
  }
});

// Load Drawing
app.get("/api/drawings/:id/:email", async (req, res) => {
  try 
  {
    const drawing = await DraftCanvas.findOne({
      _id: req.params.id,
      userEmail: req.params.email,
    
       
    });

    console.log(drawing) ; 
    if (!drawing) return res.status(404).json({ error: "Drawing not found" });
    res.json(drawing);
  } 
  catch (error) 
  {
    res.status(500).json({ error: "Failed to load drawing" });
  }
});

app.get("/api/draft" ,async (req,res) =>
{
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const drafts = await DraftCanvas.find({ userEmail: email }).sort({ updatedAt: -1 });
    res.json(drafts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching drafts' });
  }
})

app.listen(port, (req,res) =>
{
    console.log(`Server is running on port ${port}`)
})