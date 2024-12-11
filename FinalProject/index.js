let express = require("express");

let app = express();

let path = require("path");

require("dotenv").config();

const port = process.env.PORT || process.env.port_LOCAL || 5008;

app.set("view engine", "ejs"); // Set the view engine to expect and render ejs files

app.set("views", path.join(__dirname, "views")); // Tells the engine to look for view in the view folder

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "styles"))); // tells app to serve static css files
app.use("/images", express.static(path.join(__dirname, "images")));

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.RDS_HOSTNAME || "localhost",
    user: process.env.RDS_USERNAME || "postgres",
    password:
      process.env.RDS_PASSWORD || process.env.RDS_PASSWORD_LOCAL || "admin",
    database:
      process.env.RDS_DB_NAME || process.env.RDS_DB_NAME_LOCALE || "project3",
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  },
});

const session = require("express-session");

app.use(
  session({
    secret: "Fortnite", // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to `true` if using HTTPS
  })
);

app.get("/", (req, res) => {
  // Pass dbConfig to the EJS file
  res.render("index");
});

// Route to Login page
app.get("/login", (req, res) => {
  res.render("login");
});

// Login page submission.
// TODO: validate username and password in DB and don't send over the password.
//       Data to send: User type (employee/customer), name?, username?

app.post("/login", (req, res) => {
  const { username, password } = req.body; // Extract username and password

  // Query the database for the user
  knex("userlogins") // Replace 'admin' with your table name if different
    .where({ username }) // Check if username exists
    .first() // Fetch the first matching record
    .then((userlogins) => {
      if (!userlogins) {
        // No matching username found
        console.error("Invalid username");
        return res.status(401).send("Invalid username or password.");
      }

      // Compare the entered plain-text password with the stored password
      if (password === userlogins.password) {
        console.log("Login successful:", username);

        // Store user info in the session
        req.session.user = { username: userlogins.username };

        // Redirect to a protected page
        res.redirect("/calculator");
      } else {
        console.error("Invalid password");
        res.status(401).send("Invalid username or password.");
      }
    })
    .catch((err) => {
      console.error("Error during login:", err);
      res.status(500).send("Internal server error.");
    });
});

app.get("/user-management", (req, res) => {
  knex("userlogins")
    .select("*")
    .then((users) => {
      console.log(users); // Log to confirm `id` exists for each record
      res.render("user-management", { userlogins: users });
    })
    .catch((error) => {
      console.error("Error querying database:", error);
      res.status(500).send("Internal Server Error");
    });
});

app.get("/editUser/:id", (req, res) => {
  console.log("Route Parameter ID:", req.params.id); // Debugging
  knex("userlogins")
    .where({ userid: req.params.id })
    .first()
    .then((userlogins) => {
      if (userlogins) {
        console.log("Userlogins Data:", userlogins); // Debugging
        res.render("editUser", { user: req.session.user || {}, userlogins });
      } else {
        console.log("No user found with ID:", req.params.id); // Debugging
        res.status(404).send("User not found");
      }
    })
    .catch((err) => {
      console.error("Error fetching user:", err.message);
      res.status(500).send("Internal server error.");
    });
});

app.post("/editUser/:id", (req, res) => {
  console.log("User data sent to template:", userlogins);
  let username = req.body.username;
  let password = req.body.password;
  let firstname = req.body.firstname;
  let lastname = req.body.lastname;
  let email = req.body.email;
  let phone = req.body.phone;

  knex("userlogins")
    .where({ id: userid }) // Use the userid from URL
    .first()
    .update({
      username: username,
      password: password,
      firstname: firstname,
      lastname: lastname,
      email: email,
      phone: phone,
    })
    .then(() => {
      res.redirect("/user-management");
    })
    .catch((error) => {
      console.error("Error updating User:", error);
      res.status(500).send("Internal Server Error");
    });
});

// Route to account creation page
app.get("/createAccount", (req, res) => {
  res.render("createAccount");
});

