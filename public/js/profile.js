// Redirect to login if not authenticated
if (!localStorage.getItem("token")) {
  window.location.href = "/";
}

// Apply saved dark mode preference
(function setupDarkModeProfile() {
  const key = "sc_dark_mode";
  const saved = localStorage.getItem(key);
  if (saved === "1") document.body.classList.add("dark");
})();

// Use same API base as home.js for consistency
const API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "/api";

// Helpers
function $(sel) {
  return document.querySelector(sel);
}
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}
// Follow/Unfollow button renderer (top-level)
async function renderFollowButton(targetUserId, viewedUser) {
  const area = document.getElementById("followArea");
  if (!area) return;
  const me = JSON.parse(localStorage.getItem("user") || "null");
  const isSelf = me && me._id === targetUserId;
  area.innerHTML = "";
  if (isSelf) return; // no follow button for self

  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch current follow status
  let following = false;
  try {
    const res = await fetch(`${API}/followers/status/${targetUserId}`, {
      headers,
    });
    if (res.ok) {
      const s = await res.json();
      following = !!s.following;
    }
  } catch (_) {}

  const btn = document.createElement("button");
  btn.className = following ? "follow-btn following" : "follow-btn";
  btn.textContent = following ? "Following" : "Follow";
  btn.addEventListener("click", async () => {
    if (!localStorage.getItem("token")) {
      alert("Please log in again");
      window.location.href = "/";
      return;
    }
    btn.disabled = true;
    try {
      const toggleRes = await fetch(`${API}/followers/${targetUserId}`, {
        method: "POST",
        headers,
      });
      const result = await toggleRes.json();
      if (!toggleRes.ok)
        throw new Error(result.error || `HTTP ${toggleRes.status}`);
      following = !!result.following;
      btn.className = following ? "follow-btn following" : "follow-btn";
      btn.textContent = following ? "Following" : "Follow";

      // Update followers count
      const cEl = document.getElementById("followersCount");
      const current =
        parseInt((cEl?.textContent || "0").replace(/[^0-9]/g, "")) || 0;
      const next = following ? current + 1 : Math.max(0, current - 1);
      if (cEl) cEl.textContent = String(next);
    } catch (e) {
      alert("Failed to update follow status: " + e.message);
    } finally {
      btn.disabled = false;
    }
  });

  area.appendChild(btn);
}

