import type { Cluster, LayerSize, PalitoData } from "../types";
import {
  Colors,
  DxfLayer,
  DxfStyle,
  DxfWriter,
  HatchBoundaryPaths,
  HatchPolylineBoundary,
  HatchPredefinedPatterns,
  pattern,
  point2d,
  point3d,
  TextHorizontalAlignment,
  TextVerticalAlignment,
  Units,
  vertex,
  type MTextOptions,
  type vec3_t,
} from "@tarikjabiri/dxf";

export const generateDXF = async (data: PalitoData[]) => {
  // Parâmetros globais
  const firstOrigin = point3d(0, 100);
  const gap = 15;

  // Instanciando a lib
  const dxf = new DxfWriter();
  dxf.setUnits(Units.Meters);

  // Estilo de linha
  const dashedLine = dxf.tables.addLType("DASHED", "__ __ __", [0.25, -0.125]);

  // Layers
  const scaleLayer = dxf.addLayer("scaleLayer", Colors.Red, "Continuous");
  const titlesLayer = dxf.addLayer("titlesLayer", Colors.Yellow, "Continuous");
  const finalDepthLayer = dxf.addLayer(
    "finalDepthLayer",
    Colors.Yellow,
    "Continuous"
  );
  const waterLevelShapeLayer = dxf.addLayer(
    "waterLevelShapeLayer",
    Colors.Red,
    "Continuous"
  );
  const waterLevelTextLayer = dxf.addLayer(
    "waterLevelTextLayer",
    Colors.Yellow,
    "Continuous"
  );
  const depthLinesLayer = dxf.addLayer(
    "depthsLineLayer",
    Colors.Yellow,
    dashedLine.name
  );
  const descriptionTextLayer = dxf.addLayer(
    "descriptionTextLayer",
    Colors.Yellow,
    "Continuous"
  );

  // Estilo de texto
  const arialTextStyle = dxf.tables.addStyle("arialText");
  arialTextStyle.fontFileName = "arial.ttf";
  arialTextStyle.widthFactor = 1.0;
  arialTextStyle.fixedTextHeight = 0;

  const descriptionMTextOptions: MTextOptions = {
    attachmentPoint: 3,
    width: 8,
    layerName: descriptionTextLayer.name,
  };

  // Definindo bloco vermelho que se repete na escala vertical
  const scaleBlock = dxf.addBlock("scaleBlock");
  scaleBlock.layerName = scaleLayer.name;
  const scalePolyline = new HatchPolylineBoundary();
  scalePolyline.add(vertex(0, 0));
  scalePolyline.add(vertex(0.2, 0));
  scalePolyline.add(vertex(0.2, -1));
  scalePolyline.add(vertex(0, -1));
  scalePolyline.add(vertex(0, 0));
  const scaleBoundary = new HatchBoundaryPaths();
  scaleBoundary.addPolylineBoundary(scalePolyline);
  const solidPattern = pattern({
    name: HatchPredefinedPatterns.SOLID,
  });
  scaleBlock.addHatch(scaleBoundary, solidPattern, {
    colorNumber: Colors.Red,
  });
  scaleBlock.addLine(point3d(0, -1), point3d(0.2, -1));

  // Bloco de linhas de profundidade
  const depthLineBlock = dxf.addBlock("depthLineBlock");
  depthLineBlock.layerName = depthLinesLayer.name;
  const depthVertices = [
    {
      point: point2d(0, 0),
    },
    {
      point: point2d(-2.72, 0),
    },
  ];
  depthLineBlock.addLWPolyline(depthVertices);

  // Bloco de nível da água
  const waterLevelBlock = dxf.addBlock("waterLevelBlock");
  waterLevelBlock.layerName = waterLevelShapeLayer.name;
  const waterLevelPolyline = new HatchPolylineBoundary();
  waterLevelPolyline.add(vertex(0, 0));
  waterLevelPolyline.add(vertex(-0.2754, 0.4406));
  waterLevelPolyline.add(vertex(0.2754, 0.4406));
  waterLevelPolyline.add(vertex(0, 0));
  const waterLevelBoundary = new HatchBoundaryPaths();
  waterLevelBoundary.addPolylineBoundary(waterLevelPolyline);
  waterLevelBlock.addHatch(waterLevelBoundary, solidPattern);
  waterLevelBlock.addLine(point3d(-0.2754, 0.4406), point3d(1.574, 0.4406));

  const processErrorNames: string[] = [];
  // Construindo cada palito
  data.forEach((sondagem, index) => {
    try {
      // Parâmetros individuais do palito
      const currentOrigin = point3d(firstOrigin.x + gap * index, firstOrigin.y);
      const maxDepth = sondagem.depths[sondagem.depths.length - 1];

      // Fazendo o cabeçalho
      dxf.addLine(
        point3d(currentOrigin.x + 0.1, currentOrigin.y),
        point3d(currentOrigin.x + 0.1, currentOrigin.y + 2.45),
        { layerName: titlesLayer.name }
      );
      dxf.addLine(
        point3d(currentOrigin.x + 0.1, currentOrigin.y + 2.45),
        point3d(currentOrigin.x - 4.95, currentOrigin.y + 2.45),

        { layerName: titlesLayer.name }
      );

      const title = dxf.addText(
        point3d(currentOrigin.x - 0.18, currentOrigin.y + 2.67),
        0.65,
        sondagem.hole_id.toUpperCase(),
        {
          layerName: titlesLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Right,
          verticalAlignment: TextVerticalAlignment.Bottom,
          secondAlignmentPoint: point3d(
            currentOrigin.x - 0.18,
            currentOrigin.y + 2.67
          ),
        }
      );
      title.textStyle = "arialText";

      const cota = dxf.addText(
        point3d(currentOrigin.x - 0.18, currentOrigin.y + 1.6),
        0.45,
        sondagem.z
          ? "COTA=" + sondagem.z.toFixed(2).replace(".", ",")
          : "COTA=0",
        {
          layerName: titlesLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Right,
          verticalAlignment: TextVerticalAlignment.Bottom,
          secondAlignmentPoint: point3d(
            currentOrigin.x - 0.18,
            currentOrigin.y + 1.6
          ),
        }
      );
      cota.textStyle = "arialText";

      // Fazendo a escala vertical
      dxf.addLine(
        currentOrigin,
        point3d(currentOrigin.x, currentOrigin.y - maxDepth),
        {
          colorNumber: Colors.Red,
        }
      );
      dxf.addLine(
        point3d(currentOrigin.x + 0.2, currentOrigin.y),
        point3d(currentOrigin.x + 0.2, currentOrigin.y - maxDepth),
        { colorNumber: Colors.Red }
      );

      for (let i = 0; i < maxDepth - 1; i += 2) {
        dxf.addInsert(
          scaleBlock.name,
          point3d(currentOrigin.x, currentOrigin.y - i),
          { colorNumber: Colors.Red }
        );
      }
      const depthFloor = Math.floor(maxDepth);
      if (depthFloor !== maxDepth && !(depthFloor % 2)) {
        const finalScalePolyline = new HatchPolylineBoundary();
        finalScalePolyline.add(
          vertex(currentOrigin.x, currentOrigin.y - depthFloor)
        );
        finalScalePolyline.add(
          vertex(currentOrigin.x + 0.2, currentOrigin.y - depthFloor)
        );
        finalScalePolyline.add(
          vertex(currentOrigin.x + 0.2, currentOrigin.y - maxDepth)
        );
        finalScalePolyline.add(
          vertex(currentOrigin.x, currentOrigin.y - maxDepth)
        );
        finalScalePolyline.add(
          vertex(currentOrigin.x, currentOrigin.y - depthFloor)
        );
        const finalScaleBoundary = new HatchBoundaryPaths();
        finalScaleBoundary.addPolylineBoundary(finalScalePolyline);
        dxf.addHatch(finalScaleBoundary, solidPattern, {
          colorNumber: Colors.Red,
        });
      }
      dxf.addLine(
        point3d(currentOrigin.x, currentOrigin.y - maxDepth),
        point3d(currentOrigin.x + 0.2, currentOrigin.y - maxDepth),
        { colorNumber: Colors.Red }
      );

      // Organizando textos maiores que as camadas
      const clusters = getDescriptionClusters(sondagem);
      let currentY = 0;
      clusters.forEach((cluster) => {
        let cumulativeDepth = cluster.layerSizes[0].from || 0;
        currentY = cluster.layerSizes[0].from;

        // Gerar texto da descrição
        cluster.layers.forEach((layerIndex, index) => {
          const layerSize = cluster.layerSizes.find(
            (ls) => ls.layerIndex === layerIndex
          );
          if (!layerSize) return;

          const layerCenterY = currentY + layerSize.finalHeight / 2;

          const interpText = sondagem.interp?.[layerIndex]?.trim();
          const geologyText = sondagem.geology[layerIndex]?.trim();
          if (!geologyText) {
            console.warn(`Geology vazia no layer ${layerIndex}`);
            return;
          }
          const descriptionStr = interpText
            ? interpText.toUpperCase() + " - " + geologyText.toUpperCase()
            : geologyText.toUpperCase();

          // Checar se precisa de degrau na linha de profundidade
          const originalDepth = layerSize.to;
          const correctedDepth = cluster.unchanged
            ? undefined
            : (cumulativeDepth += layerSize.finalHeight);
          // Chama função de desenhar dados da camada
          drawLayerData(
            dxf,
            cluster.layerSizes[index],
            currentOrigin,
            originalDepth,
            descriptionStr,
            descriptionMTextOptions,
            depthLinesLayer,
            arialTextStyle,
            layerCenterY,
            correctedDepth
          );
          currentY += layerSize.finalHeight;
        });
      });

      //NSPTs
      const firstNsptDepth = sondagem.nspt.start_depth;
      let currentNsptDepth = firstNsptDepth;
      sondagem.nspt.values.forEach((value) => {
        const nsptText = dxf.addText(
          point3d(
            currentOrigin.x + 0.57,
            currentOrigin.y - currentNsptDepth - 0.12
          ),
          0.35,
          value,
          {
            layerName: depthLinesLayer.name,
            horizontalAlignment: TextHorizontalAlignment.Left,
            verticalAlignment: TextVerticalAlignment.Top,
            secondAlignmentPoint: point3d(
              currentOrigin.x + 0.57,
              currentOrigin.y - currentNsptDepth - 0.12
            ),
          }
        );
        nsptText.textStyle = arialTextStyle.name;
        currentNsptDepth += 1;
      });

      // Nível d'água
      const waterLevel = sondagem.water_level ?? maxDepth;
      const waterLevelStr =
        sondagem.water_level != null
          ? "NA=" + sondagem.water_level.toFixed(2).replace(".", ",")
          : "NA SECO";
      dxf.addInsert(
        waterLevelBlock.name,
        point3d(currentOrigin.x + 2.9136, currentOrigin.y - waterLevel)
      );
      const textPoint = point3d(
        sondagem.water_level ? currentOrigin.x + 2.86 : currentOrigin.x + 2.76,
        currentOrigin.y - waterLevel + 0.48
      );
      const waterLevelText = dxf.addText(textPoint, 0.25, waterLevelStr, {
        layerName: waterLevelTextLayer.name,
        horizontalAlignment: TextHorizontalAlignment.Left,
        verticalAlignment: TextVerticalAlignment.Bottom,
        secondAlignmentPoint: textPoint,
      });
      waterLevelText.textStyle = arialTextStyle.name;

      // Profundidade final
      const finalDepthStr =
        "PROFUNDIDADE FINAL = " + maxDepth.toFixed(2).replace(".", ",") + " m.";
      const finalDepthPosition = point3d(
        currentOrigin.x - 5.72,
        currentOrigin.y - 0.87 - currentY
      );
      const finalDepthText = dxf.addText(
        finalDepthPosition,
        0.35,
        finalDepthStr,
        {
          horizontalAlignment: TextHorizontalAlignment.Left,
          verticalAlignment: TextVerticalAlignment.Top,
          secondAlignmentPoint: finalDepthPosition,
          layerName: finalDepthLayer.name,
        }
      );
      finalDepthText.textStyle = arialTextStyle.name;
    } catch (error) {
      console.error(
        `Erro no palito ${sondagem.hole_id} (índice ${index}):`,
        error
      );
      processErrorNames.push(sondagem.hole_id);
      return;
    }
  });

  // Baixando o arquivo
  const dxfString = dxf.stringify();
  downloadDXF(dxfString, "palitos.dxf");
  return {
    success: true,
    processErrorNames,
    totalProcessed: data.length,
    successCount: data.length - processErrorNames.length,
  };
};