app.post("/CreateAccount", (req, res) => {
  let sFirstName = req.body.firstname;
  let sLastName = req.body.lastname;
  let sEmail = req.body.email;
  let sPhone = req.body.phone;
  let sUsername = req.body.username;
  let sPassword = req.body.password;
  knex("userlogins")
    .insert({
      username: sUsername,
      password: sPassword,
      firstname: sFirstName,
      lastname: sLastName,
      email: sEmail,
      phone: sPhone,
    })
    .then(() => {
      res.redirect("/user-management");
    })
    .catch((error) => {
      console.error("Error adding User:", error);
      res.status(500).send("Internal Server Error");
    });
});

app.post("/deleteUser/:userid", (req, res) => {
  const id = req.params.userid; // Declare 'id' first
  console.log("ID to delete:", id); // Now you can use 'id'

  knex("userlogins")
    .where("userid", id) // Ensure "userid" matches your database column name
    .del()
    .then(() => {
      res.redirect("/user-management");
    })
    .catch((error) => {
      console.error("Error deleting user:", error);
      res.status(500).send("Internal Server Error");
    });
});

//Quote stuff//
app.get("/submittedQuotes", (req, res) => {
  knex("quotes")
    .join("userlogins", "quotes.creator", "userlogins.userid")
    .select("quotes.*", "userlogins.firstname", "userlogins.lastname")
    .then((quotes) => {
      res.render("submittedQuotes", { quotes: quotes });
    })
    .catch((error) => {
      console.error("Error fetching quotes:", error);
      res.status(500).send("Internal Server Error");
    });
});

app.get("/editQuote/:quoteid", (req, res) => {
  const quoteid = req.params.quoteid;
  knex("quotes")
    .leftJoin("userlogins", "userlogins.userid", "=", "quotes.creator")
    .select(
      "quoteid",
      "quotedescription",
      "locationid",
      "quoteyear",
      "meansurviverate",
      "curryearseed",
      "cappedyield",
      "priceelectionper",
      "expcommodvalue",
      "firstname",
      "lastname"
    )
    .where("quoteid", quoteid)
    .first()
    .then((quoteInfo) => {
      knex("locationinfo")
        .select("*")
        .then((locationInfo) => {
          res.render("editQuote", { quoteInfo, locationInfo });
        });
    })
    .catch((error) => {
      console.error("Error fetching quote:", error);
      res.status(500).send("Internal Server Error");
    });
});

app.post("/editQuote/:quoteid", (req, res) => {
  const quoteid = req.params.quoteid;

  const quotedescription = req.body.quotedescription;
  const locationid = req.body.locationid;
  const quoteyear = req.body.quoteyear;
  const meansurviverate = req.body.meansurviverate;
  const curryearseed = req.body.curryearseed;
  const cappedyield = req.body.cappedyield;
  const priceelectionper = req.body.priceelectionper;
  const expcommodvalue = req.body.expcommodvalue;

  knex("quotes")
    .where("quoteid", quoteid)
    .update({
      quotedescription: quotedescription,
      locationid: locationid,
      quoteyear: quoteyear,
      meansurviverate: meansurviverate,
      curryearseed: curryearseed,
      cappedyield: cappedyield,
      priceelectionper: priceelectionper,
      expcommodvalue: expcommodvalue,
    })
    .then(() => {
      res.redirect("/submittedQuotes");
    })
    .catch((error) => {
      console.error("Error updating Quote:", error);
      res.status(500).send("Internal Server Error");
    });
});

app.post("/deleteQuote/:quoteid", (req, res) => {
  const quoteid = req.params.quoteid;
  knex("quotes")
    .where("quoteid", quoteid)
    .del()
    .then(() => {
      res.redirect("/submittedQuotes");
    })
    .catch((error) => {
      console.error("Error deleting quote:", error);
      res.status(500).send("Internal Server Error");
    });
});

app.get("/calculator", (req, res) => {
  res.render("calculator", { user: "admin" });
});

app.post("/getLocationInfo", (req, res) => {
  const { state, county } = req.body;

  knex("LocationInfo")
    .where({ state, county })
    .first()
    .then((location) => {
      if (location) {
        res.json({
          locationId: location.id,
          locationRate: location.rate,
        });
      } else {
        res.status(404).json({ message: "Location not found." });
      }
    })
    .catch((error) => {
      console.error("Error fetching location info:", error);
      res.status(500).json({ message: "Internal server error." });
    });
});

app.listen(port, () =>
  console.log(`Server is running at http://localhost:${port}`)
); // Start listening
