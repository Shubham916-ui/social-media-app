// Redirect to login if not authenticated
if (!localStorage.getItem("token")) {
  window.location.href = "/";
}

// API base URL - works for both local and production
const API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "/api";

// Load posts when page loads
document.addEventListener("DOMContentLoaded", () => {
  loadPosts();
  initializeCreatePost();
});

// Function to show skeleton loaders
function showSkeletonLoaders() {
  const postsContainer = document.querySelector(".posts");
  const skeletonHTML = `
    <div class="post-skeleton">
      <div class="post-skeleton-header">
        <div class="post-skeleton-avatar skeleton-loader"></div>
        <div class="post-skeleton-info">
          <div class="post-skeleton-username skeleton-loader"></div>
          <div class="post-skeleton-time skeleton-loader"></div>
        </div>
      </div>
      <div class="post-skeleton-content skeleton-loader"></div>
      <div class="post-skeleton-actions">
        <div class="post-skeleton-action skeleton-loader"></div>
        <div class="post-skeleton-action skeleton-loader"></div>
        <div class="post-skeleton-action skeleton-loader"></div>
      </div>
    </div>
  `.repeat(3); // Show 3 skeleton loaders

  postsContainer.innerHTML = skeletonHTML;
}

// Function to load posts from API
async function loadPosts() {
  try {
    console.log("Fetching posts...");
    showSkeletonLoaders(); // Show skeleton loaders while fetching
    const response = await fetch(`${API}/posts?t=${Date.now()}`, {
      cache: "no-store",
    });
    const posts = await response.json();

    if (response.ok && Array.isArray(posts)) {
      console.log("Loaded posts count:", posts.length);
      displayPosts(posts);
      // If a hash like #post-<id> is present, scroll to it after rendering
      const hash = window.location.hash;
      if (hash && hash.startsWith("#post-")) {
        setTimeout(() => {
          const el = document.getElementById(hash.slice(1));
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 150);
      }
    } else {
      console.error("Error loading posts:", posts.error || posts);
    }
  } catch (error) {
    console.error("Network error loading posts:", error);
  }
}

// Function to display posts in the UI
function displayPosts(posts) {
  try {
    const recentSection = document.querySelector(".recent-section");
    if (!recentSection) {
      console.error(".recent-section container not found in DOM");
      return;
    }

    const existingPosts = recentSection.querySelectorAll(".post");
    existingPosts.forEach((post) => post.remove());

    posts.forEach((post) => {
      try {
        const postElement = createPostElement(post);
        if (postElement) recentSection.appendChild(postElement);
      } catch (e) {
        console.error("Error rendering a post:", e, post);
      }
    });

    // Setup follow buttons for all rendered posts
    wireFeedFollowButtons(recentSection);

    // Re-attach event listeners for the new posts
    attachEventListeners();
  } catch (e) {
    console.error("displayPosts failed:", e);
  }
}

// Function to create a post element (defensive)
function createPostElement(post) {
  if (!post || !post._id) {
    console.warn("Skipping invalid post payload:", post);
    return null;
  }

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Ensure shapes
  const postUser =
    post.user && typeof post.user === "object"
      ? post.user
      : { username: "user", name: "User", avatar: "" };

  const likes = Array.isArray(post.likes) ? post.likes.map(String) : [];
  const currentUserId =
    currentUser && currentUser._id ? String(currentUser._id) : null;
  const userLiked = currentUserId ? likes.includes(currentUserId) : false;
  const heartClass = userLiked ? "fas" : "far";
  const heartColor = userLiked ? "color: #ff4757;" : "";

  const contentSafe = (post.content || "").toString();
  const imageSafe = (post.image || "").toString();

  const postDiv = document.createElement("div");
  postDiv.className = "post";
  postDiv.dataset.postId = post._id;
  postDiv.id = `post-${post._id}`;

  const DEFAULT_AVATAR = "/images/profile.png";
  const avatarSrc = postUser.avatar || DEFAULT_AVATAR;
  const displayName = postUser.name || postUser.username || "User";

  postDiv.innerHTML = `
    <div class="post-header">
      <img class="post-avatar" src="${avatarSrc}" alt="${displayName}">
      <div style="flex:1">
        <div class="post-username">${displayName}</div>
        <div class="post-time">${formatTime(post.createdAt)}</div>
      </div>
      <button class="small-follow-btn" data-user-id="${
        postUser._id || post.user
      }">Follow</button>
    </div>
    <div class="post-content">${contentSafe}</div>
    ${
      imageSafe
        ? `<img class="post-image" src="${imageSafe}" alt="Post image">`
        : ""
    }
    <div class="post-actions">
      <div class="action-button"><i class="${heartClass} fa-heart" style="${heartColor}"></i><span>${
    post.likeCount || likes.length || 0
  }</span></div>
      <div class="action-button comment-btn"><i class="far fa-comment"></i><span>${
        post.commentCount || 0
      }</span></div>
      <div class="action-button"><i class="far fa-share-square"></i><span>0</span></div>
    </div>
    <div class="comments-section" style="display: none;">
      <div class="comments-list"></div>
      <div class="comment-input-section">
        <input type="text" class="comment-input" placeholder="Write a comment...">
        <button class="comment-submit">Post</button>
      </div>
    </div>
  `;

  return postDiv;
}

// Function to format time
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }
}