export const generateDXFMetro = async (data: PalitoData[]) => {
  // Parâmetros globais
  const firstOrigin = point3d(0, 100);
  const gap = 15;

  // Instanciando a lib
  const dxf = new DxfWriter();
  dxf.setUnits(Units.Meters);

  // Layers
  const textLayer = dxf.addLayer("msp-ge_textos", Colors.Yellow, "Continuous");
  const nsptLayer = dxf.addLayer("msp-ge_log_spt", Colors.Yellow, "Continuous");
  const perfilLayer = dxf.addLayer("msp-ge_perfil", Colors.Green, "Continuous");
  const simbologiaLayer = dxf.addLayer(
    "msp-ge_simbologia_geral",
    Colors.Green,
    "Continuous"
  );
  const camadasLayer = dxf.addLayer("G-CAMADAS_PIS", Colors.Cyan, "Continuous");

  // Estilo de texto: texto normal para a maioria, MText para NA e NSPT
  const arialTextStyle = dxf.tables.addStyle("arialText");
  arialTextStyle.fontFileName = "arial.ttf";
  arialTextStyle.widthFactor = 1.0;
  arialTextStyle.fixedTextHeight = 0;

  // const nsptMTextOptions: MTextOptions = {
  //   attachmentPoint: 3,
  //   width: 8,
  //   layerName: nsptLayer.name,
  // };

  // Definindo blocos de retângulos que se repetem na escala vertical: dois retângulos verdes, um preenchido outro só o contorno em polyline
  const scaleBlockHatch = dxf.addBlock("scaleBlockHatch");
  scaleBlockHatch.layerName = perfilLayer.name;
  const scalePolyline = new HatchPolylineBoundary();
  scalePolyline.add(vertex(0, 0));
  scalePolyline.add(vertex(0.7539, 0));
  scalePolyline.add(vertex(0.7539, -2.5));
  scalePolyline.add(vertex(0, -2.5));
  scalePolyline.add(vertex(0, 0));
  const scaleBoundary = new HatchBoundaryPaths();
  scaleBoundary.addPolylineBoundary(scalePolyline);
  const solidPattern = pattern({
    name: HatchPredefinedPatterns.SOLID,
  });
  scaleBlockHatch.addHatch(scaleBoundary, solidPattern, {
    colorNumber: Colors.Green,
  });

  const scaleBlockOutline = dxf.addBlock("scaleBlockOutline");
  scaleBlockOutline.layerName = perfilLayer.name;
  const outlineVertices = [
    { point: point2d(0, 0) },
    { point: point2d(0.7539, 0) },
    { point: point2d(0.7539, -2.5) },
    { point: point2d(0, -2.5) },
    { point: point2d(0, 0) },
  ];
  scaleBlockOutline.addLWPolyline(outlineVertices, {
    colorNumber: Colors.Green,
  });

  // Bloco de linhas de profundidade
  const depthLineBlock = dxf.addBlock("depthLineBlock");
  depthLineBlock.layerName = camadasLayer.name;
  const depthVertices = [
    {
      point: point2d(-4.9973, 0),
    },
    {
      point: point2d(12.3938, 0),
    },
  ];
  depthLineBlock.addLWPolyline(depthVertices);

  // Bloco de nível da água: Somente o texto N.A. em verde e um triângulo preenchido em vermelho, com a ponta inferior indicando o NA
  const waterLevelBlock = dxf.addBlock("waterLevelBlock");
  waterLevelBlock.layerName = simbologiaLayer.name;
  const waterLevelPolyline = new HatchPolylineBoundary();
  waterLevelPolyline.add(vertex(0, 0));
  waterLevelPolyline.add(vertex(-1.0471, 1.6754));
  waterLevelPolyline.add(vertex(1.0471, 1.6754));
  waterLevelPolyline.add(vertex(0, 0));
  const waterLevelBoundary = new HatchBoundaryPaths();
  waterLevelBoundary.addPolylineBoundary(waterLevelPolyline);
  waterLevelBlock.addHatch(waterLevelBoundary, solidPattern, {
    colorNumber: Colors.Red,
  });

  const naText = waterLevelBlock.addText(point3d(0, 3.05), 1.0471, "N.A.", {
    layerName: simbologiaLayer.name,
    horizontalAlignment: TextHorizontalAlignment.Center,
    verticalAlignment: TextVerticalAlignment.Top,
    secondAlignmentPoint: point3d(0, 3.05),
    colorNumber: Colors.Green,
  });
  naText.textStyle = arialTextStyle.name;

  // Falta colocar o texto

  const processErrorNames: string[] = [];
  // Construindo cada palito
  data.forEach((sondagem, index) => {
    try {
      // Parâmetros individuais do palito
      const currentOrigin = point3d(firstOrigin.x + gap * index, firstOrigin.y);
      const maxDepth = sondagem.depths[sondagem.depths.length - 1];

      // Fazendo o cabeçalho: retângulo dividido por duas linhas horizontais
      // Linha vertical
      dxf.addLine(
        point3d(currentOrigin.x, currentOrigin.y),
        point3d(currentOrigin.x, currentOrigin.y + 6.4916),
        { layerName: perfilLayer.name }
      );

      // Retângulo principal
      const headerVertices = [
        { point: point2d(currentOrigin.x - 6.75, currentOrigin.y + 6.4916) },
        { point: point2d(currentOrigin.x + 6.75, currentOrigin.y + 6.4916) },
        { point: point2d(currentOrigin.x + 6.75, currentOrigin.y + 11.4916) },
        { point: point2d(currentOrigin.x - 6.75, currentOrigin.y + 11.4916) },
        { point: point2d(currentOrigin.x - 6.75, currentOrigin.y + 6.4916) },
      ];
      dxf.addLWPolyline(headerVertices, { layerName: perfilLayer.name });

      // Linha horizontal superior
      dxf.addLine(
        point3d(currentOrigin.x - 6.75, currentOrigin.y + 9.4916),
        point3d(currentOrigin.x + 6.75, currentOrigin.y + 9.4916),
        { layerName: perfilLayer.name }
      );

      // Linha horizontal inferior
      dxf.addLine(
        point3d(currentOrigin.x - 6.75, currentOrigin.y + 7.9916),
        point3d(currentOrigin.x + 6.75, currentOrigin.y + 7.9916),
        { layerName: perfilLayer.name }
      );

      // Textos do cabeçalho
      // "Proj." - alinhado à esquerda
      const projText = dxf.addText(
        point3d(currentOrigin.x - 5.7568, currentOrigin.y + 6.8666),
        1,
        "Proj.",
        {
          layerName: textLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Left,
          secondAlignmentPoint: point3d(
            currentOrigin.x - 5.7568,
            currentOrigin.y + 6.8666
          ),
        }
      );
      projText.textStyle = arialTextStyle.name;

      // "X,XX" - centro
      const coordText = dxf.addText(
        point3d(currentOrigin.x, currentOrigin.y + 7.2416),
        1,
        "X,XX",
        {
          layerName: textLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Center,
          verticalAlignment: TextVerticalAlignment.Middle,
          secondAlignmentPoint: point3d(
            currentOrigin.x,
            currentOrigin.y + 7.2416
          ),
        }
      );
      coordText.textStyle = arialTextStyle.name;

      // "m" - alinhado à esquerda
      const mText = dxf.addText(
        point3d(currentOrigin.x + 4.1276, currentOrigin.y + 6.8666),
        1,
        "m",
        {
          layerName: textLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Left,
          secondAlignmentPoint: point3d(
            currentOrigin.x + 4.1276,
            currentOrigin.y + 6.8666
          ),
        }
      );
      mText.textStyle = arialTextStyle.name;

      // "Cota: " + valor da cota - centro
      const cotaText = dxf.addText(
        point3d(currentOrigin.x, currentOrigin.y + 8.7416),
        1,
        sondagem.z ? `Cota: ${sondagem.z.toFixed(2)}` : "Cota",
        {
          layerName: textLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Center,
          verticalAlignment: TextVerticalAlignment.Middle,
          secondAlignmentPoint: point3d(
            currentOrigin.x,
            currentOrigin.y + 8.7416
          ),
        }
      );
      cotaText.textStyle = arialTextStyle.name;

      // Hole ID - centro, altura 1.5
      const holeIdText = dxf.addText(
        point3d(currentOrigin.x, currentOrigin.y + 10.4916),
        1.5,
        sondagem.hole_id.toUpperCase(),
        {
          layerName: textLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Center,
          verticalAlignment: TextVerticalAlignment.Middle,
          secondAlignmentPoint: point3d(
            currentOrigin.x,
            currentOrigin.y + 10.4916
          ),
        }
      );
      holeIdText.textStyle = arialTextStyle.name;

      // Fazendo a escala vertical: alternar blocos
      // Escala 2.5:1
      const blockHeight = 2.5;

      // Desenhar blocos completos primeiro
      const completeBlocks = Math.floor(maxDepth);
      for (let i = 0; i < completeBlocks; i++) {
        const blockY = currentOrigin.y - i * blockHeight;
        const isOddMeter = (i + 1) % 2 === 1; // metro 1, 3, 5... são ímpares
        const blockName = isOddMeter ? "scaleBlockHatch" : "scaleBlockOutline";

        dxf.addInsert(
          blockName,
          point3d(currentOrigin.x - 0.7539 / 2, blockY), // centraliza horizontalmente
          {
            layerName: perfilLayer.name,
            colorNumber: Colors.Green,
          }
        );
      }

      // Desenhar bloco parcial se necessário
      const remainingDepth = maxDepth - completeBlocks;
      if (remainingDepth > 0) {
        const partialBlockY = currentOrigin.y - completeBlocks * blockHeight;
        const adjustedHeight = remainingDepth * blockHeight;
        const isOddMeter = (completeBlocks + 1) % 2 === 1;

        const vertices = [
          { point: point2d(currentOrigin.x - 0.7539 / 2, partialBlockY) },
          { point: point2d(currentOrigin.x + 0.7539 / 2, partialBlockY) },
          {
            point: point2d(
              currentOrigin.x + 0.7539 / 2,
              partialBlockY - adjustedHeight
            ),
          },
          {
            point: point2d(
              currentOrigin.x - 0.7539 / 2,
              partialBlockY - adjustedHeight
            ),
          },
          { point: point2d(currentOrigin.x - 0.7539 / 2, partialBlockY) },
        ];

        if (isOddMeter) {
          // Bloco hatch
          const customPolyline = new HatchPolylineBoundary();
          vertices.forEach((v) =>
            customPolyline.add(vertex(v.point.x, v.point.y))
          );
          const customBoundary = new HatchBoundaryPaths();
          customBoundary.addPolylineBoundary(customPolyline);
          dxf.addHatch(customBoundary, solidPattern, {
            colorNumber: Colors.Green,
            layerName: perfilLayer.name,
          });
        } else {
          // Bloco contorno
          dxf.addLWPolyline(vertices, {
            colorNumber: Colors.Green,
            layerName: perfilLayer.name,
          });
        }
      }

      // Organizar textos maiores que as camadas => pode ser ignorado neste padrão

      // NSPTs
      const nsptStartY = currentOrigin.y - 1.9143; // primeira posição Y
      const nsptX = currentOrigin.x + 0.7958; // posição X fixa
      const nsptSpacing = 2.5; // espaçamento vertical

      for (let d = 1; d < sondagem.nspt.start_depth; d++) {
        const currentY = nsptStartY - (d - 1) * nsptSpacing;
        const emptyNsptText = dxf.addText(point3d(nsptX, currentY), 1.0, "-", {
          layerName: nsptLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Left,
          verticalAlignment: TextVerticalAlignment.Middle,
          secondAlignmentPoint: point3d(nsptX, currentY),
        });
        emptyNsptText.textStyle = arialTextStyle.name;
      }

      sondagem.nspt.values.forEach((value, index) => {
        const currentY =
          nsptStartY - (index + sondagem.nspt.start_depth) * nsptSpacing;
        const nsptText = dxf.addText(
          point3d(nsptX, currentY),
          1.0,
          value as string,
          {
            layerName: nsptLayer.name,
            horizontalAlignment: TextHorizontalAlignment.Left,
            verticalAlignment: TextVerticalAlignment.Middle,
            secondAlignmentPoint: point3d(nsptX, currentY),
          }
        );
        nsptText.textStyle = arialTextStyle.name;
      });

      // Nível d'água
      const waterLevelY =
        sondagem.water_level !== null && sondagem.water_level !== undefined
          ? currentOrigin.y - sondagem.water_level * 2.5
          : currentOrigin.y - maxDepth * 2.5;
      const waterLevelX = currentOrigin.x - 2.6291;

      dxf.addInsert(waterLevelBlock.name, point3d(waterLevelX, waterLevelY), {
        layerName: simbologiaLayer.name,
      });

      // Profundidade final
      const maxDepthText = dxf.addText(
        point3d(
          currentOrigin.x - 0.0442,
          currentOrigin.y - 2.5 * maxDepth - 0.9933
        ),
        0.9,
        `${maxDepth.toString().replace(".", ",")}m`,
        {
          layerName: textLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Center,
          verticalAlignment: TextVerticalAlignment.Middle,
          secondAlignmentPoint: point3d(
            currentOrigin.x - 0.0442,
            currentOrigin.y - 2.5 * maxDepth - 0.9933
          ),
        }
      );
      maxDepthText.textStyle = arialTextStyle.name;

      // Linhas de Profundidade e descrições
      if (!sondagem.depths.includes(0)) {
        sondagem.depths.unshift(0);
      }
      sondagem.depths.forEach((depth, index) => {
        // Linha
        dxf.addLWPolyline(
          [
            {
              point: point3d(
                currentOrigin.x - 4.9973,
                currentOrigin.y - depth * 2.5
              ),
            },
            {
              point: point3d(
                currentOrigin.x + 12.3938,
                currentOrigin.y - depth * 2.5
              ),
            },
          ],
          {
            layerName: camadasLayer.name,
            colorNumber: Colors.Cyan,
          }
        );
        // Descrições
        if (
          index < sondagem.depths.length - 1 &&
          index < sondagem.geology.length
        ) {
          const geologyTextPoint = point3d(
            currentOrigin.x + 2.6675,
            currentOrigin.y - (depth + sondagem.depths[index + 1]) * 1.25 // 2.5 (escala) / 2 (média)
          );
          const geologyText = dxf.addText(
            geologyTextPoint,
            1.2046,
            sondagem.geology[index],
            {
              layerName: camadasLayer.name,
              horizontalAlignment: TextHorizontalAlignment.Left,
              secondAlignmentPoint: geologyTextPoint,
            }
          );
          geologyText.textStyle = arialTextStyle.name;
        }
      });
    } catch (error) {
      console.error(
        `Erro no palito ${sondagem.hole_id} (índice ${index}):`,
        error
      );
      processErrorNames.push(sondagem.hole_id);
      return;
    }
  });

  // Baixando o arquivo
  const dxfString = dxf.stringify();
  downloadDXF(dxfString, "palitos.dxf");
  return {
    success: true,
    processErrorNames,
    totalProcessed: data.length,
    successCount: data.length - processErrorNames.length,
  };
};