// Render a post (re-use styles from home)
function createPostElement(post) {
  const postUser = post.user || {};
  const DEFAULT_AVATAR = "/images/profile.png";
  const avatarSrc = postUser.avatar || DEFAULT_AVATAR;
  const displayName = postUser.name || postUser.username || "User";

  const likesArr = Array.isArray(post.likes) ? post.likes.map(String) : [];
  const me = JSON.parse(localStorage.getItem("user") || "null");
  const myId = me && me._id ? String(me._id) : null;
  const userLiked = myId ? likesArr.includes(myId) : false;
  const likes = post.likeCount || likesArr.length || 0;
  const comments = post.commentCount || 0;

  const heartClass = userLiked ? "fas" : "far";
  const heartStyle = userLiked ? 'style="color:#ff4757;"' : "";

  const postDiv = document.createElement("div");
  postDiv.className = "post";
  postDiv.dataset.postId = post._id;
  postDiv.id = `post-${post._id}`;
  postDiv.innerHTML = `
    <div class="post-header">
      <img class="post-avatar" src="${avatarSrc}" alt="${displayName}">
      <div style="flex: 1;">
        <div class="post-username">${displayName}</div>
        <div class="post-time">${formatTime(post.createdAt)}</div>
      </div>
      ${
        myId === (postUser._id || post.user)
          ? `<div class="post-menu">
          <button class="post-menu-btn" onclick="togglePostMenu('${post._id}')">
            <i class="fas fa-ellipsis-h"></i>
          </button>
          <div class="post-menu-dropdown" id="menu-${post._id}" style="display: none;">
            <button class="menu-item delete-post" onclick="deletePost('${post._id}')">
              <i class="fas fa-trash"></i> Delete Post
            </button>
          </div>
        </div>`
          : ""
      }
    </div>
    <div class="post-content">${(post.content || "").toString()}</div>
    ${
      post.image
        ? `<img class="post-image" src="${post.image}" alt="Post image">`
        : ""
    }
    <div class="post-actions">
      <div class="action-button"><i class="${heartClass} fa-heart" ${heartStyle}></i><span>${likes}</span></div>
      <div class="action-button comment-btn"><i class="far fa-comment"></i><span>${comments}</span></div>
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

// Toggle post menu dropdown with smooth animation
function togglePostMenu(postId) {
  const menu = document.getElementById(`menu-${postId}`);
  const allMenus = document.querySelectorAll(".post-menu-dropdown");

  // Close all other menus with animation
  allMenus.forEach((m) => {
    if (m.id !== `menu-${postId}`) {
      m.classList.remove("show");
      setTimeout(() => {
        m.style.display = "none";
      }, 300);
    }
  });

  // Toggle current menu with animation
  if (menu.style.display === "none" || !menu.style.display) {
    menu.style.display = "block";
    // Force reflow for animation
    menu.offsetHeight;
    menu.classList.add("show");
  } else {
    menu.classList.remove("show");
    setTimeout(() => {
      menu.style.display = "none";
    }, 300);
  }
}

// Delete post function
async function deletePost(postId) {
  try {
    const response = await fetch(`${API}/posts/${postId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      // Remove post from DOM
      const postElement = document.getElementById(`post-${postId}`);
      if (postElement) {
        postElement.remove();
      }

      // Show success message
      showNotification("Post deleted successfully!", "success");

      // Reload posts to update the count
      loadProfile(userId);
    } else {
      const error = await response.json();
      showNotification(
        "Error deleting post: " + (error.error || "Unknown error"),
        "error"
      );
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    showNotification("Network error: " + error.message, "error");
  }
}

// Show notification function
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Add to page
  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Close menus when clicking outside with animation
document.addEventListener("click", function (event) {
  if (!event.target.closest(".post-menu")) {
    document.querySelectorAll(".post-menu-dropdown").forEach((menu) => {
      menu.classList.remove("show");
      setTimeout(() => {
        menu.style.display = "none";
      }, 300);
    });
  }
});

