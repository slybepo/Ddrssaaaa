// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBMUi291fwb-HSxlGPQMxdEJGUTiOOvFBs",
    authDomain: "nexaverse-eeb07.firebaseapp.com",
    projectId: "nexaverse-eeb07",
    storageBucket: "nexaverse-eeb07.appspot.com",
    messagingSenderId: "686342300627",
    appId: "1:686342300627:web:90522d8f1129fb00b08526",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const userDropdown = document.getElementById('userDropdown');
const dropdownContent = document.getElementById('dropdownContent');
const userAvatar = document.getElementById('userAvatar');
const userInfoSection = document.getElementById('userInfoSection');
const createPostSection = document.getElementById('createPostSection');
const postsContainer = document.getElementById('postsContainer');
const postForm = document.getElementById('postForm');
const sortSelect = document.getElementById('sortSelect');
const tagsContainer = document.getElementById('tagsContainer');
const contributorsList = document.getElementById('contributorsList');
const postModal = document.getElementById('postModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close-modal');

// Current user data
let currentUser = null;
let currentUserData = null;

// Toggle dropdown menu
userDropdown.addEventListener('click', () => {
    dropdownContent.classList.toggle('show');
});

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
    if (!e.target.matches('.user-dropdown, .user-dropdown *')) {
        dropdownContent.classList.remove('show');
    }
});

// Initialize highlight.js for code syntax highlighting
hljs.highlightAll();

// Auth state listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // User is signed in
        currentUser = user;
        await fetchUserData(user.uid);
        setupAuthUI(true);
    } else {
        // User is signed out
        currentUser = null;
        currentUserData = null;
        setupAuthUI(false);
    }
    loadPosts();
    loadTags();
    loadContributors();
});

async function fetchUserData(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            currentUserData = userDoc.data();
            updateUserUI();
            
            // Show create post section for MssGroup members
            if (currentUserData.role === 'MssGroup') {
                createPostSection.style.display = 'block';
            } else {
                createPostSection.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

function setupAuthUI(isLoggedIn) {
    if (isLoggedIn) {
        userInfoSection.style.display = 'block';
        dropdownContent.innerHTML = `
            <a href="#" class="dropdown-item"><i class="fas fa-user"></i> Profile</a>
            <a href="#" class="dropdown-item"><i class="fas fa-cog"></i> Settings</a>
            <a href="#" id="logoutBtn" class="dropdown-item"><i class="fas fa-sign-out-alt"></i> Logout</a>
        `;
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.signOut();
        });
    } else {
        userInfoSection.style.display = 'none';
        createPostSection.style.display = 'none';
        dropdownContent.innerHTML = `
            <a href="/auth/login" class="dropdown-item"><i class="fas fa-sign-in-alt"></i> Login</a>
            <a href="/auth/register" class="dropdown-item"><i class="fas fa-user-plus"></i> Register</a>
        `;
    }
}

function updateUserUI() {
    if (currentUser && currentUserData) {
        const userProfilePic = document.getElementById('userProfilePic');
        const userDisplayName = document.getElementById('userDisplayName');
        const userRole = document.getElementById('userRole');
        const postCount = document.getElementById('postCount');
        const likeCount = document.getElementById('likeCount');
        
        userProfilePic.src = currentUser.photoURL || 'https://via.placeholder.com/150';
        userDisplayName.textContent = currentUser.displayName || 'Anonymous';
        userRole.textContent = currentUserData.role || 'Member';
        postCount.textContent = currentUserData.postCount || 0;
        likeCount.textContent = currentUserData.likeCount || 0;
        
        // Update avatar in dropdown
        if (currentUser.photoURL) {
            userAvatar.innerHTML = `<img src="${currentUser.photoURL}" alt="User Avatar" style="width: 32px; height: 32px; border-radius: 50%;">`;
        } else {
            userAvatar.innerHTML = `<i class="fas fa-user-circle"></i>`;
        }
    }
}

// Post form submission
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentUser || !currentUserData || currentUserData.role !== 'MssGroup') {
        alert('Only MssGroup members can create posts.');
        return;
    }
    
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const tags = document.getElementById('postTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    try {
        await db.collection('posts').add({
            title,
            content,
            tags,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || 'Anonymous',
            authorPhoto: currentUser.photoURL || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            likes: [],
            likeCount: 0,
            comments: []
        });
        
        // Update user's post count
        await db.collection('users').doc(currentUser.uid).update({
            postCount: firebase.firestore.FieldValue.increment(1)
        });
        
        // Reset form
        postForm.reset();
        alert('Post created successfully!');
        loadPosts();
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post. Please try again.');
    }
});

