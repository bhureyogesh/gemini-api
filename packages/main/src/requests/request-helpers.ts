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

import {
  Content,
  CountTokensRequest,
  EmbedContentRequest,
  GenerateContentRequest,
  ModelParams,
  Part,
  _CountTokensRequestInternal,
  _GenerateContentRequestInternal,
} from "../../types";
import {
  GoogleGenerativeAIError,
  GoogleGenerativeAIRequestInputError,
} from "../errors";

export function formatSystemInstruction(
  input?: string | Part | Content,
): Content | undefined {
  // null or undefined
  if (input == null) {
    return undefined;
  } else if (typeof input === "string") {
    return { role: "system", parts: [{ text: input }] } as Content;
  } else if ((input as Part).text) {
    return { role: "system", parts: [input as Part] };
  } else if ((input as Content).parts) {
    if (!(input as Content).role) {
      return { role: "system", parts: (input as Content).parts };
    } else {
      return input as Content;
    }
  }
}

export function formatNewContent(
  request: string | Array<string | Part>,
): Content {
  let newParts: Part[] = [];
  if (typeof request === "string") {
    newParts = [{ text: request }];
  } else {
    for (const partOrString of request) {
      if (typeof partOrString === "string") {
        newParts.push({ text: partOrString });
      } else {
        newParts.push(partOrString);
      }
    }
  }
  return assignRoleToPartsAndValidateSendMessageRequest(newParts);
}

/**
 * When multiple Part types (i.e. FunctionResponsePart and TextPart) are
 * passed in a single Part array, we may need to assign different roles to each
 * part. Currently only FunctionResponsePart requires a role other than 'user'.
 * @private
 * @param parts Array of parts to pass to the model
 * @returns Array of content items
 */
function assignRoleToPartsAndValidateSendMessageRequest(
  parts: Part[],
): Content {
  const userContent: Content = { role: "user", parts: [] };
  const functionContent: Content = { role: "function", parts: [] };
  let hasUserContent = false;
  let hasFunctionContent = false;
  for (const part of parts) {
    if ("functionResponse" in part) {
      functionContent.parts.push(part);
      hasFunctionContent = true;
    } else {
      userContent.parts.push(part);
      hasUserContent = true;
    }
  }

  if (hasUserContent && hasFunctionContent) {
    throw new GoogleGenerativeAIError(
      "Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.",
    );
  }

  if (!hasUserContent && !hasFunctionContent) {
    throw new GoogleGenerativeAIError(
      "No content is provided for sending chat message.",
    );
  }

  if (hasUserContent) {
    return userContent;
  }

  return functionContent;
}

export function formatCountTokensInput(
  params: CountTokensRequest | string | Array<string | Part>,
  modelParams?: ModelParams,
): _CountTokensRequestInternal {
  let formattedGenerateContentRequest: _GenerateContentRequestInternal = {
    model: modelParams?.model,
    generationConfig: modelParams?.generationConfig,
    safetySettings: modelParams?.safetySettings,
    tools: modelParams?.tools,
    toolConfig: modelParams?.toolConfig,
    systemInstruction: modelParams?.systemInstruction,
    cachedContent: modelParams?.cachedContent?.name,
    contents: [],
  };
  // let formattedRequest: _CountTokensRequestInternal = {
  //   generateContentRequest: {
  //     model: modelParams?.model,
  //     generationConfig: modelParams?.generationConfig,
  //     safetySettings: modelParams?.safetySettings,
  //     tools: modelParams?.tools,
  //     toolConfig: modelParams?.toolConfig,
  //     systemInstruction: modelParams?.systemInstruction,
  //     cachedContent: modelParams?.cachedContent?.name,
  //     contents: [],
  //   },
  // };
  const containsGenerateContentRequest =
    (params as CountTokensRequest).generateContentRequest != null;
  if ((params as CountTokensRequest).contents) {
    if (containsGenerateContentRequest) {
      throw new GoogleGenerativeAIRequestInputError(
        "CountTokensRequest must have one of contents or generateContentRequest, not both.",
      );
    }
    formattedGenerateContentRequest.contents = (
      params as CountTokensRequest
    ).contents;
  } else if (containsGenerateContentRequest) {
    formattedGenerateContentRequest = {
      ...formattedGenerateContentRequest,
      ...(params as CountTokensRequest).generateContentRequest,
    };
  } else {
    // Array or string
    const content = formatNewContent(params as string | Array<string | Part>);
    formattedGenerateContentRequest.contents = [content];
  }
  return { generateContentRequest: formattedGenerateContentRequest };
}

export function formatGenerateContentInput(
  params: GenerateContentRequest | string | Array<string | Part>,
): GenerateContentRequest {
  let formattedRequest: GenerateContentRequest;
  if ((params as GenerateContentRequest).contents) {
    formattedRequest = params as GenerateContentRequest;
  } else {
    // Array or string
    const content = formatNewContent(params as string | Array<string | Part>);
    formattedRequest = { contents: [content] };
  }
  if ((params as GenerateContentRequest).systemInstruction) {
    formattedRequest.systemInstruction = formatSystemInstruction(
      (params as GenerateContentRequest).systemInstruction,
    );
  }
  return formattedRequest;
}

export function formatEmbedContentInput(
  params: EmbedContentRequest | string | Array<string | Part>,
): EmbedContentRequest {
  if (typeof params === "string" || Array.isArray(params)) {
    const content = formatNewContent(params);
    return { content };
  }
  return params;
}
