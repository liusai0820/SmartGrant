/**
 * @file route.ts (review)
 * @input FileInput[] (materials, guidelines), projectId
 * @output JSON: { reviews, finalReport } - 多 Agent 评审结果与综合报告
 * @pos API 层 - 核心评审接口，调度多模型并行评审
 * 
 * ⚠️ 更新声明：一旦我被更新，务必更新我的开头注释，以及所属文件夹的 _ARCHITECTURE.md
 */

// ===========================================
// 评审 API Route (Server-side)
// ===========================================
// API Key 安全地保存在服务端，不会暴露给客户端

import { NextRequest, NextResponse } from 'next/server';
import { runComprehensiveReview, runSynthesizerAgent } from '@/lib/openrouter';
import { supabaseAdmin } from '@/lib/supabase/server';
import { FileInput, AgentType, AgentStatus } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, materials, guidelines } = body as {
      projectId: string;
      materials: FileInput[];
      guidelines: FileInput[];
    };

    if (!projectId || !materials || !guidelines) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 1. 并行执行三个独立评审 (使用不同模型)
    const reviewers = [
      { type: AgentType.REVIEWER_A, name: '评审专家A (Claude)', focus: '风险控制、合规性与逻辑严密性' },
      { type: AgentType.REVIEWER_B, name: '评审专家B (Gemini)', focus: '技术创新、前沿性与研发实力' },
      { type: AgentType.REVIEWER_C, name: '评审专家C (GPT-4)', focus: '商业落地、团队资质与资源保障' },
    ];

    // DB: 更新状态为 THINKING (允许失败)
    for (const reviewer of reviewers) {
      try {
        await supabaseAdmin
          .from('review_results')
          .upsert({
            project_id: projectId,
            agent_type: reviewer.type,
            status: AgentStatus.THINKING,
            content: null,
          }, { onConflict: 'project_id,agent_type' });
      } catch (e) {
        console.warn('[DB] Update THINKING status failed (ignored):', e);
      }
    }

    // 并行执行评审 (每个专家使用不同模型)
    const reviewPromises = reviewers.map(async (reviewer) => {
      try {
        const result = await runComprehensiveReview(
          materials,
          guidelines,
          reviewer.type,
          reviewer.name,
          reviewer.focus
        );

        // DB: 保存结果 (允许失败)
        try {
          await supabaseAdmin
            .from('review_results')
            .upsert({
              project_id: projectId,
              agent_type: reviewer.type,
              status: AgentStatus.COMPLETED,
              content: result,
            }, { onConflict: 'project_id,agent_type' });
        } catch (e) {
          console.warn('[DB] Save result failed (ignored):', e);
        }

        return { type: reviewer.type, content: result, success: true, status: AgentStatus.COMPLETED };
      } catch (error: any) {
        console.error(`[${reviewer.name}] Review failed:`, error.message);
        // DB: 保存错误 (允许失败)
        try {
          await supabaseAdmin
            .from('review_results')
            .upsert({
              project_id: projectId,
              agent_type: reviewer.type,
              status: AgentStatus.ERROR,
              error: error.message,
            }, { onConflict: 'project_id,agent_type' });
        } catch (e) {
          console.warn('[DB] Save error failed (ignored):', e);
        }

        return { type: reviewer.type, content: '', success: false, error: error.message, status: AgentStatus.ERROR };
      }
    });

    const reviewResults = await Promise.all(reviewPromises);
    console.log('[Review] All reviewers completed. Starting synthesis...');

    // 2. 执行综合报告
    const reviewA = reviewResults.find(r => r.type === AgentType.REVIEWER_A)?.content || '';
    const reviewB = reviewResults.find(r => r.type === AgentType.REVIEWER_B)?.content || '';
    const reviewC = reviewResults.find(r => r.type === AgentType.REVIEWER_C)?.content || '';

    // DB: 更新综合报告状态 (允许失败)
    try {
      await supabaseAdmin
        .from('review_results')
        .upsert({
          project_id: projectId,
          agent_type: AgentType.SYNTHESIZER,
          status: AgentStatus.THINKING,
        }, { onConflict: 'project_id,agent_type' });
    } catch (e) {
      console.warn('[DB] Update synthesizer THINKING failed (ignored):', e);
    }

    try {
      const finalReport = await runSynthesizerAgent(reviewA, reviewB, reviewC);
      console.log('[Review] Synthesis completed.');

      // DB: 保存综合报告 (允许失败)
      try {
        await supabaseAdmin
          .from('review_results')
          .upsert({
            project_id: projectId,
            agent_type: AgentType.SYNTHESIZER,
            status: AgentStatus.COMPLETED,
            content: finalReport,
          }, { onConflict: 'project_id,agent_type' });

        await supabaseAdmin
          .from('projects')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', projectId);
      } catch (e) {
        console.warn('[DB] Save final report failed (ignored):', e);
      }

      return NextResponse.json({
        success: true,
        reviews: reviewResults,
        finalReport: {
          content: finalReport,
          status: AgentStatus.COMPLETED,
        },
      });
    } catch (error: any) {
      console.error('[Synthesizer] Failed:', error.message);
      // DB: 保存错误 (允许失败)
      try {
        await supabaseAdmin
          .from('review_results')
          .upsert({
            project_id: projectId,
            agent_type: AgentType.SYNTHESIZER,
            status: AgentStatus.ERROR,
            error: error.message,
          }, { onConflict: 'project_id,agent_type' });
      } catch (e) { /* ignore */ }

      return NextResponse.json({
        success: false,
        reviews: reviewResults,
        error: error.message,
      });
    }
  } catch (error: any) {
    console.error('Review API Error:', error);
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
