const { MongoClient } = require("mongodb");

/*
    Author: Calvin Smith
    ISU Netid : calsmith@iastate.edu
    Date :  5/02/2024
*/

const url = "mongodb://127.0.0.1:27017";
const dbName = "final";
const client = new MongoClient(url);
const db = client.db(dbName);

var express = require("express");
var cors = require("cors");
var app = express();

var fs = require("fs");
var bodyParser = require("body-parser");

//Helper Hash Function
function hash(str){
    var h = 0; 
    for (var i = 0; i < str.length; i++){
        h = (h << 5) - h + str.charCodeAt(i);
    }
    return h;
}

app.use(cors());
app.use(bodyParser.json());

const port = "8081";
const host = "localhost";

app.listen(port, () => {
    console.log("App listening at http://%s:%s", host, port);
});

//implement CRUD

//Create (Post)
app.post("/signup", async (req, res) => {
    try {
        await client.connect();
        var newUser = req.body;
        newUser.password = hash(newUser.password);
        newUser.confirmPass = hash(newUser.confirmPass);
        console.log(newUser);
        const exists = await db.collection("users").findOne({username: newUser.username});
        res.status(200);
        if (exists != null || newUser.confirmPass != newUser.password) {
            res.send(true);
        }
        else {
            res.send(false);
            await db.collection("users").insertOne(newUser);
        }
    } catch (error){
        console.error("errorrrrrr", error);
        res.status(500).send({error:"Internal Server Error"});
    }
});

app.post("/login", async (req, res) => {
    try {
        await client.connect();
        var newUser = req.body;
        newUser.password = hash(newUser.password);
        const existing = await db.collection("users").findOne({username: newUser.username});
        res.status(200);
        if (existing.password == newUser.password) {
            res.send(true);
        }
        else {
            res.send(false);
        }
    } catch (error){
        console.error("errorrrrrr", error);
        res.status(500).send({error:"Internal Server Error"});
    }
});

app.post("/post", async (req, res) => {
    try {
        await client.connect();
        
        var i = 1;
        while (await db.collection("media").findOne({id: i})) {
            i++;
        }
        var doc = req.body;
        
        doc.id = i;
        console.log(doc);
        await db.collection("media").insertOne(doc);
    } catch (error){
        console.error("error", error);
    }
});

//Read (Get)
app.get("/:type", async (req, res) => {
    const type = Number(req.params.type);
    try {
        await client.connect();
        const query = { type: type };
        const results = await db.collection("media").find(query).limit(100).toArray();
        if (!results) {
            res.status(404).send("media not found");
            return;
        }
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching media:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/", async (req, res) => {
    const type = Number(req.params.type);
    try {
        await client.connect();
        const results = await db.collection("media").find().limit(100).toArray();
        if (!results) {
            res.status(404).send("media not found");
            return;
        }
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching media:", error);
        res.status(500).send("Internal Server Error");
    }
});

//Update (Put)
app.put("/karma", async (req, res) => {
    try {
        await client.connect();
        var id = Number(req.body.id);
        var isLike = Boolean(req.body.lik);
        if (isLike) {
            console.log("recieved like");
            await db.collection("media").updateOne({id: id}, {$inc : {likes: 1}});
        }
        else {
            console.log("recieved dislike");
            await db.collection("media").updateOne({id: id}, {$inc : {dislikes: 1}});
        }
        res.status(200);
        res.send("successful");
    } catch (error){
        console.error("errorrrrrr", error);
        res.status(500).send({error:"Internal Server Error"});
    }
});

app.put("/comment", async (req, res) => {
    try {
        const id = Number(req.body.id);
        const comment = String(req.body.comment);
        await client.connect();
        const result = await db.collection("media").updateOne({id: id}, {$push: {comments: comment}});
    } catch (error) {
        console.error("er", error);
        res.status(500).send({error: "Internal Server Error"});
    }
});

//Delete (Delete)
app.delete("/:id", async (req, res) => {
    console.log(req.params);
    const id = Number(req.params.id);
    try {
        console.log("attempting delete of: ", id);
        await client.connect();
        const query = {id: id};
        console.log(query);
        const results = await db.collection("media").deleteOne(query);
        res.send(results);
        res.status(200);
    } catch (error){
        console.error("Error Deleting Media", error);
        res.status(500).send("Internal Server Error");
    }
});