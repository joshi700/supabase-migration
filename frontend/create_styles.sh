#!/bin/bash

echo "Creating CSS styles..."

# Main index.css
cat > src/styles/index.css << 'EOFCSS'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f5f7fa;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOFCSS

# App.css
cat > src/styles/App.css << 'EOFCSS'
.App {
  min-height: 100vh;
  background: #f5f7fa;
}
EOFCSS

# Login.css
cat > src/styles/Login.css << 'EOFCSS'
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 10px;
}

.login-header p {
  color: #666;
  font-size: 16px;
}

.login-form {
  margin-top: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.login-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-credentials {
  margin-top: 30px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.demo-credentials p {
  font-size: 13px;
  color: #666;
  margin: 4px 0;
}

.demo-credentials p:first-child {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}
EOFCSS

# Navbar.css
cat > src/styles/Navbar.css << 'EOFCSS'
.navbar {
  background: white;
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-brand h2 {
  font-size: 24px;
  color: #667eea;
  margin: 0;
}

.navbar-brand a {
  text-decoration: none;
}

.navbar-links {
  display: flex;
  gap: 30px;
}

.navbar-links a {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  transition: color 0.3s;
  padding: 8px 16px;
  border-radius: 6px;
}

.navbar-links a:hover {
  color: #667eea;
  background: #f5f7fa;
}

.navbar-links a.active {
  color: #667eea;
  background: #eef2ff;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.user-role {
  color: #999;
  font-size: 14px;
}

.logout-button {
  padding: 8px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.logout-button:hover {
  background: #5568d3;
  transform: translateY(-1px);
}
EOFCSS

echo "✓ Base styles created"

