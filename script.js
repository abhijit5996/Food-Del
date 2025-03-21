// script.js - Main JavaScript file for website with Firebase Authentication

// Firebase configuration - You'll need to replace these with your actual Firebase project details
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  // DOM Elements - These will be accessed based on the current page
  document.addEventListener('DOMContentLoaded', function() {
    // Determine which page we're on
    const currentPage = window.location.pathname.split('/').pop();
    
    // Common elements across pages
    setupNavigation();
    checkAuthState();
    
    // Page-specific initialization
    switch(currentPage) {
      case 'index.html':
      case 'homepage.html':
        initializeHomePage();
        break;
      case 'login.html':
        initializeLoginPage();
        break;
      case 'order.html':
        initializeOrderPage();
        break;
      default:
        console.log('Page not recognized');
    }
  });
  
  // Authentication state observer
  function checkAuthState() {
    auth.onAuthStateChanged(user => {
      const authLinks = document.querySelectorAll('.auth-link');
      const userProfile = document.querySelector('.user-profile');
      const protectedContent = document.querySelectorAll('.protected-content');
      
      if (user) {
        // User is signed in
        console.log('User logged in:', user.email);
        
        // Update UI for authenticated user
        authLinks.forEach(link => {
          if (link.dataset.authState === 'logged-out') {
            link.style.display = 'none';
          } else {
            link.style.display = 'block';
          }
        });
        
        // Show protected content
        protectedContent.forEach(element => {
          element.style.display = 'block';
        });
        
        // Update user profile if it exists
        if (userProfile) {
          userProfile.textContent = user.displayName || user.email;
        }
        
        // Redirect if on login page
        if (window.location.pathname.includes('login.html')) {
          window.location.href = 'index.html';
        }
      } else {
        // User is signed out
        console.log('User logged out');
        
        // Update UI for non-authenticated user
        authLinks.forEach(link => {
          if (link.dataset.authState === 'logged-in') {
            link.style.display = 'none';
          } else {
            link.style.display = 'block';
          }
        });
        
        // Hide protected content
        protectedContent.forEach(element => {
          element.style.display = 'none';
        });
        
        // Redirect if on protected page
        if (window.location.pathname.includes('order.html')) {
          window.location.href = 'login.html?redirect=order.html';
        }
      }
    });
  }
  
  // Setup navigation and common elements
  function setupNavigation() {
    const logoutBtn = document.querySelector('.logout-btn');
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().then(() => {
          console.log('User signed out');
          window.location.href = 'index.html';
        }).catch(error => {
          console.error('Sign out error:', error);
        });
      });
    }
  }
  
  // Homepage specific functions
  function initializeHomePage() {
    console.log('Homepage initialized');
    
    // Featured products carousel (if present)
    const carousel = document.querySelector('.product-carousel');
    if (carousel) {
      initializeCarousel(carousel);
    }
    
    // Newsletter subscription (if present)
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;
        
        // Save to Firebase or send to backend
        db.collection('newsletter').add({
          email: email,
          subscribed: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
          alert('Thanks for subscribing!');
          newsletterForm.reset();
        })
        .catch(error => {
          console.error('Newsletter subscription error:', error);
        });
      });
    }
  }
  
  // Login page specific functions
  function initializeLoginPage() {
    console.log('Login page initialized');
    
    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.register-form');
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const toggleFormBtn = document.querySelector('.toggle-form');
    
    // Handle login form submission
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;
        const errorMsg = loginForm.querySelector('.error-message');
        
        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        // Sign in with email and password
        auth.signInWithEmailAndPassword(email, password)
          .then((userCredential) => {
            // Redirect to appropriate page
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect') || 'index.html';
            window.location.href = redirect;
          })
          .catch((error) => {
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
            
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
          });
      });
    }
    
    // Handle registration form submission
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = registerForm.querySelector('input[type="email"]').value;
        const password = registerForm.querySelector('input[type="password"]').value;
        const confirmPassword = registerForm.querySelector('input[name="confirm-password"]').value;
        const errorMsg = registerForm.querySelector('.error-message');
        
        // Basic validation
        if (password !== confirmPassword) {
          errorMsg.textContent = 'Passwords do not match';
          errorMsg.style.display = 'block';
          return;
        }
        
        // Show loading state
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        
        // Create user
        auth.createUserWithEmailAndPassword(email, password)
          .then((userCredential) => {
            // Create user profile in Firestore
            return db.collection('users').doc(userCredential.user.uid).set({
              email: email,
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              orders: []
            });
          })
          .then(() => {
            // Redirect to homepage
            window.location.href = 'index.html';
          })
          .catch((error) => {
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
            
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register';
          });
      });
    }
    
    // Handle forgot password
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        const email = prompt('Enter your email address to reset your password:');
        if (email) {
          auth.sendPasswordResetEmail(email)
            .then(() => {
              alert('Password reset email sent. Check your inbox.');
            })
            .catch((error) => {
              alert('Error: ' + error.message);
            });
        }
      });
    }
    
    // Toggle between login and register forms
    if (toggleFormBtn) {
      toggleFormBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (loginForm && registerForm) {
          loginForm.classList.toggle('hidden');
          registerForm.classList.toggle('hidden');
          
          if (toggleFormBtn.textContent.includes('Register')) {
            toggleFormBtn.textContent = 'Login instead';
          } else {
            toggleFormBtn.textContent = 'Register instead';
          }
        }
      });
    }
    
    // Social login buttons
    const googleLoginBtn = document.querySelector('.google-login');
    if (googleLoginBtn) {
      googleLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
          .then((result) => {
            // Check if new user and create profile if needed
            const isNewUser = result.additionalUserInfo.isNewUser;
            if (isNewUser) {
              return db.collection('users').doc(result.user.uid).set({
                email: result.user.email,
                displayName: result.user.displayName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                orders: []
              });
            }
          })
          .then(() => {
            // Redirect to appropriate page
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect') || 'index.html';
            window.location.href = redirect;
          })
          .catch((error) => {
            console.error('Google sign-in error:', error);
          });
      });
    }
  }
  
  // Order page specific functions
  function initializeOrderPage() {
    console.log('Order page initialized');
    
    // This page should be protected, verify user is logged in
    if (!auth.currentUser) {
      window.location.href = 'login.html?redirect=order.html';
      return;
    }
    
    const orderForm = document.querySelector('.order-form');
    const productItems = document.querySelectorAll('.product-item');
    
    // Initialize product selection
    if (productItems.length > 0) {
      productItems.forEach(item => {
        item.addEventListener('click', (e) => {
          // Toggle selection
          item.classList.toggle('selected');
          
          // Update total price
          updateOrderTotal();
        });
      });
    }
    
    // Handle order form submission
    if (orderForm) {
      orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get selected products
        const selectedProducts = [];
        productItems.forEach(item => {
          if (item.classList.contains('selected')) {
            selectedProducts.push({
              id: item.dataset.productId,
              name: item.querySelector('.product-name').textContent,
              price: parseFloat(item.dataset.price)
            });
          }
        });
        
        // Get shipping address
        const shippingAddress = {
          name: orderForm.querySelector('input[name="name"]').value,
          street: orderForm.querySelector('input[name="street"]').value,
          city: orderForm.querySelector('input[name="city"]').value,
          state: orderForm.querySelector('input[name="state"]').value,
          zip: orderForm.querySelector('input[name="zip"]').value,
          country: orderForm.querySelector('select[name="country"]').value
        };
        
        // Show loading state
        const submitBtn = orderForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        // Save order to Firestore
        const orderData = {
          userId: auth.currentUser.uid,
          products: selectedProducts,
          shippingAddress: shippingAddress,
          total: calculateOrderTotal(selectedProducts),
          status: 'pending',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        db.collection('orders').add(orderData)
          .then((docRef) => {
            // Add order to user's orders array
            return db.collection('users').doc(auth.currentUser.uid).update({
              orders: firebase.firestore.FieldValue.arrayUnion(docRef.id)
            });
          })
          .then(() => {
            // Redirect to confirmation page
            window.location.href = 'confirmation.html?orderId=' + docRef.id;
          })
          .catch((error) => {
            console.error('Order submission error:', error);
            
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Place Order';
            
            // Show error
            alert('Error placing order: ' + error.message);
          });
      });
    }
  }
  
  // Helper function to update order total
  function updateOrderTotal() {
    const totalElement = document.querySelector('.order-total');
    const productItems = document.querySelectorAll('.product-item.selected');
    
    if (totalElement) {
      let total = 0;
      productItems.forEach(item => {
        total += parseFloat(item.dataset.price);
      });
      
      totalElement.textContent = '$' + total.toFixed(2);
    }
  }
  
  // Helper function to calculate order total
  function calculateOrderTotal(products) {
    return products.reduce((total, product) => total + product.price, 0);
  }
  
  // Helper function to initialize product carousel
  function initializeCarousel(carousel) {
    const slides = carousel.querySelectorAll('.carousel-item');
    const nextBtn = carousel.querySelector('.next-btn');
    const prevBtn = carousel.querySelector('.prev-btn');
    let currentSlide = 0;
    
    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.style.display = i === index ? 'block' : 'none';
      });
    }
    
    // Initialize carousel
    showSlide(currentSlide);
    
    // Add event listeners
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
      });
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
      });
    }
    
    // Auto-rotate carousel every 5 seconds
    setInterval(() => {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    }, 5000);
  }