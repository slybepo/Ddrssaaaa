const firebaseConfig = {
      apiKey: "AIzaSyBMUi291fwb-HSxlGPQMxdEJGUTiOOvFBs",
      authDomain: "nexaverse-eeb07.firebaseapp.com",
      projectId: "nexaverse-eeb07",
      storageBucket: "nexaverse-eeb07.appspot.com",
      messagingSenderId: "686342300627",
      appId: "1:686342300627:web:90522d8f1129fb00b08526",
    }; // Your config

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Track Visits
db.collection("stats").doc("visits").get().then(doc => {
    let count = doc.exists ? doc.data().count : 0;
    db.collection("stats").doc("visits").set({ count: count + 1 });
    document.getElementById("visit-count").innerText = count + 1;
});

// Show Online Users
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection("users").doc(user.uid).set({
            name: user.displayName,
            avatar: user.photoURL,
            online: true,
            role: "user"
        }, { merge: true });

        document.getElementById("user-avatar").src = user.photoURL || "default.png";
        document.getElementById("username").innerText = user.displayName;
        document.getElementById("user-id").innerText = `UID: ${user.uid}`;
    }
});

// Fetch Online Users
db.collection("users").where("online", "==", true).onSnapshot(snapshot => {
    const list = document.getElementById("online-list");
    list.innerHTML = "";
    snapshot.forEach(doc => {
        const user = doc.data();
        list.innerHTML += `<li><img src="${user.avatar}" width="30"> ${user.name}</li>`;
    });
});

// Fetch Posts
db.collection("posts").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    const container = document.getElementById("post-container");
    container.innerHTML = "";
    snapshot.forEach(doc => {
        const post = doc.data();
        container.innerHTML += `<div>
            <img src="${post.avatar}" width="40"> <b>${post.name} (${post.role})</b>
            <p>${post.content}</p>
        </div>`;
    });
});

// Handle Post Submission (Admins Only)
document.getElementById("post-btn").addEventListener("click", () => {
    auth.currentUser.getIdTokenResult().then(idTokenResult => {
        if (idTokenResult.claims.admin) {
            db.collection("posts").add({
                name: auth.currentUser.displayName,
                avatar: auth.currentUser.photoURL,
                content: document.getElementById("new-post").value,
                role: "admin",
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            alert("Only admins can post!");
        }
    });
});
