document.addEventListener("DOMContentLoaded", () => {
  const produceList = document.getElementById("produce-list");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const browseAllBtn = document.getElementById("browseAllBtn");
  const cartTabBtn = document.querySelector('.tab-btn[data-tab="cart"]');
  const tabProduce = document.getElementById("tab-produce");
  const tabCart = document.getElementById("tab-cart");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const cartList = document.getElementById("cart-list");

  let allProduce = [];

  // Load all produce
  fetch("http://localhost:3000/produce")
    .then(res => res.json())
    .then(data => {
      allProduce = data;
      displayProduce(allProduce);
    })
    .catch(err => console.error("Error fetching produce:", err));

  // Filter and switch to Produce tab
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-type");
      const filtered = type === "all"
        ? allProduce
        : allProduce.filter(p => p.type === type);

      displayProduce(filtered);
      tabProduce.classList.add("active");
      tabCart.classList.remove("active");
    });
  });

  if (browseAllBtn) {
    browseAllBtn.addEventListener("click", () => {
      displayProduce(allProduce);
      tabProduce.classList.add("active");
      tabCart.classList.remove("active");
    });
  }

  if (cartTabBtn) {
    cartTabBtn.addEventListener("click", () => {
      fetchCartItems();
    });
  }

  function displayProduce(produceArray) {
    produceList.innerHTML = "";
    produceArray.forEach(produce => renderProduceCard(produce));
  }

  function renderProduceCard(produce) {
    const card = document.createElement("div");
    card.className = "produce-card";
    card.innerHTML = `
      <img src="${produce.image}" alt="${produce.name}" style="width:100%; border-radius:10px; height:150px; object-fit:cover;">
      <h3 class="card-title">${produce.name}</h3>
      <p class="card-price"><strong>Price:</strong> Ksh.${produce.price} per Kg</p>
    `;

    card.addEventListener("click", (e) => {
      // Prevent if clicked inside already visible quantity section
      if (e.target.closest(".quantity-section")) return;

      const existingQtySection = card.querySelector(".quantity-section");

      if (existingQtySection) {
        existingQtySection.remove(); // hide if already there
      } else {
        const qtyDiv = document.createElement("div");
        qtyDiv.className = "quantity-section";
        qtyDiv.innerHTML = `
          <label>Quantity (kg):</label>
          <input type="number" min="1" value="1" class="qty-input" />
          <button class="bought-btn">Add to Cart</button>
        `;

        card.appendChild(qtyDiv);

        // Prevent click bubbling when interacting with button
       qtyDiv.querySelector(".bought-btn").addEventListener("click", (event) => {
       event.stopPropagation(); // prevent card click
       const qty = parseInt(qtyDiv.querySelector(".qty-input").value) || 1;
       checkAndAddToCart(produce, qty);
       qtyDiv.remove();
       });

      }
    });

    produceList.appendChild(card);
  }

  function checkAndAddToCart(item, quantity) {
    if (item.name.toLowerCase() === "sesame") {
      alert("Sesame cannot be added to the cart.");
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

  function addToCart(item, quantity) {
    const totalAmount = item.price * quantity;

    fetch("http://localhost:3000/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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

  function fetchCartItems() {
    tabCart.classList.add("active");
    tabProduce.classList.remove("active");

    fetch("http://localhost:3000/cart")
      .then(res => res.json())
      .then(data => displayCart(data))
      .catch(err => console.error("Error fetching cart items:", err));
  }

  function displayCart(cartData) {
    cartList.innerHTML = "";
    cartData.forEach(item => {
      const cartCard = document.createElement("div");
      cartCard.className = "cart-card";
      cartCard.innerHTML = `
        <img src="${item.image}" alt="${item.name}" style="width:265px; border-radius:10px; height:150px; object-fit:cover;">
        <h3 class="card-title">${item.name}</h3>
        <p><strong>Quantity:</strong> ${item.quantity} kg</p>
        <p><strong>Total Amount:</strong> Ksh.${item.total}</p>
        <div class="card-del-edit">
          <button class="delete-btn">Remove</button>
          <button class="edit-btn">Edit</button>
        </div>
      `;

      cartCard.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm(`Are you sure you want to remove ${item.name} from the cart?`)) {
          fetch(`http://localhost:3000/cart/${item.id}`, {
            method: "DELETE"
          })
          .then(() => fetchCartItems())
          .catch(err => console.error("Delete error:", err));
        }
      });

      cartList.appendChild(cartCard);
    });
  }

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

      const firstMatch = found[0].name.toLowerCase();
      setTimeout(() => {
        const cardToBlink = [...document.querySelectorAll(".produce-card")].find(card =>
          card.querySelector(".card-title")?.textContent.toLowerCase().includes(firstMatch)
        );
        if (cardToBlink) {
          cardToBlink.style.border = "2px solid red";
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

  searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") handleSearch();
  });

  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }
});
