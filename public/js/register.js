// Registration form validation and submission
document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const submitBtn = registerForm.querySelector('button[type="submit"]');

  // Form elements
  const username = document.getElementById("username");
  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const bio = document.getElementById("bio");

  // Create error/success message elements
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  const successDiv = document.createElement("div");
  successDiv.className = "success-message";

  registerForm.insertBefore(errorDiv, registerForm.firstChild);
  registerForm.insertBefore(successDiv, registerForm.firstChild);

  // Validation functions
  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    successDiv.style.display = "none";
  }

  function showSuccess(message) {
    successDiv.textContent = message;
    successDiv.style.display = "block";
    errorDiv.style.display = "none";
  }

  function hideMessages() {
    errorDiv.style.display = "none";
    successDiv.style.display = "none";
  }

  function validateForm() {
    hideMessages();

    // Remove error styling
    [username, name, email, password, confirmPassword].forEach((field) => {
      field.classList.remove("input-error");
    });

    // Validation checks
    if (username.value.trim().length < 3) {
      username.classList.add("input-error");
      showError("Username must be at least 3 characters long");
      return false;
    }

    if (name.value.trim().length < 2) {
      name.classList.add("input-error");
      showError("Name must be at least 2 characters long");
      return false;
    }

    if (!isValidEmail(email.value)) {
      email.classList.add("input-error");
      showError("Please enter a valid email address");
      return false;
    }

    if (password.value.length < 6) {
      password.classList.add("input-error");
      showError("Password must be at least 6 characters long");
      return false;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.classList.add("input-error");
      showError("Passwords do not match");
      return false;
    }

    return true;
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Real-time validation
  confirmPassword.addEventListener("input", function () {
    if (password.value && confirmPassword.value) {
      if (password.value !== confirmPassword.value) {
        confirmPassword.classList.add("input-error");
      } else {
        confirmPassword.classList.remove("input-error");
      }
    }
  });

  // Form submission
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");
    submitBtn.textContent = "Creating Account...";

    try {
      const userData = {
        username: username.value.trim(),
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value,
        bio: bio.value.trim() || undefined,
      };

      const result = await api.post("/users/register", userData);

      if (result.user) {
        showSuccess("Account created successfully! Redirecting to login...");

        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = "index.html";
        }, 2000);
      } else {
        showError(result.error || "Registration failed");
      }
    } catch (error) {
      showError("Network error: " + error.message);
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.classList.remove("loading");
      submitBtn.textContent = "Create Account";
    }
  });

  // Check if already logged in
  if (auth.isLoggedIn()) {
    window.location.href = "home.html";
  }
});
