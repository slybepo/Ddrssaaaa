import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
    import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
    import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
    
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
    
    document.getElementById("registerButton").addEventListener("click", async () => {
      const username = document.getElementById("username").value.trim();
      const email = document.getElementById("email").value.trim();
      const pfp = document.getElementById("pfp").value.trim();
      const password = document.getElementById("password").value.trim();
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, {
          displayName: username,
          photoURL: pfp || "default-avatar.png"
        });
        // Save user data in Firestore
        await setDoc(doc(db, "users", user.uid), {
          name: username,
          email: email,
          pfp: pfp || "default-avatar.png",
          role: "user",  // Default role. Change to "admin" manually if needed.
          createdAt: new Date()
        });
        alert("Registration successful!");
        window.location.href = "index.html";
      } catch (error) {
        alert("Error: " + error.message);
      }
    });
