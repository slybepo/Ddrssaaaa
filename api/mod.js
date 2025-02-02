import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
    import { getFirestore, collection, addDoc, doc, getDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyBMUi291fwb-HSxlGPQMxdEJGUTiOOvFBs",
      authDomain: "nexaverse-eeb07.firebaseapp.com",
      projectId: "nexaverse-eeb07",
      storageBucket: "nexaverse-eeb07.appspot.com",
      messagingSenderId: "686342300627",
      appId: "1:686342300627:web:90522d8f1129fb00b08526",
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    
    const userMenu = document.getElementById("userMenu");
    const userAvatar = document.getElementById("userAvatar");
    const userDropdown = document.getElementById("userDropdown");
    const userNameSpan = document.getElementById("userName");
    const userUidSpan = document.getElementById("userUid");
    const adminControls = document.getElementById("adminControls");
    const loginLink = document.getElementById("loginLink");
    const registerLink = document.getElementById("registerLink");

    
    userMenu.addEventListener("click", () => {
      userDropdown.classList.toggle("active");
    });

    
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        
        loginLink.style.display = "none";
        registerLink.style.display = "none";
        userMenu.style.display = "block";
        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          userAvatar.src = userData.pfp || "default-avatar.png";
          userNameSpan.textContent = userData.name;
          userUidSpan.textContent = "UID: " + user.uid;
         
          if(userData.role === "admin") {
            adminControls.style.display = "block";
          }
        }
      } else {
        
        loginLink.style.display = "block";
        registerLink.style.display = "block";
        userMenu.style.display = "none";
        adminControls.style.display = "none";
      }
    });

    
    function loadPosts() {
      const postsSection = document.getElementById("postsSection");
      const postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"));
      onSnapshot(postsQuery, (snapshot) => {
        postsSection.innerHTML = "";
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const postEl = document.createElement("div");
          postEl.className = "post-card";
          postEl.innerHTML = `
            <div class="post-header">
              <img src="${data.profilePic || 'default-avatar.png'}" alt="Avatar">
              <strong>${data.username}</strong>
              <small>${data.role}</small>
              <small>${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : ""}</small>
            </div>
            <div class="post-content">
              <p>${data.text}</p>
              ${ data.image ? `<img src="${data.image}" alt="Image" style="max-width:100%;">` : "" }
              ${ data.video ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${data.video}" frameborder="0" allowfullscreen></iframe>` : "" }
            </div>
          `;
          postsSection.appendChild(postEl);
        });
      });
    }
    loadPosts();

    
    function loadAnnouncements() {
      const announcementsSection = document.getElementById("announcementsSection");
      const annQuery = query(collection(db, "announcements"), orderBy("timestamp", "desc"));
      onSnapshot(annQuery, (snapshot) => {
        announcementsSection.innerHTML = "";
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const annEl = document.createElement("div");
          annEl.className = "announcement-card";
          annEl.innerHTML = `
            <div class="announcement-header">
              <img src="${data.profilePic || 'default-avatar.png'}" alt="Avatar">
              <strong>${data.username}</strong>
              <small>${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : ""}</small>
            </div>
            <div class="announcement-content">
              <p>${data.text}</p>
            </div>
          `;
          announcementsSection.appendChild(annEl);
        });
      });
    }
    loadAnnouncements();

    
    document.getElementById("adminPostButton").addEventListener("click", async () => {
      const text = document.getElementById("adminPostText").value.trim();
      const image = document.getElementById("adminPostImage").value.trim();
      const video = document.getElementById("adminPostVideo").value.trim();
      if (!text) return alert("Post cannot be empty!");
      const user = auth.currentUser;
      if (!user) return alert("You must be logged in!");
      const userDocSnap = await getDoc(doc(db, "users", user.uid));
      if (!userDocSnap.exists()) return alert("User not found!");
      await addDoc(collection(db, "posts"), {
        text,
        image: image || null,
        video: video || null,
        profilePic: userDocSnap.data().pfp,
        username: userDocSnap.data().name,
        role: userDocSnap.data().role,
        timestamp: serverTimestamp(),
        likes: 0
      });
      alert("Post created!");
      document.getElementById("adminPostText").value = "";
      document.getElementById("adminPostImage").value = "";
      document.getElementById("adminPostVideo").value = "";
    });

    
    document.getElementById("adminAnnouncementButton").addEventListener("click", async () => {
      const text = document.getElementById("adminAnnouncementText").value.trim();
      if (!text) return alert("Announcement cannot be empty!");
      const user = auth.currentUser;
      if (!user) return alert("You must be logged in!");
      const userDocSnap = await getDoc(doc(db, "users", user.uid));
      if (!userDocSnap.exists()) return alert("User not found!");
      await addDoc(collection(db, "announcements"), {
        text,
        profilePic: userDocSnap.data().pfp,
        username: userDocSnap.data().name,
        timestamp: serverTimestamp()
      });
      alert("Announcement created!");
      document.getElementById("adminAnnouncementText").value = "";
    });