// Load posts from Firestore
async function loadPosts() {
    postsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading posts...</div>';
    
    try {
        let query = db.collection('posts').orderBy('createdAt', 'desc');
        
        if (sortSelect.value === 'popular') {
            query = db.collection('posts').orderBy('likeCount', 'desc');
        }
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            postsContainer.innerHTML = '<div class="no-posts">No posts found. Be the first to share!</div>';
            return;
        }
        
        postsContainer.innerHTML = '';
        
        snapshot.forEach(doc => {
            const post = doc.data();
            const postId = doc.id;
            const isLiked = currentUser && post.likes.includes(currentUser.uid);
            
            const postDate = post.createdAt ? post.createdAt.toDate().toLocaleDateString() : 'Just now';
            
            // Parse content for code blocks
            let parsedContent = post.content;
            const codeBlocks = post.content.match(/```([a-z]+)?\n([\s\S]*?)\n```/g) || [];
            
            codeBlocks.forEach(block => {
                const langMatch = block.match(/```([a-z]+)?\n/);
                const lang = langMatch ? langMatch[1] || 'plaintext' : 'plaintext';
                const code = block.replace(/```[a-z]*\n/, '').replace(/\n```$/, '');
                
                const highlightedCode = hljs.highlightAuto(code).value;
                
                parsedContent = parsedContent.replace(block, 
                    `<div class="code-block">
                        <div class="code-header">
                            <span>${lang}</span>
                            <button class="copy-btn" data-code="${encodeURIComponent(code)}">
                                <i class="far fa-copy"></i> Copy
                            </button>
                        </div>
                        <pre><code class="hljs ${lang}">${highlightedCode}</code></pre>
                    </div>`
                );
            });
            
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.dataset.id = postId;
            postElement.innerHTML = `
                <div class="post-header">
                    <img src="${post.authorPhoto || 'https://via.placeholder.com/40'}" alt="${post.authorName}" class="post-author">
                    <div class="post-meta">
                        <a href="#" class="post-author-name">${post.authorName}</a>
                        <div class="post-date">${postDate}</div>
                    </div>
                </div>
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <h3 class="post-title">${post.title}</h3>
                <div class="post-content">${parsedContent}</div>
                <div class="post-actions">
                    <div class="post-action ${isLiked ? 'liked' : ''}" data-action="like">
                        <i class="fas fa-heart"></i>
                        <span>${post.likeCount || 0}</span>
                    </div>
                    <div class="post-action" data-action="comment">
                        <i class="fas fa-comment"></i>
                        <span>${post.comments ? post.comments.length : 0}</span>
                    </div>
                    <div class="post-action" data-action="view">
                        <i class="fas fa-expand"></i>
                        <span>View</span>
                    </div>
                    ${currentUserData && currentUserData.role === 'MssGroup' ? `
                    <div class="post-action" data-action="delete">
                        <i class="fas fa-trash"></i>
                        <span>Delete</span>
                    </div>
                    ` : ''}
                </div>
            `;
            
            postsContainer.appendChild(postElement);
        });
        
        // Add event listeners to post actions
        document.querySelectorAll('.post-action').forEach(action => {
            action.addEventListener('click', handlePostAction);
        });
        
        // Add event listeners to copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', copyCodeToClipboard);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<div class="error">Failed to load posts. Please try again later.</div>';
    }
}

// Handle post actions (like, comment, view, delete)
async function handlePostAction(e) {
    const action = this.dataset.action;
    const postElement = this.closest('.post');
    const postId = postElement.dataset.id;
    
    if (!currentUser) {
        alert('Please login to perform this action.');
        return;
    }
    
    try {
        if (action === 'like') {
            const postRef = db.collection('posts').doc(postId);
            const postDoc = await postRef.get();
            const postData = postDoc.data();
            
            const isLiked = postData.likes.includes(currentUser.uid);
            
            if (isLiked) {
                // Unlike
                await postRef.update({
                    likes: firebase.firestore.FieldValue.arrayRemove(currentUser.uid),
                    likeCount: firebase.firestore.FieldValue.increment(-1)
                });
                
                // Update user's like count
                await db.collection('users').doc(currentUser.uid).update({
                    likeCount: firebase.firestore.FieldValue.increment(-1)
                });
                
                this.classList.remove('liked');
                const likeCountSpan = this.querySelector('span');
                likeCountSpan.textContent = parseInt(likeCountSpan.textContent) - 1;
            } else {
                // Like
                await postRef.update({
                    likes: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
                    likeCount: firebase.firestore.FieldValue.increment(1)
                });
                
                // Update user's like count
                await db.collection('users').doc(currentUser.uid).update({
                    likeCount: firebase.firestore.FieldValue.increment(1)
                });
                
                this.classList.add('liked');
                const likeCountSpan = this.querySelector('span');
                likeCountSpan.textContent = parseInt(likeCountSpan.textContent) + 1;
            }
        } else if (action === 'comment') {
            // Open modal with comments
            openPostModal(postId);
        } else if (action === 'view') {
            // Open modal with full post
            openPostModal(postId);
        } else if (action === 'delete' && currentUserData.role === 'MssGroup') {
            if (confirm('Are you sure you want to delete this post?')) {
                await db.collection('posts').doc(postId).delete();
                postElement.remove();
                
                // Update user's post count
                await db.collection('users').doc(currentUser.uid).update({
                    postCount: firebase.firestore.FieldValue.increment(-1)
                });
            }
        }
    } catch (error) {
        console.error('Error performing post action:', error);
        alert('Failed to perform action. Please try again.');
    }
}

// Copy code to clipboard
function copyCodeToClipboard() {
    const code = decodeURIComponent(this.dataset.code);
    navigator.clipboard.writeText(code).then(() => {
        const originalIcon = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            this.innerHTML = originalIcon;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy code:', err);
    });
}

// Open post modal
async function openPostModal(postId) {
    try {
        const postDoc = await db.collection('posts').doc(postId).get();
        if (!postDoc.exists) {
            alert('Post not found.');
            return;
        }
        
        const post = postDoc.data();
        const postDate = post.createdAt ? post.createdAt.toDate().toLocaleString() : 'Just now';
        const isLiked = currentUser && post.likes.includes(currentUser.uid);
        
        // Parse content for code blocks
        let parsedContent = post.content;
        const codeBlocks = post.content.match(/```([a-z]+)?\n([\s\S]*?)\n```/g) || [];
        
        codeBlocks.forEach(block => {
            const langMatch = block.match(/```([a-z]+)?\n/);
            const lang = langMatch ? langMatch[1] || 'plaintext' : 'plaintext';
            const code = block.replace(/```[a-z]*\n/, '').replace(/\n```$/, '');
            
            const highlightedCode = hljs.highlightAuto(code).value;
            
            parsedContent = parsedContent.replace(block, 
                `<div class="code-block">
                    <div class="code-header">
                        <span>${lang}</span>
                        <button class="copy-btn" data-code="${encodeURIComponent(code)}">
                            <i class="far fa-copy"></i> Copy
                        </button>
                    </div>
                    <pre><code class="hljs ${lang}">${highlightedCode}</code></pre>
                </div>`
            );
        });
        
        modalBody.innerHTML = `
            <div class="post-header">
                <img src="${post.authorPhoto || 'https://via.placeholder.com/40'}" alt="${post.authorName}" class="post-author">
                <div class="post-meta">
                    <a href="#" class="post-author-name">${post.authorName}</a>
                    <div class="post-date">${postDate}</div>
                </div>
            </div>
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <h2 class="post-title">${post.title}</h2>
            <div class="post-content">${parsedContent}</div>
            
            <div class="post-actions">
                <div class="post-action ${isLiked ? 'liked' : ''}" data-action="like" data-postid="${postId}">
                    <i class="fas fa-heart"></i>
                    <span>${post.likeCount || 0}</span>
                </div>
                <div class="post-action" data-action="comment" data-postid="${postId}">
                    <i class="fas fa-comment"></i>
                    <span>${post.comments ? post.comments.length : 0}</span>
                </div>
                ${currentUserData && currentUserData.role === 'MssGroup' ? `
                <div class="post-action" data-action="delete" data-postid="${postId}">
                    <i class="fas fa-trash"></i>
                    <span>Delete</span>
                </div>
                ` : ''}
            </div>
            
            <div class="comments-section">
                <h3>Comments (${post.comments ? post.comments.length : 0})</h3>
                
                ${currentUser ? `
                <div class="add-comment">
                    <textarea id="newComment" placeholder="Add a comment..."></textarea>
                    <button id="submitComment" class="btn-primary">Post Comment</button>
                </div>
                ` : '<p>Please <a href="/auth/login">login</a> to comment.</p>'}
                
                <div class="comments-list" id="commentsList">
                    ${post.comments ? post.comments.map(comment => `
                        <div class="comment">
                            <div class="comment-header">
                                <img src="${comment.authorPhoto || 'https://via.placeholder.com/30'}" alt="${comment.authorName}" class="comment-author">
                                <div class="comment-meta">
                                    <span class="comment-author-name">${comment.authorName}</span>
                                    <span class="comment-date">${new Date(comment.timestamp).toLocaleString()}</span>
                                </div>
                                ${currentUserData && currentUserData.role === 'MssGroup' ? `
                                <button class="delete-comment" data-commentid="${comment.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                                ` : ''}
                            </div>
                            <div class="comment-content">${comment.content}</div>
                        </div>
                    `).join('') : '<p>No comments yet.</p>'}
                </div>
            </div>
        `;
        
        // Add event listeners to modal actions
        modalBody.querySelectorAll('.post-action').forEach(action => {
            action.addEventListener('click', handleModalAction);
        });
        
        // Add event listener to submit comment button
        if (currentUser) {
            document.getElementById('submitComment').addEventListener('click', submitComment);
        }
        
        // Add event listeners to delete comment buttons
        modalBody.querySelectorAll('.delete-comment').forEach(btn => {
            btn.addEventListener('click', deleteComment);
        });
        
        
