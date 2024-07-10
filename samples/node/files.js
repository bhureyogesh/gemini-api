/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mediaPath = __dirname + "/media";

async function filesCreateImage() {
  // [START files_create_image]
  const fileManager = new GoogleAIFileManager(process.env.API_KEY);

  const uploadResult = await fileManager.uploadFile(
    `${mediaPath}/jetpack.jpg`,
    {
      mimeType: "image/jpeg",
      displayName: "Jetpack drawing",
    },
  );
  // View the response.
  console.log(
    `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`,
  );
  // [END files_create_image]
}

async function filesCreateAudio() {
  // [START files_create_audio]
  const fileManager = new GoogleAIFileManager(process.env.API_KEY);

  const uploadResult = await fileManager.uploadFile(
    `${mediaPath}/samplesmall.mp3`,
    {
      mimeType: "audio/mp3",
      displayName: "Audio sample",
    },
  );

  let file = await fileManager.getFile(uploadResult.file.name);
  while (file.state === FileState.PROCESSING) {
    process.stdout.write(".");
    // Sleep for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    // Fetch the file from the API again
    file = await fileManager.getFile(uploadResult.file.name);
  }

  if (file.state === FileState.FAILED) {
    throw new Error("Audio processing failed.");
  }

  // View the response.
  console.log(
    `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`,
  );
  // [END files_create_audio]
}

async function filesCreateText() {
  // [START files_create_text]
  const fileManager = new GoogleAIFileManager(process.env.API_KEY);

  const uploadResult = await fileManager.uploadFile(
    `${mediaPath}/a11.txt`,
    {
      mimeType: "text/plain",
      displayName: "Apollo 11",
    },
  );
  // View the response.
  console.log(
    `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`,
  );
  // [END files_create_text]
}

async function filesCreateVideo() {
  // [START files_create_video]
  const fileManager = new GoogleAIFileManager(process.env.API_KEY);

  const uploadResult = await fileManager.uploadFile(
    `${mediaPath}/Big_Buck_Bunny.mp4`,
    {
      mimeType: "video/mp4",
      displayName: "Big Buck Bunny",
    },
  );

  let file = await fileManager.getFile(uploadResult.file.name);
  while (file.state === FileState.PROCESSING) {
    process.stdout.write(".");
    // Sleep for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    // Fetch the file from the API again
    file = await fileManager.getFile(uploadResult.file.name);
  }

  if (file.state === FileState.FAILED) {
    throw new Error("Video processing failed.");
  }

  // View the response.
  console.log(
    `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`,
  );
  // [END files_create_video]
}

async function filesList() {
  // [START files_list]
  const fileManager = new GoogleAIFileManager(process.env.API_KEY);

  const listFilesResponse = await fileManager.listFiles();

  // View the response.
  for (const file of listFilesResponse.files) {
    console.log(`name: ${file.name} | display name: ${file.displayName}`);
  }
  // [END files_list]
}

async function filesGet() {
  // [START files_get]
  const fileManager = new GoogleAIFileManager(process.env.API_KEY);

  const uploadResponse = await fileManager.uploadFile(
    `${mediaPath}/jetpack.jpg`,
    {
      mimeType: "image/jpeg",
      displayName: "Jetpack drawing",
    },
  );

  // Get the previously uploaded file's metadata.
  const getResponse = await fileManager.getFile(uploadResponse.file.name);

  // View the response.
  console.log(`Retrieved file ${getResponse.displayName} as ${getResponse.uri}`);
  // [END files_get]
}

async function filesDelete() {
  // [START files_delete]
  const fileManager = new GoogleAIFileManager(process.env.API_KEY);

  const uploadResult = await fileManager.uploadFile(
    `${mediaPath}/jetpack.jpg`,
    {
      mimeType: "image/jpeg",
      displayName: "Jetpack drawing",
    },
  );

  // Delete the file.
  await fileManager.deleteFile(uploadResult.file.name);

  console.log(`Deleted ${uploadResult.file.displayName}`);
  // [END files_delete]
}

async function runAll() {
  // Comment out or delete any sample cases you don't want to run.
  await filesCreateImage();
  await filesCreateAudio();
  await filesCreateText();
  await filesCreateVideo();
  await filesList();
  await filesGet();
  await filesDelete();
}

runAll();
