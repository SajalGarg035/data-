// LoginPage.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom'; // Import necessary components
// import LoginPage from './Loginpage'; // Ensure correct path to LoginPage
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';
import Navbar from './components/Navbar';
import Dashboard from './dashboard';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const loginData = {
      email: email,
      password: password,
    };
    try {
        const response = await fetch("http://localhost:3000/login", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        });
  
        if (response.status === 200) {
          const data = await response.json();
          alert('Form submitted successfully!');
          console.log('Response data:', data);
           // Save the token to localStorage
        localStorage.setItem('token', data.token);
          navigate('/dashboard'); // Redirect to the login page
        }
      }
       catch (error) {
        console.error('Error submitting form:', error);
        alert('There was an error submitting the form.');
      }
  };

  return (
    <div className='App'>
        <Navbar></Navbar>
      {/* <h1>Login Page</h1> */}
      <form onSubmit={handleLoginSubmit} className="form-group">
        <div className="mb-3">
          <label htmlFor="loginEmail" className="form-label">Email address</label>
          <input
            type="email"
            className="form-control"
            id="loginEmail"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="loginPassword" className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            id="loginPassword"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
