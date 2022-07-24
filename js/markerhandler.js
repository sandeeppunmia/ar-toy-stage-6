var uid = null;

AFRAME.registerComponent("markerhandler", {
  init: async function() {
    
    if(uid === null){
      this.askUid();
    }
    
    var toys = await this.getToys();

    this.el.addEventListener("markerFound", () => {
      if(uid !== null){
        var markerId = this.el.id;
        this.handleMarkerFound(toys, markerId);      }
    });

    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },
  askUid:function(){
    var iconUrl = "https://raw.githubusercontent.com/sandeeppunmia/Toy-Store-Icon/main/toys_store.jpg";

    swal({
      title:'Welcome to Curiosity!',
      icon:iconUrl,
      content:{
        element:"input",
        attributes:{
          placeholder:"Type Your UID (Eg:U01)",
          min:1
        }
      },
      closeOnClickOutside:false,
    }).then(inputValue=>{
      uid = inputValue;
    })
  },
  handleMarkerFound: function(toys, markerId) {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "flex";

    var orderButtton = document.getElementById("order-button");
    var orderSummaryButtton = document.getElementById("order-summary-button");
    var payButton = document.getElementById("pay-button");
    var ratingButton = document.getElementById("rating-button");

    // Handling Click Events
    orderButtton.addEventListener("click", () => {
      this.handleOrder();
      swal({
        icon: "https://i.imgur.com/4NZ6uLY.jpg",
        title: "Thanks For Order !",
        text: "  ",
        timer: 2000,
        buttons: false
      });
    });

    orderSummaryButtton.addEventListener("click", () => {
      this.handleOrderSummary();
    });

    payButton.addEventListener("click",()=>this.handlePayment());

    ratingButton.addEventListener("click",()=>this.handleRatings());

    // Changing Model scale to initial scale
    var toy = toys.filter(toy => toy.id === markerId)[0];

    var model = document.querySelector(`#model-${toy.id}`);
    model.setAttribute("visible",true);

    var description = document.querySelector(`#main-plane-${toy.id}`);
    description.setAttribute("visible",true);

    var pricePlane = document.createElement(`#price-plane-${toy.id}`);
    pricePlane.setAttribute("visible",true);

    if(toy.is_out_of_stock === "true"){
      swal({
        icon:"warning",
        title:toy.toy_name.toUpperCase(),
        text:"The toy is currently out of stock. Please check after some time!",
        timer:2500,
        buttons:false
      })
    } else {
      
    }
  },
  getToys: async function() {
    return await firebase
      .firestore()
      .collection("toys")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },
  handleMarkerLost: function() {
    // Changing button div visibility
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  },
  handleOrder:function(uid,toy){
    firebase
    .firestore()
    .collection("users")
    .doc(uid)
    .get()
    .then(doc=>{
      var details = doc.data();
      if(details["current_orders"][toy.id]){
        details["current_orders"][toy.id]["quantity"] += 1;
        var currentQuantity = details["current_orders"][toy.id]["quantity"];
        details["current_orders"][toy.id]["subtotal"] = currentQuantity*toy.price;
      } else {
        details["current_orders"][toy.id] = {
          item:toy.toy_name,
          price:toy.price,
          quantity:1,
          subtotal:toy.price * 1
        };
      }

      details.total_bill += toy.price;

      firebase
      .firestore()
      .collection("users")
      .doc(doc.id)
      .update(details);
    })
  },

  getOrderSummary:async function(uNumber){
    return await firebase
    .firestore()
    .collection('users')
    .doc(uNumber)
    .get()
    .then(doc=>doc.data());
  },

  handleOrderSummary:async function(){
    var orderSummary = await this.getOrderSummary(uNumber);
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";

    var tableBodyTag = document.getElementById("bill-table-body");
    tableBodyTag.innerHTML = ""

    var currentOrders  = Object.keys(orderSummary.currentOrders);
    currentOrders.map(i=>{
      var tr = document.createElement("tr");
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      item.innerHTML = orderSummary.currentOrders[i].item;
      
      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class","text-center");
      
      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class","text-center");
      
      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class","text-center");

      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);
      tableBodyTag.appendChild(tr);

      var totalTr = document.createElement("tr");
      
      var td1 = document.createElement("td");
      td1.setAttribute("class","no-line");

      var td2 = document.createElement("td");
      td1.setAttribute("class","no-line");

      var td3 = document.createElement("td");
      td1.setAttribute("class","no-line text-center");

      var strongTag =document.createElement("strong");
      strongTag.innerHTML = "Total";

      td3.appendChild(strongTag);

      var td4 = document.createElement("td");
      td1.setAttribute("class","no-line text-right");
      td4.innerHTML = "$" + orderSummary.total_bill;

      totalTr.appendChild(td1);
      totalTr.appendChild(td2);
      totalTr.appendChild(td3);
      totalTr.appendChild(td4);
      tableBodyTag.appendChild(totalTr);
    })
  },

  handlePayment:function(){
    document.getElementById("modal-div").style.display = "none";
    var uNumber;
    firebase
    .firestore()
    .collection("users")
    .doc(uNumber)
    .update({
      current_orders:{},
      total_bill:0
    })
    .then(()=>{
      swal({
        icon:"success",
        title:"Thanks for Paying!",
        text:"We hope you would like the toy!!",
        timer:2500,
        buttons:false
      })
    })
  },

  handleRatings:async function(toy){
    var uNumber;
    var orderSummary = await this.getOrderSummary();
    var currentOrders = Object.keys(orderSummary.current_orders);

    if(currentOrders.length>0 && currentOrders==toy.id){
      document.getElementById("rating-modal-div").style.display = "flex";
      document.getElementById("rating-input").value = "0";

      var saveRatingButton = document.getElementById("save-rating-button");
      saveRatingButton.addEventListener("click",()=>{
        document.getElementById("rating-modal-div").style.display = "none";
        var rating = document.getElementById("rating-input").value;
        
        firebase
        .firestore()
        .collection("toys")
        .doc(toy.id)
        .update({
          rating:rating
        })
        .then(()=>{
          swal({
            icon:"success",
            title:"Thanks for Rating!!",
            text:"We hope You Like The Toy!!",
            timer:2500,
            buttons:false
          })
        })
      })
    } 
  }

});