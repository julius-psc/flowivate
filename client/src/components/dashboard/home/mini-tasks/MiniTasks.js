


import React, { useState, useEffect } from "react";
import axios from "axios";
import './MiniTasks.css';
import { NavLink } from "react-router-dom";
import Skeleton from '@mui/material/Skeleton';

import binClosed from '../../../../assets/images/dashboard/tasks/tasks-bin-closed.svg';
import binOpened from '../../../../assets/images/dashboard/tasks/tasks-bin-opened.svg';

const MiniTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [hoveredTaskId, setHoveredTaskId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchMiniTasks();
    }, []);

    const fetchMiniTasks = async () => {
        try {
            const response = await axios.get("http://localhost:3001/mini", {
                withCredentials: true
            });

            const miniTasks = response.data;
            setTasks(miniTasks);
            setIsLoading(false); // Set isLoading to false after successful data fetch
        } catch (error) {
            console.error("Error fetching mini tasks:", error);
            setIsLoading(false); // Set isLoading to false on error as well
        }
    };

    const handleCheckboxChange = async (taskId) => {
        try {
            // Find the task object based on the taskId
            const taskToUpdate = tasks.find(task => task.task_id === taskId);
            
            // Calculate the new completed status
            const newCompletedStatus = !taskToUpdate.completed;
            
            // Send a request to update the completed status of the mini task
            await axios.put(`http://localhost:3001/mini/${taskId}`, {
                completed: newCompletedStatus
            }, {
                withCredentials: true
            });
    
            // Update the local state to reflect the change
            setTasks(prevTasks =>
                prevTasks.map(task => {
                    if (task.task_id === taskId) {
                        return { ...task, completed: newCompletedStatus };
                    }
                    return task;
                })
            );
        } catch (error) {
            console.error("Error updating mini task:", error);
        }
    };

    const handleTaskDeletion = async (taskId) => {
        try {
            await axios.delete(`http://localhost:3001/mini/${taskId}`, {
                withCredentials: true
            });

            setTasks(prevTasks => prevTasks.filter(task => task.task_id !== taskId));
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    return (
        <div className="mini-tasks">
            <h1>Tasks</h1>
            <ul className="mini-tasks-list">
                {isLoading || tasks.length === 0 ? (
                    // Render Skeleton placeholders while loading or when there are no tasks
                    <>
                        <Skeleton height={60}  animation="wave" />
                        <Skeleton height={60} animation="wave" />
                    </>
                ) : (
                    // Render the actual tasks when loading is complete and tasks are available
                    tasks.map(task => (
                        <li key={task.task_id} className={`mini-task-item ${task.completed ? "completed" : ""}`}>
                            <label className="mini-task-checkbox-container">
                                <div className="mini-task-left">
                                    <input
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => handleCheckboxChange(task.task_id)}
                                        className="mini-task-checkbox"
                                    />
                                    <div className="mini-checkmark"></div>
                                    <span className="mini-task-text">{task.task}</span>
                                </div>
                                <div className="mini-task-right">
                                    <button
                                        onMouseEnter={() => setHoveredTaskId(task.task_id)}
                                        onMouseLeave={() => setHoveredTaskId(null)}
                                        onClick={() => handleTaskDeletion(task.task_id)}
                                    >
                                        <img
                                            src={
                                                hoveredTaskId === task.task_id
                                                    ? binOpened
                                                    : binClosed
                                            }
                                            alt="Delete task icon"
                                        />
                                    </button>
                                </div>
                            </label>
                        </li>
                    ))
                )}
            </ul>
            <div className="mini-bottom">
                <NavLink to="/dashboard/tasks"><button className="see-more">+ See more</button></NavLink>
            </div>
        </div>
    );
};

export default MiniTasks;
