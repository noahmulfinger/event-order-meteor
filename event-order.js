var ADMIN = 'admin';
var ADMIN_PASS = 'admin_pass'

Orders = new Mongo.Collection("orders");
Options = new Mongo.Collection("options");

Router.route('/', function () {
  this.render('home');
});

// Router.route('/logout', function () {
//   this.render('home');
// });

if (Meteor.isServer) {
  Meteor.publish("orders", function () {
    if (!this.userId) return [];
    var user = Meteor.users.findOne(this.userId);
    if (user.profile.admin) {
      return Orders.find({});
    } else {
      return Orders.find({ ownerId: this.userId });
    }
    
  });

  Meteor.publish("options", function () {
    return Options.find({});
  });

}


if (Meteor.isClient) {

  Deps.autorun(function() {
    Meteor.subscribe('orders');
  });
  Deps.autorun(function() {
    Meteor.subscribe('options');
  });


  Template.home.helpers({
    isAdmin: function() {
      return Meteor.user() && Meteor.user().profile.admin;
    }
  });

  Template.addOption.events({
    "submit .new-option": function (event) {
      // Prevent default browser form submit
      event.preventDefault();
 
      // Get value from form element
      var text = event.target.text.value;
 
      // Insert a task into the collection
      Meteor.call("addOption", text);
 
      // Clear form
      event.target.text.value = "";
    }
  });


  Template.addOrder.events({
    "submit .new-order": function (event) {
      event.preventDefault();

      var options = Options.find({}).map(function(x) { return x.name; });

      var order = []

      for (i = 0; i < options.length; i++)  {
        var value = event.target[options[i]].value;
        order.push({name: options[i], count: value});
        event.target[options[i]].value = "0";
      }

      Meteor.call("addOrder", order);
      
    }
  });


  Template.optionList.helpers({
    options: function () {
      return Options.find({});
    }
  });

  Template.addOption.helpers({
    options: function () {
      return Options.find({});
    }
  });

  Template.option.events({
    "click .delete": function () {
      Meteor.call("deleteOption", this._id)
    }
  });

  Template.orderList.helpers({
    orders: function () {
      return Orders.find({});
    }  
  });

  Template.order.helpers({
    canDisplay: function () {
      return this.ownerId === Meteor.userId() || Meteor.user().isAdmin;
    }
  });

  Template.addOrder.helpers({
    options: function () {
      return Options.find({});
    }  
  });

  Template.order.events({
    "click .delete": function () {
      Meteor.call("deleteOrder",  this._id)
    }
  });


  Template.register.events({
    "submit .register": function(event) {
      event.preventDefault();
      var username = event.target.username.value;
      var password = event.target.password.value;
      Accounts.createUser({
        username: username,
        password: password,
        profile: {admin: false}
      }, function(error) {
        if(error){
          console.log(error.reason);
        }
      });
    }
  });

  Template.login.events({
    "submit .login": function(event) {
      event.preventDefault();
      var username = event.target.username.value;
      var password = event.target.password.value;
      Meteor.loginWithPassword(username, password, function(error){
        if(error){
          console.log(error.reason);
        }
      });
    }
  });

  Template.logout.events({
    "submit .logout": function(event) {
      event.preventDefault();
      Meteor.logout(function(error){
        if(error){
          console.log(error.reason);
        }
      });
    }
  });
}

Meteor.methods({
  addOrder: function (order) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Orders.insert({
      ownerId: Meteor.userId(),
      ownerName: Meteor.user().username,
      list: order,
      createdAt: new Date()
    });
  },

  addOption: function(text) {
    if (!Meteor.user().profile.admin){
      throw new Meteor.Error("not-authorized");
    }
    Options.insert({
      name: text,
      createdAt: new Date()
    });
  },
  deleteOrder: function (orderId) {
    var order = Orders.findOne(orderId);
    if (order.ownerId != Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }   
    Orders.remove(orderId);
  },

  deleteOption: function (optionId) {
    if (!Meteor.user().profile.admin){
      throw new Meteor.Error("not-authorized");
    }
    Options.remove(optionId);
  }
});

Meteor.users.deny({  
    update: function() {
      return true;
    }
  });

