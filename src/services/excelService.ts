import * as XLSX from 'xlsx';
import { Indicator, Material, Scenario } from '@/types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Helper to format date: YYYY-MM-DD-HH-mm-ss
const getFormattedDate = () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
};

// 将 ArrayBuffer 转换为 Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const exportScenarioToExcel = async (scenario: Scenario): Promise<void> => {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: 指标管理
  const indicatorData = scenario.indicators.map(ind => ({
    "名称": ind.name,
    "单位": ind.unit,
    "最小值": ind.min,
    "最大值": ind.max
  }));

  const indicatorHeaders = ["名称", "单位", "最小值", "最大值"];
  const wsIndicators = XLSX.utils.json_to_sheet(indicatorData, { header: indicatorHeaders });
  XLSX.utils.book_append_sheet(wb, wsIndicators, "指标管理");

  // 2. Sheet: 货物管理
  const materialData = scenario.materials.map(mat => {
    const row: Record<string, string | number> = {
      "名称": mat.name,
      "单价": mat.price
    };
    scenario.indicators.forEach(ind => {
      row[ind.name] = mat.indicatorValues[ind.id] || 0;
    });
    return row;
  });

  const dynamicIndicatorHeaders = scenario.indicators.map(ind => ind.name);
  const materialHeaders = ["名称", "单价", ...dynamicIndicatorHeaders];
  const wsMaterials = XLSX.utils.json_to_sheet(materialData, { header: materialHeaders });
  XLSX.utils.book_append_sheet(wb, wsMaterials, "货物管理");

  // Generate Filename
  const filename = `导出${scenario.name}-${getFormattedDate()}.xlsx`;

  // 判断平台
  if (Capacitor.isNativePlatform()) {
    // 📱 移动端：保存到缓存后通过分享导出
    try {
      // 生成 Excel 二进制数据
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const base64Data = arrayBufferToBase64(excelBuffer);

      // 保存到缓存目录
      const fileResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      // 通过系统分享让用户选择保存位置或发送方式
      await Share.share({
        title: '导出配方数据',
        url: fileResult.uri,
        dialogTitle: '选择保存或分享方式'
      });

    } catch (error) {
      console.error('导出失败:', error);
      throw new Error('导出文件失败，请重试');
    }
  } else {
    // 💻 Web端：直接下载
    XLSX.writeFile(wb, filename);
  }
};

export const parseScenarioFromExcel = async (file: File): Promise<Scenario> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Check Sheets
        if (!workbook.SheetNames.includes("指标管理") || !workbook.SheetNames.includes("货物管理")) {
          reject(new Error("Excel 文件格式错误：缺少“指标管理”或“货物管理”工作表。"));
          return;
        }

        // 1. Parse Indicators
        const indicatorSheet = workbook.Sheets["指标管理"];
        const rawIndicators = XLSX.utils.sheet_to_json<Record<string, unknown>>(indicatorSheet);

        const indicators: Indicator[] = [];
        const indicatorNameMap = new Map<string, string>();
        const indicatorNames = new Set<string>();

        rawIndicators.forEach((row, index) => {
          if (!row["名称"] || !row["单位"] || row["最小值"] === undefined || row["最大值"] === undefined) {
            throw new Error(`指标管理第 ${index + 2} 行数据缺失（名称、单位、最小值、最大值均为必填）。`);
          }
          if (indicatorNames.has(String(row["名称"]))) {
            throw new Error(`指标名称重复：${row["名称"]}`);
          }

          const id = `ind_${Date.now()}_${index}`;
          const ind: Indicator = {
            id,
            name: String(row["名称"]).trim(),
            unit: String(row["单位"]).trim(),
            min: Number(row["最小值"]),
            max: Number(row["最大值"])
          };

          if (isNaN(ind.min) || isNaN(ind.max)) {
            throw new Error(`指标"${ind.name}"的数值无效。`);
          }

          indicators.push(ind);
          indicatorNameMap.set(ind.name, id);
          indicatorNames.add(ind.name);
        });

        // 2. Parse Materials
        const materialSheet = workbook.Sheets["货物管理"];
        const rawMaterials = XLSX.utils.sheet_to_json<Record<string, unknown>>(materialSheet);
        const materials: Material[] = [];
        const materialNames = new Set<string>();

        rawMaterials.forEach((row, index) => {
          if (!row["名称"] || row["单价"] === undefined) {
            throw new Error(`货物管理第 ${index + 2} 行数据缺失（名称、单价为必填）。`);
          }
          if (materialNames.has(String(row["名称"]))) {
            throw new Error(`货物名称重复：${row["名称"]}`);
          }

          const matId = `mat_${Date.now()}_${index}`;
          const price = Number(row["单价"]);

          if (isNaN(price)) {
            throw new Error(`货物"${row["名称"]}"的单价无效。`);
          }

          const indicatorValues: Record<string, number> = {};

          indicators.forEach(ind => {
            const val = row[ind.name];
            if (val === undefined || val === null || String(val).trim() === '') {
              throw new Error(`货物"${row["名称"]}"缺失指标"${ind.name}"的数值。`);
            }
            const numVal = Number(val);
            if (isNaN(numVal)) {
              throw new Error(`货物"${row["名称"]}"的指标"${ind.name}"数值无效。`);
            }
            indicatorValues[ind.id] = numVal;
          });

          materials.push({
            id: matId,
            name: String(row["名称"]).trim(),
            price,
            indicatorValues
          });
          materialNames.add(String(row["名称"]).trim());
        });

        resolve({
          id: Date.now().toString(),
          name: "导入方案",
          indicators,
          materials
        });

      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "解析 Excel 文件时发生未知错误。";
        reject(new Error(message));
      }
    };

    reader.onerror = () => reject(new Error("无法读取文件。"));
    reader.readAsBinaryString(file);
  });
};
