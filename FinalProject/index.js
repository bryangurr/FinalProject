let express = require("express");

let app = express();

let path = require("path");

const port = process.env.PORT || 5500;

app.set("view engine", "ejs"); // Set the view engine to expect and render ejs files

app.set("views", path.join(__dirname, "views")); // Tells the engine to look for view in the view folder

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'styles'))); // tells app to serve static css files
app.use('/images', express.static(path.join(__dirname, 'images')));

const knex = require("knex")({
    client: "pg",
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost",
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "Never1:3",
        database: process.env.RDS_DB_NAME || "oysterfarmdb",
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
    }
})

app.get('/', (req, res) => {

  
    // Pass dbConfig to the EJS file
    res.render('index');
  });

// Route to Login page
app.get("/login", (req, res) => {
    res.render('login');
});

// Login page submission. 
// TODO: validate username and password in DB and don't send over the password. 
//       Data to send: User type (employee/customer), name?, username?
app.post("/login", (req, res) => {
    let sUsername = req.body.username;
    let sPassword = req.body.password;
    let sUserType = 'admin';
    console.log("Login received!");
    res.render("calculator", { sUsername: sUsername, sPassword: sPassword, sUserType: sUserType });
});

// Route to account creation page
app.get('/create-account', (req, res) => {
    res.render("createAccount");
})

// Route to Guest Calculator
app.get("/guest", (req, res) => {
    res.render('calculator', { sUsername: 'guest', sPassword: 'guest', sUserType: 'guest' });
});

app.get("/calculator", (req, res) => {
    res.render('calculator', { user: 'admin' });
});

app.get("/user-management", (req, res) => {
    knex('users')
        // .join('poke_type', 'pokemon.poke_type_id', '=', 'poke_type.id') // Join Pokémon with their types
        .select(
            '*'
        ) // Specify the fields to retrieve
        .then(users => {
            res.render('manageUsers', { users }); // Render the home page with Pokémon data
        })
        .catch(error => {
            console.error('Error querying database:', error);
            res.status(500).send('Internal Server Error');
        });


})

app.post("/CreateAccount", (req, res) => {
    let sFirstName = req.body.first_name;
    let sLastName = req.body.last_name;
    let sEmail = req.body.email;
    let sPhone = req.body.phone;
    let sUsername = req.body.username;
    let sPassword = req.body.password;
    knex('users')
        .insert({
            username: sUsername,
            password: sPassword,
            first_name: sFirstName,
            last_name: sLastName,
            email: sEmail,
            user_type: 3
        })
        .then(() => {
            res.redirect('/user-management');
        })
        .catch(error => {
            console.error('Error adding User:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.post("/deleteUser/:id", (req, res) => {
    const id = req.params.id;
    knex('users')
        .where('id', id)
        .del()
        .then(() => {
            res.redirect('/user-management');
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.listen(port, () => console.log(`Server is running at http://localhost:${port}`)); // Start listening