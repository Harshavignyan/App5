var express = require("express")
var mongoose = require("mongoose")
var app = express()
var bodyparser = require("body-parser")
var courses = require("./public/course.model")
var users = require("./public/user.model")
var admins = require("./public/admin.model")
var purchases = require("./public/purchase.model")

app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())
const cookieParser = require('cookie-parser')
// load the cookie-parsing middleware
app.use(cookieParser())

app.set("view engine", "pug")

// accessing the public file
app.use(express.static(__dirname + "/public"))

// 1. home.pug file rendering
app.get("/", (req, res) => {
    if (req.cookies.username) {
        var details = {}
        details.username = req.cookies.username
        details.password = req.cookies.password
        mongoose.connect("mongodb://localhost:27017").then((data) => {
            courses.find({}).then((coursedata) => {
                res.render("home", { courseinfo: coursedata, cookies: details })
            })
        })
    }

    else if (req.cookies.adminusername) {
        var details = {}
        details.adminusername = req.cookies.adminusername
        details.adminpassword = req.cookies.adminpassword
        mongoose.connect("mongodb://localhost:27017").then((data) => {
            courses.find({}).then((coursedata) => {
                res.render("home", { courseinfo: coursedata, cookies: details })
            })
        })
    }
    else {
        var details = {}
        mongoose.connect("mongodb://localhost:27017").then((data) => {
            courses.find({}).then((coursedata) => {
                res.render("home", { courseinfo: coursedata, cookies: details })
            })
        })
    }
})

// 2. signup form
app.get("/signup", (req, res) => {
    res.sendFile(__dirname + "/public/signup.html")
})

// 3. registering the details from the signup form
app.post("/register", (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then((data) => {
        var newUser = new users(req.body)
        // console.log(req.body)
        newUser.save().then((req, res) => {
            // console.log(req.query)
        })
        res.redirect("/login")
    })
})

// 4. login form
app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/public/login.html")
})

// 5. loggin error form
app.get("/login-error", (req, res) => {
    res.sendFile(__dirname + "/public/login-error.html")
})

// if no cookies, take login credentials and do this step to
// create cookies and redirect to the new home.pug
app.post("/", (req, res) => {
    // console.log(req.cookies)
    var usr = req.body.username;
    var pwd = req.body.password;
    // console.log(usr, pwd)
    mongoose.connect("mongodb://localhost:27017").then(() => {
        users.findOne({ username: usr, $and: [{ password: pwd }] }).then((userdata) => {
            if (userdata) {
                res.cookie("username", userdata.username);
                res.cookie("password", userdata.password);
                res.redirect("/")
            }
            else {
                admins.findOne({ adminusername: usr, $and: [{ adminpassword: pwd }] }).then((admindata) => {
                    if (admindata) {
                        res.cookie("adminusername", admindata.adminusername);
                        res.cookie("adminpassword", admindata.adminpassword);
                        res.redirect("/")
                    }
                    else {
                        res.redirect("/login-error")
                    }
                })
            }
        })
    })
})

// 6. logout action
app.get('/logout', (req, res) => {
    // Clear the cookies by setting them to an empty string and setting their expiration date to the past

    if (req.cookies.username) {
        res.clearCookie('username');
        res.clearCookie('password');
        // Optional: Redirect to login page or send a response
        res.redirect("/")
    }
    else {
        res.clearCookie('adminusername');
        res.clearCookie('adminpassword');
        // Optional: Redirect to login page or send a response
        res.redirect("/")
    }

})
function admincheck(req, res, next) {
    if (req.cookies.adminusername) {
        next()
    }
}

function usercheck(req, res, next) {
    if (req.cookies.username) {
        next()
    }
}

app.get("/admin/dashboard", admincheck, (req, res) => {
    var details = {}
    details.adminusername = req.cookies.adminusername
    res.render("admindashboard.pug", { cookies: details })
})

app.get("/user/dashboard", usercheck, (req, res) => {
    var details = {}
    details.username = req.cookies.username
    mongoose.connect("mongodb://localhost:27017").then(() => {
        users.findOne({username:req.cookies.username}).then((userdata) => {
            // console.log(userdata)
            courses.find().then((coursedata) => {
                // console.log(coursedata)
                res.render("userdashboard.pug",{ userinfo : userdata, courseinfo : coursedata, cookies: details })
            })
        })
    })
})
// app.get("/admin", (req,res) => {
//     var admin_details = {}
//     admin_details.username = req.cookies.username
//     admin_details.password = req.cookies.password
//     mongoose.connect("mongodb://localhost:27017").then((data) => {
//         courses.find({}).then((coursedata) => {
//             res.render("admin_home", {courseinfo : coursedata, cookies : admin_details})
//         })
//     })
// })

