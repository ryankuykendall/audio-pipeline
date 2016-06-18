#!/usr/bin/env node

/*
  Promisify this so that you can do this:
  var processor = probe
    .then(transcodeToFlac)
    .then(chunk)
    .then(rename)
    .then(upload) or .then(callSpeechAPI)
    .then(...)

    Also...could this be packaged up easily as a chrome app?
    https://developer.chrome.com/apps/fileSystem
*/

"use strict";

var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

var executable = process.argv[1];
var filename = process.argv[2];
var extension = path.extname(filename);
var filenameRoot = filename.split(extension).shift().split('/').pop();
var cwd = process.cwd();
console.log("Processing", cwd, executable.split(cwd).pop(), filename, filenameRoot);

var probeCommand = [
  'ffprobe -i', filename,
  '-show_entries format=duration',
  '-v quiet',
  '-of csv="p=0"'
].join(' ')

var probeProcess = exec(probeCommand, (error, stdout, stderr) => {
  var duration = parseFloat(stdout);
  if (duration) {
    chunk(duration);
  } else {
    // console.log(`stdout: ${stdout}`);
    // console.log(`stderr: ${stderr}`);
    if (error !== null) {
        console.log(`exec error: ${error}`);
    }
  }
});

var chunk = function(duration) {
  var chunkSize = 10;
  var chunkStartTimes = [];
  var currentChunkStartTime = 0;

  while (currentChunkStartTime < duration) {
    chunkStartTimes.push(currentChunkStartTime);
    currentChunkStartTime += chunkSize;
  }

  // console.log("Chunk start times =", chunkStartTimes.join(','));
  var outputPathItems = ['output', filenameRoot];
  var outputPath = outputPathItems.join('/');

  for (var i = 0 ; i < outputPathItems.length ; i++) {
    var pathToTest = outputPathItems.slice(0, i + 1).join('/');
    // console.log("pathToTest", pathToTest, filenameRoot);
    if (!fs.existsSync(pathToTest)) {
      fs.mkdirSync(pathToTest);
    }
  }

  var chunkCommand = [
    'ffmpeg -i', filename,
    '-f segment',
    '-segment_times', chunkStartTimes.join(','),
    '-c copy',
    // NOTE: Can we do the conversion to flac and segment at the same time?
    //   apparently just changing the file extension is not sufficient :(
    '-map 0', [outputPath, '%05d0.mp3'].join('/'),
    // NOTE: Segment list is not outputting for some reason...
    '-segment_list', [outputPath, 'segments.txt'].join('/')
  ].join(' ')

  console.log('Chunk command = ', chunkCommand);

  var chunkProcess = exec(chunkCommand, (error, stdout, stderr) => {
    // console.log(`stdout: ${stdout}`);
    // console.log(`stderr: ${stderr}`);
    if (error !== null) {
        console.log(`exec error: ${error}`);
    } else {
      // Hmmm...should this be changed to output by time-duration?
      // 00:00:00-00:00:10...that would be nicer...Rename!
      fs.readdir(outputPath, function (err, list) {
        // Return the error if something went wrong
        if (err)
          return action(err);

        // For every file in the list
        list.forEach(function (item) {
          // Full path of that file
          var file = outputPath + "/" + item;
          var extension = path.extname(item);
          var fileRoot = item.split('.').shift();
          var startTime = parseInt(fileRoot, 10);
          var endTime = startTime + chunkSize;
          var newFileRoot = [
            hoursMinutesSecondsFormatter(startTime),
            hoursMinutesSecondsFormatter(endTime)
          ].join('-');

          var newFile = [
            outputPath,
            newFileRoot
          ].join('/');
          newFile += extension;
          // console.log('Renaming file...', item, newFile);
          fs.renameSync(file, newFile);

          // TODO: Ahem...why didn't you just do this conversion at the
          //   beginning??? So silly!
          var flacFilename = newFile.replace(extension, '.flac');
          var flacCommand = [
            'ffmpeg -i', newFile,
            flacFilename
          ].join(' ')
          var flacProcess = exec(flacCommand, (error, stdout, stderr) => {
            // console.log(`stdout: ${stdout}`);
            // console.log(`stderr: ${stderr}`);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
          });
        });
      });
    }
  });
}

var hoursMinutesSecondsFormatter = function(seconds) {
  var hourInSeconds = 3600;
  var minuteInSeconds = 60;
  var secondsRemaining = seconds;
  var hours = Math.floor(secondsRemaining / hourInSeconds);

  if (hours > 0) {
    secondsRemaining = secondsRemaining % (hours * hourInSeconds);
  }

  var minutes = Math.floor(secondsRemaining / minuteInSeconds);
  if (minutes > 0) {
    secondsRemaining = secondsRemaining % (minutes * minuteInSeconds);
  }
  // console.log("hoursMinutesSecondsFormatter", seconds, hours, minutes, secondsRemaining);
  return [
    formatTimeSegment(hours),
    formatTimeSegment(minutes),
    formatTimeSegment(secondsRemaining)
  ].join(':')
}

var formatTimeSegment = function(segment) {
  if (segment > 9) {
    return segment;
  }

  return [0, segment].join('');
}