// Top-right profile menu (removed)
(() => {})();

// Log Out from profile menu
document.querySelectorAll(".menu-item").forEach((item) => {
  if (item.querySelector("i").classList.contains("fa-sign-out-alt")) {
    item.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    });
  }
});

// Dark mode toggle
(function setupDarkMode() {
  const body = document.body;
  const key = "sc_dark_mode";
  const saved = localStorage.getItem(key);
  if (saved === "1") body.classList.add("dark");
  const toggleBtn = document.getElementById("darkModeToggle");
  toggleBtn?.addEventListener("click", () => {
    body.classList.toggle("dark");
    localStorage.setItem(key, body.classList.contains("dark") ? "1" : "0");
  });
})();

// Function to attach event listeners to dynamically created posts
function attachEventListeners() {
  document.querySelectorAll(".action-button").forEach((btn) => {
    // Remove existing listeners to avoid duplicates
    btn.replaceWith(btn.cloneNode(true));
  });

  // Re-attach listeners
  document.querySelectorAll(".action-button").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const icon = this.querySelector("i");

      // Handle like button
      if (icon.classList.contains("fa-heart")) {
        await handleLikeClick(this);
      }

      // Handle comment button
      if (icon.classList.contains("fa-comment")) {
        handleCommentClick(this);
      }

      // Handle share button
      if (icon.classList.contains("fa-share-square")) {
        await handleShareClick(this);
      }
    });
  });
}

