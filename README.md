## Commands I have run

$ ffmpeg -i radiolab061016_moreperfect_episode2.mp3 -f segment -segment_times 10,20 -c copy -map 0 output/02%d.mp3

### Better with padded zeros (note, -segment_list is not working)

$ ffmpeg -i radiolab061016_moreperfect_episode2.mp3 -f segment -segment_times 10,20,30,40,50,60,70,80,90,100 -c copy -map 0 output/%05d.mp3 -segment_list output/segments.txt

## Get the duration of the audio file (returns a float value in seconds)

$ ffprobe -i radiolab061016_moreperfect_episode2.mp3 -show_entries format=duration -v quiet -of csv="p=0"
