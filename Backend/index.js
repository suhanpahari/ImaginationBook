const express = require('express')
const mongoose = require('mongoose')
const User = require('./model/user')
const cors = require('cors')
const DraftCanvas = require('./model/draftCanvas')
const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
const bcrypt = require('bcrypt');


dotenv.config();

const app = express() ; 
const port = process.env.PORT || 3000;
// const ngrok = process.env.NGROK_ENDPOINT ;

const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:5001',
  'https://imaginationbook-5d4r.onrender.com',
  process.env.NGROK_ENDPOINT?.trim(), // safely add ngrok only if defined and clean
];

// console.log(process.env.NGROK_ENDPOINT)

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like from Postman, curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("Blocked CORS for origin:", origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json())
app.use(express.urlencoded({extended: true}))

// app.use(cors({
//   origin: 'https://9461-35-240-135-136.ngrok-free.app',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true,
// }));



mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.log(err))



app.post("/signup", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  // console.log(name, email, password, confirmPassword);
  // console.log("Signup page");

  if (password !== confirmPassword) {
      return res.status(400).json({ error: "Password and Confirm Password do not match" });
  }

  try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ error: "Email is already registered" });
      }

      // // Create and save new user
      // const user = new User({ name, email, password });
      // await user.save();

      // Setup email transport

      // console.log(process.env.EMAIL) ; 
      // console.log(process.env.PASSWORD) ;
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.EMAIL,
              pass: process.env.PASSWORD,
          }
      });

      const mailOptions = {
          from: 'imaginationbookpvtltd@gmail.com',
          to: email,
          subject: '🎉 Welcome to Imagination Book – Let Your Story Come to Life',
          text: `Hi ${name},

              Welcome aboard! 🎨✨

              We’re thrilled to have you join Imagination Book — the platform where creativity meets cutting-edge AI. Whether you’re crafting magical stories, educational adventures, or personalized memories, our tools help you bring them to life through interactive pictures, animations, and videos — all powered by AI.

              Here's what you can do next:

              📖 Start a new story with AI-assisted visuals
              🎬 Add animations and videos that respond to your imagination
              🌐 Share your creation with the world in just a few clicks

              Your imagination is the limit — and we’re here to help you stretch it further than ever.

              🚀 Ready to get started?
              Log in now and start creating: https://imaginationbook-5d4r.onrender.com/

              Need help or have questions? Just reply to this email or check out our Help Center.

              Thank you for choosing Imagination Book. Let’s make stories unforgettable!`
                    };

      const result = await transporter.sendMail(mailOptions);
      // console.log(result) ;
       // Create and save new user
       const saltRounds = 10;
       const hashedPassword = await bcrypt.hash(password, saltRounds);
       const user = new User({ name, email, password : hashedPassword });
       await user.save();

      return res.status(200).json({ message: 'Signup successful, email sent' });

  } catch (err) {
      console.error("Signup error:", err);
      if (err.code === 11000) {
          return res.status(400).json({ error: "Email already exists" });
      }
      return res.status(500).json({ error: "Server error during signup" });
  }
});


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
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) 
      {
        return res.status(400).json({ error: "Invalid password" });
      } 
      else 
      {
        return res.status(200).json({ message: "Login successful" });
      }
    }
        // if(user.password !== password)
        // {
        //     return res.status(400).json({error : "Invalid password"})
        // }
        // else
        // {
        //     return res.status(200).json({message : "Login successful"})
        // }
    //}
    
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



if(!port)
  {
    console.log("Port not found") ; 
  }
app.listen(port, (req,res) =>
{
    console.log(`Server is running on port ${port}`)
})