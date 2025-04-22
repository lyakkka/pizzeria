document.addEventListener('DOMContentLoaded', function() {
    // Initialize language from localStorage or default to Russian
    const savedLanguage = localStorage.getItem('language') || 'ru';
    changeLanguage(savedLanguage);

    // Cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const cartItemsContainer = document.querySelector('.cart-items');
    const totalItemsElement = document.querySelector('.total-items');
    const totalPriceElement = document.querySelector('.total-price');
    const promoInput = document.getElementById('promo-input');
    const applyPromoBtn = document.getElementById('apply-promo');
    const promoMessage = document.getElementById('promo-message');
    const checkoutBtn = document.getElementById('checkout-btn');
    const emptyCartDiv = document.querySelector('.empty-cart');
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let activePromo = localStorage.getItem('activePromo') || null;

    // Add to cart functionality
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemName = this.getAttribute('data-name');
            const itemPrice = parseInt(this.getAttribute('data-price'));
            
            // Check if item already exists in cart
            const existingItem = cart.find(item => item.name === itemName);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    name: itemName,
                    price: itemPrice,
                    quantity: 1
                });
            }
            
            updateCart();
            
            // Show notification based on current language
            let message;
            switch(currentLanguage) {
                case 'ru':
                    message = `${itemName} добавлена в корзину!`;
                    break;
                case 'kz':
                    message = `${itemName} себетке қосылды!`;
                    break;
                case 'en':
                    message = `${itemName} added to cart!`;
                    break;
                default:
                    message = `${itemName} добавлена в корзину!`;
            }
            
            showNotification(message);
        });
    });

    // Update cart function
    function updateCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count in header
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        const cartCountElements = document.querySelectorAll('#cart-count');
        
        cartCountElements.forEach(element => {
            element.textContent = cartCount;
        });
        
        // Render cart items on cart page
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';
            
            if (cart.length === 0) {
                emptyCartDiv.style.display = 'block';
                cartItemsContainer.style.display = 'none';
                document.querySelector('.cart-summary').style.display = 'none';
                return;
            } else {
                emptyCartDiv.style.display = 'none';
                cartItemsContainer.style.display = 'flex';
                document.querySelector('.cart-summary').style.display = 'block';
            }
            
            let totalItems = 0;
            let subtotal = 0;
            
            cart.forEach((item, index) => {
                totalItems += item.quantity;
                
                // Apply every 5th pizza free promotion
                const freePizzaCount = Math.floor(item.quantity / 5);
                const paidQuantity = item.quantity - freePizzaCount;
                const itemTotal = paidQuantity * item.price;
                
                subtotal += itemTotal;
                
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <div class="item-image">
                        <img src="${getPizzaImage(item.name)}" alt="${item.name}">
                    </div>
                    <div class="item-details">
                        <h3 class="item-name">${item.name}</h3>
                        <p class="item-price">${item.price} тг</p>
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-btn decrease">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn increase">+</button>
                    </div>
                    <button class="remove-btn">
                        <i class="fas fa-times"></i>
                    </button>
                    ${freePizzaCount > 0 ? 
                        `<div class="promo-applied">
                            ${currentLanguage === 'ru' ? `+${freePizzaCount} бесплатно` :
                              currentLanguage === 'kz' ? `+${freePizzaCount} тегін` :
                              `+${freePizzaCount} free`}
                        </div>` : ''
                    }
                `;
                
                cartItemsContainer.appendChild(itemElement);
                
                // Add event listeners for quantity buttons
                const decreaseBtn = itemElement.querySelector('.decrease');
                const increaseBtn = itemElement.querySelector('.increase');
                const removeBtn = itemElement.querySelector('.remove-btn');
                
                decreaseBtn.addEventListener('click', () => {
                    if (item.quantity > 1) {
                        item.quantity -= 1;
                    } else {
                        cart.splice(index, 1);
                    }
                    updateCart();
                });
                
                increaseBtn.addEventListener('click', () => {
                    item.quantity += 1;
                    updateCart();
                });
                
                removeBtn.addEventListener('click', () => {
                    cart.splice(index, 1);
                    updateCart();
                });
            });
            
            // Apply promo code discount if active
            let discount = 0;
            if (activePromo === 'FREEPIZZA' && cart.length >= 4) {
                // Find the cheapest pizza and make it free
                const cheapestPizza = [...cart].sort((a, b) => a.price - b.price)[0];
                discount = cheapestPizza.price;
                
                // Show promo applied message
                promoMessage.textContent = currentLanguage === 'ru' ? 'Акция применена! 1 пицца бесплатно' :
                                         currentLanguage === 'kz' ? 'Акция қолданылды! 1 пицца тегін' :
                                         'Promo applied! 1 pizza free';
                promoMessage.className = 'promo-message success';
            }
            
            const deliveryFee = subtotal > 0 ? 500 : 0;
            const total = subtotal - discount + deliveryFee;
            
            totalItemsElement.textContent = totalItems;
            totalPriceElement.textContent = `${total} тг`;
            
            // Show discount if applied
            if (discount > 0) {
                const discountElement = document.querySelector('.summary-row.discount');
                discountElement.style.display = 'flex';
                discountElement.querySelector('.discount-amount').textContent = `-${discount} тг`;
            } else {
                document.querySelector('.summary-row.discount').style.display = 'none';
            }
        }
    }

    // Helper function to get pizza image by name
    function getPizzaImage(name) {
        const pizzaImages = {
            'Креветки с песто': 'https://media.dodostatic.net/image/r:584x584/01962455dc34712a8cb6f6f6ecd2e3f6.avif',
            'С кониной': 'https://media.dodostatic.net/image/r:584x584/0195dc9b4b337495885960cd8096b513.avif',
            'Чилл Грилл': 'https://media.dodostatic.net/image/r:584x584/0195dc9a4c9b7351921143730d531529.avif',
            'Пицца из половинок': 'https://media.dodostatic.net/image/r:584x584/0195dc96b2da74aabee7a671f52b731b.avif',
            'Сырная': 'https://media.dodostatic.net/image/r:584x584/11ee7d5f837255b58b25a62c60ffdb38.avif',
            'Пепперони фреш': 'https://media.dodostatic.net/image/r:584x584/11ee7d5f9d4f264d98d40bf411913db1.avif',
            'Ветчина и сыр': 'https://media.dodostatic.net/image/r:584x584/11ee7d5f6df65f019bf69e6d8b69551f.avif',
            'Двойной цыпленок': 'https://media.dodostatic.net/image/r:584x584/11ee7d5fabaed8998cac0985bfb698fa.avif',
            'Песто': 'https://media.dodostatic.net/image/r:584x584/0195dc95aa35712e80fc35c3e412e6b1.avif',
            'Сырный цыпленок': 'https://media.dodostatic.net/image/r:584x584/11ee7d5f84d55746a7eeef68cd89c1b1.avif',
            'Жюльен': 'https://media.dodostatic.net/image/r:584x584/11ee7d5fd6097096b601585d57f44a6f.avif',
            'Четыре сезона': 'https://media.dodostatic.net/image/r:584x584/11ee7d5f92dfcd9e84600c4dd6b916d4.avif'
        };
        return pizzaImages[name] || 'https://via.placeholder.com/100';
    }

    // Promo code functionality
    if (applyPromoBtn && promoInput) {
        applyPromoBtn.addEventListener('click', function() {
            const promoCode = promoInput.value.trim().toUpperCase();
            
            // Check promo code
            if (promoCode === 'FREEPIZZA') {
                activePromo = 'FREEPIZZA';
                localStorage.setItem('activePromo', 'FREEPIZZA');
                
                // Update message based on language
                promoMessage.textContent = currentLanguage === 'ru' ? 'Промокод применен!' :
                                         currentLanguage === 'kz' ? 'Промокод қолданылды!' :
                                         'Promo code applied!';
                promoMessage.className = 'promo-message success';
                
                updateCart();
            } else {
                // Show error in current language
                promoMessage.textContent = currentLanguage === 'ru' ? 'Неверный промокод' :
                                         currentLanguage === 'kz' ? 'Промокод қате' :
                                         'Invalid promo code';
                promoMessage.className = 'promo-message error';
            }
        });
    }

    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.length === 0) {
                // Show alert in current language
                const message = currentLanguage === 'ru' ? 'Ваша корзина пуста!' :
                              currentLanguage === 'kz' ? 'Сіздің себетіңіз бос!' :
                              'Your cart is empty!';
                showNotification(message);
                return;
            }
            
            // Show success message in current language
            const message = currentLanguage === 'ru' ? 'Заказ оформлен! Спасибо за покупку!' :
                          currentLanguage === 'kz' ? 'Тапсырыс рәсімделді! Сатып алуға рахмет!' :
                          'Order placed! Thank you for your purchase!';
            
            showNotification(message);
            
            // Clear cart and promo
            cart = [];
            activePromo = null;
            localStorage.removeItem('cart');
            localStorage.removeItem('activePromo');
            updateCart();
        });
    }

    // Initialize cart on page load
    updateCart();

    // Show notification function
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.createElement('div');
    mobileMenuToggle.className = 'mobile-menu-toggle';
    mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.appendChild(mobileMenuToggle);
    
    const nav = document.querySelector('nav');
    mobileMenuToggle.addEventListener('click', function() {
        nav.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
});

// Function to change language
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update HTML lang attribute
    document.documentElement.setAttribute('lang', lang);
    
    // Update all translatable elements
    const translations = {
        ru: {
            // Header
            'menu-link': 'МЕНЮ',
            'promotions-link': 'АКЦИИ',
            'delivery-link': 'ДОСТАВКА',
            
            // Hero section
            'hero-title': 'Небольшое уютное место на пешеходной улице города',
            'hero-text': 'С домашней пиццей и оригинальными итальянскими рецептами. Попробуйте кусочек или закажите целую пиццу. У нас работает круглосуточная доставка по городу в течение часа. Мы привезем пиццу горячей!',
            
            // Menu section
            'menu-title': 'Меню Viva la pizza',
            
            // Delivery info
            'delivery-title': 'Доставка и оплата',
            'delivery-highlight-title': '60 МИНУТ ИЛИ ПИЦЦА БЕСПЛАТНО',
            'delivery-highlight-text': 'Если мы не успеем доставить любые продукты, кроме сувениров и соусов, за 60 минут, вы получите извинительную пиццу. Её можно будет добавить в один из следующих заказов.',
            'min-order-text': 'Минимальная сумма доставки',
            'max-cash-text': 'Максимальная сумма при оплате наличными',
            'product-note': 'Изображения продуктов могут отличаться от продуктов в заказе.',
            
            // Promo section
            'promo-title': 'КАЖДАЯ ПЯТАЯ ПИЦЦА БЕСПЛАТНО',
            'promo-text': 'Акция действует при заказе от 4 пицц',
            'order-btn': 'Сделать заказ: +7 771 295 75 28',
            
            // Cart page
            'page-title': 'Корзина - VIVA LA PIZZA',
            'cart-title': 'Ваша корзина',
            'empty-cart': 'Ваша корзина пуста',
            'items-text': 'Товары:',
            'total-text': 'К оплате:',
            'promo-placeholder': 'Промокод',
            'apply-promo': 'Применить',
            'checkout-btn': 'Оформить заказ'
        },
        kz: {
            // Header
            'menu-link': 'МӘЗІР',
            'promotions-link': 'АКЦИЯЛАР',
            'delivery-link': 'ЖЕТКІЗУ',
            
            // Hero section
            'hero-title': 'Қаланың жаяу алаңындағы шағын ыңғайлы орын',
            'hero-text': 'Үй пиццасымен және оригиналды италияндық рецептермен. Кесекті сынап көріңіз немесе тұтас пиццаға тапсырыс беріңіз. Бізде қала бойынша бір сағат ішінде тәулік бойы жеткізу қызметі бар. Біз пиццаны ыстық келтіреміз!',
            
            // Menu section
            'menu-title': 'Viva la pizza мәзірі',
            
            // Delivery info
            'delivery-title': 'Жеткізу және төлем',
            'delivery-highlight-title': '60 МИНУТ НЕМЕСЕ ПИЦЦА ТЕГІН',
            'delivery-highlight-text': 'Егер біз 60 минут ішінде сувенирлер мен тұздықтардан басқа кез келген өнімді жеткізе алмасақ, сіз кешірім сұрайтын пицца аласыз. Оны келесі тапсырыстардың біріне қосуға болады.',
            'min-order-text': 'Жеткізу үшін минималды сома',
            'max-cash-text': 'Қолма-қол ақшамен төлеу кезіндегі максималды сома',
            'product-note': 'Өнімдердің суреттері тапсырыстағы өнімдерден өзгеше болуы мүмкін.',
            
            // Promo section
            'promo-title': 'ӘР 5-ші ПИЦЦА ТЕГІН',
            'promo-text': 'Акция 4 пиццадан тапсырыс бергенде қолданылады',
            'order-btn': 'Тапсырыс беру: +7 771 295 75 28',
            
            // Cart page
            'page-title': 'Себет - VIVA LA PIZZA',
            'cart-title': 'Сіздің себетіңіз',
            'empty-cart': 'Сіздің себетіңіз бос',
            'items-text': 'Тауарлар:',
            'total-text': 'Төлем:',
            'promo-placeholder': 'Промокод',
            'apply-promo': 'Қолдану',
            'checkout-btn': 'Тапсырыс беру'
        },
        en: {
            // Header
            'menu-link': 'MENU',
            'promotions-link': 'PROMOTIONS',
            'delivery-link': 'DELIVERY',
            
            // Hero section
            'hero-title': 'A cozy little place on the city\'s pedestrian street',
            'hero-text': 'With homemade pizza and original Italian recipes. Try a slice or order a whole pizza. We offer 24-hour delivery throughout the city within an hour. We\'ll bring your pizza hot!',
            
            // Menu section
            'menu-title': 'Viva la pizza Menu',
            
            // Delivery info
            'delivery-title': 'Delivery and Payment',
            'delivery-highlight-title': '60 MINUTES OR PIZZA FREE',
            'delivery-highlight-text': 'If we fail to deliver any products (except souvenirs and sauces) within 60 minutes, you will receive an apology pizza. It can be added to one of your next orders.',
            'min-order-text': 'Minimum delivery amount',
            'max-cash-text': 'Maximum amount for cash payment',
            'product-note': 'Product images may differ from the products in your order.',
            
            // Promo section
            'promo-title': 'EVERY FIFTH PIZZA FREE',
            'promo-text': 'Promotion applies when ordering 4 or more pizzas',
            'order-btn': 'Place an order: +7 771 295 75 28',
            
            // Cart page
            'page-title': 'Cart - VIVA LA PIZZA',
            'cart-title': 'Your Cart',
            'empty-cart': 'Your cart is empty',
            'items-text': 'Items:',
            'total-text': 'Total:',
            'promo-placeholder': 'Promo code',
            'apply-promo': 'Apply',
            'checkout-btn': 'Checkout'
        }
    };
    
    // Update all elements with translations
    for (const [key, value] of Object.entries(translations[lang])) {
        const elements = document.querySelectorAll(`[id="${key}"]`);
        elements.forEach(element => {
            if (element.tagName === 'INPUT' && element.placeholder) {
                element.placeholder = value;
            } else {
                element.textContent = value;
            }
        });
    }
    
    // Update page title
    document.title = translations[lang]['page-title'] || 'VIVA LA PIZZA';
    
    // Update cart items if on cart page
    if (window.location.pathname.includes('cart.html')) {
        updateCart();
    }
}

// Global variable for current language
let currentLanguage = 'ru';