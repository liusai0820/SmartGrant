// ===========================================
// PDF 导出 API
// ===========================================
// 使用 Puppeteer 将 HTML 转换为 PDF

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { html, filename } = await request.json();

    if (!html) {
      return NextResponse.json({ error: '缺少 HTML 内容' }, { status: 400 });
    }

    // 方案1: 使用外部 PDF 生成服务 (推荐生产环境)
    // 例如: https://api.html2pdf.app 或 https://pdfshift.io
    
    // 方案2: 使用 @react-pdf/renderer (需要重构为 React 组件)
    
    // 方案3: 使用 Puppeteer (需要 Node.js 环境)
    // 注意: Vercel Serverless 有限制，建议使用 Vercel Edge 或外部服务
    
    // 这里提供一个简化的实现，使用外部 API
    const pdfApiKey = process.env.PDF_API_KEY;
    
    if (pdfApiKey) {
      // 使用 PDFShift API (示例)
      const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${pdfApiKey}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: html,
          landscape: false,
          use_print: true,
        }),
      });

      if (response.ok) {
        const pdfBuffer = await response.arrayBuffer();
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}.pdf"`,
          },
        });
      }
    }

    // 如果没有配置 PDF API，返回 HTML 让前端处理
    // 前端可以使用 html2pdf.js 或 jsPDF
    return NextResponse.json({
      success: false,
      message: 'PDF 服务未配置，请使用浏览器打印功能导出 PDF',
      html: html,
    });

  } catch (error: any) {
    console.error('PDF 导出错误:', error);
    return NextResponse.json(
      { error: error.message || 'PDF 生成失败' },
      { status: 500 }
    );
  }
}
