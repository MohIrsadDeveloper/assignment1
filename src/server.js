const express = require("express")
const app = express();
const dotenv = require("dotenv")
const cors =  require("cors")
const bodyParser = require("body-parser");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");


dotenv.config();

// Connect Database
const connection = mysql.createConnection({
    host : process.env.DATABASE_HOST,
    user : process.env.DATABASE_USER,
    password : process.env.DATABASE_PASSWORD,
    database : process.env.DATABASE_NAME
});

connection.connect((err) => {
    if (err) {
        throw err;
    } else {
        console.log("Database Connected...");
    }
})

// Use Middle Ware
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(cors());

// API
app.post("/login", (req,res) => {
    
})

app.get("/listUser", (req,res) => {
    let sql = "select * from users";
    connection.query(sql, (err, result) => {
        if (err) {
            throw err;
        } else {
            res.json({
                msg : "Fetch User Successfully",
                data : result
            });
        }
    })
})

app.get("/listUser/:id", (req,res) => {
    let id = Number(req.params.id);
    let sql = `select * from users where id=${id}`;
    connection.query(sql, (err, result) => {
        if (err) {
            throw err;
        } else {
            res.json({
                msg : "Fetch Single User Successfully",
                data : result
            });
        }
    })
})

app.post("/addUser", (req,res) => {
    let {userName, email, password, confirmPassword} = req.body;
    let hashPassword = bcrypt.hashSync(password, 8);
    let hashConfirmPassword = bcrypt.hashSync(confirmPassword, 8);
    let sql = `insert into users(username,email,password,confirmPassword) values("${userName}","${email}", "${hashPassword}", "${hashConfirmPassword}")`
    connection.query(sql, (err,result) => {
        if (err) {
            res.json(err)
        } else {
            res.json({
                msg : "User Added Successfully",
                data : result
            });
        }
    })
})

app.delete("/deleteUser", (req,res) => {
    let userId = Number(req.query.id); 
    let sql = `Delete from users where id = ${userId}`;
    connection.query(sql, (err, result) => {
        if (err) {
            res.json(err)
        } else {
            res.json({
                msg : "User Deleted Successfully",
                data : result
            })
        }
    })
})

app.patch("/updateUser", (req,res) => {
    let userId = Number(req.query.id);
    let {userName, password, confirmPassword} = req.body;
    let sql = `Update users set username="${userName}", password="${password}", confirmPassword="${confirmPassword}" where id = ${userId}`;
    connection.query(sql, (err, result) => {
        if (err) {
            res.json(err)
        } else {
            res.json({
                msg : "User Updated Successfully",
                data : result
            })
        }
    })
})



const PORT = process.env.PORT ||  5000;
app.listen(PORT, () => {
    console.log(`Application is running on http://localhost:${PORT}`);
})