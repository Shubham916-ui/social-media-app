// Using built-in fetch (Node.js 18+)

async function testLogin() {
  try {
    const response = await fetch("http://localhost:5000/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "john@example.com",
        password: "password123",
      }),
    });

    const data = await response.json();
    console.log("Login response:", data);

    if (data.token) {
      console.log("Login successful!");
      console.log("Token:", data.token);
      console.log("User:", data.user);
    } else {
      console.log("Login failed:", data.error);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testLogin();
