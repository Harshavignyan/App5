const express = require("express");
const mongoose = require("mongoose");
const app = express();
const bodyparser = require("body-parser");
const courses = require("./public/course.model");
const users = require("./public/user.model");
const admins = require("./public/admin.model");
const purchases = require("./public/purchase.model");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const multer = require('multer')
var fs = require("fs")

const SECRET_KEY = crypto.randomBytes(32).toString('hex');

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(cookieParser());
app.set("view engine", "pug");
app.use(express.static(__dirname + "/public"));

// Middleware to check authentication
function checkAuthentication(req, res, next, tokenType) {
    const token = req.cookies[tokenType];
    if (!token) {
        return res.redirect('/login');
    }
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.redirect('/login');
        }
        req[tokenType.replace('Token', '')] = decoded;
        next();
    });
}

function userCheck(req, res, next) {
    checkAuthentication(req, res, next, 'userToken');
}

function adminCheck(req, res, next) {
    checkAuthentication(req, res, next, 'adminToken');
}

function userOrAdminCheck(req, res, next) {
    const userToken = req.cookies.userToken;
    const adminToken = req.cookies.adminToken;
    if (userToken) {
        checkAuthentication(req, res, next, 'userToken');
    } else if (adminToken) {
        checkAuthentication(req, res, next, 'adminToken');
    } else {
        res.redirect('/login');
    }
}

// 1. home.pug file rendering
app.get("/", (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then(() => {
        courses.find({}).then((courseData) => {
            if (req.cookies.userToken) {
                jwt.verify(req.cookies.userToken, SECRET_KEY, (err, decoded) => {
                    if (err) {
                        return res.render("home", { courseinfo: courseData, cookies: {} });
                    }
                    res.render("home", { courseinfo: courseData, cookies: decoded });
                });
            } else if (req.cookies.adminToken) {
                jwt.verify(req.cookies.adminToken, SECRET_KEY, (err, decoded) => {
                    if (err) {
                        return res.render("home", { courseinfo: courseData, cookies: {} });
                    }
                    res.render("home", { courseinfo: courseData, cookies: decoded });
                });
            } else {
                res.render("home", { courseinfo: courseData, cookies: {} });
            }
        });
    });
});

// 2. signup form
app.get("/signup", (req, res) => {
    res.sendFile(__dirname + "/public/signup.html");
});

// 3. registering the details from the signup form
app.post("/register", (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then(() => {
        var newUser = new users(req.body);
        newUser.save().then(() => {
            res.redirect("/login");
        });
    });
});

// 4. login form
app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

// 5. login error form
app.get("/login-error", (req, res) => {
    res.sendFile(__dirname + "/public/login-error.html");
});

// login route with JWT implementation
app.post("/", (req, res) => {
    var usr = req.body.username;
    var pwd = req.body.password;
    mongoose.connect("mongodb://localhost:27017").then(() => {
        users.findOne({ username: usr, password: pwd }).then((userData) => {
            if (userData) {
                const token = jwt.sign({ username: userData.username }, SECRET_KEY, { expiresIn: '1h' });
                res.cookie("userToken", token);
                res.redirect("/");
            } else {
                admins.findOne({ adminusername: usr, adminpassword: pwd }).then((adminData) => {
                    if (adminData) {
                        const token = jwt.sign({ adminusername: adminData.adminusername }, SECRET_KEY, { expiresIn: '1h' });
                        res.cookie("adminToken", token);
                        res.redirect("/");
                    } else {
                        res.redirect("/login-error");
                    }
                });
            }
        });
    });
});

// 6. logout action
app.get('/logout', (req, res) => {
    res.clearCookie('userToken');
    res.clearCookie('adminToken');
    res.redirect("/");
});

// Routes requiring authentication
app.get("/admin/dashboard", adminCheck, (req, res) => {
    var details = { adminusername: req.admin.adminusername };
    res.render("admindashboard.pug", { cookies: details });
});

app.get("/user/dashboard", userCheck, (req, res) => {
    var details = { username: req.user.username };
    mongoose.connect("mongodb://localhost:27017").then(() => {
        users.findOne({ username: req.user.username }).then((userdata) => {
            courses.find().then((coursedata) => {
                res.render("userdashboard.pug", {
                    userinfo: userdata,
                    courseinfo: coursedata,
                    cookies: details
                });
            });
        });
    });
});

app.get("/uploadfiles", userCheck, (req,res) => {
    res.sendFile(__dirname + "/public/userfileform.html")
})

// Middleware for verifying the JWT token (as shown in your code)

// Configure Multer to handle file uploads
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        // console.log(req.user)
        // Ensure `req.user` is set before this point
        if (!req.user || !req.user.username) {
            return callback(new Error('No user found'), null);
        }

        const username = req.user.username;
        const path = `./uploads/${username}/`;

        // Create the directory if it doesn't exist
        fs.mkdirSync(path, { recursive: true });

        callback(null, path);
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname);
    },
});

const upload = multer({ storage });

// Example route for file upload
app.post("/upload", userCheck, upload.single("file"), (req, res) => {
    res.send("File uploaded successfully!");
});

app.get("/admin/register", adminCheck, (req, res) => {
    res.sendFile(__dirname + "/public/adminregister.html");
});

