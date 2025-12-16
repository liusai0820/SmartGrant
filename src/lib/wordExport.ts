'use client';

import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    BorderStyle,
    Table,
    TableRow,
    TableCell,
    WidthType,
    PageNumber,
    NumberFormat,
    Header,
    Footer,
    LineRuleType,
} from 'docx';
import { saveAs } from 'file-saver';

/**
 * 政府公文格式 Word 导出
 * 严格遵循 GB/T 9704-2012 《党政机关公文格式》国家标准
 * 
 * 页边距要求（A4纸 210mm×297mm）：
 * - 上白边（天头）：37mm
 * - 下白边：35mm  
 * - 左白边（订口）：28mm
 * - 右白边：26mm
 * 版心尺寸：156mm × 225mm
 * 
 * 字体要求：
 * - 标题：二号方正小标宋简体，居中
 * - 发文机关标志：红色小标宋体
 * - 正文：三号仿宋体（GB2312）
 * - 一级标题：三号黑体
 * - 二级标题：三号楷体加粗
 * - 三级标题：三号仿宋加粗
 * - 页码：四号宋体
 */

// 毫米转Word的 twip（1 inch = 1440 twips, 1 inch = 25.4 mm）
const mmToTwip = (mm: number) => Math.round((mm / 25.4) * 1440);

// 磅转 half-point (用于字号)
const ptToHalfPt = (pt: number) => pt * 2;

interface ParsedSection {
    type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'list' | 'table';
    content: string;
    items?: string[];
    rows?: string[][];
}