// ***********************************************************************

// this is imp, it will be used as a admin register form 
// after one admin is logged in, in there dashboard
// for time being we can comment this as, we will use only a single admin

// ***********************************************************************

app.get("/admin/register", admincheck, (req, res) => {
    res.sendFile(__dirname + "/public/adminregister.html")
})

app.post("/admin/register", admincheck, (req, res) => {
    // console.log(req.body.adminusername)
    // console.log(req.body.adminemail)
    // console.log(req.body.adminpassword)
    mongoose.connect("mongodb://localhost:27017").then((data) => {
        var newAdmin = new admins(req.body)
        newAdmin.save().then((admindata) => {
            // console.log(admindata)
            res.redirect("/admin/dashboard")
        })
    })
})

app.get("/admin/addcourse", admincheck, (req, res) => {
    res.sendFile(__dirname + "/public/formforcourses.html")
})

app.post("/admin/addcourse", admincheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then((data) => {
        var newCourse = new courses(req.body)
        newCourse.save().then((addacoursedata) => {
            res.redirect("/admin/dashboard")
        })
    })
})

app.get("/courses", usercheck, (req, res) => {
    mongoose.connect("mongodb://localhost:27017").then((data) => {
        courses.find({}).then((coursesdata) => {
            res.render("courses.pug", { coursesinfo: coursesdata })
        })
    })
})

app.get("/courses/:coursenickname", usercheck, (req, res) => {
    // console.log(req.params.coursenickname)
    mongoose.connect("mongodb://localhost:27017").then((data) => {
        courses.findOne({ coursenickname: req.params.coursenickname }).then((coursedata) => {
            // console.log(coursedata)
            res.render("acourse.pug", { eachcourseinfo: coursedata })
        })
    })
})

app.get("/subscribe/:coursename", usercheck, (req, res) => {
    var username = req.cookies.username;
    var coursename = req.params.coursename;
    mongoose.connect("mongodb://localhost:27017")
        .then(() => {
            const newPurchase = new purchases({
                username: username,
                coursename: coursename
            });

            newPurchase.save();
            res.redirect("/")
        })
})

app.get("/admin/approve", admincheck, (req, res) => {
    // console.log(req.cookies.username)
    mongoose.connect("mongodb://localhost:27017").then((data) => {
        purchases.find({}).then((purchasedata) => {
            // console.log(purchasedata)
            res.render("purchases.pug", { purchaseinfo: purchasedata })
        })
    })
})

app.get("/approve/:id/:username/:coursename", admincheck, (req, res) => {
    // console.log(req.params.coursename, req.params.username)
    mongoose.connect("mongodb://localhost:27017").then((data) => {
        users.findOneAndUpdate(
            { username: req.params.username }, // Filter
            { $push: { "courses": req.params.coursename } }, // Update: Push new course to courses array
        ).then(() => {
            purchases.findByIdAndDelete({ _id: req.params.id }).then((overalldata) => {
                // console.log(overalldata)
                res.redirect("/admin/approve")
            })
        })
    })
})

app.get("/decline/:username/:coursename", admincheck, (req, res) => {
    // console.log(req.params.coursename, req.params.username)
    mongoose.connect("mongodb://localhost:27017").then((data) => {
        // console.log(userdata)
        purchases.findOneAndDelete({ username: req.params.username }).then((overalldata) => {
            res.redirect("/admin/approve")
        })
    })
})

app.get("/:nickname/:info", usercheck, (req,res) => {
    // console.log(req.params.nickname)
    mongoose.connect("mongodb://localhost:27017").then((data) => {
        courses.findOne({coursenickname : req.params.nickname}).then((coursedata) => {
            // console.log(coursedata)
            var videodata = coursedata.coursevideos
            console.log(videodata)
            var videotitle = req.params.info
            console.log(videotitle)
            res.render("thecoursecontent.pug", {courseinfo : coursedata, video : videodata, videot : videotitle})
        })
    })
})

// app.get("/:nickname/:info", usercheck, (req,res) => {
//     mongoose.connect("mongodb://localhost:27017").then((data) => {
//         courses.findOne({coursenickname:req.params.nickname}).then((coursedata) => {
//             var videodata = coursedata.coursevideos
//             console.log(videodata)
//             var videotitle = req.params.info
//             console.log(videotitle)
//             res.render("videopage.pug", {video : videodata, videot : videotitle})
//         })
//     })
// })

app.listen("9999", () => {
    console.log("server running on 9999")
})