const downloadDXF = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};

export const getDescriptionClusters = (sondagem: PalitoData): Cluster[] => {
  const geolLayerData = sondagem.geology
    .filter((_entry, index) => index < sondagem.depths.length - 1)
    .map((entry, index) => {
      if (index >= sondagem.depths.length) {
        return {
          str: "",
          lines: "",
          estimatedHeight: 0,
          from: 0,
          to: 0,
          layerThickness: 0,
        };
      }
      const interpText = sondagem.interp?.[index]?.trim();
      const str = interpText
        ? interpText.toUpperCase() + " - " + entry.trim().toUpperCase()
        : entry.trim().toUpperCase();
      const lines = Math.ceil(str.length / 35);
      const estimatedHeight = lines * 0.45 - 0.1;
      const from = sondagem.depths[index] || 0;
      const to =
        sondagem.depths[index + 1] || sondagem.depths[sondagem.depths.length];
      const layerThickness = to - from;

      return {
        str: str,
        lines: lines,
        estimatedHeight: estimatedHeight,
        from: from,
        to: to,
        layerThickness: layerThickness,
      };
    });

  if (geolLayerData.length >= sondagem.depths.length) {
    geolLayerData.splice(sondagem.depths.length - 1);
  }

  const layerThicknessArr = geolLayerData.map((entry) => entry.layerThickness);
  const textHeightsArr = geolLayerData.map((entry) => entry.estimatedHeight);

  let conflictAnalysis = [];
  for (let i = 0; i < layerThicknessArr.length; i++) {
    const hasOverflow = textHeightsArr[i] > layerThicknessArr[i];
    const overflow = hasOverflow ? textHeightsArr[i] - layerThicknessArr[i] : 0;

    conflictAnalysis.push({
      index: i,
      hasOverflow,
      overflow,
      availableSpace: layerThicknessArr[i] - textHeightsArr[i], // pode ser negativo
    });
  }

  const conflicts = conflictAnalysis.filter((c) => c.hasOverflow);

  // Criar clusters de camadas com texto "sobreposto"
  let clusters: Cluster[] = [];
  let processedIndexes = new Set();

  conflicts.forEach((conflict) => {
    // Se conflito já tiver sido abordado em uma iteração anterior, ignorar
    if (processedIndexes.has(conflict.index)) return;

    // Iniciar cluster com a camada problemática
    let cluster: Cluster = {
      startIndex: conflict.index,
      endIndex: conflict.index,
      layers: [conflict.index],
      totalNeeded: conflict.overflow,
      totalAvailable: 0,
      needsExtraSpace: 0,
      unchanged: false,
      layerSizes: [],
    };

    // Expandir para cima e para baixo até ter espaço suficiente
    while (
      cluster.totalAvailable < cluster.totalNeeded &&
      ((cluster.startIndex > 0 && !processedIndexes.has(cluster.startIndex)) || // Coloquei aqui para não "comer" outro cluster
        cluster.endIndex < conflictAnalysis.length - 1)
    ) {
      // Avaliar direção da expansão
      const goBelow =
        cluster.startIndex === 0
          ? true
          : cluster.endIndex >= conflictAnalysis.length - 1
          ? false
          : conflictAnalysis[cluster.startIndex - 1].availableSpace <
            conflictAnalysis[cluster.endIndex + 1].availableSpace;

      // Expandindo para cima
      if (!goBelow) {
        cluster.startIndex--;
        cluster.layers.unshift(cluster.startIndex);
        cluster.totalAvailable += Math.max(
          0,
          conflictAnalysis[cluster.startIndex].availableSpace
        );
        processedIndexes.add(cluster.startIndex);
      }

      // Expandindo para baixo
      if (goBelow && cluster.endIndex < conflictAnalysis.length) {
        cluster.endIndex++;
        cluster.layers.push(cluster.endIndex);
        cluster.totalAvailable += Math.max(
          0,
          conflictAnalysis[cluster.endIndex].availableSpace
        );
        processedIndexes.add(cluster.endIndex);
      }
    }

    // Se ainda não tem espaço suficiente, usar espaço abaixo da profundidade final
    if (cluster.totalAvailable < cluster.totalNeeded) {
      cluster.needsExtraSpace = cluster.totalNeeded - cluster.totalAvailable;
    }

    // Aqui, com a cluster pronta, definir a espessura de cada camada
    const totalOriginalSpace = cluster.layers.reduce(
      (sum, layerIndex) => sum + layerThicknessArr[layerIndex],
      0
    );

    const totalTextNeeded = cluster.layers.reduce(
      (sum, layerIndex) => sum + textHeightsArr[layerIndex],
      0
    );

    // Espaço final da cluster (original + extra se necessário)
    const finalTotalSpace = totalOriginalSpace + cluster.needsExtraSpace;

    // Distribuir espaço proporcionalmente
    cluster.layerSizes = cluster.layers.map((layerIndex) => {
      const textHeight = textHeightsArr[layerIndex];
      const proportion = textHeight / totalTextNeeded;
      const finalHeight = finalTotalSpace * proportion;

      return {
        layerIndex,
        originalHeight: layerThicknessArr[layerIndex],
        textHeight: textHeightsArr[layerIndex],
        finalHeight: Math.max(textHeight + 0.1, finalHeight),
        from: geolLayerData[layerIndex].from,
        to: geolLayerData[layerIndex].to,
      };
    });
    processedIndexes.add(conflict.index);
    clusters.push(cluster);
  });

  // Adicionar camadas sem conflito como clusters individuais
  for (let i = 0; i < conflictAnalysis.length; i++) {
    if (!processedIndexes.has(i)) {
      // Camada sem conflito = cluster de 1 camada
      const singleLayerCluster: Cluster = {
        startIndex: i,
        endIndex: i,
        layers: [i],
        totalNeeded: 0,
        totalAvailable: conflictAnalysis[i].availableSpace,
        needsExtraSpace: 0,
        layerSizes: [
          {
            layerIndex: i,
            originalHeight: layerThicknessArr[i],
            textHeight: textHeightsArr[i],
            finalHeight: layerThicknessArr[i],
            from: geolLayerData[i].from,
            to: geolLayerData[i].to,
          },
        ],
        unchanged: true,
      };

      clusters.push(singleLayerCluster);
    }
  }

  // Ordenar clusters pela camada inicial (startIndex)
  clusters.sort((a, b) => a.startIndex - b.startIndex);

  return clusters;
};

