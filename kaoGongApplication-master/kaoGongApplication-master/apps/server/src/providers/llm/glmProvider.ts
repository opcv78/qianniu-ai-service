/**
 * GLM Vision LLM Provider
 * 支持 GLM-4V-Flash 模型
 */

import type {
  VisionInput,
  ClassificationResult,
  AnalyzeResult,
  QuestionSubType,
  PlanarSubType,
  SpatialSubType,
} from '@kao-gong/shared';
import {
  ClassificationResultSchema,
  LLMClassifyOutputSchema,
  LLMPlanarAnalyzeOutputSchema,
  LLMSpatialAnalyzeOutputSchema,
} from '@kao-gong/shared';
import type { LLMProviderConfig, ChatMessage, ChatContent, GLMChatRequest } from './types';
import { buildClassifyPrompt, buildPlanarPrompt, buildSpatialPrompt } from '../../prompts';

/**
 * GLM Vision Provider
 */
export class GLMProvider {
  readonly name = 'glm';
  private config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = {
      timeout: 60000,
      maxRetries: 2,
      ...config,
    };
  }

  /**
   * 分类问题
   */
  async classifyQuestion(input: VisionInput): Promise<ClassificationResult> {
    const prompt = buildClassifyPrompt();
    const messages = this.buildMessages(prompt, input);

    const response = await this.request(messages);
    const parsed = this.parseAndValidate(response, LLMClassifyOutputSchema, 'classify');

    // 验证 subTypeCandidates 是否包含有效的子类型
    const validCandidates = this.validateSubTypeCandidates(parsed.subTypeCandidates);

    return {
      majorType: parsed.majorType,
      subTypeCandidates: validCandidates as QuestionSubType[],
      confidence: parsed.confidence,
      reasoningBrief: parsed.reasoningBrief,
    };
  }

  /**
   * 分析平面类问题
   */
  async analyzePlanar(input: VisionInput, subType?: PlanarSubType): Promise<AnalyzeResult> {
    const prompt = buildPlanarPrompt(subType);
    const messages = this.buildMessages(prompt, input);

    const response = await this.request(messages);
    const parsed = this.parseAndValidate(response, LLMPlanarAnalyzeOutputSchema, 'planar');

    return {
      success: true,
      majorType: 'planar',
      subType: parsed.subType,
      confidence: parsed.confidence,
      animationSupported: true,
      animationSupportLevel: 'full',
      explanation: parsed.explanation,
      ruleSummary: parsed.ruleSummary,
      animationPlan: parsed.animationPlan,
      warnings: parsed.warnings,
    };
  }

  /**
   * 分析立体类问题
   */
  async analyzeSpatial(input: VisionInput, subType?: SpatialSubType): Promise<AnalyzeResult> {
    const prompt = buildSpatialPrompt(subType);
    const messages = this.buildMessages(prompt, input);

    const response = await this.request(messages);
    const parsed = this.parseAndValidate(response, LLMSpatialAnalyzeOutputSchema, 'spatial');

    return {
      success: true,
      majorType: 'spatial',
      subType: parsed.subType,
      confidence: parsed.confidence,
      animationSupported: false,
      animationSupportLevel: 'none',
      explanation: parsed.explanation,
      ruleSummary: parsed.ruleSummary,
      animationPlan: parsed.animationPlan,
      semiAutoConfig: parsed.semiAutoConfig,
      warnings: parsed.warnings,
    };
  }

  /**
   * 构建 API 请求
   */
  private buildMessages(systemPrompt: string, input: VisionInput): ChatMessage[] {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // 构建用户消息
    const userContent: ChatContent[] = [];

    // 添加图片
    if (input.imageUrl) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: input.imageUrl,
        },
      });
    } else if (input.imageBase64) {
      const mimeType = input.mimeType ?? 'image/png';
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${input.imageBase64}`,
        },
      });
    }

    // 添加提示文本
    const promptText = input.hints?.length
      ? `请分析这道图形推理题。\n\n提示：${input.hints.join('\n')}`
      : '请分析这道图形推理题。';

    userContent.push({
      type: 'text',
      text: promptText,
    });

    messages.push({
      role: 'user',
      content: userContent,
    });

    return messages;
  }

  /**
   * 发送请求到 GLM API
   */
  private async request(messages: ChatMessage[]): Promise<string> {
    const { apiKey, baseUrl, model, timeout } = this.config;

    const requestBody: GLMChatRequest = {
      model,
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    };

    let lastError: Error | null = null;
    const maxRetries = this.config.maxRetries ?? 2;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(timeout ?? 60000),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`GLM API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('GLM API returned empty content');
        }

        return content;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 如果是最后重试，记录日志
        if (attempt === maxRetries - 1) {
          console.error(`GLM API request failed after ${maxRetries} attempts:`, lastError.message);
        }

        // 等待一段时间后重试
        if (attempt < maxRetries - 1) {
          await this.delay(1000 * (attempt + 1));
        }
      }
    }

    throw lastError ?? new Error('GLM API request failed');
  }

  /**
   * 解析并验证 LLM 输出
   */
  private parseAndValidate<T>(
    content: string,
    schema: typeof LLMClassifyOutputSchema | typeof LLMPlanarAnalyzeOutputSchema | typeof LLMSpatialAnalyzeOutputSchema,
    context: string
  ): T {
    // 尝试提取 JSON
    const jsonStr = this.extractJson(content);

    if (!jsonStr) {
      throw new Error(`Failed to extract JSON from LLM response for ${context}`);
    }

    try {
      const parsed = JSON.parse(jsonStr);
      const result = schema.safeParse(parsed);

      if (!result.success) {
        console.error(`Schema validation failed for ${context}:`, result.error.errors);
        throw new Error(`Schema validation failed: ${result.error.message}`);
      }

      return result.data as T;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse JSON for ${context}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 从 LLM 响应中提取 JSON
   */
  private extractJson(content: string): string | null {
    // 尝试直接解析
    try {
      JSON.parse(content);
      return content;
    } catch {
      // 继续尝试提取
    }

    // 尝试提取代码块中的 JSON
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // 尝试匹配 JSON 对象
    const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      return jsonObjectMatch[0];
    }

    return null;
  }

  /**
   * 验证子类型候选列表
   */
  private validateSubTypeCandidates(candidates: string[]): string[] {
    const validPlanarTypes = [
      'position_move', 'rotation', 'flip',
      'overlay_union', 'overlay_xor', 'overlay_intersection',
      'count_change', 'shade_change', 'element_replace', 'mixed_planar'
    ];

    const validSpatialTypes = [
      'folding', 'section', 'solid_assembly', 'view_projection', 'mixed_spatial'
    ];

    const validTypes = [...validPlanarTypes, ...validSpatialTypes];

    // 过滤有效的子类型
    const valid = candidates.filter(c => validTypes.includes(c));

    // 如果全部无效，返回 mixed_planar
    if (valid.length === 0) {
      return ['mixed_planar'];
    }

    return valid;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 创建 GLM Provider 实例
 */
export function createGLMProvider(config: LLMProviderConfig): GLMProvider {
  return new GLMProvider(config);
}
