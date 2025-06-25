document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const produceList = document.getElementById("produce-list");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const browseAllBtn = document.getElementById("browseAllBtn");
  const cartTabBtn = document.querySelector('.tab-btn[data-tab="cart"]');
  const tabProduce = document.getElementById("tab-produce");
  const tabCart = document.getElementById("tab-cart");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const cartList = document.getElementById("cart-list");
  const deliveryInput = document.getElementById("deliveryDistance");
  const deliveryCostDisplay = document.getElementById("deliveryCostDisplay");
  const checkoutBtn = document.getElementById("checkoutBtn");

  let allProduce = [];

  // Delivery fees by county
  const countyFees = {
    "Baringo": 300, "Bomet": 300, "Bungoma": 400, "Busia": 400,
    "Elgeyo Marakwet": 350, "Embu": 250, "Garissa": 600, "Homa Bay": 450,
    "Isiolo": 550, "Kajiado": 250, "Kakamega": 400, "Kericho": 350,
    "Kiambu": 200, "Kilifi": 500, "Kirinyaga": 250, "Kisii": 400,
    "Kisumu": 450, "Kitui": 300, "Kwale": 500, "Laikipia": 300,
    "Lamu": 600, "Machakos": 250, "Makueni": 250, "Mandera": 700,
    "Marsabit": 700, "Meru": 300, "Migori": 450, "Mombasa": 500,
    "Murang'a": 250, "Nairobi": 150, "Nakuru": 300, "Nandi": 350,
    "Narok": 300, "Nyamira": 400, "Nyandarua": 250, "Nyeri": 250,
    "Samburu": 600, "Siaya": 450, "Taita Taveta": 500, "Tana River": 600,
    "Tharaka-Nithi": 250, "Trans Nzoia": 400, "Turkana": 700,
    "Uasin Gishu": 350, "Vihiga": 400, "Wajir": 700, "West Pokot": 600
  };

  // Fetch produce from backend
  fetch("http://localhost:3000/produce")
    .then(res => res.json())
    .then(data => {
      allProduce = data;
      displayProduce(allProduce);
    })
    .catch(err => console.error("Error fetching produce:", err));

  // Filter buttons (fruit/veg/grain)
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-type");
      const filtered = type === "all" ? allProduce : allProduce.filter(p => p.type === type);
      displayProduce(filtered);
      tabProduce.classList.add("active");
      tabCart.classList.remove("active");
    });
  });

  // Browse all produce
  if (browseAllBtn) {
    browseAllBtn.addEventListener("click", () => {
      displayProduce(allProduce);
      tabProduce.classList.add("active");
      tabCart.classList.remove("active");
    });
  }

  // Load cart tab
  if (cartTabBtn) {
    cartTabBtn.addEventListener("click", fetchCartItems);
  }

  // Display all produce items
  function displayProduce(produceArray) {
    produceList.innerHTML = "";
    produceArray.forEach(produce => renderProduceCard(produce));
  }

  // Create individual produce card
  function renderProduceCard(produce) {
    const card = document.createElement("div");
    card.className = "produce-card";
    card.innerHTML = `
      <img src="${produce.image}" alt="${produce.name}" style="width:100%; border-radius:10px; height:150px; object-fit:cover;">
      <h3 class="card-title">${produce.name}</h3>
      <p class="card-price"><strong>Price:</strong> Ksh.${produce.price} per Kg</p>
    `;

    // Toggle quantity section on card click
    card.addEventListener("click", (e) => {
      if (e.target.closest(".quantity-section")) return;
      const existingQty = card.querySelector(".quantity-section");
      if (existingQty) {
        existingQty.remove();
      } else {
        const qtyDiv = document.createElement("div");
        qtyDiv.className = "quantity-section";
        qtyDiv.innerHTML = `
          <label>Quantity (kg):</label>
          <input type="number" min="1" value="1" class="qty-input" />
          <button class="bought-btn">Add to Cart</button>
        `;
        card.appendChild(qtyDiv);

        qtyDiv.querySelector(".bought-btn").addEventListener("click", (event) => {
          event.stopPropagation();
          const qty = parseInt(qtyDiv.querySelector(".qty-input").value) || 1;
          checkAndAddToCart(produce, qty);
          qtyDiv.remove();
        });
      }
    });

    produceList.appendChild(card);
  }

  // Prevent duplicates and mangoes
  function checkAndAddToCart(item, quantity) {
    if (item.name.toLowerCase() === "mangoes") {
      alert("Mangoes cannot be added to the cart.");
      return;
    }

    fetch("http://localhost:3000/cart")
      .then(res => res.json())
      .then(data => {
        const exists = data.some(prod => prod.id === item.id);
        if (exists) {
          alert(`${item.name} is already in the cart.`);
        } else {
          addToCart(item, quantity);
        }
      })
      .catch(err => console.error("Error checking cart:", err));
  }

  // Add item to cart (POST)
  function addToCart(item, quantity) {
    const totalAmount = item.price * quantity;

    fetch("http://localhost:3000/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        name: item.name,
        quantity,
        type: item.type,
        price: item.price,
        image: item.image,
        total: totalAmount
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to add to cart");
        alert(`${item.name} (${quantity} kg) added to cart`);
      })
      .catch(err => console.error("Cart POST error:", err));
  }

  // Fetch and show all cart items
  function fetchCartItems() {
    tabCart.classList.add("active");
    tabProduce.classList.remove("active");

    fetch("http://localhost:3000/cart")
      .then(res => res.json())
      .then(data => displayCart(data))
      .catch(err => console.error("Error fetching cart items:", err));
  }

  // Render cart
  function displayCart(cartData) {
    cartList.innerHTML = "";
    cartData.forEach(item => {
      const cartCard = document.createElement("div");
      cartCard.className = "cart-card";
      cartCard.innerHTML = `
        <img src="${item.image}" alt="${item.name}" style="width:260px; border-radius:10px; height:150px; object-fit:cover;">
        <h3 class="card-title">${item.name}</h3>
        <p><strong>Quantity:</strong> <span class="item-qty">${item.quantity}</span> kg</p>
        <p><strong>Total Amount:</strong> Ksh.<span class="item-total">${item.total}</span></p>
        <div class="card-del-edit">
          <button class="delete-btn">Remove</button>
          <button class="edit-btn">Edit</button>
        </div>
      `;

      // Delete item
      cartCard.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm(`Remove ${item.name} from the cart?`)) {
          fetch(`http://localhost:3000/cart/${item.id}`, { method: "DELETE" })
            .then(() => fetchCartItems())
            .catch(err => console.error("Delete error:", err));
        }
      });

      // Edit quantity
      cartCard.querySelector(".edit-btn").addEventListener("click", () => {
        const newQty = prompt(`Enter new quantity (kg) for ${item.name}:`, item.quantity);
        const parsedQty = parseInt(newQty);
        if (isNaN(parsedQty) || parsedQty <= 0) {
          alert("Invalid quantity.");
          return;
        }

        const updatedTotal = parsedQty * item.price;

        fetch(`http://localhost:3000/cart/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: parsedQty, total: updatedTotal })
        })
          .then(res => {
            if (!res.ok) throw new Error("Failed to update item.");
            fetchCartItems();
          })
          .catch(err => console.error("Patch error:", err));
      });

      cartList.appendChild(cartCard);
    });
  }

  // Search functionality
  function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) return;

    const found = allProduce.filter(item =>
      item.name.toLowerCase().includes(searchTerm)
    );

    if (found.length === 0) {
      alert("Produce not found!");
    } else {
      tabProduce.classList.add("active");
      tabCart.classList.remove("active");
      displayProduce(found);

      // Highlight match
      const firstMatch = found[0].name.toLowerCase();
      setTimeout(() => {
        const cardToBlink = [...document.querySelectorAll(".produce-card")].find(card =>
          card.querySelector(".card-title")?.textContent.toLowerCase().includes(firstMatch)
        );
        if (cardToBlink) {
          cardToBlink.style.border = "2px solid green";
          cardToBlink.style.animation = "blink 1s 3";
          setTimeout(() => {
            cardToBlink.style.border = "none";
            cardToBlink.style.animation = "none";
          }, 3000);
        }
      }, 200);
    }

    searchInput.value = "";
  }

  // Search events
  searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") handleSearch();
  });
  if (searchBtn) searchBtn.addEventListener("click", handleSearch);

  // Checkout and calculate totals
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async () => {
      const rawCounty = deliveryInput.value.trim();
      const formattedCounty = rawCounty
        .toLowerCase()
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      if (!countyFees.hasOwnProperty(formattedCounty)) {
        alert(`Invalid county entered: "${rawCounty}".\n\nPlease enter a valid Kenyan county such as:\n- Nairobi\n- Kisumu\n- Nakuru\n- Mombasa`);
        return;
      }

      const deliveryFee = countyFees[formattedCounty];

      try {
        const response = await fetch("http://localhost:3000/cart");
        const cartData = await response.json();

        if (cartData.length === 0) {
          alert("Your cart is empty!");
          return;
        }

        const cartTotal = cartData.reduce((sum, item) => sum + item.total, 0);
        const totalPayable = cartTotal + deliveryFee;

        deliveryCostDisplay.textContent = `County: ${formattedCounty} | Delivery: Ksh.${deliveryFee} | Cart: Ksh.${cartTotal} | Total: Ksh.${totalPayable}`;
        showPaymentInstructions(totalPayable);
      } catch (err) {
        console.error("Checkout error:", err);
        alert("Could not calculate total.");
      }
    });
  }
});

// Display payment instructions
function showPaymentInstructions(amount) {
  alert(`Total to pay: Ksh.${amount}\n\nSend to Pochi La Biashara: 0742179262`);
}
