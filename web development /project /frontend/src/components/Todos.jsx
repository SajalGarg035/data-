import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Camera, Plus, CheckCircle2, Circle } from 'lucide-react';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    
    renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
    containerRef.current.appendChild(renderer.domElement);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add point light
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);
    
    // Create floating spheres
    const spheres = [];
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(`hsl(${i * 50}, 70%, 50%)`),
        transparent: true,
        opacity: 0.7
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(
        Math.random() * 8 - 4,
        Math.random() * 8 - 4,
        Math.random() * 8 - 4
      );
      scene.add(sphere);
      spheres.push(sphere);
    }
    
    camera.position.z = 10;
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      spheres.forEach((sphere, i) => {
        sphere.position.y += Math.sin(Date.now() * 0.001 + i) * 0.01;
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.01;
      });
      
      renderer.render(scene, camera);
    };
    
    animate();
    sceneRef.current = { scene, camera, renderer };
    
    // Cleanup
    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('http://localhost:3000/todos');
      const data = await response.json();
      setTodos(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching todos:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTodo),
      });
      const data = await response.json();
      setTodos([...todos, data.newTodo]);
      setNewTodo({ title: '', description: '' });
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  const handleComplete = async (id) => {
    try {
      const response = await fetch('http://localhost:3000/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      setTodos(todos.map(todo => 
        todo._id === id ? { ...todo, completed: true } : todo
      ));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <h1 className="text-5xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500">
            3D Todo App
          </h1>
          
          <div ref={containerRef} className="absolute top-0 right-0 -z-10 opacity-50" />
        </div>

        {/* Add Todo Form */}
        <form onSubmit={handleSubmit} className="mb-8 bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="mb-4">
            <input
              type="text"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              placeholder="Todo title"
              className="w-full p-2 rounded bg-white/20 backdrop-blur-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <textarea
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              placeholder="Description"
              className="w-full p-2 rounded bg-white/20 backdrop-blur-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-all"
          >
            <Plus size={20} />
            Add Todo
          </button>
        </form>

        {/* Todo List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo._id}
                className={`bg-white/10 backdrop-blur-lg rounded-lg p-6 transform transition-all duration-300 hover:scale-105 ${
                  todo.completed ? 'border-green-500' : 'border-white/30'
                } border`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`text-xl font-semibold ${todo.completed ? 'line-through text-green-500' : ''}`}>
                      {todo.title}
                    </h3>
                    <p className="text-gray-300 mt-2">{todo.description}</p>
                  </div>
                  {!todo.completed && (
                    <button
                      onClick={() => handleComplete(todo._id)}
                      className="text-green-500 hover:text-green-400 transition-colors"
                    >
                      <Circle size={24} />
                    </button>
                  )}
                  {todo.completed && (
                    <CheckCircle2 size={24} className="text-green-500" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoApp;