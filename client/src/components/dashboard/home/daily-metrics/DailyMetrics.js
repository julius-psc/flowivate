


import React from "react";
import './DailyMetrics.css';

import WaterIntake from "./water-intake/WaterIntake";
import SleepTrack from "./sleep-track/SleepTrack";

const DailyMetrics = () => {
    return (
        <div className="metrics">
            <div class="metrics-grid">
                <div class="metric-1"></div>
                <div class="metric-2"><SleepTrack /></div>
                <div class="metric-3"></div>
                <div class="metric-4"><WaterIntake /></div>
                <div class="metric-5"></div>
            </div>
        </div>
    )
}

export default DailyMetrics;