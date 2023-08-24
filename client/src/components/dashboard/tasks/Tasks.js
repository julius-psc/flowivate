


import React, { useState, useEffect } from "react";
import Topbar from "../common/topbar/Topbar";
import './Tasks.css';
import axios from "axios";

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [newTaskName, setNewTaskName] = useState("");
    const [isCreatingTask, setIsCreatingTask] = useState(false);

    const handleNewTask = () => {
        setIsCreatingTask(true);
    }

    const handleTaskNameChange = (event) => {
        setNewTaskName(event.target.value);
    }

    const handleTaskCreation = async () => {
        if (newTaskName) {
            try {
                const response = await axios.post("http://localhost:3001/tasks", {
                    task: newTaskName
                }, {
                    withCredentials: true
                });

                // Assuming your backend responds with a success message
                if (response.data.message === "Task added successfully") {
                    const newTask = {
                        id: response.data.taskId, // Assuming the backend returns the new task's ID
                        name: newTaskName,
                        completed: false
                    };

                    setTasks([...tasks, newTask]);
                    setNewTaskName("");
                    setIsCreatingTask(false);
                } else {
                    console.error("Task creation failed:", response.data.message);
                }
            } catch (error) {
                console.error("Error creating task:", error);
            }
        }
    };

    const handleCheckboxChange = (taskId) => {
        const updatedTasks = tasks.map(task => {
            if (task.id === taskId) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });

        setTasks(updatedTasks);
    }

    const handleBlur = (taskId) => {
        const updatedTasks = tasks.map(task => {
            if (task.id === taskId) {
                return { ...task, editing: false, name: newTaskName };
            }
            return task;
        });

        setTasks(updatedTasks);
    }

    const handleKeyDown = (event, taskId) => {
        if (event.key === "Enter") {
            handleBlur(taskId);
        }
    }

    useEffect(() => {
        // Fetch user's tasks from the backend
        const fetchTasks = async () => {
          try {
            const response = await axios.get("http://localhost:3001/tasks", {
              withCredentials: true
            });
    
            if (response.data && response.data.tasks) {
              setTasks(response.data.tasks);
            }
          } catch (error) {
            console.error("Error fetching tasks:", error);
          }
        };
    
        fetchTasks();
    }, []);

    const incompleteTasks = tasks.filter(task => !task.completed);

    return (
        <div className="tasks">
            <Topbar />
            <div className="today-container">
                <h1>Today - <span>{incompleteTasks.length}</span></h1>
                {tasks.map(task => (
                    <div key={task.id} className="task-div">
                        {task.editing ? (
                            <input
                                type="text"
                                value={newTaskName}
                                onChange={handleTaskNameChange}
                                onBlur={() => handleBlur(task.id)}
                                onKeyDown={(e) => handleKeyDown(e, task.id)}
                                autoFocus
                            />
                        ) : (
                            <label className={`task-checkbox-container ${task.completed ? "completed" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => handleCheckboxChange(task.id)}
                                    className="task-checkbox"
                                />
                                <div className="checkmark"></div>
                                {task.name}
                            </label>
                        )}
                    </div>
                ))}
                <div className="new-task">
                    {isCreatingTask ? (
                        <div className="task-div">
                            <input
                                type="text"
                                placeholder="Type and press Enter..."
                                value={newTaskName}
                                onChange={handleTaskNameChange}
                                onBlur={handleTaskCreation}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleTaskCreation();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    ) : (
                        <button onClick={handleNewTask}>+ New Task</button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Tasks;
