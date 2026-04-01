import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";

export type LLMProvider = "gemini" | "qwen";

export interface ModelConfig {
  provider: LLMProvider;
  modelName: string;
  apiKey?: string;
}

const defaultGeminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface LogicNode {
  id: string;
  label: string;
  description: string;
  type: "start" | "process" | "decision" | "end" | "interaction" | "agent" | "prompt" | "tool";
  details?: string;
  functionCalls?: string[];
  inputs?: string[];
  outputs?: string[];
  parameters?: string[];
}

export interface LogicEdge {
  from: string;
  to: string;
  label?: string;
}

export interface LogicFlow {
  title: string;
  nodes: LogicNode[];
  edges: LogicEdge[];
}

export interface AgentInterpretation {
  constraints: string[];
  promptEncapsulation: string;
  invocationChain: string;
  architectureType: string;
}

export interface ModuleGraph {
  nodes: { id: string; label: string; type: string; importance: number }[];
  edges: { from: string; to: string; relationship: string }[];
}

export interface AnalysisResult {
  flows: LogicFlow[];
  summary: string;
  agentInterpretation: AgentInterpretation;
  moduleGraph: ModuleGraph;
}

async function callLLM(prompt: string, config: ModelConfig, schema: any): Promise<string> {
  if (config.provider === "gemini") {
    const ai = config.apiKey ? new GoogleGenAI({ apiKey: config.apiKey }) : defaultGeminiClient;
    const response = await ai.models.generateContent({
      model: config.modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    return response.text || "{}";
  } else if (config.provider === "qwen") {
    const openai = new OpenAI({
      apiKey: config.apiKey || process.env.QWEN_API_KEY || "",
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      dangerouslyAllowBrowser: true
    });

    const response = await openai.chat.completions.create({
      model: config.modelName,
      messages: [
        { role: "system", content: "You are a senior software architect and AI agent engineer. You analyze code and return structured JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    return response.choices[0].message.content || "{}";
  }
  throw new Error("Unsupported provider");
}

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    agentInterpretation: {
      type: Type.OBJECT,
      properties: {
        constraints: { type: Type.ARRAY, items: { type: Type.STRING } },
        promptEncapsulation: { type: Type.STRING },
        invocationChain: { type: Type.STRING },
        architectureType: { type: Type.STRING }
      },
      required: ["constraints", "promptEncapsulation", "invocationChain", "architectureType"]
    },
    moduleGraph: {
      type: Type.OBJECT,
      properties: {
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["module", "class", "function", "external_api"] },
              importance: { type: Type.NUMBER }
            },
            required: ["id", "label", "type", "importance"]
          }
        },
        edges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              from: { type: Type.STRING },
              to: { type: Type.STRING },
              relationship: { type: Type.STRING }
            },
            required: ["from", "to", "relationship"]
          }
        }
      },
      required: ["nodes", "edges"]
    },
    flows: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["start", "process", "decision", "end", "interaction", "agent", "prompt", "tool"] },
                details: { type: Type.STRING },
                functionCalls: { type: Type.ARRAY, items: { type: Type.STRING } },
                inputs: { type: Type.ARRAY, items: { type: Type.STRING } },
                outputs: { type: Type.ARRAY, items: { type: Type.STRING } },
                parameters: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["id", "label", "description", "type"]
            }
          },
          edges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                from: { type: Type.STRING },
                to: { type: Type.STRING },
                label: { type: Type.STRING }
              },
              required: ["from", "to"]
            }
          }
        },
        required: ["title", "nodes", "edges"]
      }
    }
  },
  required: ["summary", "agentInterpretation", "moduleGraph", "flows"]
};

export async function analyzeCode(code: string, fileName: string, modelConfig: ModelConfig): Promise<AnalysisResult> {
  const prompt = `分析以下代码文件 "${fileName}"，重点解读其作为 AI Agent 或 Prompt 工程体系的设计。
请深入分析以下维度：
1. **约束控制 (Constraints)**: 代码中定义的行为准则、安全限制或业务规则。
2. **Prompt 封装 (Prompt Encapsulation)**: Prompt 是如何被模板化、封装或动态构建的。
3. **调用链路 (Invocation Chain)**: 核心业务逻辑的执行流转链路。
4. **模块图谱 (Module Graph)**: 识别代码中的核心模块、类或函数，并建立它们之间的关联。

请生成多个逻辑流程（Flows），每个流程表达一个特定的交互或逻辑处理路径。
对于每个逻辑节点，请特别提取：
1. 调用的模块或函数信息。
2. 相关的输入变量或数据。
3. 相关的输出变量或结果。
4. 涉及的关键参数。

返回 JSON 格式。

代码内容：
\`\`\`
${code}
\`\`\`
`;

  const jsonText = await callLLM(prompt, modelConfig, ANALYSIS_SCHEMA);

  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse LLM response", e);
    throw new Error("分析失败，请重试。");
  }
}

export async function analyzeDirectory(contents: { [path: string]: string }, root: string, modelConfig: ModelConfig): Promise<AnalysisResult> {
  const fileList = Object.keys(contents).join("\n");
  const combinedContent = Object.entries(contents)
    .map(([path, content]) => `--- FILE: ${path} ---\n${content}`)
    .join("\n\n");

  const prompt = `分析以下目录 "${root}" 下的代码体系，重点解读其作为 AI Agent 或 Prompt 工程体系的设计。
请深入分析以下维度：
1. **代码流转 (Code Flow)**: 跨文件的业务逻辑流转，识别核心入口点和数据流向。
2. **前置条件 (Preconditions)**: 各种操作执行前需要的状态、配置或权限检查。
3. **分流调度 (Dispatching & Scheduling)**: 引擎如何根据输入进行逻辑分流、任务调度。
4. **底层库支撑 (Underlying Libraries)**: 识别关键的第三方库或底层自研库及其在体系中的作用。
5. **模块图谱 (Module Graph)**: 建立文件/模块之间的关联。

请生成多个逻辑流程（Flows），每个流程表达一个跨文件的核心交互或逻辑处理路径。
对于每个逻辑节点，请特别提取：
1. 调用的模块或函数信息。
2. 相关的输入变量或数据。
3. 相关的输出变量或结果。
4. 涉及的关键参数。

返回 JSON 格式。

文件列表：
${fileList}

代码内容：
\`\`\`
${combinedContent.slice(0, 100000)}
\`\`\`
`;

  const jsonText = await callLLM(prompt, modelConfig, ANALYSIS_SCHEMA);

  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse LLM response", e);
    throw new Error("分析失败，请重试。");
  }
}
