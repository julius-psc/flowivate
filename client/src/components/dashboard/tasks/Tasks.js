

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

    const handleTaskNameChange = (event, taskId) => {
        const updatedTasks = tasks.map(task => {
            if (task.id === taskId) {
                return { ...task, name: event.target.value };
            }
            return task;
        });

        setTasks(updatedTasks);
    }

    const handleTaskCreation = async () => {
        if (newTaskName) {
            try {
                const response = await axios.post("http://localhost:3001/tasks", {
                    task: newTaskName
                }, {
                    withCredentials: true
                });

                if (response.data.message === "Task added successfully") {
                    const newTask = {
                        id: response.data.taskId,
                        name: newTaskName,
                        completed: false
                    };

                    setTasks([...tasks, newTask]);
                    setNewTaskName("");
                    setIsCreatingTask(false);
                    fetchTasks();
                } else {
                    console.error("Task creation failed:", response.data.message);
                }
            } catch (error) {
                console.error("Error creating task:", error);
            }
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await axios.get("http://localhost:3001/tasks", {
                withCredentials: true // Ensure credentials are sent with the request
            });

            // Assuming the response contains tasks data
            const tasksData = response.data;
            setTasks(tasksData);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    useEffect(() => {
        fetchTasks(); // Fetch tasks when the component mounts
    }, []);

    const handleCheckboxChange = async (taskId) => {
        try {
            // Send a request to update task completion status in the database
            await axios.put(`http://localhost:3001/tasks/${taskId}`, null, {
                withCredentials: true
            });
    
            // Update the local state to reflect the change
            setTasks(prevTasks => prevTasks.map(task => {
                if (task.task_id === taskId) {
                    return { ...task, completed: !task.completed }; // Toggle the completed status
                }
                return task;
            }));
        } catch (error) {
            console.error("Error updating task:", error);
        }
    }    
    

    const handleBlur = (taskId) => {
        setTasks(prevTasks => prevTasks.map(task => {
            if (task.id === taskId) {
                return { ...task, editing: false };
            }
            return task;
        }));
    }

    const handleKeyDown = (event, taskId) => {
        if (event.key === "Enter") {
            handleBlur(taskId);
        }
    }

    const incompleteTasks = tasks.filter(task => !task.completed);

    return (
        <div className="tasks">
            <Topbar />
            <div className="today-container">
                <h1>Today - <span>{incompleteTasks.length}</span></h1>
                {tasks.map(task => (
                    <div key={task.task_id} className="task-div">
                        {task.editing ? (
                            <input
                                type="text"
                                value={task.name}
                                onChange={(e) => handleTaskNameChange(e, task.task_id)}
                                onBlur={() => handleBlur(task.task_id)}
                                onKeyDown={(e) => handleKeyDown(e, task.task_id)}
                                autoFocus
                            />
                        ) : (
                            <label className={`task-checkbox-container ${task.completed ? "completed" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => handleCheckboxChange(task.task_id)}
                                    className="task-checkbox"
                                />
                                <div className="checkmark"></div>
                                {task.task} {/* Use task.task for the task name */}
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
                                onChange={(e) => setNewTaskName(e.target.value)}
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
