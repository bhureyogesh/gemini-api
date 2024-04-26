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

export class GoogleGenerativeAIError extends Error {
  constructor(message: string) {
    super(`[GoogleGenerativeAI Error]: ${message}`);
  }
}

export class GoogleGenerativeAIResponseError<
  T,
> extends GoogleGenerativeAIError {
  constructor(
    message: string,
    public response?: T,
  ) {
    super(message);
  }
}

export class GoogleGenerativeAIFetchError extends GoogleGenerativeAIError {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public errorDetails?: ErrorDetails[],
  ) {
    super(message);
  }
}

interface ErrorDetails {
  "@type"?: string;
  reason?: string;
  domain?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}
