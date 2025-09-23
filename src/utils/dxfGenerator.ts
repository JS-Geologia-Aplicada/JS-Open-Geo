import type { Cluster, PalitoData } from "../types";
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
  type HatchPatternOptions_t,
  type MTextOptions,
  type vec3_t,
} from "@tarikjabiri/dxf";

export const generateDxfJs = async (
  data: PalitoData[],
  variant: "padrao-1" | "padrao-2"
) => {
  const variantConfig = {
    "padrao-1": {
      waterLevel: {
        x: 2.9136,
        textStandardX: 4.1102,
        textDryX: 4.2102,
        textY: 0.7019,
        textHeight: 0.25,
        textHorizontalAlignment: TextHorizontalAlignment.Right,
        textVerticalAlignment: TextVerticalAlignment.Middle,
        createWaterLevelBlock: (
          dxf: DxfWriter,
          waterLevelShapeLayerName: string,
          hatchPattern: HatchPatternOptions_t
        ) => {
          const waterLevelBlock = dxf.addBlock("waterLevelBlock");
          waterLevelBlock.layerName = waterLevelShapeLayerName;
          const waterLevelPolyline = new HatchPolylineBoundary();
          waterLevelPolyline.add(vertex(0, 0));
          waterLevelPolyline.add(vertex(-0.2754, 0.4406));
          waterLevelPolyline.add(vertex(0.2754, 0.4406));
          waterLevelPolyline.add(vertex(0, 0));
          const waterLevelBoundary = new HatchBoundaryPaths();
          waterLevelBoundary.addPolylineBoundary(waterLevelPolyline);
          waterLevelBlock.addHatch(waterLevelBoundary, hatchPattern);
          waterLevelBlock.addLine(
            point3d(-0.2754, 0.4406),
            point3d(1.574, 0.4406)
          );
          return waterLevelBlock;
        },
      },
      heading: {
        y: 2.453,
        x: -4.7657,
        titleHeight: 0.65,
        titleX: -0.18,
        titleY: 2.67,
        titleVerticalAlignment: undefined,
        titleHorizontalAlignment: TextHorizontalAlignment.Left,
        cotaX: -3.4329,
        cotaY: 2.2512,
        cotaVerticalAlignment: TextVerticalAlignment.Top,
        cotaHorizontalAlignment: TextHorizontalAlignment.Left,
        cotaHeight: 0.45,
      },
      description: {
        x: -1.4769,
        height: 0.25,
      },
      nspt: {
        x: 0.5744,
        y: -1.1253,
        height: 0.35,
        verticalAlignment: TextVerticalAlignment.Top,
        horizontalAlignment: TextHorizontalAlignment.Left,
      },
      finalDepth: {
        x: -5.72,
        y: -0.87,
        height: 0.35,
        getString: (maxDepth: number) => {
          return (
            "PROFUNDIDADE FINAL = " +
            maxDepth.toFixed(2).replace(".", ",") +
            " m."
          );
        },
      },
      depths: {
        drawDepthLine: (
          dxf: DxfWriter,
          currentOrigin: vec3_t,
          originalDepth: number,
          correctedDepth: number | undefined,
          depthLinesLayer: DxfLayer
        ) => {
          const maxX = 2.72;
          const breakX = 1.35;
          const straightenX = 1.45;
          // Desenhando a linha de profundidade
          const depthVertices = correctedDepth
            ? [
                {
                  point: point2d(
                    currentOrigin.x,
                    currentOrigin.y - originalDepth
                  ),
                },
                {
                  point: point2d(
                    currentOrigin.x - breakX,
                    currentOrigin.y - originalDepth
                  ),
                },
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
                  point: point2d(
                    currentOrigin.x,
                    currentOrigin.y - originalDepth
                  ),
                },
                {
                  point: point2d(
                    currentOrigin.x - maxX,
                    currentOrigin.y - originalDepth
                  ),
                },
              ];
          dxf.addLWPolyline(depthVertices, { layerName: depthLinesLayer.name });
        },
        drawDepthText: (
          dxf: DxfWriter,
          currentOrigin: vec3_t,
          originalDepth: number,
          depthLinesLayer: DxfLayer,
          arialTextStyle: DxfStyle
        ) => {
          const depthText = dxf.addText(
            point3d(
              currentOrigin.x - 0.15,
              currentOrigin.y - originalDepth - 0.07
            ),
            0.35,
            originalDepth.toFixed(2).replace(".", ","),
            {
              layerName: depthLinesLayer.name,
              horizontalAlignment: TextHorizontalAlignment.Right,
              verticalAlignment: TextVerticalAlignment.Bottom,
              secondAlignmentPoint: point3d(
                currentOrigin.x - 0.15,
                currentOrigin.y - originalDepth - 0.07
              ),
            }
          );
          depthText.textStyle = arialTextStyle.name;
        },
      },
    },
    "padrao-2": {
      waterLevel: {
        x: 1.7582,
        textStandardX: 3.4854,
        textDryX: 3.4854,
        textY: 0.2651,
        textHeight: 0.2,
        textHorizontalAlignment: TextHorizontalAlignment.Right,
        textVerticalAlignment: TextVerticalAlignment.Middle,
        createWaterLevelBlock: (
          dxf: DxfWriter,
          waterLevelShapeLayerName: string,
          _hatchPattern: HatchPatternOptions_t
        ) => {
          const waterLevelBlock = dxf.addBlock("waterLevelBlock");
          waterLevelBlock.layerName = waterLevelShapeLayerName;
          waterLevelBlock.addLine(point3d(0, 0), point3d(1.6204, 0), {
            colorNumber: Colors.Blue,
          });
          waterLevelBlock.addLine(
            point3d(0.25, -0.1169),
            point3d(1.3704, -0.1169),
            {
              colorNumber: Colors.Blue,
            }
          );
          waterLevelBlock.addLine(
            point3d(0.4999, -0.2269),
            point3d(1.1205, -0.2269),
            {
              colorNumber: Colors.Blue,
            }
          );
          waterLevelBlock.addLine(
            point3d(0.7362, -0.2777),
            point3d(0.8568, -0.2777),
            {
              colorNumber: Colors.Blue,
            }
          );
          waterLevelBlock.addLine(
            point3d(0.7375, -0.3369),
            point3d(0.8581, -0.3369),
            {
              colorNumber: Colors.Blue,
            }
          );
          return waterLevelBlock;
        },
      },
      heading: {
        y: 3.7057,
        x: -2.9752,
        titleHeight: 0.3,
        titleX: -1.8782,
        titleY: 4.2779,
        titleVerticalAlignment: TextVerticalAlignment.Top,
        titleHorizontalAlignment: TextHorizontalAlignment.Left,
        cotaX: -1.575,
        cotaY: 3.5039,
        cotaVerticalAlignment: TextVerticalAlignment.Top,
        cotaHorizontalAlignment: TextHorizontalAlignment.Left,
        cotaHeight: 0.2,
      },
      description: {
        x: -1.4769,
        height: 0.2,
      },
      nspt: {
        x: 0.5745,
        y: -1.1253,
        height: 0.2,
        verticalAlignment: TextVerticalAlignment.Top,
        horizontalAlignment: TextHorizontalAlignment.Left,
      },
      finalDepth: {
        x: -1.1188,
        y: -0.1687,
        height: 0.2,
        getString: (maxDepth: number) => {
          return "PROF: " + maxDepth.toFixed(2).replace(".", ",") + " m";
        },
      },
      depths: {
        drawDepthLine: (
          dxf: DxfWriter,
          currentOrigin: vec3_t,
          originalDepth: number,
          correctedDepth: number | undefined,
          depthLinesLayer: DxfLayer
        ) => {
          const maxX = 5.261;
          const breakX = 1.3598;
          // Desenhando a linha de profundidade (4 vértices)
          const depthVertices = correctedDepth
            ? [
                {
                  point: point2d(
                    currentOrigin.x,
                    currentOrigin.y - originalDepth
                  ),
                },
                {
                  point: point2d(
                    currentOrigin.x - breakX,
                    currentOrigin.y - originalDepth
                  ),
                },
                {
                  point: point2d(
                    currentOrigin.x - breakX,
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
                  point: point2d(
                    currentOrigin.x,
                    currentOrigin.y - originalDepth
                  ),
                },
                {
                  point: point2d(
                    currentOrigin.x - maxX,
                    currentOrigin.y - originalDepth
                  ),
                },
              ];
          dxf.addLWPolyline(depthVertices, { layerName: depthLinesLayer.name });
        },
      },
    },
  };
  const config = variantConfig[variant];

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

  // Bloco de nível da água
  const waterLevelBlock = config.waterLevel.createWaterLevelBlock(
    dxf,
    waterLevelShapeLayer.name,
    solidPattern
  );

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
        point3d(currentOrigin.x + 0.1, currentOrigin.y + config.heading.y),
        { layerName: titlesLayer.name }
      );
      dxf.addLine(
        point3d(currentOrigin.x + 0.1, currentOrigin.y + config.heading.y),
        point3d(
          currentOrigin.x + config.heading.x,
          currentOrigin.y + config.heading.y
        ),

        { layerName: titlesLayer.name }
      );

      const title = dxf.addText(
        point3d(
          currentOrigin.x + config.heading.titleX,
          currentOrigin.y + config.heading.titleY
        ),
        config.heading.titleHeight,
        sondagem.hole_id.toUpperCase(),
        {
          layerName: titlesLayer.name,
          horizontalAlignment: config.heading.titleHorizontalAlignment,
          verticalAlignment: config.heading.titleVerticalAlignment,
          secondAlignmentPoint: point3d(
            currentOrigin.x + config.heading.titleX,
            currentOrigin.y + config.heading.titleY
          ),
        }
      );
      title.textStyle = "arialText";

      const cota = dxf.addText(
        point3d(
          currentOrigin.x + config.heading.cotaX,
          currentOrigin.y + config.heading.cotaY
        ),
        config.heading.cotaHeight,
        sondagem.z
          ? "COTA=" + sondagem.z.toFixed(2).replace(".", ",")
          : "COTA=0",
        {
          layerName: titlesLayer.name,
          horizontalAlignment: config.heading.cotaHorizontalAlignment,
          verticalAlignment: config.heading.cotaVerticalAlignment,
          secondAlignmentPoint: point3d(
            currentOrigin.x + config.heading.cotaX,
            currentOrigin.y + config.heading.cotaY
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
        cluster.layers.forEach((layerIndex) => {
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
          let correctedDepth;
          if (cluster.unchanged) {
            correctedDepth = undefined;
          } else {
            cumulativeDepth += layerSize.finalHeight;
            correctedDepth = cumulativeDepth;
          }

          // Desenhando linhas de profundidade
          if (!correctedDepth) correctedDepth = 0;
          config.depths.drawDepthLine(
            dxf,
            currentOrigin,
            originalDepth,
            correctedDepth,
            depthLinesLayer
          );

          // Desenhando textos das profundidades
          if ("drawDepthText" in config.depths) {
            config.depths.drawDepthText(
              dxf,
              currentOrigin,
              originalDepth,
              depthLinesLayer,
              arialTextStyle
            );
          }

          // Descrições das camadas
          const descriptionInsertionPoint = point3d(
            currentOrigin.x + config.description.x,
            currentOrigin.y - layerCenterY + layerSize.textHeight / 2
          );
          const descriptionText = dxf.addMText(
            descriptionInsertionPoint,
            config.description.height,
            descriptionStr,
            descriptionMTextOptions
          );
          descriptionText.textStyle = arialTextStyle.name;

          currentY += layerSize.finalHeight;
        });
      });

      //NSPTs
      const firstNsptDepth = sondagem.nspt.start_depth;
      let currentNsptDepth = firstNsptDepth;
      sondagem.nspt.values.forEach((value) => {
        const nsptText = dxf.addText(
          point3d(
            currentOrigin.x + config.nspt.x,
            currentOrigin.y - currentNsptDepth + config.nspt.y
          ),
          config.nspt.height,
          value,
          {
            layerName: depthLinesLayer.name,
            horizontalAlignment: config.nspt.horizontalAlignment,
            verticalAlignment: config.nspt.verticalAlignment,
            secondAlignmentPoint: point3d(
              currentOrigin.x + config.nspt.x,
              currentOrigin.y - currentNsptDepth + config.nspt.y
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
        point3d(
          currentOrigin.x + config.waterLevel.x,
          currentOrigin.y - waterLevel
        )
      );
      const textPoint = point3d(
        sondagem.water_level
          ? currentOrigin.x + config.waterLevel.textStandardX
          : currentOrigin.x + config.waterLevel.textDryX,
        currentOrigin.y - waterLevel + config.waterLevel.textY
      );
      const waterLevelText = dxf.addText(
        textPoint,
        config.waterLevel.textHeight,
        waterLevelStr,
        {
          layerName: waterLevelTextLayer.name,
          horizontalAlignment: config.waterLevel.textHorizontalAlignment,
          verticalAlignment: config.waterLevel.textVerticalAlignment,
          secondAlignmentPoint: textPoint,
        }
      );
      waterLevelText.textStyle = arialTextStyle.name;

      // Profundidade final
      const finalDepthStr = config.finalDepth.getString(maxDepth);
      const finalDepthPosition = point3d(
        currentOrigin.x + config.finalDepth.x,
        currentOrigin.y + config.finalDepth.y - currentY
      );
      const finalDepthText = dxf.addText(
        finalDepthPosition,
        config.finalDepth.height,
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

  // Definindo blocos de retângulos que se repetem na escala vertical: dois retângulos verdes, um preenchido outro só o contorno em polyline
  const scaleBlockHatch = dxf.addBlock("scaleBlockHatch");
  scaleBlockHatch.layerName = perfilLayer.name;
  const scalePolyline = new HatchPolylineBoundary();
  scalePolyline.add(vertex(0, 0));
  scalePolyline.add(vertex(0.3016, 0));
  scalePolyline.add(vertex(0.3016, -1));
  scalePolyline.add(vertex(0, -1));
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
    { point: point2d(0.3016, 0) },
    { point: point2d(0.3016, -1) },
    { point: point2d(0, -1) },
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
      point: point2d(-1.9989, 0),
    },
    {
      point: point2d(4.9575, 0),
    },
  ];
  depthLineBlock.addLWPolyline(depthVertices);

  // Bloco de nível da água: Somente o texto N.A. em verde e um triângulo preenchido em vermelho, com a ponta inferior indicando o NA
  const waterLevelBlock = dxf.addBlock("waterLevelBlock");
  waterLevelBlock.layerName = simbologiaLayer.name;
  const waterLevelPolyline = new HatchPolylineBoundary();
  waterLevelPolyline.add(vertex(0, 0));
  waterLevelPolyline.add(vertex(-0.4188, 0.6702));
  waterLevelPolyline.add(vertex(0.4188, 0.6702));
  waterLevelPolyline.add(vertex(0, 0));
  const waterLevelBoundary = new HatchBoundaryPaths();
  waterLevelBoundary.addPolylineBoundary(waterLevelPolyline);
  waterLevelBlock.addHatch(waterLevelBoundary, solidPattern, {
    colorNumber: Colors.Red,
  });

  const naText = waterLevelBlock.addText(point3d(0, 1.22), 0.4188, "N.A.", {
    layerName: simbologiaLayer.name,
    horizontalAlignment: TextHorizontalAlignment.Center,
    verticalAlignment: TextVerticalAlignment.Top,
    secondAlignmentPoint: point3d(0, 1.22),
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
        point3d(currentOrigin.x, currentOrigin.y + 2.5966),
        { layerName: perfilLayer.name }
      );

      // Retângulo principal
      const headerVertices = [
        { point: point2d(currentOrigin.x - 2.7, currentOrigin.y + 2.5966) },
        { point: point2d(currentOrigin.x + 2.7, currentOrigin.y + 2.5966) },
        { point: point2d(currentOrigin.x + 2.7, currentOrigin.y + 4.5966) },
        { point: point2d(currentOrigin.x - 2.7, currentOrigin.y + 4.5966) },
        { point: point2d(currentOrigin.x - 2.7, currentOrigin.y + 2.5966) },
      ];
      dxf.addLWPolyline(headerVertices, { layerName: perfilLayer.name });

      // Linha horizontal superior
      dxf.addLine(
        point3d(currentOrigin.x - 2.7, currentOrigin.y + 3.7966),
        point3d(currentOrigin.x + 2.7, currentOrigin.y + 3.7966),
        { layerName: perfilLayer.name }
      );

      // Linha horizontal inferior
      dxf.addLine(
        point3d(currentOrigin.x - 2.7, currentOrigin.y + 3.1966),
        point3d(currentOrigin.x + 2.7, currentOrigin.y + 3.1966),
        { layerName: perfilLayer.name }
      );

      // Textos do cabeçalho
      // "Proj." - alinhado à esquerda
      const projText = dxf.addText(
        point3d(currentOrigin.x - 2.3027, currentOrigin.y + 2.7466),
        0.4,
        "Proj.",
        {
          layerName: textLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Left,
          secondAlignmentPoint: point3d(
            currentOrigin.x - 2.3027,
            currentOrigin.y + 2.7466
          ),
        }
      );
      projText.textStyle = arialTextStyle.name;

      // "X,XX" - centro
      const coordText = dxf.addText(
        point3d(currentOrigin.x, currentOrigin.y + 2.8966),
        0.4,
        "X,XX",
        {
          layerName: textLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Center,
          verticalAlignment: TextVerticalAlignment.Middle,
          secondAlignmentPoint: point3d(
            currentOrigin.x,
            currentOrigin.y + 2.8966
          ),
        }
      );
      coordText.textStyle = arialTextStyle.name;

      // "m" - alinhado à esquerda
      const mText = dxf.addText(
        point3d(currentOrigin.x + 1.651, currentOrigin.y + 2.7466),
        0.4,
        "m",
        {
          layerName: textLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Left,
          secondAlignmentPoint: point3d(
            currentOrigin.x + 1.651,
            currentOrigin.y + 2.7466
          ),
        }
      );
      mText.textStyle = arialTextStyle.name;

      // "Cota: " + valor da cota - centro
      const cotaText = dxf.addText(
        point3d(currentOrigin.x, currentOrigin.y + 3.4967),
        0.4,
        sondagem.z ? `Cota: ${sondagem.z.toFixed(2)}` : "Cota",
        {
          layerName: textLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Center,
          verticalAlignment: TextVerticalAlignment.Middle,
          secondAlignmentPoint: point3d(
            currentOrigin.x,
            currentOrigin.y + 3.4966
          ),
        }
      );
      cotaText.textStyle = arialTextStyle.name;

      // Hole ID
      const holeIdText = dxf.addText(
        point3d(currentOrigin.x, currentOrigin.y + 4.1966),
        0.6,
        sondagem.hole_id.toUpperCase(),
        {
          layerName: textLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Center,
          verticalAlignment: TextVerticalAlignment.Middle,
          secondAlignmentPoint: point3d(
            currentOrigin.x,
            currentOrigin.y + 4.1966
          ),
        }
      );
      holeIdText.textStyle = arialTextStyle.name;

      // Fazendo a escala vertical: alternar blocos
      // Desenhar blocos completos primeiro
      const completeBlocks = Math.floor(maxDepth);
      for (let i = 0; i < completeBlocks; i++) {
        const blockY = currentOrigin.y - i;
        const isOddMeter = (i + 1) % 2 === 1;
        const blockName = isOddMeter ? "scaleBlockHatch" : "scaleBlockOutline";

        dxf.addInsert(
          blockName,
          point3d(currentOrigin.x - 0.3016 / 2, blockY), // centraliza horizontalmente
          {
            layerName: perfilLayer.name,
            colorNumber: Colors.Green,
          }
        );
      }

      // Desenhar bloco parcial se necessário
      const remainingDepth = maxDepth - completeBlocks;
      if (remainingDepth > 0) {
        const partialBlockY = currentOrigin.y - completeBlocks;
        const adjustedHeight = remainingDepth;
        const isOddMeter = (completeBlocks + 1) % 2 === 1;

        const vertices = [
          { point: point2d(currentOrigin.x - 0.3016 / 2, partialBlockY) },
          { point: point2d(currentOrigin.x + 0.3016 / 2, partialBlockY) },
          {
            point: point2d(
              currentOrigin.x + 0.3016 / 2,
              partialBlockY - adjustedHeight
            ),
          },
          {
            point: point2d(
              currentOrigin.x - 0.3016 / 2,
              partialBlockY - adjustedHeight
            ),
          },
          { point: point2d(currentOrigin.x - 0.3016 / 2, partialBlockY) },
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
      const nsptStartY = currentOrigin.y - 0.7657; // primeira posição Y
      const nsptX = currentOrigin.x + 0.3183; // posição X fixa

      for (let d = 1; d <= sondagem.nspt.start_depth; d++) {
        const currentY = nsptStartY - (d - 1);
        const emptyNsptText = dxf.addText(point3d(nsptX, currentY), 0.4, "-", {
          layerName: nsptLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Left,
          verticalAlignment: TextVerticalAlignment.Middle,
          secondAlignmentPoint: point3d(nsptX, currentY),
        });
        emptyNsptText.textStyle = arialTextStyle.name;
      }

      sondagem.nspt.values.forEach((value, index) => {
        const currentY = nsptStartY - (index + sondagem.nspt.start_depth);
        const nsptText = dxf.addText(
          point3d(nsptX, currentY),
          0.4,
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
          ? currentOrigin.y - sondagem.water_level
          : currentOrigin.y - maxDepth;
      const waterLevelX = currentOrigin.x - 1.0516;

      dxf.addInsert(waterLevelBlock.name, point3d(waterLevelX, waterLevelY), {
        layerName: simbologiaLayer.name,
      });

      // Profundidade final
      const maxDepthText = dxf.addText(
        point3d(
          currentOrigin.x - 0.0169,
          currentOrigin.y - 1 * maxDepth - 0.3973
        ),
        0.36,
        `${maxDepth.toString().replace(".", ",")}m`,
        {
          layerName: textLayer.name,
          horizontalAlignment: TextHorizontalAlignment.Center,
          verticalAlignment: TextVerticalAlignment.Middle,
          secondAlignmentPoint: point3d(
            currentOrigin.x - 0.0169,
            currentOrigin.y - 1 * maxDepth - 0.3973
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
              point: point3d(currentOrigin.x - 1.9989, currentOrigin.y - depth),
            },
            {
              point: point3d(currentOrigin.x + 4.9575, currentOrigin.y - depth),
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
            currentOrigin.x + 1.067,
            currentOrigin.y - (depth + sondagem.depths[index + 1]) / 2
          );
          const geologyText = dxf.addText(
            geologyTextPoint,
            0.4818,
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
