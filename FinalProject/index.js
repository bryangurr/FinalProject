let express = require("express");

let app = express();

let path = require("path");

const port = process.env.PORT || 5500;

app.set("view engine", "ejs"); // Set the view engine to expect and render ejs files

app.set("views", path.join(__dirname, "views")); // Tells the engine to look for view in the view folder

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "styles"))); // tells app to serve static css files
app.use("/images", express.static(path.join(__dirname, "images")));

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.RDS_HOSTNAME || "localhost",
    user: process.env.RDS_USERNAME || "postgres",
    password: process.env.RDS_PASSWORD || "admin",
    database: process.env.RDS_DB_NAME || "project3",
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  },
});

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
  let sUsername = req.body.username;
  let sPassword = req.body.password;
  let sUserType = "admin";
  console.log("Login received!");
  res.render("calculator", {
    sUsername: sUsername,
    sPassword: sPassword,
    sUserType: sUserType,
  });
});

// Route to account creation page
app.get("/create-account", (req, res) => {
  res.render("createAccount");
});

// Route to Guest Calculator
app.get("/guest", (req, res) => {
  res.render("calculator", {
    sUsername: "guest",
    sPassword: "guest",
    sUserType: "guest",
  });
});

app.get("/calculator", (req, res) => {
  res.render("calculator", { user: "admin" });
});

app.get("/user-management", (req, res) => {
    knex('userlogins')
        .select('*') // Specify the fields to retrieve
        .then(users => {
            res.render('user-management', { userlogins: users }); // Use the correct variable name
        })
        .catch(error => {
            console.error('Error querying database:', error);
            res.status(500).send('Internal Server Error');
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



app.post("/CreateAccount", (req, res) => {
  let sFirstName = req.body.first_name;
  let sLastName = req.body.last_name;
  let sEmail = req.body.email;
  let sPhone = req.body.phone;
  let sUsername = req.body.username;
  let sPassword = req.body.password;
  knex("users")
    .insert({
      username: sUsername,
      password: sPassword,
      first_name: sFirstName,
      last_name: sLastName,
      email: sEmail,
      user_type: 3,
    })
    .then(() => {
      res.redirect("/user-management");
    })
    .catch((error) => {
      console.error("Error adding User:", error);
      res.status(500).send("Internal Server Error");
    });
});

app.post("/deleteUser/:id", (req, res) => {
  const id = req.params.id;
  knex("userlogins")
    .where("id", id)
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
});

app.post("/editQuote/:quoteid", (req, res) => {
  const quoteid = req.params.quoteid;
});

app.post("/deleteQuote/:quoteid", (req, res) => {
  const quoteid = req.params.quoteid;

  knex("quotes").where("quoteid", quoteid).del();
});

app.listen(port, () =>
  console.log(`Server is running at http://localhost:${port}`)
); // Start listening