// Handle like button click
async function handleLikeClick(btn) {
  const icon = btn.querySelector("i");
  const countEl = btn.querySelector("span");
  const postEl = btn.closest(".post");
  const postId = postEl?.dataset.postId;
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!postId) {
    alert("Post ID missing! Add data-post-id to HTML");
    return;
  }
  if (!user || !user._id) {
    alert("Please log in again");
    return (window.location.href = "/");
  }

  console.log("Attempting to like post:", postId, "by user:", user._id);

  btn.style.pointerEvents = "none";
  try {
    const res = await fetch(`${API}/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id }),
    });

    const data = await res.json();
    console.log("API Response:", data);

    if (!res.ok) {
      alert("Error: " + data.error);
      return;
    }

    // Update UI based on server response
    if (data.userLiked) {
      icon.classList.replace("far", "fas");
      icon.style.color = "#ff4757";
    } else {
      icon.classList.replace("fas", "far");
      icon.style.color = "";
    }
    countEl.textContent = data.likes;
  } catch (e) {
    console.error("Network error:", e);
    alert("Network error: " + e.message);
  } finally {
    btn.style.pointerEvents = "auto";
  }
}

// Handle comment button click
function handleCommentClick(btn) {
  console.log("Comment button clicked!");
  const postEl = btn.closest(".post");
  const commentsSection = postEl.querySelector(".comments-section");

  if (
    commentsSection.style.display === "none" ||
    commentsSection.style.display === ""
  ) {
    console.log("Opening comments section");
    commentsSection.style.display = "block";
    loadComments(
      postEl.dataset.postId,
      commentsSection.querySelector(".comments-list")
    );

    // Attach comment submit event listener
    const commentInput = commentsSection.querySelector(".comment-input");
    const commentSubmit = commentsSection.querySelector(".comment-submit");

    // Remove any existing listeners
    commentSubmit.onclick = null;
    commentInput.onkeypress = null;

    // Add new listeners
    commentSubmit.addEventListener("click", () => {
      console.log("Submit button clicked");
      submitComment(postEl.dataset.postId, commentInput, commentsSection);
    });

    commentInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        console.log("Enter key pressed");
        submitComment(postEl.dataset.postId, commentInput, commentsSection);
      }
    });
  } else {
    console.log("Closing comments section");
    commentsSection.style.display = "none";
  }
}

// Load comments for a post
async function loadComments(postId, commentsListEl) {
  try {
    console.log("Loading comments for post:", postId);
    commentsListEl.innerHTML =
      '<p style="color: #888; text-align: center;">Loading comments...</p>';

    const response = await fetch(
      `${API}/comments/post/${postId}?t=${Date.now()}`
    );

    if (response.ok) {
      const comments = await response.json();
      console.log("Loaded comments for post", postId, ":", comments);
      console.log("Number of comments:", comments.length);
      displayComments(comments, commentsListEl);
    } else {
      const errorData = await response.json();
      console.error("Error loading comments:", errorData);
      commentsListEl.innerHTML = `<p style="color: #888; text-align: center;">Error loading comments: ${
        errorData.error || "Unknown error"
      }</p>`;
    }
  } catch (error) {
    console.error("Network error loading comments:", error);
    commentsListEl.innerHTML = `<p style="color: #888; text-align: center;">Network error: ${error.message}</p>`;
  }
}

// Handle share button click (global)
async function handleShareClick(btn) {
  try {
    const postEl = btn.closest(".post");
    const postId = postEl?.dataset.postId;
    const origin = window.location.origin;
    const shareUrl = `${origin}/home#post-${postId}`;

    if (navigator.share) {
      await navigator.share({
        title: "Check out this post",
        text: "Sharing a post with you",
        url: shareUrl,
      });
      showNotification("Shared!", "success");
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    showNotification("Link copied to clipboard", "success");
  } catch (e) {
    console.error("Share failed:", e);
    showNotification("Could not share. Please try again.", "error");
  }
}

// Display comments in the UI
function displayComments(comments, commentsListEl) {
  console.log("Displaying comments:", comments);
  console.log("Comments list element:", commentsListEl);

  if (comments.length === 0) {
    console.log("No comments to display");
    commentsListEl.innerHTML =
      '<p style="color: #888; text-align: center;">No comments yet. Be the first to comment!</p>';
    return;
  }

  // Filter out comments with null users to prevent errors
  const validComments = comments.filter((comment) => comment.user);
  console.log("Valid comments (with users):", validComments);

  if (validComments.length === 0) {
    console.log("No valid comments to display");
    commentsListEl.innerHTML =
      '<p style="color: #888; text-align: center;">No comments yet. Be the first to comment!</p>';
    return;
  }

  console.log("Rendering", validComments.length, "comments");
  commentsListEl.innerHTML = validComments
    .map(
      (comment) => `
    <div class="comment-item">
      <img class="comment-avatar" src="${
        comment.user && comment.user.avatar
          ? comment.user.avatar
          : "/images/profile.png"
      }" alt="${comment.user.name || comment.user.username}">
      <div class="comment-content">
        <div class="comment-username">${
          comment.user.name || comment.user.username
        }</div>
        <div class="comment-text">${comment.content}</div>
        <div class="comment-time">${formatTime(comment.createdAt)}</div>
      </div>
    </div>
  `
    )
    .join("");
}

// Submit a new comment
async function submitComment(postId, commentInput, commentsSection) {
  console.log("submitComment called with:", {
    postId,
    content: commentInput.value,
  });

  const content = commentInput.value.trim();
  if (!content) {
    console.log("No content, returning");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  console.log("User from localStorage:", user);

  if (!user._id) {
    alert("Please log in again");
    window.location.href = "/";
    return;
  }

  const submitBtn = commentsSection.querySelector(".comment-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Posting...";

  try {
    const response = await fetch(`${API}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content,
        post: postId,
        user: user._id,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("Comment created successfully:", result);
      commentInput.value = "";

      // Reload comments to show the new one
      console.log("Reloading comments for post:", postId);
      loadComments(postId, commentsSection.querySelector(".comments-list"));

      // Update comment count in the post
      const postEl = commentsSection.closest(".post");
      const commentBtn = postEl.querySelector(".comment-btn span");
      const currentCount = parseInt(commentBtn.textContent) || 0;
      commentBtn.textContent = currentCount + 1;
      console.log("Updated comment count to:", currentCount + 1);
    } else {
      console.error("Error posting comment:", result);
      alert("Error posting comment: " + result.error);
    }
  } catch (error) {
    console.error("Network error posting comment:", error);
    alert("Network error: " + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Post";
  }
}

// Bottom nav interactivity
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function () {
    document
      .querySelectorAll(".nav-item")
      .forEach((i) => i.classList.remove("active"));
    this.classList.add("active");
  });
});

// Sidebar menu highlight

// Sidebar "More" button behavior
(function setupSidebarMore() {
  const more = document.getElementById("sidebarMore");
  const menu = document.getElementById("sidebarMoreMenu");
  if (!more || !menu) return;
  // Toggle open/close
  more.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = more.classList.toggle("open");
    if (menu) menu.style.display = isOpen ? "block" : "none";
  });
  // Prevent clicks inside menu from closing it immediately
  menu.addEventListener("click", (e) => e.stopPropagation());
  // Close when clicking outside the menu
  document.addEventListener("click", (ev) => {
    if (!more.contains(ev.target)) {
      more.classList.remove("open");
      if (menu) menu.style.display = "none";
    }
  });

  // Wire options
  const darkToggle = document.getElementById("moreDarkMode");
  const updateDarkToggleLabel = () => {
    if (!darkToggle) return;
    const isDark = document.body.classList.contains("dark");
    const icon = darkToggle.querySelector("i");
    const label = darkToggle.querySelector("span");
    if (icon) {
      icon.classList.remove("fa-moon", "fa-sun");
      icon.classList.add(isDark ? "fa-sun" : "fa-moon");
    }
    if (label) label.textContent = isDark ? "Light Mode" : "Dark Mode";
  };
  updateDarkToggleLabel();
  darkToggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      "sc_dark_mode",
      document.body.classList.contains("dark") ? "1" : "0"
    );
    updateDarkToggleLabel();
  });
  document.getElementById("moreLogout")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  });
  document.getElementById("moreSettings")?.addEventListener("click", () => {
    alert("Settings coming soon");
  });
  document.getElementById("moreHelp")?.addEventListener("click", () => {
    alert("Help & Support coming soon");
  });
})();

// Sidebar and bottom Profile navigation
(function setupProfileNav() {
  const goToProfile = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const id = user?._id;
    window.location.href = id ? `/profile.html?id=${id}` : "/profile.html";
  };
  document
    .getElementById("sidebarProfile")
    ?.addEventListener("click", goToProfile);
  document
    .getElementById("bottomProfile")
    ?.addEventListener("click", goToProfile);
})();

// Wire follow/unfollow buttons in feed
function wireFeedFollowButtons(root = document) {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  root.querySelectorAll(".small-follow-btn").forEach((btn) => {
    const uid = btn.getAttribute("data-user-id");
    if (!uid) return;
    // Initialize status
    fetch(`${API}/followers/status/${uid}`, { headers })
      .then((r) => (r.ok ? r.json() : { following: false }))
      .then((s) => {
        btn.textContent = s.following ? "Following" : "Follow";
        btn.classList.toggle("following", !!s.following);
      })
      .catch(() => {});
    btn.addEventListener("click", async () => {
      if (!localStorage.getItem("token")) {
        alert("Please log in again");
        return;
      }
      btn.disabled = true;
      try {
        const res = await fetch(`${API}/followers/${uid}`, {
          method: "POST",
          headers,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        const following = !!data.following;
        btn.textContent = following ? "Following" : "Follow";
        btn.classList.toggle("following", following);
      } catch (e) {
        alert("Failed to update follow: " + e.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

document.querySelectorAll(".sidebar-item").forEach((item) => {
  item.addEventListener("click", function () {
    document
      .querySelectorAll(".sidebar-item")
      .forEach((i) => i.classList.remove("active"));
    this.classList.add("active");
  });
});

// Toast for features not implemented yet (Explore, Create, Notifications, Messages, etc.)
(function setupFeatureComingSoonToasts() {
  const items = document.querySelectorAll(".sidebar-item, .nav-item");
  items.forEach((item) => {
    const label = item.querySelector("span")?.textContent?.trim() || "";
    const l = label.toLowerCase();
    const isProfile =
      item.id === "sidebarProfile" || item.id === "bottomProfile";
    const isHome = l === "home";
    const isMore = l === "more" || item.id === "sidebarMore";
    if (isProfile || isHome || isMore) return; // exclude Home, Profile, More

    item.addEventListener("click", () => {
      if (!label) return;
      showNotification(`${label} feature is coming soon`, "info");
    });
  });
})();

// Follow button toggle
document.querySelectorAll(".follow-button").forEach((btn) => {
  btn.addEventListener("click", function () {
    if (this.textContent.trim() === "Follow") {
      this.textContent = "Following";
      this.style.backgroundColor = "#e0e0e0";
      this.style.color = "#333333";
    } else {
      this.textContent = "Follow";
      this.style.backgroundColor = "#4a9eff";
      this.style.color = "white";
    }
  });
});

// Initialize create post functionality
function initializeCreatePost() {
  const postContent = document.getElementById("postContent");
  const imageUpload = document.getElementById("imageUpload");
  const submitPost = document.getElementById("submitPost");
  const imagePreview = document.getElementById("imagePreview");
  const previewImage = document.getElementById("previewImage");
  const removeImage = document.getElementById("removeImage");
  const createPostAvatar = document.getElementById("createPostAvatar");

  let selectedImage = null;

  // Set user avatar
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const DEFAULT_AVATAR = "/images/profile.png";
  createPostAvatar.src = user.avatar || DEFAULT_AVATAR;

  // Enable/disable post button based on content
  function updatePostButton() {
    const hasContent = postContent.value.trim().length > 0;
    const hasImage = selectedImage !== null;
    submitPost.disabled = !(hasContent || hasImage);
  }

  // Handle text input
  postContent.addEventListener("input", updatePostButton);

  // Handle image upload
  imageUpload.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(
          "Image size must be less than 5MB. Please choose a smaller image."
        );
        imageUpload.value = "";
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        imageUpload.value = "";
        return;
      }

      selectedImage = file;

      // Show preview
      const reader = new FileReader();
      reader.onload = function (e) {
        previewImage.src = e.target.result;
        imagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);

      updatePostButton();
    }
  });

  // Handle image removal
  removeImage.addEventListener("click", function () {
    selectedImage = null;
    imageUpload.value = "";
    imagePreview.style.display = "none";
    updatePostButton();
  });

  // Handle post submission
  submitPost.addEventListener("click", async function () {
    const content = postContent.value.trim();

    if (!content && !selectedImage) {
      alert("Please add some content or an image to your post.");
      return;
    }

    if (!user._id) {
      alert("Please log in again");
      window.location.href = "/";
      return;
    }

    // Disable button and show loading
    submitPost.disabled = true;
    submitPost.textContent = "Posting...";

    try {
      let imageUrl = null;

      // If there's an image, convert it to base64 for now
      // In a real app, you'd upload to a file storage service
      if (selectedImage) {
        console.log("Converting image to base64...");
        imageUrl = await convertImageToBase64(selectedImage);
        console.log("Image converted, size:", imageUrl.length, "characters");
      }

      console.log("Sending post request with data:", {
        content: content,
        hasImage: !!imageUrl,
        user: user._id,
      });

      const response = await fetch(`${API}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content,
          image: imageUrl,
          user: user._id,
        }),
      });

      console.log("Response status:", response.status);
      console.log(
        "Response content-type:",
        response.headers.get("content-type")
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response text:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (response.ok) {
        console.log("Post created successfully:", result);

        // Clear form
        postContent.value = "";
        selectedImage = null;
        imageUpload.value = "";
        imagePreview.style.display = "none";

        // Reload posts to show the new one
        loadPosts();

        // Show success message
        showNotification("Post created successfully!", "success");
      } else {
        console.error("Error creating post:", result);
        alert("Error creating post: " + result.error);
      }
    } catch (error) {
      console.error("Network error creating post:", error);
      alert("Network error: " + error.message);
    } finally {
      submitPost.disabled = false;
      submitPost.textContent = "Post";
      updatePostButton();
    }
  });
}

// Convert image to base64
function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Show notification
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;

  if (type === "success") {
    notification.style.backgroundColor = "#45bd62";
  } else if (type === "error") {
    notification.style.backgroundColor = "#f3425f";
  } else {
    notification.style.backgroundColor = "#4a9eff";
  }

  // Add to page
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}
