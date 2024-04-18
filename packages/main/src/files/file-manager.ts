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

import { RequestOptions } from "../../types";
import { readFileSync } from "fs";
import { FilesRequestUrl, getHeaders, makeFilesRequest } from "./request";
import {
  FileMetadata,
  FileMetadataResponse,
  ListFilesResponse,
  ListParams,
  UploadFileResponse,
} from "./types";
import { FilesTask } from "./constants";

// Internal type, metadata sent in the upload
export interface UploadMetadata {
  name?: string;
  ["display_name"]?: string;
}

/**
 * Class for managing GoogleAI file uploads.
 * @public
 */
export class GoogleAIFileManager {
  constructor(
    public apiKey: string,
    private _requestOptions?: RequestOptions,
  ) {}

  /**
   * Upload a file
   */
  async uploadFile(
    filePath: string,
    fileMetadata: FileMetadata,
  ): Promise<UploadFileResponse> {
    const file = readFileSync(filePath);
    const url = new FilesRequestUrl(
      FilesTask.UPLOAD,
      this.apiKey,
      this._requestOptions,
    );

    const uploadHeaders = getHeaders(url);
    const boundary = genBoundary();
    uploadHeaders.append("X-Goog-Upload-Protocol", "multipart");
    uploadHeaders.append(
      "Content-Type",
      `multipart/related; boundary=${boundary}`,
    );

    const uploadMetadata: FileMetadata = {
      mimeType: fileMetadata.mimeType,
    };
    uploadMetadata.displayName = fileMetadata.displayName;
    uploadMetadata.name = fileMetadata.name;
    if (!uploadMetadata.name?.includes("/")) {
      uploadMetadata.name = `files/${uploadMetadata.name}`;
    }

    // Multipart formatting code taken from @firebase/storage
    const metadataString = JSON.stringify({ file: uploadMetadata });
    const preBlobPart =
      "--" +
      boundary +
      "\r\n" +
      "Content-Type: application/json; charset=utf-8\r\n\r\n" +
      metadataString +
      "\r\n--" +
      boundary +
      "\r\n" +
      "Content-Type: " +
      fileMetadata.mimeType +
      "\r\n\r\n";
    const postBlobPart = "\r\n--" + boundary + "--";
    const blob = new Blob([preBlobPart, file, postBlobPart]);

    const response = await makeFilesRequest(url, uploadHeaders, blob);
    return response.json();
  }

  /**
   * List all uploaded files
   */
  async listFiles(listParams?: ListParams): Promise<ListFilesResponse> {
    const url = new FilesRequestUrl(
      FilesTask.LIST,
      this.apiKey,
      this._requestOptions,
    );
    if (listParams?.pageSize) {
      url.appendParam("pageSize", listParams.pageSize.toString());
    }
    if (listParams?.pageToken) {
      url.appendParam("pageToken", listParams.pageToken);
    }
    const uploadHeaders = getHeaders(url);
    const response = await makeFilesRequest(url, uploadHeaders);
    return response.json();
  }

  /**
   * Get metadata for file with given ID
   */
  async getFile(fileId: string): Promise<FileMetadataResponse> {
    const url = new FilesRequestUrl(
      FilesTask.GET,
      this.apiKey,
      this._requestOptions,
    );
    url.appendPath(parseFileId(fileId));
    const uploadHeaders = getHeaders(url);
    const response = await makeFilesRequest(url, uploadHeaders);
    return response.json();
  }

  /**
   * Delete file with given ID
   */
  async deleteFile(fileId: string): Promise<void> {
    const url = new FilesRequestUrl(
      FilesTask.DELETE,
      this.apiKey,
      this._requestOptions,
    );
    url.appendPath(parseFileId(fileId));
    const uploadHeaders = getHeaders(url);
    await makeFilesRequest(url, uploadHeaders);
  }
}

/**
 * If fileId is prepended with "files/", remove prefix
 */
function parseFileId(fileId: string): string {
  if (fileId.startsWith("files/")) {
    return fileId.split("files/")[1];
  }
  return fileId;
}

function genBoundary(): string {
  let str = "";
  for (let i = 0; i < 2; i++) {
    str = str + Math.random().toString().slice(2);
  }
  return str;
}
