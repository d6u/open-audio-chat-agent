import sounddevice as sd
import numpy as np
import sys

def play_raw_pcm(file_path, sample_rate, sample_width, channels):
    """Plays raw PCM data from a file using sounddevice."""

    try:
        with open(file_path, 'rb') as f:
            audio_data = f.read()

        # Determine NumPy dtype based on sample width
        if sample_width == 2:  # 16-bit
            dtype = np.int16
        elif sample_width == 1:  # 8-bit
            dtype = np.uint8
        else:
            raise ValueError("Unsupported sample width")

        # Convert bytes to NumPy array
        audio_array = np.frombuffer(audio_data, dtype=dtype)

        # Reshape for multi-channel audio
        if channels > 1:
            num_frames = len(audio_array) // channels
            audio_array = audio_array.reshape((num_frames, channels))

        # 8 bit needs to be centered around zero.
        if dtype == np.uint8:
          audio_array = audio_array.astype(np.int16) - 128

        print(audio_array.size)

        sd.play(audio_array, sample_rate)
        sd.wait()

    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
    except ValueError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# Example usage:
if len(sys.argv) != 2:
    print("Usage: python play-pcm.py <raw_pcm_file>")
    sys.exit(1)

raw_pcm_file = sys.argv[1]
sample_rate = 24000  # Replace with your sample rate
sample_width = 2      # Replace with your sample width (1 for 8-bit, 2 for 16-bit)
channels = 1         # Replace with your number of channels (1 for mono, 2 for stereo)

play_raw_pcm(raw_pcm_file, sample_rate, sample_width, channels)
