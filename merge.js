#!/usr/bin/env node

"use strict";

var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

var cwd = process.cwd();
var executable = process.argv[1];
var responseDirectoryPath = process.argv[2];
var responseDirectoryPathItems = responseDirectoryPath.split('/');
var mergeDirectoryPathItems = responseDirectoryPathItems.slice(0, -1).concat(['merge']);
var mergeDirectoryPath = mergeDirectoryPathItems.join('/');

fs.mkdirSync(mergeDirectoryPath);

fs.readdir(chunkDirectoryPath, function (err, list) {
  // Return the error if something went wrong
  if (err)
    return action(err);

  // For every file in the list
  list.forEach(function (item) {
    // Full path of that file
    var file = chunkDirectoryPath + "/" + item;
    var extension = path.extname(item);
    var fileRoot = item.split('.').shift();
    var b64contents = fs.readFileSync(file).toString('base64');
    var responseFilename = [fileRoot, 'json'].join('.');
    var responseFilePath = [responseDirectoryPath, responseFilename].join('/');
    var timeRangeItems = fileRoot.split('-');

    console.log("Transcribing", item);
    // Call the API Here

    console.log("Saving", responseFilePath);
    fs.writeFileSync(responseFilePath, JSON.stringify({
      "start": timeRangeItems[0],
      "end": timeRangeItems[1],
      "data": {}
    }));

    sleep.sleep(1);
  })

  // TODO: Iterate over each of the flac files in directory and make a call to
  //  the API by base64 encoding the flac files and sending them off.
  //
  //  Then store the resulting responses in the response directory.

  // Last thing to do!!!
  console.log("\nNext step: $ ./merge.js", responseDirectoryPath, "\n");
});

// Last thing to do!!! Generate HTML View!!! Celebrate!!!
