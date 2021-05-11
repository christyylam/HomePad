//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const http = require("http");
const _ = require("lodash");
const date = require(__dirname + "/date.js");
const day = date.getDate();
// const config = require(__dirname + "/config.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-christy:test123@cluster0.kmjph.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your To Do List!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<--- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("successfully saved default items to database");
          res.redirect("/");
        }
      });
    } else {
    res.render("list", {listTitle: day, newListItems: foundItems});
  }
});
});


app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

List.findOne({name: customListName}, function(err, foundList) {
  if(!err) {
    if(!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }
});
});

app.post("/weather", function(req, res) {
  const query = req.body.cityName;;
  // const apiKey = config.key;
  const apiKey = process.env.key;
  const units = "metric";
  const url = "https://api.openweathermap.org/data/2.5/weather?q=" + query + "&appid=" + apiKey+ "&units=" + units;
  https.get(url, function(response) {
    response.on("data", function(data) {
      const weatherData = JSON.parse(data);
      const temp = weatherData.main.temp;
      const weatherDescription = weatherData.weather[0].description;
      const icon = weatherData.weather[0].icon;
      const imageURL = "http://openweathermap.org/img/wn/" + icon + "@2x.png";
      res.render("weather", {location: query, temperature: temp, description: weatherDescription, url: imageURL});
    });
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name: itemName
  });

  if(listName === day) {
      newItem.save(function(err) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/");
        }
      });
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save(function(err) {
        if(err) {
          console.log(err);
        } else {
          res.redirect("/" + listName);
        }
      });
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === day) {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("successfully removed checked item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

let port = process.env.PORT;

app.listen(port, function() {
  console.log("Server started successfully");
});
