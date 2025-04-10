if(process.env.NODE_ENV != "production") {
    require("dotenv").config();    
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const port = 8080;
const Listing = require("./models/listing.js"); //Requiring Listing Model
const path = require("path");
const methodOverride = require("method-override"); //Method_Override for patch,put and delete verbs
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/review.js");
const validationSchema = require("./schema.js"); //Joi
const listingRouter = require("./routes/listings.js"); //Express Router
const reviewRouter = require("./routes/reviews.js");
const cookieParser = require('cookie-parser');
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport"); //For Authentication
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js"); //Express Router

const sessionOptions = {
    secret:"SecretCode",
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now() + 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true
    },
};

app.set("views engine","ejs");
app.set("views",path.join(__dirname, "/views" ));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs" , ejsMate);
app.use(express.static(path.join(__dirname , "public/CSS")));
app.use(express.static(path.join(__dirname , "public/JS")));
app.use(cookieParser("secretCode"));
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/stayeasy");
};

main()
.then(() => {
    console.log("Connected to DataBase");
})
.catch((err) => {
    console.log(err);
});

//Root Route
app.get("/" , async (req,res) => {
    res.send("Hi, I'm root!")
});



//Flash MiddleWare
app.use((req,res,next) => {
    res.locals.successMsg = req.flash("success");
    res.locals.errorMsg = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/listings" , listingRouter);
app.use("/listings/:id/reviews" , reviewRouter);
app.use("/" , userRouter);


app.all("*" , (req,res,next) => {
    next(new ExpressError(404,"Page Not Found"));
});

//Custom Error Handler
app.use((err,req,res,next) => {
    //res.send(err.name);
    //res.send("Something Went Wrong!!");
    console.log(err);
    let {statusCode = 500 , message="Something Went Wrong!"} = err;
    res.status(statusCode).render("error.ejs",{statusCode,message});
});

//Listening To API Requests
app.listen(port, () => {
    console.log("Server has Started");
});