/**
 * 题型名称 Hook
 */

import { useMemo } from 'react';
import { PLANAR_SUBTYPE_NAMES, SPATIAL_SUBTYPE_NAMES, MAJOR_TYPE_NAMES } from '@kao-gong/shared';
import type { QuestionSubType, MajorQuestionType } from '@kao-gong/shared';

/**
 * 获取题型中文名称
 */
export function useTypeName(subType: QuestionSubType | null | undefined): string {
  return useMemo(() => {
    if (!subType) return '未知';

    return (
      PLANAR_SUBTYPE_NAMES[subType as keyof typeof PLANAR_SUBTYPE_NAMES] ??
      SPATIAL_SUBTYPE_NAMES[subType as keyof typeof SPATIAL_SUBTYPE_NAMES] ??
      subType
    );
  }, [subType]);
}

/**
 * 获取大类中文名称
 */
export function useMajorTypeName(majorType: MajorQuestionType | null | undefined): string {
  return useMemo(() => {
    if (!majorType) return '未知';
    return MAJOR_TYPE_NAMES[majorType] ?? majorType;
  }, [majorType]);
}

/**
 * 获取题型颜色
 */
export function useTypeColor(majorType: MajorQuestionType | null | undefined): string {
  return useMemo(() => {
    if (majorType === 'planar') return '#4CAF50';
    if (majorType === 'spatial') return '#FF9800';
    return '#9E9E9E';
  }, [majorType]);
}

/**
 * 获取置信度描述
 */
export function useConfidenceText(confidence: number | null | undefined): string {
  return useMemo(() => {
    if (confidence === null || confidence === undefined) return '未知';

    if (confidence >= 0.9) return '非常确定';
    if (confidence >= 0.7) return '较为确定';
    if (confidence >= 0.5) return '一般';
    if (confidence >= 0.3) return '不太确定';
    return '不确定';
  }, [confidence]);
}
