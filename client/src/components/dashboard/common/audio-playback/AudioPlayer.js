// audioPlayerService.js
const AudioPlayer = {
    audio: new Audio(),
    selectedBackground: '',
    isPlaying: false,
  
    playAudio(selectedValue) {
      if (selectedValue !== 'Off') {
        this.audio.pause();
        this.audio.src = selectedValue;
        this.audio.play();
        this.selectedBackground = selectedValue;
        this.isPlaying = true;
      } else {
        this.audio.pause();
        this.selectedBackground = 'Off';
        this.isPlaying = false;
      }
    },
  
    toggleAudio() {
      if (this.selectedBackground !== 'Off') {
        if (this.isPlaying) {
          this.audio.pause();
          this.isPlaying = false;
        } else {
          this.audio.play();
          this.isPlaying = true;
        }
      }
    },
  };
  
  export default AudioPlayer;
  