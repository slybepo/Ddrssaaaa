 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
    import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
    import { 
      getFirestore, 
      collection, 
      query, 
      orderBy, 
      onSnapshot, 
      doc, 
      deleteDoc, 
      updateDoc, 
      addDoc, 
      serverTimestamp, 
      getDoc, 
      increment,
      where,
      getDocs
    } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
    import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

    // Default avatar URL
    const defaultAvatar = "https://i.imgur.com/6VBx3io.png";

    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyBMUi291fwb-HSxlGPQMxdEJGUTiOOvFBs",
      authDomain: "nexaverse-eeb07.firebaseapp.com",
      projectId: "nexaverse-eeb07",
      storageBucket: "nexaverse-eeb07.appspot.com",
      messagingSenderId: "686342300627",
      appId: "1:686342300627:web:90522d8f1129fb00b08526",
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // DOM Elements
    const profileDropdown = document.getElementById("profileDropdown");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const userAvatar = document.getElementById("userAvatar");
    const userUid = document.getElementById("userUid");
    const logoutBtn = document.getElementById("logoutBtn");
    const profileLink = document.getElementById("profileLink");
    const adminPostForm = document.getElementById("admin-post-form");
    const createPostBtn = document.getElementById("create-post-btn");
    const postsContainer = document.getElementById("posts-container");
    const notification = document.getElementById("notification");
    const notificationMessage = document.getElementById("notification-message");
    const searchInput = document.getElementById("search");
    const searchResults = document.getElementById("searchResults");

    // Set default avatar fallback
    userAvatar.src = defaultAvatar;
    userAvatar.onerror = function() {
      this.src = defaultAvatar;
    };

    // Toggle dropdown menu
    profileDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-container")) {
        searchResults.classList.remove("show");
      }
      if (!e.target.closest(".user-profile")) {
        dropdownMenu.classList.remove("show");
      }
    });

    // Logout functionality
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        showNotification("Logged out successfully", "success");
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 1500);
      } catch (error) {
        showNotification("Error logging out: " + error.message, "error");
      }
    });

    // Profile link
    profileLink.addEventListener("click", (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (user) {
        window.location.href = `/user/profile?id=${user.uid}`;
      }
    });

    // Show notification
    function showNotification(message, type = "info") {
      notificationMessage.textContent = message;
      notification.className = "notification";
      notification.classList.add(type, "show");
      
      setTimeout(() => {
        notification.classList.remove("show");
      }, 3000);
    }

    // Format markdown text
    function formatMarkdown(text) {
      if (!text) return "";
      // Simple markdown formatting
      text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
      text = text.replace(/~~(.*?)~~/g, "<del>$1</del>");
      text = text.replace(/# (.*?)(\n|$)/g, "<h3>$1</h3>");
      text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
      return text;
    }

    // Format date
    function formatDate(timestamp) {
      if (!timestamp) return "";
      const date = timestamp.toDate();
      return date.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "short", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    // Search users
    searchInput.addEventListener("input", async (e) => {
      const searchTerm = e.target.value.trim();
      
      if (searchTerm.length < 2) {
        searchResults.classList.remove("show");
        return;
      }
      
      try {
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("displayName", ">=", searchTerm),
          where("displayName", "<=", searchTerm + "\uf8ff")
        );
        
        const querySnapshot = await getDocs(q);
        searchResults.innerHTML = "";
        
        if (querySnapshot.empty) {
          const noResults = document.createElement("div");
          noResults.className = "search-result-item";
          noResults.textContent = "No users found";
          searchResults.appendChild(noResults);
        } else {
          querySnapshot.forEach((doc) => {
            const user = doc.data();
            const resultItem = document.createElement("div");
            resultItem.className = "search-result-item";
            resultItem.innerHTML = `
              <img src="${user.photoURL || defaultAvatar}" 
                   alt="${user.displayName}" 
                   class="search-result-img"
                   onerror="this.src='${defaultAvatar}'">
              <span class="search-result-name">${user.displayName}</span>
            `;
            resultItem.addEventListener("click", () => {
              window.location.href = `/user/profile?id=${doc.id}`;
            });
            searchResults.appendChild(resultItem);
          });
        }
        
        searchResults.classList.add("show");
      } catch (error) {
        console.error("Error searching users:", error);
        searchResults.classList.remove("show");
      }
    });

    // Load posts from Firestore
    function loadPosts() {
      const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
      
      onSnapshot(q, async (snapshot) => {
        postsContainer.innerHTML = "";
        
        for (const docSnap of snapshot.docs) {
          const post = docSnap.data();
          const postId = docSnap.id;
          const currentUser = auth.currentUser;
          
          // Get author data from users collection
          let authorName = "Unknown";
          let authorAvatar = defaultAvatar;
          
          try {
            const authorDoc = await getDoc(doc(db, "users", post.userId));
            if (authorDoc.exists()) {
              const authorData = authorDoc.data();
              authorName = authorData.displayName || "Unknown";
              authorAvatar = authorData.photoURL || defaultAvatar;
            }
          } catch (error) {
            console.error("Error fetching author data:", error);
          }
          
          const postCard = document.createElement("div");
          postCard.className = "post-card";
          postCard.dataset.id = postId;
          
          postCard.innerHTML = `
            <img src="${post.thumbnail || "https://via.placeholder.com/300x180?text=No+Thumbnail"}" 
                 alt="Post thumbnail" class="post-thumbnail">
            
            <div class="post-actions">
              ${currentUser && (currentUser.uid === post.userId || currentUser.isAdmin) ? `
                <button class="action-btn edit-btn" data-id="${postId}">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${postId}">
                  <i class="fas fa-trash"></i>
                </button>
              ` : ""}
            </div>
            
            <div class="post-content">
              <div class="post-header">
                <img src="${authorAvatar}" 
                     alt="${authorName}" 
                     class="post-author-img"
                     onerror="this.src='${defaultAvatar}'">
                <div>
                  <div class="post-author">${authorName}</div>
                  <div class="post-date">${formatDate(post.timestamp)}</div>
                </div>
              </div>
              
              <h3 class="post-title">${post.title}</h3>
              <div class="post-description">${formatMarkdown(post.description)}</div>
              
              <div class="post-footer">
                <div class="post-rating">
                  <i class="fas fa-star"></i>
                  <span>${post.rating || 0}</span>
                </div>
                <a href="${post.link}" class="post-link" target="_blank">
                  View <i class="fas fa-arrow-right"></i>
                </a>
              </div>
            </div>
          `;
          
          postsContainer.appendChild(postCard);
        }
      });
    }

    // Delete post
    async function deletePost(postId) {
      if (confirm("Are you sure you want to delete this post?")) {
        try {
          await deleteDoc(doc(db, "posts", postId));
          showNotification("Post deleted successfully", "success");
        } catch (error) {
          showNotification("Error deleting post: " + error.message, "error");
        }
      }
    }

    // Handle post actions
    document.addEventListener("click", (e) => {
      if (e.target.closest(".delete-btn")) {
        const postId = e.target.closest(".delete-btn").dataset.id;
        deletePost(postId);
      }
      
      if (e.target.closest(".edit-btn")) {
        const postId = e.target.closest(".edit-btn").dataset.id;
        showNotification("Edit functionality coming soon", "info");
      }
      
      if (e.target.closest(".post-rating")) {
        const postId = e.target.closest(".post-card").dataset.id;
        ratePost(postId);
      }
    });

    // Rate post
    async function ratePost(postId) {
      const user = auth.currentUser;
      if (!user) {
        showNotification("Please login to rate posts", "error");
        return;
      }
      
      try {
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
          rating: increment(1)
        });
        showNotification("Thanks for your rating!", "success");
      } catch (error) {
        showNotification("Error rating post: " + error.message, "error");
      }
    }

    // Submit new post
    document.getElementById("submit-post-btn").addEventListener("click", async () => {
      const title = document.getElementById("post-title").value.trim();
      const description = document.getElementById("post-description").value.trim();
      const link = document.getElementById("post-link").value.trim();
      const thumbnail = document.getElementById("post-thumbnail").value.trim();
      const user = auth.currentUser;
      
      if (!title || !description || !link) {
        showNotification("Please fill in all required fields", "error");
        return;
      }
      
      if (!user) {
        showNotification("You must be logged in to create posts", "error");
        return;
      }
      
      try {
        // Check if user is admin before allowing post creation
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists() || userDoc.data().role !== "admin") {
          showNotification("Only admins can create posts", "error");
          return;
        }
        
        await addDoc(collection(db, "posts"), {
          title,
          description,
          link,
          thumbnail: thumbnail || "https://via.placeholder.com/300x180?text=No+Thumbnail",
          userId: user.uid,
          rating: 0,
          timestamp: serverTimestamp()
        });
        
        // Clear form
        document.getElementById("post-title").value = "";
        document.getElementById("post-description").value = "";
        document.getElementById("post-link").value = "";
        document.getElementById("post-thumbnail").value = "";
        
        showNotification("Post published successfully!", "success");
      } catch (error) {
        showNotification("Error publishing post: " + error.message, "error");
      }
    });

    // Toggle post form
    createPostBtn.addEventListener("click", () => {
      adminPostForm.style.display = adminPostForm.style.display === "block" ? "none" : "block";
    });

    // Auth state listener
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Update profile picture and name
            userAvatar.src = userData.photoURL || defaultAvatar;
            userAvatar.onerror = function() {
              this.src = defaultAvatar;
            };
            
            // Update profile link text
            const profileName = userData.displayName || "Profile";
            profileLink.querySelector("span").textContent = profileName;
            
            // Show admin controls if user is admin
            if (userData.role === "admin") {
              adminPostForm.style.display = "block";
              createPostBtn.style.display = "none";
            } else {
              adminPostForm.style.display = "none";
              createPostBtn.style.display = "none";
            }
          }
          
          userUid.textContent = `UID: ${user.uid.substring(0, 8)}...`;
        } catch (error) {
          console.error("Error fetching user data:", error);
          userAvatar.src = defaultAvatar;
          userUid.textContent = `UID: ${user.uid.substring(0, 8)}...`;
          adminPostForm.style.display = "none";
          createPostBtn.style.display = "none";
        }
      } else {
        // User is signed out
        userAvatar.src = defaultAvatar;
        userUid.textContent = "UID: Not logged in";
        adminPostForm.style.display = "none";
        createPostBtn.style.display = "none";
      }
    });

    // Initialize the app
    loadPosts();