const drawLayerData = (
  dxf: DxfWriter,
  layerSize: LayerSize,
  currentOrigin: vec3_t,
  depth: number,
  text: string,
  textOptions: MTextOptions,
  lineLayer: DxfLayer,
  textStyle: DxfStyle,
  layerCenterY: number,
  correctedDepth?: number
) => {
  // Parâmetros
  const maxX = 2.72;
  const breakX = 1.35;
  const straightenX = 1.45;
  if (!correctedDepth) correctedDepth = 0;

  // Desenhando a linha de profundidade
  const depthVertices = correctedDepth
    ? [
        { point: point2d(currentOrigin.x, currentOrigin.y - depth) },
        { point: point2d(currentOrigin.x - breakX, currentOrigin.y - depth) },
        {
          point: point2d(
            currentOrigin.x - straightenX,
            currentOrigin.y - correctedDepth
          ),
        },
        {
          point: point2d(
            currentOrigin.x - maxX,
            currentOrigin.y - correctedDepth
          ),
        },
      ]
    : [
        {
          point: point2d(currentOrigin.x, currentOrigin.y - depth),
        },
        {
          point: point2d(currentOrigin.x - maxX, currentOrigin.y - depth),
        },
      ];

  dxf.addLWPolyline(depthVertices, { layerName: lineLayer.name });

  // Inserindo texto de profundidade
  const depthText = dxf.addText(
    point3d(currentOrigin.x - 0.15, currentOrigin.y - depth - 0.07),
    0.35,
    depth.toFixed(2).replace(".", ","),
    {
      layerName: lineLayer.name,
      horizontalAlignment: TextHorizontalAlignment.Right,
      verticalAlignment: TextVerticalAlignment.Bottom,
      secondAlignmentPoint: point3d(
        currentOrigin.x - 0.15,
        currentOrigin.y - depth - 0.07
      ),
    }
  );
  depthText.textStyle = textStyle.name;

  // Descrições das camadas
  const descriptionInsertionPoint = point3d(
    currentOrigin.x - 1.55,
    currentOrigin.y - layerCenterY + layerSize.textHeight / 2
  );
  const descriptionText = dxf.addMText(
    descriptionInsertionPoint,
    0.25,
    text,
    textOptions
  );
  descriptionText.textStyle = textStyle.name;
};
