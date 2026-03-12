import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface LogicNode {
  id: string;
  label: string;
  description: string;
  type: "start" | "process" | "decision" | "end" | "interaction";
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

export interface AnalysisResult {
  flows: LogicFlow[];
  summary: string;
}

export async function analyzeCode(code: string, fileName: string): Promise<AnalysisResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `分析以下代码文件 "${fileName}" 的逻辑原理。
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
`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "代码逻辑的总体概述" },
          flows: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "流程标题" },
                nodes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING, description: "节点简短标签" },
                      description: { type: Type.STRING, description: "节点功能描述" },
                      type: { 
                        type: Type.STRING, 
                        enum: ["start", "process", "decision", "end", "interaction"] 
                      },
                      details: { type: Type.STRING, description: "更详细的实现细节" },
                      functionCalls: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "调用的模块或函数名"
                      },
                      inputs: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "输入变量或参数"
                      },
                      outputs: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "输出变量或返回值"
                      },
                      parameters: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "关键配置或硬编码参数"
                      }
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
                      label: { type: Type.STRING, description: "连线上的条件或说明" }
                    },
                    required: ["from", "to"]
                  }
                }
              },
              required: ["title", "nodes", "edges"]
            }
          }
        },
        required: ["summary", "flows"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("分析失败，请重试。");
  }
}