app.post("/admin/register", adminCheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then(() => {
        var newAdmin = new admins(req.body);
        newAdmin.save().then(() => {
            res.redirect("/admin/dashboard");
        });
    });
});

app.get("/admin/addcourse", adminCheck, (req, res) => {
    res.sendFile(__dirname + "/public/formforcourses.html");
});

app.post("/admin/addcourse", adminCheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then(() => {
        var newCourse = new courses(req.body);
        newCourse.save().then(() => {
            res.redirect("/admin/dashboard");
        });
    });
});

app.get("/subscribe/:coursename", userCheck, (req, res) => {
    var username = req.user.username;
    var coursename = req.params.coursename;
    mongoose.connect("mongodb://localhost:27017").then(() => {
        const newPurchase = new purchases({ username: username, coursename: coursename });
        newPurchase.save().then(() => {
            res.redirect("/");
        });
    });
});

app.get("/courses/:coursenickname/modify", adminCheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then((data) => {
        courses.findOne({ coursenickname: req.params.coursenickname }).then((coursedata) => {
            res.render("modifycourse.pug", { courseinfo: coursedata });
        });
    });
});

app.post("/:coursenickname/:videotitle/:index/moveup", adminCheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then(() => {
        courses.findOne({ coursenickname: req.params.coursenickname }).then((course) => {
            const videoIndex = parseInt(req.params.index);
            if (videoIndex > 0) {
                // Swap the video with the one before it
                [course.coursevideos[videoIndex - 1], course.coursevideos[videoIndex]] = [course.coursevideos[videoIndex], course.coursevideos[videoIndex - 1]];

                // Swap the titles in coursecontenttitle
                [course.coursecontenttitle[videoIndex - 1], course.coursecontenttitle[videoIndex]] = [course.coursecontenttitle[videoIndex], course.coursecontenttitle[videoIndex - 1]];

                // Save the updated course document
                course.save().then(() => {
                    res.redirect("/courses");
                });
            }
        });
    });
});

app.post("/:coursenickname/:videotitle/:index/movedown", adminCheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then(() => {
        courses.findOne({ coursenickname: req.params.coursenickname }).then((course) => {
            const videoIndex = parseInt(req.params.index);
            if (videoIndex < course.coursevideos.length - 1) {
                // Swap the video with the one after it
                [course.coursevideos[videoIndex + 1], course.coursevideos[videoIndex]] = [course.coursevideos[videoIndex], course.coursevideos[videoIndex + 1]];

                // Swap the titles in coursecontenttitle
                [course.coursecontenttitle[videoIndex + 1], course.coursecontenttitle[videoIndex]] = [course.coursecontenttitle[videoIndex], course.coursecontenttitle[videoIndex + 1]];

                // Save the updated course document
                course.save().then(() => {
                    res.redirect("/courses");
                });
            }
        });
    });
});

app.post("/:coursenickname/addvideo", adminCheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then(() => {
        courses.findOneAndUpdate(
            { coursenickname: req.params.coursenickname },
            {
                $push: {
                    coursevideos: { title: req.body.title, url: req.body.url },
                    coursecontenttitle: req.body.title
                }
            }
        ).then((coursedata) => {
            res.redirect("/courses");
        });
    });
});

app.get("/admin/approve", adminCheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then(() => {
        purchases.find({}).then((purchasedata) => {
            res.render("purchases.pug", { purchaseinfo: purchasedata });
        });
    });
});

app.get("/approve/:id/:username/:coursename", adminCheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then(() => {
        users.findOneAndUpdate(
            { username: req.params.username },
            { $push: { courses: req.params.coursename } }
        ).then(() => {
            purchases.findByIdAndDelete({ _id: req.params.id }).then(() => {
                res.redirect("/admin/approve");
            });
        });
    });
});

app.get("/decline/:username/:coursename", adminCheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then(() => {
        purchases.findOneAndDelete({ username: req.params.username }).then(() => {
            res.redirect("/admin/approve");
        });
    });
});

app.get("/:nickname/:info", userCheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then(() => {
        courses.findOne({ coursenickname: req.params.nickname }).then((coursedata) => {
            var videodata = coursedata.coursevideos;
            var videotitle = req.params.info;
            res.render("thecoursecontent.pug", {
                courseinfo: coursedata,
                video: videodata,
                videot: videotitle
            });
        });
    });
});

// 7. Route to display all courses for users and admins
app.get("/courses", userOrAdminCheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then((data) => {
        courses.find({}).then((coursesdata) => {
            let details = req.user ? { username: req.user.username } : { adminusername: req.admin.adminusername };
            res.render("courses.pug", {
                coursesinfo: coursesdata,
                cookies: details
            });
        });
    });
});

// 8. Route to view more details of a specific course for users and admins
app.get("/courses/:coursenickname/viewmore", userOrAdminCheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then((data) => {
        courses.findOne({ coursenickname: req.params.coursenickname }).then((coursedata) => {
            let details = req.user ? { username: req.user.username } : { adminusername: req.admin.adminusername };
            res.render("acourse.pug", {
                eachcourseinfo: coursedata,
                cookies: details
            });
        });
    });
});

app.listen(4000, () => {
    console.log("Server is running on port 4000");
});
