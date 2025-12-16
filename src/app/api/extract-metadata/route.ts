import { NextRequest, NextResponse } from 'next/server';
import { extractProjectMetadata } from '@/lib/openrouter';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { content } = await request.json();

        if (!content || typeof content !== 'string') {
            return NextResponse.json(
                { error: '缺少项目材料内容' },
                { status: 400 }
            );
        }

        const metadata = await extractProjectMetadata(content);

        return NextResponse.json({
            success: true,
            ...metadata,
        });
    } catch (error) {
        console.error('[API] 元数据提取失败:', error);
        return NextResponse.json(
            {
                error: '元数据提取失败',
                source: '未知',
                projectName: '未知',
                organization: '未知',
                fullName: '新项目'
            },
            { status: 500 }
        );
    }
}
