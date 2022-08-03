const express = require("express")
const app = express();
const dotenv = require("dotenv")
const cors = require("cors")
const bodyParser = require("body-parser");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("./config")


dotenv.config();

// Connect Database
const connection = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});

connection.connect((err) => {
    if (err) {
        throw err;
    } else {
        console.log("Database Connected...");
    }
})

// Use Middle Ware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// API
/* Admin Register */
app.post("/adminRegister", (req, res) => {
    let { username, email, password, confirmPassword } = req.body;
    if (!(username && email && password && confirmPassword)) {
        return res.status(500).json({
            msg: "Please Enter all fields"
        })
    } else {
        let hashPassword = bcrypt.hashSync(password, 8);
        let hashConfirmPassword = bcrypt.hashSync(confirmPassword, 8);
        let sql = `insert into admin(username,email,password,confirmPassword) values("${username}","${email}", "${hashPassword}", "${hashConfirmPassword}")`
        connection.query(sql, (err, result) => {
            if (err) {
                if (err.code == "ER_DUP_ENTRY") {
                    res.status(200).json({
                        msg: "Email Already Exist"
                    })
                } else {
                    return res.status(500).json({
                        data: err
                    });
                }
            } else {
                return res.status(200).json({
                    msg: "User Added Successfully",
                    data: result
                });
            }
        })
    }
})
/* Admin Login */
let count = 0;
app.post("/adminLogin", (req, res) => {
    let { email, password } = req.body;
    if (!(email && password)) {
        return res.status(500).json({
            token: "Please Enter All Fields"
        })
    } else {
        let sql = `select * from admin where email=?`;
        connection.query(sql, [email], (err, result) => {
            if (err) {
                return res.status(500).json({
                    token: err
                })
            } else {
                if (result.length <= 0) {
                    return res.status(500).json({
                        auth: false,
                        token: "Email or Password in Invalid"
                    })
                } else {
                    let passValid = bcrypt.compareSync(password, result[0].password)
                    if (!passValid) {
                        count += 1;
                        if (count === 5) {
                            let blockQuery = `update admin set timeStump=addtime(now(), "24:00:00") where id=${result[0].id} `
                            connection.query(blockQuery, (err, result) => {
                                if (err) {
                                    return res.status(500).json(err)
                                } else {
                                    count = 0;
                                }
                            })
                        }
                        return res.status(200).json({
                            auth: false,
                            token: "Email or Password in Invalid",
                        })
                    } else {
                        count = 0;
                        let checkStatus = result[0].timeStump <= Date.now();
                        console.log(checkStatus);
                        if (!checkStatus) {
                            return res.status(200).json({
                                auth: false,
                                token: "Your Account is Blocked for 24 hours"
                            })
                        } else {
                            let token = jwt.sign({ id: result[0].id }, config.secret, { expiresIn: 86400 })
                            return res.status(200).json({
                                auth: true,
                                token: token,
                            })
                        }
                    }
                }
            }
        })
    }
});

// Verify User
app.get('/userInfo', (req, res) => {
    let token = req.headers["x-access-token"];
    if (!token) {
        return res.status(500).json({
            auth: false,
            token: "No Token Provided"
        })
    } else {
        jwt.verify(token, config.secret, (err, result) => {
            if (err) {
                res.status(200).json({
                    auth: false,
                    token: "Invalid Token"
                })
            } else {
                let find = `select * from admin where id=${result.id}`
                connection.query(find, (err, result) => {
                    return res.status(200).json(result)
                })
            }
        })
    }
})

/* List Users */
app.get("/listUser", (req, res) => {
    let sql = "select * from users";
    connection.query(sql, (err, result) => {
        if (err) {
            throw err;
        } else {
            return res.status(200).json({
                msg: "Fetch User Successfully",
                data: result
            });
        }
    })
})

app.get("/listUser/:id", (req, res) => {
    let id = Number(req.params.id);
    let sql = `select * from users where id=${id}`;
    connection.query(sql, (err, result) => {
        if (err) {
            throw err;
        } else {
            return res.status(200).json({
                msg: "Fetch Single User Successfully",
                data: result
            });
        }
    })
})

app.post("/addUser", (req, res) => {
    let { username, email, password, confirmPassword } = req.body;
    if (!(username && email && password && confirmPassword)) {
        return res.status(500).json({
            data: "Please Enter all fields"
        })
    } else {
        // let hashPassword = bcrypt.hashSync(password, 8);
        // let hashConfirmPassword = bcrypt.hashSync(confirmPassword, 8);
        let sql = `insert into users(username,email,password,confirmPassword) values("${username}","${email}", "${password}", "${confirmPassword}")`
        connection.query(sql, (err, result) => {
            if (err) {
                return res.status(500).json({
                    msg: "User Already Exist"
                })
            } else {
                return res.status(200).json({
                    msg: "User Added Successfully",
                    data: result
                });
            }
        })
    }
})

app.delete("/deleteUser", (req, res) => {
    let userId = Number(req.query.id);
    let sql = `Delete from users where id = ${userId}`;
    connection.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                msg: "User Not Deleted"
            })
        } else {
            return res.status(200).json({
                msg: "User Deleted Successfully",
                data: result
            })
        }
    })
})

app.patch("/updateUser", (req, res) => {
    let userId = Number(req.query.id);
    let { username, password, confirmPassword } = req.body;
    let sql = `Update users set username="${username}", password="${password}", confirmPassword="${confirmPassword}" where id = ${userId}`;
    connection.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({
                msg: "User Not Updated"
            })
        } else {
            return res.status(200).json({
                msg: "User Updated Successfully",
                data: result
            })
        }
    })
})



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Application is running on http://localhost:${PORT}`);
})