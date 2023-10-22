import React, { useState, useEffect } from 'react';
import audioPlayerService from '../../common/audio-playback/AudioPlayer';
import './Ambient.css';

import birds from '../../../../assets/audio/ambient/ambient-birds.mp3';
import jungle from '../../../../assets/audio/ambient/ambient-jungle.mp3';
import rain from '../../../../assets/audio/ambient/ambient-rain.mp3';
import fire from '../../../../assets/audio/ambient/ambient-fireplace.mp3';

const Ambient = () => {
  const [selectedBackground, setSelectedBackground] = useState(audioPlayerService.selectedBackground);

  // Handle the change when the user selects a new background
  const handleBackgroundChange = (event) => {
    const selectedValue = event.target.value;
    audioPlayerService.playAudio(selectedValue); // Use the service to control audio playback
    setSelectedBackground(selectedValue);
  };

  // Add an event listener for the "ended" event to enable auto-replay
  useEffect(() => {
    const audioElement = audioPlayerService.audio;
    audioElement.addEventListener('ended', () => {
      // When the audio ends, reset the playback by setting currentTime to 0 and play again.
      audioElement.currentTime = 0;
      audioElement.play();
    });

    // Cleanup by removing the event listener when the component unmounts
    return () => {
      audioElement.removeEventListener('ended', () => {});
    };
  }, []);

  return (
    <div className='ambient'>
      <select value={selectedBackground} onChange={handleBackgroundChange}>
        <option value="Off">Off</option>
        <option value={birds}>Birds</option>
        <option value={jungle}>Jungle</option>
        <option value={rain}>Rain</option>
        <option value={fire}>Fire</option>
      </select>
    </div>
  );
}

export default Ambient;
