// Dashboard.js
import React, { useEffect, useState } from 'react';
import './App.css'; // Import your custom CSS

const Dashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MjdlYTZjZjlmYTc4OGY0NmQ5NGQwZSIsImlhdCI6MTczMDY3MDc4MiwiZXhwIjoxNzMwNzU3MTgyfQ.eDYsx5bodoclAptoU4v5F1dNMHZGza0s0CWooypdJM8"; // Retrieve token from local storage
                const response = await fetch("http://localhost:3000/getdata", {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`, // Use token from local storage
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch users');
                }

                const data = await response.json();
                setUsers(data.users);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="dashboard">
            <h1>User Dashboard</h1>
            <div className="container mt-4">
                <div className="row">
                    {users.map(user => (
                        <div className="col-md-4 mb-4" key={user._id}> {/* Use user._id for unique key */}
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">{user.name}</h5>
                                    <p className="card-text">Email: {user.email}</p>
                                    <p className="card-text">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
