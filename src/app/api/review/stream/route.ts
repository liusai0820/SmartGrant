// ===========================================
// 流式评审 API - Server-Sent Events
// ===========================================

import { NextRequest } from 'next/server';
import { runComprehensiveReview, runSynthesizerAgent } from '@/lib/openrouter';
import { supabaseAdmin } from '@/lib/supabase/server';
import { FileInput, AgentType, AgentStatus } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectId, materials, guidelines, templateId } = body as {
    projectId: string;
    materials: FileInput[];
    guidelines: FileInput[];
    templateId?: string;
  };

  if (!projectId || !materials || !guidelines) {
    return new Response(JSON.stringify({ error: '缺少必要参数' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // 获取评审模板配置
        const template = await getReviewTemplate(templateId);
        
        const reviewers = [
          { 
            type: AgentType.REVIEWER_A, 
            name: '评审专家A (Claude)', 
            focus: template?.focusA || '风险控制、合规性与逻辑严密性'
          },
          { 
            type: AgentType.REVIEWER_B, 
            name: '评审专家B (Gemini)', 
            focus: template?.focusB || '技术创新、前沿性与研发实力'
          },
          { 
            type: AgentType.REVIEWER_C, 
            name: '评审专家C (GPT-4)', 
            focus: template?.focusC || '商业落地、团队资质与资源保障'
          },
        ];

        // 通知开始
        send({ type: 'start', message: '评审任务已启动', template: template?.name });

        const results: { type: AgentType; content: string }[] = [];

        // 逐个执行评审并实时推送进度
        for (const reviewer of reviewers) {
          // 推送"开始评审"状态
          send({ 
            type: 'agent_start', 
            agent: reviewer.type, 
            name: reviewer.name,
            message: `${reviewer.name} 开始评审...`
          });

          // 更新数据库状态
          await supabaseAdmin
            .from('review_results')
            .upsert({
              project_id: projectId,
              agent_type: reviewer.type,
              status: AgentStatus.THINKING,
            }, { onConflict: 'project_id,agent_type' });

          try {
            const result = await runComprehensiveReview(
              materials,
              guidelines,
              reviewer.type,
              reviewer.name,
              reviewer.focus
            );

            results.push({ type: reviewer.type, content: result });

            // 保存结果
            await supabaseAdmin
              .from('review_results')
              .upsert({
                project_id: projectId,
                agent_type: reviewer.type,
                status: AgentStatus.COMPLETED,
                content: result,
              }, { onConflict: 'project_id,agent_type' });

            // 推送完成状态
            send({ 
              type: 'agent_complete', 
              agent: reviewer.type,
              name: reviewer.name,
              content: result,
              message: `${reviewer.name} 评审完成`
            });

          } catch (error: any) {
            await supabaseAdmin
              .from('review_results')
              .upsert({
                project_id: projectId,
                agent_type: reviewer.type,
                status: AgentStatus.ERROR,
                error: error.message,
              }, { onConflict: 'project_id,agent_type' });

            send({ 
              type: 'agent_error', 
              agent: reviewer.type,
              error: error.message 
            });
            
            results.push({ type: reviewer.type, content: '' });
          }
        }

        // 开始综合报告
        send({ 
          type: 'synthesizer_start', 
          message: '首席评审官正在汇总意见...' 
        });

        await supabaseAdmin
          .from('review_results')
          .upsert({
            project_id: projectId,
            agent_type: AgentType.SYNTHESIZER,
            status: AgentStatus.THINKING,
          }, { onConflict: 'project_id,agent_type' });

        const reviewA = results.find(r => r.type === AgentType.REVIEWER_A)?.content || '';
        const reviewB = results.find(r => r.type === AgentType.REVIEWER_B)?.content || '';
        const reviewC = results.find(r => r.type === AgentType.REVIEWER_C)?.content || '';

        try {
          const finalReport = await runSynthesizerAgent(reviewA, reviewB, reviewC);

          await supabaseAdmin
            .from('review_results')
            .upsert({
              project_id: projectId,
              agent_type: AgentType.SYNTHESIZER,
              status: AgentStatus.COMPLETED,
              content: finalReport,
            }, { onConflict: 'project_id,agent_type' });

          // 更新项目时间戳
          await supabaseAdmin
            .from('projects')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', projectId);

          send({ 
            type: 'synthesizer_complete', 
            content: finalReport,
            message: '综合评审报告已生成'
          });

        } catch (error: any) {
          send({ type: 'synthesizer_error', error: error.message });
        }

        // 完成
        send({ type: 'complete', message: '评审流程已完成' });

      } catch (error: any) {
        send({ type: 'error', error: error.message });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// 获取评审模板
async function getReviewTemplate(templateId?: string) {
  if (!templateId) return null;
  
  const { data } = await supabaseAdmin
    .from('review_templates')
    .select('*')
    .eq('id', templateId)
    .single();
  
  return data;
}