async function parseJsonSafe(res, url) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Non-JSON from ${url}: ${text.substring(0, 120)}...`);
  }
  return res.json();
}

async function loadProfile(userId) {
  try {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const urls = [
      `${API}/users/${userId}`,
      `${API}/users/${userId}/stats`,
      `${API}/posts/user/${userId}`,
    ];

    const [userRes, statsRes, postsRes] = await Promise.all(
      urls.map((u) => fetch(u, { headers }))
    );

    // Validate user and stats; allow posts to fallback
    if (!userRes.ok || !statsRes.ok) {
      const bad = !userRes.ok ? userRes : statsRes;
      const badUrl = !userRes.ok ? urls[0] : urls[1];
      const text = await bad.text();
      throw new Error(
        `HTTP ${bad.status} on ${badUrl}: ${text.substring(0, 120)}...`
      );
    }

    const [user, stats] = await Promise.all([
      parseJsonSafe(userRes, urls[0]),
      parseJsonSafe(statsRes, urls[1]),
    ]);

    // Posts: try dedicated endpoint; if 404, fallback to /api/posts and filter
    let posts;
    if (postsRes.ok) {
      posts = await parseJsonSafe(postsRes, urls[2]);
    } else if (postsRes.status === 404) {
      const allRes = await fetch(`${API}/posts`, { headers });
      if (!allRes.ok) {
        const t = await allRes.text();
        throw new Error(
          `HTTP ${allRes.status} on ${API}/posts: ${t.substring(0, 120)}...`
        );
      }
      const all = await parseJsonSafe(allRes, `${API}/posts`);
      posts = (all || []).filter((p) => {
        const uid = (p.user && (p.user._id || p.user)) || null;
        return uid === userId;
      });
    } else {
      const text = await postsRes.text();
      throw new Error(
        `HTTP ${postsRes.status} on ${urls[2]}: ${text.substring(0, 120)}...`
      );
    }

    if (!user || user.error) throw new Error(user?.error || "User not found");

    // Header
    $("#profileName").textContent = user.name || user.username;
    $("#profileUsername").textContent = `@${user.username}`;
    $("#profileBio").textContent = user.bio || "";
    const DEFAULT_AVATAR = "/images/profile.png";
    $("#profileAvatar").src = user.avatar || DEFAULT_AVATAR;

    // Stats
    $("#postsCount").textContent =
      stats?.postsCount ?? (Array.isArray(posts) ? posts.length : 0);
    $("#followersCount").textContent =
      user.followers?.length || stats?.followersCount || 0;
    $("#followingCount").textContent =
      user.following?.length || stats?.followingCount || 0;

    // Follow button
    renderFollowButton(user._id, user);

    // Posts
    const list = $("#userPosts");

    // Prepare Edit Profile modal with current values
    setupEditProfile(user);

    // Dark mode toggle within profile (optional if you add a button with id=profileDarkToggle)
    (function setupProfileDarkToggle() {
      const btn = document.getElementById("profileDarkToggle");
      if (!btn) return;
      const key = "sc_dark_mode";
      btn.addEventListener("click", () => {
        // After rendering posts, attach like/comment handlers similar to home
        attachProfilePostListeners();

        document.body.classList.toggle("dark");
        localStorage.setItem(
          key,
          document.body.classList.contains("dark") ? "1" : "0"
        );
      });
    })();

    list.innerHTML = "";
    (posts || []).forEach((p) => list.appendChild(createPostElement(p)));
    // Wire interactions for posts
    attachProfilePostListeners();
  } catch (e) {
    alert("Failed to load profile: " + e.message);
    console.error(e);
  }

  // Like/Comment interactions for profile posts (reusing home logic)
  function attachProfilePostListeners() {
    // Remove duplicate listeners by cloning nodes
    document.querySelectorAll("#userPosts .action-button").forEach((btn) => {
      btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll("#userPosts .action-button").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const icon = this.querySelector("i");
        if (icon.classList.contains("fa-heart")) {
          await handleProfileLike(this);
        }
        if (icon.classList.contains("fa-comment")) {
          handleProfileComment(this);
        }
        if (icon.classList.contains("fa-share-square")) {
          await handleProfileShare(this);
        }
      });
    });
  }

  async function handleProfileLike(btn) {
    const icon = btn.querySelector("i");
    const countEl = btn.querySelector("span");
    const postEl = btn.closest(".post");
    const postId = postEl?.dataset.postId;
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!postId) return alert("Post ID missing");
    if (!user || !user._id) {
      alert("Please log in again");
      return (window.location.href = "/");
    }
    btn.style.pointerEvents = "none";
    try {
      const res = await fetch(`${API}/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Error: " + (data.error || res.status));
        return;
      }
      if (data.userLiked) {
        icon.classList.replace("far", "fas");
        icon.style.color = "#ff4757";
      } else {
        icon.classList.replace("fas", "far");
        icon.style.color = "";
      }
      countEl.textContent = data.likes;
    } catch (e) {
      console.error(e);
      alert("Network error: " + e.message);
    } finally {
      btn.style.pointerEvents = "auto";
    }
  }

  function handleProfileComment(btn) {
    const postEl = btn.closest(".post");
    const commentsSection = postEl.querySelector(".comments-section");
    const isHidden =
      commentsSection.style.display === "none" ||
      commentsSection.style.display === "";
    if (isHidden) {
      commentsSection.style.display = "block";
      loadProfileComments(
        postEl.dataset.postId,
        commentsSection.querySelector(".comments-list")
      );
      const commentInput = commentsSection.querySelector(".comment-input");
      const submitBtn = commentsSection.querySelector(".comment-submit");
      submitBtn.onclick = null;
      commentInput.onkeypress = null;
      submitBtn.addEventListener("click", () =>
        submitProfileComment(
          postEl.dataset.postId,
          commentInput,
          commentsSection
        )
      );
      commentInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter")
          submitProfileComment(
            postEl.dataset.postId,
            commentInput,
            commentsSection
          );
      });
    } else {
      commentsSection.style.display = "none";
    }
  }

  async function loadProfileComments(postId, listEl) {
    try {
      listEl.innerHTML =
        '<p style="color:#888;text-align:center;">Loading comments...</p>';
      const res = await fetch(`${API}/comments/post/${postId}`);
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || res.status);
      }
      const comments = await res.json();
      listEl.innerHTML =
        (comments || [])
          .filter((c) => c && c.user)
          .map(
            (c) => `
      <div class="comment-item">
        <img class="comment-avatar" src="${
          (c.user && c.user.avatar) || "/images/profile.png"
        }" alt="${(c.user && (c.user.name || c.user.username)) || "User"}">
        <div class="comment-content">
          <div class="comment-username">${
            (c.user && (c.user.name || c.user.username)) || "User"
          }</div>
          <div class="comment-text">${c.content}</div>
          <div class="comment-time">${formatTime(c.createdAt)}</div>
        </div>
      </div>`
          )
          .join("") ||
        '<p style="color:#888;text-align:center;">No comments yet.</p>';
    } catch (e) {
      listEl.innerHTML = `<p style=\"color:#888;text-align:center;\">Error: ${e.message}</p>`;
    }
  }

  async function submitProfileComment(postId, inputEl, section) {
    const content = inputEl.value.trim();
    if (!content) return;
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || !user._id) {
      alert("Please log in again");
      return (window.location.href = "/");
    }
    const btn = section.querySelector(".comment-submit");
    btn.disabled = true;
    btn.textContent = "Posting...";
    try {
      const res = await fetch(`${API}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, post: postId, user: user._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.status);
      inputEl.value = "";
      // reload comments and bump count
      await loadProfileComments(
        postId,
        section.querySelector(".comments-list")
      );
      const cBtn = section.closest(".post").querySelector(".comment-btn span");
      const current = parseInt(cBtn.textContent) || 0;
      cBtn.textContent = current + 1;
    } catch (e) {
      alert("Error posting comment: " + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Post";
    }
  }
}

// Navigation
const goHome = () => (window.location.href = "/home");
$("#goHomeMenu")?.addEventListener("click", goHome);
// Ensure sidebar Home also navigates back
$("#sidebarHome")?.addEventListener("click", goHome);

$("#goHomeBottom")?.addEventListener("click", goHome);
$("#logoutMenu")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
});

// Sidebar 'More' menu + Dark Mode (reuse behavior similar to home)
(function setupSidebarMoreProfile() {
  const more = document.getElementById("sidebarMore");
  const menu = document.getElementById("sidebarMoreMenu");
  if (!more || !menu) return;
  more.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = more.classList.toggle("open");
    menu.style.display = isOpen ? "block" : "none";
  });
  // Share handler for profile posts
  async function handleProfileShare(btn) {
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
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard");
    } catch (e) {
      console.error("Share failed:", e);
      alert("Could not share. Please try again.");
    }
  }

  menu.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", (ev) => {
    if (!more.contains(ev.target)) {
      more.classList.remove("open");
      menu.style.display = "none";
    }
  });

  const key = "sc_dark_mode";
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
      key,
      document.body.classList.contains("dark") ? "1" : "0"
    );
    updateDarkToggleLabel();
  });

  document.getElementById("logoutMenu")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  });
})();

// Open self-profile if no id in query
const params = new URLSearchParams(window.location.search);
const idFromQuery = params.get("id");
const currentUser = JSON.parse(localStorage.getItem("user") || "null");
const userId = idFromQuery || currentUser?._id;

if (!userId) {
  alert("No user selected. Redirecting to home.");
  window.location.href = "/home";
}

// ---- Edit Profile Modal logic ----
function setupEditProfile(user) {
  const modal = document.getElementById("editProfileModal");
  const openBtn = document.getElementById("editProfileBtn");
  const closeBtn = document.getElementById("editProfileClose");
  const cancelBtn = document.getElementById("epCancel");

  if (!modal || !openBtn) return;

  const avatarPrev = document.getElementById("epAvatarPreview");
  const disp = document.getElementById("epDisplayName");
  const uname = document.getElementById("epUsername");
  const nameInput = document.getElementById("epName");
  const bioInput = document.getElementById("epBio");
  const bioCount = document.getElementById("epBioCount");
  const submitBtn = document.getElementById("epSubmit");
  const changePhotoBtn = document.getElementById("epChangePhotoBtn");
  const fileInput = document.getElementById("epAvatarFile");

  const DEFAULT_AVATAR = "/images/profile.png";

  function fillValues(u) {
    avatarPrev.src = u.avatar || DEFAULT_AVATAR;
    disp.textContent = u.name || u.username;
    uname.textContent = `@${u.username}`;
    nameInput.value = u.name || "";
    bioInput.value = u.bio || "";
    bioCount.textContent = String((u.bio || "").length);
  }
  fillValues(user);

  bioInput?.addEventListener("input", () => {
    bioCount.textContent = String(bioInput.value.length);
  });

  changePhotoBtn?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => (avatarPrev.src = reader.result);
      reader.readAsDataURL(file);
    }
  });

  function open() {
    // show and then trigger CSS transition
    modal.style.display = "flex";
    requestAnimationFrame(() => modal.classList.add("show"));
  }
  function close() {
    // reverse animation then hide after overlay transition ends
    modal.classList.remove("show");
    const onEnd = (e) => {
      if (e.target !== modal) return; // ensure overlay fired
      modal.style.display = "none";
      modal.removeEventListener("transitionend", onEnd);
    };
    modal.addEventListener("transitionend", onEnd);
  }

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  cancelBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  submitBtn?.addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in again");
      window.location.href = "/";
      return;
    }
    submitBtn.disabled = true;

    // If a file was chosen, we will inline it as Base64 for simplicity.
    // In production, upload to storage and save URL.
    let avatar = user.avatar || DEFAULT_AVATAR;
    const file = fileInput?.files?.[0];
    if (file) {
      avatar = avatarPrev.src; // data URL from reader
    }

    try {
      const res = await fetch(`${API}/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          bio: bioInput.value.trim(),
          avatar,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      // Update header UI with new values
      document.getElementById("profileName").textContent =
        data.user.name || data.user.username;
      document.getElementById("profileBio").textContent = data.user.bio || "";
      document.getElementById("profileAvatar").src =
        data.user.avatar || DEFAULT_AVATAR;

      // Also update localStorage user cache if present
      const me = JSON.parse(localStorage.getItem("user") || "null");
      if (me && me._id === data.user._id) {
        localStorage.setItem("user", JSON.stringify({ ...me, ...data.user }));
      }

      close();
    } catch (e) {
      alert("Failed to update profile: " + e.message);
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ---- Settings modal (profile header cog) ----
  (function setupSettingsModal() {
    const openBtn = document.getElementById("profileSettingsBtn");
    const modal = document.getElementById("settingsModal");
    const closeBtn = document.getElementById("settingsClose");
    const cancelBtn = document.getElementById("settingsCancel");
    const logoutBtn = document.getElementById("settingsLogout");
    if (!openBtn || !modal) return;
    const open = () => {
      // show and then trigger CSS transition
      modal.style.display = "flex";
      requestAnimationFrame(() => modal.classList.add("show"));
    };
    const close = () => {
      // reverse animation then hide when transition ends
      modal.classList.remove("show");
      const onEnd = (e) => {
        if (e.target !== modal) return; // overlay only
        modal.style.display = "none";
        modal.removeEventListener("transitionend", onEnd);
      };
      modal.addEventListener("transitionend", onEnd);
    };
    openBtn.addEventListener("click", open);
    closeBtn?.addEventListener("click", close);
    cancelBtn?.addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
    logoutBtn?.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    });
  })();
}

// Load on DOM ready
document.addEventListener("DOMContentLoaded", () => loadProfile(userId));
