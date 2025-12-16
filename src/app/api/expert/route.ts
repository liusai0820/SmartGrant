// ===========================================
// 专家遴选 API Route
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { runExpertRecommendation } from '@/lib/openrouter';
import { supabaseAdmin } from '@/lib/supabase/server';
import { FileInput, AgentType, AgentStatus } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, materials } = body as {
      projectId: string;
      materials: FileInput[];
    };

    if (!projectId || !materials) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 更新状态为 THINKING (允许失败)
    try {
      await supabaseAdmin
        .from('review_results')
        .upsert({
          project_id: projectId,
          agent_type: AgentType.EXPERT_HUNTER,
          status: AgentStatus.THINKING,
          content: null,
        }, { onConflict: 'project_id,agent_type' });
    } catch (e) { console.warn('DB Update Ignored:', e); }

    try {
      const result = await runExpertRecommendation(materials);

      // 保存结果 (允许失败)
      try {
        await supabaseAdmin
          .from('review_results')
          .upsert({
            project_id: projectId,
            agent_type: AgentType.EXPERT_HUNTER,
            status: AgentStatus.COMPLETED,
            content: result,
          }, { onConflict: 'project_id,agent_type' });
      } catch (e) { console.warn('DB Save Ignored:', e); }

      return NextResponse.json({ success: true, content: result });
    } catch (error: any) {
      try {
        await supabaseAdmin
          .from('review_results')
          .upsert({
            project_id: projectId,
            agent_type: AgentType.EXPERT_HUNTER,
            status: AgentStatus.ERROR,
            error: error.message,
          }, { onConflict: 'project_id,agent_type' });
      } catch (e) { console.warn('DB Error Save Ignored:', e); }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Expert API Error:', error);
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