// 解析 Markdown 内容
function parseMarkdown(markdown: string): ParsedSection[] {
    const lines = markdown.split('\n');
    const sections: ParsedSection[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        if (!line) {
            i++;
            continue;
        }

        // 一级标题 (# 或 一、)
        if (line.match(/^#\s+/) || line.match(/^[一二三四五六七八九十]+、/)) {
            sections.push({
                type: 'heading1',
                content: line.replace(/^#\s+/, '').replace(/\*\*/g, ''),
            });
            i++;
            continue;
        }

        // 二级标题 (## 或 （一）)
        if (line.match(/^##\s+/) || line.match(/^（[一二三四五六七八九十]+）/)) {
            sections.push({
                type: 'heading2',
                content: line.replace(/^##\s+/, '').replace(/\*\*/g, ''),
            });
            i++;
            continue;
        }

        // 三级标题 (### 或 1. 开头)
        if (line.match(/^###\s+/) || line.match(/^\d+\./)) {
            sections.push({
                type: 'heading3',
                content: line.replace(/^###\s+/, '').replace(/\*\*/g, ''),
            });
            i++;
            continue;
        }

        // 表格
        if (line.startsWith('|')) {
            const tableRows: string[][] = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
                const row = lines[i].trim();
                if (!row.includes('---')) {
                    const cells = row.split('|').filter(c => c.trim()).map(c => c.trim().replace(/\*\*/g, ''));
                    tableRows.push(cells);
                }
                i++;
            }
            if (tableRows.length > 0) {
                sections.push({ type: 'table', content: '', rows: tableRows });
            }
            continue;
        }

        // 列表项
        if (line.match(/^[-*●]\s+/)) {
            const items: string[] = [];
            while (i < lines.length && lines[i].trim().match(/^[-*●]\s+/)) {
                items.push(lines[i].trim().replace(/^[-*●]\s+/, '').replace(/\*\*/g, ''));
                i++;
            }
            sections.push({ type: 'list', content: '', items });
            continue;
        }

        // 普通段落
        let paragraph = line;
        i++;
        sections.push({
            type: 'paragraph',
            content: paragraph.replace(/\*\*/g, '').replace(/\*/g, ''),
        });
    }

    return sections;
}

// 生成符合 GB/T 9704-2012 标准的公文 Word 文档
export async function generateGovernmentDocument(
    markdown: string,
    projectName: string = '项目评审报告',
    documentNumber?: string
): Promise<void> {
    const sections = parseMarkdown(markdown);
    const docNumber = documentNumber || `智评字〔${new Date().getFullYear()}〕第${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}号`;

    const children: (Paragraph | Table)[] = [];

    // ======== 版头区域 ========

    // 发文机关标志：红色小标宋体，居中
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '智 评 系 统',
                    bold: true,
                    size: ptToHalfPt(22), // 二号字 22pt
                    font: { eastAsia: '方正小标宋_GBK', ascii: 'SimSun' },
                    color: 'CC0000', // 红色
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: mmToTwip(20), after: mmToTwip(5) },
        })
    );

    // 发文机关全称
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'SmartGrant 智能评审系统',
                    size: ptToHalfPt(14),
                    font: { eastAsia: '仿宋', ascii: 'FangSong' },
                    color: 'CC0000',
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: mmToTwip(4) },
        })
    );

    // 红色反线（版头与版记分隔线）
    children.push(
        new Paragraph({
            border: {
                bottom: { color: 'CC0000', size: 12, style: BorderStyle.SINGLE },
            },
            spacing: { after: mmToTwip(8) },
        })
    );

    // 发文字号：三号仿宋，居中
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: docNumber,
                    size: ptToHalfPt(16), // 三号字 16pt
                    font: { eastAsia: '仿宋', ascii: 'FangSong' },
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: mmToTwip(10) },
        })
    );

    // ======== 标题 ========
    // 二号方正小标宋简体，居中，行距35磅
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '专家组综合评审决议',
                    bold: true,
                    size: ptToHalfPt(22), // 二号字
                    font: { eastAsia: '方正小标宋_GBK', ascii: 'SimSun' },
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: {
                before: mmToTwip(5),
                after: mmToTwip(10),
                line: 35 * 20, // 35磅行距
                lineRule: LineRuleType.EXACT,
            },
        })
    );

    // ======== 正文区域 ========

    for (const section of sections) {
        switch (section.type) {
            case 'heading1':
                // 一级标题：三号黑体
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: section.content,
                                bold: true,
                                size: ptToHalfPt(16),
                                font: { eastAsia: '黑体', ascii: 'SimHei' },
                            }),
                        ],
                        spacing: { before: mmToTwip(6), after: mmToTwip(3), line: 28 * 20, lineRule: LineRuleType.EXACT },
                    })
                );
                break;

            case 'heading2':
                // 二级标题：三号楷体加粗
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: section.content,
                                bold: true,
                                size: ptToHalfPt(16),
                                font: { eastAsia: '楷体', ascii: 'KaiTi' },
                            }),
                        ],
                        spacing: { before: mmToTwip(4), after: mmToTwip(2), line: 28 * 20, lineRule: LineRuleType.EXACT },
                        indent: { firstLine: mmToTwip(0) },
                    })
                );
                break;

            case 'heading3':
                // 三级标题：三号仿宋加粗
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: section.content,
                                bold: true,
                                size: ptToHalfPt(16),
                                font: { eastAsia: '仿宋', ascii: 'FangSong' },
                            }),
                        ],
                        spacing: { before: mmToTwip(3), after: mmToTwip(2), line: 28 * 20, lineRule: LineRuleType.EXACT },
                        indent: { firstLine: mmToTwip(8) }, // 首行缩进2字符
                    })
                );
                break;

            case 'paragraph':
                // 正文：三号仿宋，首行缩进2字符，行距28磅
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: section.content,
                                size: ptToHalfPt(16),
                                font: { eastAsia: '仿宋', ascii: 'FangSong' },
                            }),
                        ],
                        spacing: { after: mmToTwip(2), line: 28 * 20, lineRule: LineRuleType.EXACT },
                        indent: { firstLine: mmToTwip(8) }, // 首行缩进2字符（约8mm）
                    })
                );
                break;

            case 'list':
                section.items?.forEach((item) => {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: '● ' + item,
                                    size: ptToHalfPt(16),
                                    font: { eastAsia: '仿宋', ascii: 'FangSong' },
                                }),
                            ],
                            spacing: { after: mmToTwip(1), line: 28 * 20, lineRule: LineRuleType.EXACT },
                            indent: { firstLine: mmToTwip(8) },
                        })
                    );
                });
                break;

            case 'table':
                if (section.rows && section.rows.length > 0) {
                    const tableRows = section.rows.map((row, rowIdx) =>
                        new TableRow({
                            children: row.map(cell =>
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: cell,
                                                    size: ptToHalfPt(14), // 四号字
                                                    font: { eastAsia: '仿宋', ascii: 'FangSong' },
                                                    bold: rowIdx === 0,
                                                }),
                                            ],
                                            spacing: { before: 60, after: 60 },
                                        }),
                                    ],
                                    width: { size: 100 / row.length, type: WidthType.PERCENTAGE },
                                    margins: { top: 60, bottom: 60, left: 100, right: 100 },
                                })
                            ),
                        })
                    );

                    children.push(
                        new Table({
                            rows: tableRows,
                            width: { size: 100, type: WidthType.PERCENTAGE },
                        })
                    );
                    children.push(new Paragraph({ spacing: { after: mmToTwip(4) } }));
                }
                break;
        }
    }

    // ======== 落款区域 ========
    children.push(new Paragraph({ spacing: { before: mmToTwip(15) } }));

    // 发文机关署名：右空4字
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'SmartGrant 智能评审系统',
                    size: ptToHalfPt(16),
                    font: { eastAsia: '仿宋', ascii: 'FangSong' },
                }),
            ],
            alignment: AlignmentType.RIGHT,
            indent: { right: mmToTwip(16) }, // 右空4字符
        })
    );

    // 成文日期：右空4字
    const dateStr = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: dateStr,
                    size: ptToHalfPt(16),
                    font: { eastAsia: '仿宋', ascii: 'FangSong' },
                }),
            ],
            alignment: AlignmentType.RIGHT,
            indent: { right: mmToTwip(16) },
        })
    );

    // ======== 版记区域 ========
    children.push(new Paragraph({ spacing: { before: mmToTwip(20) } }));
    children.push(
        new Paragraph({
            border: {
                top: { color: '000000', size: 6, style: BorderStyle.SINGLE },
            },
        })
    );
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `抄送：项目管理单位、评审委员会`,
                    size: ptToHalfPt(14),
                    font: { eastAsia: '仿宋', ascii: 'FangSong' },
                }),
            ],
            spacing: { before: mmToTwip(2), after: mmToTwip(2) },
        })
    );
    children.push(
        new Paragraph({
            border: {
                bottom: { color: '000000', size: 6, style: BorderStyle.SINGLE },
            },
        })
    );
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `SmartGrant智评系统办公室`,
                    size: ptToHalfPt(14),
                    font: { eastAsia: '仿宋', ascii: 'FangSong' },
                }),
                new TextRun({
                    text: `                    `,
                }),
                new TextRun({
                    text: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日印发`,
                    size: ptToHalfPt(14),
                    font: { eastAsia: '仿宋', ascii: 'FangSong' },
                }),
            ],
            spacing: { before: mmToTwip(2) },
        })
    );

    // 创建文档（符合GB/T 9704-2012标准）
    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        size: {
                            width: mmToTwip(210),  // A4 宽度
                            height: mmToTwip(297), // A4 高度
                        },
                        margin: {
                            top: mmToTwip(37),    // 上边距 37mm
                            bottom: mmToTwip(35), // 下边距 35mm
                            left: mmToTwip(28),   // 左边距 28mm（订口）
                            right: mmToTwip(26),  // 右边距 26mm
                        },
                    },
                },
                headers: {
                    default: new Header({
                        children: [], // 公文一般无页眉
                    }),
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: '— ',
                                        size: ptToHalfPt(14),
                                        font: { eastAsia: '宋体', ascii: 'SimSun' },
                                    }),
                                    new TextRun({
                                        children: [PageNumber.CURRENT],
                                        size: ptToHalfPt(14),
                                        font: { eastAsia: '宋体', ascii: 'SimSun' },
                                    }),
                                    new TextRun({
                                        text: ' —',
                                        size: ptToHalfPt(14),
                                        font: { eastAsia: '宋体', ascii: 'SimSun' },
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                            }),
                        ],
                    }),
                },
                children,
            },
        ],
    });

    // 导出
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${projectName}_综合评审决议_${new Date().toISOString().slice(0, 10)}.docx`);
}
